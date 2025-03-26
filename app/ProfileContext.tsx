import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface UserProfile {
  userId: string;
  email?: string;
  phone?: string;
  name?: string;
  isLoggedIn: boolean;
  isAdmin: boolean;
  isVendor: boolean;
  vendorId?: string;
}

interface ProfileContextType {
  userProfile: UserProfile;
  setUserProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  logout: () => Promise<void>;
}

const defaultProfile: UserProfile = {
  userId: '',
  isLoggedIn: false,
  isAdmin: false,
  isVendor: false,
};

export const ProfileContext = createContext<ProfileContextType>({
  userProfile: defaultProfile,
  setUserProfile: () => {},
  updateProfile: async () => {},
  logout: async () => {},
});

export const ProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userProfile, setUserProfile] = useState<UserProfile>(defaultProfile);
  const [isLoading, setIsLoading] = useState(true);

  // Load profile from AsyncStorage on mount
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const isLoggedIn = await AsyncStorage.getItem('isLoggedIn');
        if (isLoggedIn === 'true') {
          const userId = await AsyncStorage.getItem('userId');
          const isAdmin = await AsyncStorage.getItem('isAdmin');
          const isVendor = await AsyncStorage.getItem('isVendor');
          const vendorId = await AsyncStorage.getItem('vendorId');
          const email = await AsyncStorage.getItem('userEmail');
          const phone = await AsyncStorage.getItem('userPhone');
          const name = await AsyncStorage.getItem('userName');
          
          setUserProfile({
            userId: userId || '',
            email: email || undefined,
            phone: phone || undefined,
            name: name || undefined,
            isLoggedIn: true,
            isAdmin: isAdmin === 'true',
            isVendor: isVendor === 'true',
            vendorId: vendorId || undefined,
          });
        }
      } catch (error) {
        console.error('Error loading profile:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadProfile();
  }, []);

  // Update profile in AsyncStorage and state
  const updateProfile = async (data: Partial<UserProfile>) => {
    try {
      const updatedProfile = { ...userProfile, ...data };
      
      // Save each property to AsyncStorage
      if (data.userId !== undefined) {
        await AsyncStorage.setItem('userId', data.userId);
      }
      
      if (data.email !== undefined) {
        await AsyncStorage.setItem('userEmail', data.email);
      }
      
      if (data.phone !== undefined) {
        await AsyncStorage.setItem('userPhone', data.phone);
      }
      
      if (data.name !== undefined) {
        await AsyncStorage.setItem('userName', data.name);
      }
      
      if (data.isLoggedIn !== undefined) {
        await AsyncStorage.setItem('isLoggedIn', data.isLoggedIn.toString());
      }
      
      if (data.isAdmin !== undefined) {
        await AsyncStorage.setItem('isAdmin', data.isAdmin.toString());
      }
      
      if (data.isVendor !== undefined) {
        await AsyncStorage.setItem('isVendor', data.isVendor.toString());
      }
      
      if (data.vendorId !== undefined) {
        await AsyncStorage.setItem('vendorId', data.vendorId);
      }
      
      setUserProfile(updatedProfile);
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  // Logout - clear profile data
  const logout = async () => {
    try {
      // Clear all profile data from AsyncStorage
      await AsyncStorage.removeItem('isLoggedIn');
      await AsyncStorage.removeItem('userId');
      await AsyncStorage.removeItem('userEmail');
      await AsyncStorage.removeItem('userPhone');
      await AsyncStorage.removeItem('userName');
      await AsyncStorage.removeItem('isAdmin');
      await AsyncStorage.removeItem('isVendor');
      await AsyncStorage.removeItem('vendorId');
      await AsyncStorage.removeItem('currentVendor');
      
      // Reset state
      setUserProfile(defaultProfile);
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  return (
    <ProfileContext.Provider
      value={{
        userProfile,
        setUserProfile,
        updateProfile,
        logout,
      }}
    >
      {!isLoading && children}
    </ProfileContext.Provider>
  );
};

// Custom hook to use the profile context
export const useProfile = () => useContext(ProfileContext); 