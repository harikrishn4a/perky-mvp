import React, { useState } from 'react';
import { shareNFTData } from '../utils/contract';
import { initLit } from '../utils/lit';

const DataSharingPrompt = ({ companyAddress, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [step, setStep] = useState('initial'); // initial, connecting, sharing, complete

  const handleOptIn = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Step 1: Initialize Lit Protocol
      setStep('connecting');
      await initLit();
      
      // Step 2: Share NFT data with encryption
      setStep('sharing');
      await shareNFTData(companyAddress);
      
      // Step 3: Complete
      setStep('complete');
      onClose(true);
    } catch (err) {
      console.error('Error sharing data:', err);
      setError(err.message || 'Failed to share data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDecline = () => {
    onClose(false);
  };

  const getStepMessage = () => {
    switch(step) {
      case 'connecting':
        return 'Connecting to Lit Protocol...';
      case 'sharing':
        return 'Encrypting and sharing your NFT data...';
      case 'complete':
        return 'Data shared successfully!';
      default:
        return 'Share your NFT collection data';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h2 className="text-2xl font-bold mb-4">{getStepMessage()}</h2>
        
        <p className="text-gray-600 mb-6">
          {step === 'initial' ? (
            'Would you like to share your NFT collection data with this company? Your data will be encrypted using Lit Protocol.'
          ) : (
            'Please wait while we process your request...'
          )}
        </p>
        
        {step === 'initial' && (
          <div className="space-y-4 mb-6">
            <div className="flex items-center">
              <svg className="w-6 h-6 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>1 XRP reward directly to your wallet</span>
            </div>
            
            <div className="flex items-center">
              <svg className="w-6 h-6 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>End-to-end encrypted data sharing</span>
            </div>
            
            <div className="flex items-center">
              <svg className="w-6 h-6 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Decentralized access control</span>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {step === 'initial' && (
          <div className="flex space-x-4">
            <button
              onClick={handleOptIn}
              disabled={loading}
              className={`flex-1 py-2 px-4 rounded-md text-white font-medium ${
                loading
                  ? 'bg-blue-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {loading ? 'Processing...' : 'Yes, Share Data'}
            </button>
            
            <button
              onClick={handleDecline}
              disabled={loading}
              className="flex-1 py-2 px-4 border border-gray-300 rounded-md text-gray-700 font-medium hover:bg-gray-50"
            >
              No, Thanks
            </button>
          </div>
        )}
        
        {step !== 'initial' && (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )}
        
        <p className="mt-4 text-sm text-gray-500">
          Your data will be encrypted using Lit Protocol and only accessible to this company. You can revoke access at any time.
        </p>
      </div>
    </div>
  );
};

export default DataSharingPrompt; 