import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, Moon, Sun, Bell, Lock, HelpCircle, Info } from 'lucide-react-native';
import { useTheme, getThemeColors } from './ThemeContext';

// Define types for settings options
type ToggleOption = {
  icon: any;
  color: string;
  title: string;
  subtitle: string;
  isToggle: true;
  value: boolean;
  onToggle: () => void;
};

type PressOption = {
  icon: any;
  color: string;
  title: string;
  subtitle: string;
  isToggle: false;
  onPress: () => void;
};

type SettingOption = ToggleOption | PressOption;

type SettingSection = {
  title: string;
  options: SettingOption[];
};

export default function SettingsScreen() {
  const { isDarkMode, toggleTheme } = useTheme();
  const colors = getThemeColors(isDarkMode);

  const settingsOptions: SettingSection[] = [
    {
      title: 'Appearance',
      options: [
        {
          icon: isDarkMode ? Sun : Moon,
          color: isDarkMode ? '#FBBF24' : '#6B7280',
          title: 'Dark Mode',
          subtitle: 'Switch between light and dark themes',
          isToggle: true,
          value: isDarkMode,
          onToggle: toggleTheme,
        },
      ],
    },
    {
      title: 'Notifications',
      options: [
        {
          icon: Bell,
          color: '#EF4444',
          title: 'Push Notifications',
          subtitle: 'Receive notifications about orders and promotions',
          isToggle: true,
          value: true,
          onToggle: () => {},
        },
      ],
    },
    {
      title: 'Privacy & Security',
      options: [
        {
          icon: Lock,
          color: '#3B82F6',
          title: 'Privacy Policy',
          subtitle: 'Read our privacy policy',
          isToggle: false,
          onPress: () => {},
        },
      ],
    },
    {
      title: 'Support',
      options: [
        {
          icon: HelpCircle,
          color: '#8B5CF6',
          title: 'Help Center',
          subtitle: 'Get help with your orders and account',
          isToggle: false,
          onPress: () => {},
        },
        {
          icon: Info,
          color: '#059669',
          title: 'About',
          subtitle: 'Learn more about our app',
          isToggle: false,
          onPress: () => {},
        },
      ],
    },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: colors.inputBackground }]}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Settings</Text>
      </View>

      <ScrollView style={styles.content}>
        {settingsOptions.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.secondaryText }]}>
              {section.title}
            </Text>
            <View style={[styles.sectionContent, { backgroundColor: colors.card }]}>
              {section.options.map((option, optionIndex) => (
                <TouchableOpacity
                  key={optionIndex}
                  style={[
                    styles.optionItem,
                    optionIndex < section.options.length - 1 && {
                      borderBottomWidth: 1,
                      borderBottomColor: colors.border,
                    },
                  ]}
                  onPress={option.isToggle ? undefined : option.onPress}
                  disabled={option.isToggle}
                >
                  <View style={styles.optionContent}>
                    <View
                      style={[
                        styles.iconContainer,
                        { backgroundColor: `${option.color}20` },
                      ]}
                    >
                      <option.icon size={20} color={option.color} />
                    </View>
                    <View style={styles.optionTextContainer}>
                      <Text style={[styles.optionTitle, { color: colors.text }]}>
                        {option.title}
                      </Text>
                      <Text
                        style={[styles.optionSubtitle, { color: colors.secondaryText }]}
                      >
                        {option.subtitle}
                      </Text>
                    </View>
                  </View>
                  {option.isToggle && (
                    <Switch
                      value={option.value}
                      onValueChange={option.onToggle}
                      trackColor={{ false: colors.border, true: `${colors.primary}80` }}
                      thumbColor={option.value ? colors.primary : colors.secondaryText}
                    />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}
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
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    paddingHorizontal: 8,
  },
  sectionContent: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  optionSubtitle: {
    fontSize: 14,
  },
}); 