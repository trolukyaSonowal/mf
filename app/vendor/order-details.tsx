import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Package, Clock, MapPin, CreditCard, Truck, CheckCircle, Bell, Phone } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNotifications } from '../NotificationContext';
import { VendorContext } from '../VendorContext';

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
  phoneNumber: string;
  paymentMethod: string;
  userId?: string;
}

export default function VendorOrderDetails() {
  const { id } = useLocalSearchParams();
  const orderId = typeof id === 'string' ? id : '';
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const { updateOrderStatus, userNotifications, unreadUserCount } = useNotifications();
  const { currentVendor } = useContext(VendorContext);
  const [localVendor, setLocalVendor] = useState<any>(null);
  const [vendorItems, setVendorItems] = useState<OrderItem[]>([]);
  const [vendorTotal, setVendorTotal] = useState(0);
  
  // Load vendor data from AsyncStorage as a fallback
  useEffect(() => {
    const loadVendorData = async () => {
      try {
        // If we already have the vendor from context, use that
        if (currentVendor) {
          console.log('VendorOrderDetails: Using vendor from context:', currentVendor.name);
          setLocalVendor(currentVendor);
          return;
        }
        
        // Otherwise, try to load from AsyncStorage
        const vendorData = await AsyncStorage.getItem('currentVendor');
        const vendorId = await AsyncStorage.getItem('vendorId');
        
        console.log('VendorOrderDetails: Loading vendor from AsyncStorage, vendorId:', vendorId);
        
        if (vendorData) {
          const parsedVendor = JSON.parse(vendorData);
          console.log('VendorOrderDetails: Loaded vendor from AsyncStorage:', parsedVendor.name);
          setLocalVendor(parsedVendor);
        } else {
          console.error('VendorOrderDetails: No vendor data found in AsyncStorage');
        }
      } catch (error) {
        console.error('Error loading vendor data:', error);
      }
    };
    
    loadVendorData();
  }, [currentVendor]);
  
  // Load order data
  useEffect(() => {
    const loadOrderDetails = async () => {
      if (!orderId || (!localVendor && !currentVendor)) return;
      
      try {
        setLoading(true);
        // Get current vendor ID
        const vendorId = localVendor?.id || currentVendor?.id;
        
        const ordersJson = await AsyncStorage.getItem('orders');
        if (!ordersJson) {
          setLoading(false);
          return;
        }
        
        const orders = JSON.parse(ordersJson);
        const foundOrder = orders.find((o: Order) => o.id === orderId);
        
        if (!foundOrder) {
          setLoading(false);
          Alert.alert('Error', 'Order not found');
          router.back();
          return;
        }
        
        // Find products belonging to this vendor
        const productsJson = await AsyncStorage.getItem('products');
        
        if (productsJson) {
          const allProducts = JSON.parse(productsJson);
          
          // Filter items for this vendor
          const vendorOrderItems = foundOrder.items.filter((item: OrderItem) => {
            const product = allProducts.find((p: any) => p.id === item.id);
            return product && product.vendorId === vendorId;
          });
          
          // If the order doesn't contain any products from this vendor, they shouldn't see it
          if (vendorOrderItems.length === 0) {
            setLoading(false);
            Alert.alert('Error', 'This order does not contain any of your products');
            router.back();
            return;
          }
          
          // Calculate vendor-specific total
          const vendorOrderTotal = vendorOrderItems.reduce(
            (sum: number, item: OrderItem) => sum + (item.price * item.quantity),
            0
          );
          
          setVendorItems(vendorOrderItems);
          setVendorTotal(vendorOrderTotal);
        } else {
          setLoading(false);
          Alert.alert('Error', 'Product information not found');
          router.back();
          return;
        }
        
        setOrder(foundOrder);
        setLoading(false);
      } catch (error) {
        console.error('Error loading order details:', error);
        setLoading(false);
        Alert.alert('Error', 'Failed to load order details');
        router.back();
      }
    };
    
    loadOrderDetails();
  }, [orderId, localVendor, currentVendor]);
  
  const handleUpdateStatus = (newStatus: 'pending' | 'processing' | 'shipped' | 'delivered') => {
    Alert.alert(
      'Update Order Status',
      `Are you sure you want to update the status to "${newStatus}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Update', 
          onPress: async () => {
            try {
              if (!order) return;
              
              // Update in AsyncStorage
              const ordersJson = await AsyncStorage.getItem('orders');
              if (ordersJson) {
                const allOrders = JSON.parse(ordersJson);
                const updatedOrders = allOrders.map((o: Order) => {
                  if (o.id === orderId) {
                    return { ...o, status: newStatus };
                  }
                  return o;
                });
                
                await AsyncStorage.setItem('orders', JSON.stringify(updatedOrders));
                
                // Update local state
                setOrder({ ...order, status: newStatus });
                
                // Add notification for the customer about status change
                const statusMessages = {
                  pending: 'Your order has been received and is pending confirmation.',
                  processing: 'Your order is now being processed.',
                  shipped: 'Your order has been shipped and is on the way!',
                  delivered: 'Your order has been delivered. Enjoy!'
                };
                
                // Also send notification to the customer who placed the order
                if (order.userId) {
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
                      forAdmin: false,
                      userId: order.userId
                    };
                    
                    const updatedNotifications = [newNotification, ...notifications];
                    await AsyncStorage.setItem('userNotifications', JSON.stringify(updatedNotifications));
                  }
                }
                
                Alert.alert('Success', `Order status updated to ${newStatus}`);
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
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          Order Details {order ? `#${order.id}` : ''}
        </Text>
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
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading order details...</Text>
        </View>
      ) : order ? (
        <ScrollView style={styles.content}>
          <View style={styles.orderStatusContainer}>
            <View style={styles.orderStatusHeader}>
              <Text style={styles.sectionTitle}>Order Status</Text>
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
            
            <View style={styles.statusButtons}>
              <TouchableOpacity 
                style={[
                  styles.statusButton,
                  order.status === 'pending' && styles.activeStatusButton,
                  { backgroundColor: order.status === 'pending' ? '#F59E0B20' : '#F3F4F6' }
                ]}
                onPress={() => handleUpdateStatus('pending')}
                disabled={order.status === 'pending'}
              >
                <Text style={[
                  styles.statusButtonText,
                  order.status === 'pending' && { color: '#F59E0B' }
                ]}>Pending</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.statusButton,
                  order.status === 'processing' && styles.activeStatusButton,
                  { backgroundColor: order.status === 'processing' ? '#3B82F620' : '#F3F4F6' }
                ]}
                onPress={() => handleUpdateStatus('processing')}
                disabled={order.status === 'processing'}
              >
                <Text style={[
                  styles.statusButtonText,
                  order.status === 'processing' && { color: '#3B82F6' }
                ]}>Processing</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.statusButton,
                  order.status === 'shipped' && styles.activeStatusButton,
                  { backgroundColor: order.status === 'shipped' ? '#8B5CF620' : '#F3F4F6' }
                ]}
                onPress={() => handleUpdateStatus('shipped')}
                disabled={order.status === 'shipped'}
              >
                <Text style={[
                  styles.statusButtonText,
                  order.status === 'shipped' && { color: '#8B5CF6' }
                ]}>Shipped</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.statusButton,
                  order.status === 'delivered' && styles.activeStatusButton,
                  { backgroundColor: order.status === 'delivered' ? '#05966920' : '#F3F4F6' }
                ]}
                onPress={() => handleUpdateStatus('delivered')}
                disabled={order.status === 'delivered'}
              >
                <Text style={[
                  styles.statusButtonText,
                  order.status === 'delivered' && { color: '#059669' }
                ]}>Delivered</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.orderInfoContainer}>
            <View style={styles.orderInfoItem}>
              <Clock size={20} color="#6B7280" />
              <View style={styles.orderInfoContent}>
                <Text style={styles.orderInfoLabel}>Order Date</Text>
                <Text style={styles.orderInfoText}>
                  {new Date(order.date).toLocaleDateString()} at {new Date(order.date).toLocaleTimeString()}
                </Text>
              </View>
            </View>
            
            <View style={styles.orderInfoItem}>
              <MapPin size={20} color="#6B7280" />
              <View style={styles.orderInfoContent}>
                <Text style={styles.orderInfoLabel}>Shipping Address</Text>
                <Text style={styles.orderInfoText}>{order.address}</Text>
              </View>
            </View>
            
            <View style={styles.orderInfoItem}>
              <Phone size={20} color="#6B7280" />
              <View style={styles.orderInfoContent}>
                <Text style={styles.orderInfoLabel}>Contact Number</Text>
                <Text style={styles.orderInfoText}>{order.phoneNumber || 'Not provided'}</Text>
              </View>
            </View>
            
            <View style={styles.orderInfoItem}>
              <CreditCard size={20} color="#6B7280" />
              <View style={styles.orderInfoContent}>
                <Text style={styles.orderInfoLabel}>Payment Method</Text>
                <Text style={styles.orderInfoText}>{order.paymentMethod}</Text>
              </View>
            </View>
          </View>
          
          <View style={styles.productsContainer}>
            <Text style={styles.sectionTitle}>Order Items (Your Products)</Text>
            
            {vendorItems.map((item, index) => (
              <View 
                key={index} 
                style={[
                  styles.productItem,
                  index !== vendorItems.length - 1 && styles.productItemBorder
                ]}
              >
                <Image source={{ uri: item.image }} style={styles.productImage} />
                <View style={styles.productDetails}>
                  <Text style={styles.productName}>{item.name}</Text>
                  <Text style={styles.productPrice}>₹{item.price.toFixed(2)} x {item.quantity}</Text>
                </View>
                <Text style={styles.productTotal}>₹{(item.price * item.quantity).toFixed(2)}</Text>
              </View>
            ))}
            
            <View style={styles.orderSummary}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Your Items Total</Text>
                <Text style={styles.summaryValue}>₹{vendorTotal.toFixed(2)}</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      ) : (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Order not found</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 18,
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
    top: 0,
    right: 0,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
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
  content: {
    flex: 1,
    padding: 16,
  },
  orderStatusContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  orderStatusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },
  statusButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  statusButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
    marginBottom: 8,
  },
  activeStatusButton: {
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  statusButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  orderInfoContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  orderInfoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  orderInfoContent: {
    marginLeft: 12,
    flex: 1,
  },
  orderInfoLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  orderInfoText: {
    fontSize: 14,
    color: '#1F2937',
  },
  productsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  productItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
  },
  productItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  productImage: {
    width: 64,
    height: 64,
    borderRadius: 8,
    marginRight: 12,
  },
  productDetails: {
    flex: 1,
  },
  productName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 12,
    color: '#6B7280',
  },
  productTotal: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  orderSummary: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#059669',
  },
}); 