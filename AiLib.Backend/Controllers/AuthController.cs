using Microsoft.AspNetCore.Mvc;
using FirebaseAdmin;                 
using FirebaseAdmin.Auth;           
using Google.Cloud.Firestore;       
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
        

        [HttpPost("register")]
        public async Task<IActionResult> RegisterUser([FromBody] RegisterRequestDto requestDto)
        {
            Console.WriteLine("[AUTH] ========== YENİ KAYIT İSTEĞİ BAŞLADI ==========");
            try
            {
                Console.WriteLine($"[AUTH] 1. Token doğrulama başlıyor...");
                
                var auth = FirebaseAuth.DefaultInstance;
                FirebaseToken decodedToken = await auth.VerifyIdTokenAsync(requestDto.IdToken);
                
                string uid = decodedToken.Uid;
                string email = (string)decodedToken.Claims["email"];
                Console.WriteLine($"[AUTH] ✓ Token doğrulandı. UID: {uid}, Email: {email}");

                
                FirestoreDb db;
                try
                {
                    Console.WriteLine("[AUTH] 2. Firestore'a bağlanılıyor...");
                    
                    
                    var firebaseCredentialPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "serviceAccountKey.json");
                    
                    
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
                    
                    Console.WriteLine($"[CRITICAL FIRESTORE ERROR] ✗ Bağlantı kurulamadı: {ex.Message}");
                    Console.WriteLine($"[CRITICAL FIRESTORE ERROR] Stack Trace: {ex.StackTrace}");
                    return StatusCode(500, new { 
                        message = "VERİTABANI BAĞLANTI HATASI: Sunucu Firestore'a bağlanamadı.", 
                        details = ex.Message 
                    });
                }
                // -------------------------------------------------------------------------


                Console.WriteLine("[AUTH] 3. Kullanıcı profili oluşturuluyor...");
                
                var userProfile = new Dictionary<string, object>
                {
                    { "fullName", requestDto.FullName ?? "İsim Belirtilmedi" }, 
                    { "email", email ?? "Email Yok" },               
                    { "createdAt", Timestamp.GetCurrentTimestamp() }
                };

                Console.WriteLine("[AUTH] 4. Firestore'a yazılıyor...");
                
                DocumentReference userDocRef = db.Collection("users").Document(uid);
                await userDocRef.SetAsync(userProfile); 
                Console.WriteLine("[AUTH] ✓ Kullanıcı başarıyla kaydedildi!");

                Console.WriteLine("[AUTH] ========== KAYIT İSTEĞİ BAŞARILI ==========");
                return Ok(userProfile);
            }
            catch (FirebaseAuthException ex)
            {
                
                Console.WriteLine($"[AUTH ERROR] Token hatası: {ex.Message}");
                return Unauthorized(new { message = "Geçersiz Firebase Token", details = ex.Message });
            }
            catch (Exception ex)
            {
                
                Console.WriteLine($"[GENERAL RUNTIME ERROR] İstek başarısız oldu: {ex.Message}");
                Console.WriteLine($"[GENERAL RUNTIME ERROR] Stack Trace: {ex.StackTrace}");
                return StatusCode(500, new { message = "Sunucu hatası. Detaylar için Backend loglarını kontrol edin.", details = ex.Message });
            }
        }
    }
}