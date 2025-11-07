// Dtos/RegisterRequestDto.cs
namespace AiLib.Backend.Dtos
{
    public class RegisterRequestDto
    {
        // string'den string?'e (nullable) değiştirildi
        public string? IdToken { get; set; }
        public string? FullName { get; set; }
    }
}