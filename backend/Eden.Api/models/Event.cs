using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;
using Eden.Api.Helpers;
using Microsoft.EntityFrameworkCore;

namespace Eden.Api.Models
{
    public class Event
    {
        public const string DistributionTitle = "Distribuzione";

        public int? Id { get; set; }

        [MaxLength(200)]
        public string Title { get; set; } = string.Empty;

        [MaxLength(2000)]
        public string? Description { get; set; }

        private DateTime _start;
        public DateTime Start
        {
            get => _start;
            set => _start = value.Kind == DateTimeKind.Utc ? value : value.ToUniversalTime();
        }

        private DateTime? _end;
        public DateTime? End
        {
            get => _end;
            set => _end = value is null || value.Value.Kind == DateTimeKind.Utc ? value : value.Value.ToUniversalTime();
        }

        public bool AllDay { get; set; }

        // null = manual event; set = mirrors a distribution (read-only from the calendar)
        public int? DistributionId { get; set; }

        [JsonIgnore]
        public Distribution? Distribution { get; set; }

        // Events overlapping [from, to)
        public static Task<List<Event>> GetEventsAsync(DateTime from, DateTime to)
        {
            return EdenAppContext.Context.WithDbContext(db =>
                db.Events
                    .Where(e => e.Start < to && (e.End ?? e.Start) >= from)
                    .OrderBy(e => e.Start)
                    .ToListAsync());
        }

        public static Task<Event?> GetEventByIdAsync(int id)
        {
            return EdenAppContext.Context.WithDbContext(db => db.Events.FirstOrDefaultAsync(e => e.Id == id));
        }

        public static async Task<Event> AddEventAsync(Event ev)
        {
            await EdenAppContext.Context.WithDbContext(db =>
            {
                db.Events.Add(ev);
                return db.SaveChangesAsync();
            });
            return ev;
        }

        public static async Task<Event> UpdateEventAsync(Event ev)
        {
            await EdenAppContext.Context.WithDbContext(db =>
            {
                db.Events.Update(ev);
                return db.SaveChangesAsync();
            });
            return ev;
        }

        public static Task DeleteEventAsync(int id)
        {
            return EdenAppContext.Context.WithDbContext(db => db.Events.Where(e => e.Id == id).ExecuteDeleteAsync());
        }
    }
}
