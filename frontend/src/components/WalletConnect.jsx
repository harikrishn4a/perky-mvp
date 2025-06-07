import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';

const WalletConnect = () => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const userRole = localStorage.getItem('userRole');

  const connectWallet = async () => {
    if (!window.ethereum) {
      setError('Please install MetaMask to continue');
      return;
    }

    try {
      setIsConnecting(true);
      setError('');

      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });

      // Get the provider
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      // Store the address
      localStorage.setItem('walletAddress', accounts[0]);

      // Redirect based on role
      navigate(userRole === 'user' ? '/user/dashboard' : '/business/dashboard');
    } catch (err) {
      setError(err.message || 'Failed to connect wallet');
    } finally {
      setIsConnecting(false);
    }
  };

  // Redirect if no role is selected
  useEffect(() => {
    if (!userRole) {
      navigate('/');
    }
  }, [userRole, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-purple-900 flex flex-col items-center justify-center">
      <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 w-full max-w-md text-center">
        <h2 className="text-2xl font-semibold text-white mb-6">
          Connect Your Wallet
        </h2>
        
        <p className="text-gray-300 mb-8">
          {userRole === 'user' 
            ? 'Connect your wallet to view and manage your NFTs'
            : 'Connect your wallet to manage your marketing campaigns'}
        </p>

        <button
          onClick={connectWallet}
          disabled={isConnecting}
          className="w-full py-4 px-6 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-all flex items-center justify-center space-x-3 disabled:opacity-50"
        >
          <img 
            src="/metamask-fox.svg" 
            alt="MetaMask" 
            className="w-6 h-6"
          />
          <span>
            {isConnecting ? 'Connecting...' : 'Connect with MetaMask'}
          </span>
        </button>

        {error && (
          <p className="mt-4 text-red-400 text-sm">
            {error}
          </p>
        )}
      </div>
    </div>
  );
};

export default WalletConnect; 