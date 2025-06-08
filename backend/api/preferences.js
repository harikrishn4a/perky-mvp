import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const { walletAddress, campaignId } = req.query;
      if (!walletAddress || !campaignId) {
        return res.status(400).json({ error: 'Wallet address and campaign ID are required' });
      }

      const filePath = path.resolve(process.cwd(), 'preferences.json');
      if (!fs.existsSync(filePath)) {
        return res.status(200).json({ hasShared: false });
      }

      const fileData = fs.readFileSync(filePath, 'utf-8');
      const preferences = JSON.parse(fileData);
      
      const hasShared = preferences.some(pref => 
        pref.walletAddress.toLowerCase() === walletAddress.toLowerCase() && 
        pref.campaignId === campaignId
      );

      return res.status(200).json({ hasShared });
    } catch (error) {
      console.error('Error checking preferences:', error);
      return res.status(500).json({ error: 'Failed to check preferences' });
    }
  }

  if (req.method === 'POST') {
    try {
      const data = req.body;
      
      // Validate required fields
      if (!data.walletAddress || !data.campaignId) {
        return res.status(400).json({ error: 'Wallet address and campaign ID are required' });
      }

      const filePath = path.resolve(process.cwd(), 'preferences.json');
      let preferences = [];
      
      if (fs.existsSync(filePath)) {
        const fileData = fs.readFileSync(filePath, 'utf-8');
        preferences = JSON.parse(fileData);
        
        // Check for existing preferences
        const hasShared = preferences.some(pref => 
          pref.walletAddress.toLowerCase() === data.walletAddress.toLowerCase() && 
          pref.campaignId === data.campaignId
        );

        if (hasShared) {
          return res.status(400).json({ error: 'Preferences already shared for this campaign' });
        }
      }

      // Add timestamp
      data.timestamp = new Date().toISOString();
      
      preferences.push(data);
      fs.writeFileSync(filePath, JSON.stringify(preferences, null, 2));
      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error saving preferences:', error);
      return res.status(500).json({ error: 'Failed to save preferences' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
} 