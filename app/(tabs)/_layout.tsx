import { Tabs } from 'expo-router';
import { ShoppingBag, Chrome as Home, User, ShoppingCart, Bell } from 'lucide-react-native';
import { useNotifications } from '../NotificationContext';
import { View, Text } from 'react-native';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme, getThemeColors } from '../ThemeContext';

export default function TabLayout() {
  const { unreadUserCount, unreadAdminCount } = useNotifications();
  const [isAdmin, setIsAdmin] = useState(false);
  const { isDarkMode } = useTheme();
  const colors = getThemeColors(isDarkMode);
  
  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const adminStatus = await AsyncStorage.getItem('isAdmin');
        setIsAdmin(adminStatus === 'true' || global.isAdmin === true);
      } catch (error) {
        console.error('Error checking admin status:', error);
      }
    };
    
    checkAdminStatus();
  }, []);

  const unreadCount = isAdmin ? unreadAdminCount : unreadUserCount;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.secondaryText,
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="products"
        options={{
          title: 'Products',
          tabBarIcon: ({ color, size }) => <ShoppingBag size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: 'Cart',
          tabBarIcon: ({ color, size }) => <ShoppingCart size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Notifications',
          tabBarIcon: ({ color, size }) => (
            <View>
              <Bell size={size} color={color} />
              {unreadCount > 0 && (
                <View style={{
                  position: 'absolute',
                  top: -5,
                  right: -10,
                  backgroundColor: colors.error,
                  borderRadius: 10,
                  width: 20,
                  height: 20,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}>
                  <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: 'bold' }}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Text>
                </View>
              )}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}