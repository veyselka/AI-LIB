using System.Threading.Tasks;
using System.Collections.Generic;
using System;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Linq;
using Microsoft.Extensions.Options;

namespace AiLib.Backend.Services
{
    // appsettings.json'dan API Anahtarını okumak için model
    public class GeminiSettings
    {
        public string? ApiKey { get; set; }
    }

    public class GeminiService
    {
        private const string GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

        private readonly HttpClient _httpClient;
        private readonly string _apiKey;

        // Constructor: Anahtarı DI ile appsettings.json'dan oku
        public GeminiService(HttpClient httpClient, IOptions<GeminiSettings> settings)
        {
            _httpClient = httpClient;
            
            if (settings?.Value?.ApiKey == null)
            {
                throw new ArgumentNullException(nameof(settings), "Gemini API Key, appsettings.json'da bulunamadı. Lütfen GeminiSettings:ApiKey ayarını kontrol edin.");
            }
            
            _apiKey = settings.Value.ApiKey;
        }

        // --- 1. FONKSİYON: ÖZET ÇIKARMA ---
        public async Task<string> GenerateSummaryAsync(string rawText, string documentTitle)
        {
            string prompt = $@"
                Aşağıdaki belge içeriğini analiz edin: '{documentTitle}'. 
                Belgenin ana argümanlarını, kilit noktalarını, önemli detayları ve sonuçlarını kapsayan 
                kapsamlı, uzun ve detaylı bir özet oluşturun. 
                
                Özet en az 5-6 paragraf uzunluğunda olmalı ve şu bölümleri içermelidir:
                1. Genel Bakış: Belgenin ana konusu ve amacı
                2. Ana Fikirler: Belgedeki temel kavramlar ve argümanlar
                3. Detaylı İçerik: Önemli bilgiler, örnekler ve açıklamalar
                4. Kilit Noktalar: Vurgulanan önemli detaylar
                5. Sonuç ve Çıkarımlar: Belgenin sonuçları ve önerileri
                
                Her paragraf en az 4-5 cümle içermeli ve akademik bir dilde yazılmalıdır.
                
                Belge içeriği: 
                ---
                {rawText}
                ---
            ";
            return await CallGeminiApiAsync(prompt);
        }

        // --- 2. FONKSİYON: SORU ÜRETME ---
        public async Task<string> GenerateQuestionsAsync(string rawText, string documentTitle)
        {
            string prompt = $@"
                Aşağıdaki belge içeriğini ('{documentTitle}') analiz edin ve MUTLAKA TOPLAM 10 ADET sınav sorusu üretin.
                
                ÖNEMLI KURALLAR:
                - Tam olarak 10 soru olmalı (5 klasik açık uçlu + 5 çoktan seçmeli)
                - Klasik sorular detaylı ve uzun yanıtlar gerektirmeli (en az 3-4 cümle)
                - Çoktan seçmeli sorular zorlayıcı olmalı
                - Tüm seçenekler makul görünmeli
                - Sorular belgenin farklı bölümlerini kapsamalı
                
                Yanıtları sadece aşağıdaki JSON formatında döndürün, başka hiçbir metin eklemeyin.

                JSON Formatı:
                {{
                    ""questions"": [
                        {{
                            ""type"": ""classic"",
                            ""question"": ""[Detaylı Soru Metni]"",
                            ""answer"": ""[Kapsamlı ve detaylı yanıt, en az 3-4 cümle]""
                        }},
                        {{
                            ""type"": ""multiple_choice"",
                            ""question"": ""[Çoktan Seçmeli Soru Metni]"",
                            ""options"": [""A) Cevap 1"", ""B) Cevap 2"", ""C) Cevap 3"", ""D) Cevap 4""],
                            ""correct_answer"": ""[Doğru Seçenek Harfi (örn: C)]""
                        }}
                    ]
                }}

                Belge içeriği: 
                ---
                {rawText}
                ---
            ";
            return await CallGeminiApiAsync(prompt);
        }

        // --- ANA API ÇAĞRI METODU ---
        private async Task<string> CallGeminiApiAsync(string prompt)
        {
            try
            {
                // Gemini API için request body oluştur
                var requestBody = new
                {
                    contents = new[]
                    {
                        new
                        {
                            parts = new[]
                            {
                                new { text = prompt }
                            }
                        }
                    },
                    generationConfig = new
                    {
                        temperature = 0.5,
                        maxOutputTokens = 8192  // Token limitini artırdık (2048 -> 8192)
                    }
                };

                var jsonContent = JsonSerializer.Serialize(requestBody);
                var content = new StringContent(jsonContent, Encoding.UTF8, "application/json");

                // API çağrısını yap
                var response = await _httpClient.PostAsync($"{GEMINI_API_URL}?key={_apiKey}", content);

                if (response.IsSuccessStatusCode)
                {
                    var responseString = await response.Content.ReadAsStringAsync();
                    Console.WriteLine($"[GEMINI RESPONSE] {responseString.Substring(0, Math.Min(500, responseString.Length))}...");
                    var jsonResponse = JsonSerializer.Deserialize<JsonElement>(responseString);

                    // Gemini yanıtını parse et
                    if (jsonResponse.TryGetProperty("candidates", out var candidates) && 
                        candidates.GetArrayLength() > 0)
                    {
                        var firstCandidate = candidates[0];
                        if (firstCandidate.TryGetProperty("content", out var contentElement) &&
                            contentElement.TryGetProperty("parts", out var parts) &&
                            parts.GetArrayLength() > 0)
                        {
                            var firstPart = parts[0];
                            if (firstPart.TryGetProperty("text", out var textElement))
                            {
                                var text = textElement.GetString() ?? "[Gemini API'den içerik alınamadı.]";
                                
                                // Gemini bazen JSON'u markdown code block içinde gönderiyor, temizle
                                text = text.Trim();
                                if (text.StartsWith("```json"))
                                {
                                    text = text.Substring(7); // "```json" kaldır
                                }
                                if (text.StartsWith("```"))
                                {
                                    text = text.Substring(3); // "```" kaldır
                                }
                                if (text.EndsWith("```"))
                                {
                                    text = text.Substring(0, text.Length - 3); // "```" kaldır
                                }
                                
                                return text.Trim();
                            }
                        }
                    }
                }
                else
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    Console.WriteLine($"[GEMINI API ERROR] Status: {response.StatusCode}, Body: {errorContent}");
                    return $"[Gemini API Hatası: {response.StatusCode}]";
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[GEMINI API EXCEPTION] {ex.Message}");
                return $"[Hata: {ex.Message}]";
            }

            return "[Gemini API'den içerik alınamadı.]";
        }
    }
}