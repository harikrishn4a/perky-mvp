import React, { useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { WagmiConfig, createConfig, configureChains } from 'wagmi';
import { publicProvider } from 'wagmi/providers/public';
import { InjectedConnector } from 'wagmi/connectors/injected';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import LandingPage from './components/LandingPage';
import WalletConnect from './components/WalletConnect';
import UserDashboard from './components/UserDashboard';
import BusinessDashboard from './components/BusinessDashboard';
import CreateCampaign from './components/CreateCampaign';
import CampaignAnalytics from './components/CampaignAnalytics';
import CustomerGallery from './components/CustomerGallery';
import CampaignDetails from './components/CampaignDetails';
import OptIn from './components/OptIn';
import LitProtocolTest from './components/LitProtocolTest';

// Define XRPL EVM Sidechain
const xrplEvmSidechain = {
  id: 1440002,
  name: 'XRPL EVM Sidechain Devnet',
  network: 'xrpl-evm-sidechain',
  nativeCurrency: {
    name: 'XRP',
    symbol: 'XRP',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['https://rpc-evm-sidechain.xrpl.org'],
    },
    public: {
      http: ['https://rpc-evm-sidechain.xrpl.org'],
    },
  },
  blockExplorers: {
    default: {
      name: 'XRPL EVM Sidechain Explorer',
      url: 'https://evm-sidechain.xrpl.org/explorer',
    },
  },
};

// Configure chains & providers
const { chains, publicClient, webSocketPublicClient } = configureChains(
  [xrplEvmSidechain],
  [publicProvider()]
);

// Create wagmi config
const config = createConfig({
  autoConnect: true,
  connectors: [
    new InjectedConnector({ 
      chains,
      options: {
        name: 'MetaMask',
        shimDisconnect: true,
      },
    })
  ],
  publicClient,
  webSocketPublicClient,
});

// Create a client
const queryClient = new QueryClient();

const ProtectedRoute = ({ children }) => {
  const walletAddress = localStorage.getItem('walletAddress');
  const userRole = localStorage.getItem('userRole');

  if (!userRole) {
    return <Navigate to="/" replace />;
  }

  if (!walletAddress) {
    return <Navigate to="/connect" replace />;
  }

  return children;
};

const App = () => {
  useEffect(() => {
    // Clear any existing wallet data on fresh load
    localStorage.removeItem('walletAddress');
    localStorage.removeItem('userRole');
  }, []);

  return (
    <WagmiConfig config={config}>
      <QueryClientProvider client={queryClient}>
        <Router>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/connect" element={<WalletConnect />} />
            <Route path="/test-lit" element={<LitProtocolTest />} />
            <Route 
              path="/user/dashboard" 
              element={
                <ProtectedRoute>
                  <UserDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/discover-campaigns" 
              element={
                <ProtectedRoute>
                  <CustomerGallery />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/campaign/:id" 
              element={
                <ProtectedRoute>
                  <CampaignDetails />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/campaign/:id/opt-in" 
              element={
                <ProtectedRoute>
                  <OptIn />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/business/dashboard" 
              element={
                <ProtectedRoute>
                  <BusinessDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/business/create-campaign" 
              element={
                <ProtectedRoute>
                  <CreateCampaign />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/business/campaign/:id" 
              element={
                <ProtectedRoute>
                  <CampaignAnalytics />
                </ProtectedRoute>
              } 
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </QueryClientProvider>
    </WagmiConfig>
  );
};

export default App; 