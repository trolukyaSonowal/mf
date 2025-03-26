import React, { useState, useContext, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Check, X, Eye, ArrowLeft, SearchIcon } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { VendorContext, Vendor } from '../VendorContext';
import { NotificationContext } from '../NotificationContext';

export default function AdminVendors() {
  const { vendors, verifyVendor, updateVendor } = useContext(VendorContext);
  const { addNotification } = useContext(NotificationContext);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [showVendorDetails, setShowVendorDetails] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'verified'>('all');
  
  useEffect(() => {
    // Check if user is admin
    const checkAdmin = async () => {
      const isAdmin = await AsyncStorage.getItem('isAdmin');
      if (isAdmin !== 'true' && !global.isAdmin) {
        router.replace('/login');
      }
    };
    
    checkAdmin();
  }, []);
  
  // Filter vendors based on verification status
  const filteredVendors = vendors.filter(vendor => {
    if (filter === 'all') return true;
    if (filter === 'pending') return !vendor.isVerified;
    if (filter === 'verified') return vendor.isVerified;
    return true;
  });
  
  // Handle vendor approval
  const handleApproveVendor = async (vendor: Vendor) => {
    try {
      // Update vendor status to verified
      verifyVendor(vendor.id);
      
      // Send notification to the vendor
      await addNotification({
        title: 'Vendor Approval',
        message: `Your vendor account has been approved. You can now login as a vendor and start selling your products.`,
        type: 'general',
        forAdmin: false,
      });
      
      Alert.alert('Success', `${vendor.name} has been approved as a vendor.`);
    } catch (error) {
      console.error('Error approving vendor:', error);
      Alert.alert('Error', 'Failed to approve vendor.');
    }
  };
  
  // Handle vendor rejection
  const handleRejectVendor = async (vendor: Vendor) => {
    Alert.alert(
      'Reject Vendor',
      `Are you sure you want to reject ${vendor.name} as a vendor?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            try {
              // Update vendor status to rejected
              updateVendor(vendor.id, { isVerified: false });
              
              // Send notification to the vendor
              await addNotification({
                title: 'Vendor Application Rejected',
                message: `Your vendor application has been rejected. Please contact support for more information.`,
                type: 'general',
                forAdmin: false,
              });
              
              Alert.alert('Rejected', `${vendor.name} has been rejected.`);
            } catch (error) {
              console.error('Error rejecting vendor:', error);
              Alert.alert('Error', 'Failed to reject vendor.');
            }
          },
        },
      ]
    );
  };
  
  // View vendor details
  const handleViewVendorDetails = (vendor: Vendor) => {
    setSelectedVendor(vendor);
    setShowVendorDetails(true);
  };
  
  // Render vendor details screen
  const renderVendorDetails = () => {
    if (!selectedVendor) return null;
    
    return (
      <View style={styles.detailsContainer}>
        <View style={styles.detailsHeader}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setShowVendorDetails(false)}
          >
            <ArrowLeft size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.detailsTitle}>Vendor Details</Text>
        </View>
        
        <ScrollView style={styles.detailsContent}>
          <Image 
            source={{ uri: selectedVendor.logo }} 
            style={styles.vendorLogo} 
          />
          
          <Text style={styles.vendorName}>{selectedVendor.name}</Text>
          
          <View style={[
            styles.statusBadge,
            { backgroundColor: selectedVendor.isVerified ? '#D1FAE5' : '#FEF3C7' }
          ]}>
            <Text style={[
              styles.statusText,
              { color: selectedVendor.isVerified ? '#059669' : '#D97706' }
            ]}>
              {selectedVendor.isVerified ? 'Verified' : 'Pending Verification'}
            </Text>
          </View>
          
          <View style={styles.infoSection}>
            <Text style={styles.infoLabel}>Contact Information</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoTitle}>Email:</Text>
              <Text style={styles.infoValue}>{selectedVendor.email}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoTitle}>Phone:</Text>
              <Text style={styles.infoValue}>{selectedVendor.phone}</Text>
            </View>
          </View>
          
          <View style={styles.infoSection}>
            <Text style={styles.infoLabel}>Business Information</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoTitle}>Address:</Text>
              <Text style={styles.infoValue}>{selectedVendor.address}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoTitle}>Categories:</Text>
              <View style={styles.categoriesContainer}>
                {selectedVendor.categories.map((category, index) => (
                  <View key={index} style={styles.categoryBadge}>
                    <Text style={styles.categoryText}>{category}</Text>
                  </View>
                ))}
              </View>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoTitle}>Join Date:</Text>
              <Text style={styles.infoValue}>
                {new Date(selectedVendor.joinDate).toLocaleDateString()}
              </Text>
            </View>
          </View>
          
          <View style={styles.infoSection}>
            <Text style={styles.infoLabel}>Description</Text>
            <Text style={styles.descriptionText}>{selectedVendor.description}</Text>
          </View>
          
          {!selectedVendor.isVerified && (
            <View style={styles.actionButtonsContainer}>
              <TouchableOpacity
                style={[styles.actionButton, styles.rejectButton]}
                onPress={() => {
                  setShowVendorDetails(false);
                  handleRejectVendor(selectedVendor);
                }}
              >
                <X size={20} color="#FFFFFF" />
                <Text style={styles.actionButtonText}>Reject</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.actionButton, styles.approveButton]}
                onPress={() => {
                  setShowVendorDetails(false);
                  handleApproveVendor(selectedVendor);
                }}
              >
                <Check size={20} color="#FFFFFF" />
                <Text style={styles.actionButtonText}>Approve</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </View>
    );
  };
  
  // Render main vendor list screen
  const renderVendorList = () => (
    <>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Vendor Management</Text>
      </View>
      
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[
            styles.filterButton,
            filter === 'all' && styles.activeFilterButton
          ]}
          onPress={() => setFilter('all')}
        >
          <Text style={[
            styles.filterButtonText,
            filter === 'all' && styles.activeFilterButtonText
          ]}>
            All Vendors
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.filterButton,
            filter === 'pending' && styles.activeFilterButton
          ]}
          onPress={() => setFilter('pending')}
        >
          <Text style={[
            styles.filterButtonText,
            filter === 'pending' && styles.activeFilterButtonText
          ]}>
            Pending
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.filterButton,
            filter === 'verified' && styles.activeFilterButton
          ]}
          onPress={() => setFilter('verified')}
        >
          <Text style={[
            styles.filterButtonText,
            filter === 'verified' && styles.activeFilterButtonText
          ]}>
            Verified
          </Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.vendorList}>
        {filteredVendors.length === 0 ? (
          <View style={styles.emptyState}>
            <SearchIcon size={48} color="#D1D5DB" />
            <Text style={styles.emptyStateTitle}>No vendors found</Text>
            <Text style={styles.emptyStateSubtitle}>
              {filter === 'pending' 
                ? 'There are no pending vendor applications.' 
                : filter === 'verified' 
                ? 'There are no verified vendors yet.' 
                : 'There are no vendors registered in the system.'}
            </Text>
          </View>
        ) : (
          filteredVendors.map((vendor) => (
            <View key={vendor.id} style={styles.vendorCard}>
              <Image source={{ uri: vendor.logo }} style={styles.vendorCardImage} />
              
              <View style={styles.vendorCardInfo}>
                <Text style={styles.vendorCardName}>{vendor.name}</Text>
                <Text style={styles.vendorCardEmail}>{vendor.email}</Text>
                <View style={styles.vendorCardCategories}>
                  {vendor.categories.slice(0, 2).map((category, index) => (
                    <View key={index} style={styles.vendorCardCategory}>
                      <Text style={styles.vendorCardCategoryText}>{category}</Text>
                    </View>
                  ))}
                  {vendor.categories.length > 2 && (
                    <View style={styles.vendorCardCategory}>
                      <Text style={styles.vendorCardCategoryText}>+{vendor.categories.length - 2}</Text>
                    </View>
                  )}
                </View>
              </View>
              
              <View style={styles.vendorCardActions}>
                {!vendor.isVerified ? (
                  <>
                    <TouchableOpacity
                      style={[styles.vendorCardActionButton, styles.viewButton]}
                      onPress={() => handleViewVendorDetails(vendor)}
                    >
                      <Eye size={20} color="#3B82F6" />
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={[styles.vendorCardActionButton, styles.rejectCardButton]}
                      onPress={() => handleRejectVendor(vendor)}
                    >
                      <X size={20} color="#EF4444" />
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={[styles.vendorCardActionButton, styles.approveCardButton]}
                      onPress={() => handleApproveVendor(vendor)}
                    >
                      <Check size={20} color="#059669" />
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <TouchableOpacity
                      style={[styles.vendorCardActionButton, styles.viewButton]}
                      onPress={() => handleViewVendorDetails(vendor)}
                    >
                      <Eye size={20} color="#3B82F6" />
                    </TouchableOpacity>
                    
                    <View style={styles.verifiedBadge}>
                      <Text style={styles.verifiedBadgeText}>Verified</Text>
                    </View>
                  </>
                )}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </>
  );
  
  return (
    <SafeAreaView style={styles.container}>
      {showVendorDetails ? renderVendorDetails() : renderVendorList()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  filterContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: '#F3F4F6',
  },
  activeFilterButton: {
    backgroundColor: '#059669',
  },
  filterButtonText: {
    color: '#6B7280',
    fontWeight: '500',
  },
  activeFilterButtonText: {
    color: '#FFFFFF',
  },
  vendorList: {
    flex: 1,
    padding: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginTop: 16,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  vendorCard: {
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
  vendorCardImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
  },
  vendorCardInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  vendorCardName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  vendorCardEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  vendorCardCategories: {
    flexDirection: 'row',
  },
  vendorCardCategory: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  vendorCardCategoryText: {
    fontSize: 12,
    color: '#6B7280',
  },
  vendorCardActions: {
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  vendorCardActionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  viewButton: {
    backgroundColor: '#EBF5FF',
  },
  approveCardButton: {
    backgroundColor: '#D1FAE5',
  },
  rejectCardButton: {
    backgroundColor: '#FEE2E2',
  },
  verifiedBadge: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  verifiedBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#059669',
  },
  detailsContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  detailsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  detailsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  detailsContent: {
    padding: 16,
  },
  vendorLogo: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignSelf: 'center',
    marginBottom: 16,
  },
  vendorName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  statusBadge: {
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 24,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  infoSection: {
    marginBottom: 24,
  },
  infoLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingBottom: 8,
  },
  infoRow: {
    marginBottom: 12,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: '#1F2937',
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  categoryBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  categoryText: {
    fontSize: 14,
    color: '#6B7280',
  },
  descriptionText: {
    fontSize: 16,
    color: '#1F2937',
    lineHeight: 24,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    marginTop: 32,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    marginHorizontal: 8,
  },
  rejectButton: {
    backgroundColor: '#EF4444',
  },
  approveButton: {
    backgroundColor: '#059669',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
}); 