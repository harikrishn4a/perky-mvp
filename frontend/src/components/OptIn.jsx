import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { mintProof, getCampaignById } from '../utils/contract';
import { useAccount, useConnect, useNetwork, useSwitchNetwork } from 'wagmi';
import { InjectedConnector } from 'wagmi/connectors/injected';

const OptIn = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { address, isConnected } = useAccount();
  const { connect } = useConnect({
    connector: new InjectedConnector(),
  });
  const { chain } = useNetwork();
  const { switchNetwork } = useSwitchNetwork();

  const [claiming, setClaiming] = useState(false);
  const [error, setError] = useState(null);
  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [optInData, setOptInData] = useState({
    email: '',
    phoneNumber: '',
    marketingPreferences: {
      email: false,
      sms: false,
      notifications: false
    }
  });

  useEffect(() => {
    const fetchCampaign = async () => {
      try {
        const campaignData = await getCampaignById(id);
        setCampaign(campaignData);
      } catch (err) {
        console.error('Error fetching campaign:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCampaign();
  }, [id]);

  const handleOptInChange = (field, value) => {
    if (field.startsWith('marketing.')) {
      const pref = field.split('.')[1];
      setOptInData(prev => ({
        ...prev,
        marketingPreferences: {
          ...prev.marketingPreferences,
          [pref]: value
        }
      }));
    } else {
      setOptInData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setClaiming(true);
      setError(null);
      
      // Validate required fields
      if (!optInData.email) {
        throw new Error('Email is required for claiming');
      }

      // Check wallet connection
      if (!isConnected) {
        try {
          await connect();
          // Return here as connect will trigger a re-render
          return;
        } catch (err) {
          console.error('Wallet connection error:', err);
          throw new Error('Failed to connect wallet. Please try again.');
        }
      }

      // Ensure we have the address
      if (!address) {
        throw new Error('Please connect your wallet to claim the NFT');
      }

      // The network switching is now handled in the contract utility
      // Call mintProof with campaign ID
      console.log('Minting proof for campaign:', id, 'with address:', address);
      const tx = await mintProof(id, optInData);
      console.log('Transaction:', tx);
      await tx.wait();
      
      // Navigate to success page
      navigate(`/campaign/${id}/success`);
      
    } catch (err) {
      console.error('Error claiming NFT:', err);
      // Show more user-friendly error messages
      if (err.message.includes('XRPL')) {
        setError('Please switch to the XRPL EVM Sidechain network. Click the MetaMask extension to switch networks.');
      } else if (err.code === 4001) {
        setError('Transaction was rejected. Please try again.');
      } else {
        setError(err.message || 'Failed to claim NFT. Please try again.');
      }
    } finally {
      setClaiming(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
              <div className="h-8 bg-gray-200 rounded w-3/4 mb-6"></div>
              <div className="space-y-4">
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="text-red-600 mb-4">{error}</div>
            <button
              onClick={() => navigate(`/campaign/${id}`)}
              className="text-blue-600 hover:text-blue-800"
            >
              ← Back to Campaign
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <button
            onClick={() => navigate(`/campaign/${id}`)}
            className="text-blue-600 hover:text-blue-800 mb-6 block"
          >
            ← Back to Campaign
          </button>

          <h2 className="text-2xl font-bold mb-6">Data Sharing & Opt-in</h2>
          
          {/* Data Sharing Information */}
          <div className="mb-8 bg-blue-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">What You're Sharing</h3>
            <p className="text-gray-700 mb-4">
              By claiming this NFT, you agree to share:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
              <li>Your NFT collection data</li>
              <li>Campaign interaction metadata</li>
              <li>Contact information provided below</li>
            </ul>
            <p className="text-gray-700 mb-4">
              This data will be shared with <span className="font-semibold">{campaign?.businessName || 'the campaign organizer'}</span> to:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>Provide personalized advertisements</li>
              <li>Improve campaign targeting</li>
              <li>Send relevant offers and updates (if opted in)</li>
            </ul>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address *
              </label>
              <input
                type="email"
                id="email"
                value={optInData.email}
                onChange={(e) => handleOptInChange('email', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
              <p className="mt-1 text-sm text-gray-500">Required for campaign communication</p>
            </div>

            {/* Phone Number Input */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                Phone Number
              </label>
              <input
                type="tel"
                id="phone"
                value={optInData.phoneNumber}
                onChange={(e) => handleOptInChange('phoneNumber', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
              <p className="mt-1 text-sm text-gray-500">Optional, for SMS updates if opted in</p>
            </div>

            {/* Marketing Preferences */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Communication Preferences</label>
              <div className="space-y-3 mt-2">
                <label className="flex items-start">
                  <input
                    type="checkbox"
                    id="emailMarketing"
                    checked={optInData.marketingPreferences.email}
                    onChange={(e) => handleOptInChange('marketing.email', e.target.checked)}
                    className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-600">
                    Receive email updates about new campaigns and offers
                  </span>
                </label>

                <label className="flex items-start">
                  <input
                    type="checkbox"
                    id="smsMarketing"
                    checked={optInData.marketingPreferences.sms}
                    onChange={(e) => handleOptInChange('marketing.sms', e.target.checked)}
                    className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-600">
                    Receive SMS updates about exclusive offers
                  </span>
                </label>

                <label className="flex items-start">
                  <input
                    type="checkbox"
                    id="notifications"
                    checked={optInData.marketingPreferences.notifications}
                    onChange={(e) => handleOptInChange('marketing.notifications', e.target.checked)}
                    className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-600">
                    Receive push notifications for time-sensitive campaigns
                  </span>
                </label>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={claiming || !optInData.email}
                className={`w-full py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                  claiming || !optInData.email
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                }`}
              >
                {claiming ? 'Processing...' : isConnected ? 'Agree & Claim NFT' : 'Connect Wallet to Claim NFT'}
              </button>
              <p className="mt-2 text-sm text-gray-500 text-center">
                {isConnected 
                  ? 'By clicking "Agree & Claim NFT", you agree to share your data as described above'
                  : 'Please connect your wallet to claim this NFT'
                }
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default OptIn; 