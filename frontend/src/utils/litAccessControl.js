// Access control conditions for different scenarios
export const getDataSharingConditions = (contractAddress, userAddress, businessAddress) => {
  return [
    {
      contractAddress,
      standardContractType: 'ProofPerks',
      chain: 'xrpl-evm',
      method: 'hasOptedIn',
      parameters: [userAddress, businessAddress],
      returnValueTest: {
        comparator: '=',
        value: 'true'
      }
    }
  ];
};

export const getCampaignDataConditions = (contractAddress, businessAddress) => {
  return [
    {
      contractAddress,
      standardContractType: 'ProofPerks',
      chain: 'xrpl-evm',
      method: 'isBusinessOwner',
      parameters: [businessAddress],
      returnValueTest: {
        comparator: '=',
        value: 'true'
      }
    }
  ];
};

export const getAnalyticsDataConditions = (contractAddress, businessAddress) => {
  return [
    {
      contractAddress,
      standardContractType: 'ProofPerks',
      chain: 'xrpl-evm',
      method: 'hasAnalyticsAccess',
      parameters: [businessAddress],
      returnValueTest: {
        comparator: '=',
        value: 'true'
      }
    }
  ];
}; 