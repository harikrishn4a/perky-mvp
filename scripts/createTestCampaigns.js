const { ethers } = require('ethers');
const ProofPerksABI = require('../frontend/src/utils/ProofPerks.json');

// Test campaign data
const testCampaigns = [
  {
    title: "Coffee Shop Rewards",
    category: "Food & Beverage",
    reward: "Free Coffee",
    imageUrl: "https://example.com/coffee.jpg",
    location: "Downtown",
    expiryDate: "2024-12-31",
    tags: ["coffee", "drinks", "food"]
  },
  {
    title: "Gym Membership Discount",
    category: "Fitness",
    reward: "50% Off Monthly Membership",
    imageUrl: "https://example.com/gym.jpg",
    location: "Citywide",
    expiryDate: "2024-12-31",
    tags: ["fitness", "health", "gym"]
  },
  {
    title: "Book Store Points",
    category: "Retail",
    reward: "500 Loyalty Points",
    imageUrl: "https://example.com/books.jpg",
    location: "Mall",
    expiryDate: "2024-12-31",
    tags: ["books", "reading", "retail"]
  },
  {
    title: "Movie Theater Discount",
    category: "Entertainment",
    reward: "Buy 1 Get 1 Free",
    imageUrl: "https://example.com/movies.jpg",
    location: "Cinema Complex",
    expiryDate: "2024-12-31",
    tags: ["movies", "entertainment", "discount"]
  },
  {
    title: "Restaurant Week Special",
    category: "Dining",
    reward: "25% Off Total Bill",
    imageUrl: "https://example.com/restaurant.jpg",
    location: "City Center",
    expiryDate: "2024-12-31",
    tags: ["food", "dining", "discount"]
  }
];

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  try {
    // Connect to the network
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    console.log('Connected with address:', await signer.getAddress());

    // Create contract instance
    const contract = new ethers.Contract(
      process.env.REACT_APP_CONTRACT_ADDRESS,
      ProofPerksABI.abi,
      signer
    );

    // Create each test campaign
    for (const campaign of testCampaigns) {
      try {
        console.log(`\nCreating campaign: ${campaign.title}`);
        const tx = await contract.createCampaign(
          campaign.title,
          campaign.category,
          campaign.reward,
          campaign.imageUrl,
          campaign.location,
          campaign.expiryDate,
          campaign.tags
        );
        await tx.wait();
        console.log('✅ Campaign created successfully');
        
        // Add delay between transactions
        await sleep(1000);
      } catch (error) {
        console.error('❌ Failed to create campaign:', error.message);
      }
    }

    console.log('\nAll test campaigns created!');
    
  } catch (error) {
    console.error('Script failed:', error);
  }
}

main(); 