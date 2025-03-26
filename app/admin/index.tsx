import React, { useState, useContext, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image, Alert, Dimensions, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LayoutDashboard, Package, Users, ShoppingCart, ChartBar as BarChart, Settings, LogOut, ChevronRight, Edit, Trash, Plus, Menu, X, Bell } from 'lucide-react-native';
import { ProductsContext } from '../ProductsContext';
import { useNotifications } from '../NotificationContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define a type for valid routes
type AppRoute = '/admin' | '/admin/add-item' | '/admin/edit-item' | '/admin/orders' | '/admin/vendors'; // Only include valid routes

// Declare the global type for TypeScript
declare global {
  var productToEdit: number;
  var isAdmin: boolean;
  var isLoggedIn: boolean;
}

// Define interfaces for orders
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
}

// Define the stat card interface
interface StatCard {
  name: string;
  value: string;
  change: string;
  icon: any;
  color: string;
  route?: string;
}

const menuItems: { name: string; icon: any; route: AppRoute | string }[] = [
  { name: 'Dashboard', icon: LayoutDashboard, route: '/admin' },
  { name: 'Orders', icon: ShoppingCart, route: '/admin/orders' },
  { name: 'Products', icon: Package, route: '/admin/add-item' },
  { name: 'Vendors', icon: Users, route: '/admin/vendors' },
  { name: 'Notifications', icon: Bell, route: '/notifications' },
  // Remove routes that are not valid or not yet defined
];

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('Dashboard');
  const { products, deleteProduct } = useContext(ProductsContext);
  const [windowWidth, setWindowWidth] = useState(Dimensions.get('window').width);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const { unreadAdminCount, clearAllNotifications } = useNotifications();
  const [stats, setStats] = useState<StatCard[]>([
    { name: 'Total Orders', value: '0', change: '+0%', icon: ShoppingCart, color: '#8B5CF6', route: '/admin/orders' },
    { name: 'Total Products', value: '0', change: '+0%', icon: Package, color: '#EC4899', route: '/admin/add-item' },
    { name: 'Active Users', value: '0', change: '+0%', icon: Users, color: '#3B82F6' },
    { name: 'Revenue', value: '₹0', change: '+0%', icon: BarChart, color: '#10B981' },
  ]);
  
  // Track window dimensions
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setWindowWidth(window.width);
      // Auto-hide sidebar on orientation change for small screens
      if (window.width < 768) {
        setSidebarVisible(false);
      } else {
        setSidebarVisible(true);
      }
    });
    
    // Set initial sidebar visibility based on screen width
    setSidebarVisible(windowWidth >= 768);
    
    return () => subscription?.remove();
  }, []);

  // Load dashboard stats
  useEffect(() => {
    const loadStats = async () => {
      try {
        // Get orders from AsyncStorage
        const ordersJson = await AsyncStorage.getItem('orders');
        let orders: Order[] = [];
        if (ordersJson) {
          orders = JSON.parse(ordersJson);
        }
        
        // Get vendors data
        const vendorsJson = await AsyncStorage.getItem('vendors');
        let vendors: any[] = [];
        if (vendorsJson) {
          vendors = JSON.parse(vendorsJson);
        }
        
        // Count pending vendor applications
        const pendingVendors = vendors.filter(vendor => !vendor.isVerified).length;
        
        // Calculate total revenue from all orders
        const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
        
        // Get user count (for demo purposes, we'll use a fixed number with a small random variation)
        const baseUserCount = 2345;
        const userCount = baseUserCount + Math.floor(Math.random() * 100);
        
        // Update stats with real data
        setStats([
          { 
            name: 'Total Orders', 
            value: orders.length.toString(), 
            change: `+${Math.floor(Math.random() * 20)}%`, 
            icon: ShoppingCart, 
            color: '#8B5CF6',
            route: '/admin/orders'
          },
          { 
            name: 'Total Products', 
            value: products.length.toString(), 
            change: `+${Math.floor(Math.random() * 10)}%`, 
            icon: Package, 
            color: '#EC4899',
            route: '/admin/add-item'
          },
          { 
            name: 'Vendor Applications', 
            value: `${pendingVendors} pending`, 
            change: `${vendors.length} total`, 
            icon: Users, 
            color: '#3B82F6',
            route: '/admin/vendors'
          },
          { 
            name: 'Revenue', 
            value: `₹${totalRevenue.toFixed(2)}`, 
            change: `+${Math.floor(Math.random() * 30)}%`, 
            icon: BarChart, 
            color: '#10B981' 
          },
        ]);
      } catch (error) {
        console.error('Error loading dashboard stats:', error);
      }
    };
    
    loadStats();
  }, [products]);

  const isMobile = windowWidth < 768;
  
  const toggleSidebar = () => {
    setSidebarVisible(!sidebarVisible);
  };

  const handleLogout = async () => {
    // Clear global state
    global.isAdmin = false;
    global.isLoggedIn = false;
    
    // Clear AsyncStorage
    await AsyncStorage.removeItem('isLoggedIn');
    await AsyncStorage.removeItem('isAdmin');
    
    // Clear admin notifications
    await clearAllNotifications(true);
    
    // Also remove admin notifications from AsyncStorage directly as a fallback
    await AsyncStorage.removeItem('adminNotifications');
    
    // Navigate to login
    router.replace('/login');
  };

  const handleEditProduct = (productId: number) => {
    // Store the product ID to edit in global state
    global.productToEdit = productId;
    router.push('/admin/edit-item');
  };

  const handleDeleteProduct = (productId: number) => {
    Alert.alert(
      "Delete Product",
      "Are you sure you want to delete this product?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        { 
          text: "Delete", 
          onPress: () => deleteProduct(productId),
          style: "destructive"
        }
      ]
    );
  };

  // Handle stat card click
  const handleStatCardClick = (statCard: StatCard) => {
    if (statCard.route) {
      router.push(statCard.route);
    }
  };

  // Render the sidebar
  const renderSidebar = () => (
    <View style={[
      styles.sidebar, 
      isMobile && styles.sidebarMobile,
      isMobile && !sidebarVisible && styles.sidebarHidden
    ]}>
      <View style={styles.sidebarHeader}>
        <View style={styles.logoContainer}>
          <LayoutDashboard size={24} color="#059669" />
          <Text style={styles.sidebarTitle}>Admin Panel</Text>
        </View>
        {isMobile && (
          <TouchableOpacity onPress={toggleSidebar} style={styles.closeSidebarButton}>
            <X size={24} color="#1F2937" />
          </TouchableOpacity>
        )}
      </View>
      <ScrollView style={styles.sidebarMenu}>
        {menuItems.map((item) => (
          <TouchableOpacity
            key={item.name}
            style={[
              styles.menuItem,
              activeTab === item.name && styles.menuItemActive,
            ]}
            onPress={() => {
              setActiveTab(item.name);
              router.push(item.route);
              if (isMobile) {
                setSidebarVisible(false);
              }
            }}
          >
            <View style={styles.menuItemIconContainer}>
              <item.icon
                size={20}
                color={activeTab === item.name ? '#059669' : '#6B7280'}
              />
              {item.name === 'Notifications' && unreadAdminCount > 0 && (
                <View style={styles.sidebarNotificationBadge}>
                  <Text style={styles.sidebarNotificationBadgeText}>
                    {unreadAdminCount > 9 ? '9+' : unreadAdminCount}
                  </Text>
                </View>
              )}
            </View>
            <Text
              style={[
                styles.menuItemText,
                activeTab === item.name && styles.menuItemTextActive,
              ]}
            >
              {item.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <LogOut size={20} color="#EF4444" />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Render sidebar based on visibility state */}
      {renderSidebar()}

      {/* Main Content */}
      <View style={styles.main}>
        <View style={styles.header}>
          {isMobile && (
            <TouchableOpacity onPress={toggleSidebar} style={styles.menuButton}>
              <Menu size={24} color="#1F2937" />
            </TouchableOpacity>
          )}
          <View style={isMobile ? styles.headerTitleContainerMobile : styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Dashboard Overview</Text>
            <Text style={styles.headerSubtitle}>Welcome back, Admin</Text>
          </View>
          
          {/* Notification Button */}
          <TouchableOpacity
            style={styles.notificationButton}
            onPress={() => router.push('/notifications')}
          >
            <View>
              <Bell size={24} color="#1F2937" />
              {unreadAdminCount > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeText}>
                    {unreadAdminCount > 9 ? '9+' : unreadAdminCount}
                  </Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
          
          {/* Add New Item Button */}
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => router.push('/admin/add-item')}
          >
            <Plus size={18} color="#FFFFFF" style={styles.addButtonIcon} />
            <Text style={styles.addButtonText}>Add New Item</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          {/* Stats Grid */}
          <View style={styles.statsGrid}>
            {stats.map((stat) => (
              <TouchableOpacity 
                key={stat.name} 
                style={styles.statCard}
                onPress={() => handleStatCardClick(stat)}
                disabled={!stat.route}
              >
                <View style={[styles.statIconContainer, { backgroundColor: `${stat.color}20` }]}>
                  <stat.icon size={24} color={stat.color} />
                </View>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statName}>{stat.name}</Text>
                <Text
                  style={[
                    styles.statChange,
                    { color: stat.change.startsWith('+') ? '#059669' : '#EF4444' },
                  ]}
                >
                  {stat.change}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Products Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>Your Products</Text>
                <Text style={styles.sectionSubtitle}>
                  Manage your product inventory
                </Text>
              </View>
              <TouchableOpacity
                style={styles.viewAllButton}
                onPress={() => router.push('/admin/add-item')}
              >
                <Text style={styles.viewAllButtonText}>Add New</Text>
                <Plus size={16} color="#059669" />
              </TouchableOpacity>
            </View>

            {products.length === 0 ? (
              <View style={styles.emptyState}>
                <Package size={64} color="#E5E7EB" />
                <Text style={styles.emptyStateText}>No products added yet</Text>
                <TouchableOpacity
                  style={styles.emptyStateButton}
                  onPress={() => router.push('/admin/add-item')}
                >
                  <Text style={styles.emptyStateButtonText}>Add Your First Product</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.productsList}>
                {products.map((product) => (
                  <View key={product.id} style={styles.productCard}>
                    <Image source={{ uri: product.image }} style={styles.productImage} />
                    <View style={styles.productInfo}>
                      <Text style={styles.productName}>{product.name}</Text>
                      <View style={styles.productMeta}>
                        <View style={styles.categoryBadge}>
                          <Text style={styles.categoryBadgeText}>{product.category}</Text>
                        </View>
                        <Text style={styles.productPrice}>₹{product.price.toFixed(2)}</Text>
                      </View>
                      {product.organic && (
                        <View style={styles.organicBadge}>
                          <Text style={styles.organicBadgeText}>Organic</Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.productActions}>
                      <TouchableOpacity 
                        style={styles.editButton}
                        onPress={() => handleEditProduct(product.id)}
                      >
                        <Edit size={16} color="#FFFFFF" />
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={styles.deleteButton}
                        onPress={() => handleDeleteProduct(product.id)}
                      >
                        <Trash size={16} color="#FFFFFF" />
                      </TouchableOpacity>
                    </View>
                  </View>
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
    width: 240,
    backgroundColor: '#FFFFFF',
    borderRightWidth: 1,
    borderRightColor: '#E5E7EB',
    padding: 16,
    zIndex: 10,
  },
  sidebarMobile: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: '80%',
    maxWidth: 300,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sidebarHidden: {
    transform: [{ translateX: -300 }],
    display: 'none',
  },
  sidebarHeader: {
    marginBottom: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 12,
    flex: 1,
  },
  closeSidebarButton: {
    padding: 8,
  },
  sidebarTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 8,
  },
  sidebarMenu: {
    flex: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  menuItemActive: {
    backgroundColor: '#ECFDF5',
  },
  menuItemText: {
    fontSize: 16,
    color: '#6B7280',
    marginLeft: 12,
  },
  menuItemTextActive: {
    color: '#059669',
    fontWeight: '500',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    marginTop: 16,
  },
  logoutText: {
    fontSize: 16,
    color: '#EF4444',
    marginLeft: 12,
  },
  main: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  menuButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitleContainerMobile: {
    flex: 1,
    marginLeft: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#059669',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonIcon: {
    marginRight: 4,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  content: {
    padding: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  statName: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  statChange: {
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    flexWrap: 'wrap',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 8,
  },
  viewAllButtonText: {
    color: '#059669',
    fontWeight: '600',
    marginRight: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  emptyStateButton: {
    backgroundColor: '#059669',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  emptyStateButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  productsList: {
    gap: 16,
  },
  productCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  productImage: {
    width: 100,
    height: 100,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  productInfo: {
    flex: 1,
    padding: 16,
    minWidth: 150,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  productMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  categoryBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  categoryBadgeText: {
    fontSize: 12,
    color: '#4B5563',
  },
  productPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#059669',
  },
  organicBadge: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  organicBadgeText: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '500',
  },
  productActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 12,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    minWidth: 100,
  },
  editButton: {
    backgroundColor: '#3B82F6',
    padding: 10,
    borderRadius: 8,
    marginRight: 8,
  },
  deleteButton: {
    backgroundColor: '#EF4444',
    padding: 10,
    borderRadius: 8,
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
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
  menuItemIconContainer: {
    position: 'relative',
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sidebarNotificationBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#EF4444',
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sidebarNotificationBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
});