# ProofPerks: Privacy-First Web3 Marketing Analytics

ProofPerks is a decentralized marketing analytics platform built on XRPL EVM that enables businesses to create and manage marketing campaigns while respecting user privacy through NFT-based engagement tracking.

## 🌟 Features

- **Privacy-First Analytics**: Users control their data sharing through opt-in mechanisms
- **NFT-Based Campaigns**: Businesses create ERC-1155 NFTs for marketing campaigns
- **Encrypted Metadata**: Campaign data is encrypted using Lit Protocol
- **Decentralized Storage**: IPFS integration for metadata storage
- **XRP Rewards**: Users earn XRP for opting into data sharing
- **Two-Layer Analytics**: Basic on-chain metrics + opt-in detailed insights

## 🏗️ Architecture

### Smart Contracts
- `ProofPerks.sol`: Main contract for campaign management and NFT operations
  - Campaign creation and management
  - NFT minting and burning
  - Analytics tracking
  - User opt-in management

### Frontend
- React-based dashboard for both users and businesses
- MetaMask integration for wallet connection
- IPFS integration for decentralized storage
- Lit Protocol for metadata encryption/decryption

## 🚀 Getting Started

### Prerequisites
- Node.js v16+
- MetaMask wallet
- XRPL EVM Sidechain connection

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/proofperks-mvp.git
cd proofperks-mvp
```

2. Install dependencies:
```bash
# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies
cd ../backend
npm install
```

3. Set up environment variables:
```bash
# Frontend (.env)
REACT_APP_CONTRACT_ADDRESS=your_contract_address
REACT_APP_IPFS_GATEWAY=your_ipfs_gateway
REACT_APP_LIT_PROTOCOL_KEY=your_lit_protocol_key

# Backend (.env)
PRIVATE_KEY=your_deployer_private_key
XRPL_EVM_RPC_URL=https://rpc-evm-sidechain.xrpl.org
```

4. Deploy the smart contract:
```bash
cd backend
npx hardhat run scripts/deploy.js --network xrpl_evm
```

5. Start the development server:
```bash
cd frontend
npm start
```

## 🔒 Security

- All user data is encrypted by default
- Metadata decryption requires explicit user consent
- Smart contract audited for security vulnerabilities
- No storage of sensitive user information on-chain

## 📊 Analytics Layers

### Layer 1 (Public)
- Number of NFTs minted
- Number of NFTs burned
- Campaign conversion rates
- Total unique users

### Layer 2 (Opt-In Only)
- User NFT collection patterns
- Engagement timestamps
- Cross-campaign analytics
- Geographic distribution

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details. 