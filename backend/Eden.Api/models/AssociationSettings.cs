using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;
using Eden.Api.Helpers;
using Microsoft.EntityFrameworkCore;

namespace Eden.Api.Models
{
    // Single-row, system-wide settings (Id is always SingletonId)
    public class AssociationSettings
    {
        public const int SingletonId = 1;
        public const string DefaultSheetTitle = "Scheda distribuzione";

        public int Id { get; set; } = SingletonId;
        public string Name { get; set; } = string.Empty;
        public string? Address { get; set; }
        public string? Phone { get; set; }
        public string? Email { get; set; }
        public string? SheetTitle { get; set; }

        [JsonIgnore]
        public byte[]? Logo { get; set; }
        [JsonIgnore]
        public string? LogoContentType { get; set; }

        [NotMapped]
        public bool HasLogo => Logo != null;

        [NotMapped]
        public string EffectiveSheetTitle =>
            !string.IsNullOrWhiteSpace(SheetTitle) ? SheetTitle.Trim()
            : !string.IsNullOrWhiteSpace(Name) ? Name.Trim()
            : DefaultSheetTitle;

        // Returns the saved row, or an unsaved default when nothing was saved yet
        public static Task<AssociationSettings> GetSettingsAsync()
        {
            return EdenAppContext.Context.WithDbContext(async db =>
                await db.AssociationSettings.FindAsync(SingletonId) ?? new AssociationSettings());
        }

        public Task SaveAsync()
        {
            Id = SingletonId;
            return EdenAppContext.Context.WithDbContext(async db =>
            {
                if (await db.AssociationSettings.AnyAsync(s => s.Id == SingletonId))
                    db.AssociationSettings.Update(this);
                else
                    db.AssociationSettings.Add(this);
                return await db.SaveChangesAsync();
            });
        }
    }
}
