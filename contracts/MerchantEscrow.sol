// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title MerchantEscrow
 * @dev Autonomous AI-Agent powered escrow for local physical commerce on HSK Testnet (Chain ID: 133).
 *      Designed for EAG Global Buildathon (AI x Ethereum, Local AI / Privacy, and HashKey Chain Track).
 *      Implements:
 *      1. Account Abstraction-friendly session key authorization.
 *      2. Local zero-knowledge privacy verification commitments.
 *      3. Delivery vs Payment (DvP) atomic settlement with Physical AI & IoT device handover telemetry.
 *      4. Institutional risk mitigation and emergency circuit breaker.
 */
contract MerchantEscrow {
    // --- Custom Errors ---
    error OrderAlreadyExists(bytes32 orderId);
    error OrderNotFound(bytes32 orderId);
    error OrderNotPending(bytes32 orderId);
    error InsufficientPayment(uint256 sent, uint256 required);
    error UnauthorizedCaller(address caller);
    error TransferFailed();
    error ZeroAddress();
    error Reentrancy();
    error ContractIsPaused();

    // --- Enums ---
    enum OrderStatus {
        None,
        Escrowed,
        PaymentReleased,
        Refunded
    }

    // --- Structs ---
    struct Order {
        bytes32 orderId;
        address buyer;
        address payable merchant;
        uint256 amount;
        uint256 createdAt;
        uint256 completedAt;
        OrderStatus status;
        bytes32 credentialCommitment; // Local privacy proof hash / commitment
        string metadataURI;           // e.g. "ipfs://..." or encrypted order details
        bytes32 physicalHandoverHash; // Physical AI Beacon / IoT telemetry proof for DvP
        uint256 rwaAssetId;           // Linked Real-World Asset ID (if applicable)
    }

    // --- State Variables ---
    address public owner;
    address public rwaRegistry;
    bool public isPaused = false;
    
    // Whitelisted autonomous AI Agent session keys authorized to verify credentials and release payments
    mapping(address => bool) public authorizedAgents;

    // Mapping from orderId (keccak256) to Order details
    mapping(bytes32 => Order) public orders;

    // Track order IDs for enumeration
    bytes32[] public allOrderIds;

    uint256 private _reentrancyStatus = 1;

    // --- Events ---
    event OrderCreated(
        bytes32 indexed orderId,
        address indexed buyer,
        address indexed merchant,
        uint256 amount,
        bytes32 credentialCommitment,
        uint256 timestamp
    );

    event PaymentReleased(
        bytes32 indexed orderId,
        address indexed merchant,
        uint256 amount,
        address indexed verifiedByAgent,
        uint256 timestamp
    );

    event PaymentReleasedDvP(
        bytes32 indexed orderId,
        address indexed merchant,
        uint256 amount,
        bytes32 physicalHandoverHash,
        uint256 rwaAssetId,
        address indexed verifiedByAgent,
        uint256 timestamp
    );

    event OrderRefunded(
        bytes32 indexed orderId,
        address indexed buyer,
        uint256 amount,
        string reason,
        uint256 timestamp
    );

    event AgentAuthorizationChanged(address indexed agent, bool authorized);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event CircuitBreakerToggled(bool isPaused, uint256 timestamp);
    event RwaRegistryUpdated(address indexed rwaRegistry, uint256 timestamp);
    event ExcessPaymentReturned(
        bytes32 indexed orderId,
        address indexed buyer,
        uint256 amount,
        uint256 timestamp
    );

    // --- Modifiers ---
    modifier onlyOwner() {
        if (msg.sender != owner) revert UnauthorizedCaller(msg.sender);
        _;
    }

    modifier onlyAuthorizedAgentOrOwner() {
        if (msg.sender != owner && !authorizedAgents[msg.sender]) {
            revert UnauthorizedCaller(msg.sender);
        }
        _;
    }

    modifier whenNotPaused() {
        if (isPaused) revert ContractIsPaused();
        _;
    }

    modifier nonReentrant() {
        if (_reentrancyStatus != 1) revert Reentrancy();
        _reentrancyStatus = 2;
        _;
        _reentrancyStatus = 1;
    }

    // --- Constructor ---
    constructor(address initialAgent) {
        owner = msg.sender;
        if (initialAgent != address(0)) {
            authorizedAgents[initialAgent] = true;
            emit AgentAuthorizationChanged(initialAgent, true);
        }
    }

    // --- External Functions ---

    /**
     * @notice Create a new escrowed order on HSK Testnet.
     */
    function createOrder(
        bytes32 orderId,
        address payable merchant,
        uint256 amount,
        bytes32 credentialCommitment,
        string calldata metadataURI
    ) external payable nonReentrant whenNotPaused {
        if (merchant == address(0)) revert ZeroAddress();
        if (orders[orderId].status != OrderStatus.None) revert OrderAlreadyExists(orderId);
        if (msg.value < amount) revert InsufficientPayment(msg.value, amount);

        uint256 excessPayment = msg.value > amount ? msg.value - amount : 0;

        orders[orderId] = Order({
            orderId: orderId,
            buyer: msg.sender,
            merchant: merchant,
            amount: amount,
            createdAt: block.timestamp,
            completedAt: 0,
            status: OrderStatus.Escrowed,
            credentialCommitment: credentialCommitment,
            metadataURI: metadataURI,
            physicalHandoverHash: bytes32(0),
            rwaAssetId: 0
        });

        allOrderIds.push(orderId);

        if (excessPayment > 0) {
            (bool success, ) = payable(msg.sender).call{value: excessPayment}("");
            if (!success) revert TransferFailed();
            emit ExcessPaymentReturned(orderId, msg.sender, excessPayment, block.timestamp);
        }

        emit OrderCreated(
            orderId,
            msg.sender,
            merchant,
            amount,
            credentialCommitment,
            block.timestamp
        );
    }

    /**
     * @notice Standard release: Releases payment to merchant once AI Agent validates physical order fulfillment.
     */
    function releasePayment(bytes32 orderId) external nonReentrant whenNotPaused onlyAuthorizedAgentOrOwner {
        Order storage order = orders[orderId];
        if (order.status == OrderStatus.None) revert OrderNotFound(orderId);
        if (order.status != OrderStatus.Escrowed) revert OrderNotPending(orderId);

        order.status = OrderStatus.PaymentReleased;
        order.completedAt = block.timestamp;

        uint256 payout = order.amount;
        (bool success, ) = order.merchant.call{value: payout}("");
        if (!success) revert TransferFailed();

        emit PaymentReleased(
            orderId,
            order.merchant,
            payout,
            msg.sender,
            block.timestamp
        );
    }

    /**
     * @notice Delivery vs Payment (DvP): Releases payment and records verified physical device telemetry & RWA linkage.
     */
    function releasePaymentDvP(
        bytes32 orderId,
        bytes32 physicalHandoverHash,
        uint256 rwaAssetId
    ) external nonReentrant whenNotPaused onlyAuthorizedAgentOrOwner {
        Order storage order = orders[orderId];
        if (order.status == OrderStatus.None) revert OrderNotFound(orderId);
        if (order.status != OrderStatus.Escrowed) revert OrderNotPending(orderId);

        order.status = OrderStatus.PaymentReleased;
        order.completedAt = block.timestamp;
        order.physicalHandoverHash = physicalHandoverHash;
        order.rwaAssetId = rwaAssetId;

        uint256 payout = order.amount;
        (bool success, ) = order.merchant.call{value: payout}("");
        if (!success) revert TransferFailed();

        emit PaymentReleasedDvP(
            orderId,
            order.merchant,
            payout,
            physicalHandoverHash,
            rwaAssetId,
            msg.sender,
            block.timestamp
        );
    }

    /**
     * @notice Refunds an unfulfilled order back to the buyer.
     */
    function refundOrder(bytes32 orderId, string calldata reason) external nonReentrant {
        Order storage order = orders[orderId];
        if (order.status == OrderStatus.None) revert OrderNotFound(orderId);
        if (order.status != OrderStatus.Escrowed) revert OrderNotPending(orderId);

        bool isAgentOrOwner = (msg.sender == owner || authorizedAgents[msg.sender]);
        bool isBuyerTimeout = (msg.sender == order.buyer && block.timestamp > order.createdAt + 1 hours);

        if (!isAgentOrOwner && !isBuyerTimeout) {
            revert UnauthorizedCaller(msg.sender);
        }

        order.status = OrderStatus.Refunded;
        order.completedAt = block.timestamp;

        uint256 refundAmount = order.amount;
        (bool success, ) = payable(order.buyer).call{value: refundAmount}("");
        if (!success) revert TransferFailed();

        emit OrderRefunded(
            orderId,
            order.buyer,
            refundAmount,
            reason,
            block.timestamp
        );
    }

    /**
     * @notice Institutional Risk Mitigation: Circuit Breaker toggle.
     */
    function setCircuitBreaker(bool _paused) external onlyOwner {
        isPaused = _paused;
        emit CircuitBreakerToggled(_paused, block.timestamp);
    }

    function setRwaRegistry(address _rwa) external onlyOwner {
        if (_rwa == address(0)) revert ZeroAddress();
        rwaRegistry = _rwa;
        emit RwaRegistryUpdated(_rwa, block.timestamp);
    }

    function setAuthorizedAgent(address agent, bool authorized) external onlyOwner {
        if (agent == address(0)) revert ZeroAddress();
        authorizedAgents[agent] = authorized;
        emit AgentAuthorizationChanged(agent, authorized);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert ZeroAddress();
        address oldOwner = owner;
        owner = newOwner;
        emit OwnershipTransferred(oldOwner, newOwner);
    }

    // --- View Helpers ---
    function getOrder(bytes32 orderId) external view returns (Order memory) {
        return orders[orderId];
    }

    function totalOrders() external view returns (uint256) {
        return allOrderIds.length;
    }

    receive() external payable {}
}
