import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getContract } from '../utils/contract';

// Category-based placeholder images
const CATEGORY_IMAGES = {
  'Sportswear': 'https://images.unsplash.com/photo-1483721310020-03333e577078?w=800&auto=format&fit=crop&q=80',
  'Running Shoes': 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&auto=format&fit=crop&q=80',
  'Food & Beverage': 'https://images.unsplash.com/photo-1493770348161-369560ae357d?w=800&auto=format&fit=crop&q=80',
  'Fitness': 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&auto=format&fit=crop&q=80',
  'Dining': 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop&q=80',
  'Business': 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&auto=format&fit=crop&q=80',
  'default': 'https://via.placeholder.com/400x200?text=Campaign+Image'
};

const ImageWithFallback = ({ src, alt, className, category }) => {
  const getFallbackUrl = (category) => {
    return CATEGORY_IMAGES[category] || CATEGORY_IMAGES.default;
  };

  return (
    <div className={`relative ${className} bg-gray-100 rounded overflow-hidden`}>
      <img
        src={src || getFallbackUrl(category)}
        alt={alt}
        className="w-full h-full object-cover"
        onError={(e) => {
          e.target.src = getFallbackUrl(category);
        }}
      />
    </div>
  );
};

const CustomerGallery = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleBackToHome = () => {
    localStorage.removeItem('walletAddress');
    localStorage.removeItem('userRole');
    navigate('/');
  };

  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        console.log("Fetching campaigns...");
        setError(null);
        
        const contract = await getContract();
        console.log("Got contract instance");
        
        const countBigInt = await contract.currentCampaignId();
        const totalCampaigns = Number(countBigInt);
        console.log("Total campaigns:", totalCampaigns);
        
        const fetched = [];

        for (let i = 0; i < totalCampaigns; i++) {
          try {
            console.log(`Fetching campaign ${i}...`);
            
            const result = await contract.getCampaignById(i);
            console.log(`Raw result for campaign ${i}:`, result);

            if (!result) continue;

            // Process campaign data
            const campaign = {
              id: i,
              title: result[0] || '',
              category: result[1] || '',
              reward: result[2] || '',
              location: result[3] || '',
              expiryTimestamp: null,
              tags: [], // Initialize empty array
              minted: Number(result[6] || 0),
              claimed: Number(result[7] || 0),
              burned: Number(result[8] || 0),
              views: Number(result[9] || 0)
            };

            // Handle timestamp (index 4)
            if (result[4]) {
              campaign.expiryTimestamp = Number(result[4].toString()) * 1000; // Convert to milliseconds
            }

            // Safely handle tags array
            try {
              if (result[5] && Array.isArray(result[5])) {
                campaign.tags = result[5];
              }
            } catch (tagError) {
              console.warn(`Warning: Could not process tags for campaign ${i}:`, tagError);
            }

            // Process display data
            const processedCampaign = {
              ...campaign,
              displayCategory: campaign.category?.startsWith('http') ? 'General' : campaign.category,
              imageUrl: campaign.location?.startsWith('http') 
                ? campaign.location 
                : campaign.category?.startsWith('http')
                  ? campaign.category
                  : null,
              displayLocation: campaign.location?.startsWith('http') ? null : campaign.location,
              formattedExpiry: campaign.expiryTimestamp 
                ? new Date(campaign.expiryTimestamp).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })
                : null
            };

            // Validate campaign data
            if (processedCampaign.title && processedCampaign.title.trim() !== '') {
              fetched.push(processedCampaign);
              console.log(`Added campaign ${i}:`, processedCampaign);
            }
          } catch (err) {
            console.error(`Error processing campaign ${i}:`, err);
            continue;
          }
        }

        // Sort campaigns by ID (newest first)
        fetched.sort((a, b) => b.id - a.id);
        
        console.log(`Successfully fetched ${fetched.length} valid campaigns:`, fetched);
        setCampaigns(fetched);
      } catch (err) {
        console.error('Failed to load campaigns:', err);
        setError(`Error loading campaigns: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchCampaigns();
  }, []);

  if (error) {
    return (
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Explore Campaigns</h2>
          <button
            onClick={handleBackToHome}
            className="text-gray-600 hover:text-gray-800 flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span>Back to Home</span>
          </button>
        </div>
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Explore Campaigns</h2>
        <button
          onClick={handleBackToHome}
          className="text-gray-600 hover:text-gray-800 flex items-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <span>Back to Home</span>
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="border rounded p-4 shadow animate-pulse">
              <div className="h-48 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : campaigns.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No campaigns available yet.</p>
          <Link 
            to="/business/create-campaign" 
            className="inline-block mt-4 px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Create a Campaign
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {campaigns.map((campaign) => (
            <div key={campaign.id} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
              <div className="relative h-48">
                <ImageWithFallback
                  src={campaign.imageUrl}
                  alt={campaign.title}
                  className="h-full"
                  category={campaign.displayCategory}
                />
                <div className="absolute top-2 right-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                  {campaign.displayCategory}
                </div>
              </div>
              
              <div className="p-6">
                <h3 className="text-xl font-bold mb-2">{campaign.title}</h3>
                
                <div className="space-y-3">
                  <p className="text-lg font-semibold text-blue-600">
                    {campaign.reward}
                  </p>
                  
                  {campaign.displayLocation && (
                    <div className="text-sm text-gray-600">
                      📍 {campaign.displayLocation}
                    </div>
                  )}
                  
                  {campaign.formattedExpiry && (
                    <div className="text-sm text-gray-600">
                      ⏰ Expires: {campaign.formattedExpiry}
                    </div>
                  )}
                  
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full">
                      {campaign.claimed} Claimed
                    </span>
                  </div>
                  
                  {campaign.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {campaign.tags.map((tag, index) => (
                        <span key={index} className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  <Link 
                    to={`/campaign/${campaign.id}`}
                    className="mt-4 inline-block w-full text-center bg-purple-600 text-white py-2 rounded hover:bg-purple-700 transition-colors"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CustomerGallery;