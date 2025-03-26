import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, ViewProps } from 'react-native';

type ThemeType = 'light' | 'dark';

interface ThemeContextType {
  theme: ThemeType;
  isDarkMode: boolean;
  toggleTheme: () => Promise<void>;
}

export const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  isDarkMode: false,
  toggleTheme: async () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<ThemeType>('light');

  // Load theme from AsyncStorage on mount
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('theme');
        if (savedTheme === 'dark' || savedTheme === 'light') {
          setTheme(savedTheme);
        }
      } catch (error) {
        console.error('Error loading theme:', error);
      }
    };
    
    loadTheme();
  }, []);

  // Toggle between light and dark themes
  const toggleTheme = async () => {
    try {
      const newTheme = theme === 'light' ? 'dark' : 'light';
      setTheme(newTheme);
      await AsyncStorage.setItem('theme', newTheme);
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        isDarkMode: theme === 'dark',
        toggleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook to use the theme context
export const useTheme = () => useContext(ThemeContext);

// Theme colors for light and dark modes
export const lightTheme = {
  background: '#F9FAFB',
  card: '#FFFFFF',
  text: '#1F2937',
  secondaryText: '#6B7280',
  border: '#E5E7EB',
  primary: '#059669',
  secondary: '#3B82F6',
  accent: '#8B5CF6',
  error: '#EF4444',
  success: '#10B981',
  warning: '#F59E0B',
  info: '#60A5FA',
  icon: '#6B7280',
  inputBackground: '#F3F4F6',
};

export const darkTheme = {
  background: '#111827',
  card: '#1F2937',
  text: '#F9FAFB',
  secondaryText: '#9CA3AF',
  border: '#374151',
  primary: '#10B981',
  secondary: '#60A5FA',
  accent: '#A78BFA',
  error: '#F87171',
  success: '#34D399',
  warning: '#FBBF24',
  info: '#93C5FD',
  icon: '#9CA3AF',
  inputBackground: '#374151',
};

// Function to get the current theme colors
export const getThemeColors = (isDarkMode: boolean) => {
  return isDarkMode ? darkTheme : lightTheme;
};

// Themed View component for easy theming
interface ThemedViewProps extends ViewProps {
  backgroundColor?: 'background' | 'card' | 'inputBackground';
}

export const ThemedView: React.FC<ThemedViewProps> = ({ 
  children, 
  backgroundColor = 'background',
  style,
  ...props 
}) => {
  const { isDarkMode } = useTheme();
  const colors = getThemeColors(isDarkMode);
  
  return (
    <View 
      style={[
        { backgroundColor: colors[backgroundColor] },
        style
      ]}
      {...props}
    >
      {children}
    </View>
  );
}; 