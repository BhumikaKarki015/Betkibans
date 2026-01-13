using Betkibans.Server.Models.Entities;

namespace Betkibans.Server.Interfaces;

public interface ISellerRepository
{
    Task<Seller?> GetByIdAsync(int sellerId);
    Task<Seller?> GetByUserIdAsync(string userId);
    Task<IEnumerable<Seller>> GetAllAsync();
    Task<IEnumerable<Seller>> GetPendingVerificationAsync();
    Task<IEnumerable<Seller>> GetVerifiedAsync();
    Task<Seller> CreateAsync(Seller seller);
    Task<Seller> UpdateAsync(Seller seller);
    Task<bool> ExistsAsync(int sellerId);
    Task<bool> UserHasSellerProfileAsync(string userId);
}