import React, { useContext, useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, ShoppingCart, Star, Check } from 'lucide-react-native';
import { ProductsContext } from './ProductsContext';
import { CartContext } from './CartContext';
import { useTheme, getThemeColors } from './ThemeContext';

// Define a product type
interface Product {
  id: number;
  name: string;
  price: number;
  image: string;
  category: string;
  organic: boolean;
  rating: number;
  description?: string;
}

export default function ProductDetailsScreen() {
  const { id } = useLocalSearchParams();
  const { products } = useContext(ProductsContext);
  const { addToCart, cartItems } = useContext(CartContext);
  const { isDarkMode } = useTheme();
  const colors = getThemeColors(isDarkMode);
  const [product, setProduct] = useState<Product | null>(null);
  const [isInCart, setIsInCart] = useState(false);
  const [quantity, setQuantity] = useState(0);
  
  const windowWidth = Dimensions.get('window').width;
  const imageHeight = windowWidth * 0.7; // 70% of screen width

  // Find the product by ID
  useEffect(() => {
    if (id) {
      const productId = parseInt(id as string);
      const foundProduct = products.find(p => p.id === productId);
      
      if (foundProduct) {
        setProduct(foundProduct);
        
        // Check if product is in cart
        const cartItem = cartItems.find(item => item.id === productId);
        if (cartItem) {
          setIsInCart(true);
          setQuantity(cartItem.quantity);
        }
      }
    }
  }, [id, products, cartItems]);

  const handleAddToCart = () => {
    if (product) {
      addToCart(product);
      setIsInCart(true);
      setQuantity(1);
    }
  };

  const handleBackPress = () => {
    router.back();
  };

  if (!product) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <TouchableOpacity 
            style={[styles.backButton, { backgroundColor: colors.inputBackground }]}
            onPress={handleBackPress}
          >
            <ArrowLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Product Details</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.text }]}>Loading product details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Generate placeholder description if none exists
  const description = product.description || 
    `${product.name} is a premium quality product in our ${product.category} category. ` +
    `It's known for its exceptional quality and freshness. ` +
    `${product.organic ? 'This product is certified organic, grown without synthetic pesticides or fertilizers.' : ''}`;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity 
          style={[styles.backButton, { backgroundColor: colors.inputBackground }]}
          onPress={handleBackPress}
        >
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Product Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Product Image */}
        <Image 
          source={{ uri: product.image }} 
          style={[styles.productImage, { height: imageHeight }]} 
          resizeMode="cover"
        />

        {/* Product Info */}
        <View style={[styles.productInfo, { backgroundColor: colors.card }]}>
          <View style={styles.productHeader}>
            <View style={styles.categoryContainer}>
              <Text style={[styles.category, { color: colors.primary }]}>{product.category}</Text>
              {product.organic && (
                <View style={[styles.organicBadge, { backgroundColor: colors.success + '20' }]}>
                  <Text style={[styles.organicBadgeText, { color: colors.success }]}>Organic</Text>
                </View>
              )}
            </View>
            <View style={styles.ratingContainer}>
              <Star size={16} color={colors.warning} fill={colors.warning} />
              <Text style={[styles.rating, { color: colors.secondaryText }]}>{product.rating.toFixed(1)}</Text>
            </View>
          </View>

          <Text style={[styles.productName, { color: colors.text }]}>{product.name}</Text>
          <Text style={[styles.productPrice, { color: colors.primary }]}>₹{product.price.toFixed(2)}</Text>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <Text style={[styles.sectionTitle, { color: colors.text }]}>Description</Text>
          <Text style={[styles.description, { color: colors.secondaryText }]}>{description}</Text>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.featuresContainer}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Features</Text>
            <View style={styles.featuresList}>
              <View style={styles.featureItem}>
                <View style={[styles.featureIcon, { backgroundColor: colors.primary + '20' }]}>
                  <Check size={16} color={colors.primary} />
                </View>
                <Text style={[styles.featureText, { color: colors.text }]}>Premium Quality</Text>
              </View>
              {product.organic && (
                <View style={styles.featureItem}>
                  <View style={[styles.featureIcon, { backgroundColor: colors.success + '20' }]}>
                    <Check size={16} color={colors.success} />
                  </View>
                  <Text style={[styles.featureText, { color: colors.text }]}>Certified Organic</Text>
                </View>
              )}
              <View style={styles.featureItem}>
                <View style={[styles.featureIcon, { backgroundColor: colors.info + '20' }]}>
                  <Check size={16} color={colors.info} />
                </View>
                <Text style={[styles.featureText, { color: colors.text }]}>Fresh & Healthy</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Add to Cart Button */}
      <View style={[styles.footer, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
        {isInCart ? (
          <View style={styles.inCartContainer}>
            <View style={[styles.inCartBadge, { backgroundColor: colors.success + '20' }]}>
              <Check size={16} color={colors.success} />
              <Text style={[styles.inCartText, { color: colors.success }]}>
                {quantity} in cart
              </Text>
            </View>
            <TouchableOpacity 
              style={[styles.viewCartButton, { backgroundColor: colors.primary }]}
              onPress={() => router.push('/(tabs)/cart')}
            >
              <ShoppingCart size={20} color="#FFFFFF" />
              <Text style={styles.viewCartButtonText}>View Cart</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity 
            style={[styles.addToCartButton, { backgroundColor: colors.primary }]}
            onPress={handleAddToCart}
          >
            <ShoppingCart size={20} color="#FFFFFF" />
            <Text style={styles.addToCartButtonText}>Add to Cart</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

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
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
  },
  content: {
    flex: 1,
  },
  productImage: {
    width: '100%',
  },
  productInfo: {
    padding: 20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -24,
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  category: {
    fontSize: 14,
    fontWeight: '600',
    marginRight: 8,
  },
  organicBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  organicBadgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: 14,
    marginLeft: 4,
  },
  productName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  productPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  divider: {
    height: 1,
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
  },
  featuresContainer: {
    marginBottom: 16,
  },
  featuresList: {
    marginTop: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  featureText: {
    fontSize: 16,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
  },
  addToCartButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
  },
  addToCartButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  inCartContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inCartBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  inCartText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  viewCartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  viewCartButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
}); 