import React, { useState, useContext, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Image, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Mail, Lock, User, Phone, MapPin, Camera, CreditCard, ChevronRight, ArrowLeft } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { VendorContext } from './VendorContext';
import { NotificationContext } from './NotificationContext';
import { auth, db } from './firebaseConfig';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

// User registration interface
interface UserData {
  name: string;
  email: string;
  phone: string;
  password: string;
}

// Vendor registration interface extends user data
interface VendorData extends UserData {
  shopName: string;
  shopAddress: string;
  shopImage: string;
  aadharNumber: string;
  aadharImage: string;
  description: string;
  categories: string[];
}

export default function RegisterScreen() {
  // Common registration states
  const [registerAs, setRegisterAs] = useState<'user' | 'vendor'>('user');
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // Context
  const { addVendor } = useContext(VendorContext);
  const { addNotification } = useContext(NotificationContext);
  
  // User registration form state
  const [userData, setUserData] = useState<UserData>({
    name: '',
    email: '',
    phone: '',
    password: '',
  });
  
  // Vendor registration form state (extends user data)
  const [vendorData, setVendorData] = useState<VendorData>({
    ...userData,
    shopName: '',
    shopAddress: '',
    shopImage: '',
    aadharNumber: '',
    aadharImage: '',
    description: '',
    categories: [],
  });
  
  // Category options
  const categoryOptions = [
    'Fruits',
    'Vegetables',
    'Dairy',
    'Bakery',
    'Meat',
    'Seafood',
    'Pantry',
    'Beverages',
    'Organic',
  ];
  
  // In the beginning of the component, add these logs
  useEffect(() => {
    console.log('Current step:', currentStep);
    console.log('Register as:', registerAs);
  }, [currentStep, registerAs]);
  
  // Handle user form input changes
  const handleUserInputChange = (field: keyof UserData, value: string) => {
    setUserData({
      ...userData,
      [field]: value,
    });
    
    // Always update vendor data for common fields, regardless of registerAs value
    // This ensures data is properly synchronized between the two forms
    setVendorData({
      ...vendorData,
      [field]: value,
    });
  };
  
  // Handle vendor form input changes
  const handleVendorInputChange = (field: keyof VendorData, value: string) => {
    setVendorData({
      ...vendorData,
      [field]: value,
    });
  };
  
  // Handle category selection
  const toggleCategory = (category: string) => {
    const updatedCategories = [...vendorData.categories];
    
    if (updatedCategories.includes(category)) {
      // Remove category if already selected
      const index = updatedCategories.indexOf(category);
      updatedCategories.splice(index, 1);
    } else {
      // Add category if not already selected
      updatedCategories.push(category);
    }
    
    setVendorData({
      ...vendorData,
      categories: updatedCategories,
    });
  };
  
  // Image picker for shop image
  const pickShopImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });
    
    if (!result.canceled) {
      setVendorData({
        ...vendorData,
        shopImage: result.assets[0].uri,
      });
    }
  };
  
  // Image picker for aadhar card
  const pickAadharImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });
    
    if (!result.canceled) {
      setVendorData({
        ...vendorData,
        aadharImage: result.assets[0].uri,
      });
    }
  };
  
  // Validate user registration form
  const validateUserForm = () => {
    if (!userData.name.trim()) return 'Name is required';
    if (!userData.email.trim()) return 'Email is required';
    if (!userData.email.includes('@')) return 'Email is invalid';
    if (!userData.phone.trim()) return 'Phone number is required';
    if (userData.phone.length !== 10) return 'Phone number should be 10 digits';
    if (!userData.password.trim()) return 'Password is required';
    if (userData.password.length < 6) return 'Password should be at least 6 characters';
    
    return null;
  };
  
  // Validate vendor additional details form
  const validateVendorForm = () => {
    if (!vendorData.shopName.trim()) return 'Shop name is required';
    if (!vendorData.shopAddress.trim()) return 'Shop address is required';
    if (!vendorData.shopImage) return 'Shop image is required';
    if (!vendorData.aadharNumber.trim()) return 'Aadhar number is required';
    if (vendorData.aadharNumber.length !== 12) return 'Aadhar number should be 12 digits';
    if (!vendorData.aadharImage) return 'Aadhar card image is required';
    if (!vendorData.description.trim()) return 'Shop description is required';
    if (vendorData.categories.length === 0) return 'Please select at least one category';
    
    return null;
  };
  
  // Function to navigate between steps
  const navigateToStep = (step: number) => {
    console.log(`Navigating to step ${step}`);
    setCurrentStep(step);
  };

  // Handle next button press for vendor registration
  const handleNextStep = () => {
    // Create a validation function specifically for vendor step 1
    const validateVendorStep1 = () => {
      if (!vendorData.name.trim()) return 'Name is required';
      if (!vendorData.email.trim()) return 'Email is required';
      if (!vendorData.email.includes('@')) return 'Email is invalid';
      if (!vendorData.phone.trim()) return 'Phone number is required';
      if (vendorData.phone.length !== 10) return 'Phone number should be 10 digits';
      if (!vendorData.password.trim()) return 'Password is required';
      if (vendorData.password.length < 6) return 'Password should be at least 6 characters';
      
      return null;
    };
    
    // Validate first step form using vendorData, not userData
    const error = validateVendorStep1();
    
    if (error) {
      Alert.alert('Validation Error', error);
      return;
    }
    
    console.log('Moving to step 2');
    // Navigate to step 2
    navigateToStep(2);
  };

  // Handle back button press
  const handleBackStep = () => {
    console.log('Moving back to step 1');
    navigateToStep(1);
  };

  // Clear and reset form when switching between user and vendor
  const handleRegisterTypeChange = (type: 'user' | 'vendor') => {
    setRegisterAs(type);
    setCurrentStep(1);
    
    if (type === 'user') {
      // Reset user data
      setUserData({
        name: '',
        email: '',
        phone: '',
        password: '',
      });
      
      // Reset vendor data as well to avoid stale data
      setVendorData({
        name: '',
        email: '',
        phone: '',
        password: '',
        shopName: '',
        shopAddress: '',
        shopImage: '',
        aadharNumber: '',
        aadharImage: '',
        description: '',
        categories: [],
      });
    } else {
      // When switching to vendor, keep existing user data if available
      const newVendorData = {
        name: userData.name || '',
        email: userData.email || '',
        phone: userData.phone || '',
        password: userData.password || '',
        shopName: '',
        shopAddress: '',
        shopImage: '',
        aadharNumber: '',
        aadharImage: '',
        description: '',
        categories: [],
      };
      
      setVendorData(newVendorData);
    }
  };
  
  // Store user data in AsyncStorage and Firebase
  const storeUserData = async (userData: UserData) => {
    try {
      setLoading(true);
      
      // Create user in Firebase
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        userData.email,
        userData.password
      );
      
      // Update user profile with name
      await updateProfile(userCredential.user, {
        displayName: userData.name
      });
      
      // Get existing users or initialize empty array
      const existingUsersJson = await AsyncStorage.getItem('users');
      const existingUsers = existingUsersJson ? JSON.parse(existingUsersJson) : [];
      
      // Add new user to AsyncStorage for app data
      const newUser = {
        ...userData,
        id: userCredential.user.uid,
        createdAt: new Date().toISOString(),
      };
      
      const updatedUsers = [...existingUsers, newUser];
      
      await AsyncStorage.setItem('users', JSON.stringify(updatedUsers));
      
      setLoading(false);
      return { success: true, userId: userCredential.user.uid };
    } catch (error: any) {
      console.error('Error storing user data:', error);
      setLoading(false);
      return { 
        success: false, 
        error: error.message || 'Error storing user data' 
      };
    }
  };
  
  // Handle user registration
  const handleUserRegister = async () => {
    // Validate form
    const error = validateUserForm();
    
    if (error) {
      Alert.alert('Validation Error', error);
      return;
    }
    
    setLoading(true);
    
    try {
      // Store user data
      const result = await storeUserData(userData);
      
      if (!result.success) {
        Alert.alert('Registration Error', result.error);
        setLoading(false);
        return;
      }
      
      setLoading(false);
      
      // Show success message
      Alert.alert(
        'Registration Successful',
        'Your account has been created successfully. You can now login.',
        [
          {
            text: 'Go to Login',
            onPress: () => router.replace('/login'),
          },
        ]
      );
    } catch (error: any) {
      setLoading(false);
      Alert.alert('Registration Error', error.message || 'An error occurred during registration');
    }
  };
  
  // Handle vendor registration
  const handleVendorRegister = async () => {
    // Validate vendor form
    const error = validateVendorForm();
    
    if (error) {
      Alert.alert('Validation Error', error);
      return;
    }
    
    setLoading(true);
    
    try {
      // First register user in Firebase Authentication
      const result = await storeUserData(vendorData);
      
      if (!result.success || !result.userId) {
        Alert.alert('Registration Error', result.error || 'Failed to create user account');
        setLoading(false);
        return;
      }
      
      // Ensure userId is available
      const userId = result.userId as string;
      
      // Create vendor data with the structure expected by the VendorContext
      const vendorToAdd = {
        name: vendorData.shopName,
        email: vendorData.email,
        phone: vendorData.phone,
        logo: vendorData.shopImage,
        address: vendorData.shopAddress,
        description: vendorData.description,
        rating: 0,
        isVerified: false,
        joinDate: new Date().toISOString(),
        categories: vendorData.categories,
      };
      
      // Add vendor to context (which will update AsyncStorage)
      const newVendor = addVendor(vendorToAdd);
      
      // Store vendor data in Firestore
      const vendorDocRef = doc(db, "vendors", userId);
      await setDoc(vendorDocRef, {
        vendorId: userId,
        isVendor: true,
        isAdmin: false,
        name: vendorData.shopName,
        email: vendorData.email,
        phone: vendorData.phone,
        profileImage: vendorData.shopImage,
        address: vendorData.shopAddress,
        description: vendorData.description,
        rating: 0,
        isVerified: false,
        aadharNumber: vendorData.aadharNumber,
        aadharImage: vendorData.aadharImage,
        categories: vendorData.categories,
        createdAt: serverTimestamp(),
      });
      
      // Create notification for admin
      addNotification({
        title: 'New Vendor Registration',
        message: `${vendorData.shopName} has registered as a vendor and is waiting for approval.`,
        type: 'general',
        forAdmin: true,
      });
      
      setLoading(false);
      
      // Show success message
      Alert.alert(
        'Registration Successful',
        'Your vendor account has been submitted for approval. You will be notified once approved.',
        [
          {
            text: 'Go to Login',
            onPress: () => router.replace('/login'),
          },
        ]
      );
    } catch (error: any) {
      setLoading(false);
      console.error('Error registering vendor:', error);
      Alert.alert('Registration Error', error.message || 'Failed to register vendor');
    }
  };
  
  // Render user registration form
  const renderUserForm = () => (
    <View style={styles.form}>
      <View style={styles.inputContainer}>
        <User size={20} color="#6B7280" style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder="Full Name"
          value={userData.name}
          onChangeText={(value) => handleUserInputChange('name', value)}
          placeholderTextColor="#6B7280"
          editable={!loading}
        />
      </View>
      
      <View style={styles.inputContainer}>
        <Mail size={20} color="#6B7280" style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={userData.email}
          onChangeText={(value) => handleUserInputChange('email', value)}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholderTextColor="#6B7280"
          editable={!loading}
        />
      </View>
      
      <View style={styles.inputContainer}>
        <Phone size={20} color="#6B7280" style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder="Phone Number"
          value={userData.phone}
          onChangeText={(value) => handleUserInputChange('phone', value)}
          keyboardType="phone-pad"
          placeholderTextColor="#6B7280"
          editable={!loading}
        />
      </View>
      
      <View style={styles.inputContainer}>
        <Lock size={20} color="#6B7280" style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder="Password"
          value={userData.password}
          onChangeText={(value) => handleUserInputChange('password', value)}
          secureTextEntry
          placeholderTextColor="#6B7280"
          editable={!loading}
        />
      </View>
      
      <TouchableOpacity
        style={[styles.registerButton, loading && styles.buttonDisabled]}
        onPress={handleUserRegister}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <Text style={styles.registerButtonText}>Register as User</Text>
        )}
      </TouchableOpacity>
    </View>
  );
  
  // Render vendor first step (user details)
  const renderVendorStep1 = () => (
    <View style={styles.form}>
      <View style={styles.inputContainer}>
        <User size={20} color="#6B7280" style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder="Full Name"
          value={vendorData.name}
          onChangeText={(value) => handleVendorInputChange('name', value)}
          placeholderTextColor="#6B7280"
          editable={!loading}
        />
      </View>
      
      <View style={styles.inputContainer}>
        <Mail size={20} color="#6B7280" style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={vendorData.email}
          onChangeText={(value) => handleVendorInputChange('email', value)}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholderTextColor="#6B7280"
          editable={!loading}
        />
      </View>
      
      <View style={styles.inputContainer}>
        <Phone size={20} color="#6B7280" style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder="Phone Number"
          value={vendorData.phone}
          onChangeText={(value) => handleVendorInputChange('phone', value)}
          keyboardType="phone-pad"
          placeholderTextColor="#6B7280"
          editable={!loading}
        />
      </View>
      
      <View style={styles.inputContainer}>
        <Lock size={20} color="#6B7280" style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder="Password"
          value={vendorData.password}
          onChangeText={(value) => handleVendorInputChange('password', value)}
          secureTextEntry
          placeholderTextColor="#6B7280"
          editable={!loading}
        />
      </View>
      
      <TouchableOpacity
        style={[styles.nextButton, loading && styles.buttonDisabled]}
        onPress={handleNextStep}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <>
            <Text style={styles.nextButtonText}>Next</Text>
            <ChevronRight size={20} color="#FFFFFF" />
          </>
        )}
      </TouchableOpacity>
    </View>
  );
  
  // Render vendor second step (shop details)
  const renderVendorStep2 = () => (
    <View style={styles.form}>
      <View style={styles.inputContainer}>
        <User size={20} color="#6B7280" style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder="Shop Name"
          value={vendorData.shopName}
          onChangeText={(value) => handleVendorInputChange('shopName', value)}
          placeholderTextColor="#6B7280"
          editable={!loading}
        />
      </View>
      
      <View style={styles.inputContainer}>
        <MapPin size={20} color="#6B7280" style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder="Shop Address"
          value={vendorData.shopAddress}
          onChangeText={(value) => handleVendorInputChange('shopAddress', value)}
          multiline
          numberOfLines={2}
          placeholderTextColor="#6B7280"
          editable={!loading}
        />
      </View>
      
      <TouchableOpacity 
        style={styles.imagePickerButton} 
        onPress={pickShopImage}
        disabled={loading}
      >
        {vendorData.shopImage ? (
          <Image 
            source={{ uri: vendorData.shopImage }} 
            style={styles.previewImage} 
          />
        ) : (
          <>
            <Camera size={24} color="#6B7280" />
            <Text style={styles.imagePickerText}>Upload Shop Photo</Text>
          </>
        )}
      </TouchableOpacity>
      
      <View style={styles.inputContainer}>
        <CreditCard size={20} color="#6B7280" style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder="Aadhar Card Number"
          value={vendorData.aadharNumber}
          onChangeText={(value) => handleVendorInputChange('aadharNumber', value)}
          keyboardType="number-pad"
          placeholderTextColor="#6B7280"
          editable={!loading}
        />
      </View>
      
      <TouchableOpacity 
        style={styles.imagePickerButton} 
        onPress={pickAadharImage}
        disabled={loading}
      >
        {vendorData.aadharImage ? (
          <Image 
            source={{ uri: vendorData.aadharImage }} 
            style={styles.previewImage} 
          />
        ) : (
          <>
            <Camera size={24} color="#6B7280" />
            <Text style={styles.imagePickerText}>Upload Aadhar Card Photo</Text>
          </>
        )}
      </TouchableOpacity>
      
      <View style={styles.inputContainer}>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Shop Description"
          value={vendorData.description}
          onChangeText={(value) => handleVendorInputChange('description', value)}
          multiline
          numberOfLines={4}
          placeholderTextColor="#6B7280"
          editable={!loading}
        />
      </View>
      
      <Text style={styles.sectionTitle}>Select Categories (at least one)</Text>
      <View style={styles.categoriesContainer}>
        {categoryOptions.map((category) => (
          <TouchableOpacity
            key={category}
            style={[
              styles.categoryOption,
              vendorData.categories.includes(category) && styles.selectedCategory
            ]}
            onPress={() => toggleCategory(category)}
            disabled={loading}
          >
            <Text 
              style={[
                styles.categoryText,
                vendorData.categories.includes(category) && styles.selectedCategoryText
              ]}
            >
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.backButton, loading && styles.buttonDisabled]}
          onPress={handleBackStep}
          disabled={loading}
        >
          <ArrowLeft size={20} color={loading ? "#A1A1AA" : "#059669"} />
          <Text style={[styles.backButtonText, loading && styles.buttonTextDisabled]}>Back</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.registerButton, loading && styles.buttonDisabled]}
          onPress={handleVendorRegister}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.registerButtonText}>Register as Vendor</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
  
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backLink}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color="#059669" />
            <Text style={styles.backLinkText}>Back to Login</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>
            {registerAs === 'vendor' ? 
              (currentStep === 1 ? 'Step 1: Account Details' : 'Step 2: Shop Details') : 
              'User Registration'}
          </Text>
        </View>
        
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[
              styles.tabButton,
              registerAs === 'user' && styles.activeTabButton
            ]}
            onPress={() => handleRegisterTypeChange('user')}
            disabled={loading}
          >
            <Text 
              style={[
                styles.tabButtonText,
                registerAs === 'user' && styles.activeTabButtonText
              ]}
            >
              User
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.tabButton,
              registerAs === 'vendor' && styles.activeTabButton
            ]}
            onPress={() => handleRegisterTypeChange('vendor')}
            disabled={loading}
          >
            <Text 
              style={[
                styles.tabButtonText,
                registerAs === 'vendor' && styles.activeTabButtonText
              ]}
            >
              Vendor
            </Text>
          </TouchableOpacity>
        </View>
        
        {registerAs === 'user' && renderUserForm()}
        {registerAs === 'vendor' && currentStep === 1 && renderVendorStep1()}
        {registerAs === 'vendor' && currentStep === 2 && renderVendorStep2()}
        
        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account?</Text>
          <TouchableOpacity onPress={() => router.replace('/login')}>
            <Text style={styles.footerLink}>Login</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    marginBottom: 24,
  },
  backLink: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backLinkText: {
    fontSize: 16,
    color: '#059669',
    marginLeft: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 8,
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 24,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTabButton: {
    backgroundColor: '#059669',
  },
  tabButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  activeTabButtonText: {
    color: '#FFFFFF',
  },
  form: {
    gap: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: 16,
    color: '#1F2937',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: 16,
  },
  registerButton: {
    backgroundColor: '#059669',
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  registerButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  nextButton: {
    backgroundColor: '#059669',
    height: 48,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  backButton: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#059669',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    marginRight: 8,
  },
  backButtonText: {
    color: '#059669',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  footerText: {
    fontSize: 16,
    color: '#6B7280',
  },
  footerLink: {
    fontSize: 16,
    color: '#059669',
    fontWeight: '600',
    marginLeft: 8,
  },
  imagePickerButton: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePickerText: {
    color: '#6B7280',
    fontSize: 16,
    marginTop: 8,
  },
  previewImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  categoryOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    margin: 4,
  },
  selectedCategory: {
    backgroundColor: '#D1FAE5',
    borderColor: '#059669',
    borderWidth: 1,
  },
  categoryText: {
    color: '#6B7280',
    fontSize: 14,
  },
  selectedCategoryText: {
    color: '#059669',
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonTextDisabled: {
    color: '#6B7280',
  },
}); 