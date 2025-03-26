import React, { createContext, useState, ReactNode, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define the Vendor interface
export interface Vendor {
  id: string;
  name: string;
  email: string;
  phone: string;
  logo: string;
  address: string;
  description: string;
  rating: number;
  isVerified: boolean;
  joinDate: string;
  categories: string[];
  bankDetails?: {
    accountName: string;
    accountNumber: string;
    bankName: string;
    ifscCode: string;
  };
}

interface VendorContextType {
  vendors: Vendor[];
  currentVendor: Vendor | null;
  addVendor: (vendor: Omit<Vendor, 'id'>) => Vendor;
  updateVendor: (id: string, updates: Partial<Vendor>) => void;
  deleteVendor: (id: string) => void;
  verifyVendor: (id: string) => void;
  getVendorById: (id: string) => Vendor | undefined;
  setCurrentVendor: (vendorId: string | null) => void;
}

interface VendorProviderProps {
  children: ReactNode;
}

export const VendorContext = createContext<VendorContextType>({
  vendors: [],
  currentVendor: null,
  addVendor: () => ({ id: '', name: '', email: '', phone: '', logo: '', address: '', description: '', rating: 0, isVerified: false, joinDate: '', categories: [] }),
  updateVendor: () => {},
  deleteVendor: () => {},
  verifyVendor: () => {},
  getVendorById: () => undefined,
  setCurrentVendor: () => {},
});

export const VendorProvider = ({ children }: VendorProviderProps) => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [currentVendor, setCurrentVendorState] = useState<Vendor | null>(null);

  // Load vendors from AsyncStorage when the component mounts
  useEffect(() => {
    const loadVendors = async () => {
      try {
        const storedVendors = await AsyncStorage.getItem('vendors');
        if (storedVendors) {
          setVendors(JSON.parse(storedVendors));
        } else {
          // Initialize with some sample vendors if none exist
          const initialVendors = [
            {
              id: 'vendor1',
              name: 'Fresh Farms',
              email: 'vendor1@vendor.com',
              phone: '9876543210',
              logo: 'https://images.unsplash.com/photo-1498579809087-ef1e558fd1da?auto=format&fit=crop&q=80&w=300',
              address: '123 Farm Road, Green Valley',
              description: 'We provide fresh organic produce directly from our farms.',
              rating: 4.8,
              isVerified: true,
              joinDate: new Date().toISOString(),
              categories: ['Fruits', 'Vegetables', 'Organic'],
            },
            {
              id: 'vendor2',
              name: 'Dairy Delight',
              email: 'vendor2@vendor.com',
              phone: '9876543211',
              logo: 'https://images.unsplash.com/photo-1634301295749-9c69478a9204?auto=format&fit=crop&q=80&w=300',
              address: '456 Milk Way, Cream County',
              description: 'Premium dairy products from grass-fed cows.',
              rating: 4.6,
              isVerified: true,
              joinDate: new Date().toISOString(),
              categories: ['Dairy', 'Organic'],
            },
            {
              id: 'vendor3',
              name: 'Bake House',
              email: 'vendor3@vendor.com',
              phone: '9876543212',
              logo: 'https://images.unsplash.com/photo-1515823662972-da6a2ab7040e?auto=format&fit=crop&q=80&w=300',
              address: '789 Wheat Street, Flour City',
              description: 'Freshly baked breads and pastries every day.',
              rating: 4.5,
              isVerified: true,
              joinDate: new Date().toISOString(),
              categories: ['Bakery'],
            }
          ];
          setVendors(initialVendors);
          await AsyncStorage.setItem('vendors', JSON.stringify(initialVendors));
        }
      } catch (error) {
        console.error('Error loading vendors from AsyncStorage:', error);
      }
    };

    loadVendors();
  }, []);

  // Load current vendor if logged in as vendor
  useEffect(() => {
    const loadCurrentVendor = async () => {
      try {
        const isVendor = await AsyncStorage.getItem('isVendor');
        console.log('VendorContext: isVendor from AsyncStorage:', isVendor);
        
        if (isVendor === 'true') {
          const vendorId = await AsyncStorage.getItem('vendorId');
          console.log('VendorContext: vendorId from AsyncStorage:', vendorId);
          
          if (vendorId) {
            const vendor = vendors.find(v => v.id === vendorId);
            console.log('VendorContext: Found vendor?', !!vendor);
            
            if (vendor) {
              console.log('VendorContext: Setting current vendor:', vendor.name);
              setCurrentVendorState(vendor);
              
              // Save the current vendor to AsyncStorage for persistence
              await AsyncStorage.setItem('currentVendor', JSON.stringify(vendor));
            } else {
              console.error('VendorContext: Vendor not found with ID:', vendorId);
              // Try to load from AsyncStorage directly as a fallback
              const storedVendor = await AsyncStorage.getItem('currentVendor');
              if (storedVendor) {
                const parsedVendor = JSON.parse(storedVendor);
                console.log('VendorContext: Loaded vendor from backup:', parsedVendor.name);
                setCurrentVendorState(parsedVendor);
              }
            }
          }
        }
      } catch (error) {
        console.error('Error loading current vendor:', error);
      }
    };

    loadCurrentVendor();
  }, [vendors]);

  // Save vendors to AsyncStorage whenever they change
  useEffect(() => {
    const saveVendors = async () => {
      try {
        await AsyncStorage.setItem('vendors', JSON.stringify(vendors));
      } catch (error) {
        console.error('Error saving vendors to AsyncStorage:', error);
      }
    };

    saveVendors();
  }, [vendors]);

  // Function to add a new vendor
  const addVendor = (newVendor: Omit<Vendor, 'id'>) => {
    // Generate a unique ID for the new vendor
    const id = `vendor${Date.now()}`;
    const vendorWithId = { ...newVendor, id };
    
    setVendors(prevVendors => [...prevVendors, vendorWithId]);
    
    return vendorWithId;
  };

  // Function to update a vendor
  const updateVendor = (id: string, updates: Partial<Vendor>) => {
    setVendors(prevVendors => 
      prevVendors.map(vendor => 
        vendor.id === id ? { ...vendor, ...updates } : vendor
      )
    );
    
    // Update current vendor if it's the one being updated
    if (currentVendor && currentVendor.id === id) {
      setCurrentVendorState(prev => prev ? { ...prev, ...updates } : null);
    }
  };

  // Function to delete a vendor
  const deleteVendor = (id: string) => {
    setVendors(prevVendors => 
      prevVendors.filter(vendor => vendor.id !== id)
    );
    
    // Clear current vendor if it's the one being deleted
    if (currentVendor && currentVendor.id === id) {
      setCurrentVendorState(null);
    }
  };

  // Function to verify a vendor
  const verifyVendor = (id: string) => {
    updateVendor(id, { isVerified: true });
  };

  // Function to get a vendor by ID
  const getVendorById = (id: string) => {
    return vendors.find(vendor => vendor.id === id);
  };

  // Function to set the current vendor
  const setCurrentVendor = (vendorId: string | null) => {
    if (vendorId) {
      const vendor = vendors.find(v => v.id === vendorId);
      setCurrentVendorState(vendor || null);
    } else {
      setCurrentVendorState(null);
    }
  };

  return (
    <VendorContext.Provider
      value={{
        vendors,
        currentVendor,
        addVendor,
        updateVendor,
        deleteVendor,
        verifyVendor,
        getVendorById,
        setCurrentVendor,
      }}
    >
      {children}
    </VendorContext.Provider>
  );
}; 