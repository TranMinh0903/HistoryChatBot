using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LichSuDang.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddChatMessageSources : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Sources",
                table: "chat_messages",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Sources",
                table: "chat_messages");
        }
    }
}
