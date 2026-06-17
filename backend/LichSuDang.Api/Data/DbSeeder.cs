using LichSuDang.Api.Domain;
using Microsoft.EntityFrameworkCore;

namespace LichSuDang.Api.Data;

public static class DbSeeder
{
    public static async Task SeedAsync(AppDbContext db)
    {
        await db.Database.MigrateAsync();

        // Tài khoản admin mặc định (đổi mật khẩu khi lên production!)
        if (!await db.Users.AnyAsync(u => u.Role == Role.Admin))
        {
            db.Users.Add(new User
            {
                Username = "admin",
                DisplayName = "Quản trị viên",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("admin123"),
                Role = Role.Admin,
                LastLoginAt = DateTime.UtcNow,
            });
            await db.SaveChangesAsync();
        }

        if (!await db.QuizQuestions.AnyAsync())
        {
            db.QuizQuestions.AddRange(Questions());
            await db.SaveChangesAsync();
        }
        if (!await db.Flashcards.AnyAsync())
        {
            db.Flashcards.AddRange(Flashcards());
            await db.SaveChangesAsync();
        }
    }

    private static QuizQuestion Q(string question, string a, string b, string c, string d,
        string correct, string explanation, int diff, string topic, string period) =>
        new() { Question = question, OptionA = a, OptionB = b, OptionC = c, OptionD = d,
            CorrectOption = correct, Explanation = explanation, Difficulty = diff, Topic = topic, Period = period };

