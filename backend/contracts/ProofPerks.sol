// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

struct Campaign {
    bytes encryptedMetadata;     // Encrypted campaign details (title, category, reward, etc)
    uint256 minted;
    uint256 claimed;
    uint256 burned;
    uint256 views;
    mapping(address => bool) uniqueClaimers;
    mapping(address => uint256) claimTimestamp;
    mapping(address => uint256) burnTimestamp;
    mapping(address => bytes) encryptedOptInData;
    uint256 uniqueClaimerCount;
}

struct DataSharing {
    bool hasOptedIn;
    bool rewardPaid;
    bytes encryptedNFTMetadata;
}

contract ProofPerks is ERC1155, Ownable {
    uint256 public currentCampaignId = 0;
    address public perkyWallet;  // Perky's wallet for handling payments
    uint256 public constant USER_REWARD = 1 ether;  // 1 XRP
    uint256 public constant COMPANY_PAYMENT = 2 ether;  // 2 XRP
    
    mapping(uint256 => Campaign) public campaigns;
    mapping(address => mapping(address => DataSharing)) public userDataSharing; // user => company => DataSharing
    
    event ProofMinted(address indexed user, uint256 indexed campaignId, uint256 timestamp);
    event ProofBurned(address indexed user, uint256 indexed campaignId, uint256 timestamp);
    event CampaignCreated(uint256 indexed campaignId);
    event DataSharingOptIn(address indexed user, address indexed company);
    event RewardPaid(address indexed user, address indexed company);

    modifier onlyPerky() {
        require(msg.sender == perkyWallet, "Only Perky wallet can call this");
        _;
    }

    constructor(string memory uri, address _perkyWallet) ERC1155(uri) Ownable(msg.sender) {
        perkyWallet = _perkyWallet;
    }

    function createCampaign(bytes calldata _encryptedMetadata) public onlyOwner {
        require(_encryptedMetadata.length > 0, "Encrypted metadata required");

        Campaign storage newCampaign = campaigns[currentCampaignId];
        newCampaign.encryptedMetadata = _encryptedMetadata;
        newCampaign.minted = 0;
        newCampaign.claimed = 0;
        newCampaign.burned = 0;
        newCampaign.views = 0;
        newCampaign.uniqueClaimerCount = 0;
        
        emit CampaignCreated(currentCampaignId);
        currentCampaignId++;
    }

    function mintProof(address _to, uint256 _campaignId, bytes calldata _encryptedData) public {
        require(_campaignId < currentCampaignId, "Invalid campaign");
        Campaign storage campaign = campaigns[_campaignId];
        
        // Track unique claimers
        if (!campaign.uniqueClaimers[_to]) {
            campaign.uniqueClaimers[_to] = true;
            campaign.uniqueClaimerCount++;
        }
        
        // Store encrypted opt-in data
        campaign.encryptedOptInData[_to] = _encryptedData;
        
        // Track claim timestamp
        campaign.claimTimestamp[_to] = block.timestamp;
        
        campaign.minted++;
        campaign.claimed++;
        _mint(_to, _campaignId, 1, "");
        emit ProofMinted(_to, _campaignId, block.timestamp);
    }

    function burnProof(address _from, uint256 _campaignId) public onlyOwner {
        Campaign storage campaign = campaigns[_campaignId];
        campaign.burned++;
        campaign.burnTimestamp[_from] = block.timestamp;
        _burn(_from, _campaignId, 1);
        emit ProofBurned(_from, _campaignId, block.timestamp);
    }

    function trackView(uint256 _campaignId) public {
        require(_campaignId < currentCampaignId, "Invalid campaign ID");
        campaigns[_campaignId].views++;
    }

    function getCampaignMetrics(uint256 _campaignId, address _user) public view returns (
        uint256 claimTime,
        uint256 burnTime,
        bool hasRedeemed,
        bool isUniqueClaimer
    ) {
        Campaign storage campaign = campaigns[_campaignId];
        return (
            campaign.claimTimestamp[_user],
            campaign.burnTimestamp[_user],
            campaign.burnTimestamp[_user] > 0,
            campaign.uniqueClaimers[_user]
        );
    }

    function getCampaignStats(uint256 _campaignId) public view returns (
        uint256 uniqueClaimers,
        uint256 totalMinted,
        uint256 totalClaimed,
        uint256 totalBurned
    ) {
        require(_campaignId < currentCampaignId, "Invalid campaign ID");
        Campaign storage campaign = campaigns[_campaignId];
        return (
            campaign.uniqueClaimerCount,
            campaign.minted,
            campaign.claimed,
            campaign.burned
        );
    }

    function getCampaignById(uint256 _campaignId) public view returns (
        bytes memory encryptedMetadata,
        uint256 minted,
        uint256 claimed,
        uint256 burned,
        uint256 views
    ) {
        require(_campaignId < currentCampaignId, "Invalid campaign ID");
        Campaign storage c = campaigns[_campaignId];
        return (
            c.encryptedMetadata,
            c.minted,
            c.claimed,
            c.burned,
            c.views
        );
    }

    function storeEncryptedOptIn(uint256 _campaignId, bytes calldata _encryptedData) public {
        require(_campaignId < currentCampaignId, "Invalid campaign ID");
        Campaign storage campaign = campaigns[_campaignId];
        require(campaign.uniqueClaimers[msg.sender], "Must be a campaign claimer");
        campaign.encryptedOptInData[msg.sender] = _encryptedData;
    }

    function getEncryptedOptIn(uint256 _campaignId, address _user) public view onlyOwner returns (bytes memory) {
        require(_campaignId < currentCampaignId, "Invalid campaign ID");
        Campaign storage campaign = campaigns[_campaignId];
        require(campaign.uniqueClaimers[_user], "User has not claimed this campaign");
        return campaign.encryptedOptInData[_user];
    }

    // Function to update Perky wallet
    function setPerkyWallet(address _newWallet) external onlyOwner {
        require(_newWallet != address(0), "Invalid wallet address");
        perkyWallet = _newWallet;
    }

    // After claiming NFT, user can opt in to share data
    function optInToDataSharing(address _company, bytes calldata _encryptedNFTMetadata) external payable {
        require(msg.value >= COMPANY_PAYMENT, "Insufficient payment");
        require(!userDataSharing[msg.sender][_company].hasOptedIn, "Already opted in");
        
        // Store the encrypted NFT metadata
        userDataSharing[msg.sender][_company] = DataSharing({
            hasOptedIn: true,
            rewardPaid: false,
            encryptedNFTMetadata: _encryptedNFTMetadata
        });

        emit DataSharingOptIn(msg.sender, _company);
    }

    // Perky wallet pays reward to user
    function payUserReward(address _user, address _company) external payable onlyPerky {
        require(userDataSharing[_user][_company].hasOptedIn, "User has not opted in");
        require(!userDataSharing[_user][_company].rewardPaid, "Reward already paid");
        require(msg.value >= USER_REWARD, "Insufficient reward amount");

        userDataSharing[_user][_company].rewardPaid = true;
        payable(_user).transfer(USER_REWARD);
        emit RewardPaid(_user, _company);
    }

    // Get user's encrypted NFT metadata (only accessible by company if opted in)
    function getSharedData(address _user) external view returns (bytes memory) {
        require(userDataSharing[_user][msg.sender].hasOptedIn, "User has not shared data");
        require(userDataSharing[_user][msg.sender].rewardPaid, "Reward not yet paid");
        return userDataSharing[_user][msg.sender].encryptedNFTMetadata;
    }

    // Check if user has opted in to share data with a company
    function hasOptedIn(address _user, address _company) external view returns (bool) {
        return userDataSharing[_user][_company].hasOptedIn;
    }
}