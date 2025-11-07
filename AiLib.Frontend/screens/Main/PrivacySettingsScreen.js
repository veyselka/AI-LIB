// screens/Main/PrivacySettingsScreen.js
import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Alert, Switch } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { COLORS } from '../../constants/Colors';

const PrivacySettingsScreen = () => {
    const navigation = useNavigation();
    const [isSharingData, setIsSharingData] = useState(false);

    // Menü öğeleri (5.png'ye göre)
    const menuItems = [
        { 
            name: "Share Anonymized Data", 
            icon: "share-social-outline", 
            subtitle: "Help improve AI-Lib for everyone",
            isSwitch: true,
            value: isSharingData,
            onToggle: setIsSharingData,
        },
        { 
            name: "Data Export", 
            icon: "download-outline", 
            action: () => navigation.navigate('DataExport')
        },
        { 
            name: "Delete Account", 
            icon: "close-circle-outline", 
            isRed: true,
            action: () => Alert.alert("Hesabı Sil", "Hesabınızı silmek istediğinize emin misiniz? Bu işlem geri alınamaz.") 
        },
    ];

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                
                <View style={styles.menuContainer}>
                    {menuItems.map((item, index) => (
                        <TouchableOpacity 
                            key={index} 
                            style={styles.menuItem} 
                            onPress={item.isSwitch ? () => item.onToggle(!item.value) : item.action}
                            activeOpacity={item.isSwitch ? 1.0 : 0.2} // Switch'te tıklama animasyonunu kapat
                        >
                            <Ionicons 
                                name={item.icon} 
                                size={24} 
                                color={item.isRed ? COLORS.dangerRed : COLORS.primaryBlue} 
                                style={styles.menuIcon} 
                            />
                            
                            <View style={styles.textColumn}>
                                <Text style={[styles.menuText, item.isRed && {color: COLORS.dangerRed}]}>{item.name}</Text>
                                {item.subtitle && <Text style={styles.subtitleText}>{item.subtitle}</Text>}
                            </View>

                            {item.isSwitch ? (
                                <Switch
                                    onValueChange={item.onToggle}
                                    value={item.value}
                                    trackColor={{ false: COLORS.textGray, true: COLORS.successGreen }}
                                    thumbColor={COLORS.white}
                                    style={styles.switchControl}
                                />
                            ) : (
                                <Feather name="chevron-right" size={20} color={item.isRed ? COLORS.dangerRed : COLORS.textGray} />
                            )}
                        </TouchableOpacity>
                    ))}
                </View>
                
                <TouchableOpacity onPress={() => Alert.alert("Gizlilik Politikası", "Tarayıcıda Gizlilik Politikası açılacak.")}>
                    <Text style={styles.privacyLink}>View Privacy Policy</Text>
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
        paddingVertical: 10,
    },
    // Menü
    menuContainer: {
        backgroundColor: COLORS.inputBackground,
        borderRadius: 12,
        overflow: 'hidden', 
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
    textColumn: {
        flex: 1,
        marginRight: 10,
    },
    menuText: {
        color: COLORS.white,
        fontSize: 16,
    },
    subtitleText: {
        color: COLORS.textGray,
        fontSize: 12,
        marginTop: 2,
    },
    switchControl: {
        // Switch'i sağa hizalamak için boş bırakılabilir
    },
    privacyLink: {
        color: COLORS.primaryBlue,
        textAlign: 'center',
        marginTop: 20,
        fontSize: 14,
    }
});

export default PrivacySettingsScreen;
