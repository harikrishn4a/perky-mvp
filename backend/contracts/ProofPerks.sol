// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ProofPerks is ERC1155, Ownable {
    uint256 public currentCampaignId = 0;

    struct Campaign {
        string title;
        string category;
        string reward;
    }

    mapping(uint256 => Campaign) public campaigns;
    event ProofMinted(address indexed user, uint256 indexed campaignId);

    constructor(string memory uri) ERC1155(uri) Ownable(msg.sender) {}

    function createCampaign(string memory _title, string memory _category, string memory _reward) public onlyOwner {
        campaigns[currentCampaignId] = Campaign(_title, _category, _reward);
        currentCampaignId++;
    }

    function mintProof(address _to, uint256 _campaignId) public {
        require(_campaignId < currentCampaignId, "Invalid campaign");
        _mint(_to, _campaignId, 1, "");
        emit ProofMinted(_to, _campaignId);
    }

    function burnProof(address _from, uint256 _campaignId) public onlyOwner {
        _burn(_from, _campaignId, 1);
    }
}