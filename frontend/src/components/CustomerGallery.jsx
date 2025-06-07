import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getContract } from '../utils/contract';

// Default placeholder image from Unsplash
const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1612103198005-b238154f4590?auto=format&fit=crop&w=800&q=80';

const ImageWithFallback = ({ src, alt, className }) => {
  const [imgSrc, setImgSrc] = useState(src || DEFAULT_IMAGE);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setImgSrc(src || DEFAULT_IMAGE);
    setHasError(false);
  }, [src]);

  const handleError = () => {
    if (!hasError) {
      setHasError(true);
      setImgSrc(DEFAULT_IMAGE);
    }
  };

  return (
    <div className={`relative ${className} bg-gray-100 rounded overflow-hidden`}>
      <img
        src={imgSrc}
        alt={alt}
        className="w-full h-full object-cover"
        onError={handleError}
      />
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-90">
          <span className="text-gray-500 text-sm">Unable to load campaign image</span>
        </div>
      )}
    </div>
  );
};

const CustomerGallery = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // IDs of campaigns to hide
  const hiddenCampaignIds = [0]; // Add more IDs here if needed

  const handleBackToHome = () => {
    // Clear wallet address and user role when going back to home
    localStorage.removeItem('walletAddress');
    localStorage.removeItem('userRole');
    navigate('/');
  };

  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        console.log("Fetching campaigns...");
        const contract = await getContract();
        console.log("Got contract, getting campaign count...");
        
        const count = await contract.currentCampaignId();
        console.log("Total campaigns:", count.toString());
        
        const fetched = [];
        for (let i = 0; i < count; i++) {
          // Skip hidden campaigns
          if (hiddenCampaignIds.includes(i)) {
            console.log(`Skipping hidden campaign ${i}`);
            continue;
          }

          console.log(`Fetching campaign ${i}...`);
          try {
            const campaign = await contract.getCampaignById(i);
            console.log(`Campaign ${i} data:`, campaign);
            
            // Transform array-like response to object
            const transformedCampaign = {
              id: i,
              title: campaign[0] || 'Untitled Campaign',
              category: campaign[1] || '',
              reward: campaign[2] || 'No description',
              imageUrl: campaign[3] || '',
              location: campaign[4] || '',
              expiry: campaign[5] || null,
              tags: campaign[6] || [],
              minted: Number(campaign[7]) || 0,
              claimed: Number(campaign[8]) || 0,
              burned: Number(campaign[9]) || 0,
              views: Number(campaign[10]) || 0
            };
            
            // Validate and clean up image URL
            if (transformedCampaign.imageUrl) {
              try {
                new URL(transformedCampaign.imageUrl);
              } catch (e) {
                console.warn(`Invalid image URL for campaign ${i}:`, transformedCampaign.imageUrl);
                transformedCampaign.imageUrl = '';
              }
            }
            
            console.log(`Transformed campaign ${i}:`, transformedCampaign);
            fetched.push(transformedCampaign);
          } catch (err) {
            console.error(`Error fetching campaign ${i}:`, err);
          }
        }
        
        console.log("All fetched campaigns:", fetched);
        setCampaigns(fetched);
      } catch (err) {
        console.error('Failed to load campaigns:', err);
        setError(err.message);
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
          Error loading campaigns: {error}
        </div>
      </div>
    );
  }

  if (loading) {
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="border rounded p-4 shadow animate-pulse">
              <div className="h-48 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
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
      {campaigns.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No campaigns available yet.</p>
          <Link 
            to="/business/create" 
            className="inline-block mt-4 px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Create a Campaign
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {campaigns.map((campaign) => (
            <div key={campaign.id} className="border rounded p-4 shadow hover:shadow-md transition-shadow">
              <ImageWithFallback
                src={campaign.imageUrl}
                alt={campaign.title}
                className="h-48 mb-4"
              />
              
              <div className="space-y-2">
                <h3 className="font-bold text-lg">{campaign.title}</h3>
                
                {campaign.category && (
                  <div className="text-sm text-gray-500">
                    Category: {campaign.category}
                  </div>
                )}
                
                <p className="text-sm text-gray-600">{campaign.reward}</p>
                
                {campaign.location && (
                  <div className="text-sm text-gray-500">
                    📍 {campaign.location}
                  </div>
                )}
                
                {campaign.expiry && (
                  <div className="text-sm text-gray-500">
                    Expires: {new Date(campaign.expiry).toLocaleDateString()}
                  </div>
                )}
                
                {campaign.claimed > 0 && (
                  <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                    {campaign.claimed} Claimed
                  </span>
                )}
                
                <div className="pt-2">
                  <Link 
                    to={`/campaign/${campaign.id}`}
                    className="inline-block text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    View Details →
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