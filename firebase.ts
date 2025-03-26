import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyDo61mbM56_rRJTZ7Pa0okXXaNF_rYQbyY",
  authDomain: "greenmart-54ff6.firebaseapp.com",
  projectId: "greenmart-54ff6",
  storageBucket: "greenmart-54ff6.appspot.com",
  messagingSenderId: "49694687803",
  appId: "1:49694687803:web:b345a3bc8144138278521e"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);