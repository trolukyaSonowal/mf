import React, { createContext, useState, ReactNode, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define the Product interface
interface Product {
  id: number;
  name: string;
  price: number;
  image: string;
  category: string;
  organic: boolean;
  rating: number;
  description?: string;
  vendorId: string;
  stock: number;
  sku?: string;
}

// Define the context interface
interface ProductsContextType {
  products: Product[];
  addProduct: (newProduct: Omit<Product, 'id'>) => Product;
  deleteProduct: (productId: number) => void;
  updateProduct: (productId: number, updatedProduct: Omit<Product, 'id'>) => void;
  getProductById: (productId: number) => Product | undefined;
}

export const ProductsContext = createContext<ProductsContextType>({
  products: [],
  addProduct: () => ({ id: 0, name: '', price: 0, image: '', category: '', organic: false, rating: 0, vendorId: '', stock: 0 }),
  deleteProduct: () => {},
  updateProduct: () => {},
  getProductById: () => undefined,
});

interface ProductsProviderProps {
  children: ReactNode;
}

export const ProductsProvider = ({ children }: ProductsProviderProps) => {
  const [products, setProducts] = useState<Product[]>([]);

  // Load products from AsyncStorage when the component mounts
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const storedProducts = await AsyncStorage.getItem('products');
        if (storedProducts) {
          setProducts(JSON.parse(storedProducts));
        } else {
          // Initialize with some sample products if none exist
          const initialProducts: Product[] = [
            {
              id: 1,
              name: 'Organic Apples',
              price: 3.99,
              image: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&q=80&w=400',
              category: 'Fruits',
              organic: true,
              rating: 4.5,
              description: 'Fresh organic apples grown without pesticides.',
              vendorId: 'vendor1', // Fresh Farms
              stock: 50,
              sku: 'FRU-001-VEN'
            },
            {
              id: 2,
              name: 'Organic Carrots',
              price: 2.49,
              image: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?auto=format&fit=crop&q=80&w=400',
              category: 'Vegetables',
              organic: true,
              rating: 4.3,
              description: 'Locally grown organic carrots, perfect for salads and cooking.',
              vendorId: 'vendor1', // Fresh Farms
              stock: 40,
              sku: 'VEG-002-VEN'
            },
            {
              id: 3,
              name: 'Fresh Milk',
              price: 3.49,
              image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&q=80&w=400',
              category: 'Dairy',
              organic: false,
              rating: 4.7,
              description: 'Farm fresh milk from grass-fed cows.',
              vendorId: 'vendor2', // Dairy Delight
              stock: 30,
              sku: 'DAI-003-VEN'
            },
            {
              id: 4,
              name: 'Butter',
              price: 4.99,
              image: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?auto=format&fit=crop&q=80&w=400',
              category: 'Dairy',
              organic: true,
              rating: 4.6,
              description: 'Creamy butter made from organic milk.',
              vendorId: 'vendor2', // Dairy Delight
              stock: 25,
              sku: 'DAI-004-VEN'
            },
            {
              id: 5,
              name: 'Sourdough Bread',
              price: 5.99,
              image: 'https://images.unsplash.com/photo-1585478259715-47fc0c821a5b?auto=format&fit=crop&q=80&w=400',
              category: 'Bakery',
              organic: false,
              rating: 4.8,
              description: 'Freshly baked sourdough bread.',
              vendorId: 'vendor3', // Bake House
              stock: 15,
              sku: 'BAK-005-VEN'
            },
            {
              id: 6,
              name: 'Chocolate Croissant',
              price: 2.99,
              image: 'https://images.unsplash.com/photo-1549931319-a545dcf3bc7b?auto=format&fit=crop&q=80&w=400',
              category: 'Bakery',
              organic: false,
              rating: 4.9,
              description: 'Flaky croissant filled with rich chocolate.',
              vendorId: 'vendor3', // Bake House
              stock: 20,
              sku: 'BAK-006-VEN'
            },
          ];
          
          setProducts(initialProducts);
          await AsyncStorage.setItem('products', JSON.stringify(initialProducts));
        }
      } catch (error) {
        console.error('Error loading products from AsyncStorage:', error);
      }
    };

    loadProducts();
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
  const addProduct = (newProduct: Omit<Product, 'id'>) => {
    let addedProduct: Product = { ...newProduct, id: 0 };
    
    setProducts((prevProducts) => {
      const newId = prevProducts.length > 0 
        ? Math.max(...prevProducts.map(p => p.id)) + 1 
        : 1;
      
      // Generate SKU if not provided
      const sku = newProduct.sku || `${newProduct.category.substring(0, 3).toUpperCase()}-${newId}-${newProduct.vendorId.substring(0, 3)}`;
      
      addedProduct = { ...newProduct, id: newId, sku };
      
      return [
        ...prevProducts,
        addedProduct,
      ];
    });
    
    return addedProduct;
  };

  // Function to delete a product
  const deleteProduct = (productId: number) => {
    setProducts((prevProducts) => 
      prevProducts.filter(product => product.id !== productId)
    );
  };

  // Function to update a product
  const updateProduct = (productId: number, updatedProduct: Omit<Product, 'id'>) => {
    setProducts((prevProducts) => 
      prevProducts.map(product => 
        product.id === productId 
          ? { ...updatedProduct, id: productId }
          : product
      )
    );
  };

  // Function to get a product by ID
  const getProductById = (productId: number): Product | undefined => {
    return products.find(product => product.id === productId);
  };

  return (
    <ProductsContext.Provider value={{ 
      products, 
      addProduct, 
      deleteProduct, 
      updateProduct,
      getProductById
    }}>
      {children}
    </ProductsContext.Provider>
  );
};