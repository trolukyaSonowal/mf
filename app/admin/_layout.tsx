import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useProfile } from '../ProfileContext';

export default function AdminLayout() {
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const { userProfile } = useProfile();

  useEffect(() => {
    // Check if user is admin
    const checkAdminStatus = () => {
      if (!userProfile.isLoggedIn || !userProfile.isAdmin) {
        // Instead of immediate navigation, set state
        setIsAuthorized(false);
      } else {
        setIsAuthorized(true);
      }
    };
    
    checkAdminStatus();
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
        <Stack.Screen name="index" />
        <Stack.Screen name="add-item" />
        <Stack.Screen name="edit-item" />
        <Stack.Screen name="vendors" />
        <Stack.Screen name="orders" />
        <Stack.Screen name="order-details" />
      </Stack>
    );
  }

  // Return empty view while redirecting
  return null;
}