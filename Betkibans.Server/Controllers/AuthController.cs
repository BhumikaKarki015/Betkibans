using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Betkibans.Server.Models;
using Betkibans.Server.Dtos;
using Betkibans.Server.DTOs.Seller;
using Betkibans.Server.Data;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;

namespace Betkibans.Server.Controllers;

[Route("api/[controller]")]
[ApiController]
public class AuthController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly IConfiguration _configuration;
    private readonly ApplicationDbContext _context;
    
    public AuthController(UserManager<ApplicationUser> userManager, IConfiguration configuration, ApplicationDbContext context)
    {
        _userManager = userManager;
        _configuration = configuration;
        _context = context;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginDto model)
    {
        var user = await _userManager.FindByEmailAsync(model.Email);
        if (user != null && await _userManager.CheckPasswordAsync(user, model.Password))
        {
            var userRoles = await _userManager.GetRolesAsync(user);
            var authClaims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id),
                new Claim(ClaimTypes.Name, user.UserName),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            };

            foreach (var role in userRoles)
            {
                authClaims.Add(new Claim(ClaimTypes.Role, role));
            }

            var authSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["JwtConfig:Secret"]));

            var token = new JwtSecurityToken(
                issuer: "http://localhost:5000",
                audience: "http://localhost:5000",
                expires: DateTime.Now.AddHours(3),
                claims: authClaims,
                signingCredentials: new SigningCredentials(authSigningKey, SecurityAlgorithms.HmacSha256)
            );

            return Ok(new
            {
                token = new JwtSecurityTokenHandler().WriteToken(token),
                expiration = token.ValidTo
            });
        }
        return Unauthorized();
    }
    
    [HttpPost("register")]
public async Task<IActionResult> Register([FromBody] RegisterDto dto)
{
    try
    {
        // Checking if email already exists
        var existingUser = await _userManager.FindByEmailAsync(dto.Email);
        if (existingUser != null)
        {
            return BadRequest(new { message = "Email already registered" });
        }

        // Creating ApplicationUser
        var user = new ApplicationUser
        {
            UserName = dto.Email,
            Email = dto.Email,
            FullName = dto.FullName,
            PhoneNumber = dto.PhoneNumber,
            EmailConfirmed = true
        };

        // Creating user account
        var result = await _userManager.CreateAsync(user, dto.Password);
        if (!result.Succeeded)
        {
            return BadRequest(new { message = "User creation failed", errors = result.Errors });
        }

        // Determine role (default to Consumer if it is not specified)
        string role = dto.Role ?? "Consumer";
        
        // Assigning role
        await _userManager.AddToRoleAsync(user, role);

        // If Seller role, create Seller profile automatically
        if (role == "Seller")
        {
            var seller = new Models.Entities.Seller
            {
                UserId = user.Id,
                BusinessName = "", // Empty - will be completed later on
                IsVerified = false,
                CreatedAt = DateTime.UtcNow
            };

            _context.Sellers.Add(seller);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Seller account created successfully. Please complete your business profile.",
                userId = user.Id,
                email = user.Email,
                role = role,
                needsProfileCompletion = true,
                isVerified = false
            });
        }

        // Consumer registration
        return Ok(new
        {
            message = "Registration successful! You can now login.",
            userId = user.Id,
            email = user.Email,
            role = role
        });
    }
    catch (Exception ex)
    {
        return StatusCode(500, new { message = "Registration failed", error = ex.Message });
    }
}
    
    // POST: api/auth/register-seller
    [HttpPost("register-seller")]
    public async Task<IActionResult> RegisterSeller([FromBody] RegisterSellerDto dto)
    {
        try
        {
            // Check if email already exists
            var existingUser = await _userManager.FindByEmailAsync(dto.Email);
            if (existingUser != null)
            {
                return BadRequest(new { message = "Email already registered" });
            }

            // Create ApplicationUser
            var user = new ApplicationUser
            {
                UserName = dto.Email,
                Email = dto.Email,
                FullName = dto.FullName,
                PhoneNumber = dto.PhoneNumber,
                EmailConfirmed = true
            };

            // Create user account
            var result = await _userManager.CreateAsync(user, dto.Password);
            if (!result.Succeeded)
            {
                return BadRequest(new { message = "User creation failed", errors = result.Errors });
            }

            // Assign Seller role
            await _userManager.AddToRoleAsync(user, "Seller");

            // Create Seller profile (UNVERIFIED)
            var seller = new Models.Entities.Seller
            {
                UserId = user.Id,
                BusinessName = dto.BusinessName,
                BusinessDescription = dto.BusinessDescription,
                BusinessAddress = dto.BusinessAddress,
                City = dto.City,
                District = dto.District,
                IsVerified = false, 
                CreatedAt = DateTime.UtcNow
            };

            _context.Sellers.Add(seller);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Seller registered successfully. Please upload KYC documents for verification.",
                sellerId = seller.SellerId,
                email = user.Email,
                isVerified = false
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Registration failed", error = ex.Message });
        }
    }
}