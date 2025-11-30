using backend.Helpers;
using Microsoft.EntityFrameworkCore;

namespace backend.Models
{
    public class Family
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public uint Members { get; set; }
        public uint Children { get; set; }
        public int Isee { get; set; }
        public DateTime CreatedAt { get; set; }

        public static List<Family> GetFamilies()
        {
            return EdenAppContext.Context.DbContext.Families.Local.ToList();
        }

        public static Family AddFamily(Family family)
        {
            var newFamily = EdenAppContext.Context.DbContext.Families.Add(family);
            EdenAppContext.Context.DbContext.SaveChanges();
            return newFamily.Entity;
        }

    }
}