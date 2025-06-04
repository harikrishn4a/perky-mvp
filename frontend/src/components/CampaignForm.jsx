import React from 'react';
import { useState } from "react";
import { getContract } from "../utils/contract";

const CampaignForm = () => {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [reward, setReward] = useState("");

  const handleSubmit = async () => {
    try {
      const contract = await getContract();
      const tx = await contract.createCampaign(title, category, reward);
      await tx.wait();
      alert("Campaign created!");
    } catch (err) {
      console.error(err);
      alert("Failed to create campaign.");
    }
  };

  return (
    <div className="p-4 border rounded shadow">
      <h2 className="text-lg font-semibold mb-2">Create Campaign</h2>
      <input 
        className="block w-full mb-2 p-2 border rounded" 
        value={title} 
        onChange={(e) => setTitle(e.target.value)} 
        placeholder="Title" 
      />
      <input 
        className="block w-full mb-2 p-2 border rounded" 
        value={category} 
        onChange={(e) => setCategory(e.target.value)} 
        placeholder="Category" 
      />
      <input 
        className="block w-full mb-2 p-2 border rounded" 
        value={reward} 
        onChange={(e) => setReward(e.target.value)} 
        placeholder="Reward" 
      />
      <button 
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700" 
        onClick={handleSubmit}
      >
        Create Campaign
      </button>
    </div>
  );
};

export default CampaignForm;