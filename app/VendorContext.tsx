import React, { createContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { collection, getDocs } from 'firebase/firestore';
import { db } from './firebaseConfig';

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
  refreshVendors: () => Promise<void>;
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
  refreshVendors: async () => {}
});

export const VendorProvider = ({ children }: VendorProviderProps) => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [currentVendor, setCurrentVendorState] = useState<Vendor | null>(null);

  // Function to load vendors from Firestore
  const loadVendorsFromFirestore = async () => {
    try {
      console.log('Loading vendors from Firestore...');
      const vendorsSnapshot = await getDocs(collection(db, 'vendors'));
      
      if (!vendorsSnapshot.empty) {
        const vendorsList = vendorsSnapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name || '',
          email: doc.data().email || '',
          phone: doc.data().phone || '',
          logo: doc.data().logoUrl || '',
          address: doc.data().address || '',
          description: doc.data().description || '',
          rating: doc.data().rating || 0,
          isVerified: true, // Set all vendors as verified by default
          joinDate: doc.data().createdAt ? new Date(doc.data().createdAt.toDate()).toISOString() : new Date().toISOString(),
          categories: doc.data().categories || []
        }));
        
        console.log(`Found ${vendorsList.length} vendors in Firestore`);
        setVendors(vendorsList);
        
        // Save to AsyncStorage as backup
        await AsyncStorage.setItem('vendors', JSON.stringify(vendorsList));
      } else {
        console.log('No vendors found in Firestore, checking AsyncStorage');
        const storedVendors = await AsyncStorage.getItem('vendors');
        
        if (storedVendors) {
          console.log('Loading vendors from AsyncStorage');
          setVendors(JSON.parse(storedVendors));
        } else {
          console.log('No vendors found in AsyncStorage either');
          setVendors([]);
        }
      }
    } catch (error) {
      console.error('Error loading vendors from Firestore:', error);
      
      // Fallback to AsyncStorage
      try {
        const storedVendors = await AsyncStorage.getItem('vendors');
        if (storedVendors) {
          console.log('Falling back to AsyncStorage for vendors');
          setVendors(JSON.parse(storedVendors));
        }
      } catch (asyncError) {
        console.error('Error loading vendors from AsyncStorage (fallback):', asyncError);
      }
    }
  };
  
  // Load vendors from Firestore when the component mounts
  useEffect(() => {
    loadVendorsFromFirestore();
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
  
  // Function to manually refresh vendors from Firestore
  const refreshVendors = async () => {
    await loadVendorsFromFirestore();
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
        refreshVendors
      }}
    >
      {children}
    </VendorContext.Provider>
  );
}; 