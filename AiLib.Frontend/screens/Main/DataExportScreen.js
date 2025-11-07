// screens/Main/DataExportScreen.js
import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  TouchableOpacity, 
  Alert,
  ScrollView 
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/Colors';

const DataExportScreen = ({ navigation }) => {
    // 6.png'ye göre dışa aktarılacak veri türlerinin durumu
    const [exportDataTypes, setExportDataTypes] = useState({
        documents: true, // Varsayılan olarak seçili
        summaries: false, // Varsayılan olarak seçili değil
        qaData: true, // Varsayılan olarak seçili
    });

    // 6.png'ye göre dışa aktarma formatının durumu
    const [exportFormat, setExportFormat] = useState('PDF'); // Varsayılan: PDF

    // 6.png'ye göre varsayılan indirme geçmişi
    const downloadHistory = [
        { name: "All_Data_Export.pdf", size: "2.1 MB", date: "2024-07-28", type: "pdf" },
        { name: "Summaries.csv", size: "87 KB", date: "2024-07-21", type: "csv" },
    ];

    const toggleDataType = (type) => {
        setExportDataTypes(prev => ({ ...prev, [type]: !prev[type] }));
    };

    const handleExport = () => {
        // Gerçek projede, burada Backend'e (C#) bir API isteği atılır.
        // Backend, seçilen verilere göre dışa aktarmayı hazırlar ve indirme linki döner.
        
        Alert.alert(
            "Dışa Aktarma Başlatıldı",
            `Seçilen Veri: ${Object.keys(exportDataTypes).filter(key => exportDataTypes[key]).join(', ')}\nFormat: ${exportFormat}\n\nBackend sunucusu veriyi hazırlıyor...`
        );
        // İndirme geçmişini güncelleme mantığı buraya gelir.
    };

    // Veri türü seçim bileşeni
    const DataTypeSelection = ({ label, type }) => (
        <TouchableOpacity style={styles.dataItem} onPress={() => toggleDataType(type)}>
            <Ionicons 
                name={exportDataTypes[type] ? "checkbox-outline" : "square-outline"} 
                size={24} 
                color={exportDataTypes[type] ? COLORS.primaryBlue : COLORS.textGray} 
                style={styles.dataIcon}
            />
            <View style={styles.dataTextContainer}>
                <Text style={styles.dataLabel}>{label}</Text>
            </View>
        </TouchableOpacity>
    );

    // İndirme Geçmişi Öğesi
    const HistoryItem = ({ item }) => {
        const iconName = item.type === 'pdf' ? 'document-text-outline' : 'list-circle-outline';
        return (
            <View style={styles.historyItem}>
                <Ionicons name={iconName} size={24} color={COLORS.primaryBlue} style={styles.historyIcon} />
                <View style={styles.historyTextContainer}>
                    <Text style={styles.historyFileName}>{item.name}</Text>
                    <Text style={styles.historyMetaText}>{item.size} - {item.date}</Text>
                </View>
                {/* Menü ikonu (Üç nokta) */}
                <Feather name="more-vertical" size={20} color={COLORS.textGray} />
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView style={styles.container}>
                
                <Text style={styles.sectionTitle}>SELECT DATA TO EXPORT</Text>
                <View style={styles.dataSection}>
                    <DataTypeSelection label="Documents" type="documents" />
                    <DataTypeSelection label="Summaries" type="summaries" />
                    <DataTypeSelection label="Q&A Data" type="qaData" />
                </View>

                <Text style={styles.sectionTitle}>EXPORT FORMAT</Text>
                <View style={styles.formatContainer}>
                    {['PDF', 'CSV', 'JSON'].map((format) => (
                        <TouchableOpacity 
                            key={format}
                            style={[styles.formatButton, exportFormat === format && styles.activeFormatButton]}
                            onPress={() => setExportFormat(format)}
                        >
                            <Text style={styles.formatText}>{format}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <Text style={[styles.sectionTitle, {marginTop: 20}]}>DOWNLOAD HISTORY</Text>
                <View style={styles.historySection}>
                    {downloadHistory.map((item, index) => (
                        <HistoryItem key={index} item={item} />
                    ))}
                </View>

            </ScrollView>

            {/* Sabit Dışa Aktarma Butonu (Bottom Bar) */}
            <View style={styles.bottomBar}>
                <TouchableOpacity style={styles.exportButton} onPress={handleExport}>
                    <Feather name="download" size={20} color={COLORS.white} style={{marginRight: 10}} />
                    <Text style={styles.exportButtonText}>Export Data</Text>
                </TouchableOpacity>
            </View>
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
        paddingHorizontal: 20,
        paddingTop: 20,
    },
    sectionTitle: {
        color: COLORS.textGray,
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    // Data Selection Styles
    dataSection: {
        backgroundColor: COLORS.inputBackground,
        borderRadius: 10,
        marginBottom: 20,
        overflow: 'hidden',
    },
    dataItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
        paddingHorizontal: 15,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.background,
    },
    dataIcon: {
        marginRight: 15,
    },
    dataLabel: {
        color: COLORS.white,
        fontSize: 16,
    },
    // Format Selection Styles
    formatContainer: {
        flexDirection: 'row',
        backgroundColor: COLORS.inputBackground,
        borderRadius: 8,
        overflow: 'hidden',
    },
    formatButton: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
    },
    activeFormatButton: {
        backgroundColor: COLORS.primaryBlue,
    },
    formatText: {
        color: COLORS.white,
        fontWeight: 'bold',
    },
    // History Styles
    historySection: {
        backgroundColor: COLORS.inputBackground,
        borderRadius: 10,
        marginBottom: 100, // Bottom bar için yer açmak için
        overflow: 'hidden',
    },
    historyItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
        paddingHorizontal: 15,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.background,
    },
    historyTextContainer: {
        flex: 1,
        marginLeft: 15,
    },
    historyFileName: {
        color: COLORS.white,
        fontSize: 15,
    },
    historyMetaText: {
        color: COLORS.textGray,
        fontSize: 12,
        marginTop: 2,
    },
    // Bottom Export Button
    bottomBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: COLORS.background, // Sabit zemin rengi
        borderTopWidth: 1,
        borderTopColor: COLORS.inputBackground,
    },
    exportButton: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.primaryBlue,
        paddingVertical: 15,
        borderRadius: 8,
    },
    exportButtonText: {
        color: COLORS.white,
        fontSize: 18,
        fontWeight: 'bold',
    }
});

export default DataExportScreen;
