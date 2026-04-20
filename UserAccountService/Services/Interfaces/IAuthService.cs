using UserAccountService.DTOs.Requests;
using UserAccountService.DTOs.Responses;

namespace UserAccountService.Services.Interfaces;

public interface IAuthService
{
    Task<AuthResponse> Register(RegisterRequest request);
    Task<AuthResponse> Login(LoginRequest request);
    Task<UserDto> GetProfile(Guid userId);
}
