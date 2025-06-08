# Perky: Encrypted NFT Loyalty Engine on XRPL EVM  
Perky leverages a multi-contract modular system to mint encrypted loyalty NFTs on the XRPL EVM Sidechain. Users can collect interest-based NFTs and choose to decrypt them in exchange for XRP rewards.

Each component is optimized for consent-based marketing, wallet-native personalization, and flexible data sharing — without using third-party cookies.
🎥 [Watch the demo video](media/demo.mp4)
<p float="left">
  <img src="media/Screenshot 1.png" width="32%" />
  <img src="media/Screenshot 2.png" width="32%" />
  <img src="media/Screenshot 3.png" width="32%" />
  <img src="media/Screenshot 4.png" width="32%" />
  <img src="media/Screenshot 5.png" width="32%" />
</p>
---

## 🛠 Contract 1: CampaignNFT.sol  
**Purpose:**  
Mints ERC-1155 NFTs representing user interactions with a campaign, with encrypted metadata stored on IPFS.

**Key Functions:**  
`mint(address to, uint256 id, string memory uri)`:  
Mints a new NFT to the user with the provided encrypted metadata URI.

`setMinter(address newMinter)`:  
Assigns minting rights to the Router contract post-deployment.

**Security:**  
- Metadata is encrypted off-chain using Lit Protocol and hosted on IPFS.
- Minting is only authorized through the Router contract.

**Scalability:**  
- Campaign metadata is dynamic and extensible.
- No need for redeployment when launching new campaigns.

---

## 🛠 Contract 2: CampaignRouter.sol  
**Purpose:**  
Handles mint logic, campaign creation, and opt-in decryption workflows.

**Key Functions:**  
`createCampaign(...)`:  
Defines metadata, reward parameters, and campaign type.

`mintAndEncrypt(...)`:  
Mints an NFT and binds it to encrypted user-specific metadata.

`optInAndDecrypt(uint256 tokenId)`:  
Verifies user consent and decrypts NFT metadata.

**Security:**  
- Decryption only occurs when the user opts in.
- On-chain checks ensure rewards are not duplicated.

---

## 🔒 Key Security Features  
**Encrypted Metadata:**  
User data is never publicly visible or accessible without opt-in.

**Consent-Driven Access:**  
NFT metadata can only be decrypted through explicit user approval.

**One-Time Rewards:**  
Each wallet is rewarded only once per campaign via on-chain verification.

**Upgradeable Flow:**  
Admin roles can update metadata handlers or contract logic without full redeployments.

---

## 🔗 System Interaction Flow  
1. User mints a campaign NFT after scanning a QR or visiting a venue.  
2. NFT metadata is encrypted and stored on IPFS.  
3. User views their encrypted NFT in wallet.  
4. Upon opting in, metadata is decrypted.  
5. If opt-in is valid, XRP reward is automatically distributed.  
6. Businesses receive insights about the opted-in user interest tags.  

---

## ✅ Final Summary  
Perky is a fully on-chain loyalty and targeting engine built on XRPL EVM. It ensures that user data stays private until willingly shared, while still enabling businesses to personalize outreach and reward loyalty — all without cookies.

---

Blocklink : https://evm-sidechain.xrpl.org/ (placeholder)  
Website has been published at : https://perkyapp.xyz (placeholder)  
Presentation slides : https://www.canva.com/design/DAGpqqppJB8/GD6iaFfLDvULKUcZwKaHxw/view?utm_content=DAGpqqppJB8&utm_campaign=designshare&utm_medium=link2&utm_source=uniquelinks&utlId=h6e2c7072ca  
Twitter thread : https://x.com/kwp32236447/status/1931549188644651364