    private static IEnumerable<QuizQuestion> Questions() => new[]
    {
        Q("Hiệp định Genève về Đông Dương được ký kết vào năm nào?", "1954", "1955", "1956", "1960",
            "A", "Hiệp định Genève được ký ngày 21/7/1954, kết thúc cuộc kháng chiến chống thực dân Pháp.", 1, "Hiệp định Genève", "1954"),
        Q("Sau Hiệp định Genève 1954, đất nước ta tạm thời bị chia cắt ở vĩ tuyến nào?", "Vĩ tuyến 16", "Vĩ tuyến 17", "Vĩ tuyến 18", "Vĩ tuyến 20",
            "B", "Lấy vĩ tuyến 17 (sông Bến Hải, Quảng Trị) làm giới tuyến quân sự tạm thời.", 1, "Chia cắt đất nước", "1954"),
        Q("Phong trào \"Đồng Khởi\" (1959–1960) tiêu biểu nhất ở tỉnh nào?", "Tây Ninh", "Long An", "Bến Tre", "Cà Mau",
            "C", "Bến Tre là nơi tiêu biểu của phong trào Đồng Khởi, mở đầu cao trào nổi dậy ở miền Nam.", 2, "Đồng Khởi", "1959-1960"),
        Q("Mặt trận Dân tộc Giải phóng miền Nam Việt Nam được thành lập ngày nào?", "20/12/1960", "19/5/1960", "02/09/1960", "15/10/1961",
            "A", "Mặt trận Dân tộc Giải phóng miền Nam Việt Nam thành lập ngày 20/12/1960.", 2, "Mặt trận Dân tộc Giải phóng", "1960"),
        Q("Đại hội đại biểu toàn quốc lần thứ III của Đảng (9/1960) xác định nhiệm vụ chiến lược của cách mạng cả nước là gì?",
            "Chỉ xây dựng CNXH ở miền Bắc", "Tiến hành đồng thời hai chiến lược cách mạng ở hai miền", "Chỉ đấu tranh giải phóng miền Nam", "Khôi phục kinh tế sau chiến tranh",
            "B", "Đại hội III xác định tiến hành đồng thời cách mạng XHCN ở miền Bắc và cách mạng dân tộc dân chủ nhân dân ở miền Nam.", 2, "Đại hội Đảng", "1960"),
        Q("Chiến lược \"Chiến tranh đặc biệt\" của Mỹ ở miền Nam được tiến hành trong khoảng thời gian nào?",
            "1959–1963", "1961–1965", "1965–1968", "1969–1973",
            "B", "\"Chiến tranh đặc biệt\" (1961–1965): dùng quân đội Sài Gòn là chủ yếu, có cố vấn và vũ khí Mỹ.", 2, "Chiến tranh đặc biệt", "1961-1965"),
        Q("Chiến thắng Ấp Bắc (1/1963) diễn ra ở tỉnh nào?", "Mỹ Tho (Tiền Giang)", "Bến Tre", "Đồng Tháp", "Long An",
            "A", "Chiến thắng Ấp Bắc (2/1/1963) tại Mỹ Tho chứng minh khả năng đánh bại \"Chiến tranh đặc biệt\".", 2, "Ấp Bắc", "1963"),
        Q("Cuộc Tổng tiến công và nổi dậy Tết Mậu Thân diễn ra vào năm nào?", "1965", "1967", "1968", "1972",
            "C", "Tổng tiến công và nổi dậy Tết Mậu Thân 1968 làm lung lay ý chí xâm lược của Mỹ, buộc Mỹ xuống thang chiến tranh.", 1, "Mậu Thân", "1968"),
        Q("Chiến lược \"Chiến tranh cục bộ\" của Mỹ có đặc điểm nổi bật nào?",
            "Chủ yếu dùng quân đội Sài Gòn", "Đưa quân viễn chinh Mỹ trực tiếp tham chiến ở miền Nam", "Chỉ dùng không quân ném bom miền Bắc", "Rút dần quân Mỹ về nước",
            "B", "\"Chiến tranh cục bộ\" (1965–1968) đưa quân viễn chinh Mỹ và đồng minh trực tiếp tham chiến ở miền Nam.", 3, "Chiến tranh cục bộ", "1965-1968"),
        Q("Chủ tịch Hồ Chí Minh qua đời vào ngày nào?", "02/09/1969", "19/05/1969", "30/04/1969", "02/09/1945",
            "A", "Chủ tịch Hồ Chí Minh qua đời ngày 2/9/1969, để lại bản Di chúc lịch sử.", 1, "Chủ tịch Hồ Chí Minh", "1969"),
        Q("Chiến lược \"Việt Nam hóa chiến tranh\" được Mỹ thực hiện dưới thời tổng thống nào?", "Kennedy", "Johnson", "Nixon", "Eisenhower",
            "C", "\"Việt Nam hóa chiến tranh\" (1969–1973) gắn với tổng thống Nixon, từng bước rút quân Mỹ.", 2, "Việt Nam hóa chiến tranh", "1969-1973"),
        Q("Chiến thắng \"Hà Nội - Điện Biên Phủ trên không\" (12/1972) đập tan cuộc tập kích bằng loại máy bay nào của Mỹ?",
            "F-4", "B-52", "A-1", "F-111",
            "B", "12 ngày đêm cuối 1972, quân dân ta đánh bại cuộc tập kích chiến lược bằng \"pháo đài bay\" B-52.", 2, "Điện Biên Phủ trên không", "1972"),
        Q("Hiệp định Paris về chấm dứt chiến tranh ở Việt Nam được ký vào ngày nào?", "27/01/1973", "30/04/1973", "21/07/1973", "02/09/1973",
            "A", "Hiệp định Paris ký ngày 27/1/1973; Mỹ buộc phải rút hết quân khỏi miền Nam Việt Nam.", 1, "Hiệp định Paris", "1973"),
        Q("Chiến dịch Tây Nguyên (3/1975) mở màn bằng trận đánh then chốt vào địa điểm nào?", "Plâyku", "Kon Tum", "Buôn Ma Thuột", "Đắk Lắk",
            "C", "Trận Buôn Ma Thuột (10/3/1975) là đòn điểm huyệt mở màn cho cuộc Tổng tiến công mùa Xuân 1975.", 2, "Chiến dịch Tây Nguyên", "1975"),
        Q("Chiến dịch giải phóng Sài Gòn, kết thúc thắng lợi ngày 30/4/1975, mang tên gì?",
            "Chiến dịch Tây Nguyên", "Chiến dịch Huế - Đà Nẵng", "Chiến dịch Hồ Chí Minh", "Chiến dịch Bình Giã",
            "C", "Chiến dịch Hồ Chí Minh (26–30/4/1975) giải phóng Sài Gòn, kết thúc cuộc kháng chiến chống Mỹ cứu nước.", 1, "Đại thắng mùa Xuân", "1975"),
        Q("Cuộc Tổng tiến công và nổi dậy mùa Xuân 1975 trải qua ba chiến dịch lớn theo thứ tự nào?",
            "Hồ Chí Minh → Tây Nguyên → Huế-Đà Nẵng", "Tây Nguyên → Huế-Đà Nẵng → Hồ Chí Minh", "Huế-Đà Nẵng → Tây Nguyên → Hồ Chí Minh", "Tây Nguyên → Hồ Chí Minh → Huế-Đà Nẵng",
            "B", "Thứ tự: Chiến dịch Tây Nguyên → Chiến dịch Huế-Đà Nẵng → Chiến dịch Hồ Chí Minh.", 3, "Đại thắng mùa Xuân", "1975"),
        Q("Tuyến đường vận tải chiến lược chi viện cho miền Nam (đường Trường Sơn) bắt đầu được mở vào năm nào?",
            "1954", "1959", "1965", "1968",
            "B", "Đường Trường Sơn - đường Hồ Chí Minh được mở từ tháng 5/1959 (Đoàn 559).", 3, "Đường Trường Sơn", "1959"),
        Q("Trong giai đoạn 1954–1975, miền Bắc giữ vai trò gì đối với cách mạng cả nước?",
            "Tiền tuyến trực tiếp", "Hậu phương lớn của tiền tuyến lớn miền Nam", "Vùng trung lập", "Khu phi quân sự",
            "B", "Miền Bắc là hậu phương lớn, chi viện sức người sức của cho tiền tuyến lớn miền Nam.", 2, "Hậu phương miền Bắc", "1954-1975"),
    };

