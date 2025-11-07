// screens/Main/ChangePasswordScreen.js
import React, { useState, useContext } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    SafeAreaView, 
    TouchableOpacity, 
    TextInput, 
    Alert,
    ScrollView 
} from 'react-native';
import { 
    updatePassword, 
    EmailAuthProvider, 
    reauthenticateWithCredential 
} from "firebase/auth";
import { auth } from '../../firebaseConfig'; 
import { COLORS } from '../../constants/Colors';
import { AuthContext } from '../../contexts/AuthContext'; 

const ChangePasswordScreen = ({ navigation }) => {
    const { signOut } = useContext(AuthContext);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const user = auth.currentUser;

    const handleChangePassword = async () => {
        if (newPassword !== confirmNewPassword) {
            Alert.alert("Hata", "Yeni şifreler eşleşmiyor.");
            return;
        }
        if (newPassword.length < 6) {
            Alert.alert("Hata", "Yeni şifre en az 6 karakter olmalıdır.");
            return;
        }
        if (newPassword === currentPassword) {
            Alert.alert("Hata", "Yeni şifreniz, mevcut şifrenizle aynı olamaz.");
            return;
        }

        if (!user) {
            Alert.alert("Hata", "Kullanıcı oturumu bulunamadı. Lütfen tekrar giriş yapın.");
            signOut(); 
            return;
        }
        
        setIsLoading(true);

        try {
            // 1. Kullanıcıyı Yeniden Kimlik Doğrulama (Firebase Güvenlik Gereksinimi)
            const credential = EmailAuthProvider.credential(user.email, currentPassword);
            
            await reauthenticateWithCredential(user, credential);

            // 2. Şifreyi Güncelleme
            await updatePassword(user, newPassword);

            Alert.alert("Başarılı", "Şifreniz başarıyla değiştirildi!");
            navigation.goBack(); 

        } catch (error) {
            console.error("Şifre değiştirme hatası:", error);
            
            let errorMessage = "Şifreniz değiştirilemedi. Lütfen tekrar deneyin.";
            
            if (error.code === 'auth/wrong-password') {
                errorMessage = "Mevcut şifreniz yanlış. Lütfen doğru şifreyi girin.";
            } else if (error.code === 'auth/requires-recent-login') {
                errorMessage = "Güvenlik nedeniyle oturumunuzun süresi doldu. Lütfen tekrar giriş yapıp şifre değiştirmeyi deneyin.";
                signOut();
            }

            Alert.alert("Hata", errorMessage);

        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView contentContainerStyle={styles.container}>
                
                <Text style={styles.infoText}>
                    Şifrenizi değiştirmek için önce mevcut şifrenizi doğrulamanız gerekmektedir.
                </Text>

                {/* Mevcut Şifre Input */}
                <Text style={styles.label}>Mevcut Şifre</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Current Password"
                    placeholderTextColor={COLORS.textGray}
                    value={currentPassword}
                    onChangeText={setCurrentPassword}
                    secureTextEntry={true}
                    autoCapitalize="none"
                />

                {/* Yeni Şifre Input */}
                <Text style={styles.label}>Yeni Şifre (En az 6 karakter)</Text>
                <TextInput
                    style={styles.input}
                    placeholder="New Password"
                    placeholderTextColor={COLORS.textGray}
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry={true}
                    autoCapitalize="none"
                />

                {/* Yeni Şifre Tekrar Input */}
                <Text style={styles.label}>Yeni Şifreyi Doğrula</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Confirm New Password"
                    placeholderTextColor={COLORS.textGray}
                    value={confirmNewPassword}
                    onChangeText={setConfirmNewPassword}
                    secureTextEntry={true}
                    autoCapitalize="none"
                />

                {/* Şifre Değiştirme Butonu */}
                <TouchableOpacity 
                    style={styles.button} 
                    onPress={handleChangePassword}
                    disabled={isLoading}
                >
                    <Text style={styles.buttonText}>
                        {isLoading ? "Değiştiriliyor..." : "Şifreyi Değiştir"}
                    </Text>
                </TouchableOpacity>

            </ScrollView>
        </SafeAreaView>
    );
};


// Stiller
const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    container: {
        flexGrow: 1,
        paddingHorizontal: 20,
        paddingVertical: 20,
    },
    infoText: {
        color: COLORS.textGray,
        fontSize: 14,
        marginBottom: 25,
        textAlign: 'center',
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
});

export default ChangePasswordScreen;
