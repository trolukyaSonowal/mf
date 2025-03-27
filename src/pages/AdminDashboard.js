import React, { useEffect } from 'react';
import InitializeData from '../components/Admin/InitializeData';
import { getVendors } from '../firebase/firestore';

const AdminDashboard = () => {
  // Check if vendors exist on load
  useEffect(() => {
    const checkVendors = async () => {
      try {
        const vendors = await getVendors();
        console.log('Admin dashboard: Found', vendors.length, 'vendors in Firestore');
      } catch (error) {
        console.error('Error checking vendors:', error);
      }
    };
    
    checkVendors();
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
      
      {/* Initialize Data Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <InitializeData />
      </div>

      {/* Other admin sections can be added here */}
    </div>
  );
};

export default AdminDashboard; 