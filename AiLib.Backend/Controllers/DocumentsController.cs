using Microsoft.AspNetCore.Mvc;
using FirebaseAdmin.Auth;
using Google.Cloud.Firestore;
using AiLib.Backend.Dtos;
using AiLib.Backend.Services;
using System.Threading.Tasks;
using System.IO;
using System;
using Microsoft.AspNetCore.Authorization;
using System.Collections.Generic;

namespace AiLib.Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize] 
    public class DocumentsController : ControllerBase
    {
        private readonly FirestoreDb _db;
        private readonly DocumentService _documentService;
        private readonly GeminiService _geminiService;

        // DI ile servisleri alıyoruz
        public DocumentsController(
            FirestoreDb db, 
            DocumentService documentService, 
            GeminiService geminiService)
        {
            _db = db;
            _documentService = documentService;
            _geminiService = geminiService;
        }

        // --- DOKÜMAN YÜKLEME ENDPOINT'i ---
        // POST api/documents/upload
        [HttpPost("upload")]
        public async Task<IActionResult> UploadDocument([FromForm] DocumentUploadDto model)
        {
            Console.WriteLine("[UPLOAD] ========== YENİ DOSYA YÜKLEME İSTEĞİ BAŞLADI ==========");
            
            string? userId = User.FindFirst("user_id")?.Value;

            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new { message = "Kullanıcı kimliği doğrulanamadı. Geçersiz token." });
            }

            try
            {
                Console.WriteLine($"[UPLOAD] 1. Dosya bilgileri alınıyor: {model.File?.FileName}");
                
                // 2. Dosya Meta Verilerini Oluşturma
                string? fileExtension = Path.GetExtension(model.File?.FileName)?.ToLower();
                string? mimeType = model.File?.ContentType;
                string storageFileName = $"{Guid.NewGuid()}{fileExtension}";

                // Sadece izin verilen dosya türlerini kontrol et
                var supportedFormats = new[] { ".pdf", ".docx", ".pptx" };
                if (string.IsNullOrEmpty(fileExtension) || !supportedFormats.Contains(fileExtension))
                {
                    return BadRequest(new { message = "Desteklenmeyen dosya formatı. Lütfen PDF, DOCX veya PPTX yükleyin." });
                }

                long fileSize = model.File?.Length ?? 0;
                Console.WriteLine($"[UPLOAD] ✓ Dosya formatı: {fileExtension}, Boyut: {fileSize} bytes");

                // 3. Dosya İçeriğini Ayrıştırma (Parsing)
                Console.WriteLine("[UPLOAD] 2. Dosya içeriği ayrıştırılıyor...");
                string rawText = await _documentService.ExtractTextAsync(model.File!);
                
                if (string.IsNullOrWhiteSpace(rawText))
                {
                    return BadRequest(new { message = "Dosya içeriği okunamadı veya boş." });
                }
                
                Console.WriteLine($"[UPLOAD] ✓ Metin çıkarıldı: {rawText.Length} karakter");

                // 4. Önce dokümanı "PROCESSING" durumunda kaydet
                Console.WriteLine("[UPLOAD] 3. Doküman Firestore'a kaydediliyor (PROCESSING)...");
                
                var initialDocumentData = new Dictionary<string, object>
                {
                    { "fileName", model.File?.FileName ?? "Unknown" },
                    { "sizeBytes", fileSize },
                    { "fileType", fileExtension.Replace(".", "").ToUpper() },
                    { "uploadDate", Timestamp.GetCurrentTimestamp() },
                    { "storagePath", storageFileName },
                    { "status", "PROCESSING" },
                    { "rawText", rawText }
                };

                DocumentReference docRef = _db.Collection("users").Document(userId).Collection("documents").Document();
                await docRef.SetAsync(initialDocumentData);
                Console.WriteLine($"[UPLOAD] ✓ Doküman kaydedildi, ID: {docRef.Id}");

                // 5. Gemini API ile Özet ve Soru Üretimi (Background Task)
                Console.WriteLine("[UPLOAD] 4. Gemini API çağrıları başlatılıyor...");
                
                try
                {
                    // Özet oluştur
                    Console.WriteLine("[UPLOAD] 4a. Özet oluşturuluyor...");
                    string summary = await _geminiService.GenerateSummaryAsync(rawText, model.File?.FileName ?? "Doküman");
                    Console.WriteLine($"[UPLOAD] ✓ Özet oluşturuldu: {summary.Substring(0, Math.Min(100, summary.Length))}...");

                    // Soru oluştur
                    Console.WriteLine("[UPLOAD] 4b. Sorular oluşturuluyor...");
                    string questions = await _geminiService.GenerateQuestionsAsync(rawText, model.File?.FileName ?? "Doküman");
                    Console.WriteLine($"[UPLOAD] ✓ Sorular oluşturuldu");

                    // 6. Dokümanı güncelleyerek AI çıktılarını ekle
                    Console.WriteLine("[UPLOAD] 5. AI çıktıları Firestore'a kaydediliyor...");
                    
                    await docRef.UpdateAsync(new Dictionary<string, object>
                    {
                        { "summary", summary },
                        { "questions", questions },
                        { "status", "COMPLETED" }
                    });
                    
                    Console.WriteLine("[UPLOAD] ✓ Doküman tamamlandı (COMPLETED)");
                    Console.WriteLine("[UPLOAD] ========== DOSYA YÜKLEME BAŞARILI ==========");

                    return Ok(new 
                    { 
                        id = docRef.Id, 
                        message = "Doküman başarıyla yüklendi ve AI analizi tamamlandı.", 
                        fileName = model.File?.FileName,
                        summary = summary,
                        questions = questions
                    });
                }
                catch (Exception aiEx)
                {
                    Console.WriteLine($"[UPLOAD ERROR] AI işlemi başarısız: {aiEx.Message}");
                    
                    // AI hatası olsa bile dokümanı hatalarla kaydet
                    await docRef.UpdateAsync(new Dictionary<string, object>
                    {
                        { "status", "FAILED" },
                        { "error", aiEx.Message }
                    });

                    return StatusCode(500, new { 
                        message = "Dosya yüklendi ancak AI analizi başarısız oldu.", 
                        details = aiEx.Message,
                        documentId = docRef.Id
                    });
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[UPLOAD ERROR] Genel hata: {ex.Message}");
                Console.WriteLine($"[UPLOAD ERROR] Stack Trace: {ex.StackTrace}");
                return StatusCode(500, new { message = "Dosya yükleme sırasında sunucu hatası.", details = ex.Message });
            }
        }
        
        // --- DOKÜMAN LİSTELEME ENDPOINT'i ---
        // GET api/documents
        [HttpGet]
        public async Task<IActionResult> GetMyDocuments()
        {
            string? userId = User.FindFirst("user_id")?.Value;
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            try
            {
                // Veri Yolu: /users/{userId}/documents
                CollectionReference docCollection = _db.Collection("users").Document(userId).Collection("documents");

                // Dokümanları tarihe göre sıralayarak al
                QuerySnapshot snapshot = await docCollection.OrderByDescending("uploadDate").GetSnapshotAsync();
                
                var documents = new List<object>();

                foreach (DocumentSnapshot document in snapshot.Documents)
                {
                    // Firestore'dan gelen verileri anonim bir obje olarak listeye ekle
                    var doc = document.ToDictionary();
                    doc["id"] = document.Id; // Dokümanın Firestore ID'sini ekle
                    documents.Add(doc);
                }

                return Ok(documents);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Dokümanlar yüklenirken sunucu hatası.", details = ex.Message });
            }
        }
    }
}// -----------------------------------------------------------------