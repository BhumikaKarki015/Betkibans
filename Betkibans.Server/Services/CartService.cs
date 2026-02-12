using Betkibans.Server.Dtos.Cart;
using Betkibans.Server.Models.Entities;
using Betkibans.Server.Interfaces;

namespace Betkibans.Server.Services
{
    public class CartService : ICartService
    {
        private readonly ICartRepository _cartRepository;
        private readonly IProductRepository _productRepository;

        public CartService(ICartRepository cartRepository, IProductRepository productRepository)
        {
            _cartRepository = cartRepository;
            _productRepository = productRepository;
        }

        public async Task<IEnumerable<CartItemResponseDto>> GetUserCartAsync(string userId)
        {
            var cart = await _cartRepository.GetCartByUserIdAsync(userId);
            if (cart == null) return Enumerable.Empty<CartItemResponseDto>();

            return cart.CartItems.Select(ci => new CartItemResponseDto
            {
                CartItemId = ci.CartItemId,
                ProductId = ci.ProductId,
                ProductName = ci.Product.Name,
                ProductImageUrl = ci.Product.ProductImages.FirstOrDefault(i => i.IsMain)?.ImageUrl,
                Price = ci.Product.Price,
                Quantity = ci.Quantity
            });
        }

        public async Task<bool> AddToCartAsync(string userId, AddToCartDto dto)
        {
            var cart = await _cartRepository.GetCartByUserIdAsync(userId) ?? await _cartRepository.CreateCartAsync(userId);
            var product = await _productRepository.GetByIdAsync(dto.ProductId);
            
            if (product == null || product.StockQuantity < dto.Quantity) return false;

            var existingItem = await _cartRepository.GetCartItemAsync(cart.CartId, dto.ProductId);
            if (existingItem != null)
            {
                existingItem.Quantity += dto.Quantity;
                await _cartRepository.UpdateCartItemAsync(existingItem);
            }
            else
            {
                await _cartRepository.AddCartItemAsync(new CartItem
                {
                    CartId = cart.CartId,
                    ProductId = dto.ProductId,
                    Quantity = dto.Quantity
                });
            }
            return true;
        }

        public async Task<bool> UpdateCartItemQuantityAsync(string userId, int productId, int quantity)
        {
            var cart = await _cartRepository.GetCartByUserIdAsync(userId);
            if (cart == null) return false;

            var item = await _cartRepository.GetCartItemAsync(cart.CartId, productId);
            if (item == null) return false;

            item.Quantity = quantity;
            await _cartRepository.UpdateCartItemAsync(item);
            return true;
        }

        public async Task<bool> RemoveFromCartAsync(string userId, int productId)
        {
            var cart = await _cartRepository.GetCartByUserIdAsync(userId);
            if (cart == null) return false;

            var item = await _cartRepository.GetCartItemAsync(cart.CartId, productId);
            if (item == null) return false;

            await _cartRepository.RemoveCartItemAsync(item);
            return true;
        }

        public async Task<bool> ClearCartAsync(string userId)
        {
            var cart = await _cartRepository.GetCartByUserIdAsync(userId);
            if (cart == null) return false;

            await _cartRepository.ClearCartAsync(cart.CartId);
            return true;
        }
    }
}