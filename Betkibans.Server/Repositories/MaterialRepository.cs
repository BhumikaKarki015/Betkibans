using Betkibans.Server.Data;
using Betkibans.Server.Models.Entities;
using Betkibans.Server.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Betkibans.Server.Repositories
{
    public class MaterialRepository : IMaterialRepository
    {
        private readonly ApplicationDbContext _context;

        public MaterialRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<Material>> GetAllAsync() => 
            await _context.Materials.ToListAsync();

        public async Task<Material?> GetByIdAsync(int id) => 
            await _context.Materials.FindAsync(id);

        public async Task AddAsync(Material material)
        {
            await _context.Materials.AddAsync(material);
            await _context.SaveChangesAsync();
        }

        public async Task UpdateAsync(Material material)
        {
            _context.Materials.Update(material);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteAsync(Material material)
        {
            _context.Materials.Remove(material);
            await _context.SaveChangesAsync();
        }
    }
}