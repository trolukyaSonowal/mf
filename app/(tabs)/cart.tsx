import React, { useContext } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Minus, Plus, Trash2 } from 'lucide-react-native';
import { CartContext } from '../CartContext'; // Import the CartContext
import { router } from 'expo-router';
import { useTheme, getThemeColors } from '../ThemeContext';

export default function CartScreen() {
  // Use the CartContext to access cartItems, updateQuantity, and removeFromCart
  const { cartItems, updateQuantity, removeFromCart } = useContext(CartContext);
  const { isDarkMode } = useTheme();
  const colors = getThemeColors(isDarkMode);

  // Calculate subtotal, delivery fee, and total
  const subtotal = cartItems.reduce((sum: number, item: { price: number; quantity: number }) => sum + item.price * item.quantity, 0);
  const deliveryFee = 2.99;
  const total = subtotal + deliveryFee;

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      alert('Your cart is empty. Add some items before checkout.');
      return;
    }
    
    router.push('/checkout');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>Shopping Cart</Text>
        <Text style={[styles.itemCount, { color: colors.secondaryText }]}>{cartItems.length} items</Text>
      </View>

      {cartItems.length === 0 ? (
        <View style={styles.emptyCartContainer}>
          <Image 
            source={{ uri: 'https://cdn-icons-png.flaticon.com/512/2038/2038854.png' }}
            style={styles.emptyCartImage}
            resizeMode="contain"
          />
          <Text style={[styles.emptyCartTitle, { color: colors.text }]}>Your Cart is Empty</Text>
          <Text style={[styles.emptyCartMessage, { color: colors.secondaryText }]}>
            Looks like you haven't added any items to your cart yet.
          </Text>
          <TouchableOpacity 
            style={[styles.shopNowButton, { backgroundColor: colors.primary }]}
            onPress={() => router.push('/(tabs)/products')}
          >
            <Text style={styles.shopNowButtonText}>Shop Now</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {/* Cart Items */}
          <ScrollView style={styles.itemsContainer}>
            {cartItems.map((item: { id: number; image: string; name: string; price: number; quantity: number }) => (
              <View key={item.id} style={[styles.cartItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
                {/* Product Image */}
                <Image source={{ uri: item.image }} style={styles.itemImage} />

                {/* Product Info */}
                <View style={styles.itemInfo}>
                  <Text style={[styles.itemName, { color: colors.text }]}>{item.name}</Text>
                  <Text style={[styles.itemPrice, { color: colors.primary }]}>₹{item.price.toFixed(2)}</Text>

                  {/* Quantity Controls */}
                  <View style={styles.quantityControls}>
                    <TouchableOpacity
                      style={[styles.quantityButton, { backgroundColor: colors.inputBackground }]}
                      onPress={() => updateQuantity(item.id, item.quantity - 1)} // Decrease quantity
                    >
                      <Minus size={16} color={colors.primary} />
                    </TouchableOpacity>
                    <Text style={[styles.quantity, { color: colors.text }]}>{item.quantity}</Text>
                    <TouchableOpacity
                      style={[styles.quantityButton, { backgroundColor: colors.inputBackground }]}
                      onPress={() => updateQuantity(item.id, item.quantity + 1)} // Increase quantity
                    >
                      <Plus size={16} color={colors.primary} />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Delete Button */}
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => removeFromCart(item.id)} // Remove item
                >
                  <Trash2 size={20} color={colors.error} />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>

          {/* Order Summary */}
          <View style={[styles.summary, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
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

            {/* Checkout Button */}
            <TouchableOpacity 
              style={[styles.checkoutButton, { backgroundColor: colors.primary }]}
              onPress={handleCheckout}
            >
              <Text style={styles.checkoutButtonText}>Proceed to Checkout</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  itemCount: {
    fontSize: 14,
    marginTop: 4,
  },
  itemsContainer: {
    flex: 1,
    padding: 20,
  },
  cartItem: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  itemInfo: {
    flex: 1,
    marginLeft: 12,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    padding: 8,
    borderRadius: 8,
  },
  quantity: {
    marginHorizontal: 16,
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
    padding: 8,
  },
  summary: {
    padding: 20,
    borderTopWidth: 1,
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
  checkoutButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  checkoutButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyCartContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyCartImage: {
    width: 150,
    height: 150,
    marginBottom: 20,
  },
  emptyCartTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  emptyCartMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  shopNowButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  shopNowButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});