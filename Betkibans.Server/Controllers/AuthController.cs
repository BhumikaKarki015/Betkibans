using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Web;
using Betkibans.Server.Models;
using Betkibans.Server.Dtos;
using Betkibans.Server.DTOs.Seller;
using Betkibans.Server.Data;
using Google.Apis.Auth;
using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using MimeKit;

namespace Betkibans.Server.Controllers;

/*
   AuthController manages the user lifecycle: registration, authentication,
   password recovery, and third-party (Google) integration.
   It utilizes ASP.NET Core Identity for user management and JWT for session handling.
 */
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

    /* ── Helper: Generate JWT ─────────────────────────────────────────
       Creates a signed JSON Web Token containing user identity and roles.
       The token is valid for 3 hours as per security policy.
     */
    private string GenerateJwt(ApplicationUser user, IList<string> roles)
    {
        // Define claims to be embedded in the token payload
        var authClaims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id),
            new Claim(ClaimTypes.Name, user.UserName ?? user.Email ?? ""),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
        };
        
        // Add each assigned role as a separate claim for role-based authorization
        foreach (var role in roles)
            authClaims.Add(new Claim(ClaimTypes.Role, role));

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["JwtConfig:Secret"]!));
        
        // Construct the token with specified issuer, audience, and expiration
        var token = new JwtSecurityToken(
            issuer: "http://localhost:5000",
            audience: "http://localhost:5000",
            expires: DateTime.Now.AddHours(3),
            claims: authClaims,
            signingCredentials: new SigningCredentials(key, SecurityAlgorithms.HmacSha256)
        );
        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    /* ── Helper: Send Email via Gmail SMTP ────────────────────────────
       Encapsulates the logic for sending system emails (like password resets).
       Uses MailKit and Google App Passwords for secure SMTP transport.
     */
    private async Task SendEmailAsync(string toEmail, string subject, string htmlBody)
    {
        var gmailEmail = _configuration["Gmail:Email"]!;
        var gmailPassword = _configuration["Gmail:AppPassword"]!;
        var displayName = _configuration["Gmail:DisplayName"] ?? "Betkibans";

        var message = new MimeMessage();
        message.From.Add(new MailboxAddress(displayName, gmailEmail));
        message.To.Add(new MailboxAddress("", toEmail));
        message.Subject = subject;
        message.Body = new TextPart("html") { Text = htmlBody };

        using var client = new SmtpClient();
        // Connect via STARTTLS on port 587
        await client.ConnectAsync("smtp.gmail.com", 587, SecureSocketOptions.StartTls);
        await client.AuthenticateAsync(gmailEmail, gmailPassword);
        await client.SendAsync(message);
        await client.DisconnectAsync(true);
    }

    /* Standard login endpoint.
       Validates credentials and returns a bearer token for subsequent requests.
     */
    // POST: api/Auth/login
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginDto model)
    {
        var user = await _userManager.FindByEmailAsync(model.Email);
        
        // Verify user existence and password hash
        if (user != null && await _userManager.CheckPasswordAsync(user, model.Password))
        {
            var roles = await _userManager.GetRolesAsync(user);
            var token = GenerateJwt(user, roles);
            return Ok(new { token, expiration = DateTime.Now.AddHours(3) });
        }
        return Unauthorized();
    }

    /* General user registration (Consumers and initial Seller setup).
       For Sellers, it initializes a record in the Sellers table but keeps it unverified.
     */
    // POST: api/Auth/register
    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterDto dto)
    {
        try
        {
            var existingUser = await _userManager.FindByEmailAsync(dto.Email);
            if (existingUser != null)
                return BadRequest(new { message = "Email already registered" });

            var user = new ApplicationUser
            {
                UserName = dto.Email,
                Email = dto.Email,
                FullName = dto.FullName,
                PhoneNumber = dto.PhoneNumber,
                EmailConfirmed = true
            };

            var result = await _userManager.CreateAsync(user, dto.Password);
            if (!result.Succeeded)
                return BadRequest(new { message = "User creation failed", errors = result.Errors });

            // Default to 'Consumer' if no role is provided
            string role = dto.Role ?? "Consumer";
            await _userManager.AddToRoleAsync(user, role);

            // If registering as a Seller, create the secondary profile record
            if (role == "Seller")
            {
                var seller = new Models.Entities.Seller
                {
                    UserId = user.Id,
                    BusinessName = "",
                    IsVerified = false,
                    CreatedAt = DateTime.UtcNow
                };
                _context.Sellers.Add(seller);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Seller account created successfully.", userId = user.Id, email = user.Email, role, needsProfileCompletion = true, isVerified = false });
            }

            return Ok(new { message = "Registration successful! You can now login.", userId = user.Id, email = user.Email, role });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Registration failed", error = ex.Message });
        }
    }

    /* Specialized registration for Sellers with full business details.
       Combines user creation and seller profile setup in a single transaction.
     */
    // POST: api/Auth/register-seller
    [HttpPost("register-seller")]
    public async Task<IActionResult> RegisterSeller([FromBody] RegisterSellerDto dto)
    {
        try
        {
            var existingUser = await _userManager.FindByEmailAsync(dto.Email);
            if (existingUser != null)
                return BadRequest(new { message = "Email already registered" });

            var user = new ApplicationUser
            {
                UserName = dto.Email,
                Email = dto.Email,
                FullName = dto.FullName,
                PhoneNumber = dto.PhoneNumber,
                EmailConfirmed = true
            };

            var result = await _userManager.CreateAsync(user, dto.Password);
            if (!result.Succeeded)
                return BadRequest(new { message = "User creation failed", errors = result.Errors });

            await _userManager.AddToRoleAsync(user, "Seller");

            // Populate specific Seller entity details from the DTO
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

            return Ok(new { message = "Seller registered successfully.", sellerId = seller.SellerId, email = user.Email, isVerified = false });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Registration failed", error = ex.Message });
        }
    }

    /*  Initiates the password reset process.
        Generates a secure token and sends a formatted HTML email to the user.
     */
    // POST: api/Auth/forgot-password
    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordDto dto)
    {
        var user = await _userManager.FindByEmailAsync(dto.Email);
        if (user == null)
            return BadRequest(new { message = "No account found with this email address." });

        // Identity generates a short-lived token specifically for password reset
        var token = await _userManager.GeneratePasswordResetTokenAsync(user);
        var appUrl = _configuration["AppUrl"] ?? "http://localhost:5173";
        var resetLink = $"{appUrl}/reset-password?email={HttpUtility.UrlEncode(dto.Email)}&token={HttpUtility.UrlEncode(token)}";

        // Structured HTML email template
        var html = $"""
            <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08)">
              <div style="background:#2D6A4F;padding:28px 32px;text-align:center">
                <h1 style="color:white;margin:0;font-size:24px">🌿 Betkibans</h1>
                <p style="color:rgba(255,255,255,0.8);margin:6px 0 0;font-size:13px">Authentic Nepali Bamboo & Cane Furniture</p>
              </div>
              <div style="padding:32px">
                <h2 style="color:#1a1a1a;margin-top:0">Reset Your Password</h2>
                <p style="color:#555;line-height:1.6">Hi {user.FullName ?? "there"},</p>
                <p style="color:#555;line-height:1.6">We received a request to reset your password. Click the button below to choose a new one.</p>
                <div style="text-align:center;margin:32px 0">
                  <a href="{resetLink}" style="background:#2D6A4F;color:white;padding:14px 36px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px;display:inline-block">
                    Reset Password
                  </a>
                </div>
                <p style="color:#888;font-size:13px;line-height:1.6">This link will expire in 24 hours. If you didn't request a password reset, you can safely ignore this email.</p>
                <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
                <p style="color:#aaa;font-size:12px;text-align:center">© 2026 Betkibans. All Rights Reserved.</p>
              </div>
            </div>
            """;

        try
        {
            await SendEmailAsync(dto.Email, "Reset Your Betkibans Password", html);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Failed to send email. Please try again.", error = ex.Message });
        }

        return Ok(new { message = "Password reset link sent to your email." });
    }

    // Finalizes the password reset using the token provided in the email link.
    // POST: api/Auth/reset-password
    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordDto dto)
    {
        var user = await _userManager.FindByEmailAsync(dto.Email);
        if (user == null)
            return BadRequest(new { message = "Invalid request." });

        var result = await _userManager.ResetPasswordAsync(user, dto.Token, dto.NewPassword);
        if (!result.Succeeded)
        {
            var errors = string.Join(", ", result.Errors.Select(e => e.Description));
            return BadRequest(new { message = errors });
        }

        return Ok(new { message = "Password reset successfully. You can now log in." });
    }

    /*  Handles Google OAuth 2.0 flow.
        Validates the Google ID Token and auto-registers the user if they don't exist.
     */
    // POST: api/Auth/google-signin
    [HttpPost("google-signin")]
    public async Task<IActionResult> GoogleSignIn([FromBody] GoogleSignInDto dto)
    {
        try
        {
            var clientId = _configuration["Google:ClientId"]!;
            var settings = new GoogleJsonWebSignature.ValidationSettings
            {
                Audience = new[] { clientId }
            };

            GoogleJsonWebSignature.Payload payload;
            try
            {
                // Verify that the token is authentic and issued by Google
                payload = await GoogleJsonWebSignature.ValidateAsync(dto.IdToken, settings);
            }
            catch
            {
                return Unauthorized(new { message = "Invalid Google token." });
            }

            // check if user exists in local database, otherwise provision a new account
            var user = await _userManager.FindByEmailAsync(payload.Email);
            if (user == null)
            {
                user = new ApplicationUser
                {
                    UserName = payload.Email,
                    Email = payload.Email,
                    FullName = payload.Name,
                    EmailConfirmed = true,
                    CreatedAt = DateTime.UtcNow
                };

                var result = await _userManager.CreateAsync(user);
                if (!result.Succeeded)
                    return BadRequest(new { message = "Failed to create account." });

                // Social logins are defaulted to the Consumer role
                await _userManager.AddToRoleAsync(user, "Consumer");
            }

            var roles = await _userManager.GetRolesAsync(user);
            var token = GenerateJwt(user, roles);

            return Ok(new
            {
                token,
                expiration = DateTime.Now.AddHours(3),
                isNewUser = false
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Google sign-in failed.", error = ex.Message });
        }
    }
}

// Data Transfer Objects for Auth operations
public class ForgotPasswordDto
{
    public string Email { get; set; } = string.Empty;
}

public class ResetPasswordDto
{
    public string Email { get; set; } = string.Empty;
    public string Token { get; set; } = string.Empty;
    public string NewPassword { get; set; } = string.Empty;
}

public class GoogleSignInDto
{
    public string IdToken { get; set; } = string.Empty;
}