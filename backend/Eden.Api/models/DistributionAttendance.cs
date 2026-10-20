using Eden.Api.Helpers;
using Microsoft.EntityFrameworkCore;

namespace Eden.Api.Models
{
    [Index(nameof(DistributionId), nameof(FamilyId), IsUnique = true)]
    public class DistributionAttendance
    {
        public int? Id { get; set; }
        public int DistributionId { get; set; }
        public int FamilyId { get; set; }
        public Family? Family { get; set; }
        public bool Present { get; set; }

        public static Task<List<DistributionAttendance>> GetAttendancesByDistributionIdAsync(int distributionId)
        {
            return EdenAppContext.Context.WithDbContext(db =>
                db.DistributionAttendances.Where(a => a.DistributionId == distributionId).ToListAsync());
        }

        // Upsert: one row per (distribution, family); families not in the list are left untouched.
        public static Task<int> SaveAttendancesAsync(int distributionId, List<DistributionAttendance> attendances)
        {
            return EdenAppContext.Context.WithDbContext(async db =>
            {
                var existing = await db.DistributionAttendances
                    .Where(a => a.DistributionId == distributionId)
                    .ToListAsync();

                foreach (var attendance in attendances)
                {
                    var row = existing.FirstOrDefault(e => e.FamilyId == attendance.FamilyId);
                    if (row == null)
                    {
                        db.DistributionAttendances.Add(new DistributionAttendance
                        {
                            DistributionId = distributionId,
                            FamilyId = attendance.FamilyId,
                            Present = attendance.Present
                        });
                    }
                    else
                    {
                        row.Present = attendance.Present;
                    }
                }

                return await db.SaveChangesAsync();
            });
        }
    }
}
