using Betkibans.Server.Data;
using Betkibans.Server.Models.Entities;
using Betkibans.Server.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Betkibans.Server.Repositories
{
    /*
       CartRepository implements the Data Access Layer for the shopping cart system.
       It abstracts the complexities of EF Core queries, providing a clean interface
       for the Service layer to manage user carts and items.
     */
    public class CartRepository : ICartRepository
    {
        private readonly ApplicationDbContext _context;

        // Injecting the DbContext to interact with the SQL database
        public CartRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        /*  Retrieves a user's cart including all items and their associated
            product metadata (including images) via eager loading.
         */
        public async Task<Cart?> GetCartByUserIdAsync(string userId)
        {
            return await _context.Carts
                // .Include chains ensure we get the full object graph in one database trip
                .Include(c => c.CartItems)
                .ThenInclude(ci => ci.Product)
                .ThenInclude(p => p.ProductImages)
                .FirstOrDefaultAsync(c => c.UserId == userId);
        }

        // Initializes a new cart record for a specific user.
        public async Task<Cart> CreateCartAsync(string userId)
        {
            var cart = new Cart { UserId = userId };
            await _context.Carts.AddAsync(cart);
            await _context.SaveChangesAsync();
            return cart;
        }

        /*  Finds a specific product within a specific cart.
            Used to check if an item should be updated (quantity+) or added as new.
         */
        public async Task<CartItem?> GetCartItemAsync(int cartId, int productId)
        {
            return await _context.CartItems
                .FirstOrDefaultAsync(ci => ci.CartId == cartId && ci.ProductId == productId);
        }

        // Persists a new item to the cart_items table
        public async Task AddCartItemAsync(CartItem item)
        {
            await _context.CartItems.AddAsync(item);
            await _context.SaveChangesAsync();
        }

        // Updates an existing cart item (typically for quantity adjustments)
        public async Task UpdateCartItemAsync(CartItem item)
        {
            _context.CartItems.Update(item);
            await _context.SaveChangesAsync();
        }

        // Removes a specific line item from the database
        public async Task RemoveCartItemAsync(CartItem item)
        {
            _context.CartItems.Remove(item);
            await _context.SaveChangesAsync();
        }

        /*  Deletes all items associated with a specific cart ID.
            Commonly used after a successful order placement to reset the user's cart.
         */
        public async Task ClearCartAsync(int cartId)
        {
            // Fetch all items belonging to the cart
            var items = _context.CartItems.Where(ci => ci.CartId == cartId);
           
            // Perform a bulk removal
            _context.CartItems.RemoveRange(items);
            await _context.SaveChangesAsync();
        }
    }
}