using Betkibans.Server.Data;
using Betkibans.Server.Interfaces;
using Betkibans.Server.Models.Entities;
using Microsoft.EntityFrameworkCore;

namespace Betkibans.Server.Repositories;

public class SellerRepository : ISellerRepository
{
    private readonly ApplicationDbContext _context;

    public SellerRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Seller?> GetByIdAsync(int sellerId)
    {
        return await _context.Sellers
            .FirstOrDefaultAsync(s => s.SellerId == sellerId);
    }

    public async Task<Seller?> GetByUserIdAsync(string userId)
    {
        return await _context.Sellers
            .FirstOrDefaultAsync(s => s.UserId == userId);
    }

    public async Task<IEnumerable<Seller>> GetAllAsync()
    {
        return await _context.Sellers
            .OrderByDescending(s => s.CreatedAt)
            .ToListAsync();
    }

    public async Task<IEnumerable<Seller>> GetPendingVerificationAsync()
    {
        return await _context.Sellers
            .Where(s => !s.IsVerified && s.KycDocumentPath != null)
            .OrderBy(s => s.CreatedAt)
            .ToListAsync();
    }

    public async Task<IEnumerable<Seller>> GetVerifiedAsync()
    {
        return await _context.Sellers
            .Where(s => s.IsVerified)
            .OrderByDescending(s => s.VerifiedAt)
            .ToListAsync();
    }

    public async Task<Seller> CreateAsync(Seller seller)
    {
        _context.Sellers.Add(seller);
        await _context.SaveChangesAsync();
        return seller;
    }

    public async Task<Seller> UpdateAsync(Seller seller)
    {
        _context.Sellers.Update(seller);
        await _context.SaveChangesAsync();
        return seller;
    }

    public async Task<bool> ExistsAsync(int sellerId)
    {
        return await _context.Sellers.AnyAsync(s => s.SellerId == sellerId);
    }

    public async Task<bool> UserHasSellerProfileAsync(string userId)
    {
        return await _context.Sellers.AnyAsync(s => s.UserId == userId);
    }
}