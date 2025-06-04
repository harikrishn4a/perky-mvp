import React, { useState, useEffect } from 'react';
import CampaignForm from "./components/CampaignForm";
import ClaimPage from "./components/ClaimPage";
import Dashboard from "./components/Dashboard";
import { initializeProvider } from "./utils/contract";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4">
          <h2 className="font-bold">Something went wrong.</h2>
          <p>Please refresh the page and try again.</p>
        </div>
      );
    }

    return this.props.children;
  }
}

const App = () => {
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [error, setError] = useState(null);
  const [account, setAccount] = useState(null);
  const [networkName, setNetworkName] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);

  const connectWallet = async () => {
    if (isConnecting) return;
    
    setIsConnecting(true);
    setError(null);

    try {
      // Check if MetaMask is installed
      if (typeof window.ethereum === 'undefined') {
        throw new Error("Please install MetaMask to use this application");
      }

      const { address, networkName } = await initializeProvider();
      setAccount(address);
      setNetworkName(networkName);
      setIsWalletConnected(true);
    } catch (err) {
      console.error('Wallet connection error:', err);
      setError(err.message);
      setIsWalletConnected(false);
      setAccount(null);
      setNetworkName(null);
    } finally {
      setIsConnecting(false);
    }
  };

  const openMetaMaskManually = () => {
    if (typeof window.ethereum !== 'undefined') {
      window.ethereum.request({
        method: 'eth_requestAccounts',
        params: [{ eth_accounts: {} }]
      }).then(() => {
        connectWallet();
      }).catch(console.error);
    }
  };

  useEffect(() => {
    const setupWallet = async () => {
      if (typeof window.ethereum === 'undefined') {
        setError("Please install MetaMask to use this application");
        return;
      }

      // Set up event listeners
      const handleAccountsChanged = async (accounts) => {
        if (accounts.length === 0) {
          setIsWalletConnected(false);
          setAccount(null);
          setNetworkName(null);
          setError("Please connect your wallet");
        } else {
          await connectWallet();
        }
      };

      const handleChainChanged = () => {
        window.location.reload();
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      // Check if already connected
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          await connectWallet();
        }
      } catch (err) {
        console.error("Error checking initial connection:", err);
      }

      return () => {
        if (window.ethereum.removeListener) {
          window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
          window.ethereum.removeListener('chainChanged', handleChainChanged);
        }
      };
    };

    setupWallet();
  }, []);

  return (
    <ErrorBoundary>
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-6">ProofPerks Dashboard</h1>
        
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
            {error}
            {error.includes("unlock") && (
              <div className="mt-2 text-sm">
                Please open MetaMask and unlock your wallet, then try connecting again.
              </div>
            )}
          </div>
        )}

        {!isWalletConnected ? (
          <div className="text-center">
            <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4">
              <p>Please connect your MetaMask wallet to continue.</p>
              <p className="text-sm mt-2">Make sure your wallet is unlocked before connecting.</p>
            </div>
            <button 
              onClick={connectWallet}
              disabled={isConnecting}
              className={`${
                isConnecting 
                  ? 'bg-blue-300 cursor-not-allowed' 
                  : 'bg-blue-500 hover:bg-blue-700 cursor-pointer'
              } text-white font-bold py-2 px-4 rounded transition-colors duration-200`}
            >
              {isConnecting ? 'Connecting...' : 'Connect Wallet'}
            </button>
          </div>
        ) : (
          <div>
            <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4">
              <div>Connected: {account && `${account.slice(0, 6)}...${account.slice(-4)}`}</div>
              {networkName && <div className="text-sm">Network: {networkName}</div>}
            </div>
            <div className="grid gap-6">
              <ErrorBoundary>
                <CampaignForm />
              </ErrorBoundary>
              <ErrorBoundary>
                <ClaimPage />
              </ErrorBoundary>
              <ErrorBoundary>
                <Dashboard />
              </ErrorBoundary>
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
};

export default App;