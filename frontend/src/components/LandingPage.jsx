import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const LandingPage = () => {
  const [isBusiness, setIsBusiness] = useState(false);
  const navigate = useNavigate();

  const connectWallet = async () => {
    try {
      // Request account access
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const account = accounts[0];
      
      // Store wallet address and role
      localStorage.setItem('walletAddress', account);
      localStorage.setItem('userRole', isBusiness ? 'business' : 'user');
      
      // Navigate to appropriate dashboard
      navigate(isBusiness ? '/business/dashboard' : '/user/dashboard');
    } catch (error) {
      console.error('Error connecting wallet:', error);
      alert('Please install MetaMask or allow connection to continue.');
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="container bg-white rounded-[30px] shadow-[0_5px_15px_rgba(0,0,0,0.35)] relative overflow-hidden w-full max-w-[1000px] min-h-[550px] flex">
        {/* User Panel */}
        <div className={`w-1/2 p-12 transition-transform duration-700 ease-in-out ${isBusiness ? 'translate-x-full opacity-0' : 'opacity-100'}`}>
          <div className="h-full flex flex-col">
            <img src="/logo.png" alt="ProofPerks Logo" className="h-12 mb-12" />
            <h2 className="text-3xl font-bold mb-8">Connect as User</h2>
            <div className="space-y-6">
              <p className="text-gray-600">
                Connect your wallet to earn rewards by sharing your data with businesses you trust.
              </p>
              <button
                onClick={connectWallet}
                className="w-full bg-black text-white py-4 rounded-lg font-semibold text-sm uppercase tracking-wider hover:bg-gray-800 transition-colors flex items-center justify-center space-x-3"
              >
                <img src="/metamask-fox.svg" alt="MetaMask" className="w-6 h-6" />
                <span>Connect with MetaMask</span>
              </button>
            </div>
          </div>
        </div>

        {/* Business Panel */}
        <div className={`absolute top-0 right-0 w-1/2 p-12 transition-transform duration-700 ease-in-out ${!isBusiness ? 'translate-x-full opacity-0' : 'opacity-100'}`}>
          <div className="h-full flex flex-col">
            <img src="/logo.png" alt="ProofPerks Logo" className="h-12 mb-12" />
            <h2 className="text-3xl font-bold mb-8">Connect as Business</h2>
            <div className="space-y-6">
              <p className="text-gray-600">
                Connect your wallet to create marketing campaigns and collect valuable customer data.
              </p>
              <button
                onClick={connectWallet}
                className="w-full bg-black text-white py-4 rounded-lg font-semibold text-sm uppercase tracking-wider hover:bg-gray-800 transition-colors flex items-center justify-center space-x-3"
              >
                <img src="/metamask-fox.svg" alt="MetaMask" className="w-6 h-6" />
                <span>Connect with MetaMask</span>
              </button>
            </div>
          </div>
        </div>

        {/* Toggle Container */}
        <div className={`absolute top-0 ${isBusiness ? 'left-0' : 'left-1/2'} w-1/2 h-full transition-all duration-700 ease-in-out`}>
          <div className="bg-[#0f2818] h-full w-full flex items-center justify-center p-12 text-white text-center">
            {isBusiness ? (
              <div className="space-y-6">
                <h2 className="text-4xl font-bold">Looking to Earn?</h2>
                <p className="text-lg">
                  Switch to user mode to start earning rewards by sharing your data.
                </p>
                <button
                  onClick={() => setIsBusiness(false)}
                  className="mt-4 border-2 border-white bg-transparent text-white px-12 py-3 rounded-lg font-semibold text-sm uppercase tracking-wider hover:bg-white/10 transition-colors"
                >
                  Switch to User
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <h2 className="text-4xl font-bold">Are You a Business?</h2>
                <p className="text-lg">
                  Switch to business mode to create marketing campaigns and collect valuable data.
                </p>
                <button
                  onClick={() => setIsBusiness(true)}
                  className="mt-4 border-2 border-white bg-transparent text-white px-12 py-3 rounded-lg font-semibold text-sm uppercase tracking-wider hover:bg-white/10 transition-colors"
                >
                  Switch to Business
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700&display=swap');
        
        .container {
          font-family: 'Montserrat', sans-serif;
        }
      `}</style>
    </div>
  );
};

export default LandingPage; 