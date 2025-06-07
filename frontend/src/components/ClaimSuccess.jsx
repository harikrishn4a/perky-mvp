import React, { useState } from 'react';
import OptInForm from './OptInForm';

const ClaimSuccess = () => {
  const [showOptIn, setShowOptIn] = useState(false);

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

      <button
        onClick={() => setShowOptIn(true)}
        className="mt-4 inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        Share NFT Collection
      </button>

      {showOptIn && <OptInForm onClose={() => setShowOptIn(false)} />}
    </div>
  );
};

export default ClaimSuccess; 