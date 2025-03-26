import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, TextInput, Dimensions, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ShoppingCart, Search, Filter, Menu, X, ArrowUp, ArrowDown, BarChart2, Package, Users, TrendingUp, Bell } from 'lucide-react-native';
import { VendorContext } from '../VendorContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNotifications } from '../NotificationContext';

// Updated with real order loading logic instead of mock data
export default function VendorOrders() {
  const { currentVendor } = useContext(VendorContext);
  const { userNotifications, unreadUserCount, getVendorNotifications, vendorNotifications } = useNotifications();
  const [windowWidth, setWindowWidth] = useState(Dimensions.get('window').width);
  const [sidebarVisible, setSidebarVisible] = useState(windowWidth >= 768);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'total' | 'status'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [localVendor, setLocalVendor] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Load vendor data from AsyncStorage as a fallback
  useEffect(() => {
    const loadVendorData = async () => {
      try {
        // If we already have the vendor from context, use that
        if (currentVendor) {
          console.log('VendorOrders: Using vendor from context:', currentVendor.name);
          setLocalVendor(currentVendor);
          return;
        }
        
        // Otherwise, try to load from AsyncStorage
        const vendorData = await AsyncStorage.getItem('currentVendor');
        const vendorId = await AsyncStorage.getItem('vendorId');
        
        console.log('VendorOrders: Loading vendor from AsyncStorage, vendorId:', vendorId);
        
        if (vendorData) {
          const parsedVendor = JSON.parse(vendorData);
          console.log('VendorOrders: Loaded vendor from AsyncStorage:', parsedVendor.name);
          setLocalVendor(parsedVendor);
        } else {
          console.error('VendorOrders: No vendor data found in AsyncStorage');
        }
      } catch (error) {
        console.error('Error loading vendor data:', error);
      }
    };
    
    loadVendorData();
  }, [currentVendor]);
  
  // Load vendor-specific orders when vendor data is available
  useEffect(() => {
    const loadVendorOrders = async () => {
      if (!localVendor && !currentVendor) return;
      
      try {
        setLoading(true);
        const vendorId = localVendor?.id || currentVendor?.id;
        
        // Get all orders
        const ordersJson = await AsyncStorage.getItem('orders');
        if (!ordersJson) {
          setOrders([]);
          setLoading(false);
          return;
        }
        
        const allOrders = JSON.parse(ordersJson);
        const productsJson = await AsyncStorage.getItem('products');
        
        if (!productsJson) {
          setOrders([]);
          setLoading(false);
          return;
        }
        
        const allProducts = JSON.parse(productsJson);
        
        // Filter orders that contain products from this vendor
        const vendorOrders = allOrders.filter((order: any) => {
          const hasVendorProduct = order.items.some((item: any) => {
            const product = allProducts.find((p: any) => p.id === item.id);
            // Only include if this product belongs to the current vendor
            return product && product.vendorId === vendorId;
          });
          
          return hasVendorProduct;
        });
        
        // Enhance orders with only vendor-specific items
        const enhancedOrders = vendorOrders.map((order: any) => {
          // Filter only items from this vendor
          const vendorItems = order.items.filter((item: any) => {
            const product = allProducts.find((p: any) => p.id === item.id);
            return product && product.vendorId === vendorId;
          });
          
          // Calculate vendor-specific total
          const vendorTotal = vendorItems.reduce(
            (sum: number, item: any) => sum + (item.price * item.quantity),
            0
          );
          
          // Get customer info
          const customerInfo = order.address.split(',')[0] || 'Customer';
          
          return {
            id: order.id,
            customer: customerInfo,
            date: order.date,
            status: order.status,
            total: vendorTotal,
            items: vendorItems.length,
            address: order.address,
            products: vendorItems,
            paymentMethod: order.paymentMethod
          };
        });
        
        setOrders(enhancedOrders);
        setLoading(false);
      } catch (error) {
        console.error('Error loading vendor orders:', error);
        setLoading(false);
      }
    };
    
    loadVendorOrders();
  }, [localVendor, currentVendor]);
  
  useEffect(() => {
    const dimensionsHandler = Dimensions.addEventListener('change', ({ window }) => {
      setWindowWidth(window.width);
      setSidebarVisible(window.width >= 768);
    });

    return () => {
      dimensionsHandler.remove();
    };
  }, []);
  
  const handleViewOrder = (orderId: string) => {
    // Navigate to order details page
    router.push(`/vendor/order-details?id=${orderId}`);
  };
  
  const handleUpdateStatus = (orderId: string, newStatus: 'pending' | 'processing' | 'shipped' | 'delivered') => {
    // Update order status
    Alert.alert(
      'Update Order Status',
      `Are you sure you want to update the status to "${newStatus}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Update', 
          onPress: async () => {
            try {
              // Update in AsyncStorage
              const ordersJson = await AsyncStorage.getItem('orders');
              if (ordersJson) {
                const allOrders = JSON.parse(ordersJson);
                const updatedOrders = allOrders.map((order: any) => {
                  if (order.id === orderId) {
                    return { ...order, status: newStatus };
                  }
                  return order;
                });
                
                await AsyncStorage.setItem('orders', JSON.stringify(updatedOrders));
                
                // Update local state
                setOrders(orders.map(order => {
                  if (order.id === orderId) {
                    return { ...order, status: newStatus };
                  }
                  return order;
                }));
                
                // Add notification for the customer about status change
                // This would typically be done through a backend server
                // Here we're simulating it with client-side storage
                
                const statusMessages = {
                  pending: 'Your order has been received and is pending confirmation.',
                  processing: 'Your order is now being processed.',
                  shipped: 'Your order has been shipped and is on the way!',
                  delivered: 'Your order has been delivered. Enjoy!'
                };
                
                const notificationsJson = await AsyncStorage.getItem('userNotifications');
                if (notificationsJson) {
                  const notifications = JSON.parse(notificationsJson);
                  const newNotification = {
                    id: Date.now().toString(),
                    title: `Order ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}`,
                    message: statusMessages[newStatus],
                    timestamp: new Date().toISOString(),
                    isRead: false,
                    type: 'order_status',
                    orderId,
                    forAdmin: false
                  };
                  
                  const updatedNotifications = [newNotification, ...notifications];
                  await AsyncStorage.setItem('userNotifications', JSON.stringify(updatedNotifications));
                }
                
                Alert.alert('Success', `Order #${orderId} status updated to ${newStatus}`);
              }
            } catch (error) {
              console.error('Error updating order status:', error);
              Alert.alert('Error', 'Failed to update order status');
            }
          }
        },
      ]
    );
  };
  
  const toggleSort = (field: 'date' | 'total' | 'status') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };
  
  // Filter and sort orders
  const filteredOrders = orders
    .filter(order => 
      order.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.id.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      let comparison = 0;
      
      if (sortBy === 'date') {
        comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
      } else if (sortBy === 'total') {
        comparison = a.total - b.total;
      } else if (sortBy === 'status') {
        const statusOrder = { 'pending': 0, 'processing': 1, 'shipped': 2, 'delivered': 3 };
        comparison = statusOrder[a.status as keyof typeof statusOrder] - statusOrder[b.status as keyof typeof statusOrder];
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  
  const renderSidebar = () => (
    <View style={[styles.sidebar, !sidebarVisible && styles.sidebarHidden]}>
      <View style={styles.sidebarHeader}>
        <Text style={styles.sidebarTitle}>Vendor Panel</Text>
        {windowWidth < 768 && (
          <TouchableOpacity 
            style={styles.closeSidebarButton}
            onPress={() => setSidebarVisible(false)}
          >
            <X size={24} color="#1F2937" />
          </TouchableOpacity>
        )}
      </View>
      
      {localVendor && (
        <View style={styles.vendorInfo}>
          <Image 
            source={{ uri: localVendor.logo }} 
            style={styles.vendorLogo} 
          />
          <Text style={styles.vendorName}>{localVendor.name}</Text>
          <View style={[
            styles.verificationBadge, 
            { backgroundColor: localVendor.isVerified ? '#059669' : '#F59E0B' }
          ]}>
            <Text style={styles.verificationBadgeText}>
              {localVendor.isVerified ? 'Verified' : 'Pending Verification'}
            </Text>
          </View>
        </View>
      )}
      
      <View style={styles.sidebarMenu}>
        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => router.push('/vendor/dashboard')}
        >
          <BarChart2 size={20} color="#6B7280" />
          <Text style={styles.menuItemText}>Dashboard</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => router.push('/vendor/products')}
        >
          <Package size={20} color="#6B7280" />
          <Text style={styles.menuItemText}>Products</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.menuItem, styles.activeMenuItem]}
          onPress={() => router.push('/vendor/orders')}
        >
          <ShoppingCart size={20} color="#FFFFFF" />
          <Text style={[styles.menuItemText, styles.activeMenuItemText]}>Orders</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => router.push('/vendor/analytics')}
        >
          <TrendingUp size={20} color="#6B7280" />
          <Text style={styles.menuItemText}>Analytics</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => router.push('/vendor/profile')}
        >
          <Users size={20} color="#6B7280" />
          <Text style={styles.menuItemText}>Profile</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#F59E0B';
      case 'processing': return '#3B82F6';
      case 'shipped': return '#8B5CF6';
      case 'delivered': return '#059669';
      default: return '#6B7280';
    }
  };
  
  return (
    <SafeAreaView style={styles.container}>
      {renderSidebar()}
      
      <View style={styles.mainContent}>
        <View style={styles.header}>
          {windowWidth < 768 && (
            <TouchableOpacity 
              style={styles.menuButton}
              onPress={() => setSidebarVisible(true)}
            >
              <Menu size={24} color="#1F2937" />
            </TouchableOpacity>
          )}
          <Text style={styles.headerTitle}>Orders</Text>
          
          <TouchableOpacity 
            style={styles.notificationButton}
            onPress={() => router.push('/notifications')}
          >
            <Bell size={24} color="#1F2937" />
            {unreadUserCount > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>
                  {unreadUserCount > 99 ? '99+' : unreadUserCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
        
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Search size={20} color="#6B7280" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search orders..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#6B7280"
            />
          </View>
          
          <TouchableOpacity style={styles.filterButton}>
            <Filter size={20} color="#059669" />
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.content}>
          {filteredOrders.length === 0 ? (
            <View style={styles.emptyState}>
              <ShoppingCart size={48} color="#E5E7EB" />
              <Text style={styles.emptyStateTitle}>No Orders Yet</Text>
              <Text style={styles.emptyStateText}>
                When customers place orders for your products, they will appear here.
              </Text>
            </View>
          ) : (
            <View style={styles.ordersTable}>
              <View style={styles.tableHeader}>
                <View style={styles.tableHeaderCell}>
                  <Text style={styles.tableHeaderText}>Order</Text>
                </View>
                
                <TouchableOpacity 
                  style={[styles.tableHeaderCell, styles.dateCell]}
                  onPress={() => toggleSort('date')}
                >
                  <Text style={styles.tableHeaderText}>Date</Text>
                  {sortBy === 'date' && (
                    sortOrder === 'asc' ? 
                    <ArrowUp size={16} color="#059669" /> : 
                    <ArrowDown size={16} color="#059669" />
                  )}
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.tableHeaderCell, styles.statusCell]}
                  onPress={() => toggleSort('status')}
                >
                  <Text style={styles.tableHeaderText}>Status</Text>
                  {sortBy === 'status' && (
                    sortOrder === 'asc' ? 
                    <ArrowUp size={16} color="#059669" /> : 
                    <ArrowDown size={16} color="#059669" />
                  )}
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.tableHeaderCell, styles.totalCell]}
                  onPress={() => toggleSort('total')}
                >
                  <Text style={styles.tableHeaderText}>Total</Text>
                  {sortBy === 'total' && (
                    sortOrder === 'asc' ? 
                    <ArrowUp size={16} color="#059669" /> : 
                    <ArrowDown size={16} color="#059669" />
                  )}
                </TouchableOpacity>
                
                <View style={[styles.tableHeaderCell, styles.actionsCell]}>
                  <Text style={styles.tableHeaderText}>Actions</Text>
                </View>
              </View>
              
              {filteredOrders.map((order) => (
                <View key={order.id} style={styles.tableRow}>
                  <View style={styles.tableCell}>
                    <View style={styles.orderDetails}>
                      <Text style={styles.orderId}>{order.id}</Text>
                      <Text style={styles.customerName}>{order.customer}</Text>
                      <Text style={styles.itemsCount}>{order.items} {order.items === 1 ? 'item' : 'items'}</Text>
                    </View>
                  </View>
                  
                  <View style={[styles.tableCell, styles.dateCell]}>
                    <Text style={styles.orderDate}>{new Date(order.date).toLocaleDateString()}</Text>
                  </View>
                  
                  <View style={[styles.tableCell, styles.statusCell]}>
                    <View style={[
                      styles.statusBadge,
                      { backgroundColor: `${getStatusColor(order.status)}20` } // 20% opacity
                    ]}>
                      <Text style={[
                        styles.statusText,
                        { color: getStatusColor(order.status) }
                      ]}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={[styles.tableCell, styles.totalCell]}>
                    <Text style={styles.orderTotal}>₹{order.total.toFixed(2)}</Text>
                  </View>
                  
                  <View style={[styles.tableCell, styles.actionsCell]}>
                    <TouchableOpacity 
                      style={[styles.actionButton, styles.viewButton]}
                      onPress={() => handleViewOrder(order.id)}
                    >
                      <Text style={styles.actionButtonText}>View</Text>
                    </TouchableOpacity>
                    
                    <View style={styles.statusDropdownContainer}>
                      <TouchableOpacity 
                        style={[
                          styles.actionButton, 
                          styles.statusButton,
                          { backgroundColor: `${getStatusColor(order.status)}20` }
                        ]}
                      >
                        <Text style={[
                          styles.statusButtonText,
                          { color: getStatusColor(order.status) }
                        ]}>
                          Update Status
                        </Text>
                      </TouchableOpacity>
                      
                      <View style={styles.statusDropdown}>
                        {['pending', 'processing', 'shipped', 'delivered'].map((status) => (
                          <TouchableOpacity 
                            key={status}
                            style={[
                              styles.statusOption,
                              order.status === status && styles.statusOptionActive
                            ]}
                            onPress={() => handleUpdateStatus(
                              order.id, 
                              status as 'pending' | 'processing' | 'shipped' | 'delivered'
                            )}
                            disabled={order.status === status}
                          >
                            <Text style={[
                              styles.statusOptionText,
                              order.status === status && styles.statusOptionTextActive
                            ]}>
                              {status.charAt(0).toUpperCase() + status.slice(1)}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
  },
  sidebar: {
    width: 280,
    backgroundColor: '#FFFFFF',
    borderRightWidth: 1,
    borderRightColor: '#E5E7EB',
    padding: 16,
    height: '100%',
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    zIndex: 10,
  },
  sidebarHidden: {
    transform: [{ translateX: -280 }],
  },
  sidebarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
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
  vendorInfo: {
    alignItems: 'center',
    marginBottom: 24,
  },
  vendorLogo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 12,
  },
  vendorName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  verificationBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  verificationBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  sidebarMenu: {
    marginBottom: 24,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
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
    fontWeight: '500',
    color: '#6B7280',
    marginLeft: 12,
  },
  activeMenuItemText: {
    color: '#FFFFFF',
  },
  mainContent: {
    flex: 1,
    marginLeft: Dimensions.get('window').width >= 768 ? 280 : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    flex: 1,
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#EF4444',
    borderRadius: 12,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  notificationBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginRight: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
    color: '#1F2937',
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 48,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  ordersTable: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tableHeaderCell: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tableHeaderText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
    marginRight: 4,
  },
  dateCell: {
    width: 100,
    justifyContent: 'center',
  },
  statusCell: {
    width: 120,
    justifyContent: 'center',
  },
  totalCell: {
    width: 100,
    justifyContent: 'flex-end',
  },
  actionsCell: {
    width: 200,
    justifyContent: 'flex-end',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tableCell: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  orderDetails: {
    flex: 1,
  },
  orderId: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 4,
  },
  customerName: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 4,
  },
  itemsCount: {
    fontSize: 12,
    color: '#6B7280',
  },
  orderDate: {
    fontSize: 14,
    color: '#4B5563',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  orderTotal: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    marginLeft: 8,
  },
  viewButton: {
    backgroundColor: '#EBF5FF',
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#3B82F6',
  },
  statusDropdownContainer: {
    position: 'relative',
  },
  statusButton: {
    backgroundColor: '#F3F4F6',
    marginLeft: 8,
  },
  statusButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
  statusDropdown: {
    position: 'absolute',
    top: '100%',
    right: 0,
    width: 150,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 4,
    marginTop: 4,
    zIndex: 20,
    display: 'none', // Initially hidden, show on hover/tap
  },
  statusOption: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 4,
  },
  statusOptionActive: {
    backgroundColor: '#F3F4F6',
  },
  statusOptionText: {
    fontSize: 12,
    color: '#4B5563',
  },
  statusOptionTextActive: {
    fontWeight: '500',
    color: '#1F2937',
  },
}); 