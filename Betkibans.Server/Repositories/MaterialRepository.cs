using Betkibans.Server.Data;
using Betkibans.Server.Models.Entities;
using Betkibans.Server.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Betkibans.Server.Repositories
{
    /*
       MaterialRepository handles the persistence logic for raw material types.
       It ensures that the Service layer can manage the "ingredients" list of the catalog
       (e.g., specific Bamboo varieties or Cane types) without direct SQL/EF dependency.
     */
    public class MaterialRepository : IMaterialRepository
    {
        private readonly ApplicationDbContext _context;

        public MaterialRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        // Retrieves all registered materials from the database
        public async Task<IEnumerable<Material>> GetAllAsync() => 
            await _context.Materials.ToListAsync();

        // Locates a single material by its unique identifier
        public async Task<Material?> GetByIdAsync(int id) => 
            await _context.Materials.FindAsync(id);

        /*  Persists a new material type to the database.
            Essential for introducing new sustainable fibers to the platform.
         */
        public async Task AddAsync(Material material)
        {
            await _context.Materials.AddAsync(material);
            await _context.SaveChangesAsync();
        }

        // Updates an existing material's name or descriptive details
        public async Task UpdateAsync(Material material)
        {
            _context.Materials.Update(material);
            await _context.SaveChangesAsync();
        }

        // Removes a material record permanently from the database
        public async Task DeleteAsync(Material material)
        {
            _context.Materials.Remove(material);
            await _context.SaveChangesAsync();
        }
    }
}