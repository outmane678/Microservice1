using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using UserAccountService.Data;
using UserAccountService.DTOs.Requests;
using UserAccountService.Services.Implementations;

namespace UserAccountService.Tests.Services;

public class AuthServiceImpTests : IDisposable
{
    private readonly AppDbContext _context;
    private readonly AuthServiceImp _sut;

    public AuthServiceImpTests()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        _context = new AppDbContext(options);

        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                { "Jwt:Key", "SuperSecretKeyForTesting_MustBeAtLeast32Characters!" },
                { "Jwt:Issuer", "TestIssuer" },
                { "Jwt:Audience", "TestAudience" },
                { "Jwt:ExpiresInHours", "1" }
            })
            .Build();

        _sut = new AuthServiceImp(_context, config);
    }

    public void Dispose()
    {
        _context.Dispose();
    }

    // ======================== Register ========================

    [Fact]
    public async Task Register_Should_Create_User_And_Return_Token()
    {
        var request = new RegisterRequest
        {
            FirstName = "John",
            LastName = "Doe",
            Email = "john@test.com",
            Password = "password123"
        };

        var result = await _sut.Register(request);

        Assert.NotNull(result.Token);
        Assert.NotEmpty(result.Token);
        Assert.Equal("John", result.User.FirstName);
        Assert.Equal("Doe", result.User.LastName);
        Assert.Equal("john@test.com", result.User.Email);
        Assert.NotEqual(Guid.Empty, result.User.Id);
    }

    [Fact]
    public async Task Register_Should_Persist_User_In_Database()
    {
        var request = new RegisterRequest
        {
            FirstName = "Jane",
            LastName = "Doe",
            Email = "jane@test.com",
            Password = "password123"
        };

        await _sut.Register(request);

        var user = await _context.UserAccounts.FirstOrDefaultAsync(u => u.Email == "jane@test.com");
        Assert.NotNull(user);
        Assert.Equal("Jane", user!.FirstName);
    }

    [Fact]
    public async Task Register_Should_Hash_Password()
    {
        var request = new RegisterRequest
        {
            FirstName = "Test",
            LastName = "User",
            Email = "hash@test.com",
            Password = "mypassword"
        };

        await _sut.Register(request);

        var user = await _context.UserAccounts.FirstAsync(u => u.Email == "hash@test.com");
        Assert.NotEqual("mypassword", user.PasswordHash);
        Assert.True(BCrypt.Net.BCrypt.Verify("mypassword", user.PasswordHash));
    }

    [Fact]
    public async Task Register_Should_Throw_When_Email_Already_Exists()
    {
        var request = new RegisterRequest
        {
            FirstName = "First",
            LastName = "User",
            Email = "duplicate@test.com",
            Password = "password123"
        };
        await _sut.Register(request);

        var duplicate = new RegisterRequest
        {
            FirstName = "Second",
            LastName = "User",
            Email = "duplicate@test.com",
            Password = "password456"
        };

        var ex = await Assert.ThrowsAsync<Exception>(() => _sut.Register(duplicate));
        Assert.Contains("existe déjà", ex.Message);
    }

    // ======================== Login ========================

    [Fact]
    public async Task Login_Should_Return_Token_When_Valid_Credentials()
    {
        await _sut.Register(new RegisterRequest
        {
            FirstName = "Login",
            LastName = "Test",
            Email = "login@test.com",
            Password = "password123"
        });

        var result = await _sut.Login(new LoginRequest
        {
            Email = "login@test.com",
            Password = "password123"
        });

        Assert.NotNull(result.Token);
        Assert.NotEmpty(result.Token);
        Assert.Equal("login@test.com", result.User.Email);
    }

    [Fact]
    public async Task Login_Should_Throw_When_Email_Not_Found()
    {
        var ex = await Assert.ThrowsAsync<Exception>(() => _sut.Login(new LoginRequest
        {
            Email = "notfound@test.com",
            Password = "password123"
        }));

        Assert.Contains("incorrect", ex.Message);
    }

    [Fact]
    public async Task Login_Should_Throw_When_Wrong_Password()
    {
        await _sut.Register(new RegisterRequest
        {
            FirstName = "Wrong",
            LastName = "Pass",
            Email = "wrongpass@test.com",
            Password = "correctpassword"
        });

        var ex = await Assert.ThrowsAsync<Exception>(() => _sut.Login(new LoginRequest
        {
            Email = "wrongpass@test.com",
            Password = "wrongpassword"
        }));

        Assert.Contains("incorrect", ex.Message);
    }

    // ======================== GetProfile ========================

    [Fact]
    public async Task GetProfile_Should_Return_User_When_Exists()
    {
        var registered = await _sut.Register(new RegisterRequest
        {
            FirstName = "Profile",
            LastName = "Test",
            Email = "profile@test.com",
            Password = "password123"
        });

        var profile = await _sut.GetProfile(registered.User.Id);

        Assert.Equal("Profile", profile.FirstName);
        Assert.Equal("Test", profile.LastName);
        Assert.Equal("profile@test.com", profile.Email);
    }

    [Fact]
    public async Task GetProfile_Should_Throw_When_User_Not_Found()
    {
        var ex = await Assert.ThrowsAsync<Exception>(() => _sut.GetProfile(Guid.NewGuid()));
        Assert.Contains("introuvable", ex.Message);
    }
}
