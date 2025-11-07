using Microsoft.AspNetCore.Http; // IFormFile için gerekli

namespace AiLib.Backend.Dtos
{
    public class DocumentUploadDto
    {
        // React Native'den gönderilecek dosyanın kendisi
        public IFormFile? File { get; set; } 
        
        // React Native'den Backend'i doğrulamak için gönderilen token
        // Frontend, isteğin Header kısmında göndereceği için burada sadece placeholder tutuyoruz.
    }
}