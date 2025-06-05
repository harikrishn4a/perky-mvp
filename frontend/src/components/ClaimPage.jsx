import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getCampaignById, mintProof } from '../utils/contract';

const ClaimPage = () => {
  const { id } = useParams();
  const [campaign, setCampaign] = useState(null);
  const [status, setStatus] = useState('');
  const [alreadyClaimed, setAlreadyClaimed] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        console.log('Fetching campaign with ID:', id);
        const data = await getCampaignById(id);
        console.log('Received campaign data:', data);
        
        // Campaign data is already transformed by getCampaignById
        setCampaign(data);
        
        if (data.claimed && Number(data.claimed) > 0) {
          setAlreadyClaimed(true);
        }
      } catch (e) {
        console.error("Failed to load campaign:", e);
        setError(e.message);
      }
    };
    fetch();
  }, [id]);

  const handleClaim = async () => {
    setStatus("Claiming...");
    try {
      await mintProof(id);
      setStatus("✅ Claimed successfully!");
      setAlreadyClaimed(true);
    } catch (err) {
      console.error("Claim failed:", err);
      setStatus(`❌ Claim failed: ${err.message}`);
    }
  };

  if (error) {
    return (
      <div className="p-6 text-center">
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4">
          Error loading campaign: {error}
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="p-6 text-center">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mx-auto mb-4"></div>
          <div className="h-48 bg-gray-200 rounded w-96 mx-auto mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 text-center">
      <h2 className="text-xl font-bold mb-4">{campaign.title}</h2>
      
      {/* Image with fallback */}
      {campaign.imageUrl ? (
        <img
          src={campaign.imageUrl}
          alt={campaign.title}
          className="mx-auto h-48 w-auto object-cover rounded shadow-md"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = 'https://placehold.co/400x300?text=No+Image';
          }}
        />
      ) : (
        <div className="mx-auto h-48 w-96 bg-gray-100 flex items-center justify-center rounded shadow-md">
          <span className="text-gray-400">No Image Available</span>
        </div>
      )}

      <div className="mt-6 space-y-4">
        {campaign.category && (
          <div className="text-sm text-gray-600">
            Category: {campaign.category}
          </div>
        )}

        <p className="text-gray-700">{campaign.reward}</p>
        
        {campaign.location && (
          <div className="text-sm text-gray-600">
            📍 {campaign.location}
          </div>
        )}
        
        {campaign.expiry && (
          <div className="text-sm text-gray-600">
            Expires: {campaign.expiry}
          </div>
        )}

        {campaign.tags && campaign.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 justify-center">
            {campaign.tags.map((tag, index) => (
              <span key={index} className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-sm">
                {tag}
              </span>
            ))}
          </div>
        )}

        {alreadyClaimed ? (
          <div className="bg-green-100 text-green-800 px-4 py-2 rounded">
            Already claimed
          </div>
        ) : (
          <button
            onClick={handleClaim}
            disabled={!!status.includes("Claiming")}
            className={`mt-4 px-6 py-2 rounded ${
              status.includes("Claiming")
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            } text-white font-medium transition-colors`}
          >
            {status || "Claim NFT"}
          </button>
        )}

        {status && (
          <div className={`mt-4 p-2 rounded ${
            status.includes("✅") ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
          }`}>
            {status}
          </div>
        )}
      </div>
    </div>
  );
};

export default ClaimPage;