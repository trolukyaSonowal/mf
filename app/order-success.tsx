import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Check, Home, ShoppingBag } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme, getThemeColors } from './ThemeContext';

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
}

export default function OrderSuccessScreen() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<Order | null>(null);
  const [orderNumber, setOrderNumber] = useState<string>(orderId || '');
  const { isDarkMode } = useTheme();
  const colors = getThemeColors(isDarkMode);
  
  // Load the most recent order from AsyncStorage
  useEffect(() => {
    const loadLatestOrder = async () => {
      try {
        const ordersJson = await AsyncStorage.getItem('orders');
        if (ordersJson) {
          const orders: Order[] = JSON.parse(ordersJson);
          if (orders.length > 0) {
            // Get the most recent order (first in the array)
            setOrder(orders[0]);
          }
        }
        setLoading(false);
      } catch (error) {
        console.error('Error loading order:', error);
        setLoading(false);
      }
    };
    
    loadLatestOrder();
  }, []);

  useEffect(() => {
    if (!orderId) {
      // Generate a random order number if not provided
      const randomOrderNumber = 'ORD-' + Math.floor(100000 + Math.random() * 900000);
      setOrderNumber(randomOrderNumber);
    }
  }, [orderId]);

  // Format date
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };
  
  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>Loading order details...</Text>
        </View>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <View style={[styles.successIconContainer, { backgroundColor: colors.success }]}>
          <Check size={48} color="#FFFFFF" />
        </View>
        
        <Text style={[styles.title, { color: colors.text }]}>Order Placed Successfully!</Text>
        
        <Text style={[styles.orderNumber, { color: colors.primary }]}>
          Order #{orderNumber}
        </Text>
        
        <Text style={[styles.message, { color: colors.secondaryText }]}>
          Thank you for your order! We've received your order and will begin processing it soon.
          You will receive an email confirmation shortly.
        </Text>
        
        <View style={[styles.orderDetailsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.orderDetailsTitle, { color: colors.text }]}>Order Details</Text>
          
          {order ? (
            <>
              <View style={styles.orderDetail}>
                <Text style={[styles.orderDetailLabel, { color: colors.secondaryText }]}>Date:</Text>
                <Text style={[styles.orderDetailValue, { color: colors.text }]}>{formatDate(order.date)}</Text>
              </View>
              
              <View style={styles.orderDetail}>
                <Text style={[styles.orderDetailLabel, { color: colors.secondaryText }]}>Status:</Text>
                <View style={[styles.statusBadge, { backgroundColor: colors.primary + '20' }]}>
                  <Text style={[styles.statusText, { color: colors.primary }]}>
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </Text>
                </View>
              </View>
              
              <View style={styles.orderDetail}>
                <Text style={[styles.orderDetailLabel, { color: colors.secondaryText }]}>Total:</Text>
                <Text style={[styles.orderDetailValue, styles.totalValue, { color: colors.primary }]}>
                  ₹{order.total.toFixed(2)}
                </Text>
              </View>
              
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              
              <View style={styles.orderDetail}>
                <Text style={[styles.orderDetailLabel, { color: colors.secondaryText }]}>Delivery Address:</Text>
              </View>
              <Text style={[styles.addressText, { color: colors.text }]}>{order.address}</Text>
              
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              
              <View style={styles.orderDetail}>
                <Text style={[styles.orderDetailLabel, { color: colors.secondaryText }]}>Payment Method:</Text>
                <Text style={[styles.orderDetailValue, { color: colors.text }]}>
                  {order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Credit/Debit Card'}
                </Text>
              </View>
            </>
          ) : (
            <Text style={[styles.noOrderText, { color: colors.secondaryText }]}>
              Order details will be available soon.
            </Text>
          )}
        </View>
        
        <View style={styles.buttonsContainer}>
          <TouchableOpacity 
            style={[styles.button, styles.homeButton, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => router.replace('/(tabs)')}
          >
            <Home size={20} color={colors.text} />
            <Text style={[styles.buttonText, { color: colors.text }]}>Home</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.button, styles.trackButton, { backgroundColor: colors.primary }]}
            onPress={() => router.push(`/order-details?id=${order?.id || orderNumber}`)}
          >
            <ShoppingBag size={20} color="#FFFFFF" />
            <Text style={styles.trackButtonText}>Track Order</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 12,
  },
  successIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#059669',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
    textAlign: 'center',
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#059669',
    marginBottom: 16,
  },
  message: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  orderDetailsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    width: '100%',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  orderDetailsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  orderDetail: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  orderDetailLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  orderDetailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  statusBadge: {
    padding: 4,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 12,
  },
  addressText: {
    fontSize: 14,
    color: '#6B7280',
  },
  totalValue: {
    fontWeight: '600',
  },
  noOrderText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  buttonsContainer: {
    width: '100%',
    gap: 12,
  },
  button: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#059669',
  },
  homeButton: {
    backgroundColor: '#FFFFFF',
  },
  trackButton: {
    backgroundColor: '#059669',
  },
  buttonText: {
    color: '#059669',
    fontSize: 16,
    fontWeight: '600',
  },
  trackButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
}); 