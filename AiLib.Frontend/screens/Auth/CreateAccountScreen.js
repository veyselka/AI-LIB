// screens/Auth/CreateAccountScreen.js

import React, { useState, useContext } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  TouchableOpacity, 
  SafeAreaView, 
  ScrollView,
  Alert 
} from 'react-native';
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';

import { auth } from '../../firebaseConfig'; 
import { COLORS } from '../../constants/Colors';
import { AuthContext } from '../../contexts/AuthContext';

const CreateAccountScreen = () => {
  const navigation = useNavigation();
  const { signIn } = useContext(AuthContext);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const API_URL = 'http://192.168.1.137:5032'; 

  const handleSignUp = async () => {
    if (password !== confirmPassword) {
      Alert.alert("Hata", "Girdiğiniz şifreler eşleşmiyor.");
      return;
    }
    if (fullName === '' || email === '' || password === '') {
      Alert.alert("Hata", "Tüm alanları doldurmanız gerekiyor.");
      return;
    }

    try {
      console.log("Firebase Auth başlatılıyor...", auth);
      console.log("Kayıt denemesi:", email);
      
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      console.log("Firebase kullanıcı oluşturuldu:", user.uid);
      
      await updateProfile(user, { displayName: fullName });
      console.log("Profil güncellendi");

      const idToken = await user.getIdToken();
      console.log("Token alındı");

      await signIn(idToken);

      // Backend'e kayıt
      try {
        const response = await axios.post(`${API_URL}/api/Auth/register`, {
          idToken: idToken,
          fullName: fullName
        });
        console.log("Backend kayıt başarılı:", response.data);
      } catch (backendError) {
        console.warn("Backend kayıt hatası (Firebase başarılı):", backendError.message);
      }

      Alert.alert("Başarılı!", "Hesabınız oluşturuldu!");

    } catch (error) {
      console.error("Firebase Kayıt Hatası:", error);
      console.error("Hata Kodu:", error.code);
      console.error("Hata Mesajı:", error.message);
      
      if (error.code === 'auth/email-already-in-use') {
        Alert.alert("Hata", "Bu e-posta adresi zaten kullanılıyor.");
      } else if (error.code === 'auth/weak-password') {
        Alert.alert("Hata", "Şifre çok zayıf. En az 6 karakter olmalı.");
      } else if (error.code === 'auth/invalid-email') {
        Alert.alert("Hata", "Geçersiz e-posta adresi.");
      } else if (error.code === 'auth/operation-not-allowed') {
        Alert.alert("Firebase Hatası", "Email/Password authentication Firebase Console'da etkinleştirilmemiş. Lütfen Firebase Console > Authentication > Sign-in method bölümünden Email/Password'ü etkinleştirin.");
      } else if (error.response) {
        Alert.alert("Backend Hatası", error.response.data.message);
      } else {
        Alert.alert("Bir Hata Oluştu", `${error.code}: ${error.message}`);
      }
    }
  };

  const handleGoToLogin = () => {
    // Login ekranına yönlendirme
    navigation.navigate('Login');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.title}>Create Your Account</Text>

        <Text style={styles.label}>Full Name</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your full name"
          placeholderTextColor={COLORS.textGray}
          value={fullName}
          onChangeText={setFullName}
        />

        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your email address"
          placeholderTextColor={COLORS.textGray}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          placeholder="Create a password"
          placeholderTextColor={COLORS.textGray}
          value={password}
          onChangeText={setPassword}
          secureTextEntry={true} 
        />

        <Text style={styles.label}>Confirm Password</Text>
        <TextInput
          style={styles.input}
          placeholder="Confirm your password"
          placeholderTextColor={COLORS.textGray}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry={true} 
        />

        <TouchableOpacity style={styles.button} onPress={handleSignUp}>
          <Text style={styles.buttonText}>Create Account</Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <TouchableOpacity onPress={handleGoToLogin}>
            <Text style={styles.loginLink}>Log In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background, 
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.white,
    textAlign: 'center',
    marginBottom: 40,
  },
  label: {
    fontSize: 16,
    color: COLORS.white,
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.inputBackground,
    color: COLORS.white,
    height: 50,
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 20,
    fontSize: 16,
  },
  button: {
    backgroundColor: COLORS.primaryBlue,
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 30,
  },
  footerText: {
    color: COLORS.textGray,
    fontSize: 16,
  },
  loginLink: {
    color: COLORS.primaryBlue,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default CreateAccountScreen;