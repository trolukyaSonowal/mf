import React, { useState, useContext, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, CreditCard, Truck, MapPin, DollarSign, Check } from 'lucide-react-native';
import { CartContext } from './CartContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNotifications } from './NotificationContext';
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
  userId?: string;
}

export default function CheckoutScreen() {
  const { cartItems, getTotalPrice, clearCart } = useContext(CartContext);
  const { addNotification } = useNotifications();
  const { isDarkMode } = useTheme();
  const colors = getThemeColors(isDarkMode);
  const [loading, setLoading] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cod'); // Default to Cash on Delivery
  const [deliveryMethod, setDeliveryMethod] = useState('standard'); // Default to Standard Delivery
  const [orderId, setOrderId] = useState('');
  
  // Form state
  const [formData, setFormData] = useState({
    fullName: '',
    phoneNumber: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
  });

  // Calculate costs
  const subtotal = getTotalPrice();
  const deliveryFee = deliveryMethod === 'express' ? 5.99 : 2.99;
  const total = subtotal + deliveryFee;

  // Load saved address if available
  useEffect(() => {
    const loadDefaultAddress = async () => {
      try {
        const addressesJson = await AsyncStorage.getItem('addresses');
        if (addressesJson) {
          const addresses = JSON.parse(addressesJson);
          const defaultAddress = addresses.find((addr: any) => addr.isDefault);
          
          if (defaultAddress) {
            setFormData({
              fullName: defaultAddress.fullName,
              phoneNumber: defaultAddress.phoneNumber,
              address: defaultAddress.address,
              city: defaultAddress.city,
              state: defaultAddress.state,
              pincode: defaultAddress.pincode,
            });
          }
        }
      } catch (error) {
        console.error('Error loading default address:', error);
      }
    };
    
    loadDefaultAddress();
  }, []);

  useEffect(() => {
    // Redirect back to cart if cart is empty
    if (cartItems.length === 0 && !orderPlaced) {
      router.replace('/(tabs)/cart');
    }
  }, [cartItems]);

  const handleInputChange = (field: string, value: string) => {
    setFormData({
      ...formData,
      [field]: value,
    });
  };

  const validateForm = () => {
    const { fullName, phoneNumber, address, city, state, pincode } = formData;
    
    if (!fullName || !phoneNumber || !address || !city || !state || !pincode) {
      Alert.alert('Error', 'Please fill in all required fields');
      return false;
    }
    
    if (phoneNumber.length !== 10 || !/^\d+$/.test(phoneNumber)) {
      Alert.alert('Error', 'Please enter a valid 10-digit phone number');
      return false;
    }
    
    if (pincode.length !== 6 || !/^\d+$/.test(pincode)) {
      Alert.alert('Error', 'Please enter a valid 6-digit pincode');
      return false;
    }
    
    return true;
  };

  // Generate a random order ID
  const generateOrderId = () => {
    return `ORD-${Math.floor(100000 + Math.random() * 900000)}`;
  };

  // Save order to AsyncStorage
  const saveOrder = async () => {
    try {
      // Create order object
      const newOrderId = generateOrderId();
      setOrderId(newOrderId);
      
      const fullAddress = `${formData.address}, ${formData.city}, ${formData.state}, ${formData.pincode}`;
      
      const orderItems: OrderItem[] = cartItems.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image: item.image
      }));
      
      // Get current user ID to associate with the order
      const userId = await AsyncStorage.getItem('userId');
      
      const newOrder: Order = {
        id: newOrderId,
        date: new Date().toISOString(),
        items: orderItems,
        total: total,
        status: 'pending',
        address: fullAddress,
        phoneNumber: formData.phoneNumber,
        paymentMethod: paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Payment',
        userId: userId || undefined // Associate order with user
      };
      
      // Get existing orders
      const ordersJson = await AsyncStorage.getItem('orders');
      let orders: Order[] = [];
      
      if (ordersJson) {
        orders = JSON.parse(ordersJson);
      }
      
      // Add new order
      orders.unshift(newOrder);
      
      // Save updated orders
      await AsyncStorage.setItem('orders', JSON.stringify(orders));
      
      // Add notification for admin
      await addNotification({
        title: 'New Order Placed',
        message: `A new order #${newOrderId} has been placed for ₹${total.toFixed(2)}`,
        type: 'order_placed',
        orderId: newOrderId,
        forAdmin: true
      });
      
      // Add notification for user
      await addNotification({
        title: 'Order Placed Successfully',
        message: `Your order #${newOrderId} has been placed and is pending confirmation.`,
        type: 'order_placed',
        orderId: newOrderId,
        forAdmin: false,
        userId: userId || undefined // Handle null case by converting to undefined
      });
      
      // Get products data to get vendor information
      const productsJson = await AsyncStorage.getItem('products');
      if (productsJson) {
        const allProducts = JSON.parse(productsJson);
        
        // Create a map of vendor IDs to their products in this order
        const vendorProductsMap = new Map();
        
        // Match cart items with products to find vendor information
        for (const item of cartItems) {
          const product = allProducts.find((p: any) => p.id === item.id);
          if (product && product.vendorId) {
            if (!vendorProductsMap.has(product.vendorId)) {
              vendorProductsMap.set(product.vendorId, []);
            }
            vendorProductsMap.get(product.vendorId).push({
              ...item,
              productId: product.id
            });
          }
        }
        
        // Send notifications to each vendor for their products
        for (const [vendorId, products] of vendorProductsMap.entries()) {
          const totalAmount = products.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
          const productCount = products.length;
          const productNames = products.map((p: any) => p.name).join(", ");
          
          await addNotification({
            title: 'New Order Received',
            message: `You have received a new order #${newOrderId} for ${productCount} product${productCount > 1 ? 's' : ''} (${productNames}) totaling ₹${totalAmount.toFixed(2)}`,
            type: 'order_placed',
            orderId: newOrderId,
            forAdmin: false,
            forVendor: true,
            vendorId: vendorId,
            userId: userId || undefined // Associate with the user who placed the order
          });
        }
      }
      
      return newOrderId;
    } catch (error) {
      console.error('Error saving order:', error);
      Alert.alert('Error', 'Failed to save your order. Please try again.');
      return null;
    }
  };

  const handlePlaceOrder = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    
    // Save order to AsyncStorage
    const savedOrderId = await saveOrder();
    
    if (!savedOrderId) {
      setLoading(false);
      return;
    }
    
    // Simulate order processing
    setTimeout(() => {
      setLoading(false);
      setOrderPlaced(true);
      
      // Clear cart after successful order
      setTimeout(() => {
        clearCart();
        router.replace({
          pathname: '/order-success',
          params: { orderId: savedOrderId }
        });
      }, 2000);
    }, 1500);
  };

  if (orderPlaced) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.successContainer, { backgroundColor: colors.card }]}>
          <View style={[styles.successIconContainer, { backgroundColor: colors.success + '20' }]}>
            <Check size={48} color={colors.success} />
          </View>
          <Text style={[styles.successTitle, { color: colors.text }]}>Order Placed Successfully!</Text>
          <Text style={[styles.successMessage, { color: colors.secondaryText }]}>
            Your order has been placed successfully. You will receive a confirmation shortly.
          </Text>
          <Text style={[styles.orderIdText, { color: colors.text }]}>Order ID: {orderId}</Text>
          <Text style={[styles.redirectingText, { color: colors.secondaryText }]}>Redirecting to order summary...</Text>
          <ActivityIndicator size="small" color={colors.success} style={styles.loader} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Checkout</Text>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView style={styles.content}>
          {/* Delivery Address Section */}
          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <View style={styles.sectionHeader}>
              <MapPin size={20} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Delivery Address</Text>
            </View>
            
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.secondaryText }]}>Full Name</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.inputBackground, color: colors.text, borderColor: colors.border }]}
                placeholder="Enter your full name"
                placeholderTextColor={colors.secondaryText}
                value={formData.fullName}
                onChangeText={(text) => handleInputChange('fullName', text)}
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.secondaryText }]}>Phone Number</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.inputBackground, color: colors.text, borderColor: colors.border }]}
                placeholder="Enter your phone number"
                placeholderTextColor={colors.secondaryText}
                keyboardType="phone-pad"
                value={formData.phoneNumber}
                onChangeText={(text) => handleInputChange('phoneNumber', text)}
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.secondaryText }]}>Address</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.inputBackground, color: colors.text, borderColor: colors.border }]}
                placeholder="Enter your address"
                placeholderTextColor={colors.secondaryText}
                multiline
                numberOfLines={3}
                value={formData.address}
                onChangeText={(text) => handleInputChange('address', text)}
              />
            </View>
            
            <View style={styles.formRow}>
              <View style={[styles.formGroup, styles.formHalf]}>
                <Text style={[styles.label, { color: colors.secondaryText }]}>City</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.inputBackground, color: colors.text, borderColor: colors.border }]}
                  placeholder="Enter your city"
                  placeholderTextColor={colors.secondaryText}
                  value={formData.city}
                  onChangeText={(text) => handleInputChange('city', text)}
                />
              </View>
              
              <View style={[styles.formGroup, styles.formHalf]}>
                <Text style={[styles.label, { color: colors.secondaryText }]}>State</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.inputBackground, color: colors.text, borderColor: colors.border }]}
                  placeholder="Enter your state"
                  placeholderTextColor={colors.secondaryText}
                  value={formData.state}
                  onChangeText={(text) => handleInputChange('state', text)}
                />
              </View>
            </View>
            
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.secondaryText }]}>Pincode</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.inputBackground, color: colors.text, borderColor: colors.border }]}
                placeholder="Enter your pincode"
                placeholderTextColor={colors.secondaryText}
                keyboardType="number-pad"
                value={formData.pincode}
                onChangeText={(text) => handleInputChange('pincode', text)}
              />
            </View>
          </View>

          {/* Delivery Method Section */}
          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <View style={styles.sectionHeader}>
              <Truck size={20} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Delivery Method</Text>
            </View>
            
            <View style={styles.optionsContainer}>
              <TouchableOpacity
                style={[
                  styles.optionCard,
                  deliveryMethod === 'standard' && [styles.selectedOption, { borderColor: colors.primary }],
                  { backgroundColor: colors.inputBackground }
                ]}
                onPress={() => setDeliveryMethod('standard')}
              >
                <View style={styles.optionContent}>
                  <Text style={[styles.optionTitle, { color: colors.text }]}>Standard Delivery</Text>
                  <Text style={[styles.optionDescription, { color: colors.secondaryText }]}>Delivery in 3-5 days</Text>
                </View>
                <Text style={[styles.optionPrice, { color: colors.primary }]}>₹2.99</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.optionCard,
                  deliveryMethod === 'express' && [styles.selectedOption, { borderColor: colors.primary }],
                  { backgroundColor: colors.inputBackground }
                ]}
                onPress={() => setDeliveryMethod('express')}
              >
                <View style={styles.optionContent}>
                  <Text style={[styles.optionTitle, { color: colors.text }]}>Express Delivery</Text>
                  <Text style={[styles.optionDescription, { color: colors.secondaryText }]}>Delivery in 1-2 days</Text>
                </View>
                <Text style={[styles.optionPrice, { color: colors.primary }]}>₹5.99</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Payment Method Section */}
          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <View style={styles.sectionHeader}>
              <CreditCard size={20} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Payment Method</Text>
            </View>
            
            <View style={styles.optionsContainer}>
              <TouchableOpacity
                style={[
                  styles.optionCard,
                  paymentMethod === 'cod' && [styles.selectedOption, { borderColor: colors.primary }],
                  { backgroundColor: colors.inputBackground }
                ]}
                onPress={() => setPaymentMethod('cod')}
              >
                <View style={styles.optionContent}>
                  <Text style={[styles.optionTitle, { color: colors.text }]}>Cash on Delivery</Text>
                  <Text style={[styles.optionDescription, { color: colors.secondaryText }]}>Pay when you receive</Text>
                </View>
                <DollarSign size={20} color={colors.primary} />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.optionCard,
                  paymentMethod === 'card' && [styles.selectedOption, { borderColor: colors.primary }],
                  { backgroundColor: colors.inputBackground }
                ]}
                onPress={() => setPaymentMethod('card')}
              >
                <View style={styles.optionContent}>
                  <Text style={[styles.optionTitle, { color: colors.text }]}>Credit/Debit Card</Text>
                  <Text style={[styles.optionDescription, { color: colors.secondaryText }]}>Pay now securely</Text>
                </View>
                <CreditCard size={20} color={colors.primary} />
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Order Summary Section */}
          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Order Summary</Text>
            </View>
            
            <View style={styles.summaryContainer}>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: colors.secondaryText }]}>Subtotal</Text>
                <Text style={[styles.summaryValue, { color: colors.text }]}>₹{subtotal.toFixed(2)}</Text>
              </View>
              
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: colors.secondaryText }]}>Delivery Fee</Text>
                <Text style={[styles.summaryValue, { color: colors.text }]}>₹{deliveryFee.toFixed(2)}</Text>
              </View>
              
              <View style={[styles.summaryRow, styles.totalRow, { borderTopColor: colors.border }]}>
                <Text style={[styles.totalLabel, { color: colors.text }]}>Total</Text>
                <Text style={[styles.totalValue, { color: colors.primary }]}>₹{total.toFixed(2)}</Text>
              </View>
            </View>
          </View>
          
          {/* Add some padding at the bottom for better scrolling */}
          <View style={{ height: 80 }} />
        </ScrollView>
      </KeyboardAvoidingView>
      
      {/* Place Order Button */}
      <View style={[styles.footer, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.placeOrderButton, { backgroundColor: colors.primary }]}
          onPress={handlePlaceOrder}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.placeOrderButtonText}>Place Order</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const { width } = Dimensions.get('window');

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
    fontSize: 18,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  section: {
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  formGroup: {
    marginBottom: 16,
  },
  formRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  formHalf: {
    width: width > 500 ? (width / 2) - 24 : '48%',
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  optionsContainer: {
    flexDirection: width > 500 ? 'row' : 'column',
    justifyContent: 'space-between',
    gap: 12,
  },
  optionCard: {
    flex: width > 500 ? 1 : undefined,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    flexDirection: width > 500 ? 'column' : 'row',
    justifyContent: 'space-between',
    alignItems: width > 500 ? 'center' : 'flex-start',
  },
  selectedOption: {
    borderWidth: 2,
  },
  optionContent: {
    marginBottom: width > 500 ? 8 : 0,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  optionDescription: {
    fontSize: 14,
  },
  optionPrice: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: width > 500 ? 8 : 0,
  },
  summaryContainer: {
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  totalRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
  },
  placeOrderButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  placeOrderButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  successIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  successMessage: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  orderIdText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#059669',
    marginBottom: 24,
  },
  redirectingText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  loader: {
    marginTop: 8,
  },
}); 