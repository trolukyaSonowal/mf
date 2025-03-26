import React, { useContext, useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  Image, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  FlatList 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { ArrowLeft, Star, MapPin, Phone } from 'lucide-react-native';
import { useTheme, getThemeColors } from './ThemeContext';
import { VendorContext } from './VendorContext';
import { ProductsContext } from './ProductsContext';
import { CartContext } from './CartContext';

export default function VendorStore() {
  const { id } = useLocalSearchParams();
  const { getVendorById } = useContext(VendorContext);
  const { products } = useContext(ProductsContext);
  const { addToCart } = useContext(CartContext);
  const { isDarkMode } = useTheme();
  const colors = getThemeColors(isDarkMode);
  
  const [vendor, setVendor] = useState<any>(null);
  const [vendorProducts, setVendorProducts] = useState<any[]>([]);
  
  useEffect(() => {
    if (id) {
      // Get vendor details
      const vendorData = getVendorById(id as string);
      setVendor(vendorData);
      
      // Filter products by this vendor's ID
      const filteredProducts = products.filter(product => product.vendorId === id);
      setVendorProducts(filteredProducts);
    }
  }, [id, products]);
  
  if (!vendor) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }
  
  const addProductToCart = (product: any) => {
    addToCart(product);
    alert(`${product.name} added to cart!`);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{vendor.name}</Text>
      </View>
      
      <ScrollView style={styles.content}>
        {/* Vendor Banner */}
        <View style={[styles.banner, { backgroundColor: colors.card }]}>
          <Image 
            source={{ uri: vendor.logo }} 
            style={styles.bannerImage} 
            resizeMode="cover"
          />
          
          <View style={styles.vendorInfoContainer}>
            <Text style={[styles.vendorName, { color: colors.text }]}>{vendor.name}</Text>
            
            <View style={styles.ratingContainer}>
              <Star size={16} color="#FFB800" fill="#FFB800" />
              <Text style={[styles.ratingText, { color: colors.secondaryText }]}>
                {vendor.rating.toFixed(1)}
              </Text>
            </View>
            
            <View style={styles.categoriesContainer}>
              {vendor.categories.map((category: string, index: number) => (
                <View 
                  key={index}
                  style={[styles.categoryPill, { backgroundColor: colors.primary + '20' }]}
                >
                  <Text style={[styles.categoryPillText, { color: colors.primary }]}>
                    {category}
                  </Text>
                </View>
              ))}
            </View>
            
            <Text style={[styles.description, { color: colors.secondaryText }]}>
              {vendor.description}
            </Text>
            
            <View style={styles.contactInfo}>
              <View style={styles.contactItem}>
                <MapPin size={16} color={colors.secondaryText} />
                <Text style={[styles.contactText, { color: colors.secondaryText }]}>
                  {vendor.address}
                </Text>
              </View>
              
              <View style={styles.contactItem}>
                <Phone size={16} color={colors.secondaryText} />
                <Text style={[styles.contactText, { color: colors.secondaryText }]}>
                  {vendor.phone}
                </Text>
              </View>
            </View>
          </View>
        </View>
        
        {/* Products Section */}
        <View style={styles.productsSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Products</Text>
          
          {vendorProducts.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.secondaryText }]}>
              This vendor has no products yet.
            </Text>
          ) : (
            <View style={styles.productsGrid}>
              {vendorProducts.map((product) => (
                <TouchableOpacity 
                  key={product.id}
                  style={[styles.productCard, { backgroundColor: colors.card }]}
                  onPress={() => router.push(`/product-details?id=${product.id}`)}
                >
                  <Image 
                    source={{ uri: product.image }} 
                    style={styles.productImage} 
                  />
                  
                  <View style={styles.productInfo}>
                    <Text style={[styles.productName, { color: colors.text }]} numberOfLines={2}>
                      {product.name}
                    </Text>
                    
                    <Text style={[styles.productPrice, { color: colors.primary }]}>
                      ₹{product.price.toFixed(2)}
                    </Text>
                    
                    <TouchableOpacity
                      style={[styles.addButton, { backgroundColor: colors.primary }]}
                      onPress={() => addProductToCart(product)}
                    >
                      <Text style={styles.addButtonText}>Add</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
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
    padding: 16,
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  banner: {
    marginHorizontal: 16,
    marginBottom: 24,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  bannerImage: {
    width: '100%',
    height: 180,
  },
  vendorInfoContainer: {
    padding: 16,
  },
  vendorName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  ratingText: {
    fontSize: 16,
    marginLeft: 8,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  categoryPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  categoryPillText: {
    fontSize: 14,
    fontWeight: '500',
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 16,
  },
  contactInfo: {
    gap: 8,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contactText: {
    fontSize: 14,
    marginLeft: 8,
  },
  productsSection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    paddingVertical: 24,
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  productCard: {
    width: '48%',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  productImage: {
    width: '100%',
    height: 140,
  },
  productInfo: {
    padding: 12,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
    height: 40,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  addButton: {
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
}); 