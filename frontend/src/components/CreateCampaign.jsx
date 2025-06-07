import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createCampaign } from '../utils/contract';
import { storeMetadata } from '../utils/encryption';
import { useAccount, useConnect, useNetwork, useSwitchNetwork } from 'wagmi';
import { InjectedConnector } from 'wagmi/connectors/injected';

const CreateCampaign = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { address, isConnected } = useAccount();
  const { connect } = useConnect({
    connector: new InjectedConnector(),
  });
  const { chain } = useNetwork();
  const { switchNetwork } = useSwitchNetwork();

  const [formData, setFormData] = useState({
    title: '',
    category: '',
    reward: '',
    imageUrl: '',
    location: '',
    expiryDate: '',
    tags: '',
  });

  // Check wallet connection and network
  useEffect(() => {
    const checkConnection = async () => {
      if (!isConnected) {
        connect();
      } else if (chain?.id !== 1440002) { // XRPL EVM Sidechain
        switchNetwork?.(1440002);
      }
    };
    checkConnection();
  }, [isConnected, chain, connect, switchNetwork]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateImageUrl = async (url) => {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      return response.ok;
    } catch (error) {
      console.error('Error validating image URL:', error);
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isConnected) {
      alert('Please connect your wallet to continue');
      connect();
      return;
    }

    if (chain?.id !== 1440002) {
      alert('Please switch to XRPL EVM Sidechain');
      switchNetwork?.(1440002);
      return;
    }

    setLoading(true);

    try {
      // Basic form validation
      if (!formData.title || !formData.category || !formData.reward || !formData.imageUrl || !formData.location || !formData.expiryDate) {
        throw new Error('Please fill in all required fields');
      }

      // Validate image URL
      const isValidImage = await validateImageUrl(formData.imageUrl);
      if (!isValidImage) {
        throw new Error('Invalid image URL. Please provide a direct, accessible image URL.');
      }

      // Convert tags string to array and clean it
      const tagsArray = formData.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);

      // Validate expiry date
      const expiryDate = new Date(formData.expiryDate);
      if (isNaN(expiryDate.getTime())) {
        throw new Error('Invalid expiry date');
      }

      if (expiryDate < new Date()) {
        throw new Error('Expiry date must be in the future');
      }

      // Format the expiry date as ISO string
      const formattedExpiryDate = expiryDate.toISOString();

      // Prepare metadata for IPFS storage
      const metadata = {
        title: formData.title.trim(),
        description: formData.reward.trim(),
        image: formData.imageUrl.trim(),
        category: formData.category.trim(),
        location: formData.location.trim(),
        expiryDate: formattedExpiryDate,
        tags: tagsArray,
        createdAt: new Date().toISOString(),
        creator: address
      };

      console.log('Storing metadata on IPFS:', metadata);
      const ipfsUrl = await storeMetadata(metadata);
      console.log('Metadata stored at:', ipfsUrl);

      console.log('Creating campaign with metadata:', {
        title: metadata.title,
        category: metadata.category,
        reward: metadata.description,
        metadataUrl: ipfsUrl,
        location: metadata.location,
        expiryDate: formattedExpiryDate,
        tags: tagsArray
      });

      const tx = await createCampaign(
        metadata.title,
        metadata.category,
        metadata.description,
        ipfsUrl,
        metadata.location,
        formattedExpiryDate,
        tagsArray
      );

      console.log('Campaign created, transaction:', tx);
      await tx.wait();
      console.log('Transaction confirmed');

      navigate('/business/dashboard');
    } catch (error) {
      console.error('Error creating campaign:', error);
      alert(error.message || 'Failed to create campaign. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-8">
        <h2 className="text-2xl font-semibold mb-6">Create New Campaign</h2>

        {!isConnected && (
          <div className="bg-yellow-50 border border-yellow-200 rounded p-4 mb-6">
            <p className="text-yellow-800">
              Please connect your wallet to create a campaign.{' '}
              <button
                onClick={() => connect()}
                className="text-yellow-600 underline hover:text-yellow-800"
              >
                Connect Wallet
              </button>
            </p>
          </div>
        )}

        {isConnected && chain?.id !== 1440002 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded p-4 mb-6">
            <p className="text-yellow-800">
              Please switch to XRPL EVM Sidechain.{' '}
              <button
                onClick={() => switchNetwork?.(1440002)}
                className="text-yellow-600 underline hover:text-yellow-800"
              >
                Switch Network
              </button>
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Campaign Title
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter campaign title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <input
              type="text"
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Food, Retail, Entertainment"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reward Description
            </label>
            <input
              type="text"
              name="reward"
              value={formData.reward}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., 20% off your next purchase"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Campaign Image URL
            </label>
            <input
              type="url"
              name="imageUrl"
              value={formData.imageUrl}
              onChange={handleChange}
              required
              pattern="https://.*"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://i.imgur.com/example.png"
            />
            <p className="mt-1 text-sm text-gray-500">
              Please provide a direct image URL (e.g., https://i.imgur.com/xxxxx.png)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location
            </label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., New York, Online"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Expiry Date
            </label>
            <input
              type="date"
              name="expiryDate"
              value={formData.expiryDate}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tags (comma-separated)
            </label>
            <input
              type="text"
              name="tags"
              value={formData.tags}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., food, discount, summer"
            />
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate('/business/dashboard')}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !isConnected || chain?.id !== 1440002}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Campaign'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateCampaign; 