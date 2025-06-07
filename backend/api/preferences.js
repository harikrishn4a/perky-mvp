import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const data = req.body;
    const filePath = path.resolve(process.cwd(), 'preferences.json');
    let preferences = [];
    if (fs.existsSync(filePath)) {
      const fileData = fs.readFileSync(filePath, 'utf-8');
      preferences = JSON.parse(fileData);
    }
    preferences.push(data);
    fs.writeFileSync(filePath, JSON.stringify(preferences, null, 2));
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error saving preferences:', error);
    return res.status(500).json({ error: 'Failed to save preferences' });
  }
} 