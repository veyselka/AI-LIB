// screens/Main/HomeScreen.js
import React, { useState, useEffect, useContext } from 'react'; 
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView,
  TouchableOpacity,
  FlatList,
  Alert,
  Platform
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';

// Kendi import'larımız
import { auth } from '../../firebaseConfig'; 
import { COLORS } from '../../constants/Colors'; 
import { AuthContext } from '../../contexts/AuthContext';

// Dummy veriler (Backend'den veri çekilene kadar gösterilir)
const DUMMY_DOCUMENTS = [
  { id: '1', fileName: 'Quantum Physics Principles', type: 'PDF', status: 'Ready', sizeBytes: 5452595 },
  { id: '2', fileName: 'Machine Learning Thesis', type: 'DOCX', status: 'Processing', sizeBytes: 125890 },
  { id: '3', fileName: 'History of Ancient Rome', type: 'PPT', status: 'Ready', sizeBytes: 8589000 },
];

// Tek bir doküman öğesinin arayüzü
const DocumentItem = ({ item }) => {
  const navigation = useNavigation();
  
  // Duruma göre renk ve ikon ayarla
  let statusColor = COLORS.successGreen;
  let iconName = 'document-text';
  let iconColor = COLORS.dangerRed; 

  if (item.status === 'Processing') {
    statusColor = COLORS.processingYellow;
    iconName = 'time-outline';
    iconColor = COLORS.processingYellow;
  } else if (item.status === 'Ready' || item.status === 'COMPLETED') {
    statusColor = COLORS.successGreen;
  }
  
  if (item.type === 'PDF') {
    iconName = 'document-text';
    iconColor = COLORS.dangerRed; 
  } else if (item.type === 'PPT') {
    iconName = 'play-circle';
    iconColor = COLORS.primaryBlue; 
  } else if (item.type === 'DOCX') {
    iconName = 'document';
    iconColor = COLORS.textGray; 
  }

  // Eğer doküman hazır değilse tıklamayı engelle
  const handlePress = () => {
      if (item.status !== 'Ready' && item.status !== 'COMPLETED') {
          Alert.alert("İşlemde", `"${item.fileName}" dosyası hala işleniyor. Lütfen bekleyin.`);
          return;
      }
      
      // AnalysisScreen'e git ve tüm AI verilerini gönder
      navigation.navigate('Analysis', {
          documentId: item.id,
          docTitle: item.fileName,
          summaryText: item.summary,
          questionsJson: item.questions,
      });
  };
  
  const sizeMb = item.sizeBytes ? `${(item.sizeBytes / 1024 / 1024).toFixed(2)} MB` : 'Bilinmiyor';

  return (
    <TouchableOpacity style={documentStyles.itemContainer} onPress={handlePress}>
      <Ionicons name={iconName} size={30} color={iconColor} style={documentStyles.icon} />
      <View style={documentStyles.textContainer}>
        <Text style={documentStyles.fileName}>{item.fileName}</Text>
        <Text style={documentStyles.metaText}>
          Uploaded: {new Date().toLocaleDateString()} • {sizeMb}
        </Text>
      </View>
      
      <View style={[documentStyles.statusBadge, { backgroundColor: statusColor }]}>
        <Text style={documentStyles.statusText}>{item.status}</Text>
      </View>
      {/* Çöp kutusu ikonu, silme fonksiyonu eklenecek */}
      <Feather name="trash-2" size={20} color={COLORS.textGray} style={documentStyles.trashIcon} /> 
    </TouchableOpacity>
  );
};


