import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Package, DollarSign, ShoppingCart, TrendingUp, Users, LogOut, Menu, X, BarChart2, Bell } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { VendorContext } from '../VendorContext';
import { ProductsContext } from '../ProductsContext';
import { useNotifications } from '../NotificationContext';

export default function VendorDashboard() {
  const { currentVendor } = useContext(VendorContext);
  const { products } = useContext(ProductsContext);
  const { userNotifications, unreadUserCount } = useNotifications();
  const [windowWidth, setWindowWidth] = useState(Dimensions.get('window').width);
  const [sidebarVisible, setSidebarVisible] = useState(windowWidth >= 768);
  const [localVendor, setLocalVendor] = useState<any>(null);
  
  // Load vendor data from AsyncStorage as a fallback
  useEffect(() => {
    const loadVendorData = async () => {
      try {
        // If we already have the vendor from context, use that
        if (currentVendor) {
          console.log('VendorDashboard: Using vendor from context:', currentVendor.name);
          setLocalVendor(currentVendor);
          return;
        }
        
        // Otherwise, try to load from AsyncStorage
        const vendorData = await AsyncStorage.getItem('currentVendor');
        const vendorId = await AsyncStorage.getItem('vendorId');
        
        console.log('VendorDashboard: Loading vendor from AsyncStorage, vendorId:', vendorId);
        
        if (vendorData) {
          const parsedVendor = JSON.parse(vendorData);
          console.log('VendorDashboard: Loaded vendor from AsyncStorage:', parsedVendor.name);
          setLocalVendor(parsedVendor);
        } else {
          console.error('VendorDashboard: No vendor data found in AsyncStorage');
        }
      } catch (error) {
        console.error('Error loading vendor data:', error);
      }
    };
    
    loadVendorData();
  }, [currentVendor]);
  
  // Filter products to show only those belonging to the current vendor
  const vendorProducts = products.filter(product => {
    const vendorId = localVendor?.id || currentVendor?.id;
    return product.vendorId === vendorId;
  });
  
  // Load vendor orders
  const [vendorOrders, setVendorOrders] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  
  useEffect(() => {
    const loadVendorOrders = async () => {
      if (!localVendor && !currentVendor) return;
      
      try {
        setOrdersLoading(true);
        const vendorId = localVendor?.id || currentVendor?.id;
        
        // Get all orders
        const ordersJson = await AsyncStorage.getItem('orders');
        if (!ordersJson) {
          setVendorOrders([]);
          setOrdersLoading(false);
          return;
        }
        
        const allOrders = JSON.parse(ordersJson);
        const productsJson = await AsyncStorage.getItem('products');
        
        if (!productsJson) {
          setVendorOrders([]);
          setOrdersLoading(false);
          return;
        }
        
        const allProducts = JSON.parse(productsJson);
        
        // Filter orders that contain products from this vendor
        const vendorOrders = allOrders.filter((order: any) => {
          const hasVendorProduct = order.items.some((item: any) => {
            const product = allProducts.find((p: any) => p.id === item.id);
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
        
        setVendorOrders(enhancedOrders);
        setOrdersLoading(false);
      } catch (error) {
        console.error('Error loading vendor orders:', error);
        setOrdersLoading(false);
      }
    };
    
    loadVendorOrders();
  }, [localVendor, currentVendor]);
  
  // Update mock data for dashboard using real data
  const dashboardStats = {
    totalOrders: vendorOrders.length,
    pendingOrders: vendorOrders.filter(order => order.status === 'pending').length,
    totalRevenue: vendorOrders.reduce((sum, order) => sum + order.total, 0),
    lowStockItems: vendorProducts.filter(product => product.stock < 10).length,
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#F59E0B';
      case 'processing': return '#3B82F6';
      case 'shipped': return '#8B5CF6';
      case 'delivered': return '#059669';
      default: return '#6B7280';
    }
  };
  
  useEffect(() => {
    const dimensionsHandler = Dimensions.addEventListener('change', ({ window }) => {
      setWindowWidth(window.width);
      setSidebarVisible(window.width >= 768);
    });

    return () => {
      dimensionsHandler.remove();
    };
  }, []);
  
  const handleLogout = async () => {
    // Clear login state
    global.isLoggedIn = false;
    global.isAdmin = false;
    global.isVendor = false;
    global.vendorId = null;

    // Clear login state from AsyncStorage
    await AsyncStorage.removeItem('isLoggedIn');
    await AsyncStorage.removeItem('isAdmin');
    await AsyncStorage.removeItem('isVendor');
    await AsyncStorage.removeItem('vendorId');

    // Redirect to login page
    router.replace('/login');
  };
  
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
          style={[styles.menuItem, styles.activeMenuItem]}
          onPress={() => router.push('/vendor/dashboard')}
        >
          <BarChart2 size={20} color="#FFFFFF" />
          <Text style={[styles.menuItemText, styles.activeMenuItemText]}>Dashboard</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => router.push('/vendor/products')}
        >
          <Package size={20} color="#6B7280" />
          <Text style={styles.menuItemText}>Products</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => router.push('/vendor/orders')}
        >
          <ShoppingCart size={20} color="#6B7280" />
          <Text style={styles.menuItemText}>Orders</Text>
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
      
      <TouchableOpacity 
        style={styles.logoutButton}
        onPress={handleLogout}
      >
        <LogOut size={20} color="#EF4444" />
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
  
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
          <Text style={styles.headerTitle}>Dashboard</Text>
          
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
        
        <ScrollView style={styles.content}>
          <Text style={styles.welcomeText}>
            Welcome back, {localVendor?.name || 'Vendor'}!
          </Text>
          
          <View style={styles.statsContainer}>
            <View style={[styles.statCard, { backgroundColor: '#059669' }]}>
              <View style={styles.statIconContainer}>
                <ShoppingCart size={24} color="#FFFFFF" />
              </View>
              <View style={styles.statInfo}>
                <Text style={styles.statValue}>{dashboardStats.totalOrders}</Text>
                <Text style={styles.statLabel}>Total Orders</Text>
              </View>
            </View>
            
            <View style={[styles.statCard, { backgroundColor: '#F59E0B' }]}>
              <View style={styles.statIconContainer}>
                <Package size={24} color="#FFFFFF" />
              </View>
              <View style={styles.statInfo}>
                <Text style={styles.statValue}>{dashboardStats.pendingOrders}</Text>
                <Text style={styles.statLabel}>Pending Orders</Text>
              </View>
            </View>
            
            <View style={[styles.statCard, { backgroundColor: '#3B82F6' }]}>
              <View style={styles.statIconContainer}>
                <DollarSign size={24} color="#FFFFFF" />
              </View>
              <View style={styles.statInfo}>
                <Text style={styles.statValue}>₹{dashboardStats.totalRevenue.toLocaleString()}</Text>
                <Text style={styles.statLabel}>Total Revenue</Text>
              </View>
            </View>
            
            <View style={[styles.statCard, { backgroundColor: '#EF4444' }]}>
              <View style={styles.statIconContainer}>
                <Package size={24} color="#FFFFFF" />
              </View>
              <View style={styles.statInfo}>
                <Text style={styles.statValue}>{dashboardStats.lowStockItems}</Text>
                <Text style={styles.statLabel}>Low Stock Items</Text>
              </View>
            </View>
          </View>
          
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Orders</Text>
              <TouchableOpacity onPress={() => router.push('/vendor/orders')}>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>
            
            {vendorOrders.length === 0 ? (
              <View style={styles.emptyState}>
                <Package size={48} color="#E5E7EB" />
                <Text style={styles.emptyStateTitle}>No Orders Yet</Text>
                <Text style={styles.emptyStateText}>
                  When customers place orders for your products, they will appear here.
                </Text>
              </View>
            ) : (
              <View style={styles.recentOrdersList}>
                {vendorOrders.slice(0, 3).map((order) => (
                  <TouchableOpacity 
                    key={order.id}
                    style={styles.orderCard}
                    onPress={() => router.push(`/vendor/order-details?id=${order.id}`)}
                  >
                    <View style={styles.orderCardHeader}>
                      <Text style={styles.orderCardId}>{order.id}</Text>
                      <View style={[
                        styles.statusBadge,
                        { backgroundColor: `${getStatusColor(order.status)}20` }
                      ]}>
                        <Text style={[
                          styles.statusText,
                          { color: getStatusColor(order.status) }
                        ]}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </Text>
                      </View>
                    </View>
                    
                    <View style={styles.orderCardBody}>
                      <View style={styles.orderCardDetail}>
                        <Text style={styles.orderCardLabel}>Customer</Text>
                        <Text style={styles.orderCardValue}>{order.customer}</Text>
                      </View>
                      
                      <View style={styles.orderCardDetail}>
                        <Text style={styles.orderCardLabel}>Date</Text>
                        <Text style={styles.orderCardValue}>
                          {new Date(order.date).toLocaleDateString()}
                        </Text>
                      </View>
                      
                      <View style={styles.orderCardDetail}>
                        <Text style={styles.orderCardLabel}>Total</Text>
                        <Text style={styles.orderCardValue}>₹{order.total.toFixed(2)}</Text>
                      </View>
                      
                      <View style={styles.orderCardDetail}>
                        <Text style={styles.orderCardLabel}>Items</Text>
                        <Text style={styles.orderCardValue}>{order.items}</Text>
                      </View>
                    </View>
                    
                    <View style={styles.orderCardFooter}>
                      <TouchableOpacity 
                        style={styles.viewOrderButton}
                        onPress={() => router.push(`/vendor/order-details?id=${order.id}`)}
                      >
                        <Text style={styles.viewOrderButtonText}>View Details</Text>
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
          
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Your Products</Text>
              <TouchableOpacity onPress={() => router.push('/vendor/products')}>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>
            
            {vendorProducts.length === 0 ? (
              <View style={styles.emptyState}>
                <Package size={48} color="#E5E7EB" />
                <Text style={styles.emptyStateTitle}>No Products Yet</Text>
                <Text style={styles.emptyStateText}>
                  Start adding products to your store to increase visibility and sales.
                </Text>
                <TouchableOpacity 
                  style={styles.addProductButton}
                  onPress={() => router.push('/vendor/add-product')}
                >
                  <Text style={styles.addProductButtonText}>+ Add New Product</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.productsGrid}>
                {vendorProducts.slice(0, 4).map((product) => (
                  <TouchableOpacity 
                    key={product.id} 
                    style={styles.productCard}
                    onPress={() => router.push(`/vendor/edit-product?id=${product.id}`)}
                  >
                    <Image source={{ uri: product.image }} style={styles.productImage} />
                    <View style={styles.productInfo}>
                      <Text style={styles.productName}>{product.name}</Text>
                      <View style={styles.productMeta}>
                        <Text style={styles.productPrice}>₹{product.price.toFixed(2)}</Text>
                        <Text style={[
                          styles.stockStatus, 
                          { color: product.stock > 10 ? '#059669' : '#EF4444' }
                        ]}>
                          {product.stock > 10 ? 'In Stock' : 'Low Stock'}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
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
    backgroundColor: '#059669',
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
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 'auto',
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#EF4444',
    marginLeft: 12,
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
  },
  content: {
    flex: 1,
    padding: 16,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 24,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    minWidth: 150,
    margin: 8,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  statInfo: {
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#FFFFFF',
  },
  sectionContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#059669',
  },
  emptyState: {
    alignItems: 'center',
    padding: 24,
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
  addProductButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#059669',
    borderRadius: 8,
  },
  addProductButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  productCard: {
    width: '50%',
    padding: 8,
  },
  productImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 8,
    marginBottom: 8,
  },
  productInfo: {
    padding: 8,
  },
  productName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 8,
  },
  productMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#059669',
  },
  stockStatus: {
    fontSize: 12,
    fontWeight: '500',
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 16,
  },
  notificationBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#EF4444',
    borderRadius: 12,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  notificationBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  recentOrdersList: {
    marginBottom: 24,
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  orderCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderCardId: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  orderCardBody: {
    marginBottom: 8,
  },
  orderCardDetail: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderCardLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },
  orderCardValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  orderCardFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  viewOrderButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#059669',
    borderRadius: 8,
  },
  viewOrderButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
}); 