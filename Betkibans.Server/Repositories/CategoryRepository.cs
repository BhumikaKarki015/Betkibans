using Betkibans.Server.Data;
using Betkibans.Server.Interfaces;
using Betkibans.Server.Models.Entities;
using Microsoft.EntityFrameworkCore;

namespace Betkibans.Server.Repositories
{
    public class CategoryRepository : ICategoryRepository
    {
        private readonly ApplicationDbContext _context;

        public CategoryRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<Category>> GetAllAsync() => 
            await _context.Categories.ToListAsync();

        public async Task<Category?> GetByIdAsync(int id) => 
            await _context.Categories.FindAsync(id);

        public async Task AddAsync(Category category)
        {
            await _context.Categories.AddAsync(category);
            await _context.SaveChangesAsync();
        }

        public async Task UpdateAsync(Category category)
        {
            _context.Categories.Update(category);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteAsync(Category category)
        {
            _context.Categories.Remove(category);
            await _context.SaveChangesAsync();
        }

        public async Task<bool> ExistsAsync(string categoryName) => 
            await _context.Categories.AnyAsync(c => c.CategoryName.ToLower() == categoryName.ToLower());
    }
}