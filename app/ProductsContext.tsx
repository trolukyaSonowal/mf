import React, { createContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { collection, getDocs, doc, setDoc, deleteDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebaseConfig';

// Define the Product interface
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  discountPrice?: number;
  category: string;
  imageUrl: string;
  stock: number;
  inStock: boolean;
  vendorId: string;
  rating: number;
  createdAt: string;
}

interface ProductsContextType {
  products: Product[];
  addProduct: (product: Omit<Product, 'id' | 'createdAt'>) => Promise<string>;
  updateProduct: (id: string, updates: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  getProductById: (id: string) => Product | undefined;
  getProductsByVendor: (vendorId: string) => Product[];
  refreshProducts: () => Promise<void>;
  loading: boolean;
}

interface ProductsProviderProps {
  children: ReactNode;
}

export const ProductsContext = createContext<ProductsContextType>({
  products: [],
  addProduct: async () => '',
  updateProduct: async () => {},
  deleteProduct: async () => {},
  getProductById: () => undefined,
  getProductsByVendor: () => [],
  refreshProducts: async () => {},
  loading: false
});

export const ProductsProvider = ({ children }: ProductsProviderProps) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // Function to load products from Firestore
  const loadProductsFromFirestore = async () => {
    setLoading(true);
    try {
      console.log('Loading products from Firestore...');
      const productsSnapshot = await getDocs(collection(db, 'products'));
      
      if (!productsSnapshot.empty) {
        const productsList = productsSnapshot.docs.map(doc => {
          const data = doc.data();
          
          return {
            id: doc.id,
            name: data.name || '',
            description: data.description || '',
            price: data.price || 0,
            discountPrice: data.discountPrice,
            category: data.category || '',
            imageUrl: data.imageUrl || '',
            stock: data.stock || 0,
            inStock: data.inStock !== undefined ? data.inStock : true,
            vendorId: data.vendorId || '',
            rating: data.rating || 0,
            createdAt: data.createdAt ? 
              (typeof data.createdAt.toDate === 'function' ? 
                data.createdAt.toDate().toISOString() : 
                new Date().toISOString()) : 
              new Date().toISOString(),
          };
        });
        
        console.log(`Found ${productsList.length} products in Firestore`);
        
        // Update state only if products have changed
        setProducts(prevProducts => {
          // Compare if products have changed to prevent unnecessary rerenders
          if (JSON.stringify(prevProducts) !== JSON.stringify(productsList)) {
            // Save to AsyncStorage as backup
            AsyncStorage.setItem('products', JSON.stringify(productsList))
              .catch(error => console.error('Error saving to AsyncStorage:', error));
            return productsList;
          }
          return prevProducts;
        });
      } else {
        console.log('No products found in Firestore, checking AsyncStorage');
        try {
          const storedProducts = await AsyncStorage.getItem('products');
          if (storedProducts) {
            console.log('Loading products from AsyncStorage');
            setProducts(JSON.parse(storedProducts));
          } else {
            console.log('No products found in AsyncStorage either');
            setProducts([]);
          }
        } catch (asyncError) {
          console.error('Error loading from AsyncStorage:', asyncError);
        }
      }
    } catch (error) {
      console.error('Error loading products from Firestore:', error);
      // Fallback to AsyncStorage
      try {
        const storedProducts = await AsyncStorage.getItem('products');
        if (storedProducts) {
          console.log('Falling back to AsyncStorage for products');
          setProducts(JSON.parse(storedProducts));
        }
      } catch (asyncError) {
        console.error('Error with AsyncStorage fallback:', asyncError);
      }
    } finally {
      setLoading(false);
    }
  };

  // Load products from Firestore when the component mounts
  useEffect(() => {
    loadProductsFromFirestore();
  }, []);

  // Save products to AsyncStorage whenever they change
  useEffect(() => {
    const saveProducts = async () => {
      try {
        await AsyncStorage.setItem('products', JSON.stringify(products));
      } catch (error) {
        console.error('Error saving products to AsyncStorage:', error);
      }
    };

    saveProducts();
  }, [products]);

  // Function to add a new product
  const addProduct = async (product: Omit<Product, 'id' | 'createdAt'>) => {
    try {
      console.log('ProductsContext: Adding new product with data:', JSON.stringify(product));
      
      // Validate product data
      if (!product.name || !product.description || !product.price || !product.category || !product.vendorId) {
        throw new Error('Missing required product fields');
      }
      
      // Create a proper product object with timestamps
      const productData: any = {
        name: product.name,
        description: product.description,
        price: product.price,
        category: product.category,
        imageUrl: product.imageUrl || '',
        stock: product.stock || 0,
        inStock: product.inStock !== undefined ? product.inStock : true,
        vendorId: product.vendorId,
        rating: product.rating || 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      // Only add discountPrice if it has a value
      if (product.discountPrice) {
        productData.discountPrice = product.discountPrice;
      }
      
      console.log('ProductsContext: Submitting to Firestore:', productData);

      // Add the product to Firestore
      const docRef = await addDoc(collection(db, 'products'), productData);
      console.log('ProductsContext: Product added successfully with ID:', docRef.id);
      
      // Create a complete product object for state
      const newProduct: Product = {
        id: docRef.id,
        name: product.name,
        description: product.description,
        price: product.price,
        discountPrice: product.discountPrice,
        category: product.category,
        imageUrl: product.imageUrl || '',
        stock: product.stock || 0,
        inStock: product.inStock !== undefined ? product.inStock : true,
        vendorId: product.vendorId,
        rating: product.rating || 0,
        createdAt: new Date().toISOString()
      };

      // Update local state
      setProducts(prevProducts => [...prevProducts, newProduct]);
      
      // Return the new product ID
      return docRef.id;
    } catch (error: any) {
      console.error('ProductsContext: Error adding product:', error);
      console.error('ProductsContext: Error message:', error.message);
      if (error.code) {
        console.error('ProductsContext: Error code:', error.code);
      }
      throw error;
    }
  };

  // Function to delete a product
  const deleteProduct = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'products', id));
      setProducts((prevProducts) => prevProducts.filter(product => product.id !== id));
      await AsyncStorage.setItem('products', JSON.stringify(products.filter(product => product.id !== id)));
    } catch (error) {
      console.error('Error deleting product:', error);
      throw error;
    }
  };

  // Function to update a product
  const updateProduct = async (id: string, updates: Partial<Product>) => {
    try {
      await setDoc(doc(db, 'products', id), updates, { merge: true });
      setProducts((prevProducts) =>
        prevProducts.map(product =>
          product.id === id ? { ...product, ...updates } : product
        )
      );
      await AsyncStorage.setItem('products', JSON.stringify(products.map(product =>
        product.id === id ? { ...product, ...updates } : product
      )));
    } catch (error) {
      console.error('Error updating product:', error);
      throw error;
    }
  };

  // Function to get a product by ID
  const getProductById = (id: string): Product | undefined => {
    return products.find(product => product.id === id);
  };

  // Function to get products by vendor
  const getProductsByVendor = (vendorId: string): Product[] => {
    if (!vendorId) {
      console.warn('getProductsByVendor called with empty vendorId');
      return [];
    }
    
    const filteredProducts = products.filter(product => product.vendorId === vendorId);
    console.log(`Found ${filteredProducts.length} products for vendor: ${vendorId}`);
    
    return filteredProducts;
  };

  // Function to refresh products
  const refreshProducts = async () => {
    await loadProductsFromFirestore();
  };

  return (
    <ProductsContext.Provider value={{ 
      products, 
      addProduct, 
      deleteProduct, 
      updateProduct,
      getProductById,
      getProductsByVendor,
      refreshProducts,
      loading
    }}>
      {children}
    </ProductsContext.Provider>
  );
};