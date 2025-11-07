using Microsoft.AspNetCore.Mvc;
using FirebaseAdmin;                 // 'FirebaseApp'i kullanmak için
using FirebaseAdmin.Auth;           
using Google.Cloud.Firestore;       // 'FirestoreDb', 'Timestamp', 'DocumentReference' için
using AiLib.Backend.Dtos;
using System.Collections.Generic;
using System.Threading.Tasks;
using Google.Apis.Auth.OAuth2;
using System;

namespace AiLib.Backend.Controllers
{
    [ApiController] 
    [Route("api/[controller]")] 
    public class AuthController : ControllerBase
    {
        // Not: Constructor ve _db alanları, RegisterUser metodu basitleştiği için kaldırılmıştır.

        [HttpPost("register")]
        public async Task<IActionResult> RegisterUser([FromBody] RegisterRequestDto requestDto)
        {
            Console.WriteLine("[AUTH] ========== YENİ KAYIT İSTEĞİ BAŞLADI ==========");
            try
            {
                Console.WriteLine($"[AUTH] 1. Token doğrulama başlıyor...");
                // 1. Firebase Auth örneğini al ve Token'ı doğrula
                var auth = FirebaseAuth.DefaultInstance;
                FirebaseToken decodedToken = await auth.VerifyIdTokenAsync(requestDto.IdToken);
                
                string uid = decodedToken.Uid;
                string email = (string)decodedToken.Claims["email"];
                Console.WriteLine($"[AUTH] ✓ Token doğrulandı. UID: {uid}, Email: {email}");

                // -------------------------------------------------------------------------
                // 4. Korumalı Firestore Bağlantısı
                // Bu kısım, 500 hatasına neden olan en kritik yerdir.
                // -------------------------------------------------------------------------
                FirestoreDb db;
                try
                {
                    Console.WriteLine("[AUTH] 2. Firestore'a bağlanılıyor...");
                    
                    // serviceAccountKey.json dosyasının yolunu al
                    var firebaseCredentialPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "serviceAccountKey.json");
                    
                    // Firebase Admin SDK'sının kimlik bilgilerini kullanarak FirestoreDb oluştur
                    var firestoreBuilder = new FirestoreDbBuilder
                    {
                        ProjectId = "ai-lib-learning-app",
                        Credential = GoogleCredential.FromFile(firebaseCredentialPath)
                    };
                    
                    db = firestoreBuilder.Build();
                    Console.WriteLine("[AUTH] ✓ Firestore bağlantısı başarılı!");
                }
                catch (Exception ex)
                {
                    // Bağlantı hatası olursa, C# Backend terminaline detayı düşürecek 500 yanıtı dönüyoruz.
                    Console.WriteLine($"[CRITICAL FIRESTORE ERROR] ✗ Bağlantı kurulamadı: {ex.Message}");
                    Console.WriteLine($"[CRITICAL FIRESTORE ERROR] Stack Trace: {ex.StackTrace}");
                    return StatusCode(500, new { 
                        message = "VERİTABANI BAĞLANTI HATASI: Sunucu Firestore'a bağlanamadı.", 
                        details = ex.Message 
                    });
                }
                // -------------------------------------------------------------------------


                Console.WriteLine("[AUTH] 3. Kullanıcı profili oluşturuluyor...");
                // 5. Firestore'a kaydedilecek yeni kullanıcı profili verisi
                var userProfile = new Dictionary<string, object>
                {
                    { "fullName", requestDto.FullName ?? "İsim Belirtilmedi" }, // Null kontrolü
                    { "email", email ?? "Email Yok" },               // Null kontrolü
                    { "createdAt", Timestamp.GetCurrentTimestamp() }
                };

                Console.WriteLine("[AUTH] 4. Firestore'a yazılıyor...");
                // 6. Veriyi Firestore'a kaydet (Yol: /users/{uid})
                DocumentReference userDocRef = db.Collection("users").Document(uid);
                await userDocRef.SetAsync(userProfile); 
                Console.WriteLine("[AUTH] ✓ Kullanıcı başarıyla kaydedildi!");

                Console.WriteLine("[AUTH] ========== KAYIT İSTEĞİ BAŞARILI ==========");
                return Ok(userProfile);
            }
            catch (FirebaseAuthException ex)
            {
                // Token geçersizse veya süresi dolmuşsa
                Console.WriteLine($"[AUTH ERROR] Token hatası: {ex.Message}");
                return Unauthorized(new { message = "Geçersiz Firebase Token", details = ex.Message });
            }
            catch (Exception ex)
            {
                // Diğer genel hatalar
                Console.WriteLine($"[GENERAL RUNTIME ERROR] İstek başarısız oldu: {ex.Message}");
                Console.WriteLine($"[GENERAL RUNTIME ERROR] Stack Trace: {ex.StackTrace}");
                return StatusCode(500, new { message = "Sunucu hatası. Detaylar için Backend loglarını kontrol edin.", details = ex.Message });
            }
        }
    }
}