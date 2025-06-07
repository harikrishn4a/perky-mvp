import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getCampaignById, getContract, hasUserClaimed, estimateGas, getCurrentGasPrice } from '../utils/contract';
import { encodeMintProofData, validateAndFormatTxParams, estimateTransactionCost, decodeTransactionError } from '../utils/transaction';
import { ethers } from 'ethers';
import { useAccount } from 'wagmi';

const ClaimPage = () => {
  const { id } = useParams();
  const { address } = useAccount();
  const [campaign, setCampaign] = useState(null);
  const [status, setStatus] = useState('');
  const [alreadyClaimed, setAlreadyClaimed] = useState(false);
  const [error, setError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transactionCost, setTransactionCost] = useState(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        console.log('Fetching campaign with ID:', id);
        const data = await getCampaignById(id);
        console.log('Received campaign data:', data);
        
        setCampaign(data);
        
        if (address) {
          const claimed = await hasUserClaimed(id, address);
          setAlreadyClaimed(claimed);
        }

        // Estimate transaction cost
        const gasLimit = await estimateGas(address || ethers.ZeroAddress, id);
        const gasPrice = await getCurrentGasPrice();
        const cost = await estimateTransactionCost(gasLimit, gasPrice);
        setTransactionCost(cost);

      } catch (e) {
        console.error("Failed to load campaign:", e);
        setError(e.message);
      }
    };
    fetch();
  }, [id, address]);

  const handleClaim = async () => {
    if (!address) {
      setStatus("❌ Please connect your wallet first");
      return;
    }

    setIsProcessing(true);
    setStatus("Preparing transaction...");
    
    try {
      // Get contract with signer
      const contract = await getContract(true);
      
      // Validate and format transaction parameters
      const txParams = await validateAndFormatTxParams({
        to: address,
        campaignId: id,
        encryptedData: "0x", // Empty bytes for now
        gasLimit: await estimateGas(address, id),
        gasPrice: await getCurrentGasPrice()
      });

      // Encode transaction data
      const data = encodeMintProofData(
        txParams.to,
        txParams.campaignId,
        txParams.encryptedData
      );

      // Send transaction
      const tx = await contract.mintProof(
        txParams.to,
        txParams.campaignId,
        txParams.encryptedData,
        {
          gasLimit: txParams.gasLimit,
          gasPrice: txParams.gasPrice
        }
      );

      setStatus("Transaction sent! Waiting for confirmation...");
      console.log("Transaction hash:", tx.hash);

      // Wait for transaction confirmation
      const receipt = await tx.wait();
      console.log("Transaction confirmed:", receipt);

      setStatus("✅ NFT claimed successfully!");
      setAlreadyClaimed(true);

    } catch (err) {
      console.error("Claim failed:", err);
      
      // Decode and handle error
      const decodedError = decodeTransactionError(err);
      setStatus(`❌ ${decodedError.message}`);
      
      if (decodedError.type === 'already_claimed') {
        setAlreadyClaimed(true);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  if (error) {
    return (
      <div className="p-6 text-center">
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4">
          Error loading campaign: {error}
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="p-6 text-center">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mx-auto mb-4"></div>
          <div className="h-48 bg-gray-200 rounded w-96 mx-auto mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 text-center">
      <h2 className="text-xl font-bold mb-4">{campaign.title}</h2>
      
      {/* Image with fallback */}
      {campaign.imageUrl ? (
        <img
          src={campaign.imageUrl}
          alt={campaign.title}
          className="mx-auto h-48 w-auto object-cover rounded shadow-md"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = 'https://placehold.co/400x300?text=No+Image';
          }}
        />
      ) : (
        <div className="mx-auto h-48 w-96 bg-gray-100 flex items-center justify-center rounded shadow-md">
          <span className="text-gray-400">No Image Available</span>
        </div>
      )}

      <div className="mt-6 space-y-4">
        {campaign.category && (
          <div className="text-sm text-gray-600">
            Category: {campaign.category}
          </div>
        )}

        <p className="text-gray-700">{campaign.reward}</p>
        
        {campaign.location && (
          <div className="text-sm text-gray-600">
            📍 {campaign.location}
          </div>
        )}
        
        {campaign.expiry && (
          <div className="text-sm text-gray-600">
            Expires: {campaign.expiry}
          </div>
        )}

        {campaign.tags && campaign.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 justify-center">
            {campaign.tags.map((tag, index) => (
              <span key={index} className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-sm">
                {tag}
              </span>
            ))}
          </div>
        )}

        {transactionCost && (
          <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
            Estimated gas cost: {transactionCost.gasCostInEther} XRP
            <br />
            Gas price: {transactionCost.gasPrice}
          </div>
        )}

        {!address ? (
          <div className="text-yellow-600 bg-yellow-50 p-3 rounded">
            Please connect your wallet to claim this NFT
          </div>
        ) : alreadyClaimed ? (
          <div className="bg-green-100 text-green-800 px-4 py-2 rounded">
            Already claimed
          </div>
        ) : (
          <button
            onClick={handleClaim}
            disabled={isProcessing}
            className={`mt-4 px-6 py-2 rounded ${
              isProcessing
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            } text-white font-medium transition-colors`}
          >
            {isProcessing ? "Processing..." : "Claim NFT"}
          </button>
        )}

        {status && (
          <div className={`mt-4 p-3 rounded ${
            status.includes("✅") ? "bg-green-100 text-green-800" : 
            status.includes("❌") ? "bg-red-100 text-red-800" :
            "bg-blue-100 text-blue-800"
          }`}>
            {status}
          </div>
        )}
      </div>
    </div>
  );
};

export default ClaimPage;