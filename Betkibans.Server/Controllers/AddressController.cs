using Betkibans.Server.Data;
using Betkibans.Server.Models.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace Betkibans.Server.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class AddressController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public AddressController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetMyAddresses()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var addresses = await _context.Addresses
            .Where(a => a.UserId == userId)
            .OrderByDescending(a => a.IsDefault)
            .ThenByDescending(a => a.CreatedAt)
            .ToListAsync();
        return Ok(addresses);
    }

    [HttpPost]
    public async Task<IActionResult> AddAddress([FromBody] AddressDto dto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        // If this is set as default, unset all others first
        if (dto.IsDefault)
        {
            var existing = await _context.Addresses
                .Where(a => a.UserId == userId && a.IsDefault)
                .ToListAsync();
            existing.ForEach(a => a.IsDefault = false);
        }

        // If this is the first address, make it default automatically
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
            IsDefault = count == 0 ? true : dto.IsDefault,
            CreatedAt = DateTime.UtcNow
        };

        _context.Addresses.Add(address);
        await _context.SaveChangesAsync();
        return Ok(address);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateAddress(int id, [FromBody] AddressDto dto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var address = await _context.Addresses
            .FirstOrDefaultAsync(a => a.AddressId == id && a.UserId == userId);
        if (address == null) return NotFound();

        if (dto.IsDefault)
        {
            var existing = await _context.Addresses
                .Where(a => a.UserId == userId && a.IsDefault && a.AddressId != id)
                .ToListAsync();
            existing.ForEach(a => a.IsDefault = false);
        }

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

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteAddress(int id)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var address = await _context.Addresses
            .FirstOrDefaultAsync(a => a.AddressId == id && a.UserId == userId);
        if (address == null) return NotFound();

        _context.Addresses.Remove(address);
        await _context.SaveChangesAsync();

        // If deleted address was default, make the most recent one default
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

    [HttpPatch("{id}/set-default")]
    public async Task<IActionResult> SetDefault(int id)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        var all = await _context.Addresses.Where(a => a.UserId == userId).ToListAsync();
        all.ForEach(a => a.IsDefault = a.AddressId == id);

        await _context.SaveChangesAsync();
        return Ok(new { message = "Default address updated" });
    }
}

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