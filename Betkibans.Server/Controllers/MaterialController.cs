using Betkibans.Server.Dtos.Material;
using Betkibans.Server.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Betkibans.Server.Controllers
{
    /*
       MaterialController manages the raw materials used in product manufacturing
       (e.g., specific types of Bamboo, Cane, or fabric).
       It provides a catalog of materials for users and management tools for admins.
     */
    [Route("api/[controller]")]
    [ApiController]
    public class MaterialController : ControllerBase
    {
        private readonly IMaterialService _materialService;

        // Dependency Injection of the material service layer
        public MaterialController(IMaterialService materialService)
        {
            _materialService = materialService;
        }

        /* Retrieves a complete list of all materials registered in the system.
           Typically used for filtering products by material type.
         */
        [HttpGet]
        public async Task<ActionResult<IEnumerable<MaterialResponseDto>>> GetMaterials()
        {
            var materials = await _materialService.GetAllMaterialsAsync();
            return Ok(materials);
        }

        // Fetches detailed information for a specific material using its unique ID.
        [HttpGet("{id}")]
        public async Task<ActionResult<MaterialResponseDto>> GetMaterial(int id)
        {
            var material = await _materialService.GetMaterialByIdAsync(id);
           
            // Returns 404 if the requested material does not exist
            if (material == null) return NotFound();
            return Ok(material);
        }

        /* Adds a new material type to the system.
           Access is restricted to users with the 'Admin' role.
         */
        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<MaterialResponseDto>> CreateMaterial(CreateMaterialDto createDto)
        {
            var result = await _materialService.CreateMaterialAsync(createDto);
           
            // Return 201 Created and the URI for the newly created resource
            return CreatedAtAction(nameof(GetMaterial), new { id = result.MaterialId }, result);
        }

        /* Updates an existing material's information (Name, Description, etc.).
           Restricted to Admins.
         */
        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateMaterial(int id, CreateMaterialDto updateDto)
        {
            var result = await _materialService.UpdateMaterialAsync(id, updateDto);
            if (!result) return NotFound();
            
            // Return 204 No Content for a successful update with no response body
            return NoContent();
        }

        // Removes a material from the system permanently.
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteMaterial(int id)
        {
            var result = await _materialService.DeleteMaterialAsync(id);
            if (!result) return NotFound();
            return NoContent();
        }
    }
}