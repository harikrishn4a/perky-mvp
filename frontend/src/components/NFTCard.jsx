import React, { useState } from 'react';

const NFTCard = ({ campaign, onOptIn }) => {
  const [loading, setLoading] = useState(false);

  const handleOptIn = async () => {
    setLoading(true);
    try {
      // Just notify parent component
      onOptIn(campaign.id);
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
          <span>Expires: {new Date(Number(campaign.expiryTimestamp) * 1000).toLocaleDateString()}</span>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {campaign.tags && campaign.tags.map((tag, index) => (
            <span
              key={index}
              className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded"
            >
              {tag}
            </span>
          ))}
        </div>

        <button
          onClick={handleOptIn}
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {loading ? 'Processing...' : 'Claim NFT'}
        </button>
      </div>
    </div>
  );
};

export default NFTCard; 