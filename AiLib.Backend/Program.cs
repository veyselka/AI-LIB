using FirebaseAdmin;
using Google.Apis.Auth.OAuth2;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

// -----------------------------------------------------------------
// 1. ADIM: Firebase Admin SDK'sını Başlatma
// -----------------------------------------------------------------
var firebaseCredentialPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "serviceAccountKey.json");

FirebaseApp.Create(new AppOptions()
{
    Credential = GoogleCredential.FromFile(firebaseCredentialPath)
});
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
            policy.WithOrigins(
                    "http://localhost:8081",           // Local development
                    "http://192.168.1.137:8081"        // Network access
                  )
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
    string credentialPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "serviceAccountKey.json");
    var credential = GoogleCredential.FromFile(credentialPath);

    return new Google.Cloud.Firestore.FirestoreDbBuilder
    {
        ProjectId = "ai-lib-learning-app",
        Credential = credential
    }.Build();
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