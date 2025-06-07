import React, { useState, useEffect } from 'react';
import { burnProof } from '../utils/contract';
import { fetchMetadata } from '../utils/encryption';

const NFTCard = ({ campaign, onOptIn }) => {
  const [loading, setLoading] = useState(false);
  const [metadata, setMetadata] = useState(null);
  const [decodedMetadata, setDecodedMetadata] = useState(null);

  useEffect(() => {
    const loadMetadata = async () => {
      try {
        if (campaign?.encryptedString) {
          const decoded = await fetchMetadata(campaign.encryptedString);
          setDecodedMetadata(decoded);
        }
      } catch (error) {
        console.error('Error loading metadata:', error);
      }
    };

    loadMetadata();
  }, [campaign]);

  const handleOptIn = async () => {
    setLoading(true);
    try {
      // Burn the NFT to mark it as redeemed
      const tx = await burnProof(campaign.id);
      await tx.wait();

      // Notify parent component
      onOptIn(campaign.id, decodedMetadata);
    } catch (error) {
      console.error('Error opting in:', error);
      alert('Failed to opt in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="relative h-48">
        <img
          src={campaign.imageUrl || 'https://via.placeholder.com/400x200?text=Campaign+Image'}
          alt={campaign.title}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.target.src = 'https://via.placeholder.com/400x200?text=Campaign+Image';
          }}
        />
        <div className="absolute top-2 right-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
          {campaign.category}
        </div>
      </div>

      <div className="p-4">
        <h3 className="text-lg font-semibold mb-2">{campaign.title}</h3>
        <p className="text-gray-600 text-sm mb-4">{campaign.reward}</p>

        <div className="flex justify-between items-center text-sm text-gray-500 mb-4">
          <span>{campaign.location}</span>
          <span>Expires: {new Date(campaign.expiryDate).toLocaleDateString()}</span>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {campaign.tags.map((tag, index) => (
            <span
              key={index}
              className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded"
            >
              {tag}
            </span>
          ))}
        </div>

        {decodedMetadata ? (
          <div className="bg-green-50 border border-green-200 rounded p-3 mb-4">
            <p className="text-green-800 text-sm font-medium">
              You've opted in to share data with this business
            </p>
          </div>
        ) : (
          <button
            onClick={handleOptIn}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Opt In & Earn XRP'}
          </button>
        )}
      </div>
    </div>
  );
};

export default NFTCard; 