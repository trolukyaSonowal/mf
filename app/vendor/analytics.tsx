import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { BarChart2, ShoppingCart, Package, Users, TrendingUp, Menu, X, Calendar, ChevronDown, Bell } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { VendorContext } from '../VendorContext';
import { ProductsContext } from '../ProductsContext';
import { useNotifications } from '../NotificationContext';

// Mock sales data
const DAILY_SALES = [
  { day: 'Mon', amount: 1200 },
  { day: 'Tue', amount: 1900 },
  { day: 'Wed', amount: 3000 },
  { day: 'Thu', amount: 2780 },
  { day: 'Fri', amount: 1890 },
  { day: 'Sat', amount: 3390 },
  { day: 'Sun', amount: 3490 }
];

const MONTHLY_SALES = [
  { month: 'Jan', amount: 18500 },
  { month: 'Feb', amount: 22000 },
  { month: 'Mar', amount: 32000 },
  { month: 'Apr', amount: 28000 },
  { month: 'May', amount: 29000 },
  { month: 'Jun', amount: 35000 },
  { month: 'Jul', amount: 33000 },
  { month: 'Aug', amount: 38000 },
  { month: 'Sep', amount: 42000 },
  { month: 'Oct', amount: 35000 },
  { month: 'Nov', amount: 42000 },
  { month: 'Dec', amount: 52000 }
];

const TOP_PRODUCTS = [
  { id: 1, name: 'Organic Apples', sales: 123, revenue: 18450 },
  { id: 2, name: 'Fresh Milk', sales: 98, revenue: 15680 },
  { id: 3, name: 'Whole Wheat Bread', sales: 76, revenue: 11400 },
  { id: 4, name: 'Yogurt Pack', sales: 67, revenue: 10050 },
];

type SalesDataItem = { month?: string; day?: string; amount: number };

