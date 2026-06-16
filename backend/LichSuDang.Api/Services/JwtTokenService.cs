using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using LichSuDang.Api.Domain;
using Microsoft.IdentityModel.Tokens;

namespace LichSuDang.Api.Services;

public class JwtTokenService
{
    private readonly IConfiguration _cfg;
    public JwtTokenService(IConfiguration cfg) => _cfg = cfg;

    public string Create(User user)
    {
        var key = _cfg["Jwt:Key"] ?? "dev-only-secret-key-change-me-please-32+chars";
        var creds = new SigningCredentials(
            new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key)), SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Name, user.Username),
            new Claim(ClaimTypes.Role, user.Role.ToString()),
        };

        var token = new JwtSecurityToken(
            issuer: _cfg["Jwt:Issuer"] ?? "LichSuDang",
            audience: _cfg["Jwt:Audience"] ?? "LichSuDang",
            claims: claims,
            expires: DateTime.UtcNow.AddDays(7),
            signingCredentials: creds);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
