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
  Alert,
  ActivityIndicator 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, Menu, X, Upload, Package, Bell } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ProductsContext } from '../ProductsContext';
import { VendorContext } from '../VendorContext';
import { useNotifications } from '../NotificationContext';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Picker } from '@react-native-picker/picker';
import { auth, storage } from '../firebaseConfig';

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
  const [image, setImage] = useState<string | null>(null);
  const [stock, setStock] = useState('50');
  const [organic, setOrganic] = useState(false);
  const [sku, setSku] = useState('');
  const [discountPrice, setDiscountPrice] = useState('');
  const [inStock, setInStock] = useState(true);
  
  // Form validation
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  
  // Load vendor data from AsyncStorage as a fallback
  useEffect(() => {
    const loadVendorData = async () => {
      try {
        // Print auth user information for debugging
        console.log('Current auth user:', auth.currentUser?.uid);
        
        // If we already have the vendor from context, use that
        if (currentVendor) {
          console.log('AddProduct: Using vendor from context:', currentVendor.name, 'with ID:', currentVendor.id);
          setLocalVendor(currentVendor);
          return;
        }
        
        // Otherwise, try to load from AsyncStorage
        const vendorData = await AsyncStorage.getItem('currentVendor');
        const vendorId = await AsyncStorage.getItem('vendorId');
        
        console.log('AddProduct: Loading vendor from AsyncStorage, vendorId:', vendorId);
        
        if (vendorData) {
          const parsedVendor = JSON.parse(vendorData);
          console.log('AddProduct: Loaded vendor from AsyncStorage:', parsedVendor.name, 'with ID:', parsedVendor.id);
          setLocalVendor(parsedVendor);
        } else {
          console.error('AddProduct: No vendor data found in AsyncStorage');
          Alert.alert('Error', 'Vendor data not found. Please log in again.');
          router.replace('/login');
        }
      } catch (error) {
        console.error('Error loading vendor data:', error);
        Alert.alert('Error', 'Failed to load vendor data. Please try again.');
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
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      
      if (!result.canceled) {
        setImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };
  
  const uploadImage = async (uri: string) => {
    setUploading(true);
    try {
      console.log('Starting image upload...');
      const response = await fetch(uri);
      const blob = await response.blob();
      
      // Use the shared storage instance
      const filename = uri.substring(uri.lastIndexOf('/') + 1);
      const timestamp = Date.now();
      const storagePath = `products/${timestamp}_${filename}`;
      
      console.log('Uploading to storage location:', storagePath);
      const storageRef = ref(storage, storagePath);
      
      console.log('Storage reference created:', storageRef);
      await uploadBytes(storageRef, blob);
      console.log('Image bytes uploaded successfully');
      
      const downloadURL = await getDownloadURL(storageRef);
      
      console.log('Image uploaded successfully, URL:', downloadURL);
      return downloadURL;
    } catch (error: any) {
      console.error('Error uploading image:', error);
      console.error('Detailed error:', JSON.stringify(error));
      throw new Error(`Image upload failed: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };
  
  // Submit handler
  const handleSubmit = async () => {
    // Reset error state
    setError('');
    
    // Validate required inputs (image is now optional)
    if (!name || !description || !price || !category || !stock) {
      setError('Please fill all required fields');
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }
    
    if (!localVendor?.id) {
      setError('Vendor data not found');
      Alert.alert('Error', 'Vendor data not found. Please log in again.');
      return;
    }
    
    const vendorId = localVendor.id;
    console.log('Preparing to add product with vendor ID:', vendorId);
    console.log('Current authenticated user:', auth.currentUser?.uid);
    
    setLoading(true);
    
    try {
      let imageUrl = '';
      
      if (image) {
        try {
          imageUrl = await uploadImage(image);
        } catch (imageError: any) {
          console.error('Image upload failed:', imageError);
          setError(`Image upload failed: ${imageError.message}`);
          Alert.alert('Error', `Failed to upload image: ${imageError.message}`);
          setLoading(false);
          return;
        }
      }
      
      // Create product object
      const newProduct: any = {
        name,
        description,
        price: parseFloat(price),
        category,
        imageUrl, // This could be empty string if no image was uploaded
        stock: parseInt(stock),
        inStock,
        vendorId, // Use the vendorId from above for consistency
        rating: 0
      };
      
      // Only add discountPrice if it has a value
      if (discountPrice && discountPrice.trim() !== '') {
        newProduct.discountPrice = parseFloat(discountPrice);
      }
      
      console.log('Adding product with data:', JSON.stringify(newProduct));
      console.log('Vendor ID in product:', newProduct.vendorId);
      
      try {
        const productId = await addProduct(newProduct);
        console.log('Product added successfully with ID:', productId);
        Alert.alert('Success', 'Product added successfully!', [
          { text: 'OK', onPress: () => router.replace('/vendor/products') }
        ]);
      } catch (addError: any) {
        console.error('Error adding product to Firestore:', addError);
        console.error('Error details:', JSON.stringify(addError));
        setError(`Failed to add product: ${addError.message}`);
        Alert.alert('Error', `Failed to add product: ${addError.message}`);
      }
    } catch (error: any) {
      console.error('Unexpected error in product submission:', error);
      setError(`Unexpected error: ${error.message}`);
      Alert.alert('Error', `Unexpected error: ${error.message}`);
    } finally {
      setLoading(false);
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
          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}
          
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
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={category}
                    onValueChange={(itemValue) => setCategory(itemValue)}
                    style={styles.picker}
                  >
                    {categories.map((cat) => (
                      <Picker.Item key={cat} label={cat} value={cat} />
                    ))}
                  </Picker>
                </View>
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
              <Text style={styles.sectionTitle}>Product Image (Optional)</Text>
              
              {image ? (
                <View style={styles.imagePreviewContainer}>
                  <Image source={{ uri: image }} style={styles.productImage} />
                  <TouchableOpacity 
                    style={styles.removeImageButton}
                    onPress={() => setImage(null)}
                  >
                    <X size={20} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity 
                  style={styles.uploadButton}
                  onPress={pickImage}
                >
                  <Upload size={24} color="#4F46E5" />
                  <Text style={styles.uploadButtonText}>Choose Image (Optional)</Text>
                </TouchableOpacity>
              )}
            </View>
            
            <TouchableOpacity 
              style={[
                styles.submitButton,
                (loading || uploading) && styles.disabledButton
              ]}
              onPress={handleSubmit}
              disabled={loading || uploading}
            >
              {loading || uploading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.submitButtonText}>Add Product</Text>
              )}
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
  pickerContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
  },
  picker: {
    height: 50,
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
  imagePreviewContainer: {
    position: 'relative',
    width: '100%',
    height: 200,
    borderRadius: 8,
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
    borderRadius: 8,
    padding: 16,
    borderStyle: 'dashed',
  },
  uploadButtonText: {
    fontSize: 16,
    color: '#4F46E5',
    marginLeft: 8,
  },
  submitButton: {
    backgroundColor: '#4F46E5',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  disabledButton: {
    backgroundColor: '#A5B4FC',
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
  errorContainer: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#EF4444',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
}); 