import React, { createContext, useState, useContext, ReactNode } from 'react';
import { router } from 'expo-router';

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
}

// Define the CartItem interface
interface CartItem extends Product {
  quantity: number;
}

// Define the CartContext interface
interface CartContextType {
  cartItems: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: number) => void;
  updateQuantity: (productId: number, newQuantity: number) => void;
  clearCart: () => void;
  getTotalPrice: () => number;
  getTotalItems: () => number;
}

export const CartContext = createContext<CartContextType>({
  cartItems: [],
  addToCart: () => {},
  removeFromCart: () => {},
  updateQuantity: () => {},
  clearCart: () => {},
  getTotalPrice: () => 0,
  getTotalItems: () => 0,
});

interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider = ({ children }: CartProviderProps) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  // Add a product to the cart
  const addToCart = (product: Product) => {
    // Check if the user is logged in
    if (!global.isLoggedIn) {
      // Redirect to the login page if the user is not logged in
      router.replace('/login');
      return; // Exit the function to prevent adding to cart
    }

    // If the user is logged in, proceed to add the product to the cart
    setCartItems((prevItems) => {
      const existingItem = prevItems.find((item) => item.id === product.id);
      if (existingItem) {
        return prevItems.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 } // Increase quantity if item exists
            : item
        );
      }
      return [...prevItems, { ...product, quantity: 1 }]; // Add new item with quantity 1
    });
  };

  // Remove a product from the cart
  const removeFromCart = (productId: number) => {
    setCartItems((prevItems) =>
      prevItems.filter((item) => item.id !== productId) // Filter out the item to remove
    );
  };

  // Update the quantity of a product in the cart
  const updateQuantity = (productId: number, newQuantity: number) => {
    setCartItems((prevItems) =>
      prevItems.map((item) =>
        item.id === productId
          ? { ...item, quantity: newQuantity } // Update quantity for the specific item
          : item
      )
    );
  };

  // Clear the entire cart
  const clearCart = () => {
    setCartItems([]); // Reset cart to an empty array
  };

  // Calculate the total price of items in the cart
  const getTotalPrice = () => {
    return cartItems.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );
  };

  // Calculate the total number of items in the cart
  const getTotalItems = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getTotalPrice,
        getTotalItems,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

// Custom hook to use the CartContext
export const useCart = () => useContext(CartContext);