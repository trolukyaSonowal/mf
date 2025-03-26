import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, TextInput, Switch, Dimensions, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Package, ShoppingCart, BarChart2, Users, TrendingUp, Menu, X, Edit2, Check, Bell, LogOut } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { VendorContext } from '../VendorContext';
import { useNotifications } from '../NotificationContext';

export default function VendorProfile() {
  const { currentVendor, updateVendor } = useContext(VendorContext);
  const { userNotifications, unreadUserCount } = useNotifications();
  const [windowWidth, setWindowWidth] = useState(Dimensions.get('window').width);
  const [sidebarVisible, setSidebarVisible] = useState(windowWidth >= 768);
  const [localVendor, setLocalVendor] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  
  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');
  const [logo, setLogo] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  
  // Bank details
  const [accountName, setAccountName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [bankName, setBankName] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  
  // Load vendor data from AsyncStorage as a fallback
  useEffect(() => {
    const loadVendorData = async () => {
      try {
        // If we already have the vendor from context, use that
        if (currentVendor) {
          console.log('VendorProfile: Using vendor from context:', currentVendor.name);
          setLocalVendor(currentVendor);
          populateFormData(currentVendor);
          return;
        }
        
        // Otherwise, try to load from AsyncStorage
        const vendorData = await AsyncStorage.getItem('currentVendor');
        const vendorId = await AsyncStorage.getItem('vendorId');
        
        console.log('VendorProfile: Loading vendor from AsyncStorage, vendorId:', vendorId);
        
        if (vendorData) {
          const parsedVendor = JSON.parse(vendorData);
          console.log('VendorProfile: Loaded vendor from AsyncStorage:', parsedVendor.name);
          setLocalVendor(parsedVendor);
          populateFormData(parsedVendor);
        } else {
          console.error('VendorProfile: No vendor data found in AsyncStorage');
        }
      } catch (error) {
        console.error('Error loading vendor data:', error);
      }
    };
    
    loadVendorData();
  }, [currentVendor]);
  
  const populateFormData = (vendor: any) => {
    setName(vendor.name || '');
    setEmail(vendor.email || '');
    setPhone(vendor.phone || '');
    setAddress(vendor.address || '');
    setDescription(vendor.description || '');
    setLogo(vendor.logo || '');
    setCategories(vendor.categories || []);
    
    // Bank details
    if (vendor.bankDetails) {
      setAccountName(vendor.bankDetails.accountName || '');
      setAccountNumber(vendor.bankDetails.accountNumber || '');
      setBankName(vendor.bankDetails.bankName || '');
      setIfscCode(vendor.bankDetails.ifscCode || '');
    }
  };
  
  useEffect(() => {
    const dimensionsHandler = Dimensions.addEventListener('change', ({ window }) => {
      setWindowWidth(window.width);
      setSidebarVisible(window.width >= 768);
    });

    return () => {
      dimensionsHandler.remove();
    };
  }, []);
  
  const handlePickImage = async () => {
    if (!isEditing) return;
    
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setLogo(result.assets[0].uri);
    }
  };
  
  const handleToggleCategory = (category: string) => {
    if (!isEditing) return;
    
    if (categories.includes(category)) {
      setCategories(categories.filter(c => c !== category));
    } else {
      setCategories([...categories, category]);
    }
  };
  
  const handleSaveProfile = () => {
    if (!localVendor) {
      Alert.alert('Error', 'Could not find vendor information');
      return;
    }
    
    // Validate form
    if (!name.trim() || !email.trim() || !phone.trim() || !address.trim() || !description.trim()) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }
    
    // Update vendor information
    const updatedVendor = {
      ...localVendor,
      name,
      email,
      phone,
      address,
      description,
      logo,
      categories,
      bankDetails: {
        accountName,
        accountNumber,
        bankName,
        ifscCode,
      }
    };
    
    try {
      // Update in context
      updateVendor(localVendor.id, updatedVendor);
      
      // Update in AsyncStorage
      AsyncStorage.setItem('currentVendor', JSON.stringify(updatedVendor));
      
      // Update local state
      setLocalVendor(updatedVendor);
      
      // Exit edit mode
      setIsEditing(false);
      
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile');
    }
  };
  
  const handleLogout = async () => {
    // Clear login state
    global.isLoggedIn = false;
    global.isAdmin = false;
    global.isVendor = false;
    global.vendorId = null;

    // Clear login state from AsyncStorage
    await AsyncStorage.removeItem('isLoggedIn');
    await AsyncStorage.removeItem('isAdmin');
    await AsyncStorage.removeItem('isVendor');
    await AsyncStorage.removeItem('vendorId');
    await AsyncStorage.removeItem('currentVendor');

    // Redirect to login page
    router.replace('/login');
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
          <BarChart2 size={20} color="#6B7280" />
          <Text style={styles.menuItemText}>Dashboard</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => router.push('/vendor/products')}
        >
          <Package size={20} color="#6B7280" />
          <Text style={styles.menuItemText}>Products</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => router.push('/vendor/orders')}
        >
          <ShoppingCart size={20} color="#6B7280" />
          <Text style={styles.menuItemText}>Orders</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => router.push('/vendor/analytics')}
        >
          <TrendingUp size={20} color="#6B7280" />
          <Text style={styles.menuItemText}>Analytics</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.menuItem, styles.activeMenuItem]}
          onPress={() => router.push('/vendor/profile')}
        >
          <Users size={20} color="#FFFFFF" />
          <Text style={[styles.menuItemText, styles.activeMenuItemText]}>Profile</Text>
        </TouchableOpacity>
      </View>
      
      <TouchableOpacity 
        style={styles.logoutButton}
        onPress={handleLogout}
      >
        <LogOut size={20} color="#EF4444" />
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>
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
          <Text style={styles.headerTitle}>Profile</Text>
          
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
          {localVendor ? (
            <>
              <View style={styles.profileHeader}>
                <TouchableOpacity
                  style={styles.profileImageContainer}
                  onPress={handlePickImage}
                  disabled={!isEditing}
                >
                  <Image 
                    source={{ uri: logo }} 
                    style={styles.profileImage}
                  />
                  {isEditing && (
                    <View style={styles.editImageOverlay}>
                      <Edit2 size={20} color="#FFFFFF" />
                    </View>
                  )}
                </TouchableOpacity>
                
                <View style={styles.profileHeaderContent}>
                  {isEditing ? (
                    <TextInput
                      style={styles.nameInput}
                      value={name}
                      onChangeText={setName}
                      placeholder="Shop Name"
                    />
                  ) : (
                    <Text style={styles.profileName}>{name}</Text>
                  )}
                  
                  <View style={styles.profileMeta}>
                    <View style={[
                      styles.verificationBadge, 
                      { backgroundColor: localVendor.isVerified ? '#059669' : '#F59E0B' }
                    ]}>
                      <Text style={styles.verificationBadgeText}>
                        {localVendor.isVerified ? 'Verified' : 'Pending Verification'}
                      </Text>
                    </View>
                    
                    <Text style={styles.joinDate}>
                      Joined on {new Date(localVendor.joinDate).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
                
                <TouchableOpacity
                  style={[
                    styles.editButton,
                    isEditing && styles.saveButton
                  ]}
                  onPress={isEditing ? handleSaveProfile : () => setIsEditing(true)}
                >
                  {isEditing ? (
                    <>
                      <Check size={20} color="#FFFFFF" />
                      <Text style={styles.editButtonText}>Save</Text>
                    </>
                  ) : (
                    <>
                      <Edit2 size={20} color="#FFFFFF" />
                      <Text style={styles.editButtonText}>Edit</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
              
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Shop Information</Text>
                
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Email</Text>
                  {isEditing ? (
                    <TextInput
                      style={styles.input}
                      value={email}
                      onChangeText={setEmail}
                      placeholder="Email"
                      keyboardType="email-address"
                    />
                  ) : (
                    <Text style={styles.value}>{email}</Text>
                  )}
                </View>
                
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Phone</Text>
                  {isEditing ? (
                    <TextInput
                      style={styles.input}
                      value={phone}
                      onChangeText={setPhone}
                      placeholder="Phone"
                      keyboardType="phone-pad"
                    />
                  ) : (
                    <Text style={styles.value}>{phone}</Text>
                  )}
                </View>
                
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Address</Text>
                  {isEditing ? (
                    <TextInput
                      style={styles.input}
                      value={address}
                      onChangeText={setAddress}
                      placeholder="Address"
                      multiline
                    />
                  ) : (
                    <Text style={styles.value}>{address}</Text>
                  )}
                </View>
                
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Description</Text>
                  {isEditing ? (
                    <TextInput
                      style={[styles.input, styles.textArea]}
                      value={description}
                      onChangeText={setDescription}
                      placeholder="Description"
                      multiline
                      numberOfLines={4}
                    />
                  ) : (
                    <Text style={styles.value}>{description}</Text>
                  )}
                </View>
              </View>
              
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Categories</Text>
                
                <View style={styles.categoriesContainer}>
                  {['Fruits', 'Vegetables', 'Dairy', 'Bakery', 'Organic', 'Pantry', 'Beverages', 'Snacks'].map(category => (
                    <TouchableOpacity
                      key={category}
                      style={[
                        styles.categoryChip,
                        categories.includes(category) && styles.selectedCategoryChip,
                        !isEditing && !categories.includes(category) && styles.disabledCategoryChip
                      ]}
                      onPress={() => handleToggleCategory(category)}
                      disabled={!isEditing && !categories.includes(category)}
                    >
                      <Text style={[
                        styles.categoryChipText,
                        categories.includes(category) && styles.selectedCategoryChipText
                      ]}>
                        {category}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Bank Details</Text>
                
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Account Holder Name</Text>
                  {isEditing ? (
                    <TextInput
                      style={styles.input}
                      value={accountName}
                      onChangeText={setAccountName}
                      placeholder="Account Holder Name"
                    />
                  ) : (
                    <Text style={styles.value}>{accountName || 'Not provided'}</Text>
                  )}
                </View>
                
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Account Number</Text>
                  {isEditing ? (
                    <TextInput
                      style={styles.input}
                      value={accountNumber}
                      onChangeText={setAccountNumber}
                      placeholder="Account Number"
                      keyboardType="number-pad"
                    />
                  ) : (
                    <Text style={styles.value}>
                      {accountNumber 
                        ? `XXXX XXXX XXXX ${accountNumber.slice(-4)}` 
                        : 'Not provided'}
                    </Text>
                  )}
                </View>
                
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Bank Name</Text>
                  {isEditing ? (
                    <TextInput
                      style={styles.input}
                      value={bankName}
                      onChangeText={setBankName}
                      placeholder="Bank Name"
                    />
                  ) : (
                    <Text style={styles.value}>{bankName || 'Not provided'}</Text>
                  )}
                </View>
                
                <View style={styles.formGroup}>
                  <Text style={styles.label}>IFSC Code</Text>
                  {isEditing ? (
                    <TextInput
                      style={styles.input}
                      value={ifscCode}
                      onChangeText={setIfscCode}
                      placeholder="IFSC Code"
                    />
                  ) : (
                    <Text style={styles.value}>{ifscCode || 'Not provided'}</Text>
                  )}
                </View>
              </View>
            </>
          ) : (
            <View style={styles.loadingContainer}>
              <Text>Loading profile information...</Text>
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
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 'auto',
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#EF4444',
    marginLeft: 12,
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
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#EF4444',
    borderRadius: 12,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  notificationBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  profileHeader: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  profileImageContainer: {
    position: 'relative',
    marginRight: 16,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  editImageOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#059669',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileHeaderContent: {
    flex: 1,
    justifyContent: 'center',
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  nameInput: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingBottom: 4,
  },
  profileMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  joinDate: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#3B82F6',
    alignSelf: 'flex-start',
  },
  saveButton: {
    backgroundColor: '#059669',
  },
  editButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 4,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
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
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4B5563',
    marginBottom: 8,
  },
  value: {
    fontSize: 16,
    color: '#1F2937',
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#1F2937',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    margin: 4,
  },
  selectedCategoryChip: {
    backgroundColor: '#059669',
  },
  disabledCategoryChip: {
    opacity: 0.5,
  },
  categoryChipText: {
    fontSize: 14,
    color: '#4B5563',
  },
  selectedCategoryChipText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
}); 