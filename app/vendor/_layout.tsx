import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useProfile } from '../ProfileContext';

export default function VendorLayout() {
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const { userProfile } = useProfile();

  useEffect(() => {
    // Check if user is a vendor
    const checkVendorStatus = () => {
      if (!userProfile.isLoggedIn || !userProfile.isVendor) {
        // Instead of immediate navigation, set state
        setIsAuthorized(false);
      } else {
        setIsAuthorized(true);
      }
    };
    
    checkVendorStatus();
  }, [userProfile]);

  // Handle navigation after component is mounted
  useEffect(() => {
    if (isAuthorized === false) {
      // Navigate only after the component is mounted and we know user is not authorized
      router.replace('/login');
    }
  }, [isAuthorized]);

  // Show loading while checking authorization
  if (isAuthorized === null) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#059669" />
      </View>
    );
  }

  // Only render the Stack if user is authorized
  if (isAuthorized) {
    return (
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="dashboard" />
        <Stack.Screen name="products" />
        <Stack.Screen name="orders" />
        <Stack.Screen name="order-details" />
        <Stack.Screen name="add-product" />
        <Stack.Screen name="edit-product" />
        <Stack.Screen name="profile" />
        <Stack.Screen name="analytics" />
      </Stack>
    );
  }

  // Return empty view while redirecting
  return null;
} 