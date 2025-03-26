// Import the functions from the Firebase SDKs
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDo61mbM56_rRJTZ7Pa0okXXaNF_rYQbyY",
  authDomain: "greenmart-54ff6.firebaseapp.com",
  projectId: "greenmart-54ff6",
  storageBucket: "greenmart-54ff6.appspot.com",
  messagingSenderId: "49694687803",
  appId: "1:49694687803:android:d405a952e26410f878521e"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication
const auth = getAuth(app);

// Initialize Firestore
const db = getFirestore(app);

export { auth, db }; 