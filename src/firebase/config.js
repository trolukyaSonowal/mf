import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDxGXqXqXqXqXqXqXqXqXqXqXqXqXqXqXqX",
  authDomain: "greenmart-12345.firebaseapp.com",
  projectId: "greenmart-12345",
  storageBucket: "greenmart-12345.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890",
  measurementId: "G-ABCDEF1234"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Configure reCAPTCHA
if (typeof window !== 'undefined') {
  window.recaptchaVerifier = new window.firebase.auth.RecaptchaVerifier('recaptcha-container', {
    size: 'invisible',
    callback: () => {
      // reCAPTCHA solved
    }
  });
}

export { auth, db }; 