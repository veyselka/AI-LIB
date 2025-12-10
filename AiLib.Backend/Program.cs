using FirebaseAdmin;
using Google.Apis.Auth.OAuth2;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

// -----------------------------------------------------------------
// 1. ADIM: Firebase Admin SDK'sını Başlatma
// -----------------------------------------------------------------
var firebaseCredentialPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "serviceAccountKey.json");

Console.WriteLine($"[FIREBASE] Credential path: {firebaseCredentialPath}");
Console.WriteLine($"[FIREBASE] File exists: {File.Exists(firebaseCredentialPath)}");

// Environment variable ayarla (Firestore için gerekli)
Environment.SetEnvironmentVariable("GOOGLE_APPLICATION_CREDENTIALS", firebaseCredentialPath);

if (FirebaseApp.DefaultInstance == null)
{
    try
    {
        var credential = GoogleCredential.FromFile(firebaseCredentialPath);
        FirebaseApp.Create(new AppOptions()
        {
            Credential = credential,
            ProjectId = "ai-lib-learning-app"
        });
        Console.WriteLine("[FIREBASE] Firebase Admin SDK başarıyla başlatıldı.");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"[FIREBASE ERROR] Firebase başlatma hatası: {ex.Message}");
        throw;
    }
}
// -----------------------------------------------------------------


// -----------------------------------------------------------------
// 2. ADIM: CORS POLİTİKASINI EKLE (Frontend izni)
// -----------------------------------------------------------------
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(
        policy =>
        {
            // React Native (Web) ve mobil cihazlardan erişim için
            policy.AllowAnyOrigin()
                  .AllowAnyHeader()
                  .AllowAnyMethod();
        });
});
// -----------------------------------------------------------------

// -----------------------------------------------------------------
// 3. ADIM: AUTHENTICATION (JWT Bearer) Servisini Ekle
// Bu servis, [Authorize] etiketindeki ID Token'ı doğrular.
// -----------------------------------------------------------------
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        // ÖNEMLİ: Proje ID'nizi burada 3 yerde doğru kullanın
        const string projectId = "ai-lib-learning-app"; // Sizin Firebase Proje ID'niz

        options.Authority = $"https://securetoken.google.com/{projectId}"; 
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = $"https://securetoken.google.com/{projectId}", 
            ValidateAudience = true,
            ValidAudience = projectId, 
            ValidateLifetime = true,
            
            // Firebase ID Token'ın UID bilgisini C# tarafında 'user_id' olarak saklar.
            // DocumentsController'da User.FindFirst("user_id") ile çekeceğiz.
            NameClaimType = "user_id" 
        };
    });
// -----------------------------------------------------------------

// -----------------------------------------------------------------
// 4. ADIM: Servisleri Konfigüre Etme (Firestore Bağlantısı)
// -----------------------------------------------------------------
// FirestoreDb servisini Dependency Injection (DI) olarak kaydet
builder.Services.AddSingleton<Google.Cloud.Firestore.FirestoreDb>(sp =>
{
    try
    {
        var credPath = Environment.GetEnvironmentVariable("GOOGLE_APPLICATION_CREDENTIALS");
        Console.WriteLine($"[FIRESTORE] Bağlantı kuruluyor...");
        Console.WriteLine($"[FIRESTORE] Credential path: {credPath}");
        
        var db = new Google.Cloud.Firestore.FirestoreDbBuilder
        {
            ProjectId = "ai-lib-learning-app"
        }.Build();
        
        Console.WriteLine($"[FIRESTORE] Firestore başarıyla bağlandı.");
        return db;
    }
    catch (Exception ex)
    {
        Console.WriteLine($"[FIRESTORE ERROR] Bağlantı hatası: {ex.Message}");
        throw;
    }
});

// Gemini API ayarlarını appsettings.json'dan oku
builder.Services.Configure<AiLib.Backend.Services.GeminiSettings>(
    builder.Configuration.GetSection("GeminiSettings")
);

// HttpClient ile GeminiService'i kaydet
builder.Services.AddHttpClient<AiLib.Backend.Services.GeminiService>();

// DocumentService'i kaydet
builder.Services.AddScoped<AiLib.Backend.Services.DocumentService>();

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
// -----------------------------------------------------------------


var app = builder.Build();

// -----------------------------------------------------------------
// 5. ADIM: HTTP Request Pipeline'ını Yapılandırma
// -----------------------------------------------------------------
app.UseCors(); // CORS'u Aktif Et

if (app.Environment.IsDevelopment())
{
    // Swagger'ı yoruma alıyoruz, ancak siz açmak isterseniz bu satırları aktif edin.
    // app.UseSwagger(); 
    // app.UseSwaggerUI();
}

app.UseHttpsRedirection();

// KRİTİK: Authentication ve Authorization middleware'lerini ekle
app.UseAuthentication(); 
app.UseAuthorization();

app.MapControllers();
// -----------------------------------------------------------------

app.Run();