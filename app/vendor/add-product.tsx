import React, { useState, useContext, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  Image, 
  Switch, 
  Dimensions,
  Alert 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, Menu, X, Upload, Package, Bell } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ProductsContext } from '../ProductsContext';
import { VendorContext } from '../VendorContext';
import { useNotifications } from '../NotificationContext';

// Array of product categories
const categories = [
  'Fruits', 
  'Vegetables', 
  'Dairy', 
  'Bakery', 
  'Pantry', 
  'Beverages', 
  'Snacks', 
  'Organic'
];

export default function AddProduct() {
  const { addProduct } = useContext(ProductsContext);
  const { currentVendor } = useContext(VendorContext);
  const { userNotifications, unreadUserCount } = useNotifications();
  const [windowWidth, setWindowWidth] = useState(Dimensions.get('window').width);
  const [sidebarVisible, setSidebarVisible] = useState(windowWidth >= 768);
  const [localVendor, setLocalVendor] = useState<any>(null);
  
  // Product state
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(categories[0]);
  const [image, setImage] = useState('https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=400');
  const [stock, setStock] = useState('50');
  const [organic, setOrganic] = useState(false);
  const [sku, setSku] = useState('');
  
  // Form validation
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Load vendor data from AsyncStorage as a fallback
  useEffect(() => {
    const loadVendorData = async () => {
      try {
        // If we already have the vendor from context, use that
        if (currentVendor) {
          console.log('AddProduct: Using vendor from context:', currentVendor.name);
          setLocalVendor(currentVendor);
          return;
        }
        
        // Otherwise, try to load from AsyncStorage
        const vendorData = await AsyncStorage.getItem('currentVendor');
        const vendorId = await AsyncStorage.getItem('vendorId');
        
        console.log('AddProduct: Loading vendor from AsyncStorage, vendorId:', vendorId);
        
        if (vendorData) {
          const parsedVendor = JSON.parse(vendorData);
          console.log('AddProduct: Loaded vendor from AsyncStorage:', parsedVendor.name);
          setLocalVendor(parsedVendor);
        } else {
          console.error('AddProduct: No vendor data found in AsyncStorage');
        }
      } catch (error) {
        console.error('Error loading vendor data:', error);
      }
    };
    
    loadVendorData();
  }, [currentVendor]);
  
  useEffect(() => {
    const dimensionsHandler = Dimensions.addEventListener('change', ({ window }) => {
      setWindowWidth(window.width);
      setSidebarVisible(window.width >= 768);
    });

    return () => {
      dimensionsHandler.remove();
    };
  }, []);
  
  // Image picker function
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };
  
  // Submit handler
  const handleSubmit = () => {
    // Reset errors
    setErrors({});
    setIsSubmitting(true);
    
    // Validate form
    let hasErrors = false;
    const newErrors: {[key: string]: string} = {};
    
    if (!name.trim()) {
      newErrors.name = 'Product name is required';
      hasErrors = true;
    }
    
    if (!price.trim()) {
      newErrors.price = 'Price is required';
      hasErrors = true;
    } else if (isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
      newErrors.price = 'Price must be a positive number';
      hasErrors = true;
    }
    
    if (!stock.trim()) {
      newErrors.stock = 'Stock quantity is required';
      hasErrors = true;
    } else if (isNaN(parseInt(stock)) || parseInt(stock) < 0) {
      newErrors.stock = 'Stock must be a non-negative number';
      hasErrors = true;
    }
    
    if (!description.trim()) {
      newErrors.description = 'Description is required';
      hasErrors = true;
    }
    
    // If has errors, show them and stop submission
    if (hasErrors) {
      setErrors(newErrors);
      setIsSubmitting(false);
      return;
    }
    
    // Create new product
    try {
      if (!localVendor) {
        Alert.alert('Error', 'Vendor information not found. Please try again.');
        setIsSubmitting(false);
        return;
      }
      
      // Add product with vendor ID
      const newProduct = addProduct({
        name,
        price: parseFloat(price),
        image,
        category,
        organic,
        rating: 0,
        description,
        vendorId: localVendor.id,
        stock: parseInt(stock),
        sku: sku.trim() || undefined, // Optional, will be auto-generated if empty
      });
      
      Alert.alert(
        'Success',
        `"${name}" has been added successfully`,
        [{ text: 'OK', onPress: () => router.push('/vendor/products') }]
      );
    } catch (error) {
      console.error('Error adding product:', error);
      Alert.alert('Error', 'Failed to add product. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
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
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add New Product</Text>
          
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
        </View>
        
        <ScrollView style={styles.content}>
          <View style={styles.formContainer}>
            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>Product Information</Text>
              
              {/* Product Name */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Product Name*</Text>
                <TextInput
                  style={[styles.input, errors.name && styles.inputError]}
                  value={name}
                  onChangeText={setName}
                  placeholder="Enter product name"
                />
                {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
              </View>
              
              {/* Price & Stock */}
              <View style={styles.inputRow}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.inputLabel}>Price (₹)*</Text>
                  <TextInput
                    style={[styles.input, errors.price && styles.inputError]}
                    value={price}
                    onChangeText={setPrice}
                    placeholder="0.00"
                    keyboardType="decimal-pad"
                  />
                  {errors.price && <Text style={styles.errorText}>{errors.price}</Text>}
                </View>
                
                <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                  <Text style={styles.inputLabel}>Stock Quantity*</Text>
                  <TextInput
                    style={[styles.input, errors.stock && styles.inputError]}
                    value={stock}
                    onChangeText={setStock}
                    placeholder="0"
                    keyboardType="number-pad"
                  />
                  {errors.stock && <Text style={styles.errorText}>{errors.stock}</Text>}
                </View>
              </View>
              
              {/* Category Selection */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Category*</Text>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.categoryContainer}
                >
                  {categories.map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      style={[
                        styles.categoryButton,
                        category === cat && styles.categoryButtonActive
                      ]}
                      onPress={() => setCategory(cat)}
                    >
                      <Text
                        style={[
                          styles.categoryButtonText,
                          category === cat && styles.categoryButtonTextActive
                        ]}
                      >
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              
              {/* Description */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Description*</Text>
                <TextInput
                  style={[
                    styles.input, 
                    styles.textArea, 
                    errors.description && styles.inputError
                  ]}
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Describe your product..."
                  multiline
                  numberOfLines={4}
                />
                {errors.description && <Text style={styles.errorText}>{errors.description}</Text>}
              </View>
              
              {/* SKU */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>SKU (Optional)</Text>
                <TextInput
                  style={styles.input}
                  value={sku}
                  onChangeText={setSku}
                  placeholder="Enter SKU or leave blank for auto-generation"
                />
              </View>
              
              {/* Organic Switch */}
              <View style={styles.switchContainer}>
                <Text style={styles.switchLabel}>Organic Product</Text>
                <Switch
                  trackColor={{ false: '#E5E7EB', true: '#059669' }}
                  thumbColor="#FFFFFF"
                  ios_backgroundColor="#E5E7EB"
                  onValueChange={setOrganic}
                  value={organic}
                />
              </View>
            </View>
            
            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>Product Image</Text>
              
              <TouchableOpacity 
                style={styles.imageUploadContainer}
                onPress={pickImage}
              >
                {image ? (
                  <Image source={{ uri: image }} style={styles.productImage} />
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <Upload size={32} color="#6B7280" />
                    <Text style={styles.imagePlaceholderText}>Upload Image</Text>
                  </View>
                )}
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.changeImageButton}
                onPress={pickImage}
              >
                <Text style={styles.changeImageButtonText}>
                  {image ? 'Change Image' : 'Select Image'}
                </Text>
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity 
              style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              <Text style={styles.submitButtonText}>
                {isSubmitting ? 'Adding Product...' : 'Add Product'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  sidebar: {
    position: 'absolute',
    width: 250,
    height: '100%',
    backgroundColor: '#FFFFFF',
    paddingTop: 20,
    paddingHorizontal: 16,
    borderRightWidth: 1,
    borderRightColor: '#E5E7EB',
    zIndex: 100,
  },
  sidebarHidden: {
    transform: [{ translateX: -250 }],
  },
  sidebarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  sidebarTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  closeSidebarButton: {
    padding: 4,
  },
  vendorInfo: {
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  vendorLogo: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginBottom: 8,
  },
  vendorName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  verificationBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#059669',
  },
  verificationBadgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  sidebarMenu: {
    marginTop: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 4,
  },
  activeMenuItem: {
    backgroundColor: '#059669',
  },
  menuItemText: {
    marginLeft: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  activeMenuItemText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  mainContent: {
    flex: 1,
    marginLeft: Dimensions.get('window').width >= 768 ? 250 : 0,
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
    marginRight: 16,
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  content: {
    flex: 1,
  },
  formContainer: {
    padding: 16,
  },
  formSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4B5563',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1F2937',
  },
  inputError: {
    borderColor: '#EF4444',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 4,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  inputRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  categoryContainer: {
    flexDirection: 'row',
    paddingVertical: 8,
  },
  categoryButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
  },
  categoryButtonActive: {
    backgroundColor: '#059669',
  },
  categoryButtonText: {
    fontSize: 14,
    color: '#4B5563',
  },
  categoryButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  switchLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4B5563',
  },
  imageUploadContainer: {
    width: '100%',
    height: 200,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePlaceholderText: {
    marginTop: 8,
    fontSize: 14,
    color: '#6B7280',
  },
  changeImageButton: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'center',
  },
  changeImageButtonText: {
    fontSize: 14,
    color: '#4B5563',
    fontWeight: '500',
  },
  submitButton: {
    backgroundColor: '#059669',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  submitButtonDisabled: {
    backgroundColor: '#10B981',
    opacity: 0.7,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  notificationButton: {
    marginLeft: 16,
  },
  notificationBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#EF4444',
    borderRadius: 12,
    paddingHorizontal: 2,
    paddingVertical: 1,
  },
  notificationBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
}); 