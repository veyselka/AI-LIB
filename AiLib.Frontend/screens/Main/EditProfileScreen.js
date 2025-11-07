// screens/Main/EditProfileScreen.js
import React, { useState } from 'react';
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
import { updateProfile } from "firebase/auth";
import { auth } from '../../firebaseConfig'; 
import { COLORS } from '../../constants/Colors';

const EditProfileScreen = ({ navigation }) => {
    const user = auth.currentUser;
    // Mevcut kullanıcı bilgilerini varsayılan değer olarak kullan
    const [displayName, setDisplayName] = useState(user?.displayName || '');
    const [photoURL, setPhotoURL] = useState(user?.photoURL || '');
    const [isLoading, setIsLoading] = useState(false);

    const handleUpdateProfile = async () => {
        if (!user) {
            Alert.alert("Hata", "Kullanıcı oturumu bulunamadı. Lütfen tekrar giriş yapın.");
            return;
        }

        setIsLoading(true);

        try {
            await updateProfile(user, {
                displayName: displayName.trim(),
                photoURL: photoURL.trim(),
            });

            Alert.alert("Başarılı", "Profiliniz başarıyla güncellendi!");
            // Başarılı olursa önceki ekrana dön
            navigation.goBack();

        } catch (error) {
            console.error("Profil güncelleme hatası:", error);
            Alert.alert("Hata", "Profil güncellenirken bir hata oluştu: " + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView contentContainerStyle={styles.container}>
                
                <Text style={styles.infoText}>
                    Profil bilgilerinizi güncelleyin. E-posta adresi Firebase tarafından belirlenmiştir ve burada değiştirilemez.
                </Text>

                {/* E-posta (Sadece Görüntüleme) */}
                <Text style={styles.label}>E-posta</Text>
                <TextInput
                    style={[styles.input, styles.disabledInput]}
                    value={user?.email || 'N/A'}
                    editable={false} // Değiştirilemez
                />

                {/* Görünen Ad (Ad Soyad) Input */}
                <Text style={styles.label}>Görünen Ad (Adınız Soyadınız)</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Adınızı ve Soyadınızı Girin"
                    placeholderTextColor={COLORS.textGray}
                    value={displayName}
                    onChangeText={setDisplayName}
                />

                {/* Profil Fotoğrafı URL'si Input */}
                <Text style={styles.label}>Profil Fotoğrafı URL'si (Opsiyonel)</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Resim URL'si (Gravatar/Cloud linki)"
                    placeholderTextColor={COLORS.textGray}
                    value={photoURL}
                    onChangeText={setPhotoURL}
                    autoCapitalize="none"
                />

                {/* Kaydet Butonu */}
                <TouchableOpacity 
                    style={styles.button} 
                    onPress={handleUpdateProfile}
                    disabled={isLoading}
                >
                    <Text style={styles.buttonText}>
                        {isLoading ? "Kaydediliyor..." : "Profili Güncelle"}
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
    disabledInput: {
        opacity: 0.7,
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

export default EditProfileScreen;