    private static Flashcard F(string front, string back, string topic, string period) =>
        new() { Front = front, Back = back, Topic = topic, Period = period };

    private static IEnumerable<Flashcard> Flashcards() => new[]
    {
        F("Hiệp định Genève được ký ngày nào?", "21/7/1954 — kết thúc kháng chiến chống Pháp.", "Hiệp định Genève", "1954"),
        F("Giới tuyến quân sự tạm thời sau 1954?", "Vĩ tuyến 17 (sông Bến Hải, Quảng Trị).", "Chia cắt", "1954"),
        F("Phong trào Đồng Khởi tiêu biểu ở đâu?", "Bến Tre (1959–1960).", "Đồng Khởi", "1960"),
        F("Mặt trận Dân tộc Giải phóng miền Nam thành lập khi nào?", "20/12/1960.", "Mặt trận", "1960"),
        F("Đại hội III của Đảng (9/1960) đề ra điều gì?", "Đường lối tiến hành đồng thời hai chiến lược cách mạng ở hai miền.", "Đại hội Đảng", "1960"),
        F("\"Chiến tranh đặc biệt\" diễn ra khi nào?", "1961–1965, dùng quân đội Sài Gòn + cố vấn Mỹ.", "Chiến lược Mỹ", "1961-1965"),
        F("Chiến thắng Ấp Bắc?", "2/1/1963 tại Mỹ Tho — đánh bại \"Chiến tranh đặc biệt\".", "Ấp Bắc", "1963"),
        F("\"Chiến tranh cục bộ\"?", "1965–1968, quân viễn chinh Mỹ trực tiếp tham chiến.", "Chiến lược Mỹ", "1965-1968"),
        F("Tết Mậu Thân 1968 có ý nghĩa gì?", "Làm lung lay ý chí xâm lược của Mỹ, buộc Mỹ xuống thang, đàm phán.", "Mậu Thân", "1968"),
        F("Chủ tịch Hồ Chí Minh qua đời ngày nào?", "2/9/1969, để lại bản Di chúc.", "Hồ Chí Minh", "1969"),
        F("\"Việt Nam hóa chiến tranh\"?", "1969–1973, dưới thời Nixon, từng bước rút quân Mỹ.", "Chiến lược Mỹ", "1969-1973"),
        F("\"Điện Biên Phủ trên không\" là gì?", "12 ngày đêm cuối 12/1972, đánh bại B-52 Mỹ ở Hà Nội - Hải Phòng.", "ĐBP trên không", "1972"),
        F("Hiệp định Paris ký ngày nào?", "27/1/1973 — Mỹ rút hết quân khỏi miền Nam.", "Hiệp định Paris", "1973"),
        F("Trận mở màn Tổng tiến công 1975?", "Buôn Ma Thuột (10/3/1975) — Chiến dịch Tây Nguyên.", "Mùa Xuân 1975", "1975"),
        F("Chiến dịch giải phóng Sài Gòn tên gì?", "Chiến dịch Hồ Chí Minh, kết thúc 30/4/1975.", "Mùa Xuân 1975", "1975"),
        F("Đường Trường Sơn mở năm nào?", "Tháng 5/1959 (Đoàn 559) — chi viện miền Nam.", "Đường Trường Sơn", "1959"),
    };
}
