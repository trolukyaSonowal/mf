import React, { useState, useContext, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Mail, Lock, Loader as Loader2, ShoppingBasket, Phone } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth, db } from './firebaseConfig';
import { 
  signInWithPhoneNumber, 
  ConfirmationResult, 
  RecaptchaVerifier,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  PhoneAuthProvider,
  signInWithCredential 
} from 'firebase/auth';
import { VendorContext } from './VendorContext';
import { FirebaseRecaptchaVerifierModal } from 'expo-firebase-recaptcha';
import { getApp } from 'firebase/app';
import { useProfile } from './ProfileContext';

declare global {
  var isLoggedIn: boolean;
  var isAdmin: boolean;
  var isVendor: boolean;
  var vendorId: string | null;
  
  interface Window {
    recaptchaVerifier: RecaptchaVerifier;
  }
}

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loginMethod, setLoginMethod] = useState<'email' | 'phone'>('email');
  const [otpSent, setOtpSent] = useState(false);
  const [loginAs, setLoginAs] = useState<'user' | 'vendor'>('user');
  const [phoneLoginError, setPhoneLoginError] = useState('');

  const { vendors } = useContext(VendorContext);
  const { updateProfile } = useProfile();
  const recaptchaVerifierRef = React.useRef(null);
  const firebaseApp = getApp();
  
  // Initialize recaptcha when component mounts (for web-based authentication)
  useEffect(() => {
    if (typeof window !== 'undefined' && Platform.OS === 'web') {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        'size': 'invisible',
        'callback': () => {
          // reCAPTCHA solved, allow signInWithPhoneNumber.
          console.log('Recaptcha verified');
        },
        'expired-callback': () => {
          // Response expired. Ask user to solve reCAPTCHA again.
          console.log('Recaptcha expired');
        }
      });
    }
  }, []);

  const handleEmailLogin = async () => {
    setLoading(true);
    try {
      if (email === 'admin@example.com' && password === 'admin123') {
        // Admin login
        const userId = 'admin-' + Date.now().toString();
        
        // Update profile context
        await updateProfile({
          userId,
          email,
          isLoggedIn: true,
          isAdmin: true,
          isVendor: false
        });
        
        // Also update global variables for backwards compatibility
        global.isLoggedIn = true;
        global.isAdmin = true;
        global.isVendor = false;
        global.vendorId = null;
        
        router.replace('/admin');
      } else if (loginAs === 'vendor') {
        // First authenticate with Firebase
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        
        // Check if this is a vendor and if they are verified
        const vendor = vendors.find(v => v.email === email);
        console.log('Vendor login: Found vendor?', !!vendor);
        
        if (!vendor) {
          Alert.alert('Not Found', 'Vendor not found with this email');
          setLoading(false);
          return;
        }
        
        if (!vendor.isVerified) {
          Alert.alert('Pending Approval', 'Your vendor account is pending approval from admin. You can login as a user until then.');
          setLoading(false);
          return;
        }
        
        console.log('Vendor login: Logging in as verified vendor', vendor.name);
        
        // Update profile context
        await updateProfile({
          userId: userCredential.user.uid,
          email,
          name: vendor.name,
          isLoggedIn: true,
          isAdmin: false,
          isVendor: true,
          vendorId: vendor.id
        });
        
        // Also update global variables for backwards compatibility
        global.isLoggedIn = true;
        global.isAdmin = false;
        global.isVendor = true;
        global.vendorId = vendor.id;
        
        // Save the full vendor object to AsyncStorage for direct access
        await AsyncStorage.setItem('currentVendor', JSON.stringify(vendor));
        
        router.replace('/vendor/dashboard');
      } else {
        // Regular user login with Firebase
        try {
          const userCredential = await signInWithEmailAndPassword(auth, email, password);
          
          // Update profile context
          await updateProfile({
            userId: userCredential.user.uid,
            email,
            name: userCredential.user.displayName || undefined,
            isLoggedIn: true,
            isAdmin: false,
            isVendor: false
          });
          
          // Also update global variables for backwards compatibility
          global.isLoggedIn = true;
          global.isAdmin = false;
          global.isVendor = false;
          global.vendorId = null;
          
          router.replace('/(tabs)');
        } catch (error: any) {
          // Special case for demo credentials
          if (email === 'user@example.com' && password === 'password') {
            // Generate a consistent demo user ID
            const demoUserId = 'demo-user-123456';
            
            // Update profile context
            await updateProfile({
              userId: demoUserId,
              email,
              name: 'Demo User',
              isLoggedIn: true,
              isAdmin: false,
              isVendor: false
            });
            
            // Also update global variables for backwards compatibility
            global.isLoggedIn = true;
            global.isAdmin = false;
            global.isVendor = false;
            global.vendorId = null;
            
            router.replace('/(tabs)');
          } else {
            console.error('Firebase login error:', error);
            Alert.alert('Login Error', error.message || 'Invalid credentials');
          }
        }
      }
    } catch (error: any) {
      console.error('Login error:', error);
      Alert.alert('Login Error', error.message || 'An error occurred during login');
    }
    setLoading(false);
  };

  const handlePhoneLogin = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      setPhoneLoginError('Please enter a valid phone number');
      return;
    }
    
    setLoading(true);
    setPhoneLoginError('');
    
    try {
      // Format phone number with India country code
      const formattedPhone = `+91${phoneNumber.trim()}`;
      console.log('Sending OTP to:', formattedPhone);
      
      if (Platform.OS === 'web') {
        // Use the web recaptchaVerifier instance
        const confirmation = await signInWithPhoneNumber(
          auth, 
          formattedPhone, 
          window.recaptchaVerifier
        );
        
        setConfirmationResult(confirmation);
        setOtpSent(true);
        Alert.alert('Success', 'OTP sent successfully! Please check your phone.');
      } else {
        // For mobile platforms, use the expo-firebase-recaptcha
        if (!recaptchaVerifierRef.current) {
          setPhoneLoginError('reCAPTCHA Verifier is not initialized. Please try again.');
          setLoading(false);
          return;
        }
        
        const phoneProvider = new PhoneAuthProvider(auth);
        const verificationId = await phoneProvider.verifyPhoneNumber(
          formattedPhone,
          recaptchaVerifierRef.current
        );
        
        setVerificationId(verificationId);
        setOtpSent(true);
        Alert.alert('Success', 'OTP sent successfully! Please check your phone.');
      }
    } catch (error: any) {
      console.error('Error sending OTP:', error);
      setPhoneLoginError(`Error: ${error.message || 'Failed to send OTP'}`);
    }
    setLoading(false);
  };

  const verifyOtp = async () => {
    if (!otp || otp.length < 4) {
      setPhoneLoginError('Please enter a valid OTP');
      return;
    }
    
    setLoading(true);
    setPhoneLoginError('');
    
    try {
      let userCredential;
      
      if (Platform.OS === 'web') {
        if (!confirmationResult) {
          throw new Error('Confirmation result is missing. Please request OTP again.');
        }
        
        // Verify OTP with Firebase for web
        userCredential = await confirmationResult.confirm(otp);
      } else {
        if (!verificationId) {
          throw new Error('Verification ID is missing. Please request OTP again.');
        }
        
        // Verify OTP with Firebase for mobile
        const credential = PhoneAuthProvider.credential(verificationId, otp);
        userCredential = await signInWithCredential(auth, credential);
      }
      
      // Get user's phone number from credential
      const userPhoneNumber = userCredential.user.phoneNumber?.substring(3); // Remove +91
      const userId = userCredential.user.uid;
      
      // Continue with the existing logic for vendor/user verification
      if (loginAs === 'vendor') {
        // Check if this is a verified vendor
        const vendor = vendors.find(v => v.phone === userPhoneNumber);
        
        if (!vendor) {
          Alert.alert('Not Found', 'No vendor account found with this phone number. Please register first.');
          router.push('/register');
          setLoading(false);
          return;
        }
        
        if (!vendor.isVerified) {
          Alert.alert('Pending Approval', 'Your vendor account is pending approval from admin. You will be logged in as a user.');
          
          // Update profile context
          await updateProfile({
            userId,
            phone: userPhoneNumber,
            isLoggedIn: true,
            isAdmin: false,
            isVendor: false
          });
          
          // Also update global variables for backwards compatibility
          global.isLoggedIn = true;
          global.isAdmin = false;
          global.isVendor = false;
          global.vendorId = null;
          
          router.replace('/(tabs)');
        } else {
          // Login as verified vendor
          console.log('Phone login: Logging in as verified vendor', vendor.name);
          
          // Update profile context
          await updateProfile({
            userId,
            phone: userPhoneNumber,
            name: vendor.name,
            isLoggedIn: true,
            isAdmin: false,
            isVendor: true,
            vendorId: vendor.id
          });
          
          // Also update global variables for backwards compatibility
          global.isLoggedIn = true;
          global.isAdmin = false;
          global.isVendor = true;
          global.vendorId = vendor.id;
          
          // Save the full vendor object to AsyncStorage for direct access
          await AsyncStorage.setItem('currentVendor', JSON.stringify(vendor));
          
          router.replace('/vendor/dashboard');
        }
      } else {
        // Login as regular user
        // Update profile context
        await updateProfile({
          userId,
          phone: userPhoneNumber,
          isLoggedIn: true,
          isAdmin: false,
          isVendor: false
        });
        
        // Also update global variables for backwards compatibility
        global.isLoggedIn = true;
        global.isAdmin = false;
        global.isVendor = false;
        global.vendorId = null;
        
        router.replace('/(tabs)');
      }
    } catch (error: any) {
      console.error('Error verifying OTP:', error);
      setPhoneLoginError(`Error: ${error.message || 'Failed to verify OTP'}`);
    }
    setLoading(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Firebase Recaptcha for mobile platforms */}
      {Platform.OS !== 'web' && (
        <FirebaseRecaptchaVerifierModal
          ref={recaptchaVerifierRef}
          firebaseConfig={firebaseApp.options}
          attemptInvisibleVerification={true}
        />
      )}
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <View style={styles.header}>
            <ShoppingBasket size={48} color="#059669" />
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Sign in to continue</Text>
          </View>

          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[
                styles.tabButton,
                loginAs === 'user' && styles.activeTabButton
              ]}
              onPress={() => setLoginAs('user')}
            >
              <Text 
                style={[
                  styles.tabButtonText,
                  loginAs === 'user' && styles.activeTabButtonText
                ]}
              >
                User
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.tabButton,
                loginAs === 'vendor' && styles.activeTabButton
              ]}
              onPress={() => setLoginAs('vendor')}
            >
              <Text 
                style={[
                  styles.tabButtonText,
                  loginAs === 'vendor' && styles.activeTabButtonText
                ]}
              >
                Vendor
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.form}>
            {loginMethod === 'email' ? (
              <>
                <View style={styles.inputContainer}>
                  <Mail size={20} color="#6B7280" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Email"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    placeholderTextColor="#6B7280"
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Lock size={20} color="#6B7280" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Password"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    placeholderTextColor="#6B7280"
                  />
                </View>

                <TouchableOpacity
                  style={[styles.loginButton, loading && styles.loginButtonDisabled]}
                  onPress={handleEmailLogin}
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 size={24} color="#FFFFFF" />
                  ) : (
                    <Text style={styles.loginButtonText}>
                      Sign In as {loginAs === 'user' ? 'User' : 'Vendor'}
                    </Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.switchMethod}
                  onPress={() => setLoginMethod('phone')}
                >
                  <Text style={styles.switchMethodText}>Use Phone Number</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <View style={styles.inputContainer}>
                  <Phone size={20} color="#6B7280" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Phone Number (10 digits)"
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                    keyboardType="phone-pad"
                    placeholderTextColor="#6B7280"
                    maxLength={10}
                    editable={!otpSent}
                  />
                </View>

                {otpSent && (
                  <View style={styles.inputContainer}>
                    <Lock size={20} color="#6B7280" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="OTP"
                      value={otp}
                      onChangeText={setOtp}
                      keyboardType="number-pad"
                      placeholderTextColor="#6B7280"
                      maxLength={6}
                    />
                  </View>
                )}
                
                {phoneLoginError ? (
                  <Text style={styles.errorText}>{phoneLoginError}</Text>
                ) : null}
                
                <TouchableOpacity
                  style={[styles.loginButton, loading && styles.loginButtonDisabled]}
                  onPress={otpSent ? verifyOtp : handlePhoneLogin}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.loginButtonText}>
                      {otpSent ? 'Verify OTP' : 'Send OTP'}
                    </Text>
                  )}
                </TouchableOpacity>
                
                {otpSent && (
                  <TouchableOpacity
                    style={styles.resendButton}
                    onPress={handlePhoneLogin}
                    disabled={loading}
                  >
                    <Text style={styles.resendButtonText}>Resend OTP</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={styles.switchMethod}
                  onPress={() => {
                    setLoginMethod('email');
                    setOtpSent(false);
                    setPhoneLoginError('');
                  }}
                >
                  <Text style={styles.switchMethodText}>Use Email</Text>
                </TouchableOpacity>
              </>
            )}
            
            <View style={styles.registerContainer}>
              <Text style={styles.registerText}>Don't have an account?</Text>
              <TouchableOpacity onPress={() => router.push('/register')}>
                <Text style={styles.registerLink}>Register</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.credentialsContainer}>
            <Text style={styles.credentialsTitle}>Demo Credentials:</Text>
            <View style={styles.credentialsBox}>
              <Text style={styles.credentialsSubtitle}>User Account:</Text>
              <Text style={styles.credentials}>Email: user@example.com</Text>
              <Text style={styles.credentials}>Password: password</Text>
            </View>
            <View style={styles.credentialsBox}>
              <Text style={styles.credentialsSubtitle}>Vendor Accounts:</Text>
              <Text style={styles.credentials}>Email: vendor1@vendor.com (Fresh Farms)</Text>
              <Text style={styles.credentials}>Email: vendor2@vendor.com (Dairy Delight)</Text>
              <Text style={styles.credentials}>Email: vendor3@vendor.com (Bake House)</Text>
              <Text style={styles.credentials}>Password: vendor123</Text>
            </View>
            <View style={styles.credentialsBox}>
              <Text style={styles.credentialsSubtitle}>Admin Account:</Text>
              <Text style={styles.credentials}>Email: admin@example.com</Text>
              <Text style={styles.credentials}>Password: admin123</Text>
            </View>
          </View>

          {/* Recaptcha container required for Firebase phone auth on web */}
          {Platform.OS === 'web' && (
            <View id="recaptcha-container" style={styles.recaptchaContainer} />
          )}
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
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 24,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTabButton: {
    backgroundColor: '#059669',
  },
  tabButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  activeTabButtonText: {
    color: '#FFFFFF',
  },
  form: {
    gap: 16,
    marginBottom: 32,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: 16,
    color: '#1F2937',
  },
  loginButton: {
    backgroundColor: '#059669',
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  credentialsContainer: {
    backgroundColor: '#F3F4F6',
    padding: 16,
    borderRadius: 12,
  },
  credentialsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  credentialsBox: {
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  credentialsSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#059669',
    marginBottom: 4,
  },
  credentials: {
    fontSize: 14,
    color: '#4B5563',
  },
  switchMethod: {
    marginTop: 4,
    alignItems: 'center',
  },
  switchMethodText: {
    color: '#059669',
    fontWeight: '600',
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
  },
  registerText: {
    fontSize: 14,
    color: '#6B7280',
  },
  registerLink: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '600',
    marginLeft: 8,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    marginBottom: 8,
  },
  resendButton: {
    alignItems: 'center',
    marginTop: 8,
  },
  resendButtonText: {
    color: '#3B82F6',
    fontSize: 14,
  },
  recaptchaContainer: {
    position: 'absolute',
    width: 0,
    height: 0,
    opacity: 0,
  },
});