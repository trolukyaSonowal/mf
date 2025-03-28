import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, TextInput, Dimensions, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Package, Plus, Search, Filter, Menu, X, ArrowUp, ArrowDown, Trash2, Edit, Bell } from 'lucide-react-native';
import { VendorContext } from '../VendorContext';
import { ProductsContext } from '../ProductsContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNotifications } from '../NotificationContext';

export default function VendorProducts() {
  const { currentVendor } = useContext(VendorContext);
  const { products, deleteProduct, refreshProducts, getProductsByVendor } = useContext(ProductsContext);
  const { userNotifications, unreadUserCount } = useNotifications();
  const [windowWidth, setWindowWidth] = useState(Dimensions.get('window').width);
  const [sidebarVisible, setSidebarVisible] = useState(windowWidth >= 768);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'stock'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [localVendor, setLocalVendor] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [vendorProducts, setVendorProducts] = useState<any[]>([]);
  
  // Load products from Firestore when component mounts
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        await refreshProducts();
      } catch (error) {
        console.error('Error loading products:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
    // Only run this once on component mount
  }, []);
  
  // Load vendor data from AsyncStorage as a fallback
  useEffect(() => {
    const loadVendorData = async () => {
      try {
        // If we already have the vendor from context, use that
        if (currentVendor) {
          console.log('VendorProducts: Using vendor from context:', currentVendor.name);
          setLocalVendor(currentVendor);
          return;
        }
        
        // Otherwise, try to load from AsyncStorage
        const vendorData = await AsyncStorage.getItem('currentVendor');
        const vendorId = await AsyncStorage.getItem('vendorId');
        
        console.log('VendorProducts: Loading vendor from AsyncStorage, vendorId:', vendorId);
        
        if (vendorData) {
          const parsedVendor = JSON.parse(vendorData);
          console.log('VendorProducts: Loaded vendor from AsyncStorage:', parsedVendor.name);
          setLocalVendor(parsedVendor);
        } else {
          console.error('VendorProducts: No vendor data found in AsyncStorage');
        }
      } catch (error) {
        console.error('Error loading vendor data:', error);
      }
    };
    
    loadVendorData();
  }, [currentVendor]);
  
  // Get products for this vendor
  useEffect(() => {
    const vendorId = localVendor?.id || currentVendor?.id;
    if (vendorId) {
      console.log('Getting products for vendor ID:', vendorId);
      const vendorProducts = getProductsByVendor(vendorId);
      console.log(`Found ${vendorProducts.length} products for this vendor`);
      setVendorProducts(vendorProducts);
    }
  }, [products, localVendor?.id, currentVendor?.id, getProductsByVendor]);
  
  useEffect(() => {
    const dimensionsHandler = Dimensions.addEventListener('change', ({ window }) => {
      setWindowWidth(window.width);
      setSidebarVisible(window.width >= 768);
    });

    return () => {
      dimensionsHandler.remove();
    };
  }, []);
  
  const handleAddProduct = () => {
    router.push('/vendor/add-product');
  };
  
  const handleEditProduct = (productId: string) => {
    router.push(`/vendor/edit-product?id=${productId}`);
  };
  
  const handleDeleteProduct = (productId: string, productName: string) => {
    Alert.alert(
      'Delete Product',
      `Are you sure you want to delete "${productName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteProduct(productId);
              Alert.alert('Success', 'Product deleted successfully');
            } catch (error) {
              console.error('Error deleting product:', error);
              Alert.alert('Error', 'Failed to delete product. Please try again.');
            }
          }
        },
      ]
    );
  };
  
  const toggleSort = (field: 'name' | 'price' | 'stock') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };
  
  // Filter and sort products
  const filteredProducts = vendorProducts
    .filter(product => 
      product && product.name && product.category &&
      (product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.category.toLowerCase().includes(searchQuery.toLowerCase()))
    )
    .sort((a, b) => {
      let comparison = 0;
      
      if (sortBy === 'name') {
        comparison = (a.name || '').localeCompare(b.name || '');
      } else if (sortBy === 'price') {
        comparison = (a.price || 0) - (b.price || 0);
      } else if (sortBy === 'stock') {
        comparison = (a.stock || 0) - (b.stock || 0);
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  
  const renderProductsList = () => {
    if (loading) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>Loading products...</Text>
        </View>
      );
    }
    
    if (filteredProducts.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>
            {searchQuery 
              ? 'No products match your search criteria' 
              : 'You have no products yet'}
          </Text>
          <TouchableOpacity 
            style={styles.addFirstProductButton}
            onPress={handleAddProduct}
          >
            <Plus size={16} color="#FFFFFF" />
            <Text style={styles.addFirstProductButtonText}>
              {searchQuery ? 'Clear Search' : 'Add Your First Product'}
            </Text>
          </TouchableOpacity>
        </View>
      );
    }
    
    return (
      <View style={styles.productsTable}>
        <View style={styles.tableHeader}>
          <TouchableOpacity 
            style={[styles.tableHeaderCell, styles.productNameHeader]}
            onPress={() => toggleSort('name')}
          >
            <Text style={styles.tableHeaderText}>Product</Text>
            {sortBy === 'name' && (
              sortOrder === 'asc' ? (
                <ArrowUp size={16} color="#4B5563" />
              ) : (
                <ArrowDown size={16} color="#4B5563" />
              )
            )}
          </TouchableOpacity>
          
          <View style={[styles.tableHeaderCell, styles.categoryHeader]}>
            <Text style={styles.tableHeaderText}>Category</Text>
          </View>
          
          <TouchableOpacity 
            style={[styles.tableHeaderCell, styles.priceHeader]}
            onPress={() => toggleSort('price')}
          >
            <Text style={styles.tableHeaderText}>Price</Text>
            {sortBy === 'price' && (
              sortOrder === 'asc' ? (
                <ArrowUp size={16} color="#4B5563" />
              ) : (
                <ArrowDown size={16} color="#4B5563" />
              )
            )}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.tableHeaderCell, styles.stockHeader]}
            onPress={() => toggleSort('stock')}
          >
            <Text style={styles.tableHeaderText}>Stock</Text>
            {sortBy === 'stock' && (
              sortOrder === 'asc' ? (
                <ArrowUp size={16} color="#4B5563" />
              ) : (
                <ArrowDown size={16} color="#4B5563" />
              )
            )}
          </TouchableOpacity>
          
          <View style={[styles.tableHeaderCell, styles.actionsHeader]}>
            <Text style={styles.tableHeaderText}>Actions</Text>
          </View>
        </View>
        
        {filteredProducts.map((product) => (
          product && (
            <View key={product.id} style={styles.tableRow}>
              <View style={[styles.tableCell, styles.productNameCell]}>
                <Image 
                  source={{ uri: product.imageUrl || 'https://via.placeholder.com/50' }} 
                  style={styles.productImage} 
                />
                <Text style={styles.productName} numberOfLines={1}>
                  {product.name || 'Unnamed product'}
                </Text>
              </View>
              
              <View style={[styles.tableCell, styles.categoryCell]}>
                <Text style={styles.categoryText}>{product.category || 'Uncategorized'}</Text>
              </View>
              
              <View style={[styles.tableCell, styles.priceCell]}>
                <Text style={styles.priceText}>
                  ${(product.price || 0).toFixed(2)}
                </Text>
                {product.discountPrice && (
                  <Text style={styles.discountPriceText}>
                    ${product.discountPrice.toFixed(2)}
                  </Text>
                )}
              </View>
              
              <View style={[styles.tableCell, styles.stockCell]}>
                <View style={[
                  styles.stockIndicator,
                  (product.stock || 0) > 10 
                    ? styles.stockHigh 
                    : (product.stock || 0) > 0 
                      ? styles.stockMedium 
                      : styles.stockLow
                ]}>
                  <Text style={styles.stockText}>{product.stock || 0}</Text>
                </View>
              </View>
              
              <View style={[styles.tableCell, styles.actionsCell]}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleEditProduct(product.id)}
                >
                  <Edit size={16} color="#4F46E5" />
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleDeleteProduct(product.id, product.name || 'this product')}
                >
                  <Trash2 size={16} color="#EF4444" />
                </TouchableOpacity>
              </View>
            </View>
          )
        ))}
      </View>
    );
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
          <Package size={20} color="#6B7280" />
          <Text style={styles.menuItemText}>Dashboard</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.menuItem, styles.activeMenuItem]}
          onPress={() => router.push('/vendor/products')}
        >
          <Package size={20} color="#FFFFFF" />
          <Text style={[styles.menuItemText, styles.activeMenuItemText]}>Products</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => router.push('/vendor/orders')}
        >
          <Package size={20} color="#6B7280" />
          <Text style={styles.menuItemText}>Orders</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => router.push('/vendor/analytics')}
        >
          <Package size={20} color="#6B7280" />
          <Text style={styles.menuItemText}>Analytics</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => router.push('/vendor/profile')}
        >
          <Package size={20} color="#6B7280" />
          <Text style={styles.menuItemText}>Profile</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
  
  // Add a manual refresh function
  const handleRefresh = async () => {
    setLoading(true);
    
    try {
      console.log('Manually refreshing products...');
      // Get fresh data from Firestore
      await refreshProducts();
      
      // Set a short timeout to ensure Firebase has time to sync
      setTimeout(() => {
        const vendorId = localVendor?.id || currentVendor?.id;
        if (vendorId) {
          console.log('Reloading products for vendor ID:', vendorId);
          const refreshedProducts = getProductsByVendor(vendorId);
          console.log(`Refreshed: found ${refreshedProducts.length} products for this vendor`);
          setVendorProducts(refreshedProducts);
        }
        setLoading(false);
      }, 500);
    } catch (error) {
      console.error('Error refreshing products:', error);
      Alert.alert('Error', 'Failed to refresh products. Please try again.');
      setLoading(false);
    }
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
          <Text style={styles.headerTitle}>Products</Text>
          
          <View style={styles.headerActions}>
            <TouchableOpacity 
              style={styles.refreshButton}
              onPress={handleRefresh}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#059669" />
              ) : (
                <Text style={styles.refreshButtonText}>Refresh</Text>
              )}
            </TouchableOpacity>
            
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
            
            <TouchableOpacity 
              style={styles.addButton}
              onPress={handleAddProduct}
            >
              <Plus size={20} color="#FFFFFF" />
              <Text style={styles.addButtonText}>Add Product</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Search size={20} color="#6B7280" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search products..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#6B7280"
            />
          </View>
          
          <TouchableOpacity style={styles.filterButton}>
            <Filter size={20} color="#059669" />
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.content}>
          {renderProductsList()}
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#059669',
    borderRadius: 12,
    paddingHorizontal: 2,
    paddingVertical: 1,
  },
  notificationBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#059669',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginRight: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
    color: '#1F2937',
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 48,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  emptyStateButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#059669',
    borderRadius: 8,
  },
  emptyStateButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  productsTable: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tableHeaderCell: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tableHeaderText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
    marginRight: 4,
  },
  priceCell: {
    width: 100,
    justifyContent: 'flex-end',
  },
  stockCell: {
    width: 120,
    justifyContent: 'flex-end',
  },
  actionsCell: {
    width: 100,
    justifyContent: 'flex-end',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tableCell: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  productImage: {
    width: 48,
    height: 48,
    borderRadius: 4,
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
  productCategory: {
    fontSize: 12,
    color: '#6B7280',
  },
  productPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  stockText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  stockValue: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  editButton: {
    backgroundColor: '#EBF5FF',
  },
  deleteButton: {
    backgroundColor: '#FEF2F2',
  },
  productNameHeader: {
    width: 200,
  },
  categoryHeader: {
    width: 120,
  },
  priceHeader: {
    width: 100,
  },
  stockHeader: {
    width: 120,
  },
  actionsHeader: {
    width: 100,
  },
  productNameCell: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryCell: {
    flex: 1,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  priceText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  discountPriceText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
  },
  stockIndicator: {
    width: 120,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#E5E7EB',
  },
  stockHigh: {
    backgroundColor: '#059669',
  },
  stockMedium: {
    backgroundColor: '#F59E0B',
  },
  stockLow: {
    backgroundColor: '#EF4444',
  },
  addFirstProductButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#059669',
    borderRadius: 8,
    marginTop: 16,
  },
  addFirstProductButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  refreshButton: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginRight: 12,
  },
  refreshButtonText: {
    color: '#059669',
    fontWeight: '600',
  },
}); 