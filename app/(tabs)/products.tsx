import React, { useState, useContext } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, TextInput, StyleSheet, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Filter, Search, Plus } from 'lucide-react-native';
import { router } from 'expo-router';
import { CartContext } from '../CartContext'; // Import the CartContext
import { ProductsContext } from '../ProductsContext'; // Import the ProductsContext
import { useTheme, getThemeColors } from '../ThemeContext';

const categories = [
  { name: 'All', icon: '🛒' },
  { name: 'Fruits & Vegetables', icon: '🥬' },
  { name: 'Dairy & Eggs', icon: '🥛' },
  { name: 'Bakery', icon: '🥖' },
  { name: 'Meat & Fish', icon: '🥩' },
  { name: 'Pantry', icon: '🥫' },
  { name: 'Beverages', icon: '🧃' },
];

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
  vendorId?: string;
  stock?: number;
  sku?: string;
}

// Default products that will be shown if no products are added yet
const defaultProducts: Product[] = [
 // Fruits from vendor1 (Fresh Farms)
 {
  id: 1,
  name: 'Fresh Organic Avocados',
  price: 4.99,
  image: 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?auto=format&fit=crop&q=80&w=400',
  category: 'Fruits',
  organic: true,
  rating: 4.5,
  vendorId: 'vendor1',
  stock: 35,
  sku: 'FRU-1-VEN1',
},
{
  id: 2,
  name: 'Red Apples',
  price: 2.99,
  image: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&q=80&w=400',
  category: 'Fruits',
  organic: true,
  rating: 4.3,
  vendorId: 'vendor1',
  stock: 48,
  sku: 'FRU-2-VEN1',
},
{
  id: 3,
  name: 'Bananas',
  price: 1.99,
  image: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&q=80&w=400',
  category: 'Fruits',
  organic: true,
  rating: 4.4,
},
// Vegetables
{
  id: 4,
  name: 'Organic Spinach',
  price: 2.99,
  image: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&q=80&w=400',
  category: 'Vegetables',
  organic: true,
  rating: 4.7,
},
{
  id: 5,
  name: 'Fresh Carrots',
  price: 1.99,
  image: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?auto=format&fit=crop&q=80&w=400',
  category: 'Vegetables',
  organic: true,
  rating: 4.2,
},
{
  id: 6,
  name: 'Bell Peppers',
  price: 3.49,
  image: 'https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?auto=format&fit=crop&q=80&w=400',
  category: 'Vegetables',
  organic: false,
  rating: 4.1,
},
// Dairy
{
  id: 7,
  name: 'Farm Fresh Eggs',
  price: 3.99,
  image: 'https://images.unsplash.com/photo-1506976785307-8732e854ad03?auto=format&fit=crop&q=80&w=400',
  category: 'Dairy',
  organic: false,
  rating: 4.2,
  vendorId: 'vendor2',
  stock: 30,
  sku: 'DAI-1-VEN2',
},
{
  id: 8,
  name: 'Organic Milk',
  price: 4.49,
  image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&q=80&w=400',
  category: 'Dairy',
  organic: true,
  rating: 4.6,
  vendorId: 'vendor2',
  stock: 25,
  sku: 'DAI-2-VEN2',
},
{
  id: 9,
  name: 'Greek Yogurt',
  price: 3.99,
  image: 'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?auto=format&fit=crop&q=80&w=400',
  category: 'Dairy',
  organic: false,
  rating: 4.3,
  vendorId: 'vendor2',
  stock: 45,
  sku: 'DAI-3-VEN2',
},
// Bakery from vendor3 (Bake House)
{
  id: 10,
  name: 'Whole Grain Bread',
  price: 3.49,
  image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=400',
  category: 'Bakery',
  organic: false,
  rating: 4.0,
  vendorId: 'vendor3',
  stock: 22,
  sku: 'BAK-1-VEN3',
},
{
  id: 11,
  name: 'Croissants',
  price: 2.99,
  image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&q=80&w=400',
  category: 'Bakery',
  organic: false,
  rating: 4.5,
},
{
  id: 12,
  name: 'Muffins',
  price: 3.99,
  image: 'https://images.unsplash.com/photo-1558401391-7899b4bd5bbf?auto=format&fit=crop&q=80&w=400',
  category: 'Bakery',
  organic: false,
  rating: 4.2,
},
// Pantry
{
  id: 13,
  name: 'Organic Quinoa',
  price: 5.99,
  image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&q=80&w=400',
  category: 'Pantry',
  organic: true,
  rating: 4.4,
},
{
  id: 14,
  name: 'Extra Virgin Olive Oil',
  price: 8.99,
  image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&q=80&w=400',
  category: 'Pantry',
  organic: true,
  rating: 4.7,
},
// Beverages
{
  id: 15,
  name: 'Fresh Orange Juice',
  price: 4.99,
  image: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&q=80&w=400',
  category: 'Beverages',
  organic: true,
  rating: 4.6,
},
{
  id: 16,
  name: 'Green Tea',
  price: 3.99,
  image: 'https://images.unsplash.com/photo-1627435601361-ec25f5b1d0e5?auto=format&fit=crop&q=80&w=400',
  category: 'Beverages',
  organic: true,
  rating: 4.3,
},
];

