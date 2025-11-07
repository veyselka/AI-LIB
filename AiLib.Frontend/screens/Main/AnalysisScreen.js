// screens/Main/AnalysisScreen.js

import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView, 
  TouchableOpacity, 
  Alert 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/Colors';
import axios from 'axios';

// ÖNEMLİ: Firestore'dan gelen JSON'un tipini temsil eden bir arayüz (Interface)
const QuestionItem = ({ questionObj, index }) => {
    const [isOpen, setIsOpen] = useState(false);
    
    // Gelen JSON string'i (questions) parse etmeliyiz
    const questionData = questionObj;
    
    // Çoktan seçmeli seçenekleri göstermek için
    const renderOptions = () => {
        if (questionData.type === 'multiple_choice' && questionData.options) {
            return questionData.options.map((option, i) => (
                <Text key={i} style={[
                    styles.optionText, 
                    { color: option.startsWith(questionData.correct_answer) ? COLORS.successGreen : COLORS.white }
                ]}>
                    {option}
                </Text>
            ));
        }
        return null;
    };

    return (
        <View style={styles.questionContainer}>
            <TouchableOpacity onPress={() => setIsOpen(!isOpen)} style={styles.questionHeader}>
                <Text style={styles.questionTitle}>
                    Question {index + 1}: {questionData.question}
                </Text>
                <Ionicons 
                    name={isOpen ? "chevron-up" : "chevron-down"} 
                    size={20} 
                    color={COLORS.white} 
                />
            </TouchableOpacity>

            {isOpen && (
                <View style={styles.answerBody}>
                    {questionData.type === 'classic' ? (
                        <Text style={styles.answerText}>
                           {questionData.answer}
                        </Text>
                    ) : (
                        <View>
                            {renderOptions()}
                            <Text style={styles.answerText}>
                                **Doğru Cevap:** {questionData.correct_answer}
                            </Text>
                        </View>
                    )}
                </View>
            )}
        </View>
    );
};


const AnalysisScreen = ({ route, navigation }) => {
  // HomeScreen'den gönderilen doküman verisini alıyoruz
  const { documentId, docTitle, summaryText, questionsJson } = route.params;

  const [activeTab, setActiveTab] = useState('summary'); // Varsayılan: Özet
  const [questions, setQuestions] = useState(null); // Parse edilmiş sorular

  useEffect(() => {
    // 1. Gelen JSON string'ini (questionsJson) parse et
    if (questionsJson) {
      try {
        const parsedQuestions = JSON.parse(questionsJson);
        // Genellikle Gemini, JSON'u 'questions' anahtarı içinde döner
        setQuestions(parsedQuestions.questions || parsedQuestions); 
      } catch (e) {
        console.error("Soru JSON'u parse edilemedi:", e);
        Alert.alert("Hata", "AI soruları yüklenemedi. JSON formatı bozuk.");
      }
    }
  }, [questionsJson]);


  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
         {/* Title, Home Screen'den gelen doküman adını kullanır */}
         <Text style={styles.headerTitle}>{docTitle}</Text>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'summary' && styles.activeTab]}
          onPress={() => setActiveTab('summary')}
        >
          <Text style={styles.tabText}>Özet</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'questions' && styles.activeTab]}
          onPress={() => setActiveTab('questions')}
        >
          <Text style={styles.tabText}>Sorular</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.contentContainer}>

        {/* --- ÖZET Sekmesi (screen.jpg) --- */}
        {activeTab === 'summary' && (
          <View>
            <Text style={styles.summaryText}>
               {summaryText || "Özet yüklenemedi veya Gemini metin üretemedi."}
            </Text>
            <Text style={styles.poweredBy}>Powered by Gemini</Text>
          </View>
        )}

        {/* --- SORULAR Sekmesi (screen.jpg) --- */}
        {activeTab === 'questions' && questions && (
          <View>
             {questions.map((q, index) => (
                <QuestionItem key={index} questionObj={q} index={index} />
             ))}
          </View>
        )}
        
        {activeTab === 'questions' && !questions && (
            <Text style={styles.summaryText}>Sorular yükleniyor veya bulunamadı.</Text>
        )}
        
      </ScrollView>
    </SafeAreaView>
  );
};

// ... (Stillerin Kodları aşağıda) ...

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  // Header (Navigation Bar'ın Yerine Geçen Başlık)
  header: {
    backgroundColor: COLORS.background, 
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.inputBackground,
  },
  headerTitle: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  // Tab Stilleri
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.inputBackground,
    margin: 15,
    borderRadius: 8,
    padding: 3,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: COLORS.primaryBlue,
  },
  tabText: {
    color: COLORS.white,
    fontWeight: '600',
  },
  // İçerik Stilleri
  contentContainer: {
    paddingHorizontal: 15,
  },
  summaryText: {
    color: COLORS.white,
    fontSize: 16,
    lineHeight: 24,
    backgroundColor: COLORS.inputBackground,
    padding: 15,
    borderRadius: 8,
  },
  poweredBy: {
    color: COLORS.textGray,
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 40,
    fontSize: 12,
  },
  // Soru Stilleri
  questionContainer: {
    backgroundColor: COLORS.inputBackground,
    borderRadius: 8,
    marginBottom: 10,
    overflow: 'hidden',
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
  },
  questionTitle: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginRight: 10,
  },
  answerBody: {
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: COLORS.background,
  },
  answerText: {
    color: COLORS.white,
    lineHeight: 22,
    fontSize: 14,
  },
  optionText: {
      fontSize: 14,
      marginBottom: 5
  }
});

export default AnalysisScreen;