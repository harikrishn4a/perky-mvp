import * as LitJsSdk from '@lit-protocol/lit-node-client';
import { getDataSharingConditions, getCampaignDataConditions, getAnalyticsDataConditions } from './litAccessControl';

const client = new LitJsSdk.LitNodeClient({
  litNetwork: 'custom',
  debug: true,
  minNodeCount: 2,
  bootstrapUrls: [
    'https://node-1.litnetwork.org',
    'https://node-2.litnetwork.org'
  ]
});
const chain = 'xrpl-evm'; // Using XRPL EVM chain

// Initialize Lit client
export const initLit = async () => {
  await client.connect();
  return client;
};

// Encrypt data using Lit Protocol with appropriate access conditions
export const encryptData = async (data, contractAddress, type = 'datasharing', userAddress = null, businessAddress = null) => {
  const litNodeClient = await initLit();

  // Get appropriate access control conditions based on type
  let accessControlConditions;
  switch (type) {
    case 'datasharing':
      if (!userAddress || !businessAddress) {
        throw new Error('User and business addresses required for data sharing');
      }
      accessControlConditions = getDataSharingConditions(contractAddress, userAddress, businessAddress);
      break;
    case 'campaign':
      if (!businessAddress) {
        throw new Error('Business address required for campaign data');
      }
      accessControlConditions = getCampaignDataConditions(contractAddress, businessAddress);
      break;
    case 'analytics':
      if (!businessAddress) {
        throw new Error('Business address required for analytics data');
      }
      accessControlConditions = getAnalyticsDataConditions(contractAddress, businessAddress);
      break;
    default:
      throw new Error('Invalid encryption type');
  }

  // Encrypt the data
  const { encryptedString, encryptedSymmetricKey } = await LitJsSdk.encryptString(
    JSON.stringify(data),
    litNodeClient
  );

  // Save the encrypted symmetric key with access conditions
  const encryptedKeyStore = await litNodeClient.saveEncryptionKey({
    accessControlConditions,
    encryptedSymmetricKey,
    chain: 'xrpl-evm',  // Using XRPL EVM as it's EVM compatible
  });

  return {
    encryptedData: encryptedString,
    encryptedKeyStore
  };
};

// Decrypt data using Lit Protocol
export const decryptData = async (encryptedData, encryptedKeyStore, contractAddress) => {
  const litNodeClient = await initLit();

  try {
    // Get the symmetric key
    const symmetricKey = await litNodeClient.getEncryptionKey({
      accessControlConditions: encryptedKeyStore.accessControlConditions,
      toDecrypt: encryptedKeyStore.encryptedSymmetricKey,
      chain: 'xrpl-evm',  // Using XRPL EVM as it's EVM compatible
    });

    // Decrypt the data
    const decryptedString = await LitJsSdk.decryptString(
      encryptedData,
      symmetricKey
    );

    return JSON.parse(decryptedString);
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Access denied or invalid encryption');
  }
}; 