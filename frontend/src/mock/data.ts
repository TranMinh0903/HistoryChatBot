// ===========================================================
//  Dữ liệu mẫu — Lịch sử Đảng CSVN giai đoạn 1954–1975
//  Dùng cho MOCK MODE (frontend chạy độc lập, chưa cần backend).
//  Backend có thể tái sử dụng làm seed (xem docs/DATABASE.md).
// ===========================================================
import type {
  QuizQuestion, Flashcard, StatsOverview, StatsActivity, StatsQuiz, DayCount,
} from '../types'

// ---------------- QUIZ ----------------
export const QUIZ_QUESTIONS: (QuizQuestion & { correctOption: 'A' | 'B' | 'C' | 'D'; explanation: string })[] = [
  {
    id: 'q1', difficulty: 1, topic: 'Hiệp định Genève', period: '1954',
    question: 'Hiệp định Genève về Đông Dương được ký kết vào năm nào?',
    options: { A: '1954', B: '1955', C: '1956', D: '1960' },
    correctOption: 'A',
    explanation: 'Hiệp định Genève được ký ngày 21/7/1954, kết thúc cuộc kháng chiến chống thực dân Pháp.',
  },
  {
    id: 'q2', difficulty: 1, topic: 'Chia cắt đất nước', period: '1954',
    question: 'Sau Hiệp định Genève 1954, đất nước ta tạm thời bị chia cắt ở vĩ tuyến nào?',
    options: { A: 'Vĩ tuyến 16', B: 'Vĩ tuyến 17', C: 'Vĩ tuyến 18', D: 'Vĩ tuyến 20' },
    correctOption: 'B',
    explanation: 'Lấy vĩ tuyến 17 (sông Bến Hải, Quảng Trị) làm giới tuyến quân sự tạm thời.',
  },
  {
    id: 'q3', difficulty: 2, topic: 'Đồng Khởi', period: '1959-1960',
    question: 'Phong trào "Đồng Khởi" (1959–1960) nổ ra mạnh mẽ và tiêu biểu nhất ở tỉnh nào?',
    options: { A: 'Tây Ninh', B: 'Long An', C: 'Bến Tre', D: 'Cà Mau' },
    correctOption: 'C',
    explanation: 'Bến Tre là nơi tiêu biểu của phong trào Đồng Khởi, mở đầu cao trào nổi dậy ở miền Nam.',
  },
  {
    id: 'q4', difficulty: 2, topic: 'Mặt trận Dân tộc Giải phóng', period: '1960',
    question: 'Mặt trận Dân tộc Giải phóng miền Nam Việt Nam được thành lập ngày tháng năm nào?',
    options: { A: '20/12/1960', B: '19/5/1960', C: '02/09/1960', D: '15/10/1961' },
    correctOption: 'A',
    explanation: 'Mặt trận Dân tộc Giải phóng miền Nam Việt Nam thành lập ngày 20/12/1960.',
  },
  {
    id: 'q5', difficulty: 2, topic: 'Đại hội Đảng', period: '1960',
    question: 'Đại hội đại biểu toàn quốc lần thứ III của Đảng (9/1960) xác định nhiệm vụ chiến lược của cách mạng cả nước là gì?',
    options: {
      A: 'Chỉ xây dựng CNXH ở miền Bắc',
      B: 'Tiến hành đồng thời hai chiến lược cách mạng ở hai miền',
      C: 'Chỉ đấu tranh giải phóng miền Nam',
      D: 'Khôi phục kinh tế sau chiến tranh',
    },
    correctOption: 'B',
    explanation: 'Đại hội III xác định tiến hành đồng thời cách mạng XHCN ở miền Bắc và cách mạng dân tộc dân chủ nhân dân ở miền Nam.',
  },
  {
    id: 'q6', difficulty: 2, topic: 'Chiến tranh đặc biệt', period: '1961-1965',
    question: 'Chiến lược "Chiến tranh đặc biệt" của Mỹ ở miền Nam được tiến hành trong khoảng thời gian nào?',
    options: { A: '1959–1963', B: '1961–1965', C: '1965–1968', D: '1969–1973' },
    correctOption: 'B',
    explanation: '"Chiến tranh đặc biệt" (1961–1965): dùng quân đội Sài Gòn là chủ yếu, có cố vấn và vũ khí Mỹ.',
  },
  {
    id: 'q7', difficulty: 2, topic: 'Ấp Bắc', period: '1963',
    question: 'Chiến thắng Ấp Bắc (1/1963) diễn ra ở tỉnh nào?',
    options: { A: 'Mỹ Tho (Tiền Giang)', B: 'Bến Tre', C: 'Đồng Tháp', D: 'Long An' },
    correctOption: 'A',
    explanation: 'Chiến thắng Ấp Bắc (2/1/1963) tại Mỹ Tho chứng minh khả năng đánh bại "Chiến tranh đặc biệt".',
  },
  {
    id: 'q8', difficulty: 1, topic: 'Mậu Thân', period: '1968',
    question: 'Cuộc Tổng tiến công và nổi dậy Tết Mậu Thân diễn ra vào năm nào?',
    options: { A: '1965', B: '1967', C: '1968', D: '1972' },
    correctOption: 'C',
    explanation: 'Tổng tiến công và nổi dậy Tết Mậu Thân 1968 làm lung lay ý chí xâm lược của Mỹ, buộc Mỹ xuống thang chiến tranh.',
  },
  {
    id: 'q9', difficulty: 3, topic: 'Chiến tranh cục bộ', period: '1965-1968',
    question: 'Chiến lược "Chiến tranh cục bộ" của Mỹ có đặc điểm nổi bật nào?',
    options: {
      A: 'Chủ yếu dùng quân đội Sài Gòn',
      B: 'Đưa quân viễn chinh Mỹ trực tiếp tham chiến ở miền Nam',
      C: 'Chỉ dùng không quân ném bom miền Bắc',
      D: 'Rút dần quân Mỹ về nước',
    },
    correctOption: 'B',
    explanation: '"Chiến tranh cục bộ" (1965–1968) đưa quân viễn chinh Mỹ và đồng minh trực tiếp tham chiến ở miền Nam.',
  },
  {
    id: 'q10', difficulty: 1, topic: 'Chủ tịch Hồ Chí Minh', period: '1969',
    question: 'Chủ tịch Hồ Chí Minh qua đời vào ngày tháng năm nào?',
    options: { A: '02/09/1969', B: '19/05/1969', C: '30/04/1969', D: '02/09/1945' },
    correctOption: 'A',
    explanation: 'Chủ tịch Hồ Chí Minh qua đời ngày 2/9/1969, để lại bản Di chúc lịch sử.',
  },
  {
    id: 'q11', difficulty: 2, topic: 'Việt Nam hóa chiến tranh', period: '1969-1973',
    question: 'Chiến lược "Việt Nam hóa chiến tranh" được Mỹ thực hiện dưới thời tổng thống nào?',
    options: { A: 'Kennedy', B: 'Johnson', C: 'Nixon', D: 'Eisenhower' },
    correctOption: 'C',
    explanation: '"Việt Nam hóa chiến tranh" (1969–1973) gắn với tổng thống Nixon, từng bước rút quân Mỹ.',
  },
  {
    id: 'q12', difficulty: 2, topic: 'Điện Biên Phủ trên không', period: '1972',
    question: 'Chiến thắng "Hà Nội - Điện Biên Phủ trên không" (12/1972) đập tan cuộc tập kích bằng loại máy bay nào của Mỹ?',
    options: { A: 'F-4', B: 'B-52', C: 'A-1', D: 'F-111' },
    correctOption: 'B',
    explanation: '12 ngày đêm cuối 1972, quân dân ta đánh bại cuộc tập kích chiến lược bằng "pháo đài bay" B-52.',
  },
  {
    id: 'q13', difficulty: 1, topic: 'Hiệp định Paris', period: '1973',
    question: 'Hiệp định Paris về chấm dứt chiến tranh, lập lại hòa bình ở Việt Nam được ký vào ngày nào?',
    options: { A: '27/01/1973', B: '30/04/1973', C: '21/07/1973', D: '02/09/1973' },
    correctOption: 'A',
    explanation: 'Hiệp định Paris ký ngày 27/1/1973; Mỹ buộc phải rút hết quân khỏi miền Nam Việt Nam.',
  },
  {
    id: 'q14', difficulty: 2, topic: 'Chiến dịch Tây Nguyên', period: '1975',
    question: 'Chiến dịch Tây Nguyên (3/1975) mở màn bằng trận đánh then chốt vào địa điểm nào?',
    options: { A: 'Plâyku', B: 'Kon Tum', C: 'Buôn Ma Thuột', D: 'Đắk Lắk' },
    correctOption: 'C',
    explanation: 'Trận Buôn Ma Thuột (10/3/1975) là đòn điểm huyệt mở màn cho cuộc Tổng tiến công mùa Xuân 1975.',
  },
  {
    id: 'q15', difficulty: 1, topic: 'Đại thắng mùa Xuân', period: '1975',
    question: 'Chiến dịch giải phóng Sài Gòn, kết thúc thắng lợi vào ngày 30/4/1975, mang tên gì?',
    options: { A: 'Chiến dịch Tây Nguyên', B: 'Chiến dịch Huế - Đà Nẵng', C: 'Chiến dịch Hồ Chí Minh', D: 'Chiến dịch Bình Giã' },
    correctOption: 'C',
    explanation: 'Chiến dịch Hồ Chí Minh (26–30/4/1975) giải phóng Sài Gòn, kết thúc cuộc kháng chiến chống Mỹ cứu nước.',
  },
  {
    id: 'q16', difficulty: 3, topic: 'Đại thắng mùa Xuân', period: '1975',
    question: 'Cuộc Tổng tiến công và nổi dậy mùa Xuân 1975 trải qua ba chiến dịch lớn theo thứ tự nào?',
    options: {
      A: 'Hồ Chí Minh → Tây Nguyên → Huế-Đà Nẵng',
      B: 'Tây Nguyên → Huế-Đà Nẵng → Hồ Chí Minh',
      C: 'Huế-Đà Nẵng → Tây Nguyên → Hồ Chí Minh',
      D: 'Tây Nguyên → Hồ Chí Minh → Huế-Đà Nẵng',
    },
    correctOption: 'B',
    explanation: 'Thứ tự: Chiến dịch Tây Nguyên → Chiến dịch Huế-Đà Nẵng → Chiến dịch Hồ Chí Minh.',
  },
  {
    id: 'q17', difficulty: 3, topic: 'Đường Trường Sơn', period: '1959',
    question: 'Tuyến đường vận tải chiến lược chi viện cho miền Nam (đường Trường Sơn) bắt đầu được mở vào năm nào?',
    options: { A: '1954', B: '1959', C: '1965', D: '1968' },
    correctOption: 'B',
    explanation: 'Đường Trường Sơn - đường Hồ Chí Minh được mở từ tháng 5/1959 (Đoàn 559).',
  },
  {
    id: 'q18', difficulty: 2, topic: 'Hậu phương miền Bắc', period: '1954-1975',
    question: 'Trong giai đoạn 1954–1975, miền Bắc giữ vai trò gì đối với cách mạng cả nước?',
    options: {
      A: 'Tiền tuyến trực tiếp',
      B: 'Hậu phương lớn của tiền tuyến lớn miền Nam',
      C: 'Vùng trung lập',
      D: 'Khu phi quân sự',
    },
    correctOption: 'B',
    explanation: 'Miền Bắc là hậu phương lớn, chi viện sức người sức của cho tiền tuyến lớn miền Nam.',
  },
]

