import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCampaignById } from '../utils/contract';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const CampaignAnalytics = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Validate ID
        if (id === undefined || id === null) {
          throw new Error('Invalid campaign ID');
        }

        // Convert ID to number and validate
        const numericId = Number(id);
        if (isNaN(numericId)) {
          throw new Error('Invalid campaign ID format');
        }

        // Get campaign data
        console.log('Fetching campaign data for ID:', numericId);
        const data = await getCampaignById(numericId);
        if (!data) {
          throw new Error('Campaign not found');
        }
        console.log('Campaign data received:', data);
        setCampaign(data);
      } catch (err) {
        console.error('Error fetching campaign data:', err);
        setError(err.message);
        // Redirect back to dashboard after 3 seconds if campaign not found
        if (err.message.includes('not found') || err.message.includes('Invalid campaign')) {
          setTimeout(() => navigate('/business/dashboard'), 3000);
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="p-8">
        <div className="text-center text-gray-600">
          No campaign data available
        </div>
      </div>
    );
  }

  const claimConversionRate = (campaign.claimed / campaign.minted * 100).toFixed(1);
  const redemptionRate = (campaign.burned / campaign.minted * 100).toFixed(1);

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold">{campaign.title} - Analytics Dashboard</h2>
        <button 
          onClick={() => navigate('/business/dashboard')}
          className="px-4 py-2 text-gray-600 hover:text-gray-800"
        >
          ← Back to Dashboard
        </button>
      </div>
      
      {/* Campaign Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="font-semibold mb-2">Conversion Rate</h3>
          <p className="text-3xl font-bold text-blue-600">{claimConversionRate}%</p>
          <p className="text-sm text-gray-500">Claimed vs Minted</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="font-semibold mb-2">Redemption Rate</h3>
          <p className="text-3xl font-bold text-green-600">{redemptionRate}%</p>
          <p className="text-sm text-gray-500">Burned vs Minted</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="font-semibold mb-2">Views</h3>
          <p className="text-3xl font-bold text-purple-600">{campaign.views || 0}</p>
          <p className="text-sm text-gray-500">Total campaign views</p>
        </div>
      </div>

      {/* Campaign Conversion */}
      <div className="bg-white p-6 rounded-lg shadow mb-8">
        <Bar
          data={{
            labels: ['Minted', 'Claimed', 'Burned'],
            datasets: [{
              label: 'Count',
              data: [
                campaign.minted,
                campaign.claimed,
                campaign.burned
              ],
              backgroundColor: ['#2196F3', '#4CAF50', '#F44336']
            }]
          }}
          options={{
            responsive: true,
            plugins: {
              legend: { position: 'top' },
              title: { display: true, text: 'Campaign Conversion Metrics' }
            }
          }}
        />
      </div>

      {/* Campaign Details */}
      <div className="bg-white p-6 rounded-lg shadow mb-8">
        <h3 className="font-semibold mb-4">Campaign Details</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Category</p>
            <p className="font-medium">{campaign.category}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Location</p>
            <p className="font-medium">{campaign.location}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Reward</p>
            <p className="font-medium">{campaign.reward}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Expiry Date</p>
            <p className="font-medium">{campaign.expiryDate}</p>
          </div>
        </div>
      </div>

      {/* Tags */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="font-semibold mb-4">Campaign Tags</h3>
        <div className="flex flex-wrap gap-2">
          {campaign.tags.map((tag, index) => (
            <span key={index} className="px-3 py-1 bg-gray-100 rounded-full text-sm">
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CampaignAnalytics;