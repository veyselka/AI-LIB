// firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Firebase yapılandırması
const firebaseConfig = {
  apiKey: "AIzaSyAEy3OYFnPqRiHjRM73O_82ZOJylLTg7rs",
  authDomain: "ai-lib-learning-app.firebaseapp.com",
  projectId: "ai-lib-learning-app",
  storageBucket: "ai-lib-learning-app.firebasestorage.app",
  messagingSenderId: "1035182816895",
  appId: "1:1035182816895:web:d90564723c59ba068ec94a",
  measurementId: "G-0VLGNHW8PR"
};

// Firebase uygulamasını başlat
const app = initializeApp(firebaseConfig);

// Auth'u platforma göre başlat
let auth;
try {
  if (Platform.OS === 'web') {
    auth = getAuth(app);
  } else {
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage)
    });
  }
} catch (error) {
  // Eğer auth zaten başlatılmışsa getAuth kullan
  auth = getAuth(app);
}

export { auth, app };