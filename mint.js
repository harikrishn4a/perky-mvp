require('dotenv').config();
const { ethers } = require('ethers');

// Initialize provider
const provider = new ethers.JsonRpcProvider('https://rpc-evm-sidechain.xrpl.org');

// Contract details
const CONTRACT_ADDRESS = "0x171499691FcF4d6DA32749f81a9293bb2726b478";
const CONTRACT_ABI = [
  "function mintProof(address _to, uint256 _campaignId, bytes calldata _encryptedData) external",
  "function balanceOf(address account, uint256 id) external view returns (uint256)"
];

// Initialize business wallet
const businessWallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, businessWallet);

async function mintNFT(toAddress, campaignId = 7) {
  console.log(`\nMinting NFT:`);
  console.log(`To Address: ${toAddress}`);
  console.log(`Campaign ID: ${campaignId}`);

  try {
    // 1. Validate address
    if (!ethers.isAddress(toAddress)) {
      throw new Error('Invalid recipient address');
    }

    // 2. Check if already minted
    const balance = await contract.balanceOf(toAddress, campaignId);
    if (balance > 0) {
      console.log('✅ User already has this NFT');
      return {
        success: true,
        alreadyMinted: true
      };
    }

    // 3. Prepare the transaction data manually
    const iface = new ethers.Interface(CONTRACT_ABI);
    const encodedData = iface.encodeFunctionData("mintProof", [
      toAddress,
      campaignId,
      "0x" // Empty bytes - no encryption
    ]);

    console.log('\nEncoded transaction data:', encodedData);

    // 4. Send transaction with encoded data
    console.log('\nSending mint transaction...');
    const tx = await businessWallet.sendTransaction({
      to: CONTRACT_ADDRESS,
      data: encodedData,
      gasLimit: 200000,
      gasPrice: ethers.parseUnits("25", "gwei")
    });

    console.log(`Transaction hash: ${tx.hash}`);
    console.log('\nWaiting for confirmation...');
    
    const receipt = await tx.wait();
    console.log(`✅ Minted in block: ${receipt.blockNumber}`);

    return {
      success: true,
      txHash: tx.hash,
      blockNumber: receipt.blockNumber,
      encodedData
    };

  } catch (error) {
    console.error('\n❌ Mint failed:', error.message);
    if (error.data) {
      console.error('Error data:', error.data);
    }
    throw error;
  }
}

// Test function
async function test() {
  try {
    // Test address - replace with actual recipient
    const testAddress = "0xA9A3bC0d15DB98faE53c8e064F394653b79DcB54";
    
    console.log('🧪 Testing mint function...');
    const result = await mintNFT(testAddress, 7);
    console.log('\nResult:', result);

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
  }
}

// Export for module usage
module.exports = {
  mintNFT
};

// Run test if called directly
if (require.main === module) {
  test();
} 