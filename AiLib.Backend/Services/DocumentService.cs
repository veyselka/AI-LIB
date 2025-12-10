using System.IO;
using System.Threading.Tasks;
using System;
using Microsoft.AspNetCore.Http;
using DocumentFormat.OpenXml.Packaging;
using UglyToad.PdfPig;

namespace AiLib.Backend.Services
{
    
    public class DocumentService
    {
        
        public async Task<string> ExtractTextAsync(IFormFile file)
        {
            if (file == null || file.Length == 0)
            {
                return string.Empty;
            }

            string? fileExtension = Path.GetExtension(file.FileName)?.ToLower();

            
            using (var stream = new MemoryStream())
            {
                await file.CopyToAsync(stream);
                stream.Position = 0; 

                switch (fileExtension)
                {
                    case ".pdf":
                        return ExtractTextFromPdf(stream);
                    case ".docx":
                        return ExtractTextFromDocx(stream);
                    case ".pptx":
                        return ExtractTextFromPptx(stream);
                    default:
                        
                        return string.Empty; 
                }
            }
        }

        // --- PDF Ayrıştırma (PdfPig Kütüphanesi) --
        private string ExtractTextFromPdf(Stream stream)
        {
            
            using (var document = PdfDocument.Open(stream))
            {
                var text = new System.Text.StringBuilder();
                foreach (var page in document.GetPages())
                {
                    text.AppendLine(page.Text);
                }
                return text.ToString();
            }
        }

        // --- DOCX Ayrıştırma (OpenXml Kütüphanesi) ---
        private string ExtractTextFromDocx(Stream stream)
        {
            var text = new System.Text.StringBuilder();
            try
            {
                // WordprocessingDocument, DOCX (Word) dosyasını işler
                using (var wordDocument = WordprocessingDocument.Open(stream, false))
                {
                    // Belgenin ana metin bölümünü al ve metin olarak çıkar
                    if (wordDocument.MainDocumentPart?.Document?.Body != null)
                    {
                        text.Append(wordDocument.MainDocumentPart.Document.Body.InnerText);
                    }
                }
            }
            catch (Exception ex)
            {
                
                text.Append($"[HATA: DOCX Ayrıştırma Başarısız] {ex.Message}");
            }
            return text.ToString();
        }

        // --- PPTX Ayrıştırma (OpenXml Kütüphanesi) ---
        private string ExtractTextFromPptx(Stream stream)
        {
            var text = new System.Text.StringBuilder();
            try
            {
                // PresentationDocument, PPTX (PowerPoint) dosyasını işler
                using (var presentationDocument = PresentationDocument.Open(stream, false))
                {
                    // Slayt içeriklerini gez
                    if (presentationDocument.PresentationPart?.SlideParts != null)
                    {
                        foreach (var slidePart in presentationDocument.PresentationPart.SlideParts)
                        {
                            if (slidePart.Slide != null)
                            {
                                // Tüm metni çıkar
                                text.AppendLine(slidePart.Slide.InnerText);
                            }
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                 text.Append($"[HATA: PPTX Ayrıştırma Başarısız] {ex.Message}");
            }
            return text.ToString();
        }
    }
}