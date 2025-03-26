import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  Alert,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, MapPin, Plus, Edit2, Trash2 } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define the Address interface
interface Address {
  id: string;
  name: string;
  fullName: string;
  phoneNumber: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
}

export default function DeliveryAddressScreen() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  
  // Form state
  const [formData, setFormData] = useState<Omit<Address, 'id'>>({
    name: '',
    fullName: '',
    phoneNumber: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    isDefault: false
  });

  // Load addresses from AsyncStorage
  useEffect(() => {
    const loadAddresses = async () => {
      try {
        const addressesJson = await AsyncStorage.getItem('addresses');
        if (addressesJson) {
          setAddresses(JSON.parse(addressesJson));
        }
        setLoading(false);
      } catch (error) {
        console.error('Error loading addresses:', error);
        setLoading(false);
      }
    };

    loadAddresses();
  }, []);

  // Save addresses to AsyncStorage
  const saveAddresses = async (newAddresses: Address[]) => {
    try {
      await AsyncStorage.setItem('addresses', JSON.stringify(newAddresses));
    } catch (error) {
      console.error('Error saving addresses:', error);
      Alert.alert('Error', 'Failed to save address. Please try again.');
    }
  };

  // Handle form input changes
  const handleInputChange = (field: keyof Omit<Address, 'id'>, value: string | boolean) => {
    setFormData({
      ...formData,
      [field]: value
    });
  };

  // Add a new address
  const handleAddAddress = async () => {
    // Validate form
    if (!formData.fullName || !formData.phoneNumber || !formData.address || 
        !formData.city || !formData.state || !formData.pincode) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    try {
      const newAddress: Address = {
        ...formData,
        id: Date.now().toString(),
        // If this is the first address, make it default
        isDefault: formData.isDefault || addresses.length === 0
      };

      let updatedAddresses: Address[];
      
      // If the new address is default, update other addresses
      if (newAddress.isDefault) {
        updatedAddresses = addresses.map(addr => ({
          ...addr,
          isDefault: false
        }));
        updatedAddresses.push(newAddress);
      } else {
        updatedAddresses = [...addresses, newAddress];
      }

      setAddresses(updatedAddresses);
      await saveAddresses(updatedAddresses);
      
      // Reset form
      setFormData({
        name: '',
        fullName: '',
        phoneNumber: '',
        address: '',
        city: '',
        state: '',
        pincode: '',
        isDefault: false
      });
      
      setShowAddForm(false);
      Alert.alert('Success', 'Address added successfully');
    } catch (error) {
      console.error('Error adding address:', error);
      Alert.alert('Error', 'Failed to add address. Please try again.');
    }
  };

  // Update an existing address
  const handleUpdateAddress = async () => {
    if (!editingAddress) return;
    
    // Validate form
    if (!formData.fullName || !formData.phoneNumber || !formData.address || 
        !formData.city || !formData.state || !formData.pincode) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    try {
      const updatedAddress: Address = {
        ...formData,
        id: editingAddress.id
      };

      let updatedAddresses: Address[];
      
      // If the updated address is default, update other addresses
      if (updatedAddress.isDefault) {
        updatedAddresses = addresses.map(addr => ({
          ...addr,
          isDefault: addr.id === updatedAddress.id ? true : false
        }));
      } else {
        // If this was the default address and is no longer default,
        // make sure there's still a default address
        const wasDefault = addresses.find(addr => addr.id === updatedAddress.id)?.isDefault;
        if (wasDefault && addresses.length > 1) {
          // Find another address to make default
          const otherAddressIndex = addresses.findIndex(addr => addr.id !== updatedAddress.id);
          updatedAddresses = addresses.map((addr, index) => ({
            ...addr,
            isDefault: index === otherAddressIndex
          }));
        } else {
          updatedAddresses = [...addresses];
        }
      }

      // Replace the old address with the updated one
      const finalAddresses = updatedAddresses.map(addr => 
        addr.id === updatedAddress.id ? updatedAddress : addr
      );

      setAddresses(finalAddresses);
      await saveAddresses(finalAddresses);
      
      // Reset form and editing state
      setFormData({
        name: '',
        fullName: '',
        phoneNumber: '',
        address: '',
        city: '',
        state: '',
        pincode: '',
        isDefault: false
      });
      
      setEditingAddress(null);
      Alert.alert('Success', 'Address updated successfully');
    } catch (error) {
      console.error('Error updating address:', error);
      Alert.alert('Error', 'Failed to update address. Please try again.');
    }
  };

  // Delete an address
  const handleDeleteAddress = async (id: string) => {
    Alert.alert(
      'Delete Address',
      'Are you sure you want to delete this address?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const addressToDelete = addresses.find(addr => addr.id === id);
              const wasDefault = addressToDelete?.isDefault;
              
              let updatedAddresses = addresses.filter(addr => addr.id !== id);
              
              // If the deleted address was default and there are other addresses,
              // make the first one default
              if (wasDefault && updatedAddresses.length > 0) {
                updatedAddresses = updatedAddresses.map((addr, index) => ({
                  ...addr,
                  isDefault: index === 0
                }));
              }
              
              setAddresses(updatedAddresses);
              await saveAddresses(updatedAddresses);
              Alert.alert('Success', 'Address deleted successfully');
            } catch (error) {
              console.error('Error deleting address:', error);
              Alert.alert('Error', 'Failed to delete address. Please try again.');
            }
          }
        }
      ]
    );
  };

  // Set an address as default
  const handleSetDefaultAddress = async (id: string) => {
    try {
      const updatedAddresses = addresses.map(addr => ({
        ...addr,
        isDefault: addr.id === id
      }));
      
      setAddresses(updatedAddresses);
      await saveAddresses(updatedAddresses);
      Alert.alert('Success', 'Default address updated');
    } catch (error) {
      console.error('Error setting default address:', error);
      Alert.alert('Error', 'Failed to update default address. Please try again.');
    }
  };

  // Start editing an address
  const handleEditAddress = (address: Address) => {
    setEditingAddress(address);
    setFormData({
      name: address.name,
      fullName: address.fullName,
      phoneNumber: address.phoneNumber,
      address: address.address,
      city: address.city,
      state: address.state,
      pincode: address.pincode,
      isDefault: address.isDefault
    });
  };

  // Cancel editing or adding
  const handleCancel = () => {
    setEditingAddress(null);
    setShowAddForm(false);
    setFormData({
      name: '',
      fullName: '',
      phoneNumber: '',
      address: '',
      city: '',
      state: '',
      pincode: '',
      isDefault: false
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Delivery Addresses</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#059669" />
          <Text style={styles.loadingText}>Loading addresses...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Delivery Addresses</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Address Form */}
        {(showAddForm || editingAddress) && (
          <View style={styles.formContainer}>
            <Text style={styles.formTitle}>
              {editingAddress ? 'Edit Address' : 'Add New Address'}
            </Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Address Name (e.g. Home, Work)</Text>
              <TextInput
                style={styles.input}
                placeholder="Home, Work, etc."
                value={formData.name}
                onChangeText={(text) => handleInputChange('name', text)}
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your full name"
                value={formData.fullName}
                onChangeText={(text) => handleInputChange('fullName', text)}
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone Number *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your phone number"
                keyboardType="phone-pad"
                value={formData.phoneNumber}
                onChangeText={(text) => handleInputChange('phoneNumber', text)}
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Address *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Enter your address"
                multiline
                numberOfLines={3}
                value={formData.address}
                onChangeText={(text) => handleInputChange('address', text)}
              />
            </View>
            
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.label}>City *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="City"
                  value={formData.city}
                  onChangeText={(text) => handleInputChange('city', text)}
                />
              </View>
              
              <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.label}>State *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="State"
                  value={formData.state}
                  onChangeText={(text) => handleInputChange('state', text)}
                />
              </View>
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Pincode *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter pincode"
                keyboardType="number-pad"
                value={formData.pincode}
                onChangeText={(text) => handleInputChange('pincode', text)}
              />
            </View>
            
            <TouchableOpacity
              style={styles.checkboxContainer}
              onPress={() => handleInputChange('isDefault', !formData.isDefault)}
            >
              <View style={styles.checkbox}>
                {formData.isDefault && (
                  <View style={styles.checkboxInner} />
                )}
              </View>
              <Text style={styles.checkboxLabel}>Set as default address</Text>
            </TouchableOpacity>
            
            <View style={styles.buttonRow}>
              <TouchableOpacity 
                style={[styles.button, styles.cancelButton]}
                onPress={handleCancel}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.button, styles.saveButton]}
                onPress={editingAddress ? handleUpdateAddress : handleAddAddress}
              >
                <Text style={styles.saveButtonText}>
                  {editingAddress ? 'Update Address' : 'Save Address'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Address List */}
        {!showAddForm && !editingAddress && (
          <>
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => setShowAddForm(true)}
            >
              <Plus size={20} color="#FFFFFF" />
              <Text style={styles.addButtonText}>Add New Address</Text>
            </TouchableOpacity>

            {addresses.length === 0 ? (
              <View style={styles.emptyContainer}>
                <MapPin size={64} color="#E5E7EB" />
                <Text style={styles.emptyTitle}>No Addresses Found</Text>
                <Text style={styles.emptyText}>
                  You haven't added any delivery addresses yet.
                </Text>
              </View>
            ) : (
              addresses.map((address) => (
                <View key={address.id} style={styles.addressCard}>
                  <View style={styles.addressHeader}>
                    <View style={styles.addressNameContainer}>
                      <Text style={styles.addressName}>
                        {address.name || 'Address'}
                      </Text>
                      {address.isDefault && (
                        <View style={styles.defaultBadge}>
                          <Text style={styles.defaultBadgeText}>Default</Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.addressActions}>
                      <TouchableOpacity 
                        style={styles.actionButton}
                        onPress={() => handleEditAddress(address)}
                      >
                        <Edit2 size={16} color="#059669" />
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={styles.actionButton}
                        onPress={() => handleDeleteAddress(address.id)}
                      >
                        <Trash2 size={16} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                  
                  <View style={styles.addressDetails}>
                    <Text style={styles.personName}>{address.fullName}</Text>
                    <Text style={styles.addressText}>{address.address}</Text>
                    <Text style={styles.addressText}>
                      {address.city}, {address.state}, {address.pincode}
                    </Text>
                    <Text style={styles.phoneNumber}>Phone: {address.phoneNumber}</Text>
                  </View>
                  
                  {!address.isDefault && (
                    <TouchableOpacity 
                      style={styles.setDefaultButton}
                      onPress={() => handleSetDefaultAddress(address.id)}
                    >
                      <Text style={styles.setDefaultButtonText}>Set as Default</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    marginRight: 12,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 12,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
    borderRadius: 8,
    paddingVertical: 12,
    marginBottom: 16,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginTop: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  addressCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  addressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  addressNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addressName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  defaultBadge: {
    backgroundColor: '#059669',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
  },
  defaultBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  addressActions: {
    flexDirection: 'row',
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  addressDetails: {
    marginBottom: 12,
  },
  personName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  addressText: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 2,
  },
  phoneNumber: {
    fontSize: 14,
    color: '#4B5563',
    marginTop: 4,
  },
  setDefaultButton: {
    borderWidth: 1,
    borderColor: '#059669',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  setDefaultButtonText: {
    color: '#059669',
    fontSize: 14,
    fontWeight: '600',
  },
  formContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
    marginBottom: 8,
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
    height: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#059669',
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxInner: {
    width: 12,
    height: 12,
    borderRadius: 2,
    backgroundColor: '#059669',
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#4B5563',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
    marginRight: 8,
  },
  cancelButtonText: {
    color: '#4B5563',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#059669',
    marginLeft: 8,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
}); 