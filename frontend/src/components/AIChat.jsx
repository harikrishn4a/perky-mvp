import React, { useState, useRef, useEffect } from 'react';

const AIChat = ({ campaign }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initial greeting when component mounts
  useEffect(() => {
    if (campaign && messages.length === 0) {
      setMessages([{
        type: 'bot',
        content: `Hi! I'm your campaign analytics assistant. I can help you analyze the performance of "${campaign.title}" and suggest improvements. What would you like to know?`
      }]);
    }
  }, [campaign]);

  const generateResponse = (userMessage, campaignData) => {
    const message = userMessage.toLowerCase();
    
    // Performance metrics
    const conversionRate = (campaignData.claimed / campaignData.minted * 100).toFixed(1);
    const uniqueClaimers = campaignData.uniqueClaimers || 0;
    const avgClaimsPerUser = uniqueClaimers > 0 ? (campaignData.claimed / uniqueClaimers).toFixed(1) : 0;

    // Common questions and responses
    if (message.includes('how') && message.includes('improve') && message.includes('engagement')) {
      return `Based on the current metrics, here are some suggestions to improve user engagement:
1. ${uniqueClaimers < 100 ? 'Focus on expanding your user base through targeted marketing' : 'Continue building on your strong user base'}
2. ${avgClaimsPerUser < 1.5 ? 'Consider implementing a loyalty program to encourage repeat claims' : 'Your users are highly engaged, maintain this momentum'}
3. Use the campaign tags (${campaignData.tags.join(', ')}) to target relevant communities
4. ${campaignData.location ? `Expand your presence beyond ${campaignData.location}` : 'Consider location-based marketing'}`;
    }

    if (message.includes('performance') && message.includes('overall')) {
      return `The campaign is showing ${conversionRate > 70 ? 'excellent' : conversionRate > 50 ? 'good' : 'moderate'} performance:
• Conversion Rate: ${conversionRate}%
• Total Claims: ${campaignData.claimed}
• Unique Users: ${uniqueClaimers}
• Average Claims per User: ${avgClaimsPerUser}
${conversionRate < 50 ? '\nThere\'s room for improvement in conversion rates. Consider enhancing the campaign visibility and value proposition.' : '\nKeep up the good work! Consider expanding the campaign reach to maintain this momentum.'}`;
    }

    if (message.includes('metrics') || message.includes('key') || message.includes('statistics')) {
      return `Here are the key metrics for ${campaignData.title}:
1. Minting Stats:
   • Total Minted: ${campaignData.minted}
   • Total Claimed: ${campaignData.claimed}
   • Conversion Rate: ${conversionRate}%

2. User Engagement:
   • Unique Claimers: ${uniqueClaimers}
   • Avg Claims/User: ${avgClaimsPerUser}

3. Campaign Details:
   • Category: ${campaignData.category}
   • Location: ${campaignData.location}
   • Tags: ${campaignData.tags.join(', ')}`;
    }

    if (message.includes('recommend') || message.includes('suggest') || message.includes('improve')) {
      const recommendations = [];
      
      if (conversionRate < 50) {
        recommendations.push('• Enhance campaign visibility through targeted marketing');
        recommendations.push('• Clarify the value proposition of your NFT rewards');
      }
      
      if (uniqueClaimers < 100) {
        recommendations.push('• Expand reach to new user segments');
        recommendations.push('• Consider implementing referral incentives');
      }
      
      if (avgClaimsPerUser < 1.5) {
        recommendations.push('• Implement a loyalty program for repeat claims');
        recommendations.push('• Engage users through community building');
      }
      
      recommendations.push('• Monitor user feedback and adjust campaign parameters');
      recommendations.push('• Leverage campaign tags for targeted promotion');

      return `Here are my recommendations for improving the campaign:\n${recommendations.join('\n')}`;
    }

    // Default response
    return `I can help you analyze various aspects of your campaign:
• Overall performance metrics
• User engagement statistics
• Recommendations for improvement
• Key metrics and insights

What specific aspect would you like to know more about?`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { type: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const response = generateResponse(userMessage, campaign);
      setMessages(prev => [...prev, { type: 'bot', content: response }]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, {
        type: 'bot',
        content: 'Sorry, I encountered an error. Please try again.'
      }]);
    } finally {
      setLoading(false);
    }
  };

  const suggestedQuestions = [
    "How is the campaign performing overall?",
    "What are the key metrics I should focus on?",
    "How can I improve user engagement?",
    "What patterns do you see in redemption times?",
    "How does this compare to typical campaigns?"
  ];

  return (
    <div className="mt-8 bg-white rounded-lg shadow">
      {/* Chat Messages */}
      <div className="h-96 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.type === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              {message.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-800 rounded-lg p-3">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Questions */}
      {messages.length <= 2 && (
        <div className="p-4 border-t border-gray-200">
          <p className="text-sm text-gray-600 mb-2">Suggested questions:</p>
          <div className="flex flex-wrap gap-2">
            {suggestedQuestions.map((question, index) => (
              <button
                key={index}
                onClick={() => {
                  setInput(question);
                  handleSubmit({ preventDefault: () => {}, target: null });
                }}
                className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded-full"
              >
                {question}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="border-t border-gray-200 p-4">
        <div className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me anything about the campaign..."
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading}
            className={`px-4 py-2 rounded-lg ${
              loading
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
};

export default AIChat; 