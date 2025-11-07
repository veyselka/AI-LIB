// screens/Main/ProfileScreen.js
import React, { useContext } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Alert } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { auth } from '../../firebaseConfig';
import { COLORS } from '../../constants/Colors';
import { AuthContext } from '../../contexts/AuthContext';

const ProfileScreen = () => {
    const navigation = useNavigation();
    const { signOut } = useContext(AuthContext);

    const user = auth.currentUser;
    const userName = user?.displayName || "Alex Johnson";
    const userEmail = user?.email || "alex.johnson@university.edu";

    const menuItems = [
        { 
            name: "Account Settings", 
            icon: "person-outline", 
            action: () => navigation.navigate('AccountSettings')
        },
        { 
            name: "Privacy Settings", 
            icon: "shield-checkmark-outline", 
            action: () => navigation.navigate('PrivacySettings')
        },
        { 
            name: "Help & Support", 
            icon: "help-circle-outline", 
            action: () => Alert.alert("Destek", "Destek sayfasına yönlendiriliyor.")
        },
    ];

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                
                {/* Profil Başlık ve Avatar */}
                <View style={styles.profileHeader}>
                    <View style={styles.avatarContainer}>
                        <Ionicons name="person" size={50} color={COLORS.white} />
                    </View>
                    <Text style={styles.userName}>{userName}</Text>
                    <Text style={styles.userEmail}>{userEmail}</Text>
                </View>

                {/* Ayarlar Menüsü */}
                <View style={styles.menuContainer}>
                    {menuItems.map((item, index) => (
                        <TouchableOpacity 
                            key={index} 
                            style={styles.menuItem} 
                            onPress={item.action}
                        >
                            <Ionicons name={item.icon} size={24} color={COLORS.primaryBlue} style={styles.menuIcon} />
                            <Text style={styles.menuText}>{item.name}</Text>
                            <Feather name="chevron-right" size={20} color={COLORS.textGray} />
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Log Out Butonu */}
                <TouchableOpacity style={styles.logoutButton} onPress={signOut}>
                    <Feather name="log-out" size={20} color={COLORS.dangerRed} />
                    <Text style={styles.logoutText}>Log Out</Text>
                </TouchableOpacity>

            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    container: {
        flex: 1,
        paddingHorizontal: 20,
    },
    profileHeader: {
        alignItems: 'center',
        paddingVertical: 30,
        marginBottom: 20,
    },
    avatarContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: COLORS.inputBackground,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    userName: {
        color: COLORS.white,
        fontSize: 22,
        fontWeight: 'bold',
    },
    userEmail: {
        color: COLORS.textGray,
        fontSize: 14,
    },
    menuContainer: {
        backgroundColor: COLORS.inputBackground,
        borderRadius: 12,
        marginBottom: 20,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
        paddingHorizontal: 15,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.background,
    },
    menuIcon: {
        marginRight: 15,
    },
    menuText: {
        flex: 1,
        color: COLORS.white,
        fontSize: 16,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.inputBackground,
        paddingVertical: 15,
        borderRadius: 8,
        marginTop: 20,
    },
    logoutText: {
        color: COLORS.dangerRed,
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 10,
    }
});

export default ProfileScreen;