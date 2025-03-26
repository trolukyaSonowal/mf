import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, Package, ChevronRight, Clock, Search, Filter, Menu, X, Bell } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNotifications } from '../NotificationContext';

// Define the Order interface
interface OrderItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

interface Order {
  id: string;
  date: string;
  items: OrderItem[];
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered';
  address: string;
  paymentMethod: string;
  userId?: string;
}

export default function AdminOrdersScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [windowWidth, setWindowWidth] = useState(Dimensions.get('window').width);
  const [sidebarVisible, setSidebarVisible] = useState(windowWidth >= 768);
  const [activeFilter, setActiveFilter] = useState<Order['status'] | 'all'>('all');
  const { unreadAdminCount } = useNotifications();

  useEffect(() => {
    const handleDimensionsChange = ({ window }: { window: { width: number; height: number } }) => {
      setWindowWidth(window.width);
      setSidebarVisible(window.width >= 768);
    };

    const subscription = Dimensions.addEventListener('change', handleDimensionsChange);
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    // Load orders from AsyncStorage
    const loadOrders = async () => {
      try {
        const ordersJson = await AsyncStorage.getItem('orders');
        if (ordersJson) {
          setOrders(JSON.parse(ordersJson));
        }
        setLoading(false);
      } catch (error) {
        console.error('Error loading orders:', error);
        setLoading(false);
      }
    };

    loadOrders();
  }, []);

  // Function to get status color based on order status
  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return '#F59E0B'; // Amber
      case 'processing':
        return '#3B82F6'; // Blue
      case 'shipped':
        return '#8B5CF6'; // Purple
      case 'delivered':
        return '#059669'; // Green
      default:
        return '#6B7280'; // Gray
    }
  };

  // Function to get status text based on order status
  const getStatusText = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'processing':
        return 'Processing';
      case 'shipped':
        return 'Shipped';
      case 'delivered':
        return 'Delivered';
      default:
        return 'Unknown';
    }
  };

  // Function to format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Filter orders based on active filter
  const filteredOrders = activeFilter === 'all' 
    ? orders 
    : orders.filter(order => order.status === activeFilter);

  // Sort orders by date (newest first)
  const sortedOrders = [...filteredOrders].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  // Calculate order statistics
  const orderStats = {
    total: orders.length,
    pending: orders.filter(order => order.status === 'pending').length,
    processing: orders.filter(order => order.status === 'processing').length,
    shipped: orders.filter(order => order.status === 'shipped').length,
    delivered: orders.filter(order => order.status === 'delivered').length,
  };

  // Calculate total revenue
  const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);

  const renderSidebar = () => (
    <View style={[styles.sidebar, !sidebarVisible && styles.sidebarHidden]}>
      <View style={styles.sidebarHeader}>
        <Text style={styles.sidebarTitle}>Admin Panel</Text>
        {windowWidth < 768 && (
          <TouchableOpacity 
            style={styles.closeSidebarButton}
            onPress={() => setSidebarVisible(false)}
          >
            <X size={24} color="#1F2937" />
          </TouchableOpacity>
        )}
      </View>
      
      <View style={styles.sidebarMenu}>
        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => router.push('/admin')}
        >
          <Text style={styles.menuItemText}>Dashboard</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.menuItem, styles.activeMenuItem]}
          onPress={() => router.push('/admin/orders')}
        >
          <Text style={[styles.menuItemText, styles.activeMenuItemText]}>Orders</Text>
          {unreadAdminCount > 0 && (
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationBadgeText}>{unreadAdminCount}</Text>
            </View>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => router.push('/admin/products')}
        >
          <Text style={styles.menuItemText}>Products</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => router.push('/notifications')}
        >
          <Text style={styles.menuItemText}>Notifications</Text>
          {unreadAdminCount > 0 && (
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationBadgeText}>{unreadAdminCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
      
      <TouchableOpacity 
        style={styles.logoutButton}
        onPress={() => router.push('/')}
      >
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {windowWidth < 768 && !sidebarVisible && (
        <TouchableOpacity 
          style={styles.menuButton}
          onPress={() => setSidebarVisible(true)}
        >
          <Menu size={24} color="#1F2937" />
        </TouchableOpacity>
      )}
      
      {renderSidebar()}
      
      <View style={[
        styles.mainContent,
        windowWidth >= 768 && styles.mainContentWithSidebar
      ]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Orders</Text>
          <TouchableOpacity 
            style={styles.notificationsButton}
            onPress={() => router.push('/notifications')}
          >
            <Bell size={24} color="#1F2937" />
            {unreadAdminCount > 0 && (
              <View style={styles.headerNotificationBadge}>
                <Text style={styles.headerNotificationBadgeText}>{unreadAdminCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{orderStats.total}</Text>
            <Text style={styles.statLabel}>Total Orders</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{orderStats.pending}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>₹{totalRevenue.toFixed(2)}</Text>
            <Text style={styles.statLabel}>Revenue</Text>
          </View>
        </View>

        <View style={styles.filterContainer}>
          <TouchableOpacity 
            style={[styles.filterButton, activeFilter === 'all' && styles.activeFilterButton]}
            onPress={() => setActiveFilter('all')}
          >
            <Text style={[
              styles.filterButtonText, 
              activeFilter === 'all' && styles.activeFilterButtonText
            ]}>All</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[
              styles.filterButton, 
              activeFilter === 'pending' && styles.activeFilterButton,
              activeFilter === 'pending' && { backgroundColor: '#F59E0B20' }
            ]}
            onPress={() => setActiveFilter('pending')}
          >
            <Text style={[
              styles.filterButtonText, 
              activeFilter === 'pending' && { color: '#F59E0B' }
            ]}>Pending</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[
              styles.filterButton, 
              activeFilter === 'processing' && styles.activeFilterButton,
              activeFilter === 'processing' && { backgroundColor: '#3B82F620' }
            ]}
            onPress={() => setActiveFilter('processing')}
          >
            <Text style={[
              styles.filterButtonText, 
              activeFilter === 'processing' && { color: '#3B82F6' }
            ]}>Processing</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[
              styles.filterButton, 
              activeFilter === 'shipped' && styles.activeFilterButton,
              activeFilter === 'shipped' && { backgroundColor: '#8B5CF620' }
            ]}
            onPress={() => setActiveFilter('shipped')}
          >
            <Text style={[
              styles.filterButtonText, 
              activeFilter === 'shipped' && { color: '#8B5CF6' }
            ]}>Shipped</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[
              styles.filterButton, 
              activeFilter === 'delivered' && styles.activeFilterButton,
              activeFilter === 'delivered' && { backgroundColor: '#059669' }
            ]}
            onPress={() => setActiveFilter('delivered')}
          >
            <Text style={[
              styles.filterButtonText, 
              activeFilter === 'delivered' && { color: '#FFFFFF' }
            ]}>Delivered</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading orders...</Text>
          </View>
        ) : sortedOrders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Package size={64} color="#E5E7EB" />
            <Text style={styles.emptyTitle}>No Orders Found</Text>
            <Text style={styles.emptyText}>
              {activeFilter === 'all' 
                ? "There are no orders in the system yet."
                : `There are no ${activeFilter} orders at the moment.`}
            </Text>
          </View>
        ) : (
          <ScrollView style={styles.content}>
            {sortedOrders.map((order) => (
              <TouchableOpacity 
                key={order.id} 
                style={styles.orderCard}
                onPress={() => router.push(`/admin/order-details?id=${order.id}`)}
              >
                <View style={styles.orderHeader}>
                  <View style={styles.orderIdContainer}>
                    <Text style={styles.orderIdLabel}>Order #{order.id}</Text>
                    <Text style={styles.orderDate}>{formatDate(order.date)}</Text>
                  </View>
                  <View style={[
                    styles.statusBadge, 
                    { backgroundColor: `${getStatusColor(order.status)}20` }
                  ]}>
                    <Text style={[
                      styles.statusText, 
                      { color: getStatusColor(order.status) }
                    ]}>
                      {getStatusText(order.status)}
                    </Text>
                  </View>
                </View>

                <View style={styles.orderItems}>
                  {order.items.slice(0, 2).map((item) => (
                    <View key={item.id} style={styles.orderItem}>
                      <Image source={{ uri: item.image }} style={styles.itemImage} />
                      <View style={styles.itemDetails}>
                        <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                        <Text style={styles.itemMeta}>
                          ₹{item.price.toFixed(2)} × {item.quantity}
                        </Text>
                      </View>
                    </View>
                  ))}
                  {order.items.length > 2 && (
                    <Text style={styles.moreItems}>
                      +{order.items.length - 2} more items
                    </Text>
                  )}
                </View>

                <View style={styles.orderFooter}>
                  <View style={styles.orderInfo}>
                    <View style={styles.infoItem}>
                      <Clock size={16} color="#6B7280" />
                      <Text style={styles.infoText}>{formatDate(order.date)}</Text>
                    </View>
                  </View>
                  <View style={styles.totalContainer}>
                    <Text style={styles.totalLabel}>Total:</Text>
                    <Text style={styles.totalAmount}>₹{order.total.toFixed(2)}</Text>
                  </View>
                </View>

                <View style={styles.viewDetailsContainer}>
                  <Text style={styles.viewDetailsText}>Manage Order</Text>
                  <ChevronRight size={16} color="#059669" />
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    flexDirection: 'row',
  },
  menuButton: {
    position: 'absolute',
    top: 16,
    left: 16,
    zIndex: 100,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sidebar: {
    width: 250,
    backgroundColor: '#FFFFFF',
    borderRightWidth: 1,
    borderRightColor: '#E5E7EB',
    padding: 16,
    height: '100%',
    zIndex: 50,
  },
  sidebarHidden: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    transform: [{ translateX: 0 }],
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  sidebarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  sidebarTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  closeSidebarButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sidebarMenu: {
    marginBottom: 24,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  activeMenuItem: {
    backgroundColor: '#059669',
  },
  menuItemText: {
    fontSize: 16,
    color: '#4B5563',
  },
  activeMenuItemText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  notificationBadge: {
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
  logoutButton: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#4B5563',
    fontSize: 16,
    fontWeight: '600',
  },
  mainContent: {
    flex: 1,
    padding: 16,
    paddingTop: 60,
  },
  mainContentWithSidebar: {
    paddingTop: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  notificationsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerNotificationBadge: {
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
  headerNotificationBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  statsContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginRight: 8,
    marginBottom: 8,
    minWidth: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  filterContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
    marginBottom: 8,
  },
  activeFilterButton: {
    backgroundColor: '#059669',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#4B5563',
  },
  activeFilterButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
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
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  orderIdContainer: {
    flex: 1,
  },
  orderIdLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 14,
    color: '#6B7280',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  orderItems: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  orderItem: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  itemImage: {
    width: 48,
    height: 48,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
  },
  itemDetails: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  itemMeta: {
    fontSize: 12,
    color: '#6B7280',
  },
  moreItems: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 8,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  orderInfo: {
    flex: 1,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 8,
  },
  totalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginRight: 4,
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#059669',
  },
  viewDetailsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  viewDetailsText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#059669',
    marginRight: 4,
  },
}); 