const priceRanges = ['All', 'Under ₹5', '₹5 - ₹10', 'Over ₹10'];
const sortOptions = ['Price: Low to High', 'Price: High to Low', 'Rating: High to Low'];

export default function ProductsScreen() {
  const { addToCart } = useContext(CartContext);
  const { products: contextProducts } = useContext(ProductsContext);
  const { isDarkMode } = useTheme();
  const colors = getThemeColors(isDarkMode);
  
  const allProducts = contextProducts.length > 0 ? contextProducts : defaultProducts;
  
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedPriceRange, setSelectedPriceRange] = useState('All');
  const [selectedSort, setSelectedSort] = useState('Price: Low to High');
  const [showOrganic, setShowOrganic] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleAddToCart = (product: Product) => {
    addToCart(product);
  };

  const handleAddNewItem = () => {
    if (global.isAdmin) {
      router.push('/admin/add-item');
    }
  };

  const handleProductPress = (productId: number) => {
    router.push(`/product-details?id=${productId}`);
  };

  const filteredProducts = allProducts
    .filter((product: Product) => {
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        if (!product.name.toLowerCase().includes(searchLower) &&
            !product.category.toLowerCase().includes(searchLower)) {
          return false;
        }
      }
      
      if (selectedCategory !== 'All' && product.category !== selectedCategory) return false;
      if (showOrganic && !product.organic) return false;
      
      if (selectedPriceRange !== 'All') {
        const price = product.price;
        if (selectedPriceRange === 'Under ₹5' && price >= 5) return false;
        if (selectedPriceRange === '₹5 - ₹10' && (price < 5 || price > 10)) return false;
        if (selectedPriceRange === 'Over ₹10' && price <= 10) return false;
      }
      
      return true;
    })
    .sort((a: Product, b: Product) => {
      switch (selectedSort) {
        case 'Price: Low to High': return a.price - b.price;
        case 'Price: High to Low': return b.price - a.price;
        case 'Rating: High to Low': return b.rating - a.rating;
        default: return 0;
      }
    });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card }]}>
        <View style={styles.searchContainer}>
          <View style={[styles.searchBar, { backgroundColor: colors.inputBackground }]}>
            <Search size={20} color={colors.secondaryText} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Search products..."
              placeholderTextColor={colors.secondaryText}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <TouchableOpacity 
            style={[styles.filterButton, { backgroundColor: colors.primary }]} 
            onPress={() => setShowFilters(true)}
          >
            <Filter size={20} color="#fff" />
          </TouchableOpacity>
          {global.isAdmin && (
            <TouchableOpacity 
              style={[styles.addButton, { backgroundColor: colors.success }]} 
              onPress={handleAddNewItem}
            >
              <Plus size={20} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
        
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={styles.categoriesContainer}
        >
          {categories.map((category) => (
            <TouchableOpacity
              key={category.name}
              style={[
                styles.categoryButton,
                selectedCategory === category.name && [
                  styles.selectedCategory,
                  { backgroundColor: colors.primary + '20' }
                ]
              ]}
              onPress={() => setSelectedCategory(category.name)}
            >
              <Text style={styles.categoryIcon}>{category.icon}</Text>
              <Text 
                style={[
                  styles.categoryText, 
                  { color: selectedCategory === category.name ? colors.primary : colors.secondaryText }
                ]}
              >
                {category.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Filters Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showFilters}
        onRequestClose={() => setShowFilters(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Filter Products</Text>
            
            <View style={styles.filterSection}>
              <Text style={[styles.filterSectionTitle, { color: colors.text }]}>Price Range</Text>
              <View style={styles.filterOptions}>
                {['All', 'Under ₹5', '₹5 - ₹10', 'Over ₹10'].map((range) => (
                  <TouchableOpacity
                    key={range}
                    style={[
                      styles.filterOption,
                      selectedPriceRange === range && [
                        styles.selectedFilterOption,
                        { backgroundColor: colors.primary + '20' }
                      ]
                    ]}
                    onPress={() => setSelectedPriceRange(range)}
                  >
                    <Text 
                      style={[
                        styles.filterOptionText,
                        { color: selectedPriceRange === range ? colors.primary : colors.secondaryText }
                      ]}
                    >
                      {range}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            <View style={styles.filterSection}>
              <Text style={[styles.filterSectionTitle, { color: colors.text }]}>Sort By</Text>
              <View style={styles.filterOptions}>
                {['Price: Low to High', 'Price: High to Low', 'Rating: High to Low'].map((sort) => (
                  <TouchableOpacity
                    key={sort}
                    style={[
                      styles.filterOption,
                      selectedSort === sort && [
                        styles.selectedFilterOption,
                        { backgroundColor: colors.primary + '20' }
                      ]
                    ]}
                    onPress={() => setSelectedSort(sort)}
                  >
                    <Text 
                      style={[
                        styles.filterOptionText,
                        { color: selectedSort === sort ? colors.primary : colors.secondaryText }
                      ]}
                    >
                      {sort}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            <View style={styles.filterSection}>
              <View style={styles.organicFilterContainer}>
                <Text style={[styles.filterSectionTitle, { color: colors.text }]}>Organic Only</Text>
                <TouchableOpacity
                  style={[
                    styles.checkboxContainer,
                    showOrganic && { borderColor: colors.success }
                  ]}
                  onPress={() => setShowOrganic(!showOrganic)}
                >
                  {showOrganic && (
                    <View style={[styles.checkbox, { backgroundColor: colors.success }]} />
                  )}
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton, { borderColor: colors.error }]}
                onPress={() => setShowFilters(false)}
              >
                <Text style={[styles.modalButtonText, { color: colors.error }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.applyButton, { backgroundColor: colors.primary }]}
                onPress={() => setShowFilters(false)}
              >
                <Text style={styles.applyButtonText}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <ScrollView style={styles.productsContainer}>
        <View style={styles.productsGrid}>
          {filteredProducts.map((product) => (
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
                          handleAddToCart(product);
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
  header: {
    padding: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
  },
  filterButton: {
    padding: 8,
    marginLeft: 8,
  },
  addButton: {
    backgroundColor: '#059669',
    padding: 8,
    borderRadius: 8,
    marginLeft: 8,
  },
  categoriesContainer: {
    marginTop: 16,
  },
  categoryButton: {
    padding: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    marginRight: 8,
  },
  selectedCategory: {
    borderColor: '#059669',
  },
  categoryIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  categoryText: {
    fontSize: 12,
    color: '#4B5563',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    width: '90%',
    borderRadius: 12,
    padding: 20,
    position: 'relative',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  filterSection: {
    marginBottom: 20,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  selectedFilterOption: {
    backgroundColor: '#059669',
  },
  filterOptionText: {
    color: '#4B5563',
    fontSize: 14,
  },
  organicFilterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkboxContainer: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderRadius: 4,
    marginRight: 8,
  },
  checkbox: {
    width: '100%',
    height: '100%',
    backgroundColor: 'transparent',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalButton: {
    padding: 12,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderRadius: 8,
  },
  cancelButton: {
    backgroundColor: '#FFFFFF',
  },
  applyButton: {
    backgroundColor: '#059669',
  },
  applyButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  productsContainer: {
    flex: 1,
  },
  productsGrid: {
    padding: 16,
  },
  productCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  productImage: {
    width: '100%',
    height: 200,
  },
  productInfo: {
    padding: 16,
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  productCategory: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '600',
  },
  organicBadge: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  organicBadgeText: {
    color: '#059669',
    fontSize: 12,
    fontWeight: '500',
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  productFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    color: '#6B7280',
    marginRight: 12,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});