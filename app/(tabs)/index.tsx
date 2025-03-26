import React, { useContext, useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { MaterialIcons } from '@expo/vector-icons'; // Import the location icon
import { CartContext } from '../CartContext';
import { ProductsContext } from '../ProductsContext';
import { VendorContext } from '../VendorContext';
import { useTheme, getThemeColors } from '../ThemeContext';
import { router } from 'expo-router';
import { Star } from 'lucide-react-native';


const categories = [
  { name: 'Fruits', icon: '🍎', color: '#FFCDD2' },
  { name: 'Vegetables', icon: '🥬', color: '#C8E6C9' },
  { name: 'Dairy', icon: '🥛', color: '#BBDEFB' },
  { name: 'Bakery', icon: '🥖', color: '#FFE0B2' },
  { name: 'Pantry', icon: '🥫', color: '#E1BEE7' },
  { name: 'Beverages', icon: '🧃', color: '#B2EBF2' },
];

const offers = [
  {
    id: 1,
    title: 'Get 20% off on Fresh Fruits',
    description: 'Valid until June 30, 2023',
    color: '#FFCDD2',
  },
  {
    id: 2,
    title: 'Free delivery on orders above ₹50',
    description: 'Valid for all products',
    color: '#C8E6C9',
  },
  {
    id: 3,
    title: 'Buy 2 Get 1 Free on Dairy Products',
    description: 'Valid until July 15, 2023',
    color: '#BBDEFB',
  },
];

// Default featured products if no products are added yet
const defaultFeaturedProducts = [
  {
    id: 1,
    name: 'Fresh Organic Avocados',
    price: 4.99,
    image: 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?auto=format&fit=crop&q=80&w=400',
    category: 'Fruits',
    organic: true,
    rating: 4.5,
  },
  {
    id: 2,
    name: 'Farm Fresh Eggs',
    price: 3.99,
    image: 'https://images.unsplash.com/photo-1506976785307-8732e854ad03?auto=format&fit=crop&q=80&w=400',
    category: 'Dairy',
    organic: false,
    rating: 4.2,
  },
  {
    id: 3,
    name: 'Organic Spinach',
    price: 2.99,
    image: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&q=80&w=400',
    category: 'Vegetables',
    organic: true,
    rating: 4.7,
  },
];

export default function HomeScreen() {
  const { addToCart } = useContext(CartContext);
  const { products } = useContext(ProductsContext);
  const { vendors } = useContext(VendorContext);
  const [hasLocation, setHasLocation] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(true);
  const [location, setLocation] = useState('');
  const [manualAddress, setManualAddress] = useState('');
  const { isDarkMode } = useTheme();
  const colors = getThemeColors(isDarkMode);

  // Get featured products from the ProductsContext or use defaults
  const featuredProducts = products.length > 0 
    ? products.slice(0, 3) // Show the first 3 products
    : defaultFeaturedProducts;

  // Filter verified vendors only
  const verifiedVendors = vendors.filter(vendor => vendor.isVerified);

  useEffect(() => {
    checkLocationPermission();
  }, []);

  const checkLocationPermission = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status === 'granted') {
      // Fetch location only if the modal is visible
      if (isModalVisible) {
        fetchCurrentLocation();
      }
    } else {
      alert('Location permission is required to use this feature.');
    }
  };

  const fetchCurrentLocation = async () => {
    try {
      // Clear the manual address input
      setManualAddress('');

      const location = await Location.getCurrentPositionAsync({});
      const address = await Location.reverseGeocodeAsync(location.coords);
      const formattedAddress = `${address[0]?.name || ''}, ${address[0]?.city || ''}, ${address[0]?.region || ''}`;
      setLocation(formattedAddress);
      setHasLocation(true);
      setIsModalVisible(false); // Close the modal after setting location
    } catch (error) {
      console.log('Error getting location:', error);
      alert('Failed to fetch current location. Please try again.');
    }
  };

  const handleManualLocation = () => {
    if (manualAddress.trim()) {
      setLocation(manualAddress);
      setHasLocation(true);
      setIsModalVisible(false); // Close the modal after setting location
    } else {
      alert('Please enter a valid address.');
    }
  };

  const handleProductPress = (productId: number) => {
    router.push(`/product-details?id=${productId}`);
  };

  const handleVendorPress = (vendorId: string) => {
    router.push(`/vendor-store?id=${vendorId}`);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Location Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isModalVisible && !hasLocation}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Set Your Delivery Location</Text>
            <Text style={[styles.modalSubtitle, { color: colors.secondaryText }]}>
              To provide you with the best service, we need your delivery location.
            </Text>
            
            <TouchableOpacity
              style={[styles.locationButton, { backgroundColor: colors.primary }]}
              onPress={fetchCurrentLocation}
            >
              <MaterialIcons name="my-location" size={24} color="#FFFFFF" />
              <Text style={styles.locationButtonText}>Use Current Location</Text>
            </TouchableOpacity>
            
            <Text style={[styles.orText, { color: colors.secondaryText }]}>OR</Text>
            
            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBackground, color: colors.text, borderColor: colors.border }]}
              placeholder="Enter your address manually"
              placeholderTextColor={colors.secondaryText}
              value={manualAddress}
              onChangeText={setManualAddress}
            />
            
            <TouchableOpacity
              style={[styles.submitButton, { backgroundColor: colors.secondary }]}
              onPress={handleManualLocation}
            >
              <Text style={styles.submitButtonText}>Set Location</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card }]}>
        <View style={styles.locationContainer}>
          <MaterialIcons name="location-on" size={24} color={colors.primary} />
          <Text style={[styles.locationText, { color: colors.text }]}>
            {hasLocation ? location : 'Set your location'}
          </Text>
          <TouchableOpacity onPress={() => setIsModalVisible(true)}>
            <Text style={[styles.changeText, { color: colors.primary }]}>Change</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content}>
        {/* Offers Carousel */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.offersContainer}
        >
          {offers.map((offer) => (
            <View
              key={offer.id}
              style={[styles.offerCard, { backgroundColor: offer.color + '20' }]}
            >
              <Text style={[styles.offerTitle, { color: colors.text }]}>{offer.title}</Text>
              <Text style={[styles.offerDescription, { color: colors.secondaryText }]}>
                {offer.description}
              </Text>
            </View>
          ))}
        </ScrollView>

        {/* Categories */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Categories</Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContainer}
        >
          {categories.map((category) => (
            <TouchableOpacity
              key={category.name}
              style={[styles.categoryCard, { backgroundColor: category.color + '20' }]}
            >
              <Text style={styles.categoryIcon}>{category.icon}</Text>
              <Text style={[styles.categoryName, { color: colors.text }]}>{category.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Featured Shops - New Section */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Featured Shops</Text>
          <TouchableOpacity onPress={() => router.push('/all-vendors')}>
            <Text style={[styles.viewAllText, { color: colors.primary }]}>View All</Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.vendorsContainer}
        >
          {verifiedVendors.map((vendor) => (
            <TouchableOpacity
              key={vendor.id}
              style={[styles.vendorCard, { backgroundColor: colors.card }]}
              onPress={() => handleVendorPress(vendor.id)}
            >
              <Image 
                source={{ uri: vendor.logo }} 
                style={styles.vendorLogo} 
              />
              <View style={styles.vendorInfo}>
                <Text style={[styles.vendorName, { color: colors.text }]}>{vendor.name}</Text>
                <View style={styles.ratingContainer}>
                  <Star size={16} color="#FFB800" fill="#FFB800" />
                  <Text style={[styles.ratingText, { color: colors.secondaryText }]}>
                    {vendor.rating.toFixed(1)}
                  </Text>
                </View>
                <View style={styles.categoriesWrapper}>
                  {vendor.categories.slice(0, 2).map((category, index) => (
                    <View 
                      key={index}
                      style={[styles.categoryPill, { backgroundColor: colors.primary + '20' }]}
                    >
                      <Text style={[styles.categoryPillText, { color: colors.primary }]}>
                        {category}
                      </Text>
                    </View>
                  ))}
                  {vendor.categories.length > 2 && (
                    <Text style={[styles.moreText, { color: colors.secondaryText }]}>
                      +{vendor.categories.length - 2} more
                    </Text>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Featured Products */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Featured Products</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/products')}>
            <Text style={[styles.viewAllText, { color: colors.primary }]}>View All</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.productsContainer}>
          {featuredProducts.map((product) => (
            <View key={product.id} style={[styles.productCard, { backgroundColor: colors.card }]}>
              <TouchableOpacity 
                activeOpacity={0.8}
                onPress={() => handleProductPress(product.id)}
              >
                <Image source={{ uri: product.image }} style={styles.productImage} />
                <View style={styles.productInfo}>
                  <View style={styles.productHeader}>
                    <Text style={[styles.productCategory, { color: colors.primary }]}>{product.category}</Text>
                    {product.organic && (
                      <View style={[styles.organicBadge, { backgroundColor: colors.success + '20' }]}>
                        <Text style={[styles.organicBadgeText, { color: colors.success }]}>Organic</Text>
                      </View>
                    )}
                  </View>
                  <Text style={[styles.productName, { color: colors.text }]}>{product.name}</Text>
                  <View style={styles.productFooter}>
                    <Text style={[styles.productPrice, { color: colors.text }]}>₹{product.price.toFixed(2)}</Text>
                    <View style={styles.ratingContainer}>
                      <Text style={[styles.rating, { color: colors.secondaryText }]}>★ {product.rating}</Text>
                      <TouchableOpacity
                        style={[styles.addButton, { backgroundColor: colors.primary }]}
                        onPress={(e) => {
                          e.stopPropagation(); // Prevent triggering the parent onPress
                          addToCart(product);
                        }}
                      >
                        <Text style={styles.addButtonText}>Add</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 4,
  },
  offersContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  offerCard: {
    width: 280,
    padding: 16,
    borderRadius: 12,
    marginRight: 16,
  },
  offerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  offerDescription: {
    fontSize: 14,
  },
  offerButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  offerButtonText: {
    color: '#1F2937',
    fontWeight: '600',
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryCard: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginRight: 16,
    width: 100,
    height: 100,
  },
  categoryIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  productCard: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  productImage: {
    width: '100%',
    height: 180,
  },
  productInfo: {
    padding: 12,
  },
  productHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  productCategory: {
    fontSize: 14,
    color: '#059669',
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  productPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  addButton: {
    backgroundColor: '#059669',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: '500',
    fontSize: 14,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  addressContainer: {
    flex: 1,
    marginLeft: 10,
    marginRight: 10,
  },
  locationText: {
    fontSize: 16,
    marginLeft: 8,
    flex: 1,
  },
  changeLocationText: {
    color: '#059669',
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '80%',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#059669',
    padding: 12,
    borderRadius: 8,
    width: '100%',
    justifyContent: 'center',
    marginBottom: 10,
  },
  locationButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  orText: {
    marginVertical: 10,
    fontSize: 16,
  },
  input: {
    width: '100%',
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    marginBottom: 10,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  changeText: {
    color: '#059669',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  viewAllText: {
    color: '#059669',
    fontWeight: '600',
  },
  categoriesContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    flexDirection: 'row',
  },
  productsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  organicBadge: {
    backgroundColor: '#D1FAE5',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  organicBadgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#059669',
  },
  productFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: 14,
    marginRight: 8,
  },
  submitButton: {
    backgroundColor: '#3B82F6',
    padding: 12,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  productCardTouchable: {
    flex: 1,
  },
  vendorsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  vendorCard: {
    width: 200,
    borderRadius: 12,
    marginRight: 16,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  vendorLogo: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    marginBottom: 8,
  },
  vendorInfo: {
    gap: 4,
  },
  vendorName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  ratingText: {
    fontSize: 14,
    marginLeft: 4,
  },
  categoriesWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginTop: 4,
  },
  categoryPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 4,
  },
  categoryPillText: {
    fontSize: 12,
    fontWeight: '500',
  },
  moreText: {
    fontSize: 12,
    marginLeft: 4,
  },
});