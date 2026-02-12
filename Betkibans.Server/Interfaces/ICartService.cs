using Betkibans.Server.Dtos.Cart;

namespace Betkibans.Server.Interfaces
{
    public interface ICartService
    {
        Task<IEnumerable<CartItemResponseDto>> GetUserCartAsync(string userId);
        Task<bool> AddToCartAsync(string userId, AddToCartDto dto);
        Task<bool> UpdateCartItemQuantityAsync(string userId, int productId, int quantity);
        Task<bool> RemoveFromCartAsync(string userId, int productId);
        Task<bool> ClearCartAsync(string userId);
    }
}