// ---------------- FLASHCARDS ----------------
export const FLASHCARDS: Flashcard[] = [
  { id: 'f1', front: 'Hiệp định Genève được ký ngày nào?', back: '21/7/1954 — kết thúc kháng chiến chống Pháp.', topic: 'Hiệp định Genève', period: '1954' },
  { id: 'f2', front: 'Giới tuyến quân sự tạm thời sau 1954?', back: 'Vĩ tuyến 17 (sông Bến Hải, Quảng Trị).', topic: 'Chia cắt', period: '1954' },
  { id: 'f3', front: 'Phong trào Đồng Khởi tiêu biểu ở đâu?', back: 'Bến Tre (1959–1960).', topic: 'Đồng Khởi', period: '1960' },
  { id: 'f4', front: 'Mặt trận Dân tộc Giải phóng miền Nam thành lập khi nào?', back: '20/12/1960.', topic: 'Mặt trận', period: '1960' },
  { id: 'f5', front: 'Đại hội III của Đảng (9/1960) đề ra điều gì?', back: 'Đường lối tiến hành đồng thời hai chiến lược cách mạng ở hai miền.', topic: 'Đại hội Đảng', period: '1960' },
  { id: 'f6', front: '"Chiến tranh đặc biệt" diễn ra khi nào?', back: '1961–1965, dùng quân đội Sài Gòn + cố vấn Mỹ.', topic: 'Chiến lược Mỹ', period: '1961-1965' },
  { id: 'f7', front: 'Chiến thắng Ấp Bắc?', back: '2/1/1963 tại Mỹ Tho — đánh bại "Chiến tranh đặc biệt".', topic: 'Ấp Bắc', period: '1963' },
  { id: 'f8', front: '"Chiến tranh cục bộ"?', back: '1965–1968, quân viễn chinh Mỹ trực tiếp tham chiến.', topic: 'Chiến lược Mỹ', period: '1965-1968' },
  { id: 'f9', front: 'Tết Mậu Thân 1968 có ý nghĩa gì?', back: 'Làm lung lay ý chí xâm lược của Mỹ, buộc Mỹ xuống thang, đàm phán.', topic: 'Mậu Thân', period: '1968' },
  { id: 'f10', front: 'Chủ tịch Hồ Chí Minh qua đời ngày nào?', back: '2/9/1969, để lại bản Di chúc.', topic: 'Hồ Chí Minh', period: '1969' },
  { id: 'f11', front: '"Việt Nam hóa chiến tranh"?', back: '1969–1973, dưới thời Nixon, từng bước rút quân Mỹ.', topic: 'Chiến lược Mỹ', period: '1969-1973' },
  { id: 'f12', front: '"Điện Biên Phủ trên không" là gì?', back: '12 ngày đêm cuối 12/1972, đánh bại B-52 Mỹ ở Hà Nội - Hải Phòng.', topic: 'ĐBP trên không', period: '1972' },
  { id: 'f13', front: 'Hiệp định Paris ký ngày nào?', back: '27/1/1973 — Mỹ rút hết quân khỏi miền Nam.', topic: 'Hiệp định Paris', period: '1973' },
  { id: 'f14', front: 'Trận mở màn Tổng tiến công 1975?', back: 'Buôn Ma Thuột (10/3/1975) — Chiến dịch Tây Nguyên.', topic: 'Mùa Xuân 1975', period: '1975' },
  { id: 'f15', front: 'Chiến dịch giải phóng Sài Gòn tên gì?', back: 'Chiến dịch Hồ Chí Minh, kết thúc 30/4/1975.', topic: 'Mùa Xuân 1975', period: '1975' },
  { id: 'f16', front: 'Đường Trường Sơn mở năm nào?', back: 'Tháng 5/1959 (Đoàn 559) — chi viện miền Nam.', topic: 'Đường Trường Sơn', period: '1959' },
]

