import React, { useState, useEffect } from 'react';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { getCampaignStats, getCampaignMetrics } from '../utils/contract';
import { decryptMetadata } from '../utils/encryption';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const CampaignMetrics = ({ campaign }) => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [metrics, setMetrics] = useState([]);
  const [layer2Data, setLayer2Data] = useState(null);

  useEffect(() => {
    fetchAnalytics();
  }, [campaign.id]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);

      // Fetch Layer 1 analytics (public)
      const campaignStats = await getCampaignStats(campaign.id);
      setStats(campaignStats);

      // Fetch Layer 2 analytics (from opted-in users)
      if (campaign.optedInUsers?.length > 0) {
        const userMetrics = await Promise.all(
          campaign.optedInUsers.map(async (user) => {
            const metrics = await getCampaignMetrics(campaign.id, user);
            const metadata = await decryptMetadata(
              campaign.encryptedString,
              campaign.encryptedSymmetricKey,
              campaign.accessControlConditions
            );
            return { ...metrics, metadata };
          })
        );
        setMetrics(userMetrics);

        // Process Layer 2 data for visualization
        processLayer2Data(userMetrics);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const processLayer2Data = (userMetrics) => {
    // Example: Process engagement times
    const engagementTimes = userMetrics.reduce((acc, metric) => {
      const hour = new Date(metric.claimTime * 1000).getHours();
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {});

    setLayer2Data({
      engagementTimes,
      // Add more processed data as needed
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Layer 1 Analytics */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-semibold mb-6">Layer 1 Analytics</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-sm text-blue-600">Total Minted</p>
            <p className="text-2xl font-semibold">{stats?.totalMinted || 0}</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <p className="text-sm text-green-600">Unique Claimers</p>
            <p className="text-2xl font-semibold">{stats?.uniqueClaimers || 0}</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <p className="text-sm text-purple-600">Total Claimed</p>
            <p className="text-2xl font-semibold">{stats?.totalClaimed || 0}</p>
          </div>
          <div className="bg-orange-50 rounded-lg p-4">
            <p className="text-sm text-orange-600">Total Burned</p>
            <p className="text-2xl font-semibold">{stats?.totalBurned || 0}</p>
          </div>
        </div>

        {/* Conversion Rate Chart */}
        <div className="mt-8 h-64">
          <Bar
            data={{
              labels: ['Minted', 'Claimed', 'Burned'],
              datasets: [
                {
                  label: 'Campaign Funnel',
                  data: [
                    stats?.totalMinted || 0,
                    stats?.totalClaimed || 0,
                    stats?.totalBurned || 0,
                  ],
                  backgroundColor: [
                    'rgba(59, 130, 246, 0.5)',
                    'rgba(16, 185, 129, 0.5)',
                    'rgba(249, 115, 22, 0.5)',
                  ],
                  borderColor: [
                    'rgb(59, 130, 246)',
                    'rgb(16, 185, 129)',
                    'rgb(249, 115, 22)',
                  ],
                  borderWidth: 1,
                },
              ],
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                title: {
                  display: true,
                  text: 'Campaign Conversion Funnel',
                },
              },
            }}
          />
        </div>
      </div>

      {/* Layer 2 Analytics */}
      {layer2Data && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold mb-6">Layer 2 Analytics</h3>
          
          {/* Engagement Times Chart */}
          <div className="h-64">
            <Line
              data={{
                labels: Object.keys(layer2Data.engagementTimes),
                datasets: [
                  {
                    label: 'Hourly Engagement',
                    data: Object.values(layer2Data.engagementTimes),
                    borderColor: 'rgb(99, 102, 241)',
                    backgroundColor: 'rgba(99, 102, 241, 0.5)',
                    tension: 0.4,
                  },
                ],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  title: {
                    display: true,
                    text: 'Engagement by Hour',
                  },
                },
                scales: {
                  x: {
                    title: {
                      display: true,
                      text: 'Hour of Day',
                    },
                  },
                  y: {
                    title: {
                      display: true,
                      text: 'Number of Engagements',
                    },
                    beginAtZero: true,
                  },
                },
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default CampaignMetrics; 