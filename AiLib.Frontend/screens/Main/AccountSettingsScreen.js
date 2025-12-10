// screens/Main/AccountSettingsScreen.js
import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { COLORS } from '../../constants/Colors';

const AccountSettingsScreen = () => {
    const navigation = useNavigation();

    
    const menuItems = [
        { 
            name: "Edit Profile", 
            icon: "person-outline", 
            action: () => navigation.navigate('EditProfile')
        },
        { 
            name: "Change Password", 
            icon: "lock-closed-outline", 
            action: () => navigation.navigate('ChangePassword')
        },
        { 
            name: "Notification Preferences", 
            icon: "notifications-outline", 
            action: () => navigation.navigate('NotificationPreferences')
        },
        { 
            name: "Connected Accounts", 
            icon: "link-outline", 
            action: () => navigation.navigate('ConnectedAccounts')
        },
    ];

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                
                {/* Menü Başlık yok, direk menü öğeleri geliyor */}
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
        paddingVertical: 10,
    },
    // Menü
    menuContainer: {
        backgroundColor: COLORS.inputBackground,
        borderRadius: 12,
        overflow: 'hidden', 
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
});

export default AccountSettingsScreen;
