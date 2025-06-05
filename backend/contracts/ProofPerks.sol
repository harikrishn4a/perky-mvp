// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

struct Campaign {
    string title;
    string category;
    string reward;
    string imageUrl;
    string location;
    string expiryDate;
    string[] tags;
    uint256 minted;
    uint256 claimed;
    uint256 burned;
    uint256 views;
    mapping(address => bool) uniqueClaimers;
    mapping(address => uint256) claimTimestamp;
    mapping(address => uint256) burnTimestamp;
    uint256 uniqueClaimerCount;
}

contract ProofPerks is ERC1155, Ownable {
    uint256 public currentCampaignId = 0;
    
    mapping(uint256 => Campaign) public campaigns;
    event ProofMinted(address indexed user, uint256 indexed campaignId, uint256 timestamp);
    event ProofBurned(address indexed user, uint256 indexed campaignId, uint256 timestamp);

    constructor(string memory uri) ERC1155(uri) Ownable(msg.sender) {}

    function createCampaign(
        string memory _title,
        string memory _category,
        string memory _reward,
        string memory _imageUrl,
        string memory _location,
        string memory _expiryDate,
        string[] memory _tags
    ) public onlyOwner {
        require(bytes(_title).length > 0, "Title is required");
        require(bytes(_category).length > 0, "Category is required");
        require(bytes(_reward).length > 0, "Reward is required");
        require(bytes(_imageUrl).length > 0, "Image URL is required");
        require(bytes(_location).length > 0, "Location is required");
        require(bytes(_expiryDate).length > 0, "Expiry date is required");
        require(_tags.length > 0, "At least one tag is required");

        Campaign storage newCampaign = campaigns[currentCampaignId];
        newCampaign.title = _title;
        newCampaign.category = _category;
        newCampaign.reward = _reward;
        newCampaign.imageUrl = _imageUrl;
        newCampaign.location = _location;
        newCampaign.expiryDate = _expiryDate;
        newCampaign.tags = _tags;
        newCampaign.minted = 0;
        newCampaign.claimed = 0;
        newCampaign.burned = 0;
        newCampaign.views = 0;
        newCampaign.uniqueClaimerCount = 0;
        
        currentCampaignId++;
    }

    function mintProof(address _to, uint256 _campaignId) public {
        require(_campaignId < currentCampaignId, "Invalid campaign");
        Campaign storage campaign = campaigns[_campaignId];
        
        // Track unique claimers
        if (!campaign.uniqueClaimers[_to]) {
            campaign.uniqueClaimers[_to] = true;
            campaign.uniqueClaimerCount++;
        }
        
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
        string memory, string memory, string memory, string memory,
        string memory, string memory, string[] memory,
        uint256, uint256, uint256, uint256
    ) {
        require(_campaignId < currentCampaignId, "Invalid campaign ID");
        Campaign storage c = campaigns[_campaignId];
        return (
            c.title,
            c.category,
            c.reward,
            c.imageUrl,
            c.location,
            c.expiryDate,
            c.tags,
            c.minted,
            c.claimed,
            c.burned,
            c.views
        );
    }
}