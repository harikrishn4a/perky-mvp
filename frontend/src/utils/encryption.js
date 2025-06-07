// Function to handle metadata storage
export const storeMetadata = async (metadata) => {
  try {
    const pinataApiKey = process.env.REACT_APP_PINATA_API_KEY;
    const pinataSecretKey = process.env.REACT_APP_PINATA_SECRET_KEY;

    if (!pinataApiKey || !pinataSecretKey) {
      throw new Error('Pinata API keys not configured');
    }

    // Convert metadata to JSON string
    const jsonString = JSON.stringify(metadata);
    
    // Create a Blob from the JSON string
    const blob = new Blob([jsonString], { type: 'application/json' });
    
    // Create FormData and append the file
    const formData = new FormData();
    formData.append('file', blob, 'metadata.json');

    // Add pinata metadata
    formData.append('pinataMetadata', JSON.stringify({
      name: `Campaign_${metadata.title}_${Date.now()}`,
      keyvalues: {
        category: metadata.category,
        createdAt: metadata.createdAt
      }
    }));

    // Add pinata options
    formData.append('pinataOptions', JSON.stringify({
      cidVersion: 1
    }));

    console.log('Uploading to Pinata...');
    
    // Make request to Pinata API
    const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${pinataSecretKey}`
      },
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Pinata Error:', errorData);
      throw new Error(`Failed to upload to Pinata: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    console.log('Pinata upload successful:', result);

    // Return the IPFS URL
    return `ipfs://${result.IpfsHash}`;
  } catch (error) {
    console.error('Error storing metadata:', error);
    throw error;
  }
};

// Upload metadata
export const uploadAndEncryptMetadata = async (metadata, businessAddress) => {
  try {
    // Store metadata on Pinata
    const ipfsUrl = await storeMetadata(metadata);
    
    return {
      metadataUrl: ipfsUrl,
      timestamp: Date.now(),
      businessAddress
    };
  } catch (error) {
    console.error('Error in uploadAndEncryptMetadata:', error);
    throw error;
  }
};

// Fetch metadata
export const fetchMetadata = async (ipfsUrl) => {
  try {
    // Convert ipfs:// URL to HTTP gateway URL
    const gateway = 'https://gateway.pinata.cloud/ipfs/';
    const ipfsHash = ipfsUrl.replace('ipfs://', '');
    const httpUrl = gateway + ipfsHash;

    const response = await fetch(httpUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch metadata: ${response.status} ${response.statusText}`);
    }

    const metadata = await response.json();
    return metadata;
  } catch (error) {
    console.error('Error fetching metadata:', error);
    throw error;
  }
}; 