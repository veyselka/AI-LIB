// AiLib.Frontend/App.js

import React, { useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// --- RENK SABİTLERİ (COLORS.js'den geldiğini varsayıyorum) ---
const COLORS = {
  background: '#121212',
  inputBackground: '#1E1E1E',
  white: '#FFFFFF',
  primaryBlue: '#0A84FF',
  textGray: '#8A8A8A'
};

// --- AUTH CONTEXT ---
import { AuthProvider, AuthContext } from './contexts/AuthContext';

// --- EKRAN İMPORTLARI ---
import LoginScreen from './screens/Auth/LoginScreen';
import SignupScreen from './screens/Auth/CreateAccountScreen';
import HomeScreen from './screens/Main/HomeScreen';
import ProfileScreen from './screens/Main/ProfileScreen';
import AnalysisScreen from './screens/Main/AnalysisScreen';
import AccountSettingsScreen from './screens/Main/AccountSettingsScreen';
import PrivacySettingsScreen from './screens/Main/PrivacySettingsScreen';
// Account Settings Alt Ekranları
import EditProfileScreen from './screens/Main/EditProfileScreen';
import ChangePasswordScreen from './screens/Main/ChangePasswordScreen';
import NotificationPreferencesScreen from './screens/Main/NotificationPreferencesScreen';
import ConnectedAccountsScreen from './screens/Main/ConnectedAccountsScreen';
// Privacy Settings Alt Ekranları
import DataExportScreen from './screens/Main/DataExportScreen';


// --- NAVIGATOR TANIMLAMALARI ---
const AuthStack = createNativeStackNavigator();
const MainStack = createNativeStackNavigator();

// 1. Yetkilendirme (Auth) Yığını: Login ve Signup
const AuthNavigator = () => (
  <AuthStack.Navigator
    screenOptions={{
      headerShown: false,
      contentStyle: { backgroundColor: COLORS.background }
    }}
  >
    <AuthStack.Screen name="Login" component={LoginScreen} />
    <AuthStack.Screen name="CreateAccount" component={SignupScreen} />
  </AuthStack.Navigator>
);

// 2. Ana (Main) Yığın: Home, Analysis ve Profile
const MainNavigator = () => (
  <MainStack.Navigator
    screenOptions={{
      headerStyle: {
        backgroundColor: COLORS.background,
      },
      headerTintColor: COLORS.white,
      headerTitleStyle: {
        fontWeight: 'bold',
      },
      contentStyle: { backgroundColor: COLORS.background }
    }}
  >
    <MainStack.Screen name="Home" component={HomeScreen} options={{ title: "AI-Lib" }} />
    
    {/* YENİ: AnalysisScreen Eklendi */}
    <MainStack.Screen 
        name="Analysis" 
        component={AnalysisScreen} 
        // Doküman adını başlık olarak ayarlar
        options={({ route }) => ({ title: route.params.docTitle || "Doküman Analizi" })} 
    /> 

    <MainStack.Screen name="Profile" component={ProfileScreen} options={{ title: "Profile" }} />

    {/* Ayarlar Ekranları */}
    <MainStack.Screen name="AccountSettings" component={AccountSettingsScreen} options={{ title: "Account Settings" }} />
    <MainStack.Screen name="PrivacySettings" component={PrivacySettingsScreen} options={{ title: "Privacy Settings" }} />

    {/* Account Settings Alt Ekranları */}
    <MainStack.Screen name="EditProfile" component={EditProfileScreen} options={{ title: "Edit Profile" }} />
    <MainStack.Screen name="ChangePassword" component={ChangePasswordScreen} options={{ title: "Change Password" }} />
    <MainStack.Screen name="NotificationPreferences" component={NotificationPreferencesScreen} options={{ title: "Notifications" }} />
    <MainStack.Screen name="ConnectedAccounts" component={ConnectedAccountsScreen} options={{ title: "Connected Accounts" }} />

    {/* Privacy Settings Alt Ekranları */}
    <MainStack.Screen name="DataExport" component={DataExportScreen} options={{ title: "Data Export" }} />

  </MainStack.Navigator>
);

// --- ANA UYGULAMA BİLEŞENİ ---
export default function App() {
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}

// Token durumuna göre yönlendirme yapan ana bileşen
const RootNavigator = () => {
  const { userToken } = useContext(AuthContext);
  
  return (
    <NavigationContainer>
      {/* Eğer token varsa MainNavigator'ı, yoksa AuthNavigator'ı göster */}
      {userToken ? <MainNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
};