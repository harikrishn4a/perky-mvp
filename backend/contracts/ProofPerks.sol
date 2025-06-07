// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ProofPerks is ERC1155, Ownable {
    struct Campaign {
        string title;
        string category;
        string reward;
        string location;
        uint256 expiryTimestamp;
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

    uint256 public currentCampaignId = 0;
    mapping(uint256 => Campaign) public campaigns;
    
    event ProofMinted(address indexed user, uint256 indexed campaignId, uint256 timestamp);
    event ProofBurned(address indexed user, uint256 indexed campaignId, uint256 timestamp);
    event CampaignCreated(uint256 indexed campaignId, string title);

    constructor(string memory uri) ERC1155(uri) Ownable(msg.sender) {}

    function createCampaign(
        string memory _title,
        string memory _category,
        string memory _reward,
        string memory _location,
        uint256 _expiryTimestamp,
        string[] memory _tags
    ) public onlyOwner {
        Campaign storage newCampaign = campaigns[currentCampaignId];
        
        newCampaign.title = _title;
        newCampaign.category = _category;
        newCampaign.reward = _reward;
        newCampaign.location = _location;
        newCampaign.expiryTimestamp = _expiryTimestamp;
        newCampaign.tags = _tags;
        newCampaign.minted = 0;
        newCampaign.claimed = 0;
        newCampaign.burned = 0;
        newCampaign.views = 0;
        newCampaign.uniqueClaimerCount = 0;
        
        emit CampaignCreated(currentCampaignId, _title);
        currentCampaignId++;
    }

    function mintProof(address _to, uint256 _campaignId) public {
        require(_campaignId < currentCampaignId, "Invalid campaign");
        require(block.timestamp <= campaigns[_campaignId].expiryTimestamp, "Campaign expired");
        
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
        require(balanceOf(_from, _campaignId) > 0, "No proof to burn");
        
        campaign.burned++;
        campaign.burnTimestamp[_from] = block.timestamp;
        _burn(_from, _campaignId, 1);
        emit ProofBurned(_from, _campaignId, block.timestamp);
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
        string memory title,
        string memory category,
        string memory reward,
        string memory location,
        uint256 expiryTimestamp,
        string[] memory tags,
        uint256 minted,
        uint256 claimed,
        uint256 burned,
        uint256 views
    ) {
        require(_campaignId < currentCampaignId, "Invalid campaign ID");
        Campaign storage c = campaigns[_campaignId];
        return (
            c.title,
            c.category,
            c.reward,
            c.location,
            c.expiryTimestamp,
            c.tags,
            c.minted,
            c.claimed,
            c.burned,
            c.views
        );
    }

    function trackView(uint256 _campaignId) public {
        require(_campaignId < currentCampaignId, "Invalid campaign ID");
        campaigns[_campaignId].views++;
    }
}