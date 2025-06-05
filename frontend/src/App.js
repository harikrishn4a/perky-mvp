import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import CustomerGallery from './components/CustomerGallery';
import BusinessDashboard from './components/BusinessDashboard';
import CampaignForm from './components/CampaignForm';
import CampaignAnalytics from './components/CampaignAnalytics';
import ClaimPage from './components/ClaimPage';

function App() {
  return (
    <Router>
      <div className="p-4">
        <nav className="mb-6 border-b pb-2 flex gap-4">
          <a href="/" className="text-blue-600 hover:underline">Customer Gallery</a>
          <a href="/business/create" className="text-blue-600 hover:underline">Create Campaign</a>
          <a href="/business/dashboard" className="text-blue-600 hover:underline">Business Dashboard</a>
        </nav>
        <Routes>
          <Route path="/" element={<CustomerGallery />} />
          <Route path="/business/dashboard" element={<BusinessDashboard />} />
          <Route path="/business/create" element={<CampaignForm />} />
          <Route path="/campaign/:id" element={<ClaimPage />} />
          <Route path="/business/campaign/:id" element={<CampaignAnalytics />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;