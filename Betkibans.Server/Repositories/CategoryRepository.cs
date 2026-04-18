using Betkibans.Server.Data;
using Betkibans.Server.Interfaces;
using Betkibans.Server.Models.Entities;
using Microsoft.EntityFrameworkCore;

namespace Betkibans.Server.Repositories
{
    /*
       CategoryRepository provides a specialized data access layer for Product Categories.
       It isolates the Entity Framework logic, allowing the rest of the application
       to interact with category data without knowing the underlying database details.
     */
    public class CategoryRepository : ICategoryRepository
    {
        private readonly ApplicationDbContext _context;

        public CategoryRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        // Retrieves all categories from the database for catalog navigation or admin management
        public async Task<IEnumerable<Category>> GetAllAsync() => 
            await _context.Categories.ToListAsync();

        // Fetches a specific category by its primary key
        public async Task<Category?> GetByIdAsync(int id) => 
            await _context.Categories.FindAsync(id);

        /*  Adds a new category to the system.
            Useful for expanding the product catalog into new bamboo/cane niches.
         */
        public async Task AddAsync(Category category)
        {
            await _context.Categories.AddAsync(category);
            await _context.SaveChangesAsync();
        }

        // Updates the properties (Name, Description) of an existing category
        public async Task UpdateAsync(Category category)
        {
            _context.Categories.Update(category);
            await _context.SaveChangesAsync();
        }

        // Permanently removes a category record from the database
        public async Task DeleteAsync(Category category)
        {
            _context.Categories.Remove(category);
            await _context.SaveChangesAsync();
        }

        /*  Performs a case-insensitive check to see if a category name already exists.
            This prevents data duplication (e.g., preventing "Chairs" and "chairs" from co-existing).
         */
        public async Task<bool> ExistsAsync(string categoryName) => 
            await _context.Categories.AnyAsync(c => c.CategoryName.ToLower() == categoryName.ToLower());
    }
}