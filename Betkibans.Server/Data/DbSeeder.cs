using Microsoft.AspNetCore.Identity;
using Betkibans.Server.Models;

namespace Betkibans.Server.Data;

public static class DbSeeder
{
    public static async Task SeedRolesAndAdminAsync(IServiceProvider service)
    {
        var userManager = service.GetService<UserManager<ApplicationUser>>();
        var roleManager = service.GetService<RoleManager<IdentityRole>>();

        // Creating Roles
        string[] roleNames = { "Admin", "Seller", "Consumer" };
        foreach (var roleName in roleNames)
        {
            if (!await roleManager.RoleExistsAsync(roleName))
            {
                await roleManager.CreateAsync(new IdentityRole(roleName));
            }
        }

        // Creating Admin User (admin@betkibans.com / Admin@123)
        var adminEmail = "admin@betkibans.com";
        var adminUser = await userManager.FindByEmailAsync(adminEmail);

        if (adminUser == null)
        {
            var newAdmin = new ApplicationUser
            {
                UserName = adminEmail,
                Email = adminEmail,
                EmailConfirmed = true,
                FullName = "System Administrator"
            };
            await userManager.CreateAsync(newAdmin, "Admin@123"); 
            await userManager.AddToRoleAsync(newAdmin, "Admin");
        }
    }
}