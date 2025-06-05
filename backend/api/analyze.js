// Rule-based campaign analytics
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { campaignData } = req.body;
    const metrics = campaignData.metrics;

    // Calculate performance metrics
    const conversionRate = parseFloat(metrics.conversionRate);
    const redemptionRate = parseFloat(metrics.redemptionRate);
    const repeatUserRate = (metrics.totalClaimed - metrics.uniqueClaimers) / metrics.totalClaimed * 100;

    // Generate insights based on rules
    const insights = {
      summary: generateSummary(conversionRate, redemptionRate, metrics),
      findings: generateFindings(campaignData, metrics),
      recommendations: generateRecommendations(campaignData, metrics)
    };

    return res.status(200).json({ insights });
  } catch (error) {
    console.error('Error analyzing campaign:', error);
    return res.status(500).json({ error: 'Failed to analyze campaign' });
  }
}

function generateSummary(conversionRate, redemptionRate, metrics) {
  let performance = 'moderate';
  if (conversionRate > 70 && redemptionRate > 60) performance = 'excellent';
  else if (conversionRate > 50 && redemptionRate > 40) performance = 'good';
  else if (conversionRate < 30 || redemptionRate < 20) performance = 'needs improvement';

  return `Campaign shows ${performance} performance with a ${conversionRate}% conversion rate and ${redemptionRate}% redemption rate. ${metrics.uniqueClaimers} unique users have participated in this campaign.`;
}

function generateFindings(campaignData, metrics) {
  const findings = [];

  // User Engagement Finding
  findings.push({
    title: 'User Engagement',
    description: analyzeUserEngagement(metrics)
  });

  // Time Pattern Finding
  if (metrics.burnTimeDistribution) {
    findings.push({
      title: 'Usage Patterns',
      description: analyzeTimePatterns(metrics.burnTimeDistribution, metrics.timeToRedeem)
    });
  }

  // Location Performance
  findings.push({
    title: 'Location Analysis',
    description: `Campaign performance in ${campaignData.location} shows ${
      metrics.totalClaimed > 100 ? 'strong' : 'moderate'
    } local market penetration.`
  });

  return findings;
}

function analyzeUserEngagement(metrics) {
  const repeatRate = ((metrics.totalClaimed - metrics.uniqueClaimers) / metrics.totalClaimed * 100).toFixed(1);
  
  if (repeatRate > 20) {
    return `High user loyalty with ${repeatRate}% repeat claims, indicating strong campaign appeal.`;
  } else if (repeatRate > 10) {
    return `Moderate user retention with ${repeatRate}% repeat claims.`;
  } else {
    return `Limited repeat engagement at ${repeatRate}%, suggesting opportunity for loyalty initiatives.`;
  }
}

function analyzeTimePatterns(burnDistribution, timeToRedeem) {
  let peakTime = 'varied throughout the day';
  if (burnDistribution === 'morning') peakTime = 'concentrated in morning hours';
  else if (burnDistribution === 'afternoon') peakTime = 'highest during afternoon';
  else if (burnDistribution === 'evening') peakTime = 'peaks in evening hours';

  let redemptionSpeed = 'varied';
  if (timeToRedeem === '0-1 hour') redemptionSpeed = 'very quick';
  else if (timeToRedeem === '1-6 hours') redemptionSpeed = 'same-day';
  else if (timeToRedeem === '6-24 hours') redemptionSpeed = 'next-day';
  else redemptionSpeed = 'delayed';

  return `Usage is ${peakTime} with ${redemptionSpeed} redemption patterns.`;
}

function generateRecommendations(campaignData, metrics) {
  const recommendations = [];

  // Conversion Rate Recommendations
  if (parseFloat(metrics.conversionRate) < 50) {
    recommendations.push('Consider enhancing campaign visibility and value proposition');
    recommendations.push('Implement targeted marketing to increase claim rate');
  }

  // Redemption Rate Recommendations
  if (parseFloat(metrics.redemptionRate) < 40) {
    recommendations.push('Simplify redemption process to improve completion rate');
    recommendations.push('Send reminders to users who haven\'t redeemed their claims');
  }

  // Time-based Recommendations
  if (metrics.burnTimeDistribution) {
    recommendations.push(`Optimize campaign timing for ${metrics.burnTimeDistribution} period performance`);
  }

  // Location-based Recommendations
  if (metrics.totalClaimed < 100) {
    recommendations.push('Expand local marketing efforts to increase market penetration');
  }

  // Add general recommendations
  recommendations.push('Monitor user feedback and adjust campaign parameters accordingly');
  recommendations.push('Consider implementing a loyalty program for repeat customers');

  return recommendations;
} 