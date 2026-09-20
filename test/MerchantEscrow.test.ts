/// <reference types="mocha" />
import { expect } from "chai";
import hre from "hardhat";
const { ethers } = hre;
import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers";
import { keccak256, stringToBytes } from "viem";
import type { ContractTransactionReceipt, Log } from "ethers";

type MerchantEscrow = any;

describe("MerchantEscrow", function () {
  const amount = ethers.parseEther("0.05");
  const excess = ethers.parseEther("0.001");
  const orderId = keccak256(stringToBytes("order-001")) as `0x${string}`;
  const credentialCommitment = keccak256(
    stringToBytes("credential-commitment-001")
  ) as `0x${string}`;

  async function deployEscrowFixture() {
    const [owner, sessionKey, buyer, merchant, unauthorized] =
      await ethers.getSigners();

    const Escrow = await ethers.getContractFactory("MerchantEscrow");
    const escrow = (await Escrow.deploy(sessionKey.address)) as MerchantEscrow;
    await escrow.waitForDeployment();

    return {
      escrow,
      owner,
      sessionKey,
      buyer,
      merchant,
      unauthorized,
    };
  }

  async function createOrder({
    escrow,
    buyer,
    merchant,
    value = amount,
  }: {
    escrow: MerchantEscrow;
    buyer: any;
    merchant: any;
    value?: bigint;
  }) {
    return escrow.connect(buyer).createOrder(
      orderId,
      merchant.address,
      amount,
      credentialCommitment,
      "ipfs://order-001",
      { value }
    );
  }

  function findEvent(
    receipt: ContractTransactionReceipt,
    escrow: MerchantEscrow,
    eventName: string
  ) {
    for (const log of receipt.logs) {
      try {
        const parsed = escrow.interface.parseLog(log as Log);
        if (parsed?.name === eventName) return parsed;
      } catch {
        // Ignore logs emitted by other contracts.
      }
    }
    throw new Error(`Event ${eventName} not found`);
  }

  it("creates an order with the exact deposit and emits OrderCreated", async function () {
    const { escrow, buyer, merchant } = await loadFixture(deployEscrowFixture);

    const tx = await createOrder({ escrow, buyer, merchant });
    const receipt = await tx.wait();
    expect(receipt).to.not.be.undefined;

    const event = findEvent(receipt!, escrow, "OrderCreated");
    expect(event.args.orderId).to.equal(orderId);
    expect(event.args.buyer).to.equal(buyer.address);
    expect(event.args.merchant).to.equal(merchant.address);
    expect(event.args.amount).to.equal(amount);
    expect(event.args.credentialCommitment).to.equal(credentialCommitment);
    expect(event.args.timestamp).to.be.greaterThan(0n);

    const order = await escrow.getOrder(orderId);
    expect(order.buyer).to.equal(buyer.address);
    expect(order.merchant).to.equal(merchant.address);
    expect(order.amount).to.equal(amount);
    expect(order.status).to.equal(1n);
    expect(await ethers.provider.getBalance(escrow.target)).to.equal(amount);
    expect(await escrow.totalOrders()).to.equal(1n);
  });

  it("releases payment when called by an authorized session key", async function () {
    const { escrow, sessionKey, buyer, merchant } = await loadFixture(
      deployEscrowFixture
    );
    await (await createOrder({ escrow, buyer, merchant })).wait();

    const merchantBefore = await ethers.provider.getBalance(merchant.address);
    const tx = await escrow.connect(sessionKey).releasePayment(orderId);
    const receipt = await tx.wait();
    expect(receipt).to.not.be.undefined;

    const event = findEvent(receipt!, escrow, "PaymentReleased");
    expect(event.args.orderId).to.equal(orderId);
    expect(event.args.merchant).to.equal(merchant.address);
    expect(event.args.amount).to.equal(amount);
    expect(event.args.verifiedByAgent).to.equal(sessionKey.address);

    const order = await escrow.getOrder(orderId);
    expect(order.status).to.equal(2n);
    expect(order.completedAt).to.be.greaterThan(0n);
    expect(await ethers.provider.getBalance(escrow.target)).to.equal(0n);
    expect(await ethers.provider.getBalance(merchant.address)).to.equal(
      merchantBefore + amount
    );
  });

  it("reverts releasePayment when the caller is not authorized", async function () {
    const { escrow, buyer, merchant, unauthorized } = await loadFixture(
      deployEscrowFixture
    );
    await (await createOrder({ escrow, buyer, merchant })).wait();

    await expect(
      escrow.connect(unauthorized).releasePayment(orderId)
    ).to.be.revertedWithCustomError(escrow, "UnauthorizedCaller").withArgs(
      unauthorized.address
    );

    expect((await escrow.getOrder(orderId)).status).to.equal(1n);
    expect(await ethers.provider.getBalance(escrow.target)).to.equal(amount);
  });

  it("refunds the buyer after the one-hour timelock expires", async function () {
    const { escrow, buyer, merchant } = await loadFixture(deployEscrowFixture);
    await (await createOrder({ escrow, buyer, merchant })).wait();
    await time.increase(60 * 60 + 1);

    const tx = await escrow
      .connect(buyer)
      .refundOrder(orderId, "buyer timeout");
    const receipt = await tx.wait();
    expect(receipt).to.not.be.undefined;

    const event = findEvent(receipt!, escrow, "OrderRefunded");
    expect(event.args.orderId).to.equal(orderId);
    expect(event.args.buyer).to.equal(buyer.address);
    expect(event.args.amount).to.equal(amount);
    expect(event.args.reason).to.equal("buyer timeout");

    const order = await escrow.getOrder(orderId);
    expect(order.status).to.equal(3n);
    expect(order.completedAt).to.be.greaterThan(0n);
    expect(await ethers.provider.getBalance(escrow.target)).to.equal(0n);
  });

  it("allows an authorized agent to cancel an unfulfilled order", async function () {
    const { escrow, sessionKey, buyer, merchant } = await loadFixture(
      deployEscrowFixture
    );
    await (await createOrder({ escrow, buyer, merchant })).wait();

    const tx = await escrow
      .connect(sessionKey)
      .refundOrder(orderId, "merchant cancellation");
    const receipt = await tx.wait();
    expect(receipt).to.not.be.undefined;

    const event = findEvent(receipt!, escrow, "OrderRefunded");
    expect(event.args.orderId).to.equal(orderId);
    expect(event.args.buyer).to.equal(buyer.address);
    expect(event.args.amount).to.equal(amount);
    expect(event.args.reason).to.equal("merchant cancellation");
    expect(event.args.timestamp).to.be.greaterThan(0n);

    expect((await escrow.getOrder(orderId)).status).to.equal(3n);
    expect(await ethers.provider.getBalance(escrow.target)).to.equal(0n);
  });

  it("returns msg.value surplus and leaves only the escrow amount locked", async function () {
    const { escrow, buyer, merchant, sessionKey } = await loadFixture(
      deployEscrowFixture
    );

    const buyerBefore = await ethers.provider.getBalance(buyer.address);
    const tx = await createOrder({
      escrow,
      buyer,
      merchant,
      value: amount + excess,
    });
    const receipt = await tx.wait();
    expect(receipt).to.not.be.undefined;

    const event = findEvent(receipt!, escrow, "ExcessPaymentReturned");
    expect(event.args.orderId).to.equal(orderId);
    expect(event.args.buyer).to.equal(buyer.address);
    expect(event.args.amount).to.equal(excess);

    expect(await ethers.provider.getBalance(escrow.target)).to.equal(amount);
    expect((await escrow.getOrder(orderId)).amount).to.equal(amount);

    const merchantBefore = await ethers.provider.getBalance(merchant.address);
    await (await escrow.connect(sessionKey).releasePayment(orderId)).wait();
    expect(await ethers.provider.getBalance(escrow.target)).to.equal(0n);
    expect(await ethers.provider.getBalance(merchant.address)).to.equal(
      merchantBefore + amount
    );

    expect(await ethers.provider.getBalance(buyer.address)).to.be.lessThan(
      buyerBefore
    );
  });

  it("rejects duplicate order ids and underfunded orders", async function () {
    const { escrow, buyer, merchant } = await loadFixture(deployEscrowFixture);

    await (await createOrder({ escrow, buyer, merchant })).wait();
    await expect(
      createOrder({ escrow, buyer, merchant })
    ).to.be.revertedWithCustomError(escrow, "OrderAlreadyExists").withArgs(
      orderId
    );

    await expect(
      escrow
        .connect(buyer)
        .createOrder(
          keccak256(stringToBytes("order-002")) as `0x${string}`,
          merchant.address,
          amount,
          credentialCommitment,
          "ipfs://order-002",
          { value: amount - 1n }
        )
    )
      .to.be.revertedWithCustomError(escrow, "InsufficientPayment")
      .withArgs(amount - 1n, amount);
  });
});
