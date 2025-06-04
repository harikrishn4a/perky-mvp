const { ethers } = require("hardhat");

async function main() {
  const ProofPerks = await ethers.getContractFactory("ProofPerks");
  const proofPerks = await ProofPerks.deploy("https://your-api.com/metadata/");

  await proofPerks.waitForDeployment(); // <-- updated this line
  console.log("ProofPerks deployed to:", await proofPerks.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});