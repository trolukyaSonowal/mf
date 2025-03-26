import { Stack, Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { CartProvider } from './CartContext';
import { ProductsProvider } from './ProductsContext';
import { NotificationProvider } from './NotificationContext';
import { ThemeProvider, useTheme } from './ThemeContext';
import { VendorProvider } from './VendorContext';
import { ProfileProvider } from './ProfileContext';

export default function RootLayout() {
  return (
    <ThemeProvider>
      <ProfileProvider>
        <VendorProvider>
          <ProductsProvider>
            <CartProvider>
              <NotificationProvider>
                <Slot />
                <StatusBarWithTheme />
              </NotificationProvider>
            </CartProvider>
          </ProductsProvider>
        </VendorProvider>
      </ProfileProvider>
    </ThemeProvider>
  );
}

// Custom StatusBar component that adapts to the current theme
function StatusBarWithTheme() {
  const { isDarkMode } = useTheme();
  return <StatusBar style={isDarkMode ? "light" : "dark"} />;
}