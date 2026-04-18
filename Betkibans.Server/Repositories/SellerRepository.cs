using Betkibans.Server.Data;
using Betkibans.Server.Interfaces;
using Betkibans.Server.Models.Entities;
using Microsoft.EntityFrameworkCore;

namespace Betkibans.Server.Repositories;

/*
   SellerRepository manages the data access for artisan profiles.
   It handles the lifecycle of a seller from registration and KYC submission
   to full verification and public listing.
 */
public class SellerRepository : ISellerRepository
{
    private readonly ApplicationDbContext _context;

    public SellerRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    // Fetches a seller profile using the SellerId primary key
    public async Task<Seller?> GetByIdAsync(int sellerId)
    {
        return await _context.Sellers
            .FirstOrDefaultAsync(s => s.SellerId == sellerId);
    }

    /*  Retrieves a seller profile associated with a specific Identity User ID.
        This is used frequently to verify the context of the currently logged-in user.
     */
    public async Task<Seller?> GetByUserIdAsync(string userId)
    {
        return await _context.Sellers
            .FirstOrDefaultAsync(s => s.UserId == userId);
    }

    /*  Returns all registered sellers, ordered by the newest registrations first.
        Typically used for broad administrative overviews.
     */
    public async Task<IEnumerable<Seller>> GetAllAsync()
    {
        return await _context.Sellers
            .OrderByDescending(s => s.CreatedAt)
            .ToListAsync();
    }

    /*  Retrieves a list of sellers who are awaiting manual review.
        Logic: Must be unverified and must have uploaded their KYC documents.
     */
    public async Task<IEnumerable<Seller>> GetPendingVerificationAsync()
    {
        return await _context.Sellers
            .Where(s => !s.IsVerified && s.KycDocumentPath != null)
            .OrderBy(s => s.CreatedAt)
            .ToListAsync();
    }

    /*  Fetches all sellers who have passed the verification process.
        Sorted by verification date to show the most recently approved artisans first.
     */
    public async Task<IEnumerable<Seller>> GetVerifiedAsync()
    {
        return await _context.Sellers
            .Where(s => s.IsVerified)
            .OrderByDescending(s => s.VerifiedAt)
            .ToListAsync();
    }

    // Persists a new Seller profile to the database
    public async Task<Seller> CreateAsync(Seller seller)
    {
        _context.Sellers.Add(seller);
        await _context.SaveChangesAsync();
        return seller;
    }

    // Updates existing seller business info, contact details, or verification status
    public async Task<Seller> UpdateAsync(Seller seller)
    {
        _context.Sellers.Update(seller);
        await _context.SaveChangesAsync();
        return seller;
    }

    // Quick check to see if a seller ID exists
    public async Task<bool> ExistsAsync(int sellerId)
    {
        return await _context.Sellers.AnyAsync(s => s.SellerId == sellerId);
    }

    /*  Verifies if an Identity User already has an associated Seller profile.
        This prevents users from creating duplicate business accounts.
     */
    public async Task<bool> UserHasSellerProfileAsync(string userId)
    {
        return await _context.Sellers.AnyAsync(s => s.UserId == userId);
    }
}