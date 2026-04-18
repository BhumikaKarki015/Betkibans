using Betkibans.Server.Data;
using Betkibans.Server.Models.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace Betkibans.Server.Controllers;

/*
   AddressController handles all CRUD (Create, Read, Update, Delete) operations
   related to user shipping/billing addresses. Access is restricted to
   authorized users only.
 */

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class AddressController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    
    // Injecting the database context via constructor

    public AddressController(ApplicationDbContext context)
    {
        _context = context;
    }

    /* Retrieves all addresses belonging to the currently logged-in user.
       Orders them by the 'Default' status first, then by creation date.
     */
    [HttpGet]
    public async Task<IActionResult> GetMyAddresses()
    {
        // Extract the unique User ID from the JWT claims
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var addresses = await _context.Addresses
            .Where(a => a.UserId == userId)
            .OrderByDescending(a => a.IsDefault)
            .ThenByDescending(a => a.CreatedAt)
            .ToListAsync();
        return Ok(addresses);
    }

    /* Creates a new address for the user.
       Includes logic to ensure only one address is marked as default.
     */
    [HttpPost]
    public async Task<IActionResult> AddAddress([FromBody] AddressDto dto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        // If the new address is set as default, unset the 'IsDefault' flag on all existing addresses
        if (dto.IsDefault)
        {
            var existing = await _context.Addresses
                .Where(a => a.UserId == userId && a.IsDefault)
                .ToListAsync();
            existing.ForEach(a => a.IsDefault = false);
        }

        // Count existing addresses to check if this is the user's first entry
        var count = await _context.Addresses.CountAsync(a => a.UserId == userId);
        
        var address = new Address
        {
            UserId = userId!,
            FullName = dto.FullName,
            PhoneNumber = dto.PhoneNumber,
            AddressLine1 = dto.AddressLine1,
            AddressLine2 = dto.AddressLine2,
            City = dto.City,
            District = dto.District,
            Landmark = dto.Landmark,
            PostalCode = dto.PostalCode,
            // Automatically make the first address default, otherwise use the DTO value
            IsDefault = count == 0 ? true : dto.IsDefault,
            CreatedAt = DateTime.UtcNow
        };

        _context.Addresses.Add(address);
        await _context.SaveChangesAsync();
        return Ok(address);
    }

    /* Updates an existing address record.
       Ensures the user can only update their own addresses.
     */
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateAddress(int id, [FromBody] AddressDto dto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var address = await _context.Addresses
            .FirstOrDefaultAsync(a => a.AddressId == id && a.UserId == userId);
        if (address == null) return NotFound();

        // If this update sets the current address to default, unset other defaults
        if (dto.IsDefault)
        {
            var existing = await _context.Addresses
                .Where(a => a.UserId == userId && a.IsDefault && a.AddressId != id)
                .ToListAsync();
            existing.ForEach(a => a.IsDefault = false);
        }

        // Mapping updated values from DTO to Entity
        address.FullName = dto.FullName;
        address.PhoneNumber = dto.PhoneNumber;
        address.AddressLine1 = dto.AddressLine1;
        address.AddressLine2 = dto.AddressLine2;
        address.City = dto.City;
        address.District = dto.District;
        address.Landmark = dto.Landmark;
        address.PostalCode = dto.PostalCode;
        address.IsDefault = dto.IsDefault;

        await _context.SaveChangesAsync();
        return Ok(address);
    }

    /* Removes an address from the database.
       If the deleted address was the default, the next most recent address is promoted to default.
     */
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteAddress(int id)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var address = await _context.Addresses
            .FirstOrDefaultAsync(a => a.AddressId == id && a.UserId == userId);
        if (address == null) return NotFound();

        _context.Addresses.Remove(address);
        await _context.SaveChangesAsync();

        // Fallback logic to ensure the user always has a default address if records exist
        if (address.IsDefault)
        {
            var next = await _context.Addresses
                .Where(a => a.UserId == userId)
                .OrderByDescending(a => a.CreatedAt)
                .FirstOrDefaultAsync();
            if (next != null) { next.IsDefault = true; await _context.SaveChangesAsync(); }
        }

        return Ok(new { message = "Address deleted" });
    }

    /* Explicitly sets a specific address as the default.
       All other addresses for the user will have IsDefault set to false.
     */
    [HttpPatch("{id}/set-default")]
    public async Task<IActionResult> SetDefault(int id)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        // Fetch all addresses for the user and update the boolean flag based on the ID match
        var all = await _context.Addresses.Where(a => a.UserId == userId).ToListAsync();
        all.ForEach(a => a.IsDefault = a.AddressId == id);

        await _context.SaveChangesAsync();
        return Ok(new { message = "Default address updated" });
    }
}

/*
   Data Transfer Object (DTO) for Address.
   Used to receive address data from the client in a clean format.
 */
public class AddressDto
{
    public string FullName { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string AddressLine1 { get; set; } = string.Empty;
    public string? AddressLine2 { get; set; }
    public string City { get; set; } = string.Empty;
    public string District { get; set; } = string.Empty;
    public string? Landmark { get; set; }
    public string? PostalCode { get; set; }
    public bool IsDefault { get; set; } = false;
}