import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  type: 'order_placed' | 'order_status' | 'general';
  orderId?: string;
  forAdmin: boolean;
  forVendor?: boolean;
  vendorId?: string;
  productId?: number;
  userId?: string;
}

interface NotificationContextType {
  adminNotifications: Notification[];
  userNotifications: Notification[];
  vendorNotifications: Notification[];
  unreadAdminCount: number;
  unreadUserCount: number;
  unreadVendorCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'isRead'>) => Promise<void>;
  markAsRead: (id: string, isAdmin: boolean, isVendor?: boolean) => Promise<void>;
  markAllAsRead: (isAdmin: boolean, isVendor?: boolean) => Promise<void>;
  clearAllNotifications: (isAdmin: boolean, isVendor?: boolean) => Promise<void>;
  updateOrderStatus: (orderId: string, status: 'pending' | 'processing' | 'shipped' | 'delivered') => Promise<void>;
  getVendorNotifications: (vendorId: string) => Notification[];
}

export const NotificationContext = createContext<NotificationContextType>({
  adminNotifications: [],
  userNotifications: [],
  vendorNotifications: [],
  unreadAdminCount: 0,
  unreadUserCount: 0,
  unreadVendorCount: 0,
  addNotification: async () => {},
  markAsRead: async () => {},
  markAllAsRead: async () => {},
  clearAllNotifications: async () => {},
  updateOrderStatus: async () => {},
  getVendorNotifications: () => [],
});

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [adminNotifications, setAdminNotifications] = useState<Notification[]>([]);
  const [userNotifications, setUserNotifications] = useState<Notification[]>([]);
  const [vendorNotifications, setVendorNotifications] = useState<Notification[]>([]);
  const [unreadAdminCount, setUnreadAdminCount] = useState(0);
  const [unreadUserCount, setUnreadUserCount] = useState(0);
  const [unreadVendorCount, setUnreadVendorCount] = useState(0);

  // Load notifications from AsyncStorage on mount
  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const adminNotificationsJson = await AsyncStorage.getItem('adminNotifications');
        const userNotificationsJson = await AsyncStorage.getItem('userNotifications');
        const vendorNotificationsJson = await AsyncStorage.getItem('vendorNotifications');
        
        if (adminNotificationsJson) {
          const notifications = JSON.parse(adminNotificationsJson);
          setAdminNotifications(notifications);
          setUnreadAdminCount(notifications.filter((n: Notification) => !n.isRead).length);
        }
        
        if (userNotificationsJson) {
          const notifications = JSON.parse(userNotificationsJson);
          setUserNotifications(notifications);
          setUnreadUserCount(notifications.filter((n: Notification) => !n.isRead).length);
        }
        
        if (vendorNotificationsJson) {
          const notifications = JSON.parse(vendorNotificationsJson);
          setVendorNotifications(notifications);
          setUnreadVendorCount(notifications.filter((n: Notification) => !n.isRead).length);
        }
      } catch (error) {
        console.error('Error loading notifications:', error);
      }
    };
    
    loadNotifications();
  }, []);

  // Save notifications to AsyncStorage whenever they change
  useEffect(() => {
    const saveNotifications = async () => {
      try {
        await AsyncStorage.setItem('adminNotifications', JSON.stringify(adminNotifications));
        setUnreadAdminCount(adminNotifications.filter(n => !n.isRead).length);
      } catch (error) {
        console.error('Error saving admin notifications:', error);
      }
    };
    
    saveNotifications();
  }, [adminNotifications]);

  useEffect(() => {
    const saveNotifications = async () => {
      try {
        await AsyncStorage.setItem('userNotifications', JSON.stringify(userNotifications));
        setUnreadUserCount(userNotifications.filter(n => !n.isRead).length);
      } catch (error) {
        console.error('Error saving user notifications:', error);
      }
    };
    
    saveNotifications();
  }, [userNotifications]);
  
  useEffect(() => {
    const saveNotifications = async () => {
      try {
        await AsyncStorage.setItem('vendorNotifications', JSON.stringify(vendorNotifications));
        setUnreadVendorCount(vendorNotifications.filter(n => !n.isRead).length);
      } catch (error) {
        console.error('Error saving vendor notifications:', error);
      }
    };
    
    saveNotifications();
  }, [vendorNotifications]);

  // Add a new notification
  const addNotification = async (notification: Omit<Notification, 'id' | 'timestamp' | 'isRead'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      isRead: false,
    };
    
    if (notification.forAdmin) {
      setAdminNotifications(prev => [newNotification, ...prev]);
    } else if (notification.forVendor) {
      setVendorNotifications(prev => [newNotification, ...prev]);
    } else {
      setUserNotifications(prev => [newNotification, ...prev]);
    }
  };

  // Get notifications for specific vendor
  const getVendorNotifications = (vendorId: string): Notification[] => {
    return vendorNotifications.filter(n => n.vendorId === vendorId);
  };

  // Mark a notification as read
  const markAsRead = async (id: string, isAdmin: boolean, isVendor: boolean = false) => {
    if (isAdmin) {
      setAdminNotifications(prev => 
        prev.map(notification => 
          notification.id === id ? { ...notification, isRead: true } : notification
        )
      );
    } else if (isVendor) {
      setVendorNotifications(prev => 
        prev.map(notification => 
          notification.id === id ? { ...notification, isRead: true } : notification
        )
      );
    } else {
      setUserNotifications(prev => 
        prev.map(notification => 
          notification.id === id ? { ...notification, isRead: true } : notification
        )
      );
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async (isAdmin: boolean, isVendor: boolean = false) => {
    if (isAdmin) {
      setAdminNotifications(prev => 
        prev.map(notification => ({ ...notification, isRead: true }))
      );
    } else if (isVendor) {
      setVendorNotifications(prev => 
        prev.map(notification => ({ ...notification, isRead: true }))
      );
    } else {
      setUserNotifications(prev => 
        prev.map(notification => ({ ...notification, isRead: true }))
      );
    }
  };

  // Clear all notifications
  const clearAllNotifications = async (isAdmin: boolean, isVendor: boolean = false) => {
    if (isAdmin) {
      setAdminNotifications([]);
    } else if (isVendor) {
      setVendorNotifications([]);
    } else {
      setUserNotifications([]);
    }
  };

  // Update order status and send notification to user
  const updateOrderStatus = async (orderId: string, status: 'pending' | 'processing' | 'shipped' | 'delivered') => {
    try {
      // Update order status in orders
      const ordersJson = await AsyncStorage.getItem('orders');
      if (ordersJson) {
        const orders = JSON.parse(ordersJson);
        const updatedOrders = orders.map((order: any) => {
          if (order.id === orderId) {
            return { ...order, status };
          }
          return order;
        });
        
        await AsyncStorage.setItem('orders', JSON.stringify(updatedOrders));
        
        // Add notification for user
        const statusMessages = {
          pending: 'Your order has been received and is pending confirmation.',
          processing: 'Your order is now being processed.',
          shipped: 'Your order has been shipped and is on the way!',
          delivered: 'Your order has been delivered. Enjoy!'
        };
        
        const newNotification: Notification = {
          id: Date.now().toString(),
          title: `Order ${status.charAt(0).toUpperCase() + status.slice(1)}`,
          message: statusMessages[status],
          timestamp: new Date().toISOString(),
          isRead: false,
          type: 'order_status',
          orderId,
          forAdmin: false
        };
        
        setUserNotifications(prev => [newNotification, ...prev]);
      }
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        adminNotifications,
        userNotifications,
        vendorNotifications,
        unreadAdminCount,
        unreadUserCount,
        unreadVendorCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        clearAllNotifications,
        updateOrderStatus,
        getVendorNotifications
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

// Custom hook to use the notification context
export const useNotifications = () => useContext(NotificationContext); 