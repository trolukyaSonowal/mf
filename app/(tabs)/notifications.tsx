import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Bell, Trash2, CheckCircle, Clock, Package, Truck, ShoppingBag } from 'lucide-react-native';
import { useNotifications, Notification } from '../NotificationContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme, getThemeColors } from '../ThemeContext';

export default function NotificationsTab() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const { 
    adminNotifications, 
    userNotifications, 
    markAsRead, 
    markAllAsRead, 
    clearAllNotifications 
  } = useNotifications();
  const { isDarkMode } = useTheme();
  const colors = getThemeColors(isDarkMode);

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const adminStatus = await AsyncStorage.getItem('isAdmin');
        setIsAdmin(adminStatus === 'true' || global.isAdmin === true);
        setLoading(false);
      } catch (error) {
        console.error('Error checking admin status:', error);
        setLoading(false);
      }
    };
    
    checkAdminStatus();
  }, []);

  const notifications = isAdmin ? adminNotifications : userNotifications;

  const handleNotificationPress = (notification: Notification) => {
    // Mark notification as read
    markAsRead(notification.id, isAdmin);
    
    // Navigate to relevant screen based on notification type
    if (notification.type === 'order_placed' || notification.type === 'order_status') {
      if (notification.orderId) {
        if (isAdmin) {
          // For admin, navigate to admin order details
          router.push(`/admin/order-details?id=${notification.orderId}`);
        } else {
          // For user, navigate to user order details
          router.push(`/order-details?id=${notification.orderId}`);
        }
      }
    }
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead(isAdmin);
  };

  const handleClearAll = () => {
    Alert.alert(
      "Clear All Notifications",
      "Are you sure you want to clear all notifications?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        { 
          text: "Clear All", 
          onPress: () => clearAllNotifications(isAdmin),
          style: "destructive"
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

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
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
          {notifications.map((notification: Notification) => (
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