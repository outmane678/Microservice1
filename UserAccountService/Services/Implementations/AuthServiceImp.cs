using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using UserAccountService.Data;
using UserAccountService.DTOs.Requests;
using UserAccountService.DTOs.Responses;
using UserAccountService.Models.Entities;
using UserAccountService.Services.Interfaces;

namespace UserAccountService.Services.Implementations;

public class AuthServiceImp : IAuthService
{
    private readonly AppDbContext _context;
    private readonly IConfiguration _configuration;

    public AuthServiceImp(AppDbContext context, IConfiguration configuration)
    {
        _context = context;
        _configuration = configuration;
    }

    public async Task<AuthResponse> Register(RegisterRequest request)
    {
        var existingUser = await _context.UserAccounts
            .AnyAsync(u => u.Email == request.Email);

        if (existingUser)
            throw new Exception("Un compte avec cet email existe déjà.");

        var user = new UserAccount
        {
            FirstName = request.FirstName,
            LastName = request.LastName,
            Email = request.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password)
        };

        _context.UserAccounts.Add(user);
        await _context.SaveChangesAsync();

        var token = GenerateJwtToken(user);

        return new AuthResponse
        {
            Token = token,
            User = MapToDto(user)
        };
    }

    public async Task<AuthResponse> Login(LoginRequest request)
    {
        var user = await _context.UserAccounts
            .FirstOrDefaultAsync(u => u.Email == request.Email);

        if (user == null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            throw new Exception("Email ou mot de passe incorrect.");

        var token = GenerateJwtToken(user);

        return new AuthResponse
        {
            Token = token,
            User = MapToDto(user)
        };
    }

    public async Task<UserDto> GetProfile(Guid userId)
    {
        var user = await _context.UserAccounts.FindAsync(userId);

        if (user == null)
            throw new Exception("Utilisateur introuvable.");

        return MapToDto(user);
    }

    private string GenerateJwtToken(UserAccount user)
    {
        var jwtConfig = _configuration.GetSection("Jwt");
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtConfig["Key"]!));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.GivenName, user.FirstName),
            new Claim(ClaimTypes.Surname, user.LastName)
        };

        var expiresInHours = int.Parse(jwtConfig["ExpiresInHours"] ?? "24");

        var token = new JwtSecurityToken(
            issuer: jwtConfig["Issuer"],
            audience: jwtConfig["Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddHours(expiresInHours),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private static UserDto MapToDto(UserAccount user) => new()
    {
        Id = user.Id,
        FirstName = user.FirstName,
        LastName = user.LastName,
        Email = user.Email
    };
}
