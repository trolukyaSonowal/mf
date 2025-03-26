import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, Bell, Trash2, CheckCircle, Clock, Package, Truck, ShoppingBag } from 'lucide-react-native';
import { useNotifications, Notification } from './NotificationContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme, getThemeColors } from './ThemeContext';
import { useProfile } from './ProfileContext';

export default function NotificationScreen() {
  const [isAdmin, setIsAdmin] = useState(false);
  const { 
    adminNotifications, 
    userNotifications, 
    vendorNotifications,
    markAsRead, 
    markAllAsRead, 
    clearAllNotifications 
  } = useNotifications();
  const { isDarkMode } = useTheme();
  const colors = getThemeColors(isDarkMode);
  const { userProfile } = useProfile();
  const [activeTab, setActiveTab] = useState('all');

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

  // Filter notifications by user ID
  const currentUserNotifications = userNotifications.filter(notification => 
    !notification.userId || notification.userId === userProfile.userId
  );
  
  // Get appropriate notification list based on user role and tab
  const getNotifications = () => {
    if (userProfile.isAdmin) {
      return adminNotifications;
    } else if (userProfile.isVendor) {
      return vendorNotifications.filter(n => n.vendorId === userProfile.vendorId);
    } else {
      if (activeTab === 'orders') {
        return currentUserNotifications.filter(n => n.type.includes('order'));
      } else if (activeTab === 'general') {
        return currentUserNotifications.filter(n => n.type === 'general');
      } else {
        return currentUserNotifications;
      }
    }
  };
  
  const notifications = getNotifications();

  const handleNotificationPress = (notification: Notification) => {
    // Mark notification as read
    markAsRead(notification.id, userProfile.isAdmin, userProfile.isVendor);
    
    // Navigate to relevant screen based on notification type
    if (notification.type.includes('order') && notification.orderId) {
      if (userProfile.isAdmin) {
        router.push(`/admin/order-details?id=${notification.orderId}`);
      } else if (userProfile.isVendor) {
        router.push(`/vendor/order-details?id=${notification.orderId}`);
      } else {
        router.push(`/order-details?id=${notification.orderId}`);
      }
    }
  };

  const handleMarkAllAsRead = () => {
    if (userProfile.isAdmin) {
      markAllAsRead(true);
    } else if (userProfile.isVendor) {
      markAllAsRead(false, true);
    } else {
      markAllAsRead(false);
    }
    Alert.alert('Success', 'All notifications marked as read');
  };

  const handleClearAll = () => {
    Alert.alert(
      'Clear All Notifications', 
      'Are you sure you want to clear all notifications? This cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: () => {
            if (userProfile.isAdmin) {
              clearAllNotifications(true);
            } else if (userProfile.isVendor) {
              clearAllNotifications(false, true);
            } else {
              clearAllNotifications(false);
            }
            Alert.alert('Success', 'All notifications cleared');
          }
        }
      ]
    );
  };

  // Function to format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Function to get notification icon based on type
  const getNotificationIcon = (notification: Notification) => {
    switch (notification.type) {
      case 'order_placed':
        return <ShoppingBag size={24} color={colors.info} />;
      case 'order_status':
        if (notification.title.includes('Processing')) {
          return <Clock size={24} color={colors.secondary} />;
        } else if (notification.title.includes('Shipped')) {
          return <Truck size={24} color={colors.warning} />;
        } else if (notification.title.includes('Delivered')) {
          return <CheckCircle size={24} color={colors.success} />;
        } else {
          return <Package size={24} color={colors.secondaryText} />;
        }
      default:
        return <Bell size={24} color={colors.secondaryText} />;
    }
  };

  // Handle back button press
  const handleBackPress = () => {
    // Check if we can go back in history
    try {
      router.back();
    } catch (error) {
      // If back navigation fails, navigate to the tabs
      router.replace('/(tabs)');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity 
          style={[styles.backButton, { backgroundColor: colors.inputBackground }]}
          onPress={handleBackPress}
        >
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Notifications</Text>
        <View style={styles.headerActions}>
          {notifications.length > 0 && (
            <>
              <TouchableOpacity 
                style={[styles.actionButton, { backgroundColor: colors.inputBackground }]}
                onPress={handleMarkAllAsRead}
              >
                <CheckCircle size={20} color={colors.success} />
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.actionButton, { backgroundColor: colors.inputBackground }]}
                onPress={handleClearAll}
              >
                <Trash2 size={20} color={colors.error} />
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      {notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Bell size={64} color={colors.border} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>No Notifications</Text>
          <Text style={[styles.emptyText, { color: colors.secondaryText }]}>
            You don't have any notifications yet.
          </Text>
        </View>
      ) : (
        <ScrollView style={styles.content}>
          {notifications.map((notification) => (
            <TouchableOpacity
              key={notification.id}
              style={[
                styles.notificationItem,
                { backgroundColor: colors.card },
                !notification.isRead && [
                  styles.unreadNotification, 
                  { 
                    backgroundColor: isDarkMode ? colors.card + '30' : colors.primary + '10',
                    borderLeftColor: colors.primary 
                  }
                ]
              ]}
              onPress={() => handleNotificationPress(notification)}
            >
              <View style={styles.notificationIcon}>
                {getNotificationIcon(notification)}
              </View>
              <View style={styles.notificationContent}>
                <Text style={[styles.notificationTitle, { color: colors.text }]}>{notification.title}</Text>
                <Text style={[styles.notificationMessage, { color: colors.secondaryText }]}>{notification.message}</Text>
                <Text style={[styles.notificationTime, { color: colors.secondaryText }]}>{formatDate(notification.timestamp)}</Text>
              </View>
              {!notification.isRead && <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />}
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  headerActions: {
    flexDirection: 'row',
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
  notificationItem: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    position: 'relative',
  },
  unreadNotification: {
    borderLeftWidth: 4,
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 14,
    marginBottom: 8,
  },
  notificationTime: {
    fontSize: 12,
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    position: 'absolute',
    top: 16,
    right: 16,
  },
}); 