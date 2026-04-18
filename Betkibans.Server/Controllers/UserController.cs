using Betkibans.Server.Data;
using Betkibans.Server.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Betkibans.Server.Controllers;

/*
   UserController handles personal account management for all registered users.
   It leverages ASP.NET Core Identity's UserManager to perform secure profile
   updates and password changes without exposing sensitive internal data.
 */
[Route("api/[controller]")]
[ApiController]
[Authorize]
public class UserController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly UserManager<ApplicationUser> _userManager;

    public UserController(ApplicationDbContext context, UserManager<ApplicationUser> userManager)
    {
        _context = context;
        _userManager = userManager;
    }

    /* Fetches the profile details for the currently authenticated user.
       Uses the 'NameIdentifier' claim to locate the user in the Identity store.
     */
    [HttpGet("profile")]
    public async Task<IActionResult> GetProfile()
    {
        // Extract the unique ID from the user's JWT
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var user = await _userManager.FindByIdAsync(userId);
        if (user == null) return NotFound();

        // Returns a safe subset of user data (excluding password hashes or security stamps)
        return Ok(new
        {
            id = user.Id,
            fullName = user.FullName,
            email = user.Email,
            phoneNumber = user.PhoneNumber,
            createdAt = user.CreatedAt == DateTime.MinValue ? DateTime.UtcNow : user.CreatedAt
        });
    }

    /* Updates the basic profile information for the user.
       Identity handles the heavy lifting of updating the normalized records.
     */
    [HttpPut("profile")]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileDto dto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var user = await _userManager.FindByIdAsync(userId);
        if (user == null) return NotFound();

        // Update basic fields
        user.FullName = dto.FullName;
        user.PhoneNumber = dto.PhoneNumber;

        // Persist changes using the built-in Identity update method
        var result = await _userManager.UpdateAsync(user);
        if (!result.Succeeded)
            return BadRequest(new { message = "Failed to update profile" });

        return Ok(new
        {
            id = user.Id,
            fullName = user.FullName,
            email = user.Email,
            phoneNumber = user.PhoneNumber,
        });
    }
    
    /* Securely updates a user's password.
       This method requires the current password to prevent account takeover
       in the event of a session being hijacked.
     */
    [HttpPost("change-password")]
    [Authorize]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto dto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var user = await _userManager.FindByIdAsync(userId!);
        if (user == null) return NotFound();

        /*  ChangePasswordAsync performs two critical tasks:
            1. Verifies that 'CurrentPassword' matches the hash in the DB.
            2. Hashes and saves 'NewPassword' while updating the security stamp.
         */
        var result = await _userManager.ChangePasswordAsync(user, dto.CurrentPassword, dto.NewPassword);
        if (!result.Succeeded)
            // Identity provides localized error messages (e.g., "Password too short")
            return BadRequest(new { message = result.Errors.FirstOrDefault()?.Description ?? "Failed to change password" });

        return Ok(new { message = "Password changed successfully" });
    }
}

// DTOs for user account management.
public class UpdateProfileDto
{
    public string FullName { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
}

public class ChangePasswordDto
{
    public string CurrentPassword { get; set; } = string.Empty;
    public string NewPassword { get; set; } = string.Empty;
}