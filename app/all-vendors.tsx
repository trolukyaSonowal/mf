import React, { useContext, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Image 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, Star } from 'lucide-react-native';
import { useTheme, getThemeColors } from './ThemeContext';
import { VendorContext } from './VendorContext';

export default function AllVendors() {
  const { vendors, refreshVendors } = useContext(VendorContext);
  const { isDarkMode } = useTheme();
  const colors = getThemeColors(isDarkMode);
  
  // Refresh vendors when component mounts
  useEffect(() => {
    refreshVendors();
  }, []);
  
  // Filter only verified vendors
  const verifiedVendors = vendors.filter(vendor => vendor.isVerified);
  
  const handleVendorPress = (vendorId: string) => {
    router.push(`/vendor-store?id=${vendorId}`);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>All Shops</Text>
      </View>
      
      <ScrollView contentContainerStyle={styles.content}>
        {verifiedVendors.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.secondaryText }]}>
              No vendors available at the moment.
            </Text>
            <TouchableOpacity 
              onPress={refreshVendors}
              style={[styles.refreshButton, { backgroundColor: colors.primary }]}
            >
              <Text style={styles.refreshButtonText}>Refresh</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.vendorsGrid}>
            {verifiedVendors.map((vendor) => (
              <TouchableOpacity
                key={vendor.id}
                style={[styles.vendorCard, { backgroundColor: colors.card }]}
                onPress={() => handleVendorPress(vendor.id)}
              >
                <Image 
                  source={{ uri: vendor.logo }} 
                  style={styles.vendorLogo} 
                />
                
                <View style={styles.vendorInfo}>
                  <Text style={[styles.vendorName, { color: colors.text }]}>
                    {vendor.name}
                  </Text>
                  
                  <View style={styles.ratingContainer}>
                    <Star size={16} color="#FFB800" fill="#FFB800" />
                    <Text style={[styles.ratingText, { color: colors.secondaryText }]}>
                      {vendor.rating.toFixed(1)}
                    </Text>
                  </View>
                  
                  <View style={styles.categoriesWrapper}>
                    {vendor.categories.slice(0, 2).map((category, index) => (
                      <View 
                        key={index}
                        style={[styles.categoryPill, { backgroundColor: colors.primary + '20' }]}
                      >
                        <Text style={[styles.categoryPillText, { color: colors.primary }]}>
                          {category}
                        </Text>
                      </View>
                    ))}
                    {vendor.categories.length > 2 && (
                      <Text style={[styles.moreText, { color: colors.secondaryText }]}>
                        +{vendor.categories.length - 2} more
                      </Text>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  content: {
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  refreshButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  refreshButtonText: {
    color: 'white',
    fontWeight: '500',
  },
  vendorsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  vendorCard: {
    width: '48%',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  vendorLogo: {
    width: '100%',
    height: 120,
    borderRadius: 12,
  },
  vendorInfo: {
    padding: 12,
  },
  vendorName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  ratingText: {
    fontSize: 14,
    marginLeft: 4,
  },
  categoriesWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginTop: 4,
  },
  categoryPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 4,
  },
  categoryPillText: {
    fontSize: 12,
    fontWeight: '500',
  },
  moreText: {
    fontSize: 12,
    marginLeft: 4,
  },
}); 