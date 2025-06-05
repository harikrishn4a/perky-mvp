import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, campaignData, history } = req.body;

    // Format the context for the AI
    const context = `You are an expert marketing analytics assistant analyzing an NFT marketing campaign.

Campaign Details:
- Title: ${campaignData.title}
- Category: ${campaignData.category}
- Location: ${campaignData.location}
- Tags: ${campaignData.tags.join(', ')}

Current Metrics:
- Unique Claimers: ${campaignData.metrics.uniqueClaimers}
- Total Minted: ${campaignData.metrics.totalMinted}
- Total Claimed: ${campaignData.metrics.totalClaimed}
- Total Burned: ${campaignData.metrics.totalBurned}
- Conversion Rate: ${campaignData.metrics.conversionRate}%
- Redemption Rate: ${campaignData.metrics.redemptionRate}%
- Time to Redeem: ${campaignData.metrics.timeToRedeem || 'N/A'}
- Burn Time Distribution: ${campaignData.metrics.burnTimeDistribution || 'N/A'}

Please provide specific, data-driven insights and actionable recommendations based on these metrics.`;

    // Format chat history for the model
    const formattedHistory = history.map(msg => ({
      role: msg.role,
      parts: [msg.content]
    }));

    // Start chat
    const chat = model.startChat({
      history: formattedHistory,
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      },
    });

    // Generate response
    const result = await chat.sendMessage(`${context}\n\nUser Question: ${message}`);
    const response = result.response.text();

    return res.status(200).json({ response });
  } catch (error) {
    console.error('Chat error:', error);
    return res.status(500).json({ error: 'Failed to generate response' });
  }
} 