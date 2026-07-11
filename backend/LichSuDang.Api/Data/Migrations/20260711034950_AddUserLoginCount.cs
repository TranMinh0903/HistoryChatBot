using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LichSuDang.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddUserLoginCount : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "LoginCount",
                table: "users",
                type: "integer",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "LoginCount",
                table: "users");
        }
    }
}
