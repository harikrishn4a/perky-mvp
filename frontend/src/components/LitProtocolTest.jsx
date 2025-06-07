import React, { useState } from 'react';
import { initLit } from '../utils/lit';
import { shareNFTData, getSharedUserData } from '../utils/contract';

const LitProtocolTest = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [testAddress] = useState('0x1234567890123456789012345678901234567890'); // Test address

  const handleEncryptTest = async () => {
    try {
      setLoading(true);
      setError(null);
      setResult(null);

      // Test data to encrypt
      const testData = {
        message: 'Hello, this is a test message!',
        timestamp: Date.now(),
        testArray: [1, 2, 3, 4, 5]
      };

      console.log('Initializing Lit Protocol...');
      await initLit();

      console.log('Sharing data...');
      const tx = await shareNFTData(testAddress);
      console.log('Transaction:', tx);

      setResult({
        success: true,
        message: 'Data encrypted and shared successfully!',
        txHash: tx.hash
      });
    } catch (err) {
      console.error('Encryption test error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDecryptTest = async () => {
    try {
      setLoading(true);
      setError(null);
      setResult(null);

      console.log('Initializing Lit Protocol...');
      await initLit();

      console.log('Getting shared data...');
      const decryptedData = await getSharedUserData(testAddress);
      console.log('Decrypted data:', decryptedData);

      setResult({
        success: true,
        message: 'Data decrypted successfully!',
        data: decryptedData
      });
    } catch (err) {
      console.error('Decryption test error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-lg mx-auto bg-white rounded-xl shadow-md">
      <h2 className="text-2xl font-bold mb-4">Lit Protocol Test</h2>
      
      <div className="space-y-4">
        <button
          onClick={handleEncryptTest}
          disabled={loading}
          className={`w-full py-2 px-4 rounded-md text-white font-medium ${
            loading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {loading ? 'Processing...' : 'Test Encryption'}
        </button>

        <button
          onClick={handleDecryptTest}
          disabled={loading}
          className={`w-full py-2 px-4 rounded-md text-white font-medium ${
            loading ? 'bg-green-400' : 'bg-green-600 hover:bg-green-700'
          }`}
        >
          {loading ? 'Processing...' : 'Test Decryption'}
        </button>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {result && (
          <div className="bg-green-50 border-l-4 border-green-500 p-4">
            <p className="text-green-700">{result.message}</p>
            {result.txHash && (
              <p className="text-sm text-green-600 mt-2">
                Transaction Hash: {result.txHash}
              </p>
            )}
            {result.data && (
              <pre className="mt-2 p-2 bg-gray-100 rounded overflow-auto text-sm">
                {JSON.stringify(result.data, null, 2)}
              </pre>
            )}
          </div>
        )}

        <div className="mt-4 text-sm text-gray-500">
          <p>Test Address: {testAddress}</p>
          <p className="mt-1">
            This is a test component to verify Lit Protocol integration.
            The encryption test will encrypt some test data and share it,
            while the decryption test will attempt to retrieve and decrypt the shared data.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LitProtocolTest; 