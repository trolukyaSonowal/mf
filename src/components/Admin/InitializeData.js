import React, { useState } from 'react';
import { 
  initializeCategories, 
  initializeProducts, 
  initializeNotifications, 
  initializeOrders,
  initializeUsers,
  initializeCarts
} from '../../firebase/firestore';

const InitializeData = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleInitialize = async () => {
    setLoading(true);
    setMessage('Initializing data...');
    
    try {
      await initializeUsers();
      await initializeCategories();
      await initializeProducts();
      await initializeCarts();
      await initializeOrders();
      await initializeNotifications();
      setMessage('Data initialized successfully!');
    } catch (error) {
      setMessage(`Error initializing data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Initialize Sample Data</h2>
      <p className="text-sm text-gray-600 mb-4">
        This will initialize all collections with sample data:
        <ul className="list-disc ml-6 mt-2">
          <li>Users</li>
          <li>Categories</li>
          <li>Products</li>
          <li>Carts</li>
          <li>Orders</li>
          <li>Notifications</li>
        </ul>
      </p>
      <button
        onClick={handleInitialize}
        disabled={loading}
        className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:bg-gray-400"
      >
        {loading ? 'Initializing...' : 'Initialize Sample Data'}
      </button>
      {message && (
        <p className="mt-4 text-sm text-gray-600">{message}</p>
      )}
    </div>
  );
};

export default InitializeData; 