const HomeScreen = ({ navigation }) => {
  const { signOut } = useContext(AuthContext); // AuthContext'ten signOut'u al
  const [documents, setDocuments] = useState(DUMMY_DOCUMENTS);
  const [isUploading, setIsUploading] = useState(false);
  
  // Platform'a göre API URL (Web için localhost, mobil için IP)
  const API_URL = Platform.OS === 'web' 
    ? 'http://localhost:5032' 
    : 'http://192.168.1.137:5032';

  const user = auth.currentUser; 

  // Backend'den dokümanları çeken fonksiyon
  const fetchDocuments = async () => {
    if (!user) return;

    try {
        const token = await user.getIdToken();
        const response = await axios.get(`${API_URL}/api/Documents`, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });
        
        setDocuments(response.data); 
    } catch (error) {
        console.error("Doküman listesi çekilemedi:", error);
        if (error.response?.status === 401) {
            Alert.alert("Oturum Süresi Doldu", "Lütfen tekrar giriş yapın.");
            signOut();
        }
    }
  };
  
  useEffect(() => {
    fetchDocuments();
  }, []);

  // Doküman Yükleme Fonksiyonu
  const handleUploadPress = async () => {
    console.log("Upload button clicked!");
    console.log("Platform:", Platform.OS);
    console.log("User:", user);
    console.log("Is Uploading:", isUploading);

    if (isUploading) {
      console.log("Already uploading...");
      return;
    }

    if (!user) {
      Alert.alert("Hata", "Lütfen önce giriş yapın.");
      return;
    }

    try {
      // Web'de HTML input kullan
      if (Platform.OS === 'web') {
        console.log("Web platform detected, creating file input...");
        
        // Web için dosya seçici oluştur
        const input = window.document.createElement('input');
        input.type = 'file';
        input.accept = '.pdf,.docx,.pptx';
        
        input.onchange = async (e) => {
          console.log("File selected!");
          const file = e.target.files[0];
          if (!file) {
            console.log("No file selected");
            return;
          }

          console.log("File:", file.name, file.size);

          // Dosya uzantı kontrolü
          const allowedExtensions = ['.pdf', '.docx', '.pptx'];
          const fileExtension = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
          if (!allowedExtensions.includes(fileExtension)) {
            Alert.alert("Hata", "Sadece PDF, DOCX ve PPTX dosyaları desteklenir.");
            return;
          }

          setIsUploading(true);

          try {
            const formData = new FormData();
            formData.append('File', file);

            const token = await user.getIdToken();
            
            console.log("Uploading to:", `${API_URL}/api/Documents/upload`);
            
            const uploadResponse = await axios.post(`${API_URL}/api/Documents/upload`, formData, {
              headers: {
                'Authorization': `Bearer ${token}`, 
                'Content-Type': 'multipart/form-data',
              },
            });

            console.log("Upload successful:", uploadResponse.data);
            Alert.alert("Başarılı", `"${uploadResponse.data.fileName}" AI işlemi tamamlandı.`);
            fetchDocuments();
          } catch (error) {
            console.error("Yükleme Hatası:", error);
            Alert.alert("Yükleme Başarısız", error.response?.data?.message || "Dosya yüklenirken bir hata oluştu.");
          } finally {
            setIsUploading(false);
          }
        };
        
        console.log("Clicking input...");
        input.click();
        return;
      }

      // Mobil için normal DocumentPicker
      console.log("Mobile platform, using DocumentPicker...");
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.presentationml.presentation',
        copyToCacheDirectory: false,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return; 
      }
      
      const file = result.assets[0];
      
      // Dosya uzantı kontrolü
      const allowedExtensions = ['.pdf', '.docx', '.pptx'];
      const fileExtension = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
      if (!allowedExtensions.includes(fileExtension)) {
          Alert.alert("Hata", "Sadece PDF, DOCX ve PPTX dosyaları desteklenir.");
          return;
      }

      setIsUploading(true);

      // FormData Oluşturma
      const formData = new FormData();
      const response = await fetch(file.uri);
      const blob = await response.blob();
      
      formData.append('File', blob, file.name);

      const token = await user.getIdToken();
      
      const uploadResponse = await axios.post(`${API_URL}/api/Documents/upload`, formData, {
        headers: {
          'Authorization': `Bearer ${token}`, 
          'Content-Type': 'multipart/form-data',
        },
      });

      Alert.alert("Başarılı", `"${uploadResponse.data.fileName}" AI işlemi tamamlandı.`);
      
      fetchDocuments();

    } catch (error) {
      console.error("Yükleme Hatası:", error);
      Alert.alert("Yükleme Başarısız", error.response?.data?.message || "Dosya yüklenirken bir hata oluştu.");
    } finally {
      setIsUploading(false);
    }
  };
  
  // Yükleme UI'ı (isUploading durumuna göre değişir)
  const uploadUI = isUploading ? (
      <View style={[styles.uploadContainer, {backgroundColor: COLORS.processingYellow}]}>
          <Text style={[styles.uploadTitle, {color: COLORS.background}]}>AI İşleniyor...</Text>
          <Text style={[styles.uploadSubtitle, {color: COLORS.background}]}>Lütfen bekleyin (Bu işlem uzun sürebilir)...</Text>
      </View>
  ) : (
      <TouchableOpacity style={styles.uploadContainer} onPress={handleUploadPress}>
          <Feather name="upload-cloud" size={40} color={COLORS.white} />
          <Text style={styles.uploadTitle}>Upload New Document</Text>
          <Text style={styles.uploadSubtitle}>Supports: PDF, DOCX, PPT</Text>
      </TouchableOpacity>
  );

  const handleLibraryPress = () => {
    // Navigasyon Profile ekranına gitme
    navigation.navigate('Profile');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        {/* Çıkış Yap Butonu */}
        <TouchableOpacity 
          style={styles.logoutButtonContainer}
          onPress={async () => {
            await signOut();
            Alert.alert("Çıkış Yapıldı", "Login ekranına yönlendiriliyorsunuz.");
          }}
        >
          <Feather name="log-out" size={18} color={COLORS.white} style={{marginRight: 8}} />
          <Text style={styles.logoutButtonText}>Çıkış Yap</Text>
        </TouchableOpacity>

        {uploadUI}
        
        <View style={styles.documentsHeader}>
          <Text style={styles.documentsTitle}>My Documents</Text>
          <TouchableOpacity onPress={handleLibraryPress}>
            <Text style={styles.libraryButton}>Kütüphanem</Text> 
          </TouchableOpacity>
        </View>

        <FlatList
          data={documents} 
          keyExtractor={(item, index) => item.id || index.toString()}
          renderItem={({ item }) => <DocumentItem item={item} />}
          scrollEnabled={false} 
        />
        
      </ScrollView>
    </SafeAreaView>
  );
};

// ... (Stiller kodunun tamamı aşağıda) ...

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: 15,
  },
  uploadContainer: {
    backgroundColor: COLORS.primaryBlue,
    padding: 30,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 15,
    marginBottom: 20,
  },
  uploadTitle: {
    color: COLORS.white,
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 10,
  },
  uploadSubtitle: {
    color: COLORS.white,
    fontSize: 14,
    opacity: 0.8,
    marginTop: 5,
  },
  documentsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  documentsTitle: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: 'bold',
  },
  libraryButton: {
    color: COLORS.white,
    backgroundColor: COLORS.inputBackground, 
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    fontSize: 14,
  },
  logoutButtonContainer: {
    backgroundColor: COLORS.dangerRed,
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 10,
  },
  logoutButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
});

const documentStyles = StyleSheet.create({
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBackground,
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  icon: {
    marginRight: 15,
  },
  textContainer: {
    flex: 1,
    marginRight: 10,
  },
  fileName: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  metaText: {
    color: COLORS.textGray,
    fontSize: 12,
    marginTop: 3,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 15,
  },
  statusText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  trashIcon: {
    marginLeft: 10,
  }
});

export default HomeScreen;