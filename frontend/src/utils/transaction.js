import { ethers } from 'ethers';

// Function to properly encode transaction data
export const encodeMintProofData = (to, campaignId, encryptedData = null) => {
  try {
    // Create interface fragment for mintProof function
    const functionFragment = "function mintProof(address _to, uint256 _campaignId, bytes calldata _encryptedData)";
    const iface = new ethers.Interface([functionFragment]);
    
    // Ensure campaignId is a BigInt
    const bigIntCampaignId = ethers.getBigInt(campaignId);
    
    // If no encrypted data provided, create minimal valid bytes
    const encodedData = encryptedData || ethers.toUtf8Bytes(JSON.stringify({
      timestamp: Date.now(),
      userAddress: to
    }));

    // Convert to hex string if it's not already
    const hexData = ethers.isHexString(encodedData) 
      ? encodedData 
      : ethers.hexlify(encodedData);
    
    // Encode function data
    return iface.encodeFunctionData("mintProof", [
      to,
      bigIntCampaignId,
      hexData
    ]);
  } catch (error) {
    console.error('Error encoding transaction data:', error);
    throw new Error('Failed to encode transaction data: ' + error.message);
  }
};

// Function to validate and format transaction parameters
export const validateAndFormatTxParams = async (params) => {
  try {
    // Validate address
    if (!ethers.isAddress(params.to)) {
      throw new Error('Invalid recipient address');
    }

    // Validate and convert campaign ID
    const campaignId = ethers.getBigInt(params.campaignId);
    if (campaignId < 0) {
      throw new Error('Invalid campaign ID');
    }

    // Prepare encrypted data
    let encryptedData = params.encryptedData;
    if (!encryptedData) {
      // Create minimal valid bytes if no data provided
      const defaultData = {
        timestamp: Date.now(),
        userAddress: params.to
      };
      encryptedData = ethers.hexlify(ethers.toUtf8Bytes(JSON.stringify(defaultData)));
    } else if (!ethers.isHexString(encryptedData)) {
      // Convert to hex if not already
      encryptedData = ethers.hexlify(
        typeof encryptedData === 'string' 
          ? ethers.toUtf8Bytes(encryptedData)
          : encryptedData
      );
    }

    // Format gas parameters
    const gasLimit = params.gasLimit || ethers.getBigInt(200000);
    const gasPrice = params.gasPrice || ethers.parseUnits("25", "gwei");

    return {
      to: params.to,
      campaignId,
      encryptedData,
      gasLimit,
      gasPrice
    };
  } catch (error) {
    console.error('Error validating transaction parameters:', error);
    throw error;
  }
};

// Function to estimate transaction cost
export const estimateTransactionCost = async (gasLimit, gasPrice) => {
  try {
    const gasCost = gasLimit * gasPrice;
    return {
      gasCost,
      gasCostInEther: ethers.formatEther(gasCost),
      gasLimit: gasLimit.toString(),
      gasPrice: ethers.formatUnits(gasPrice, "gwei") + " gwei"
    };
  } catch (error) {
    console.error('Error estimating transaction cost:', error);
    throw error;
  }
};

// Function to decode transaction error
export const decodeTransactionError = (error) => {
  try {
    // Common error patterns
    if (error.code === 'ACTION_REJECTED') {
      return {
        type: 'user_rejection',
        message: 'Transaction was rejected by the user'
      };
    }

    if (error.message.includes('insufficient funds')) {
      return {
        type: 'insufficient_funds',
        message: 'Insufficient funds for gas'
      };
    }

    if (error.message.includes('nonce too low')) {
      return {
        type: 'nonce_error',
        message: 'Transaction nonce is too low. Please reset your wallet.'
      };
    }

    // Try to decode custom error data if present
    if (error.data) {
      try {
        const iface = new ethers.Interface([
          "error AlreadyClaimed(address user, uint256 campaignId)",
          "error CampaignExpired(uint256 campaignId, uint256 expiryTime)",
          "error InvalidCampaign(uint256 campaignId)"
        ]);
        const decodedError = iface.parseError(error.data);
        return {
          type: decodedError.name,
          message: `Contract error: ${decodedError.name}`,
          data: decodedError.args
        };
      } catch (decodeError) {
        // If we can't decode the error, return the original error
        return {
          type: 'contract_error',
          message: error.message
        };
      }
    }

    // Default error handling
    return {
      type: 'unknown_error',
      message: error.message
    };
  } catch (error) {
    console.error('Error decoding transaction error:', error);
    return {
      type: 'decode_error',
      message: 'Failed to decode error message'
    };
  }
}; 