export default function VendorAnalytics() {
  const { currentVendor } = useContext(VendorContext);
  const { products } = useContext(ProductsContext);
  const { userNotifications, unreadUserCount } = useNotifications();
  const [windowWidth, setWindowWidth] = useState(Dimensions.get('window').width);
  const [sidebarVisible, setSidebarVisible] = useState(windowWidth >= 768);
  const [localVendor, setLocalVendor] = useState<any>(null);
  const [timeRange, setTimeRange] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');
  const [salesData, setSalesData] = useState<SalesDataItem[]>(MONTHLY_SALES);
  
  // Analytics metrics
  const [metrics, setMetrics] = useState({
    totalSales: 350980,
    totalOrders: 1254,
    averageOrderValue: 280,
    conversionRate: 5.2,
    salesGrowth: 12.8,
    pendingOrders: 8
  });
  
  // Load vendor data from AsyncStorage as a fallback
  useEffect(() => {
    const loadVendorData = async () => {
      try {
        // If we already have the vendor from context, use that
        if (currentVendor) {
          console.log('VendorAnalytics: Using vendor from context:', currentVendor.name);
          setLocalVendor(currentVendor);
          return;
        }
        
        // Otherwise, try to load from AsyncStorage
        const vendorData = await AsyncStorage.getItem('currentVendor');
        const vendorId = await AsyncStorage.getItem('vendorId');
        
        console.log('VendorAnalytics: Loading vendor from AsyncStorage, vendorId:', vendorId);
        
        if (vendorData) {
          const parsedVendor = JSON.parse(vendorData);
          console.log('VendorAnalytics: Loaded vendor from AsyncStorage:', parsedVendor.name);
          setLocalVendor(parsedVendor);
        } else {
          console.error('VendorAnalytics: No vendor data found in AsyncStorage');
        }
      } catch (error) {
        console.error('Error loading vendor data:', error);
      }
    };
    
    loadVendorData();
  }, [currentVendor]);
  
  useEffect(() => {
    const dimensionsHandler = Dimensions.addEventListener('change', ({ window }) => {
      setWindowWidth(window.width);
      setSidebarVisible(window.width >= 768);
    });

    return () => {
      dimensionsHandler.remove();
    };
  }, []);
  
  const handleTimeRangeChange = (range: 'daily' | 'weekly' | 'monthly' | 'yearly') => {
    setTimeRange(range);
    
    // Set different data based on time range
    if (range === 'daily') {
      setSalesData(DAILY_SALES);
    } else {
      setSalesData(MONTHLY_SALES);
    }
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
          style={styles.menuItem}
          onPress={() => router.push('/vendor/orders')}
        >
          <ShoppingCart size={20} color="#6B7280" />
          <Text style={styles.menuItemText}>Orders</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.menuItem, styles.activeMenuItem]}
          onPress={() => router.push('/vendor/analytics')}
        >
          <TrendingUp size={20} color="#FFFFFF" />
          <Text style={[styles.menuItemText, styles.activeMenuItemText]}>Analytics</Text>
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
  
  // Simple chart component that shows bars based on data
  const BarChartSimple = ({ data }: { data: any[] }) => {
    const maxAmount = Math.max(...data.map(item => item.amount));
    
    return (
      <View style={styles.barChartContainer}>
        {data.map((item, index) => (
          <View key={index} style={styles.barChartItem}>
            <View style={styles.barLabelContainer}>
              <Text style={styles.barLabel}>
                {item.day || item.month}
              </Text>
            </View>
            <View style={styles.barContainer}>
              <View 
                style={[
                  styles.bar, 
                  { 
                    height: (item.amount / maxAmount) * 150,
                    backgroundColor: '#059669'
                  }
                ]} 
              />
            </View>
            <Text style={styles.barValue}>
              ₹{item.amount.toLocaleString()}
            </Text>
          </View>
        ))}
      </View>
    );
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
          <Text style={styles.headerTitle}>Analytics</Text>
          
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
        
        <View style={styles.timeRangeContainer}>
          <View style={styles.timeRangePill}>
            <Calendar size={18} color="#4B5563" style={styles.timeRangeIcon} />
            
            {['daily', 'weekly', 'monthly', 'yearly'].map((range) => (
              <TouchableOpacity 
                key={range}
                style={[
                  styles.timeRangeOption,
                  timeRange === range && styles.timeRangeOptionActive
                ]}
                onPress={() => handleTimeRangeChange(range as any)}
              >
                <Text style={[
                  styles.timeRangeText,
                  timeRange === range && styles.timeRangeTextActive
                ]}>
                  {range.charAt(0).toUpperCase() + range.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          
          <TouchableOpacity style={styles.dateRangeButton}>
            <Text style={styles.dateRangeText}>Apr 1 - Apr 30, 2023</Text>
            <ChevronDown size={16} color="#4B5563" />
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.content}>
          <View style={styles.metricsContainer}>
            <View style={styles.metricCard}>
              <View style={[styles.metricIconContainer, { backgroundColor: '#059669' }]}>
                <ShoppingCart size={24} color="#FFFFFF" />
              </View>
              <View style={styles.metricContent}>
                <Text style={styles.metricValue}>₹{metrics.totalSales.toLocaleString()}</Text>
                <Text style={styles.metricLabel}>Total Sales</Text>
              </View>
              <View style={styles.metricTrend}>
                <TrendingUp size={16} color="#059669" />
                <Text style={[styles.metricTrendText, { color: '#059669' }]}>+{metrics.salesGrowth}%</Text>
              </View>
            </View>
            
            <View style={styles.metricCard}>
              <View style={[styles.metricIconContainer, { backgroundColor: '#3B82F6' }]}>
                <ShoppingCart size={24} color="#FFFFFF" />
              </View>
              <View style={styles.metricContent}>
                <Text style={styles.metricValue}>{metrics.totalOrders}</Text>
                <Text style={styles.metricLabel}>Total Orders</Text>
              </View>
              <View style={styles.metricTrend}>
                <Text style={styles.metricSecondary}>{metrics.pendingOrders} pending</Text>
              </View>
            </View>
            
            <View style={styles.metricCard}>
              <View style={[styles.metricIconContainer, { backgroundColor: '#8B5CF6' }]}>
                <ShoppingCart size={24} color="#FFFFFF" />
              </View>
              <View style={styles.metricContent}>
                <Text style={styles.metricValue}>₹{metrics.averageOrderValue}</Text>
                <Text style={styles.metricLabel}>Average Order</Text>
              </View>
            </View>
            
            <View style={styles.metricCard}>
              <View style={[styles.metricIconContainer, { backgroundColor: '#F59E0B' }]}>
                <TrendingUp size={24} color="#FFFFFF" />
              </View>
              <View style={styles.metricContent}>
                <Text style={styles.metricValue}>{metrics.conversionRate}%</Text>
                <Text style={styles.metricLabel}>Conversion Rate</Text>
              </View>
            </View>
          </View>
          
          <View style={styles.chartContainer}>
            <View style={styles.chartHeader}>
              <Text style={styles.chartTitle}>Sales Overview</Text>
            </View>
            
            <BarChartSimple data={salesData} />
          </View>
          
          <View style={styles.productPerformanceContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Top Performing Products</Text>
            </View>
            
            <View style={styles.productTable}>
              <View style={styles.productTableHeader}>
                <Text style={[styles.productTableHeaderText, { flex: 2 }]}>Product</Text>
                <Text style={[styles.productTableHeaderText, { flex: 1, textAlign: 'center' }]}>Units Sold</Text>
                <Text style={[styles.productTableHeaderText, { flex: 1, textAlign: 'right' }]}>Revenue</Text>
              </View>
              
              {TOP_PRODUCTS.map((product) => (
                <View key={product.id} style={styles.productTableRow}>
                  <Text style={[styles.productTableText, { flex: 2, fontWeight: '500' }]}>{product.name}</Text>
                  <Text style={[styles.productTableText, { flex: 1, textAlign: 'center' }]}>{product.sales}</Text>
                  <Text style={[styles.productTableText, { flex: 1, textAlign: 'right', color: '#059669' }]}>
                    ₹{product.revenue.toLocaleString()}
                  </Text>
                </View>
              ))}
            </View>
          </View>
          
          <View style={styles.tipsContainer}>
            <Text style={styles.tipsTitle}>Performance Tips</Text>
            <View style={styles.tipCard}>
              <View style={styles.tipIconContainer}>
                <TrendingUp size={20} color="#FFFFFF" />
              </View>
              <View style={styles.tipContent}>
                <Text style={styles.tipTitle}>Improve Your Sales</Text>
                <Text style={styles.tipText}>
                  Consider adding promotional deals to your top-selling products to boost sales even further.
                </Text>
              </View>
            </View>
            
            <View style={styles.tipCard}>
              <View style={[styles.tipIconContainer, { backgroundColor: '#8B5CF6' }]}>
                <Package size={20} color="#FFFFFF" />
              </View>
              <View style={styles.tipContent}>
                <Text style={styles.tipTitle}>Expand Your Product Range</Text>
                <Text style={styles.tipText}>
                  Based on your sales data, consider adding more variety to your organic fruits category.
                </Text>
              </View>
            </View>
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
  timeRangeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  timeRangePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 24,
    padding: 4,
  },
  timeRangeIcon: {
    marginHorizontal: 8,
  },
  timeRangeOption: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  timeRangeOptionActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  timeRangeText: {
    fontSize: 14,
    color: '#6B7280',
  },
  timeRangeTextActive: {
    fontWeight: '600',
    color: '#1F2937',
  },
  dateRangeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  dateRangeText: {
    fontSize: 14,
    color: '#4B5563',
    marginRight: 8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  metricsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
    marginBottom: 24,
  },
  metricCard: {
    flex: 1,
    minWidth: 150,
    margin: 8,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  metricIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#059669',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  metricContent: {
    marginBottom: 8,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  metricTrend: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricTrendText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  metricSecondary: {
    fontSize: 14,
    color: '#6B7280',
  },
  chartContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  barChartContainer: {
    flexDirection: 'row',
    height: 200,
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingBottom: 16,
  },
  barChartItem: {
    flex: 1,
    alignItems: 'center',
  },
  barLabelContainer: {
    position: 'absolute',
    bottom: -20,
    width: '100%',
    alignItems: 'center',
  },
  barLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  barContainer: {
    width: '70%',
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: 150,
  },
  bar: {
    width: '100%',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  barValue: {
    fontSize: 10,
    color: '#6B7280',
    marginTop: 4,
    position: 'absolute',
    bottom: -38,
  },
  productPerformanceContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  productTable: {
    marginBottom: 8,
  },
  productTableHeader: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  productTableHeaderText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
  },
  productTableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  productTableText: {
    fontSize: 14,
    color: '#4B5563',
  },
  tipsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  tipCard: {
    flexDirection: 'row',
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
  },
  tipIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#059669',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  tipText: {
    fontSize: 14,
    color: '#6B7280',
  },
}); 