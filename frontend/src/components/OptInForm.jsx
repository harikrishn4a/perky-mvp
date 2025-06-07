import React, { useState } from 'react';
import { ethers } from 'ethers';
import { contractABI, contractAddress } from '../utils/constants';

const OptInForm = ({ onClose }) => {
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    preferences: {
      email: false,
      sms: false,
      push: false
    }
  });
  const [status, setStatus] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        [name]: checked
      }
    }));
  };

  const sendXRPReward = async (userWalletAddress) => {
    try {
      console.log('Sending reward to wallet:', userWalletAddress);
      // Business wallet private key should be on backend
      // Frontend should call backend to trigger the reward
      const response = await fetch('http://localhost:3000/api/send-reward', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          toAddress: userWalletAddress
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process reward');
      }

      const result = await response.json();
      console.log('Reward transaction:', result);
      return true;
    } catch (error) {
      console.error('Error sending reward:', error);
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsProcessing(true);
    setStatus('Processing...');

    try {
      // Get wallet address
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const walletAddress = await signer.getAddress();
      
      console.log('User wallet address for reward:', walletAddress);

      // First save preferences
      setStatus('Saving preferences...');
      const response = await fetch('http://localhost:3000/api/preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          walletAddress
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save preferences');
      }

      // Then send XRP reward
      setStatus('Sending 2 XRP reward...');
      await sendXRPReward(walletAddress);
      
      setStatus('✅ Preferences saved and 2 XRP sent!');
      setTimeout(() => onClose(), 3000);
    } catch (error) {
      console.error('Error:', error);
      setStatus(`❌ Error: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h2 className="text-2xl font-bold mb-4">Share Your NFT Collection</h2>
        <p className="text-gray-600 mb-4">
          Share your contact details to receive updates about new campaigns and earn 2 XRP!
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Phone Number</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">Marketing Preferences</p>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="email"
                  checked={formData.preferences.email}
                  onChange={handleCheckboxChange}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-600">Email updates</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="sms"
                  checked={formData.preferences.sms}
                  onChange={handleCheckboxChange}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-600">SMS notifications</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="push"
                  checked={formData.preferences.push}
                  onChange={handleCheckboxChange}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-600">Push notifications</span>
              </label>
            </div>
          </div>

          {status && (
            <div className={`text-sm ${status.includes('❌') ? 'text-red-600' : 'text-green-600'}`}>
              {status}
            </div>
          )}

          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              disabled={isProcessing}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isProcessing}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isProcessing ? 'Processing...' : 'Agree & Get 2 XRP'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OptInForm; 