import React, { useState } from 'react';
import { getLiveCampaignAnalytics } from '../utils/contract';

const AIAnalytics = ({ campaign }) => {
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState(null);
  const [error, setError] = useState(null);

  const generateInsights = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Format the campaign data
      const campaignData = {
        title: campaign.title,
        category: campaign.category,
        location: campaign.location,
        tags: campaign.tags,
        metrics: {
          uniqueClaimers: campaign.uniqueClaimers,
          totalMinted: campaign.minted,
          totalClaimed: campaign.claimed,
          totalBurned: campaign.burned,
          conversionRate: (campaign.claimed / campaign.minted * 100).toFixed(1),
          redemptionRate: (campaign.burned / campaign.minted * 100).toFixed(1)
        }
      };

      // Generate rule-based insights
      const insights = {
        summary: generateSummary(campaignData),
        findings: generateFindings(campaignData),
        recommendations: generateRecommendations(campaignData)
      };

      setInsights(insights);
    } catch (err) {
      console.error('Error generating insights:', err);
      setError('Failed to generate insights. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const generateSummary = (data) => {
    const { metrics } = data;
    let performance = 'moderate';
    if (metrics.conversionRate > 70) performance = 'excellent';
    else if (metrics.conversionRate > 50) performance = 'good';
    else if (metrics.conversionRate < 30) performance = 'needs improvement';

    return `Campaign shows ${performance} performance with a ${metrics.conversionRate}% conversion rate. ${metrics.uniqueClaimers} unique users have participated in this campaign.`;
  };

  const generateFindings = (data) => {
    const findings = [];
    const { metrics } = data;

    // Conversion Analysis
    findings.push({
      title: 'Conversion Analysis',
      description: `The campaign has achieved a ${metrics.conversionRate}% conversion rate with ${metrics.totalClaimed} claims out of ${metrics.totalMinted} minted NFTs.`
    });

    // User Engagement
    if (metrics.uniqueClaimers > 0) {
      const avgClaimsPerUser = metrics.totalClaimed / metrics.uniqueClaimers;
      findings.push({
        title: 'User Engagement',
        description: `On average, each user has claimed ${avgClaimsPerUser.toFixed(1)} NFTs, indicating ${avgClaimsPerUser > 1.5 ? 'strong' : 'moderate'} user interest.`
      });
    }

    return findings;
  };

  const generateRecommendations = (data) => {
    const recommendations = [];
    const { metrics } = data;

    if (metrics.conversionRate < 50) {
      recommendations.push('Consider enhancing campaign visibility and value proposition');
      recommendations.push('Implement targeted marketing to increase claim rate');
    }

    if (metrics.uniqueClaimers < 100) {
      recommendations.push('Focus on expanding reach to new users');
      recommendations.push('Consider implementing referral incentives');
    }

    if (metrics.redemptionRate < 40) {
      recommendations.push('Simplify the redemption process');
      recommendations.push('Send reminders to users who haven\'t redeemed their claims');
    }

    // Always add general recommendations
    recommendations.push('Monitor user feedback and adjust campaign parameters accordingly');
    recommendations.push('Consider implementing a loyalty program for repeat customers');

    return recommendations;
  };

  return (
    <div className="mt-8 bg-white p-6 rounded-lg shadow">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold">AI Campaign Insights</h3>
        <button
          onClick={generateInsights}
          disabled={loading}
          className={`px-4 py-2 rounded ${
            loading
              ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-purple-600 hover:bg-purple-700 text-white'
          }`}
        >
          {loading ? 'Analyzing...' : 'Generate Insights'}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 text-red-700 rounded">
          {error}
        </div>
      )}

      {insights && (
        <div className="space-y-4">
          {/* Performance Summary */}
          <div className="p-4 bg-purple-50 rounded">
            <h4 className="font-semibold mb-2">Performance Summary</h4>
            <p className="text-gray-700">{insights.summary}</p>
          </div>

          {/* Key Findings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {insights.findings.map((finding, index) => (
              <div key={index} className="p-4 bg-gray-50 rounded">
                <h5 className="font-semibold mb-2">{finding.title}</h5>
                <p className="text-gray-600">{finding.description}</p>
              </div>
            ))}
          </div>

          {/* Recommendations */}
          <div className="p-4 bg-blue-50 rounded">
            <h4 className="font-semibold mb-2">Recommendations</h4>
            <ul className="list-disc list-inside space-y-2">
              {insights.recommendations.map((rec, index) => (
                <li key={index} className="text-gray-700">{rec}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIAnalytics; 