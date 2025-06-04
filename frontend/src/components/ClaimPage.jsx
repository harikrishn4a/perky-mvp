// @jsxImportSource react
import React, { useState, useEffect } from 'react';
import { ethers } from "ethers";
import { getContract } from "../utils/contract";

const ClaimPage = () => {
  const [campaignId, setCampaignId] = useState("");
  const [account, setAccount] = useState("");

  useEffect(() => {
    const fetchAccount = async () => {
      if (window.ethereum) {
        const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
        setAccount(accounts[0]);
      }
    };
    fetchAccount();
  }, []);

  const handleClaim = async () => {
    try {
      const contract = await getContract();
      const tx = await contract.mintProof(account, parseInt(campaignId));
      await tx.wait();
      alert("NFT claimed successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to claim NFT.");
    }
  };

  return (
    <div className="p-4 border rounded shadow">
      <h2 className="text-lg font-semibold mb-4">Claim Proof NFT</h2>
      <div className="space-y-4">
        <input
          className="block w-full p-2 border rounded"
          value={campaignId}
          onChange={(e) => setCampaignId(e.target.value)}
          placeholder="Enter Campaign ID"
        />
        <button
          className="w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          onClick={handleClaim}
        >
          Claim NFT
        </button>
      </div>
    </div>
  );
};

export default ClaimPage;