// ---------------- CHAT (mock responder) ----------------
// Trả lời theo từ khóa để demo UI khi chưa có backend/Groq.
const CHAT_KB: { keys: string[]; answer: string }[] = [
  { keys: ['genève', 'geneve', 'giơ-ne-vơ', '1954'], answer: '**Hiệp định Genève (21/7/1954)** chấm dứt chiến tranh, lập lại hòa bình ở Đông Dương sau chiến thắng Điện Biên Phủ. Theo hiệp định, Việt Nam tạm thời chia làm hai miền ở **vĩ tuyến 17** (sông Bến Hải), chờ tổng tuyển cử thống nhất năm 1956 — nhưng cuộc tổng tuyển cử này đã không diễn ra do sự phá hoại của Mỹ và chính quyền Sài Gòn.' },
  { keys: ['đồng khởi', 'dong khoi', 'bến tre'], answer: '**Phong trào Đồng Khởi (1959–1960)** là cao trào nổi dậy của nhân dân miền Nam, tiêu biểu nhất ở **Bến Tre**. Phong trào đánh dấu bước chuyển của cách mạng miền Nam từ thế giữ gìn lực lượng sang thế tiến công, dẫn tới sự ra đời của **Mặt trận Dân tộc Giải phóng miền Nam Việt Nam (20/12/1960)**.' },
  { keys: ['mậu thân', 'mau than', '1968'], answer: '**Tổng tiến công và nổi dậy Tết Mậu Thân 1968** là đòn tiến công chiến lược bất ngờ đánh vào hầu khắp các đô thị miền Nam. Ý nghĩa: làm **lung lay ý chí xâm lược** của đế quốc Mỹ, buộc Mỹ phải **xuống thang chiến tranh** và ngồi vào bàn đàm phán ở Paris.' },
  { keys: ['paris', '1973'], answer: '**Hiệp định Paris (27/1/1973)** về chấm dứt chiến tranh, lập lại hòa bình ở Việt Nam. Đây là thắng lợi to lớn: Mỹ buộc phải **rút hết quân viễn chinh** khỏi miền Nam, tôn trọng độc lập, chủ quyền của Việt Nam — tạo điều kiện so sánh lực lượng có lợi để ta tiến lên giải phóng hoàn toàn miền Nam.' },
  { keys: ['điện biên phủ trên không', 'b-52', 'b52', '1972'], answer: '**"Hà Nội - Điện Biên Phủ trên không" (12 ngày đêm cuối tháng 12/1972)**: quân và dân ta đã đánh bại cuộc tập kích chiến lược đường không bằng máy bay **B-52** của Mỹ vào Hà Nội, Hải Phòng. Chiến thắng này buộc Mỹ phải ký Hiệp định Paris.' },
  { keys: ['1975', 'hồ chí minh', 'chiến dịch', '30/4', 'sài gòn', 'mùa xuân'], answer: '**Đại thắng mùa Xuân 1975** gồm 3 chiến dịch lớn nối tiếp:\n\n1. **Chiến dịch Tây Nguyên** (mở màn Buôn Ma Thuột 10/3/1975)\n2. **Chiến dịch Huế - Đà Nẵng**\n3. **Chiến dịch Hồ Chí Minh** — giải phóng Sài Gòn ngày **30/4/1975**, kết thúc thắng lợi cuộc kháng chiến chống Mỹ, **thống nhất đất nước**.' },
  { keys: ['hồ chí minh', 'bác hồ', 'di chúc', '1969'], answer: 'Chủ tịch **Hồ Chí Minh qua đời ngày 2/9/1969**, để lại bản **Di chúc** lịch sử, căn dặn toàn Đảng, toàn dân quyết tâm đánh thắng giặc Mỹ, xây dựng đất nước.' },
]

