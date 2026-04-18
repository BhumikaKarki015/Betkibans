using Betkibans.Server.Dtos.Category;
using Betkibans.Server.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Betkibans.Server.Controllers
{
    /*
       CategoryController manages the product classification system.
       It allows public access for viewing categories but restricts
       management (Create/Delete) to administrative users.
     */
    [Route("api/[controller]")]
    [ApiController]
    public class CategoryController : ControllerBase
    {
        // Using an interface for the service layer to promote decoupling and easier unit testing
        private readonly ICategoryService _categoryService;

        public CategoryController(ICategoryService categoryService)
        {
            _categoryService = categoryService;
        }

        /* Returns a list of all product categories available on the platform.
           Useful for populating navigation menus or search filters.
         */
        [HttpGet]
        public async Task<ActionResult<IEnumerable<CategoryResponseDto>>> GetCategories()
        {
            var categories = await _categoryService.GetAllCategoriesAsync();
            return Ok(categories);
        }

        // Retrieves details for a specific category based on its unique ID.
        [HttpGet("{id}")]
        public async Task<ActionResult<CategoryResponseDto>> GetCategory(int id)
        {
            var category = await _categoryService.GetCategoryByIdAsync(id);
            
            // Return 404 if the category doesn't exist in the database
            if (category == null) return NotFound();
            return Ok(category);
        }

        /* Adds a new category to the system.
           Restricted to 'Admin' role to maintain catalog integrity.
         */
        [HttpPost]
        [Authorize(Roles = "Admin")] // Only Admins should be able to create categories
        public async Task<ActionResult<CategoryResponseDto>> CreateCategory(CreateCategoryDto createDto)
        {
            var result = await _categoryService.CreateCategoryAsync(createDto);
            
            // Returns a 201 Created status and includes the location of the new resource
            return CreatedAtAction(nameof(GetCategory), new { id = result.CategoryId }, result);
        }

        /* Deletes a category from the system.
           Logic within the service usually checks if the category is empty before deletion.
         */
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteCategory(int id)
        {
            var result = await _categoryService.DeleteCategoryAsync(id);
            if (!result) return NotFound();
            
            // Return 204 No Content to indicate successful deletion with no body to return
            return NoContent();
        }
    }
}