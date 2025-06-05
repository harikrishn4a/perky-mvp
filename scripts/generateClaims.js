const { Web3 } = require('web3');

// Contract ABI (just the functions we need)
const contractABI = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_to",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "_campaignId",
        "type": "uint256"
      }
    ],
    "name": "mintProof",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "currentCampaignId",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

async function fundAccount(web3, fromAccount, toAddress, amount) {
  try {
    const tx = {
      from: fromAccount.address,
      to: toAddress,
      value: web3.utils.toWei(amount.toString(), 'ether'),
      gas: 21000,
      gasPrice: await web3.eth.getGasPrice()
    };

    const signedTx = await web3.eth.accounts.signTransaction(tx, fromAccount.privateKey);
    const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
    console.log(`✅ Funded ${toAddress} with ${amount} XRP (tx: ${receipt.transactionHash})`);
  } catch (error) {
    console.error(`❌ Failed to fund ${toAddress}:`, error.message);
  }
}

async function main() {
  try {
    // Connect to XRPL EVM sidechain devnet
    const web3 = new Web3('https://rpc-evm-sidechain.xrpl.org');
    
    // Your deployed contract address on XRPL EVM sidechain
    const contractAddress = '0x171499691FcF4d6DA32749f81a9293bb2726b478';
    
    // Create contract instance
    const contract = new web3.eth.Contract(contractABI, contractAddress);

    // Your funded account's private key (will prompt for this)
    const privateKey = process.env.FUNDED_ACCOUNT_KEY;
    if (!privateKey) {
      console.error('Please set the FUNDED_ACCOUNT_KEY environment variable with your funded account private key');
      process.exit(1);
    }
    const fundedAccount = web3.eth.accounts.privateKeyToAccount(privateKey);
    console.log('Using funded account:', fundedAccount.address);

    // Create test accounts
    const numAccounts = 25;
    const accounts = [];
    console.log('\nCreating and funding test accounts...');
    for (let i = 0; i < numAccounts; i++) {
      const account = web3.eth.accounts.create();
      accounts.push(account);
      console.log(`Created account ${i + 1}:`, account.address);
      // Fund each account with 0.1 XRP for gas
      await fundAccount(web3, fundedAccount, account.address, 0.1);
    }
    
    // Get total number of campaigns
    const currentCampaignId = await contract.methods.currentCampaignId().call();
    console.log(`\nTotal campaigns: ${currentCampaignId}`);

    // Distribution of claims (some campaigns more popular than others)
    const claimDistribution = [
      { probability: 0.2, range: [3, 5] },    // 20% of campaigns get 3-5 claims
      { probability: 0.4, range: [8, 12] },   // 40% of campaigns get 8-12 claims
      { probability: 0.3, range: [15, 20] },  // 30% of campaigns get 15-20 claims
      { probability: 0.1, range: [20, 25] }   // 10% of campaigns get 20-25 claims
    ];

    // Generate claims for each campaign
    for (let campaignId = 0; campaignId < currentCampaignId; campaignId++) {
      // Determine number of claims based on distribution
      const rand = Math.random();
      let numClaims;
      let cumProb = 0;
      
      for (const dist of claimDistribution) {
        cumProb += dist.probability;
        if (rand <= cumProb) {
          const [min, max] = dist.range;
          numClaims = Math.floor(Math.random() * (max - min + 1)) + min;
          break;
        }
      }
      
      console.log(`\nProcessing campaign ${campaignId} (Target claims: ${numClaims}):`);
      
      // Get random accounts for this campaign
      const selectedAccounts = accounts
        .sort(() => Math.random() - 0.5)
        .slice(0, Math.min(numClaims, accounts.length));
      
      // Claim with each selected account
      for (const account of selectedAccounts) {
        try {
          // Create the transaction
          const mintTx = contract.methods.mintProof(account.address, campaignId);
          const gas = await mintTx.estimateGas({ from: account.address });
          const gasPrice = await web3.eth.getGasPrice();
          
          const tx = {
            from: account.address,
            to: contractAddress,
            gas,
            gasPrice,
            data: mintTx.encodeABI(),
            nonce: await web3.eth.getTransactionCount(account.address)
          };

          // Sign and send the transaction
          const signedTx = await web3.eth.accounts.signTransaction(tx, account.privateKey);
          const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
          
          console.log(`✅ Account ${account.address} claimed campaign ${campaignId} (tx: ${receipt.transactionHash})`);
          
          // Add a small delay between transactions to prevent nonce issues
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          console.error(`❌ Failed to claim campaign ${campaignId} with account ${account.address}:`, error.message);
        }
      }
    }
  } catch (error) {
    console.error('Main error:', error);
  }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  }); 