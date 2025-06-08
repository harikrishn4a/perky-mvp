import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';
import OptInForm from './OptInForm';

const ClaimSuccess = () => {
  const [showOptIn, setShowOptIn] = useState(false);
  const [hasShared, setHasShared] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const { id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const checkExistingPreferences = async () => {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const walletAddress = await signer.getAddress();

        const response = await fetch(
          `http://localhost:3000/api/preferences?walletAddress=${walletAddress}&campaignId=${id}`
        );
        
        if (response.ok) {
          const data = await response.json();
          setHasShared(data.hasShared);
        }
      } catch (error) {
        console.error('Error checking preferences:', error);
      } finally {
        setIsChecking(false);
      }
    };

    checkExistingPreferences();
  }, [id]);

  const handleOptInClose = () => {
    setShowOptIn(false);
    setHasShared(true);
  };

  return (
    <div className="text-center p-8">
      <div className="mb-8">
        <svg
          className="mx-auto h-12 w-12 text-green-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
        <h2 className="mt-4 text-2xl font-bold text-green-600">NFT Claimed Successfully!</h2>
        <p className="mt-2 text-gray-600">
          Your NFT has been minted and will be available in your wallet shortly.
        </p>
      </div>

      <div className="space-y-4">
        {!isChecking && !hasShared && (
          <button
            onClick={() => setShowOptIn(true)}
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Share NFT Collection
          </button>
        )}

        {hasShared && (
          <div className="text-green-600 font-medium">
            ✅ Thank you for sharing your preferences! Your 2 XRP reward has been sent.
          </div>
        )}

        <div>
          <button
            onClick={() => navigate('/discover-campaigns')}
            className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Campaigns
          </button>
        </div>
      </div>

      {showOptIn && <OptInForm onClose={handleOptInClose} campaignId={id} />}
    </div>
  );
};

export default ClaimSuccess; 