import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  User,
  ShoppingBag,
  MapPin,
  CreditCard,
  Bell,
  Settings,
  LogOut,
  ChevronRight,
  LogIn,
  Moon,
  Sun,
} from 'lucide-react-native';
import { useNotifications } from '../NotificationContext';
import { useTheme, getThemeColors } from '../ThemeContext';

const menuItems = [
  { icon: ShoppingBag, label: 'My Orders', color: '#059669', route: '/my-orders' },
  { icon: MapPin, label: 'Delivery Addresses', color: '#3B82F6', route: '/delivery-address' },
  { icon: CreditCard, label: 'Payment Methods', color: '#8B5CF6', route: null },
  { icon: Bell, label: 'Notifications', color: '#EF4444', route: '/notifications' },
];

export default function ProfileScreen() {
  const { unreadUserCount, clearAllNotifications } = useNotifications();
  const { isDarkMode, toggleTheme } = useTheme();
  const colors = getThemeColors(isDarkMode);

  const handleLogout = async () => {
    // Clear login state
    global.isLoggedIn = false;
    global.isAdmin = false;

    // Clear login state from AsyncStorage
    await AsyncStorage.removeItem('isLoggedIn');
    await AsyncStorage.removeItem('isAdmin');
    
    // Clear user notifications from state and AsyncStorage
    await clearAllNotifications(false);
    
    // Also remove user notifications from AsyncStorage directly as a fallback
    await AsyncStorage.removeItem('userNotifications');

    // Redirect to the login page
    router.replace('/login');
  };

  const handleLogin = () => {
    // Redirect to the login page
    router.replace('/login');
  };

  // Handle menu item press
  const handleMenuItemPress = (route: string | null) => {
    if (route) {
      // Special handling for notifications to ensure proper navigation
      if (route === '/notifications') {
        // Use push instead of replace to maintain navigation history
        router.push({
          pathname: route,
          // Add a unique parameter to ensure it's treated as a new navigation
          params: { from: 'profile', t: Date.now() }
        });
      } else {
        router.push(route);
      }
    } else {
      // For items without routes yet, show a coming soon message
      alert('This feature is coming soon!');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View style={styles.profileInfo}>
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <User size={32} color="#FFFFFF" />
          </View>
          <View>
            <Text style={[styles.name, { color: colors.text }]}>John Doe</Text>
            <Text style={[styles.email, { color: colors.secondaryText }]}>user@example.com</Text>
          </View>
        </View>
      </View>

      <View style={[styles.menu, { backgroundColor: colors.card, marginTop: 20 }]}>
        {menuItems.map((item) => (
          <TouchableOpacity 
            key={item.label} 
            style={styles.menuItem}
            onPress={() => handleMenuItemPress(item.route)}
          >
            <View style={styles.menuItemLeft}>
              <View style={[styles.iconContainer, { backgroundColor: item.color }]}>
                <item.icon size={20} color="#FFFFFF" />
                {item.label === 'Notifications' && unreadUserCount > 0 && (
                  <View style={styles.notificationBadge}>
                    <Text style={styles.notificationBadgeText}>
                      {unreadUserCount > 9 ? '9+' : unreadUserCount}
                    </Text>
                  </View>
                )}
              </View>
              <Text style={[styles.menuItemLabel, { color: colors.text }]}>{item.label}</Text>
            </View>
            <ChevronRight size={20} color={colors.secondaryText} />
          </TouchableOpacity>
        ))}

        {/* Dark Mode Toggle */}
        <View style={styles.menuItem}>
          <View style={styles.menuItemLeft}>
            <View style={[styles.iconContainer, { backgroundColor: isDarkMode ? '#FBBF24' : '#6B7280' }]}>
              {isDarkMode ? (
                <Sun size={20} color="#FFFFFF" />
              ) : (
                <Moon size={20} color="#FFFFFF" />
              )}
            </View>
            <Text style={[styles.menuItemLabel, { color: colors.text }]}>Dark Mode</Text>
          </View>
          <Switch
            value={isDarkMode}
            onValueChange={toggleTheme}
            trackColor={{ false: colors.border, true: `${colors.primary}80` }}
            thumbColor={isDarkMode ? colors.primary : colors.secondaryText}
          />
        </View>

        {/* Settings Button */}
        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => alert('More settings coming soon!')}
        >
          <View style={styles.menuItemLeft}>
            <View style={[styles.iconContainer, { backgroundColor: '#6B7280' }]}>
              <Settings size={20} color="#FFFFFF" />
            </View>
            <Text style={[styles.menuItemLabel, { color: colors.text }]}>Settings</Text>
          </View>
          <ChevronRight size={20} color={colors.secondaryText} />
        </TouchableOpacity>
      </View>

      {global.isLoggedIn ? (
        // Show Logout button if the user is logged in
        <TouchableOpacity 
          style={[styles.logoutButton, { backgroundColor: isDarkMode ? '#FEE2E220' : '#FEE2E2' }]} 
          onPress={handleLogout}
        >
          <LogOut size={20} color="#EF4444" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      ) : (
        // Show Login button if the user is not logged in
        <TouchableOpacity 
          style={[styles.loginButton, { backgroundColor: isDarkMode ? '#D1FAE520' : '#D1FAE5' }]} 
          onPress={handleLogin}
        >
          <LogIn size={20} color="#059669" />
          <Text style={styles.loginText}>Login</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  email: {
    fontSize: 14,
    marginTop: 4,
  },
  menu: {
    paddingVertical: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuItemLabel: {
    fontSize: 16,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 20,
    padding: 16,
    borderRadius: 12,
  },
  logoutText: {
    marginLeft: 12,
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 20,
    padding: 16,
    borderRadius: 12,
  },
  loginText: {
    marginLeft: 12,
    fontSize: 16,
    fontWeight: '600',
    color: '#059669',
  },
  notificationBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#EF4444',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
});