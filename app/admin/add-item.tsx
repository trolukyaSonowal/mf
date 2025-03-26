import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, Image, Modal, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, Plus, Image as ImageIcon, Camera, ChevronDown } from 'lucide-react-native';
import { ProductsContext } from '../ProductsContext';
import * as ImagePicker from 'expo-image-picker';

// Define available categories
const categories = [
  { name: 'Fruits', icon: '🍎' },
  { name: 'Vegetables', icon: '🥬' },
  { name: 'Dairy', icon: '🥛' },
  { name: 'Bakery', icon: '🥖' },
  { name: 'Meat', icon: '🥩' },
  { name: 'Fish', icon: '🐟' },
  { name: 'Pantry', icon: '🥫' },
  { name: 'Beverages', icon: '🧃' },
  { name: 'Snacks', icon: '🍿' },
  { name: 'Frozen', icon: '❄️' },
  { name: 'Organic', icon: '🌱' },
  { name: 'Other', icon: '📦' },
];

export default function AddItemScreen() {
  const { addProduct } = useContext(ProductsContext);
  
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    category: '',
    description: '',
    imageUrl: '',
    isOrganic: false,
  });
  
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);

  const pickImage = async () => {
    // Request permission to access the media library
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Sorry, we need camera roll permissions to make this work!');
      return;
    }

    // Launch the image picker
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      // Set the selected image URI
      setSelectedImage(result.assets[0].uri);
      setFormData({ ...formData, imageUrl: result.assets[0].uri });
    }
  };

  const takePhoto = async () => {
    // Request permission to access the camera
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Sorry, we need camera permissions to make this work!');
      return;
    }

    // Launch the camera
    let result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      // Set the selected image URI
      setSelectedImage(result.assets[0].uri);
      setFormData({ ...formData, imageUrl: result.assets[0].uri });
    }
  };

  const handleCategorySelect = (category: string) => {
    setFormData({ ...formData, category });
    setCategoryModalVisible(false);
  };

  const handleSubmit = () => {
    // Validate form data
    if (!formData.name || !formData.price || !formData.category || !formData.imageUrl) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }

    // Create a new product object with the form data
    const newProduct = {
      name: formData.name,
      price: parseFloat(formData.price),
      category: formData.category,
      description: formData.description,
      image: formData.imageUrl,
      organic: formData.isOrganic,
      rating: 4.0, // Default rating
    };
    
    try {
      // Add the product using the context function
      const addedProduct = addProduct(newProduct);
      
      // Show a brief success message
      Alert.alert("Success", "Product added successfully");
      
      // Automatically redirect to the admin dashboard to see the added product
      setTimeout(() => {
        router.replace('/admin');
      }, 500);
    } catch (error) {
      Alert.alert("Error", "Failed to add product. Please try again.");
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      price: '',
      category: '',
      description: '',
      imageUrl: '',
      isOrganic: false,
    });
    setSelectedImage(null);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add New Item</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.formContainer}>
          <View style={styles.form}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Product Name <Text style={styles.required}>*</Text></Text>
              <TextInput
                style={styles.input}
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                placeholder="Enter product name"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Price <Text style={styles.required}>*</Text></Text>
              <View style={styles.priceInputContainer}>
                <Text style={styles.currencySymbol}>₹</Text>
                <TextInput
                  style={styles.priceInput}
                  value={formData.price}
                  onChangeText={(text) => setFormData({ ...formData, price: text })}
                  placeholder="0.00"
                  keyboardType="decimal-pad"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Category <Text style={styles.required}>*</Text></Text>
              <TouchableOpacity 
                style={styles.categorySelector}
                onPress={() => setCategoryModalVisible(true)}
              >
                <Text style={formData.category ? styles.categoryText : styles.placeholderText}>
                  {formData.category || "Select a category"}
                </Text>
                <ChevronDown size={20} color="#6B7280" />
              </TouchableOpacity>
              
              {/* Category Selection Modal */}
              <Modal
                visible={categoryModalVisible}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setCategoryModalVisible(false)}
              >
                <View style={styles.modalOverlay}>
                  <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                      <Text style={styles.modalTitle}>Select Category</Text>
                      <TouchableOpacity 
                        style={styles.closeButtonContainer}
                        onPress={() => setCategoryModalVisible(false)}
                      >
                        <Text style={styles.closeButton}>✕</Text>
                      </TouchableOpacity>
                    </View>
                    
                    <FlatList
                      data={categories}
                      keyExtractor={(item) => item.name}
                      numColumns={3}
                      renderItem={({ item }) => (
                        <TouchableOpacity
                          style={[
                            styles.categoryItem,
                            formData.category === item.name && styles.categoryItemSelected
                          ]}
                          onPress={() => handleCategorySelect(item.name)}
                        >
                          <Text style={styles.categoryIcon}>{item.icon}</Text>
                          <Text style={styles.categoryItemText}>{item.name}</Text>
                        </TouchableOpacity>
                      )}
                    />
                  </View>
                </View>
              </Modal>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.description}
                onChangeText={(text) => setFormData({ ...formData, description: text })}
                placeholder="Enter product description"
                multiline
                numberOfLines={4}
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Product Image <Text style={styles.required}>*</Text></Text>
              
              {selectedImage ? (
                <View style={styles.imagePreviewContainer}>
                  <Image source={{ uri: selectedImage }} style={styles.imagePreview} />
                  <View style={styles.imageActions}>
                    <TouchableOpacity 
                      style={styles.changeImageButton}
                      onPress={pickImage}
                    >
                      <ImageIcon size={16} color="#FFFFFF" />
                      <Text style={styles.changeImageButtonText}>Change</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.takePhotoButton}
                      onPress={takePhoto}
                    >
                      <Camera size={16} color="#FFFFFF" />
                      <Text style={styles.takePhotoButtonText}>Take Photo</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View style={styles.imageUploadContainer}>
                  <TouchableOpacity 
                    style={styles.imageUploadButton}
                    onPress={pickImage}
                  >
                    <View style={styles.imageIconContainer}>
                      <ImageIcon size={24} color="#059669" />
                    </View>
                    <Text style={styles.imageButtonText}>Choose from Gallery</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.imageUploadButton}
                    onPress={takePhoto}
                  >
                    <View style={styles.imageIconContainer}>
                      <Camera size={24} color="#059669" />
                    </View>
                    <Text style={styles.imageButtonText}>Take a Photo</Text>
                  </TouchableOpacity>
                </View>
              )}
              
              <Text style={styles.orText}>OR</Text>
              
              <TextInput
                style={styles.input}
                value={formData.imageUrl}
                onChangeText={(text) => setFormData({ ...formData, imageUrl: text })}
                placeholder="Enter image URL"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.formGroup}>
              <TouchableOpacity
                style={styles.checkbox}
                onPress={() => setFormData({ ...formData, isOrganic: !formData.isOrganic })}
              >
                <View
                  style={[
                    styles.checkboxInner,
                    formData.isOrganic && styles.checkboxChecked,
                  ]}
                >
                  {formData.isOrganic && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </View>
                <Text style={styles.checkboxLabel}>Organic Product</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
              <Plus size={20} color="#FFFFFF" />
              <Text style={styles.submitButtonText}>Add Product</Text>
            </TouchableOpacity>
          </View>
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
  },
  formContainer: {
    padding: 16,
  },
  form: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    gap: 20,
  },
  formGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  required: {
    color: '#EF4444',
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: '#1F2937',
  },
  priceInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
  },
  currencySymbol: {
    fontSize: 16,
    color: '#1F2937',
    marginRight: 4,
  },
  priceInput: {
    flex: 1,
    padding: 14,
    fontSize: 16,
    color: '#1F2937',
  },
  categorySelector: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryText: {
    fontSize: 16,
    color: '#1F2937',
  },
  placeholderText: {
    fontSize: 16,
    color: '#9CA3AF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '90%',
    maxHeight: '80%',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  closeButtonContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    fontSize: 18,
    color: '#6B7280',
  },
  categoryItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    margin: 6,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
  },
  categoryIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  categoryItemText: {
    fontSize: 14,
    color: '#1F2937',
    textAlign: 'center',
  },
  categoryItemSelected: {
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#059669',
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  imageUploadContainer: {
    flexDirection: 'column',
    gap: 12,
    marginBottom: 16,
  },
  imageUploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  imageIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  imageButtonText: {
    color: '#059669',
    fontWeight: '600',
    fontSize: 16,
  },
  imagePreviewContainer: {
    marginBottom: 16,
  },
  imagePreview: {
    width: '100%',
    height: 240,
    borderRadius: 12,
    marginBottom: 12,
  },
  imageActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  changeImageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#059669',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  changeImageButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  takePhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  takePhotoButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  orText: {
    textAlign: 'center',
    color: '#6B7280',
    marginVertical: 12,
    fontWeight: '500',
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkboxInner: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  submitButton: {
    backgroundColor: '#059669',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
    marginTop: 8,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});