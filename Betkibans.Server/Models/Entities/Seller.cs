using System.ComponentModel.DataAnnotations.Schema;

namespace Betkibans.Server.Models.Entities;

public class Seller
{
    public int SellerId { get; set; }
    public string UserId { get; set; } = string.Empty;

    [ForeignKey("UserId")]
    public virtual ApplicationUser User { get; set; } = null!;

    // ── Core Business Info ──
    public string BusinessName { get; set; } = string.Empty;
    public string? BusinessDescription { get; set; }
    public string? BusinessAddress { get; set; }
    public string? City { get; set; }
    public string? District { get; set; }

    // ── New Profile Fields ──
    public string? PhoneNumber { get; set; }
    public string? Website { get; set; }
    public string? BusinessHours { get; set; }
    public string? LogoUrl { get; set; }

    // ── Social Media ──
    public string? FacebookUrl { get; set; }
    public string? InstagramUrl { get; set; }

    // ── Verification ──
    public string? KycDocumentPath { get; set; }
    public bool IsVerified { get; set; } = false;
    public DateTime? VerifiedAt { get; set; }
    public string? VerifiedBy { get; set; }
    public string? RejectionReason { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // ── Navigation Properties ──
    public ICollection<Product> Products { get; set; } = new List<Product>();
    public ICollection<RepairQuote> RepairQuotes { get; set; } = new List<RepairQuote>();
}