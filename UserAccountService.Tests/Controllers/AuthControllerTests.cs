using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using System.Security.Claims;
using UserAccountService.Controllers;
using UserAccountService.DTOs.Requests;
using UserAccountService.DTOs.Responses;
using UserAccountService.Services.Interfaces;

namespace UserAccountService.Tests.Controllers;

public class AuthControllerTests
{
    private readonly Mock<IAuthService> _authService;
    private readonly AuthController _controller;

    public AuthControllerTests()
    {
        _authService = new Mock<IAuthService>();
        _controller = new AuthController(_authService.Object);
    }

    // ======================== Register ========================

    [Fact]
    public async Task Register_Should_Return_Ok_When_Valid()
    {
        var request = new RegisterRequest
        {
            FirstName = "John",
            LastName = "Doe",
            Email = "john@test.com",
            Password = "password123"
        };
        var response = new AuthResponse
        {
            Token = "jwt-token",
            User = new UserDto { Id = Guid.NewGuid(), FirstName = "John", LastName = "Doe", Email = "john@test.com" }
        };

        _authService.Setup(s => s.Register(request)).ReturnsAsync(response);

        var result = await _controller.Register(request);

        var okResult = Assert.IsType<OkObjectResult>(result);
        var body = Assert.IsType<AuthResponse>(okResult.Value);
        Assert.Equal("jwt-token", body.Token);
        Assert.Equal("John", body.User.FirstName);
    }

    [Fact]
    public async Task Register_Should_Return_BadRequest_When_Duplicate_Email()
    {
        var request = new RegisterRequest
        {
            FirstName = "John",
            LastName = "Doe",
            Email = "duplicate@test.com",
            Password = "password123"
        };

        _authService.Setup(s => s.Register(request))
            .ThrowsAsync(new Exception("Un compte avec cet email existe déjà."));

        var result = await _controller.Register(request);

        Assert.IsType<BadRequestObjectResult>(result);
    }

    // ======================== Login ========================

    [Fact]
    public async Task Login_Should_Return_Ok_When_Valid()
    {
        var request = new LoginRequest { Email = "john@test.com", Password = "password123" };
        var response = new AuthResponse
        {
            Token = "jwt-token",
            User = new UserDto { Id = Guid.NewGuid(), FirstName = "John", LastName = "Doe", Email = "john@test.com" }
        };

        _authService.Setup(s => s.Login(request)).ReturnsAsync(response);

        var result = await _controller.Login(request);

        var okResult = Assert.IsType<OkObjectResult>(result);
        var body = Assert.IsType<AuthResponse>(okResult.Value);
        Assert.Equal("jwt-token", body.Token);
    }

    [Fact]
    public async Task Login_Should_Return_BadRequest_When_Invalid_Credentials()
    {
        var request = new LoginRequest { Email = "bad@test.com", Password = "wrong" };

        _authService.Setup(s => s.Login(request))
            .ThrowsAsync(new Exception("Email ou mot de passe incorrect."));

        var result = await _controller.Login(request);

        Assert.IsType<BadRequestObjectResult>(result);
    }

    // ======================== GetProfile ========================

    [Fact]
    public async Task GetProfile_Should_Return_Ok_When_Authenticated()
    {
        var userId = Guid.NewGuid();
        var userDto = new UserDto
        {
            Id = userId,
            FirstName = "John",
            LastName = "Doe",
            Email = "john@test.com"
        };

        _authService.Setup(s => s.GetProfile(userId)).ReturnsAsync(userDto);

        var claims = new[] { new Claim(ClaimTypes.NameIdentifier, userId.ToString()) };
        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                User = new ClaimsPrincipal(new ClaimsIdentity(claims, "Test"))
            }
        };

        var result = await _controller.GetProfile();

        var okResult = Assert.IsType<OkObjectResult>(result);
        var body = Assert.IsType<UserDto>(okResult.Value);
        Assert.Equal("John", body.FirstName);
    }

    [Fact]
    public async Task GetProfile_Should_Return_Unauthorized_When_No_Claim()
    {
        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                User = new ClaimsPrincipal(new ClaimsIdentity())
            }
        };

        var result = await _controller.GetProfile();

        Assert.IsType<UnauthorizedResult>(result);
    }

    [Fact]
    public async Task GetProfile_Should_Return_NotFound_When_User_Not_Found()
    {
        var userId = Guid.NewGuid();

        _authService.Setup(s => s.GetProfile(userId))
            .ThrowsAsync(new Exception("Utilisateur introuvable."));

        var claims = new[] { new Claim(ClaimTypes.NameIdentifier, userId.ToString()) };
        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                User = new ClaimsPrincipal(new ClaimsIdentity(claims, "Test"))
            }
        };

        var result = await _controller.GetProfile();

        Assert.IsType<NotFoundObjectResult>(result);
    }
}
