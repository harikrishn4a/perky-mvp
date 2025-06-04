import React from 'react';

const Dashboard = () => {
  return (
    <div className="p-4 border rounded shadow">
      <h2 className="text-lg font-semibold mb-4">Analytics Dashboard</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded shadow">
          <h3 className="font-medium mb-2">Total Campaigns</h3>
          <p className="text-2xl font-bold">0</p>
        </div>
        <div className="p-4 bg-white rounded shadow">
          <h3 className="font-medium mb-2">Total NFTs Claimed</h3>
          <p className="text-2xl font-bold">0</p>
        </div>
        <div className="p-4 bg-white rounded shadow">
          <h3 className="font-medium mb-2">Active Users</h3>
          <p className="text-2xl font-bold">0</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;