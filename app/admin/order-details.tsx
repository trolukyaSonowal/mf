import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Package, Clock, MapPin, CreditCard, Truck, CheckCircle, Phone } from 'lucide-react-native';
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
  phoneNumber: string;
  paymentMethod: string;
  userId: string;
}

export default function AdminOrderDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const { updateOrderStatus, addNotification } = useNotifications();

  useEffect(() => {
    // Load order from AsyncStorage
    const loadOrder = async () => {
      try {
        const ordersJson = await AsyncStorage.getItem('orders');
        if (ordersJson) {
          const orders: Order[] = JSON.parse(ordersJson);
          const foundOrder = orders.find(o => o.id === id);
          if (foundOrder) {
            setOrder(foundOrder);
          }
        }
        setLoading(false);
      } catch (error) {
        console.error('Error loading order:', error);
        setLoading(false);
      }
    };

    if (id) {
      loadOrder();
    }
  }, [id]);

  // Function to handle status update
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
              await updateOrderStatus(id, newStatus);
              
              // Update local state
              if (order) {
                setOrder({
                  ...order,
                  status: newStatus
                });
              }
              
              // For the admin view, we specifically want to add a notification to the user
              // who placed the order, so we include their userId in the notification
              if (order?.userId) {
                // Add notification for the user
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
                    orderId: id,
                    forAdmin: false,
                    userId: order.userId
                  };
                  
                  const updatedNotifications = [newNotification, ...notifications];
                  await AsyncStorage.setItem('userNotifications', JSON.stringify(updatedNotifications));
                }
              }
              
              Alert.alert('Success', `Order status updated to ${newStatus}`);
            } catch (error) {
              console.error('Error updating order status:', error);
              Alert.alert('Error', 'Failed to update order status');
            }
          }
        },
      ]
    );
  };

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

  // Calculate subtotal
  const calculateSubtotal = (items: OrderItem[]) => {
    return items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Order Details</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading order details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Order Details</Text>
        </View>
        <View style={styles.errorContainer}>
          <Package size={64} color="#E5E7EB" />
          <Text style={styles.errorTitle}>Order Not Found</Text>
          <Text style={styles.errorText}>
            We couldn't find the order you're looking for.
          </Text>
          <TouchableOpacity 
            style={styles.backToOrdersButton}
            onPress={() => router.push('/admin')}
          >
            <Text style={styles.backToOrdersButtonText}>Back to Dashboard</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const subtotal = calculateSubtotal(order.items);
  const deliveryFee = 2.99;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Details</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Order Status */}
        <View style={styles.section}>
          <View style={styles.orderHeader}>
            <View>
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

          {/* Status Update Buttons */}
          <View style={styles.statusActions}>
            <Text style={styles.statusActionsTitle}>Update Order Status:</Text>
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
                <Package size={20} color={order.status === 'pending' ? '#F59E0B' : '#6B7280'} />
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
                <Clock size={20} color={order.status === 'processing' ? '#3B82F6' : '#6B7280'} />
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
                <Truck size={20} color={order.status === 'shipped' ? '#8B5CF6' : '#6B7280'} />
                <Text style={[
                  styles.statusButtonText,
                  order.status === 'shipped' && { color: '#8B5CF6' }
                ]}>Shipped</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.statusButton,
                  order.status === 'delivered' && styles.activeStatusButton,
                  { backgroundColor: order.status === 'delivered' ? '#059669' : '#F3F4F6' }
                ]}
                onPress={() => handleUpdateStatus('delivered')}
                disabled={order.status === 'delivered'}
              >
                <CheckCircle size={20} color={order.status === 'delivered' ? '#FFFFFF' : '#6B7280'} />
                <Text style={[
                  styles.statusButtonText,
                  order.status === 'delivered' && { color: '#FFFFFF' }
                ]}>Delivered</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Status Timeline */}
          <View style={styles.timeline}>
            <View style={[
              styles.timelineStep, 
              { opacity: ['pending', 'processing', 'shipped', 'delivered'].includes(order.status) ? 1 : 0.4 }
            ]}>
              <View style={[
                styles.timelineDot,
                { backgroundColor: ['pending', 'processing', 'shipped', 'delivered'].includes(order.status) ? '#059669' : '#D1D5DB' }
              ]} />
              <Text style={styles.timelineText}>Order Placed</Text>
            </View>
            <View style={[
              styles.timelineConnector,
              { backgroundColor: ['processing', 'shipped', 'delivered'].includes(order.status) ? '#059669' : '#D1D5DB' }
            ]} />
            <View style={[
              styles.timelineStep, 
              { opacity: ['processing', 'shipped', 'delivered'].includes(order.status) ? 1 : 0.4 }
            ]}>
              <View style={[
                styles.timelineDot,
                { backgroundColor: ['processing', 'shipped', 'delivered'].includes(order.status) ? '#059669' : '#D1D5DB' }
              ]} />
              <Text style={styles.timelineText}>Processing</Text>
            </View>
            <View style={[
              styles.timelineConnector,
              { backgroundColor: ['shipped', 'delivered'].includes(order.status) ? '#059669' : '#D1D5DB' }
            ]} />
            <View style={[
              styles.timelineStep, 
              { opacity: ['shipped', 'delivered'].includes(order.status) ? 1 : 0.4 }
            ]}>
              <View style={[
                styles.timelineDot,
                { backgroundColor: ['shipped', 'delivered'].includes(order.status) ? '#059669' : '#D1D5DB' }
              ]} />
              <Text style={styles.timelineText}>Shipped</Text>
            </View>
            <View style={[
              styles.timelineConnector,
              { backgroundColor: ['delivered'].includes(order.status) ? '#059669' : '#D1D5DB' }
            ]} />
            <View style={[
              styles.timelineStep, 
              { opacity: ['delivered'].includes(order.status) ? 1 : 0.4 }
            ]}>
              <View style={[
                styles.timelineDot,
                { backgroundColor: ['delivered'].includes(order.status) ? '#059669' : '#D1D5DB' }
              ]} />
              <Text style={styles.timelineText}>Delivered</Text>
            </View>
          </View>
        </View>

        {/* Order Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Items</Text>
          {order.items.map((item) => (
            <View key={item.id} style={styles.orderItem}>
              <Image source={{ uri: item.image }} style={styles.itemImage} />
              <View style={styles.itemDetails}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemPrice}>₹{item.price.toFixed(2)}</Text>
                <View style={styles.quantityContainer}>
                  <Text style={styles.quantityText}>Quantity: {item.quantity}</Text>
                </View>
              </View>
              <Text style={styles.itemTotal}>₹{(item.price * item.quantity).toFixed(2)}</Text>
            </View>
          ))}
        </View>

        {/* Delivery Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Shipping Details</Text>
          <View style={styles.infoItem}>
            <MapPin size={20} color="#059669" style={styles.infoIcon} />
            <View>
              <Text style={styles.infoLabel}>Shipping Address</Text>
              <Text style={styles.infoValue}>{order.address}</Text>
            </View>
          </View>
          <View style={styles.infoItem}>
            <Phone size={20} color="#059669" style={styles.infoIcon} />
            <View>
              <Text style={styles.infoLabel}>Contact Number</Text>
              <Text style={styles.infoValue}>{order.phoneNumber || 'Not provided'}</Text>
            </View>
          </View>
        </View>

        {/* Payment Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Information</Text>
          <View style={styles.infoItem}>
            <CreditCard size={20} color="#059669" style={styles.infoIcon} />
            <View>
              <Text style={styles.infoLabel}>Payment Method</Text>
              <Text style={styles.infoValue}>{order.paymentMethod}</Text>
            </View>
          </View>
        </View>

        {/* Order Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>₹{subtotal.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Delivery Fee</Text>
            <Text style={styles.summaryValue}>₹{deliveryFee.toFixed(2)}</Text>
          </View>
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>₹{order.total.toFixed(2)}</Text>
          </View>
        </View>
      </ScrollView>
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
    marginRight: 12,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  content: {
    flex: 1,
    padding: 16,
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  backToOrdersButton: {
    backgroundColor: '#059669',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  backToOrdersButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
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
  statusActions: {
    marginVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 16,
  },
  statusActionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  statusButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
  },
  statusButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: '48%',
    marginBottom: 8,
  },
  activeStatusButton: {
    borderWidth: 1,
    borderColor: 'transparent',
  },
  statusButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginLeft: 8,
  },
  timeline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  timelineStep: {
    alignItems: 'center',
    width: 70,
  },
  timelineDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  timelineConnector: {
    height: 2,
    flex: 1,
  },
  timelineText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  orderItem: {
    flexDirection: 'row',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  itemImage: {
    width: 64,
    height: 64,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  itemDetails: {
    flex: 1,
    marginLeft: 12,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  quantityContainer: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  quantityText: {
    fontSize: 12,
    color: '#6B7280',
  },
  itemTotal: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 12,
    alignSelf: 'center',
  },
  infoItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  infoIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  infoLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: '#1F2937',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
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
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#059669',
  },
}); 