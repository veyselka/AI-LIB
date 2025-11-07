// firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getAuth } from 'firebase/auth';

// Sizin Firebase Konsolu'ndan kopyaladığınız yapılandırma
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

// BASIT ÇÖZÜM: Tüm platformlar için standart getAuth
// Firebase kendi persistence'ını yönetecek (indexedDB web için, memory mobil için)
const auth = getAuth(app);

export { auth };