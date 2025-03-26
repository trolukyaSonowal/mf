import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, TextInput, Dimensions, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Package, Plus, Search, Filter, Menu, X, ArrowUp, ArrowDown, Trash2, Edit, Bell } from 'lucide-react-native';
import { VendorContext } from '../VendorContext';
import { ProductsContext } from '../ProductsContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNotifications } from '../NotificationContext';

export default function VendorProducts() {
  const { currentVendor } = useContext(VendorContext);
  const { products, deleteProduct } = useContext(ProductsContext);
  const { userNotifications, unreadUserCount } = useNotifications();
  const [windowWidth, setWindowWidth] = useState(Dimensions.get('window').width);
  const [sidebarVisible, setSidebarVisible] = useState(windowWidth >= 768);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'stock'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [localVendor, setLocalVendor] = useState<any>(null);
  
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
  
  // Filter products to show only those belonging to the current vendor
  const vendorProducts = products.filter(product => {
    const vendorId = localVendor?.id || currentVendor?.id;
    return product.vendorId === vendorId;
  });
  
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
  
  const handleEditProduct = (productId: number) => {
    router.push(`/vendor/edit-product?id=${productId}`);
  };
  
  const handleDeleteProduct = (productId: number, productName: string) => {
    Alert.alert(
      'Delete Product',
      `Are you sure you want to delete "${productName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            deleteProduct(productId);
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
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.category.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      let comparison = 0;
      
      if (sortBy === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (sortBy === 'price') {
        comparison = a.price - b.price;
      } else if (sortBy === 'stock') {
        comparison = a.stock - b.stock;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  
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
          {filteredProducts.length === 0 ? (
            <View style={styles.emptyState}>
              <Package size={48} color="#E5E7EB" />
              <Text style={styles.emptyStateTitle}>No Products Yet</Text>
              <Text style={styles.emptyStateText}>
                Start adding products to your store to increase visibility and sales.
              </Text>
              <TouchableOpacity 
                style={styles.emptyStateButton}
                onPress={handleAddProduct}
              >
                <Text style={styles.emptyStateButtonText}>+ Add New Product</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.productsTable}>
              <View style={styles.tableHeader}>
                <TouchableOpacity 
                  style={styles.tableHeaderCell}
                  onPress={() => toggleSort('name')}
                >
                  <Text style={styles.tableHeaderText}>Product</Text>
                  {sortBy === 'name' && (
                    sortOrder === 'asc' ? 
                    <ArrowUp size={16} color="#059669" /> : 
                    <ArrowDown size={16} color="#059669" />
                  )}
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.tableHeaderCell, styles.priceCell]}
                  onPress={() => toggleSort('price')}
                >
                  <Text style={styles.tableHeaderText}>Price</Text>
                  {sortBy === 'price' && (
                    sortOrder === 'asc' ? 
                    <ArrowUp size={16} color="#059669" /> : 
                    <ArrowDown size={16} color="#059669" />
                  )}
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.tableHeaderCell, styles.stockCell]}
                  onPress={() => toggleSort('stock')}
                >
                  <Text style={styles.tableHeaderText}>Stock</Text>
                  {sortBy === 'stock' && (
                    sortOrder === 'asc' ? 
                    <ArrowUp size={16} color="#059669" /> : 
                    <ArrowDown size={16} color="#059669" />
                  )}
                </TouchableOpacity>
                
                <View style={[styles.tableHeaderCell, styles.actionsCell]}>
                  <Text style={styles.tableHeaderText}>Actions</Text>
                </View>
              </View>
              
              {filteredProducts.map((product) => (
                <View key={product.id} style={styles.tableRow}>
                  <View style={styles.tableCell}>
                    <Image source={{ uri: product.image }} style={styles.productImage} />
                    <View style={styles.productDetails}>
                      <Text style={styles.productName}>{product.name}</Text>
                      <Text style={styles.productCategory}>{product.category}</Text>
                    </View>
                  </View>
                  
                  <View style={[styles.tableCell, styles.priceCell]}>
                    <Text style={styles.productPrice}>₹{product.price.toFixed(2)}</Text>
                  </View>
                  
                  <View style={[styles.tableCell, styles.stockCell]}>
                    <Text style={[
                      styles.stockText,
                      { color: product.stock > 10 ? '#059669' : (product.stock > 0 ? '#F59E0B' : '#EF4444') }
                    ]}>
                      {product.stock > 10 ? 'In Stock' : (product.stock > 0 ? 'Low Stock' : 'Out of Stock')}
                    </Text>
                    <Text style={styles.stockValue}>({product.stock})</Text>
                  </View>
                  
                  <View style={[styles.tableCell, styles.actionsCell]}>
                    <TouchableOpacity 
                      style={[styles.actionButton, styles.editButton]}
                      onPress={() => handleEditProduct(product.id)}
                    >
                      <Edit size={16} color="#3B82F6" />
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={[styles.actionButton, styles.deleteButton]}
                      onPress={() => handleDeleteProduct(product.id, product.name)}
                    >
                      <Trash2 size={16} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}
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
    fontSize: 14,
    fontWeight: '500',
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
}); 