export function mockChatReply(message: string): string {
  const m = message.toLowerCase()
  for (const item of CHAT_KB) {
    if (item.keys.some(k => m.includes(k))) return item.answer
  }
  return 'Mình là trợ lý ôn tập **Lịch sử Đảng Cộng sản Việt Nam giai đoạn 1954–1975**. Bạn có thể hỏi mình về các sự kiện như: Hiệp định Genève 1954, phong trào Đồng Khởi, Tết Mậu Thân 1968, Hiệp định Paris 1973, hay Đại thắng mùa Xuân 1975... \n\n*(Đây là chế độ demo. Khi kết nối backend + Groq, mình sẽ trả lời chi tiết hơn cho mọi câu hỏi.)*'
}

// ---------------- STATS (mock) ----------------
function lastNDays(n: number, base: number, variance: number): DayCount[] {
  const out: DayCount[] = []
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    out.push({ day: d.toISOString().slice(0, 10), count: Math.max(0, Math.round(base + (Math.sin(i) + Math.random()) * variance)) })
  }
  return out
}

export const MOCK_STATS_OVERVIEW: StatsOverview = {
  totalUsers: 124,
  activeUsers7d: 38,
  totalSessions: 512,
  totalUserMessages: 2304,
  totalQuizAttempts: 187,
  avgQuizScore: 72.4,
  totalFlashcardReviews: 940,
}

export const MOCK_STATS_ACTIVITY: StatsActivity = {
  messagesPerDay: lastNDays(30, 70, 25),
  newUsersPerDay: lastNDays(30, 4, 3),
}

export const MOCK_STATS_QUIZ: StatsQuiz = {
  scoreDistribution: [
    { bucket: '0–20', count: 6 },
    { bucket: '21–40', count: 14 },
    { bucket: '41–60', count: 31 },
    { bucket: '61–80', count: 78 },
    { bucket: '81–100', count: 58 },
  ],
  attemptsPerDay: lastNDays(30, 6, 4),
  avgScore: 72.4,
  bestScore: 100,
}
