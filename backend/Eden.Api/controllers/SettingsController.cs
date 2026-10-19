using Eden.Api.Models;
using Microsoft.AspNetCore.Mvc;

namespace Eden.Api.Controllers
{
    [ApiController]
    [Route("api/settings")]
    public class SettingsController : ControllerBase
    {
        private const int MaxLogoBytes = 1024 * 1024;

        [HttpGet]
        public async Task<IActionResult> Get()
        {
            return Ok(await AssociationSettings.GetSettingsAsync());
        }

        [HttpPut]
        public async Task<IActionResult> Update([FromBody] AssociationSettings request)
        {
            if (string.IsNullOrWhiteSpace(request.Name))
            {
                return BadRequest("Name is required.");
            }

            // Load the row so the logo is kept; only text fields come from the request
            var settings = await AssociationSettings.GetSettingsAsync();
            settings.Name = request.Name.Trim();
            settings.Address = request.Address;
            settings.Phone = request.Phone;
            settings.Email = request.Email;
            settings.SheetTitle = request.SheetTitle;
            await settings.SaveAsync();
            return Ok(settings);
        }

        [HttpGet("logo")]
        public async Task<IActionResult> GetLogo()
        {
            var settings = await AssociationSettings.GetSettingsAsync();
            if (settings.Logo == null)
            {
                return NotFound();
            }

            return File(settings.Logo, settings.LogoContentType ?? "application/octet-stream");
        }

        [HttpPut("logo")]
        [RequestSizeLimit(MaxLogoBytes + 64 * 1024)] // 1 MB file + multipart overhead
        public async Task<IActionResult> UploadLogo(IFormFile? file)
        {
            if (file == null || file.Length == 0)
            {
                return BadRequest("A logo file is required.");
            }
            if (file.Length > MaxLogoBytes)
            {
                return BadRequest("Logo must be at most 1 MB.");
            }

            using var stream = new MemoryStream();
            await file.CopyToAsync(stream);
            var bytes = stream.ToArray();
            var contentType = _detectImageType(bytes);
            if (contentType == null)
            {
                return BadRequest("Logo must be a PNG or JPEG image.");
            }

            var settings = await AssociationSettings.GetSettingsAsync();
            settings.Logo = bytes;
            settings.LogoContentType = contentType;
            await settings.SaveAsync();
            return Ok(settings);
        }

        [HttpDelete("logo")]
        public async Task<IActionResult> DeleteLogo()
        {
            var settings = await AssociationSettings.GetSettingsAsync();
            settings.Logo = null;
            settings.LogoContentType = null;
            await settings.SaveAsync();
            return NoContent();
        }

        // Trust the file bytes, not the client-sent content type
        private static string? _detectImageType(byte[] b)
        {
            if (b.Length >= 4 && b[0] == 0x89 && b[1] == 0x50 && b[2] == 0x4E && b[3] == 0x47) return "image/png";
            if (b.Length >= 3 && b[0] == 0xFF && b[1] == 0xD8 && b[2] == 0xFF) return "image/jpeg";
            return null;
        }
    }
}
