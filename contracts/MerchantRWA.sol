// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title MerchantRWA
 * @dev Real-World Asset (RWA) tokenization contract for physical local commerce and merchants.
 *      Enables physical merchants to tokenize inventory batches, specialty coffee micro-lots,
 *      and pre-paid commercial receivables on HashKey Chain (HSK).
 *      Designed for EAG Global Buildathon (HashKey Institutional RWA Track & DvP Settlement).
 */
contract MerchantRWA {
    error Unauthorized();
    error AssetNotFound(uint256 assetId);
    error AssetAlreadyRedeemed(uint256 assetId);
    error AssetLockedInDvP(uint256 assetId);
    error ZeroAddress();

    enum AssetType {
        SpecialtyCoffeeMicroLot,   // e.g., Colombian Geisha / Bourbon micro-lots
        ArtisanInventoryBatch,     // e.g., 48-hour fermented sourdough dough batches
        CommercialReceivable,      // e.g., Future merchant invoice / prepay ticket
        RestaurantPhysicalTablePass // e.g., VIP table allocation
    }

    enum AssetStatus {
        Active,
        LockedInDvP,
        SettledAndDelivered,
        Redeemed
    }

    struct PhysicalAsset {
        uint256 assetId;
        string name;
        AssetType assetType;
        address originMerchant;
        address currentHolder;
        uint256 valuationHSK;
        uint256 batchQuantity;
        string originLocation;     // e.g., "Medellín, Colombia" or "ShanHai District"
        bytes32 physicalBatchHash; // Hash of physical seal, IoT RFID tag, or sensor batch
        AssetStatus status;
        uint256 mintedAt;
        uint256 deliveredAt;
    }

    string public name = "PayAgent Real World Asset Registry";
    string public symbol = "RWA-HSK";
    address public owner;
    address public authorizedEscrow;

    uint256 private _nextAssetId = 1;
    mapping(uint256 => PhysicalAsset) public assets;
    mapping(address => uint256[]) public merchantAssets;

    event AssetMinted(
        uint256 indexed assetId,
        string name,
        AssetType assetType,
        address indexed merchant,
        uint256 valuationHSK,
        bytes32 physicalBatchHash,
        uint256 timestamp
    );

    event AssetLocked(uint256 indexed assetId, address indexed escrowContract, uint256 timestamp);
    event AssetSettledDvP(uint256 indexed assetId, address indexed newOwner, uint256 timestamp);
    event AssetRedeemed(uint256 indexed assetId, address indexed redeemer, uint256 timestamp);

    modifier onlyOwner() {
        if (msg.sender != owner) revert Unauthorized();
        _;
    }

    modifier onlyAuthorizedEscrowOrOwner() {
        if (msg.sender != owner && msg.sender != authorizedEscrow) revert Unauthorized();
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function setAuthorizedEscrow(address escrow) external onlyOwner {
        if (escrow == address(0)) revert ZeroAddress();
        authorizedEscrow = escrow;
    }

    /**
     * @notice Mint a verified physical merchant inventory batch as an on-chain RWA
     */
    function mintAsset(
        string calldata assetName,
        AssetType assetType,
        address merchant,
        uint256 valuationHSK,
        uint256 batchQuantity,
        string calldata originLocation,
        bytes32 physicalBatchHash
    ) external returns (uint256) {
        if (merchant == address(0)) revert ZeroAddress();

        uint256 assetId = _nextAssetId++;
        assets[assetId] = PhysicalAsset({
            assetId: assetId,
            name: assetName,
            assetType: assetType,
            originMerchant: merchant,
            currentHolder: merchant,
            valuationHSK: valuationHSK,
            batchQuantity: batchQuantity,
            originLocation: originLocation,
            physicalBatchHash: physicalBatchHash,
            status: AssetStatus.Active,
            mintedAt: block.timestamp,
            deliveredAt: 0
        });

        merchantAssets[merchant].push(assetId);

        emit AssetMinted(
            assetId,
            assetName,
            assetType,
            merchant,
            valuationHSK,
            physicalBatchHash,
            block.timestamp
        );

        return assetId;
    }

    /**
     * @notice Lock asset in escrow for simultaneous Delivery versus Payment (DvP)
     */
    function lockForDvP(uint256 assetId) external onlyAuthorizedEscrowOrOwner {
        PhysicalAsset storage asset = assets[assetId];
        if (asset.assetId == 0) revert AssetNotFound(assetId);
        if (asset.status != AssetStatus.Active) revert AssetLockedInDvP(assetId);

        asset.status = AssetStatus.LockedInDvP;
        emit AssetLocked(assetId, msg.sender, block.timestamp);
    }

    /**
     * @notice Transfer ownership of RWA token upon verified physical delivery and payment release (DvP)
     */
    function executeDvPHandover(uint256 assetId, address buyer) external onlyAuthorizedEscrowOrOwner {
        PhysicalAsset storage asset = assets[assetId];
        if (asset.assetId == 0) revert AssetNotFound(assetId);
        if (buyer == address(0)) revert ZeroAddress();

        asset.currentHolder = buyer;
        asset.status = AssetStatus.SettledAndDelivered;
        asset.deliveredAt = block.timestamp;

        emit AssetSettledDvP(assetId, buyer, block.timestamp);
    }

    function getAsset(uint256 assetId) external view returns (PhysicalAsset memory) {
        return assets[assetId];
    }

    function totalAssets() external view returns (uint256) {
        return _nextAssetId - 1;
    }
}

