export const GRADE_LEVELS = {
  TH: ["1", "2", "3", "4", "5"],
  THCS: ["6", "7", "8", "9"],
  THPT: ["10", "11", "12"],
};

export const SUBJECTS_MAP = {
  TH: {
    1: [
      "Tiếng Việt",
      "Toán",
      "Đạo đức",
      "Tự nhiên và Xã hội",
      "Giáo dục thể chất",
      "Âm nhạc",
      "Mĩ thuật",
      "Hoạt động trải nghiệm",
    ],
    2: [
      "Tiếng Việt",
      "Toán",
      "Đạo đức",
      "Tự nhiên và Xã hội",
      "Giáo dục thể chất",
      "Âm nhạc",
      "Mĩ thuật",
      "Hoạt động trải nghiệm",
    ],
    3: [
      "Tiếng Việt",
      "Toán",
      "Đạo đức",
      "Tự nhiên và Xã hội",
      "Ngoại ngữ",
      "Tin học",
      "Công nghệ",
      "Giáo dục thể chất",
      "Âm nhạc",
      "Mĩ thuật",
      "Hoạt động trải nghiệm",
    ],
    4: [
      "Tiếng Việt",
      "Toán",
      "Đạo đức",
      "Khoa học",
      "Lịch sử và Địa lí",
      "Ngoại ngữ",
      "Tin học",
      "Công nghệ",
      "Giáo dục thể chất",
      "Âm nhạc",
      "Mĩ thuật",
      "Hoạt động trải nghiệm",
    ],
    5: [
      "Tiếng Việt",
      "Toán",
      "Đạo đức",
      "Khoa học",
      "Lịch sử và Địa lí",
      "Ngoại ngữ",
      "Tin học",
      "Công nghệ",
      "Giáo dục thể chất",
      "Âm nhạc",
      "Mĩ thuật",
      "Hoạt động trải nghiệm",
    ],
  },
  THCS: [
    "Ngữ văn",
    "Toán",
    "Ngoại ngữ",
    "Giáo dục công dân",
    "Lịch sử và Địa lí",
    "Khoa học tự nhiên",
    "Công nghệ",
    "Tin học",
    "Giáo dục thể chất",
    "Âm nhạc",
    "Mĩ thuật",
    "Nghệ thuật",
    "Hoạt động trải nghiệm",
    "Hoạt động trải nghiệm, hướng nghiệp",
    "Nội dung giáo dục địa phương",
  ],
  THPT: [
    "Ngữ văn",
    "Toán",
    "Ngoại ngữ",
    "Lịch sử",
    "Giáo dục thể chất",
    "Giáo dục QPAN",
    "Hoạt động trải nghiệm",
    "Hoạt động trải nghiệm, hướng nghiệp",
    "Nội dung giáo dục địa phương",
    "Địa lí",
    "Giáo dục kinh tế và pháp luật",
    "Vật lí",
    "Hóa học",
    "Sinh học",
    "Công nghệ",
    "Tin học",
    "Âm nhạc",
    "Mĩ thuật",
    "Nghệ thuật",
  ],
};

export const DGTX_TONG_HOP_SUBJECTS = [
  "Sổ tổng hợp - Môn học và HĐGD",
  "Sổ tổng hợp - Năng lực chung",
  "Sổ tổng hợp - Năng lực đặc thù",
  "Sổ tổng hợp - Phẩm chất chủ yếu"
];

export function getSubjects(capHoc, khoiLop) {
  if (capHoc === "TH") {
    return SUBJECTS_MAP.TH[khoiLop] || [];
  }
  return SUBJECTS_MAP[capHoc] || [];
}

export function getDGTXSubjects(capHoc, khoiLop) {
  const subs = getSubjects(capHoc, khoiLop);
  if (capHoc === "TH") {
    return [...subs, ...DGTX_TONG_HOP_SUBJECTS];
  }
  return subs;
}

export const EVAL_LEVELS = ["Tốt", "Khá", "Đạt", "Chưa Đạt"];
export const EVAL_LEVELS_TH = ["Tốt", "Khá", "Đạt", "Chưa Đạt"];
export const EVAL_LEVELS_TH_NLPC = ["Tốt", "Đạt", "Cần cố gắng"];
export const EVAL_LEVELS_DGTX = ["T", "H", "C"];

export const isPassFailSubject = (capHoc, subject) => {
  if (capHoc !== "THCS" && capHoc !== "THPT") return false;
  if (!subject) return false;
  const lowerSubj = subject.toLowerCase();
  if (lowerSubj.includes("thể chất")) return true;
  if (lowerSubj.includes("nghệ thuật")) return true;
  if (lowerSubj.includes("âm nhạc")) return true;
  if (lowerSubj.includes("mĩ thuật") || lowerSubj.includes("mỹ thuật")) return true;
  if ((lowerSubj.includes("địa phương") && lowerSubj.includes("nội dung")) || lowerSubj.includes("gdđp")) return true;
  if (lowerSubj.includes("hoạt động trải nghiệm") || lowerSubj.includes("hđtn")) return true;
  return false;
}

export const getEvalLevels = (capHoc, isNlPc = false, isDgtx = false, isVnedu = false, subject = null) => {
  if (isDgtx) return EVAL_LEVELS_DGTX;
  if (capHoc === "TH") {
    if (isVnedu && !isNlPc) return EVAL_LEVELS_DGTX;
    return isNlPc ? EVAL_LEVELS_TH_NLPC : EVAL_LEVELS_TH;
  }
  if (isPassFailSubject(capHoc, subject)) {
    return ["Đạt", "Chưa Đạt"];
  }
  return EVAL_LEVELS;
};


const MOCK_PREFIXES = {
  "Ngữ văn": ["Em có khả năng cảm thụ văn học rất tốt, ", "Biết cách diễn đạt ý tưởng trôi chảy, ", "Luôn đọc diễn cảm và hiểu sâu sắc tác phẩm, ", "Thường xuyên có những bài viết sáng tạo, ", "Nắm vững ngữ pháp và từ vựng phong phú, "],
  "Giáo dục công dân": ["Em nắm vững các bài học đạo đức pháp luật, ", "Luôn có ý thức chấp hành tốt quy định, ", "Thể hiện trách nhiệm cao trong các hoạt động, ", "Biết cách ứng xử chuẩn mực với mọi người, ", "Tích cực lan tỏa những giá trị đạo đức tốt đẹp, "],
  "Khoa học tự nhiên": ["Em nắm vững kiến thức tự nhiên, ", "Luôn tò mò và tích cực thực hành thí nghiệm, ", "Biết cách giải thích sự vật hiện tượng logic, ", "Có ý thức bảo vệ môi trường rất xuất sắc, ", "Thể hiện tư duy khoa học và óc quan sát tốt, "],
  "Nội dung giáo dục địa phương": ["Em hiểu rõ các giá trị truyền thống quê hương, ", "Biết cách giới thiệu di tích lịch sử địa phương, ", "Luôn tích cực tìm hiểu văn hóa vùng miền, ", "Thể hiện tình yêu thiên nhiên và con người nơi sinh sống, ", "Nắm vững các đặc điểm kinh tế - xã hội địa phương, "],
  "Tiếng Việt": ["Em đọc to rõ ràng, ", "Có ý thức luyện chữ tốt, ", "Em biết cách diễn đạt trôi chảy, ", "Luôn tích cực phát biểu, ", "Phát huy tốt khả năng nghe hiểu, "],
  "Toán": ["Em có tư duy số học nhạy bén, ", "Biết cách giải quyết bài toán nhanh, ", "Luôn làm bài tập toán đầy đủ, ", "Em nắm vững kiến thức hình học, ", "Có khả năng tính toán chính xác, "],
  "Đạo đức": ["Em luôn ngoan ngoãn và lễ phép, ", "Có thái độ chuẩn mực với thầy cô, ", "Biết cách ứng xử hòa nhã với bạn bè, ", "Luôn có ý thức giữ gìn kỷ luật lớp, ", "Chấp hành tốt các quy định nhà trường, "],
  "Ngoại ngữ": ["Em có kỹ năng phát âm tiếng Anh tốt, ", "Biết cách lắng nghe và lặp lại từ vựng, ", "Luôn tự tin giao tiếp tiếng Anh cơ bản, ", "Phát huy tốt khả năng học từ mới, ", "Có thái độ tích cực trong giờ tiếng Anh, "],
  "Tiếng Anh": ["Em có kỹ năng phát âm tiếng Anh tốt, ", "Biết cách lắng nghe và lặp lại từ vựng, ", "Luôn tự tin giao tiếp tiếng Anh cơ bản, ", "Phát huy tốt khả năng học từ mới, ", "Có thái độ tích cực trong giờ tiếng Anh, "],
  "Tự nhiên và Xã hội": ["Em nắm vững các hiện tượng tự nhiên, ", "Luôn tò mò và yêu thích khám phá, ", "Biết cách quan sát môi trường xung quanh, ", "Có ý thức bảo vệ môi trường rất tốt, ", "Tích cực tìm hiểu kiến thức khoa học, "],
  "Khoa học": ["Em nắm vững kiến thức tự nhiên, ", "Luôn tò mò và yêu thích khám phá, ", "Biết cách quan sát môi trường phòng thí nghiệm, ", "Có ý thức bảo vệ môi trường rất tốt, ", "Tích cực tìm hiểu kiến thức khoa học, "],
  "Lịch sử và Địa lí": ["Em ghi nhớ tốt các sự kiện lịch sử, ", "Hiểu biết rõ về vị trí địa lý, ", "Biết cách liên hệ bài học với thực tế, ", "Luôn chú ý nghe giảng và phát biểu, ", "Thể hiện sự yêu thích môn học rõ rệt, "],
  "Lịch sử và Địa lý": ["Em ghi nhớ tốt các sự kiện lịch sử, ", "Hiểu biết rõ về vị trí địa lý, ", "Biết cách liên hệ bài học với thực tế, ", "Luôn chú ý nghe giảng và phát biểu, ", "Thể hiện sự yêu thích môn học rõ rệt, "],
  "Tin học và Công nghệ": ["Em sử dụng máy tính thành thạo, ", "Nắm bắt nhanh các thao tác công nghệ, ", "Biết cách thực hành tốt trên phần mềm, ", "Luôn tuân thủ quy tắc phòng máy tính, ", "Có tư duy logic tốt khi thực hành tin học, "],
  "Tin học": ["Em sử dụng máy tính thành thạo, ", "Nắm bắt nhanh các thao tác công nghệ, ", "Biết cách thực hành tốt trên phần mềm, ", "Luôn tuân thủ quy tắc phòng máy tính, ", "Có tư duy logic tốt khi thực hành tin học, "],
  "Công nghệ": ["Em biết được tầm quan trọng hệ thống, ", "Nắm bắt nhanh các thao tác sử dụng công cụ, ", "Biết cách thực hành tốt lắp ráp mô hình, ", "Luôn tuân thủ an toàn trong tiết thực hành, ", "Có tư duy thiết kế tốt khi làm sản phẩm, "],
  "Giáo dục thể chất": ["Em hoàn thành tốt các bài tập thể dục, ", "Luôn năng nổ và nhiệt tình vận động, ", "Biết cách rèn luyện sức khỏe bản thân, ", "Có tinh thần thể thao đáng biểu dương, ", "Thực hiện đúng và đẹp các động tác, "],
  "Âm nhạc": ["Em có năng khiếu âm nhạc tốt, ", "Hát đúng giai điệu và nhiệt tình, ", "Biết cách cảm thụ nhịp điệu tinh tế, ", "Luôn tích cực tham gia hát trên lớp, ", "Nắm vững các nốt nhạc trọng tâm, "],
  "Mĩ thuật": ["Em có năng khiếu vẽ rất tốt, ", "Trình bày bố cục tranh hài hòa, ", "Biết cách sử dụng màu sắc tươi sáng, ", "Luôn hoàn thành xuất sắc các sản phẩm, ", "Thể hiện sự khéo léo qua từng nét vẽ, "],
  "Nghệ thuật": ["Em có năng khiếu nghệ thuật tốt, ", "Hoàn thành xuất sắc nhiệm vụ sáng tạo, ", "Biết cách tạo hình nét vẽ thẩm mỹ, ", "Luôn tích cực tham gia làm thực hành, ", "Nắm vững kỹ năng cốt lõi của môn học, "],
  "Hoạt động trải nghiệm": ["Em tích cực tham gia các hoạt động ngoại khóa, ", "Biết cách thích ứng với hoàn cảnh tình huống mới, ", "Luôn hòa đồng và hỗ trợ bạn bè, ", "Thể hiện kỹ năng sống rất tốt trong thực tế, ", "Phát huy tốt khả năng làm việc tập thể, "],
  "Năng lực chung": ["Em có tư duy và khả năng tự học tốt, ", "Kỹ năng giao tiếp lưu loát và thân thiện, ", "Biết cách giải quyết vấn đề linh hoạt, ", "Luôn chủ động hoàn thành nhiệm vụ cá nhân, ", "Thể hiện tốt tinh thần hợp tác nhóm hiệu quả, "],
  "Phẩm chất chủ yếu": ["Em luôn thể hiện sự trung thực trong lớp, ", "Có lòng nhân ái với bạn đồng trang lứa, ", "Biết yêu thương và quan tâm mọi người xung quanh, ", "Thể hiện tinh thần trách nhiệm cao độ, ", "Luôn chăm chỉ và nỗ lực không ngừng nghỉ, "],
  "Môn học": ["Em có tư duy và kỹ năng tiếp thu xuất sắc, ", "Nắm vững kiến thức bài học rất nhanh nhẹn, ", "Giải quyết tình huống bài tập nhanh chóng, ", "Tự tin chủ động hoàn thành các bài tập, ", "Chăm chỉ hoàn thành xuất sắc nhiệm vụ, "]
};

const MOCK_MIDDLES = {
  "Ngữ văn": ["kỹ năng viết văn có tiến bộ rõ rệt, ", "hiểu nội dung bài và phân tích sắc sảo, ", "nắm rất vững cốt truyện và nghệ thuật, ", "diễn đạt mạch lạc và cực kỳ trôi chảy, "],
  "Giáo dục công dân": ["góp phần lan tỏa sự tích cực đến lớp, ", "thực hiện tốt trách nhiệm của học sinh, ", "luôn sẵn sàng giúp đỡ mọi người xung quanh, ", "có định hướng hành vi cá nhân rất chuẩn mực, "],
  "Khoa học tự nhiên": ["thường xuyên đặt ra những câu hỏi rất hay, ", "nắm vững kiến thức về vật chất và năng lượng, ", "có góc nhìn thú vị về thế giới tự nhiên, ", "luôn tuân thủ quy tắc an toàn khi thực hành, "],
  "Nội dung giáo dục địa phương": ["thường xuyên kể những câu chuyện dân gian hấp dẫn, ", "nắm vững các danh lam thắng cảnh trong tỉnh, ", "có ý thức bảo vệ và giữ gìn bản sắc văn hoá, ", "trình bày nội dung bài học rất sinh động, "],
  "Tiếng Việt": ["kỹ năng viết văn có tiến bộ rõ rệt, ", "hiểu nội dung bài và trả lời đúng trọng tâm, ", "nắm rất vững kiến thức và từ vựng, ", "đọc bài diễn cảm và cực kỳ trôi chảy, "],
  "Toán": ["chủ động tìm tòi ra cách giải hay, ", "hoàn thành rất tốt các dạng bài tập, ", "nắm rõ phương pháp suy luận logic, ", "thường xuyên đưa ra các đáp án chính xác, "],
  "Đạo đức": ["góp phần lan tỏa sự tích cực đến lớp, ", "thực hiện tốt trách nhiệm của người học sinh, ", "luôn sẵn sàng giúp đỡ mọi người xung quanh, ", "có định hướng hành vi cá nhân rất chuẩn mực, "],
  "Ngoại ngữ": ["kỹ năng đọc hiểu đoạn văn tiếng Anh khá tốt, ", "ghi nhớ tốt từ vựng và cấu trúc ngữ pháp hệ thống, ", "có phản xạ giao tiếp ngôn ngữ khá tự nhiên, ", "luôn nhiệt tình tham gia trò chơi hoạt động, "],
  "Tiếng Anh": ["kỹ năng đọc hiểu đoạn văn tiếng Anh khá tốt, ", "ghi nhớ tốt từ vựng và cấu trúc ngữ pháp hệ thống, ", "có phản xạ giao tiếp ngôn ngữ khá tự nhiên, ", "luôn nhiệt tình tham gia trò chơi hoạt động, "],
  "Tự nhiên và Xã hội": ["thường xuyên đặt ra những câu hỏi rất hay, ", "nắm vững kiến thức về đời sống động thực vật, ", "có góc nhìn rất thú vị về thực trạng tự nhiên, ", "luôn biết cách hệ thống hóa bài học chuẩn mực, "],
  "Khoa học": ["thường xuyên tìm tòi những vấn đề rất hay, ", "nắm vững cấu trúc kiến thức nền tảng, ", "có thái độ khoa học khách quan và kỹ lưỡng, ", "luôn biết cách thử nghiệm và rút kết luận đúng đắn, "],
  "Lịch sử và Địa lí": ["ghi nhớ lâu các vị anh hùng lịch sử, ", "biết xem trọn vẹn bản đồ và nhận biết vùng miền, ", "luôn hăng hái chia sẻ hiểu biết cá nhân của mình, ", "trình bày nội dung kiến thức một cách rất logic, "],
  "Lịch sử và Địa lý": ["ghi nhớ lâu các vị anh hùng lịch sử, ", "biết xem trọn vẹn bản đồ và nhận biết vùng miền, ", "luôn hăng hái chia sẻ hiểu biết cá nhân của mình, ", "trình bày nội dung kiến thức một cách rất logic, "],
  "Tin học và Công nghệ": ["tự tin thực hành trên máy không cần nhắc nhở, ", "hiểu rõ ràng chức năng các công cụ phần mềm, ", "thực hiện một loạt các thao tác máy tính rất chính xác, ", "thể hiện được khả năng tư duy hệ thống máy tính tốt, "],
  "Tin học": ["tự tin thực hành trên máy không cần nhắc nhở, ", "hiểu rõ ràng chức năng các công cụ phần mềm, ", "thực hiện một loạt các thao tác máy tính rất chính xác, ", "thể hiện được khả năng tư duy hệ thống máy tính tốt, "],
  "Công nghệ": ["tự tin lắp ráp các mô hình học cụ, ", "hiểu rõ nguyên lý hoạt động của các bộ phận, ", "thực hiện gia công vật liệu an toàn và chắc chắn, ", "thể hiện sự tỉ mỉ qua từng khâu thật nhỏ, "],
  "Giáo dục thể chất": ["phối hợp nhịp nhàng cùng các bạn bè chung lớp, ", "giữ gìn tốt vệ sinh cá nhân trong quá trình tập, ", "rất nhanh nhẹn trong tổ hợp và khéo léo bứt phá, ", "luôn cố gắng nỗ lực hết tâm sức trong các bài test, "],
  "Âm nhạc": ["thường xuyên truyền cảm hứng cho bạn bè, ", "thể hiện phong thái sự tự tin rạng rỡ khi lên sân khấu, ", "thực hành luyện tập kết hợp vận động rất xuất sắc, ", "luôn hoàn thành mục tiêu phần biểu diễn đúng kế hoạch, "],
  "Mĩ thuật": ["mang đầy cảm hứng sáng tạo lan tỏa cho bạn bè, ", "thể hiện nhiều sáng kiến độc đáo trong sản phẩm nghệ thuật, ", "phối hợp pha trộn mảng màu sắc thật sự bắt mắt, ", "luôn chỉnh chu hoàn thành tác phẩm đúng thời gian, "],
  "Nghệ thuật": ["thường xuyên bộc lộ đa dạng tư duy thẩm mỹ cao, ", "trải nghiệm mỹ cảm của em ở trạng thái rất năng động, ", "biết gắn kết chất liệu vào dự án một cách thú vị, ", "có thiên hướng thực hành thật tốt các mảng phân công, "],
  "Hoạt động trải nghiệm": ["biết cách xử lý mọi tình huống thật sự linh hoạt, ", "luôn hoàn tất xuất sắc vai trò cá nhân được giao, ", "góp phần không nhỏ tạo nên kết quả thành công của nhóm, ", "rất hay chủ động đưa ra vô số sáng kiến ý tưởng mới, "],
  "Năng lực chung": ["biết chia sẻ và chân thành lắng nghe ý kiến mọi người, ", "cực kỳ linh hoạt xử lý vô số tình huống trải nghiệm lớp học, ", "mạnh dạn tự tin trình bày phản biện quan điểm cá nhân, ", "có ý thức duy trì kỷ luật nhóm thật sự rất xuất sắc, "],
  "Phẩm chất chủ yếu": ["lan tỏa lối sống chan hòa nhân ái tới tận người xung quanh, ", "hoàn thành xuất sắc nhiệm vụ bổn phận của học sinh, ", "luôn có tinh thần dũng cảm quyết liệt bảo vệ cái đúng đắn, ", "cố gắng vươn lên mọi rào cản hoàn cảnh để vươn tới thành công, "],
  "Môn học": ["giữ vững nhiệt huyết nghiên cứu cao trong nhiều tháng liền, ", "dành được số điểm cao tuyệt đối trong bài kiểm tra định kỳ, ", "giảng giải lại cho bạn bè cùng tiến bộ thật chu đáo, ", "đạt được tất cả mọi chỉ tiêu kế hoạch năm học đã đề ra, "]
};

const MOCK_NLC_H = [
  "Trong tháng này sự chủ động của em đã khá hơn, tuy nhiên đôi lúc vẫn cần thầy cô nhắc nhở nhẹ nhàng.",
  "Việc hợp tác nhóm của em đạt yêu cầu, mạnh dạn hơn nữa nhé để đóng góp được nhiều ý tưởng.",
  "Kỹ năng giao tiếp có thay đổi theo chiều hướng tốt, cần rèn luyện thêm cách truyền đạt rõ ràng.",
  "Đã biết cách tự xoay xở với bài tập khó, dù thỉnh thoảng còn lúng túng khi trình bày trên bảng.",
  "Sự tự lập trong học tập giữ ở mức ổn định, cố gắng tăng cường sự tập trung thêm ở nhà.",
  "Em thể hiện tinh thần làm việc nhóm khá tốt, cần học cách lắng nghe ý kiến bạn bè nhiều hơn.",
  "Khi có sự cố nhỏ ở lớp, em đã bắt đầu biết cách tự tìm phương án xử lý cơ bản.",
  "Giao tiếp với bạn bè rất hòa nhã, nhưng trong giờ học em còn rụt rè chưa dám giơ tay.",
  "Đang dần hình thành thói quen tự học ở nhà, kết quả trên lớp duy trì được mức độ tiến bộ đều.",
  "Tham gia tương đối nhiệt tình vào công việc chung của tổ, thỉnh thoảng còn mải chơi quên nhiệm vụ.",
  "Bộc lộ năng lực tự chủ khá tinh tế trong sinh hoạt trên lớp, cần duy trì đều đặn thói quen này.",
  "Đôi khi em còn phân tâm, nhưng nhìn chung vẫn hoàn thành đầy đủ các bài tập tự luyện.",
  "Bắt đầu nhận thức được cách giải quyết bài tập nhóm, cần tự tin đóng góp góc nhìn cá nhân hơn.",
  "Các kỹ năng tự phục vụ bản thân thực hiện đạt mức tốt, tuy vậy cần rèn thêm tính cẩn thận.",
  "Có biểu hiện tích cực trong việc chủ động lên hỏi bài thầy cô khi gặp vướng mắc khó hiểu.",
  "Hợp tác tạm ổn cùng bạn học cạnh bên, tốc độ hoàn thành công việc ở mức độ trung bình khá.",
  "Dù đôi chỗ lúng túng khi trình bày trước lớp, nhưng em đã nỗ lực hoàn thành rất tròn trịa phần nói.",
  "Biết tái hiện lại được những bước giải quyết tình huống cũ theo mẫu giáo viên đã hướng dẫn.",
  "Năng lực làm việc tập thể có đôi chút tiến bộ, biết cách dàn xếp công việc cho các bạn.",
  "Chủ động tham gia lao động vệ sinh chung, ý thức tự quản trong việc dọn dẹp tháng qua có cải thiện.",
  "Thường xuyên hoàn tất các phần việc cơ bản, hãy mạnh dạn thử nghiệm thêm những cách làm sáng tạo nhé.",
  "Em đã biết ứng xử tương đối phù hợp khi xảy ra một vài mâu thuẫn nhỏ với bạn bè lúc chơi đùa.",
  "Cần chú ý luyện tập thêm kỹ năng lắng nghe để những cuộc thảo luận nhóm đạt hiệu quả tốt hơn.",
  "Mức độ chuyên tâm khi làm bài tập độc lập khá ổn, thời gian tới cần cố gắng đẩy nhanh tốc độ viết.",
  "Bước đầu đang làm quen dần với phương pháp tự tìm kiếm tài liệu tham khảo, cần thêm sự kiên nhẫn.",
  "Rất chịu khó rèn luyện cách nói chuyện lưu loát, tăng âm lượng lên một chút xíu em sẽ làm rất tốt.",
  "Đã bước đầu nắm được cách thức phối hợp cùng hình thức tổ nhóm, cần nhiệt tình vươn lên nhận vai trò.",
  "Nhịp độ học tập và ghi chép cá nhân duy trì ở mức đạt yêu cầu, cần lưu ý cải thiện thêm độ sạch đẹp.",
  "Đã cởi mở hơn nhiều trong việc cùng nhau chia sẻ sách vở cũng như đồ dùng học tập cùng bạn bè.",
  "Khả năng quan sát bao quát vấn đề của nhóm ở mức khá, cần chú tâm học cách tổng hợp ý kiến mọi người.",
  "Luôn thực hiện đầy đủ nhiệm vụ nhỏ gọn được phân công trong tổ, nhưng thỉnh thoảng chưa tự giác nhận việc.",
  "Mức độ dạn dĩ khi hòa mình vào các trò chơi tập thể đã gia tăng đáng kể so với những tháng học trước.",
  "Đã biết nhờ đến sự trợ giúp của giáo viên rất đúng lúc khi chẳng may gặp phải nhiệm vụ quá sức.",
  "Quan hệ bạn bè tháng này duy trì sự hòa thuận, em đã biết cách làm chủ cảm xúc của bản thân tốt hơn.",
  "Có tinh thần tự xem và chuẩn bị bài cũ gần như đầy đủ trước khi lên lớp, đôi khi có sai sót nhỏ.",
  "Hoà nhập và chủ động làm quen với các bạn chuyển đến khá nhanh nhẹn, phong cách giao tiếp điềm đạm.",
  "Em đã biết tự thu xếp bảo quản đồ đạc cá nhân trong ngăn bàn gọn gàng, ít khi để thất lạc đồ đạc.",
  "Tốc độ phản xạ tương đối nhanh nhạy trước những tình huống hoặc thử thách bất ngờ ở trên lớp học.",
  "Tinh thần trách nhiệm với công việc phụ trách được duy trì tốt, một vài thời điểm có dấu hiệu lơ đãng nhẹ.",
  "Đã có một vài sáng kiến nhỏ để góp phần làm hoạt cảnh, tiếp tục phát huy mặt mạnh mẽ này em nhé."
];

const MOCK_MH_H = [
  "Em nắm được kiến thức nền tảng của bài học, tuy nhiên cần chăm chỉ giơ tay phát biểu ý kiến hơn nữa.",
  "Em hiểu bài và thực hiện khá tốt các yêu cầu của tiết học, hãy mạnh dạn tự tin trình bày trước lớp nhé.",
  "Em hoàn thành các nhiệm vụ học tập trên lớp, tuy nhiên em cần rèn luyện thêm tính cẩn thận khi làm bài.",
  "Em biết cách áp dụng lý thuyết vào bài thực hành cơ bản, thời gian tới cố gắng làm bài nhanh hơn một chút.",
  "Em chú ý nghe giảng và ghi chép bài đầy đủ, cố gắng phát huy thêm tinh thần xung phong xây dựng bài.",
  "Em theo kịp tiến độ chung của cả lớp, nhưng thỉnh thoảng vẫn còn lúng túng khi gặp bài tập mở rộng.",
  "Em thể hiện sự cố gắng đáng kể trong việc tiếp thu kiến thức, cần duy trì thói quen tự học ở nhà.",
  "Em hoàn thành các bài tập được giao đúng hạn, hãy tăng cường trao đổi với bạn bè để mở rộng thêm hiểu biết.",
  "Em có thái độ học tập nghiêm túc, tuy nhiên kĩ năng xử lý các tình huống khó vẫn cần được bồi dưỡng thêm.",
  "Em nắm được trọng tâm của bài giảng trên lớp, cố gắng dành thêm thời gian ôn tập để kiến thức được khắc sâu.",
  "Em thực hiện đầy đủ các yêu cầu môn học, hãy tự tin thể hiện quan điểm cá nhân trong các buổi thảo luận.",
  "Em có sự tiến bộ trong việc hiểu và vận dụng bài học, cần tiếp tục nỗ lực để đạt được kết quả cao hơn.",
  "Em cơ bản làm chủ được nội dung chương trình, tuy nhiên sự tập trung trong giờ học đôi lúc chưa cao.",
  "Em biết cách thao tác và giải quyết bài tập theo mẫu, cần rèn luyện thêm tư duy mở rộng và sáng tạo.",
  "Em thể hiện sự chăm chỉ trong quá trình học tập, nhưng đôi khi trình bày bài làm còn thiếu sự chỉn chu.",
  "Em hoàn thành tương đối tốt các nhiệm vụ nhóm, hãy cố gắng bứt phá hơn trong học kỳ tiếp theo.",
  "Em tham gia đầy đủ các hoạt động học tập trên lớp, tuy nhiên cần chủ động đặt câu hỏi khi chưa hiểu bài.",
  "Em ghi nhớ tốt các nội dung trọng điểm của bài, cần rèn luyện kỹ năng diễn đạt để câu trả lời thêm lưu loát.",
  "Em có ý thức sửa chữa bài cẩn thận mỗi khi được nhắc nhở, hãy tiếp tục phát huy tinh thần cầu tiến này nhé.",
  "Em tham gia các hoạt động tập thể ở mức trung bình khá, cần nhiệt tình hơn khi phân công các công việc.",
  "Em nắm bắt được yêu cầu của bộ môn, tuy nhiên tốc độ hoàn thành bài tập cần được cải thiện hơn nữa.",
  "Em có khả năng tự giải quyết các bài tập ở mức độ nhận biết, cần rèn thêm các dạng bài tập vận dụng.",
  "Em có thái độ cầu thị khi tiếp thu bài mới, hãy cố gắng rèn luyện thêm khả năng tư duy làm việc độc lập.",
  "Em vượt qua các khâu thực hành ở mức khá, cần có kế hoạch ôn tập khoa học hơn để kết quả được bền vững.",
  "Em đã cố gắng hoàn thành tốt nhiệm vụ được giao, hãy mạnh dạn trình bày sáng kiến của mình với thầy cô nhé.",
  "Em có tinh thần tự học đáng khích lệ, tuy nhiên kĩ năng thực hành cốt lõi vẫn còn lấn cấn đôi chút.",
  "Em chú tâm vào bài giảng của giáo viên khá tốt, cần phát huy sự linh hoạt trong các bài tập dự án dài hạn.",
  "Em đã biết liên hệ cơ bản kiến thức vào thực tế, tuy nhiên cách trình bày đôi khi còn chưa thực sự gãy gọn.",
  "Em nhìn chung đạt được các mục tiêu học tập đề ra, hãy cố gắng tương tác đóng góp ý kiến với các bạn trong tổ.",
  "Em có khả năng hoàn thiện bài tập ở mức độ khá, cần hạn chế nói chuyện riêng để việc thu nhận kiến thức tốt hơn.",
  "Em thực hiện đầy đủ các khâu soạn bài chuẩn bị trước khi đến lớp, hãy duy trì phong độ này một cách bền bỉ nhé.",
  "Em hiểu được các ý chính của bài học, tuy nhiên cách diễn đạt vấn đề đôi lúc vẫn còn thiếu đi sự đồng điệu logic.",
  "Em có nhiều nỗ lực vươn lên trong việc làm bài tập, hãy thật tự tin hơn nữa vào khả năng của chính bản thân mình.",
  "Em làm bài tập rèn luyện khá trọn vẹn, nhưng cần phải chú ý đọc kĩ yêu cầu để né đi những sai sót không đáng có.",
  "Em thực hiện các bước theo hướng dẫn đạt yêu cầu, nhưng đôi chỗ vẫn cần sự gợi ý chỉ dẫn của giáo viên.",
  "Em có trách nhiệm với các khâu chuẩn bị phục vụ bài học của bản thân, hãy cố gắng đa dạng hóa phương pháp rèn tư duy.",
  "Em đi đúng tiến độ kiến thức mà bài giảng hướng tới, rất mong em tự tin xung phong lên bảng giải bài tập nhiều hơn.",
  "Em có nhiều quyết tâm trong các khâu hoàn thiện kỹ năng, dù cho vài chỗ về tỉ lệ độ chính xác cần phải rèn giũa chút xíu.",
  "Em xây dựng được nền tảng kiến thức môn học một cách vững vàng, cần thật sự mạnh dạn thử thách với những yêu cầu độ khó cao.",
  "Em đảm bảo tốt nề nếp kỷ luật trong các giờ học lý thuyết, hãy cố biến những ưu điểm về sự chăm chỉ thành kết quả cao nhất.",
];

const MOCK_MH_C = [
  "Em còn gặp nhiều khó khăn trong việc lĩnh hội kiến thức môn học, gia đình cần đồng hành và kèm cặp thêm cho em tại nhà.",
  "Em chưa hoàn thành đầy đủ các bài tập được giao trên lớp, thầy cô hy vọng em sẽ nỗ lực và tập trung hơn trong thời gian tới.",
  "Em tiếp thu nội dung bài học còn khá chậm so với tiến độ chung, cần phải mạnh dạn nhờ sự hỗ trợ từ giáo viên khi chưa hiểu bài.",
  "Em chưa thể hiện được sự chủ động trong quá trình thực hành, hãy chú ý lắng nghe và làm theo đúng sự hướng dẫn của thầy cô.",
  "Em còn để mất tập trung trong các giờ học lý thuyết, cố gắng rèn luyện nề nếp kỷ luật để kết quả được cải thiện hơn em nhé."
];

const MOCK_SUFFIXES = [
  "điều này rất đáng khen ngợi.",
  "thầy cô giáo rất tự hào về em."
];

function generate40Comments(subjectName) {
  if (!subjectName) return [];
  let name = subjectName.trim();
  let matchedKey = Object.keys(MOCK_PREFIXES).find(k => name.includes(k) || k.includes(name));
  
  if (!matchedKey) {
    for(let k in MOCK_PREFIXES) {
      if(k.toLowerCase() === name.toLowerCase()) matchedKey = k;
    }
  }

  if (!matchedKey) return []; 
  
  let prefs = MOCK_PREFIXES[matchedKey];
  let mids = MOCK_MIDDLES[matchedKey];
  let sufs = MOCK_SUFFIXES;
  
  if (!prefs || !mids) return [];

  let results = [];
  for(let p = 0; p < prefs.length; p++) {
    for(let m = 0; m < mids.length; m++) {
      for(let s = 0; s < sufs.length; s++) {
        results.push(prefs[p] + mids[m] + sufs[s]);
      }
    }
  }
  return results;
}


export const getEmptySubject = (mon, cap, hocKyParam) => {
  let m = mon || "";
  let hk = hocKyParam || "";
  
  // Try to parse 'mon' if it comes as "Môn học_Học kỳ X"
  if (m.includes("_")) {
    const parts = m.split("_");
    if (parts.length >= 2) {
      if (!hk) hk = parts.pop();
      m = parts.join("_");
    }
  }
  
  const safeM = m.trim().toLowerCase();
  const safeHK = hk.trim().toLowerCase();
  
  const subjectStr = safeM ? `môn ${m.replace(/^(môn\s*)/i, '')}` : "môn học";
  let hkStr = safeHK ? `trong ${hk}` : "trong học kỳ";
  if (safeHK.includes("trong")) hkStr = hk; 
  else if (safeHK === "") hkStr = "trong học kỳ";
  else hkStr = `trong ${hk}`;
  
  const totComments = [
    `Em tiếp thu bài nhanh, vận dụng kiến thức linh hoạt, đạt kết quả học tốt ${subjectStr} ${hkStr}.`,
    `Nắm vững kiến thức trọng tâm ${subjectStr}, kĩ năng thực hành thành thạo ${hkStr}.`,
    `Em luôn tự giác, có thái độ học tập tích cực và xuất sắc hoàn thành ${subjectStr} ${hkStr}.`,
    `Tích cực tham gia xây dựng bài, thể hiện năng lực tư duy tốt ở ${subjectStr} ${hkStr}.`,
    `Vận dụng kiến thức ${subjectStr} rất linh hoạt, đạt thành tích đáng tuyên dương ${hkStr}.`,
    `Luôn đi đầu trong các hoạt động học tập ${subjectStr}, kết quả đánh giá ${hkStr} rất tốt.`,
    `Em hoàn thành xuất sắc các yêu cầu cần đạt của ${subjectStr} ${hkStr}.`,
    `Học tập chăm chỉ, phương pháp học khoa học ${subjectStr}, đạt kết quả tốt ở ${hkStr}.`,
    `Thể hiện sự sáng tạo và tư duy logic cao trong ${subjectStr} ${hkStr}.`,
    `Bài kiểm tra và bài làm ${subjectStr} luôn đạt chất lượng cao suốt ${hkStr}.`,
    `Năng lực học tập xuất sắc, nắm bắt nhanh các khái niệm ${subjectStr} ${hkStr}.`,
    `Có kĩ năng phân tích và giải quyết vấn đề cực kì tốt ${subjectStr} ${hkStr}.`,
    `Tự tin thể hiện sự vượt trội, đạt chuẩn yêu cầu tốt ${subjectStr} ${hkStr}.`,
    `Chủ động tìm tòi, mở rộng kiến thức ${subjectStr}, xứng đáng đạt kết quả tốt ${hkStr}.`,
    `Em luôn ý thức được việc tự học và đạt chất lượng ${subjectStr} rất cao ${hkStr}.`,
    `Thể hiện đam mê và năng khiếu học tốt ${subjectStr} trong quá trình học ${hkStr}.`,
    `Sự nỗ lực đạt được kết quả ấn tượng, kĩ năng ${subjectStr} rất vững ${hkStr}.`,
    `Em hoàn thành vượt mức mong đợi các nội dung của ${subjectStr} ${hkStr}.`,
    `Năng lực nhận thức và áp dụng ${subjectStr} rất hoàn thiện ${hkStr}.`,
    `Luôn là tấm gương xuất sắc về thái độ và kết quả học tập ${subjectStr} ${hkStr}.`
  ];

  const khaComments = [
    `Em có cố gắng trong học tập, hiểu và vận dụng kiến thức khá tốt ${subjectStr} ${hkStr}.`,
    `Hoàn thành đầy đủ bài tập được giao, thái độ học nghiêm túc ${subjectStr} ${hkStr}.`,
    `Nắm vững kiến thức cơ bản ${subjectStr}, kết quả học tập đạt mức khá ${hkStr}.`,
    `Em chú ý nghe giảng, tiếp thu tốt các nội dung trọng tâm ${subjectStr} ${hkStr}.`,
    `Cần phát huy hơn nữa sự tự tin ${subjectStr}, kết quả ${hkStr} của em là khá.`,
    `Ý thức học tập tốt, kĩ năng thực hành ${subjectStr} khá vững ${hkStr}.`,
    `Đã hoàn thành các yêu cầu cần đạt ${subjectStr} ${hkStr} ở mức độ khá.`,
    `Nỗ lực học tập, bài làm ${subjectStr} trình bày khá cẩn thận ${hkStr}.`,
    `Đạt học sinh khá ${subjectStr}, cần tích cực hơn ở học kỳ tiếp theo.`,
    `Tư duy ${subjectStr} khá, nhưng đôi lúc cần cẩn thận hơn để đạt điểm cao ${hkStr}.`,
    `Có sự tiến bộ trong ${subjectStr}, khả năng hiểu bài khá tốt suốt ${hkStr}.`,
    `Em đạt yêu cầu ${subjectStr} mức khá, thao tác tư duy khá nhanh ${hkStr}.`,
    `Sự cố gắng của em trong ${subjectStr} được ghi nhận bằng kết quả khá ${hkStr}.`,
    `Chăm chỉ học bài, đáp ứng mức khá các yêu cầu ${subjectStr} ${hkStr}.`,
    `Em thể hiện tinh thần cầu tiến và nhận kết quả học khá ${subjectStr} ${hkStr}.`,
    `Nhìn chung nắm được bài, kết quả khả quan ${subjectStr} ${hkStr}.`,
    `Em phân tích khá tốt ${subjectStr} qua từng tiết của ${hk}.`,
    `Đã biết cách vận dụng bài học ở mức độ khá đối với ${subjectStr} ${hkStr}.`,
    `Có tinh thần tự học, kĩ năng ${subjectStr} đạt yêu cầu khá ${hkStr}.`,
    `Cố gắng ổn định, kết quả học tập ${subjectStr} đạt chuẩn khá ${hkStr}.`
  ];

  const datComments = [
    `Em nắm được kiến thức cơ bản ${subjectStr}, cần chủ động học tập hơn trong lớp ${hkStr}.`,
    `Kết quả ${subjectStr} mức đạt, cần hình thành thói quen tự giác học bài ${hkStr}.`,
    `Em đạt yêu cầu ${subjectStr} ${hkStr}, cần tập trung và nỗ lực nhiều hơn.`,
    `Đã nắm mức kỹ năng tối thiểu, ${subjectStr} của em đạt ${hkStr}.`,
    `Cần rèn luyện tính cẩn thận, kết quả học ${subjectStr} vừa đủ đạt ${hkStr}.`,
    `Có cố gắng tiếp thu ${subjectStr}, tuy nhiên cần siêng năng hơn để nâng điểm ${hkStr}.`,
    `Nhận thức được bài học cơ bản, ${subjectStr} đạt yêu cầu ${hkStr}.`,
    `Học tập còn thiếu sự chủ động, ${subjectStr} đạt chuẩn cơ bản ${hkStr}.`,
    `Cần rèn luyện thêm sự nhạy bén, ${subjectStr} đạt yêu cầu ${hkStr}.`,
    `Em cần khắc phục sự lơ là để tiến bộ hơn, ${subjectStr} đạt ${hkStr}.`,
    `Đạt được năng lực cơ bản ${subjectStr}, cần chú ý vào bài học hơn ${hkStr}.`,
    `Hoàn thành nội dung ${subjectStr} ở mức đạt yêu cầu ${hkStr}.`,
    `Đôi khi chưa thuộc rõ bài, nhưng nhìn chung đạt ${subjectStr} ${hkStr}.`,
    `Thời lượng tự làm bài còn hạn chế, mức độ nắm ${subjectStr} là đạt ${hkStr}.`,
    `Sự tiến bộ chưa thực sự rõ rệt, kết quả ${subjectStr} mức đạt ${hkStr}.`,
    `Phương pháp học còn hạn chế nhưng đủ đạt yêu cầu ${subjectStr} ${hkStr}.`,
    `Em thực hiện vừa đủ các bài tập ${subjectStr}, để đạt yêu cầu ${hkStr}.`,
    `Yêu cầu chương trình ${subjectStr} được em đáp ứng chuẩn đạt ${hkStr}.`,
    `Cần học hỏi thêm từ bè bạn để phát triển vượt mức đạt ${subjectStr} ${hkStr}.`,
    `Duy trì được mức đánh giá Đạt ${subjectStr}, nên cố gắng hơn ${hkStr} tiếp theo.`
  ];

  const chuaDatComments = [
    `Em chưa nắm vững kiến thức trọng tâm ${subjectStr}, cần nỗ lực ôn luyện nhiều hơn ${hkStr}.`,
    `Chưa tự giác học bài tập ${subjectStr}, mức độ tập trung chưa cao, chưa đạt ${hkStr}.`,
    `Kĩ năng làm bài ${subjectStr} còn yếu, kết quả chưa đạt yêu cầu ${hkStr}.`,
    `Thường xuyên thiếu tập trung, kết quả ${subjectStr} chưa đạt ${hkStr}.`,
    `Tiếp thu bài học ${subjectStr} chậm, cần rèn luyện bồi dưỡng thêm để đạt chuẩn ${hkStr}.`
  ];

  const totObj = { min: 8, max: 10, code: "T", mucDG: "T", comments: totComments };
  const khaObj = { min: 6.5, max: 7.9, code: "K", mucDG: "H", comments: khaComments };
  const datObj = { min: 5, max: 6.4, code: "Đ", mucDG: "H", comments: datComments };
  const cdObj  = { min: 0, max: 4.9, code: "CĐ", mucDG: "C", comments: chuaDatComments };
  
  if (isPassFailSubject(cap, mon)) {
    datObj.code = "T";
    datObj.min = 5;
    datObj.max = 10;
    
    return {
      "Đạt": datObj,
      "Chưa Đạt": cdObj,
      "Đ": datObj,
      "CĐ": cdObj
    };
  }

  const dgtxTotObj = { min: 8, max: 10, code: "T", mucDG: "T", comments: totComments };
  const dgtxDatObj = { min: 5, max: 7.9, code: "Đ", mucDG: "Đ", comments: khaComments };
  const dgtxCdObj  = { min: 0, max: 4.9, code: "CĐ", mucDG: "C", comments: chuaDatComments };

  const objT = { min: 8, max: 10, code: "T", mucDG: "T", comments: totComments };
  const objH = { min: 5, max: 7.9, code: "H", mucDG: "H", comments: khaComments };
  const objC = { min: 0, max: 4.9, code: "C", mucDG: "C", comments: chuaDatComments };
  const objD = { min: 5, max: 6.4, code: "Đ", mucDG: "Đ", comments: datComments };
  const objK = { min: 6.5, max: 7.9, code: "K", mucDG: "K", comments: khaComments };
  
  return {
    "Tốt": totObj,
    "Khá": khaObj,
    "Đạt": datObj,
    "Chưa Đạt": cdObj,
    "Đ": objD,
    "K": objK,
    "T": objT,
    "H": objH,
    "C": objC
  };
}; /* getEmptySubject END */


export const getEmptyDGTX = (mon, thang, khoi) => {
  if (thang === "8" || thang === 8) {
    return generateThang8Data(mon, khoi);
  }
  if (thang === "9" || thang === 9) {
    return generateThang9Data(mon, khoi);
  }
  if (thang === "10" || thang === 10) {
    return generateThang10Data(mon, khoi);
  }
  if (thang === "11" || thang === 11) {
    return generateThang11Data(mon, khoi);
  }
  if (thang === "12" || thang === 12) {
    return generateThang12Data(mon, khoi);
  }
  if (thang === "1" || thang === 1) {
    return generateThang1Data(mon, khoi);
  }
  if (thang === "2" || thang === 2) {
    return generateThang2Data(mon, khoi);
  }
  if (thang === "3" || thang === 3) {
    return generateThang3Data(mon, khoi);
  }
  if (thang === "4" || thang === 4) {
    return generateThang4Data(mon, khoi);
  }
  if (thang === "5" || thang === 5) {
    return generateThang5Data(mon, khoi);
  }
  return getEmptySubject(mon, khoi ? (GRADE_LEVELS.TH.includes(khoi) ? "TH" : (GRADE_LEVELS.THCS.includes(khoi) ? "THCS" : "THPT")) : undefined);
};

export const getEmptyThNlPc = () => {
  let fortyNL = generate40Comments("Năng lực chung");
  let fortyPC = generate40Comments("Phẩm chất chủ yếu");
  let fortyNlcH = typeof MOCK_NLC_H !== 'undefined' ? MOCK_NLC_H : [];
  return {
    "Tốt": {
      min: 8, max: 10, code: "T", mucDG: "T",
      comments: fortyNL.length === 40 ? fortyNL : [
        "Năng lực tự chủ tốt, giao tiếp lưu loát, tự tin. Phẩm chất đạo đức Tốt.",
        "Năng động, tích cực tham gia các hoạt động. Luôn trung thực và trách nhiệm.",
        "Có khả năng tự học tốt. Biết chia sẻ và giúp đỡ bạn bè.",
        "Mạnh dạn, tự tin, hòa đồng với bạn bè. Ý thức kỷ luật cao.",
        "Thực hiện tốt các nội quy, quy định. Vận dụng kiến thức vào thực tiễn linh hoạt."
      ]
    },
    "Đạt": {
      min: 5, max: 7.9, code: "Đ", mucDG: "H",
      comments: fortyNlcH.length === 40 ? fortyNlcH : [
        "Trung thực, kỷ luật, đoàn kết với bạn bè. Có tiến bộ trong giao tiếp.",
        "Chăm chỉ học tập. Cần mạnh dạn phát biểu xây dựng bài hơn.",
        "Thực hiện đầy đủ nhiệm vụ học tập. Cần linh hoạt hơn trong xử lý tình huống.",
        "Biết hợp tác với bạn trong nhóm. Đôi lúc còn mất trật tự.",
        "Năng lực tự học đạt yêu cầu. Cần chủ động hơn trong việc tìm hiểu kiến thức bổ sung."
      ]
    },
    "Cần cố gắng": {
      min: 0, max: 4.9, code: "C", mucDG: "C",
      comments: [
        "Chưa chủ động hoàn thành nhiệm vụ học tập. Cần gia đình đôn đốc thêm.",
        "Còn rụt rè, chưa mạnh dạn giao tiếp. Chưa có ý thức giữ gìn vệ sinh chung.",
        "Cần rèn luyện tính kỷ luật trong giờ học. Chưa tích cực tham gia hoạt động nhóm.",
        "Ý thức tự giác chưa cao. Cần thân thiện và hòa đồng hơn với bạn bè.",
        "Chưa hoàn thành các bài tập được giao. Cần rèn luyện thêm về kỹ năng hợp tác."
      ]
    },
    "T": {
      min: 8, max: 10, code: "T", mucDG: "T",
      comments: fortyPC.length === 40 ? fortyPC : [
        "Năng lực tự chủ tốt, giao tiếp lưu loát, tự tin. Phẩm chất đạo đức Tốt.",
        "Năng động, tích cực tham gia các hoạt động. Luôn trung thực và trách nhiệm.",
        "Có khả năng tự học tốt. Biết chia sẻ và giúp đỡ bạn bè.",
        "Mạnh dạn, tự tin, hòa đồng với bạn bè. Ý thức kỷ luật cao.",
        "Thực hiện tốt các nội quy, quy định. Vận dụng kiến thức vào thực tiễn linh hoạt."
      ]
    },
    "H": {
      min: 5, max: 7.9, code: "H", mucDG: "H",
      comments: [
        "Trung thực, kỷ luật, đoàn kết với bạn bè. Có tiến bộ trong giao tiếp.",
        "Chăm chỉ học tập. Cần mạnh dạn phát biểu xây dựng bài hơn.",
        "Thực hiện đầy đủ nhiệm vụ học tập. Cần linh hoạt hơn trong xử lý tình huống.",
        "Biết hợp tác với bạn trong nhóm. Đôi lúc còn mất trật tự.",
        "Năng lực tự học đạt yêu cầu. Cần chủ động hơn trong việc tìm hiểu kiến thức bổ sung."
      ]
    },
    "C": {
      min: 0, max: 4.9, code: "C", mucDG: "C",
      comments: [
        "Chưa chủ động hoàn thành nhiệm vụ học tập. Cần gia đình đôn đốc thêm.",
        "Còn rụt rè, chưa mạnh dạn giao tiếp. Chưa có ý thức giữ gìn vệ sinh chung.",
        "Cần rèn luyện tính kỷ luật trong giờ học. Chưa tích cực tham gia hoạt động nhóm.",
        "Ý thức tự giác chưa cao. Cần thân thiện và hòa đồng hơn với bạn bè.",
        "Chưa hoàn thành các bài tập được giao. Cần rèn luyện thêm về kỹ năng hợp tác."
      ]
    }
  };
};export const getEmptyHocBaGVBM = () => {
  return {
    "Tốt": {
      min: 8,
      max: 10,
      code: "T",
      mucDG: "T",
      comments: [
        "Tiếp thu bài nhanh, vận dụng kiến thức linh hoạt. Hoàn thành tốt nhiệm vụ học tập.",
        "Có ý thức tự giác, luôn hoàn thành xuất sắc các bài tập được giao.",
        "Tích cực phát biểu, đạt kết quả đánh giá Tốt ở bộ môn.",
        "Năng lực học tập tốt, có tư duy môn học rõ ràng, mạch lạc.",
      ],
    },
    "Khá": {
      min: 6.5,
      max: 7.9,
      code: "K",
      mucDG: "H",
      comments: [
        "Có cố gắng trong học tập, hiểu và vận dụng kiến thức đạt mức Khá.",
        "Hoàn thành tốt nhiệm vụ học tập. Cần tự tin hơn trong các giờ thực hành.",
        "Nắm được kiến thức trọng tâm bộ môn, thái độ học tập nghiêm túc.",
        "Thực hiện đầy đủ các nhiệm vụ học tập, kết quả đạt mức Khá.",
      ],
    },
    "Đạt": {
      min: 5,
      max: 6.4,
      code: "Đ",
      mucDG: "H",
      comments: [
        "Nắm được kiến thức cơ bản, tuy nhiên cần chủ động, tích cực hơn.",
        "Có cố gắng trong học tập, nhưng kĩ năng làm bài còn chậm.",
        "Đạt yêu cầu bộ môn. Cần dành thêm thời gian tự học ở nhà.",
        "Khả năng tiếp thu đạt mức khá. Cần nỗ lực ôn tập thường xuyên.",
      ],
    },
    "Chưa Đạt": {
      min: 0,
      max: 4.9,
      code: "CĐ",
      mucDG: "C",
      comments: [
        "Chưa nắm vững kiến thức bộ môn. Cần nỗ lực ôn luyện và trao đổi bài nhiều hơn.",
        "Đôi lúc thiếu tập trung trong giờ. Chưa tự giác làm bài tập về nhà.",
        "Kĩ năng giải quyết vấn đề môn học hạn chế. Cần tăng cường phụ đạo.",
        "Kết quả đánh giá chưa đạt yêu cầu bộ môn. Cần thay đổi phương pháp học.",
      ],
    },
    "T": {
      min: 8,
      max: 10,
      code: "T",
      mucDG: "T",
      comments: [
        "Hiểu bài nhanh, vận dụng kiến thức linh hoạt. Hoàn thành xuất sắc nhiệm vụ.",
        "Theo kịp tiến độ tốt, thái độ học tập tích cực, tự giác.",
        "Chủ động trong học tập. Trình bày bài làm sạch đẹp, rõ ràng.",
        "Tích cực tham gia phát biểu xây dựng bài. Đạt kết quả học tập tốt.",
      ]
    },
    "H": {
      min: 5,
      max: 7.9,
      code: "H",
      mucDG: "H",
      comments: [
        "Nắm được kiến thức cơ bản. Cần rèn luyện tính cẩn thận khi làm bài.",
        "Có cố gắng trong việc tiếp thu bài. Hoàn thành đầy đủ các nhiệm vụ.",
        "Hoàn thành các nội dung bài học. Cần mạnh dạn và tự tin hơn.",
        "Nhận thức cơ bản đạt yêu cầu môn học, tiếp tục duy trì nề nếp.",
      ]
    },
    "C": {
      min: 0,
      max: 4.9,
      code: "C",
      mucDG: "C",
      comments: [
        "Chưa nắm vững kiến thức. Cần giáo viên và gia đình hỗ trợ kèm cặp.",
        "Thường xuyên mất tập trung trong giờ học. Ý thức tự học chưa cao.",
        "Kĩ năng làm bài còn hạn chế. Cần tăng cường thời gian tự học và phụ đạo.",
        "Chưa hoàn thành nội dung học tập bộ môn. Cần sự phối hợp đôn đốc từ gia đình.",
      ]
    }
  };
};


export const getEmptyHocBaGVCN_TH = () => {
  return {
    "Nhận xét chung": {
      min: 0,
      max: 10,
      code: "",
      comments: [
        `- Phẩm chất: Em có ý thức rèn luyện đạo đức, sống hòa đồng với bạn.\n- Năng lực: Em nắm được kiến thức kĩ năng cơ bản.\n- Hoạt động: Em tham gia các hoạt động tập thể.`,
        `- Phẩm chất: Em có cố gắng trong rèn luyện.\n- Năng lực: Em tiếp thu kiến thức ở mức đạt yêu cầu.\n- Hoạt động: Em tham gia các hoạt động của lớp.`,
        `- Phẩm chất: Ngoan ngoãn, lễ phép, chấp hành tốt nội quy trường lớp. Tích cực chủ động trong hoạt động học tập.\n- Năng lực: Có năng lực tự chủ - tự học, giao tiếp - hợp tác. Kết quả thực hiện nhiệm vụ ở mức tốt.\n- Hoạt động: Năng nổ tham gia các hoạt động ngoại khóa.`,
        `- Phẩm chất: Em có ý thức tự giác, tinh thần trách nhiệm cao.\n- Năng lực: Em hoàn thành xuất sắc các nhiệm vụ học tập.\n- Hoạt động: Em tích cực bảo vệ tài sản và môi trường học tập.`,
        `- Phẩm chất: Em chăm ngoan, có ý thức tự học và rèn luyện tốt.\n- Năng lực: Em hoàn thành tốt các bài tập và yêu cầu học tập.\n- Hoạt động: Em tích cực trong các phong trào của lớp.`,
        `- Phẩm chất: Em hòa đồng với bạn bè.\n- Năng lực: Em nắm vững kiến thức ở mức cơ bản.\n- Hoạt động: Em tham gia đầy đủ hoạt động của lớp.`,
        `- Phẩm chất: Em chăm chỉ, tự giác, có tinh thần vượt khó trong học tập.\n- Năng lực: Em học tập nghiêm túc, hoàn thành các yêu cầu học tập.\n- Hoạt động: Em tích cực tham gia sinh hoạt tập thể và giữ gìn môi trường học tập.`,
        `- Phẩm chất: Em lễ phép với thầy cô, chan hòa với bạn bè.\n- Năng lực: Em hiểu bài nhanh, làm bài tập đầy đủ và chính xác.\n- Hoạt động: Em tham gia sôi nổi vào các hoạt động nhóm.`,
        `- Phẩm chất: Em có tinh thần tương thân tương ái, hay giúp đỡ bạn.\n- Năng lực: Tư duy tốt, diễn đạt rõ ràng, hiểu nhanh các bài giảng.\n- Hoạt động: Sẵn sàng tham gia các hoạt động do trường lớp tổ chức.`,
        `- Phẩm chất: Em trung thực, thật thà trong học tập và sinh hoạt.\n- Năng lực: Chủ động tìm tòi, sáng tạo trong việc giải quyết bài tập.\n- Hoạt động: Hoạt động đội nhóm xuất sắc.`,
        `- Phẩm chất: Em ngoan, biết vâng lời, có ý thức kỷ luật cao.\n- Năng lực: Nắm chắc kiến thức, kỹ năng giải quyết tình huống tốt.\n- Hoạt động: Tham gia nhiệt tình các phong trào thi đua.`,
        `- Phẩm chất: Em luôn tự giác chấp hành các quy định của lớp.\n- Năng lực: Có khả năng tự học rất tốt, luôn chủ động nghiên cứu bài mới.\n- Hoạt động: Tích cực đóng góp ý tưởng cho hoạt động lớp.`,
        `- Phẩm chất: Em có thái độ học tập nghiêm túc, tôn trọng mọi người.\n- Năng lực: Năng lực tư duy linh hoạt, giải quyết bài tập nhanh chóng.\n- Hoạt động: Tham gia đầy đủ và tích cực các hoạt động văn nghệ.`,
        `- Phẩm chất: Em có lối sống giản dị, gọn gàng và ngăn nắp.\n- Năng lực: Cẩn thận và tỉ mỉ trong từng bài làm, đạt kết quả cao.\n- Hoạt động: Hoàn thành mọi nhiệm vụ khi được phân công.`,
        `- Phẩm chất: Em có tinh thần trách nhiệm với công việc chung.\n- Năng lực: Giao tiếp tự tin, có khả năng trình bày tốt.\n- Hoạt động: Rất hăng hái phong trào lao động, dọn vệ sinh lớp.`,
        `- Phẩm chất: Em có tinh thần đoàn kết, biết quan tâm chia sẻ.\n- Năng lực: Khả năng ghi nhớ tốt, ứng dụng linh hoạt.\n- Hoạt động: Tích cực tham gia câu lạc bộ học thuật.`,
        `- Phẩm chất: Em kiên trì, không nản chí trước bài tập khó.\n- Năng lực: Kiến thức cơ bản vững vàng, kĩ năng tính toán và ngôn ngữ ổn định.\n- Hoạt động: Tích cực trong tiết sinh hoạt lớp.`,
        `- Phẩm chất: Em ngoan ngoãn, hòa nhã với mọi người xung quanh.\n- Năng lực: Có tiến bộ rõ rệt trong các môn tính toán, tư duy.\n- Hoạt động: Tham gia đều đặn các hoạt động thể thao của lớp.`,
        `- Phẩm chất: Em tự tin, dũng cảm nhận lỗi và sửa lỗi.\n- Năng lực: Phát huy tốt thế mạnh của mình trong từng môn học đặc thù.\n- Hoạt động: Chủ động đề xuất các hoạt động tập thể thú vị.`,
        `- Phẩm chất: Em kính trọng người lớn, nhường nhịn em nhỏ hơn.\n- Năng lực: Học tập tích cực, biết cách sắp xếp thời gian hợp lý.\n- Hoạt động: Hưởng ứng nhanh chóng các đợt quyên góp, từ thiện.`,
        `- Phẩm chất: Em luôn giữ lời hứa, được bạn bè tin yêu.\n- Năng lực: Tập trung lắng nghe, ghi chép cẩn thận.\n- Hoạt động: Thường xuyên giúp đỡ bạn bè trong học tập và sinh hoạt.`,
        `- Phẩm chất: Em điềm đạm, khiêm tốn, biết lắng nghe ý kiến người khác.\n- Năng lực: Có tư duy phản biện tốt, cách giải quyết đa dạng.\n- Hoạt động: Đóng góp tích cực ở các buổi ngoại khóa ngoài trời.`,
        `- Phẩm chất: Em có ý thức giữ gìn vệ sinh cá nhân, vệ sinh chung.\n- Năng lực: Có khả năng đọc hiểu tốt, ghi nhớ nhanh.\n- Hoạt động: Tích cực trong phong trào giữ vở sạch, viết chữ đẹp.`,
        `- Phẩm chất: Em yêu lao động, có thái độ trân trọng thành quả người khác.\n- Năng lực: Học tập có phương pháp, hiệu quả tiếp thu cao.\n- Hoạt động: Hoàn thành xuất sắc nhiệm vụ của một sao đỏ.`,
        `- Phẩm chất: Em chân thành, thẳng thắn, có ý thức vươn lên.\n- Năng lực: Vận dụng tốt những kiến thức đã học vào thực hành.\n- Hoạt động: Tham gia rất nghiêm túc các buổi sinh hoạt dưới cờ.`,
        `- Phẩm chất: Em có tình yêu quê hương, đất nước qua các bài vẽ, bài văn.\n- Năng lực: Tư duy nghệ thuật tốt, chữ viết đẹp, cẩn thận.\n- Hoạt động: Thường xuyên góp bài báo tường cho lớp.`,
        `- Phẩm chất: Em có thái độ cầu thị, ham học hỏi.\n- Năng lực: Hiểu nhanh bài học, nhưng đôi lúc cần cẩn thận hơn.\n- Hoạt động: Năng lượng dồi dào trong các hoạt động vui chơi.`,
        `- Phẩm chất: Em biết tự chăm sóc bản thân, gọn gàng sạch sẽ.\n- Năng lực: Kỹ năng tính nhẩm tốt, giao tiếp rõ ràng mạch lạc.\n- Hoạt động: Có nhiều đóng góp cho phong trào thi đua của lớp.`,
        `- Phẩm chất: Em yêu thương động vật và cây cỏ, biết bảo vệ môi trường.\n- Năng lực: Năng lực thẩm mĩ, ngôn ngữ tốt.\n- Hoạt động: Rất năng nổ trong ngày hội trồng cây, dọn vệ sinh.`,
        `- Phẩm chất: Em ngoan hiền, ít nói nhưng hoàn thành tốt nhiệm vụ.\n- Năng lực: Có tiến bộ đáng kể ở môn tiếng việt, tư duy mở rộng.\n- Hoạt động: Cần cố gắng tham gia mạnh dạn hơn ở hoạt động tập thể.`,
        `- Phẩm chất: Em tự giác thực hiện nội quy lớp học, không đi học muộn.\n- Năng lực: Học đều các môn, có tư duy logic.\n- Hoạt động: Luôn hoàn thành phần việc được phân công nhanh chóng.`,
        `- Phẩm chất: Em lễ phép và thân thiện.\n- Năng lực: Khả năng hợp tác rất tốt, luôn biết phân chia nhiệm vụ.\n- Hoạt động: Là cá nhân nòng cốt của lớp trong hoạt động văn nghệ.`,
        `- Phẩm chất: Em chân thật, biết nhận xét chính xác về bạn bè.\n- Năng lực: Thông minh, có kĩ năng giải quyết vấn đề nhạy bén.\n- Hoạt động: Trưởng nhóm xuất sắc của các phong trào.`,
        `- Phẩm chất: Em có ý thức kỷ luật trong các tiết học.\n- Năng lực: Em chủ động giải quyết nhiệm vụ cơ bản.\n- Hoạt động: Bạn khá hăng hái chơi các trò chơi dân gian do trường tổ chức.`,
        `- Phẩm chất: Em gọn gàng, ngăn nắp, có tinh thần tập thể.\n- Năng lực: Diễn đạt bằng văn bản lưu loát.\n- Hoạt động: Thường xuyên nhận vai trò thư ký trong bài tập nhóm.`,
        `- Phẩm chất: Em siêng năng, biết giúp đỡ gia đình.\n- Năng lực: Lắng nghe tốt, biết học hỏi từ lỗi sai.\n- Hoạt động: Hoàn thành mọi nhiệm vụ hoạt động được giao.`,
        `- Phẩm chất: Em kiên nhẫn, luôn tìm thấy điểm tích cực ở người khác.\n- Năng lực: Nhanh nhạy với con số, tính toán giỏi.\n- Hoạt động: Đồng hành cùng lớp trong mọi phong trào lớn nhỏ.`,
        `- Phẩm chất: Em yêu cái đẹp, chăm chút góc học tập gọn gàng.\n- Năng lực: Sáng tạo tốt trong phân môn mĩ thuật.\n- Hoạt động: Hay tham gia làm các sản phẩm thủ công trang trí lớp.`,
        `- Phẩm chất: Em biết kính trọng người già, hướng dẫn em nhỏ.\n- Năng lực: Tổng hợp các kiến thức đã học rất logic.\n- Hoạt động: Đại diện tiêu biểu trong đợt phát động kế hoạch nhỏ.`,
        `- Phẩm chất: Em luôn nở nụ cười, cởi mở thân thiện với mọi người.\n- Năng lực: T tự tin thuyết trình, có tiềm năng về ngôn ngữ.\n- Hoạt động: Là một quản trò vui tính trong các hoạt động nghỉ giữa giờ.`
      ,
        `- Phẩm chất: Em hiền lành, thân thiện với bạn bè xung quanh.\n- Năng lực: Nắm vững kiến thức trọng tâm, tính toán chính xác.\n- Hoạt động: Tích cực tham gia các phong trào văn nghệ trường.`,
        `- Phẩm chất: Em biết kính trên nhường dưới, lễ phép với thầy cô.\n- Năng lực: Năng lực ngôn ngữ phát triển vượt bậc.\n- Hoạt động: Tham gia phong trào kế hoạch nhỏ rất sôi nổi.`,
        `- Phẩm chất: Em sống nhân ái, thường xuyên giúp tuổi người già.\n- Năng lực: Lắng nghe và tiếp thu bài mới nhanh chóng.\n- Hoạt động: Hoàn thành nhiệm vụ giữ gìn vệ sinh lớp học.`,
        `- Phẩm chất: Em thẳng thắn, dũng cảm nhận khuyết điểm và sửa đổi.\n- Năng lực: Cách giải bài tập logic, rõ ràng, sáng tạo.\n- Hoạt động: Đi đầu trong các buổi lao động công ích của lớp.`,
        `- Phẩm chất: Kỷ luật nề nếp tốt, đi học chuyên cần.\n- Năng lực: Nhớ lâu và ứng dụng kiến thức vào thực tế tốt.\n- Hoạt động: Thường xuyên hỗ trợ bạn trong các hoạt động nhóm.`,
        `- Phẩm chất: Gọn gàng ngăn nắp, biết tự chăm lo bản thân.\n- Năng lực: Trình bày sạch đẹp, có ý thức rèn chữ giữ vở.\n- Hoạt động: Tích cực xây dựng quỹ vì người nghèo.`,
        `- Phẩm chất: Em yêu lao động, trân trọng sản phẩm mình tạo ra.\n- Năng lực: Khả năng tự học cao, tập trung tìm tòi tài liệu.\n- Hoạt động: Năng nổ trong ngày hội thể thao của trường.`,
        `- Phẩm chất: Em khoan dung, không giận hờn bạn bè khi có xích mích.\n- Năng lực: Tiến bộ nhiều về khả năng tính nhẩm.\n- Hoạt động: Tham gia đầy đủ vào nhóm trực nhật hàng tuần.`,
        `- Phẩm chất: Em luôn giữ chữ tín với bạn bè và thầy cô.\n- Năng lực: Sáng tạo trong các môn học có tính nghệ thuật.\n- Hoạt động: Đóng góp bài viết hay cho báo tường của lớp.`,
        `- Phẩm chất: Biết chia sẻ và đồng cảm với mọi người.\n- Năng lực: Trả lời rành mạch, to rõ và lưu loát các câu hỏi.\n- Hoạt động: Hưởng ứng nhanh chóng các đợt thi đua sao đỏ.`,
        `- Phẩm chất: Em ngoan, hòa nhã, ít khi vi phạm nội quy lớp.\n- Năng lực: Đọc bài diễn cảm, hiểu bài học sâu sắc.\n- Hoạt động: Nhiệt tình tham gia chuẩn bị đạo cụ cho lớp.`,
        `- Phẩm chất: Rất kính trọng người lớn tuổi.\n- Năng lực: Phát huy hiệu quả việc tự giác học nhóm.\n- Hoạt động: Tham gia tốt các hội thi bảo vệ môi trường.`,
        `- Phẩm chất: Thể hiện tính trung thực trong kiểm tra và thi cử.\n- Năng lực: Thích khám phá, có tư duy khoa học.\n- Hoạt động: Hoàn thành xuất sắc bài tập của câu lạc bộ.`,
        `- Phẩm chất: Em rất điềm đạm, khiêm nhường.\n- Năng lực: Thể hiện vốn từ vựng phong phú, làm văn tốt.\n- Hoạt động: Luôn đồng hành cùng lớp trong dã ngoại thực tế.`,
        `- Phẩm chất: Em luôn bảo vệ của công và giữ gìn lớp học.\n- Năng lực: Tốc độ hoàn thành bài tập khá tốt.\n- Hoạt động: Nhiệt tình cùng các bạn dọn dẹp vệ sinh trường.`,
        `- Phẩm chất: Tinh thần vượt khó, nỗ lực vươn lên.\n- Năng lực: Hiểu cơ bản các vấn đề, biết cách áp dụng.\n- Hoạt động: Đóng góp công sức lớn trong ngày hội làm lồng đèn.`,
        `- Phẩm chất: Có ý thức tự giác học quy tắc ứng xử.\n- Năng lực: Có tiến bộ đáng kể ở các môn Khoa học, Tự nhiên.\n- Hoạt động: Chuyên cần trong mọi lịch sinh hoạt tập thể của đội.`,
        `- Phẩm chất: Em có lòng biết ơn và trân trọng mọi người.\n- Năng lực: Có khả năng tự nghiên cứu và phản biện.\n- Hoạt động: Xung phong làm người dẫn chương trình cho sự kiện lớp.`,
        `- Phẩm chất: Giữ được nề nếp kỷ luật tốt từ đầu năm.\n- Năng lực: Tư duy nhạy bén, biết cách xử lý bài nâng cao.\n- Hoạt động: Rất năng nổ tổ chức trò chơi cho các bạn giờ ra chơi.`,
        `- Phẩm chất: Tính tình vui vẻ, lạc quan.\n- Năng lực: Tiến bộ nhanh về mặt ngữ pháp và đọc hiểu.\n- Hoạt động: Là một trong những đội viên gương mẫu nhất.`,
        `- Phẩm chất: Sống hòa đồng, thân thiết với tập thể.\n- Năng lực: Tập trung 100% trong giờ học lý thuyết.\n- Hoạt động: Có đóng góp ý tưởng xuất sắc vào kế hoạch dã ngoại.`,
        `- Phẩm chất: Biết quý trọng thời gian học tập và sinh hoạt.\n- Năng lực: Luôn chủ động hoàn thiện kỹ năng làm bài còn yếu.\n- Hoạt động: Tham gia trồng và chăm sóc cây sân trường.`,
        `- Phẩm chất: Em sống nhân ái, có thái độ chừng mực.\n- Năng lực: Diễn đạt vấn đề khúc chiết, dễ hiểu.\n- Hoạt động: Tham gia thi kể chuyện và đạt kết quả khích lệ.`,
        `- Phẩm chất: Em ngoan ngoãn và chăm lo công việc gia đình.\n- Năng lực: Khả năng phân tích bài đọc rất vững.\n- Hoạt động: Đứng ra hòa giải các tranh cãi nhỏ khi hoạt động nhóm.`,
        `- Phẩm chất: Em có sự tự tin, luôn bảo vệ cái đúng.\n- Năng lực: Ghi nhớ công thức và vận dụng tính đúng.\n- Hoạt động: Rất tích cực vào các cuộc thi ảnh do đoàn trường phát động.`,
        `- Phẩm chất: Kính thầy, mến bạn, được đánh giá cao về đạo đức.\n- Năng lực: Khả năng hợp tác và phân chia bài tập rất khoa học.\n- Hoạt động: Thực hành vẽ lưu niệm cùng câu lạc bộ tốt.`,
        `- Phẩm chất: Em giản dị, ít nói nhưng chân thành.\n- Năng lực: Duy trì khả năng học toán ở mức giỏi lâu dài.\n- Hoạt động: Hưởng ứng đợt thu gom giấy vụn rất tốt.`,
        `- Phẩm chất: Biết yêu thương thực vật, động vật xung quanh.\n- Năng lực: Có khả năng truyền đạt kiến thức lại cho bạn bè.\n- Hoạt động: Chủ động đề nghị hỗ trợ cô giáo trong giờ ra chơi.`,
        `- Phẩm chất: Ý thức và tinh thần tập thể đứng top đầu lớp.\n- Năng lực: Khắc phục điểm yếu nhanh, học tập linh hoạt.\n- Hoạt động: Rất hòa đồng, tham gia tốt các trò múa hát tập thể.`,
        `- Phẩm chất: Có thói quen gọn gàng sạch sẽ.\n- Năng lực: Cảm thụ bài văn hay, ngôn ngữ viết đa dạng.\n- Hoạt động: Không vắng mặt trong bất kỳ phong trào đợt lễ nào.`,
        `- Phẩm chất: Nhiệt tình, có suy nghĩ thấu đáo.\n- Năng lực: Học giỏi đều các phân môn lý thuyết, khoa học.\n- Hoạt động: Quản lý nhóm mình làm việc vô cùng chuyên nghiệp.`,
        `- Phẩm chất: Thái độ ôn hòa, tránh xa các cuộc ẩu đả.\n- Năng lực: Hoàn thành vở bài tập không cần nhắc nhở.\n- Hoạt động: Tham gia trò chơi vận động vô cùng nhiệt huyết.`,
        `- Phẩm chất: Em trung thực tuyệt đối trong sinh hoạt.\n- Năng lực: Có đầu óc hệ thống, liệt kê kiến thức rõ ràng.\n- Hoạt động: Sáng tạo khi lên ý tưởng trang trí bảng tin lớp.`,
        `- Phẩm chất: Em chịu khó học hỏi, thái độ cầu thị tiến bộ.\n- Năng lực: Kết quả khảo sát định kỳ có bước đột phá.\n- Hoạt động: Phối hợp ăn ý với ban cán sự lớp lập kế hoạch tuần.`,
        `- Phẩm chất: Biết nhường nhịn, yêu trẻ nhỏ.\n- Năng lực: Thông minh nhanh nhẹn, năng lực suy luận tốt.\n- Hoạt động: Đóng vai trò hạt nhân thúc đẩy các hoạt động sinh hoạt sao.`,
        `- Phẩm chất: Tự giác giữ gìn tài sản cá nhân tốt.\n- Năng lực: Trí nhớ bền, vận dụng kĩ năng học được linh hoạt.\n- Hoạt động: Sẵn sàng trực nhật, không ngại lau dọn.`,
        `- Phẩm chất: Em có sự kiên trì bền bỉ làm bài.\n- Năng lực: Tổng kết kiến thức từng học kỳ khá vững chắc.\n- Hoạt động: Chủ động lên kịch bản múa hát cho lễ khai giảng.`,
        `- Phẩm chất: Trái tim ấm áp, sẵn sàng từ thiện.\n- Năng lực: Thuyết trình hùng biện to rõ trước lớp.\n- Hoạt động: Được khen ngợi trong chiến dịch mùa hè xanh.`,
        `- Phẩm chất: Dũng cảm đi đầu trong việc giữ nội quy.\n- Năng lực: Năng lực thích ứng và tự chủ cực kỳ mạnh mẽ.\n- Hoạt động: Là tuyên truyền viên măng non xuất sắc nhất.`,
        `- Phẩm chất: Em biết trân trọng giá trị truyền thống, lịch sử gia đình.\n- Năng lực: Hoàn thiện kỹ năng môn nghệ thuật rất thẩm mỹ.\n- Hoạt động: Xung phong làm đại sứ văn hóa đọc của lớp.`
      ]
    }
  };
};

export const getEmptyHocBaGVCN = () => {
  return {
    "Nhận xét chung": {
      min: 0,
      max: 10,
      code: "",
      comments: [
        `- Phẩm chất: Chăm ngoan, lễ phép, có trách nhiệm.
- Năng lực: Tự chủ và tự học tốt, giao tiếp tự tin. Hoàn thành xuất sắc nhiệm vụ học tập và rèn luyện.`,
        `- Phẩm chất: Ngoan ngoãn, hòa đồng, tích cực tham gia hoạt động lớp.
- Năng lực: Có khả năng giải quyết vấn đề sáng tạo. Kết quả rèn luyện tốt.`,
        `- Phẩm chất: Trung thực, có tinh thần đoàn kết.
- Năng lực: Hợp tác nhóm hiệu quả, ngôn ngữ lưu loát. Luôn nỗ lực vươn lên trong học tập.`,
        `- Phẩm chất: Có ý thức kỷ luật cao, tôn trọng thầy cô.
- Năng lực: Năng lực tự học tốt, tư duy logic. Hoàn thành tốt các nội dung giáo dục.`,
        `- Phẩm chất: Nhân ái, hay giúp đỡ bạn bè.
- Năng lực: Có năng khiếu đặc thù, tích cực phát biểu. Kết quả học tập và rèn luyện tiến bộ rõ rệt.`,
        `- Phẩm chất: Tác phong nhanh nhẹn, gương mẫu.
- Năng lực: Khả năng tự chủ trong học tập cao. Luôn đi đầu trong các phong trào của đội và trường.`,
        `- Phẩm chất: Chấp hành tốt nội quy, trung thực.
- Năng lực: Giao tiếp lịch sự, hợp tác tích cực. Có ý thức tự giác cao trong các hoạt động giáo dục.`,
        `- Phẩm chất: Lễ phép, khiêm tốn.
- Năng lực: Năng lực tính toán và ngôn ngữ ổn định. Cần phát huy hơn nữa tinh thần chủ động trong giờ học.`,
        `- Phẩm chất: Chăm chỉ, có trách nhiệm với việc chung.
- Năng lực: Tiếp thu bài nhanh, vận dụng kiến thức linh hoạt. Đạt kết quả học tập tốt.`,
        `- Phẩm chất: Ý thức tổ chức kỷ luật tốt, hòa nhã.
- Năng lực: Giải quyết vấn đề nhạy bén. Chủ động chuẩn bị bài chu đáo trước khi đến lớp.`,
        `- Phẩm chất: Ngoan, lễ phép, trung thực.
- Năng lực: Có năng lực tự học, tự nghiên cứu. Kết quả thực hiện các nhiệm vụ học tập ở mức tốt.`,
        `- Phẩm chất: Có tinh thần vượt khó, kiên trì.
- Năng lực: Khả năng hợp tác và chia sẻ với bạn bè tốt. Luôn hoàn thành nhiệm vụ đúng hạn.`,
        `- Phẩm chất: Tôn trọng tập thể, có nếp sống văn minh.
- Năng lực: Năng lực thẩm mỹ tốt. Tích cực tham gia các hoạt động ngoại khóa.`,
        `- Phẩm chất: Hiền lành, lễ phép, đoàn kết.
- Năng lực: Có kĩ năng làm việc nhóm hiệu quả. Cần mạnh dạn hơn trong giao tiếp trước đám đông.`,
        `- Phẩm chất: Có ý thức giữ gìn vệ sinh chung tốt.
- Năng lực: Năng lực tin học và ngoại ngữ có khởi sắc. Luôn nỗ lực đạt kết quả cao.`,
        `- Phẩm chất: Trách nhiệm, tự trọng.
- Năng lực: Tư duy phản biện khá tốt. Có ý thức tìm tòi, sáng tạo trong học tập. Rèn luyện đạo đức tốt.`,
        `- Phẩm chất: Biết vâng lời, thực hiện tốt nội quy.
- Năng lực: Năng lực giao tiếp ở mức tốt. Hoàn thành đầy đủ các yêu cầu rèn luyện.`,
        `- Phẩm chất: Tích cực tham gia lao động và vệ sinh.
- Năng lực: Có khả năng tự đánh giá và điều chỉnh hành vi. Học tập có nhiều tiến bộ.`,
        `- Phẩm chất: Lòng tự trọng cao, trung thực.
- Năng lực: Tiếp thu kiến thức nền tảng vững vàng. Luôn hăng hái tham gia xây dựng bài.`,
        `- Phẩm chất: Khiêm tốn, biết lắng nghe.
- Năng lực: Khả năng giải quyết tình huống tốt. Có tinh thần cầu tiến trong học tập.`,
        `- Phẩm chất: Ngoan, lễ phép, có lối sống lành mạnh.
- Năng lực: Có tiềm năng phát triển các môn khoa học. Kết quả học tập đạt mức khá tốt.`,
        `- Phẩm chất: Ý thức tự giác chấp hành pháp luật và nội quy.
- Năng lực: Phân tích vấn đề thấu đáo. Hoàn thành nhiệm vụ ở mức tốt.`,
        `- Phẩm chất: Đoàn kết, sẵn lòng giúp người khác.
- Năng lực: Năng lực hợp tác rất đáng khen ngợi. Có phương pháp học tập khoa học.`,
        `- Phẩm chất: Chăm ngoan, biết kính trên nhường dưới.
- Năng lực: Năng lực ngôn ngữ phát triển. Hoàn thành tốt chương trình học tập môn học.`,
        `- Phẩm chất: Tự tin, mạnh dạn trong các hoạt động.
- Năng lực: Có tố chất lãnh đạo nhóm. Cần rèn luyện tính kiên nhẫn hơn.`,
        `- Phẩm chất: Trung thực, thẳng thắn.
- Năng lực: Khả năng tự học và tự quản tốt. Luôn duy trì phong độ học tập ổn định.`,
        `- Phẩm chất: Lễ phép, có ý thức bảo vệ môi trường.
- Năng lực: Năng lực thẩm mỹ và thể chất phát triển cân đối. Rèn luyện tốt.`,
        `- Phẩm chất: Chăm chỉ học tập, nếp sống gọn gàng.
- Năng lực: Khả năng ghi nhớ và tái hiện kiến thức tốt. Đạt kết quả giáo dục cao.`,
        `- Phẩm chất: Hòa đồng, thân thiện với bạn bè.
- Năng lực: Có năng khiếu nghệ thuật, tích cực đóng góp cho lớp. Kết quả học tập khá.`,
        `- Phẩm chất: Phẩm chất đạo đức tốt, lối sống giản dị.
- Năng lực: Tư duy độc lập, sáng tạo. Hoàn thành xuất sắc vai trò cá nhân trong tổ.`,
        `- Phẩm chất: Nghiêm túc thực hiện các nhiệm vụ giáo dục.
- Năng lực: Khả năng giao tiếp bằng ngoại ngữ có tiến bộ. Cần nỗ lực hơn.`,
        `- Phẩm chất: Tôn trọng lẽ phải, trung thực.
- Năng lực: Năng lực giải quyết vấn đề hiệu quả. Có ý thức học hỏi bạn bè xung quanh.`,
        `- Phẩm chất: Ngoan, hiền, có ý thức kỷ luật.
- Năng lực: Năng lực tự học ở mức ổn định. Cần tập trung hơn vào các môn học thực hành.`,
        `- Phẩm chất: Có tinh thần tập thể cao, trung thực.
- Năng lực: Năng lực đặc thù từng môn học đạt yêu cầu. Rèn luyện đạo đức khá tốt.`,
        `- Phẩm chất: Luôn kính trọng thầy cô và người lớn.
- Năng lực: Tiếp thu bài bản, trình bày rõ ràng. Đạt mục tiêu học tập năm học.`,
        `- Phẩm chất: Chấp hành nghiêm chỉnh nề nếp trường lớp.
- Năng lực: Có sự chuyển biến tích cực trong nhận thức. Hoàn thành nhiệm vụ rèn luyện.`,
        `- Phẩm chất: Nhân ái, biết sẻ chia khó khăn.
- Năng lực: Năng lực hợp tác nhóm tiến bộ. Cần phát huy tính tự chủ trong việc chuẩn bị bài.`,
        `- Phẩm chất: Có thái độ học tập cầu thị, lễ phép.
- Năng lực: Vận dụng tốt kĩ năng đã học vào thực tế. Kết quả đạt mức khá giỏi.`,
        `- Phẩm chất: Ngoan ngoãn, ham học hỏi.
- Năng lực: Có năng lực tự học và phát hiện vấn đề tốt. Luôn duy trì thái độ tích cực.`,
        `- Phẩm chất: Biết giữ gìn danh dự bản thân và lớp.
- Năng lực: Khả năng giao tiếp linh hoạt. Luôn cố gắng hoàn thành tốt mọi nhiệm vụ.`,
      ]
    }
  };
};

export const getEmptyHieuTruong = (khoi) => {
  let comment = "Duyệt nội dung trên";
  if (khoi === "5") {
    comment = "Duyệt các nội dung trên. Học sinh đủ điều kiện dự xét Hoàn thành chương trình giáo dục Tiểu học.";
  } else if (khoi === "9") {
    comment = "Duyệt các nội dung trên. Học sinh đủ điều kiện dự xét Hoàn thành chương trình giáo dục THCS.";
  } else if (khoi === "12") {
    comment = "Duyệt các nội dung trên. Học sinh đủ điều kiện dự xét Hoàn thành chương trình giáo dục THPT.";
  }

  return {
    "Nhận xét chung": {
      min: 0,
      max: 10,
      code: "",
      mucDG: "",
      comments: [comment]
    }
  };
};

export const getEmptyVneduNlpcHb = (khoi) => {
  return {
    "Năng lực chung": {
      "Nhận xét chung": { comments: [
        "Hoàn thành tốt các nhiệm vụ học tập và rèn luyện.",
        "Phát huy tốt các mặt năng lực vả phẩm chất.",
        "Đạt các yêu cầu về năng lực chung.",
        "Hình thành và phát triển tốt các năng lực cốt lõi."
      ] },
      "Tự chủ và tự học": { comments: [
        "Tích cực, tự giác hoàn thành nhiệm vụ học tập.",
        "Thực hiện tốt các bài tập được giao.",
        "Có ý thức tham gia học tập tốt.",
        "Hăng hái tham gia các hoạt động học tập."
      ] },
      "Giao tiếp và hợp tác": { comments: [
        "Trình bày rõ ràng, mạch lạc.",
        "Giao tiếp tốt, biết lắng nghe và chia sẻ ý kiến.",
        "Diễn đạt rõ ràng, dễ hiểu.",
        "Có kĩ năng giao tiếp tốt, sẵn sàng giúp đỡ các bạn.",
        "Biết lắng nghe người khác."
      ] },
      "GQVĐ và sáng tạo": { comments: [
        "Biết chủ động nghĩ ra những cách khác nhau để giải quyết vấn đề.",
        "Biết vận dụng điều đã học để giải quyết các vấn đề trong học tập.",
        "Phát hiện và nêu được các tình huống có vấn đề trong học tập.",
        "Linh hoạt trong thực hiện các nhiệm vụ học tập."
      ] }
    },
    "Năng lực đặc thù": {
      "Nhận xét năng lực đặc thù": { comments: [
        "Hoàn thành tốt các yêu cầu về năng lực đặc thù.",
        "Phát triển hài hòa thể chất và thẩm mỹ.",
        "Tiếp thu tốt các kiến thức ngôn ngữ, tính toán và khoa học."
      ] },
      "Ngôn ngữ": { comments: [
        "Diễn đạt tốt.",
        "Nói năng lưu loát, rõ ràng.",
        "Trình bày rõ ràng, dễ hiểu.",
        "Khả năng sử dụng ngôn ngữ tốt."
      ] },
      "Tính toán": { comments: [
        "Kĩ năng tính toán tốt.",
        "Tính toán cẩn thận.",
        "Có tư duy toán tốt.",
        "Vận dụng kĩ năng tính toán tốt.",
        "Tính toán chính xác, cẩn thận."
      ] },
      "Khoa học": { comments: [
        "Có ý thức giữ gìn sức khỏe của bản thân.",
        "Yêu thiên nhiên.",
        "Giữ gìn và bảo vệ thiên nhiên.",
        "Có ý thức bảo vệ môi trường.",
        "Thích khám phá, tìm hiểu môi trường tự nhiên."
      ] },
      "Công nghệ": { comments: [
        "Thể hiện sự quan tâm đến công nghệ.",
        "Thích tham gia các hoạt động lắp ráp.",
        "Có ý thức giữ gìn đồ dùng học tập môn công nghệ.",
        "Tích cực tham gia thực hành môn công nghệ."
      ] },
      "Tin học": { comments: [
        "Thể hiện sự hứng thú với môn Tin học.",
        "Thực hiện được các thao tác làm quen với máy tính.",
        "Có ý thức giữ gìn thiết bị phòng máy.",
        "Tích cực tham gia các tiết học môn Tin học."
      ] },
      "Thẩm mĩ": { comments: [
        "Có khiếu thẩm mĩ.",
        "Biết phối kết hợp màu sắc hài hòa.",
        "Diễn tả tốt ý tưởng của bản thân.",
        "Biết thể hiện cảm xúc trước cái đẹp."
      ] },
      "Thể chất": { comments: [
        "Giữ gìn vệ sinh thân thể sạch sẽ.",
        "Thể chất tốt.",
        "Ăn mặc phù hợp với thời tiết.",
        "Tích cực tham gia hoạt động thể thao.",
        "Biết cách giữ gìn vệ sinh phòng bệnh."
      ] }
    },
    "Phẩm chất": {
      "Nhận xét chung": { comments: [
        "Hoàn thành tốt các yêu cầu cần đạt về phẩm chất.",
        "Phát triển tốt các phẩm chất chủ yếu.",
        "Ngoan ngoãn, lễ phép, thân thiện với bạn bè."
      ] },
      "Yêu nước": { comments: [
        "Kính trọng, lễ phép với thầy cô; yêu quý bạn bè.",
        "Bảo vệ của công, giữ gìn bảo vệ môi trường.",
        "Yêu quý người thân trong gia đình.",
        "Đoàn kết, yêu quý bạn bè.",
        "Tích cực tham gia các hoạt động của trường, lớp."
      ] },
      "Nhân ái": { comments: [
        "Biết quan tâm, chia sẻ.",
        "Hòa nhã, thân thiện với bạn bè.",
        "Biết giúp đỡ mọi người.",
        "Cởi mở, hòa nhã với mọi người.",
        "Luôn yêu quí mọi người."
      ] },
      "Chăm chỉ": { comments: [
        "Chăm ngoan, lễ phép, vâng lời.",
        "Đi học đều, đúng giờ.",
        "Tập trung trong giờ học, chăm chú nghe giảng.",
        "Giúp đỡ bố mẹ những việc vừa sức.",
        "Chăm chỉ học tập."
      ] },
      "Trung thực": { comments: [
        "Chấp hành tốt nội quy của trường lớp.",
        "Trung thực trong học tập.",
        "Biết nhường nhịn và chia sẻ.",
        "Giữ trật tự, không làm việc riêng trong giờ học.",
        "Biết giữ lời hứa.",
        "Biết chấp hành nội quy của trường, lớp."
      ] },
      "Trách nhiệm": { comments: [
        "Biết nhận lỗi và sửa lỗi.",
        "Có trách nhiệm trong học tập, rèn luyện bản thân.",
        "Luôn nỗ lực, có trách nhiệm trong học tập.",
        "Biết lắng nghe, nhận xét, góp ý cho bạn.",
        "Luôn chủ động, cố gắng tự hoàn thành việc của mình."
      ] }
    }
  };
};

export const migrateData = (data) => {
  if (!data || Object.keys(data).length === 0 || !data.THCS) return { data: generateAllSampleData(), migrated: true };
  
  let migrated = false;
  // Migrate for new roles if missing
  for (const cap in data) {
    if (cap === "migrated_v3") continue;
    for (const khoi in data[cap]) {
      if (!data[cap][khoi]) continue;
      if (data[cap][khoi].HOC_BA) {
        delete data[cap][khoi].HOC_BA;
        migrated = true;
      }
      if (!data[cap][khoi].HOC_BA_GVBM) {
        data[cap][khoi].HOC_BA_GVBM = getEmptyHocBaGVBM();
        migrated = true;
      }
      if (!data[cap][khoi].HOC_BA_GVCN) {
        data[cap][khoi].HOC_BA_GVCN = getEmptyHocBaGVCN();
        migrated = true;
      }
      if (!data[cap][khoi].HIEU_TRUONG) {
        data[cap][khoi].HIEU_TRUONG = getEmptyHieuTruong(khoi);
        migrated = true;
      }
      if (!data[cap][khoi].DGTX) {
        data[cap][khoi].DGTX = {};
        migrated = true;
      }
      if (cap === "TH" && !data[cap][khoi].TH_NLPC) {
        data[cap][khoi].TH_NLPC = getEmptyThNlPc();
        migrated = true;
      }
    }
  }

  if (!data.migrated_v5) {
    for (const cap in data) {
      if (cap.startsWith("migrated_")) continue;
      for (const khoi in data[cap]) {
          if (data[cap][khoi]) {
            data[cap][khoi].HOC_BA_GVBM = getEmptyHocBaGVBM();
            data[cap][khoi].HOC_BA_GVCN = getEmptyHocBaGVCN();
            data[cap][khoi].HIEU_TRUONG = getEmptyHieuTruong(khoi);
            if (cap === "TH") data[cap][khoi].TH_NLPC = getEmptyThNlPc();
          }
      }
    }
    data.migrated_v5 = true;
    migrated = true;
  }

  if (!data.migrated_v6) {
    for (const cap in data) {
      if (cap.startsWith("migrated_") || cap !== "TH") continue;
      for (const khoi in data[cap]) {
          if (data[cap][khoi]) {
            // Update GVBM
            const subjects = getSubjects(cap, khoi);
            const emptyHocBaGVBM = getEmptyHocBaGVBM();
            const emptyHocBaGVCN = getEmptyHocBaGVCN();
            const emptyHieuTruong = getEmptyHieuTruong(khoi);
            
            for (const mon of subjects) {
              if (!data[cap][khoi].GVBM[mon]) {
                data[cap][khoi].GVBM[mon] = getEmptySubject(mon, cap);
              } else {
                const emptySb = getEmptySubject(mon, cap);
                for (const lv of EVAL_LEVELS_TH) {
                  if (!data[cap][khoi].GVBM[mon][lv]) {
                    data[cap][khoi].GVBM[mon][lv] = emptySb[lv];
                  }
                }
              }
            }

            for (const lv of EVAL_LEVELS_TH) {
              if (!data[cap][khoi].HOC_BA_GVBM[lv]) data[cap][khoi].HOC_BA_GVBM[lv] = emptyHocBaGVBM[lv];
              if (!data[cap][khoi].HOC_BA_GVCN[lv]) data[cap][khoi].HOC_BA_GVCN[lv] = emptyHocBaGVCN[lv];
              if (!data[cap][khoi].HIEU_TRUONG[lv]) data[cap][khoi].HIEU_TRUONG[lv] = emptyHieuTruong[lv];
            }
          }
      }
    }
    data.migrated_v6 = true;
    migrated = true;
  }

  if (!data.migrated_v7) {
    for (const cap in data) {
      if (cap.startsWith("migrated_")) continue;
      for (const khoi in data[cap]) {
        if (data[cap][khoi]) {
          if (!data[cap][khoi].DGTX) {
            data[cap][khoi].DGTX = {};
          }
          const subjects = getSubjects(cap, khoi);
          for (const mon of subjects) {
            if (!data[cap][khoi].DGTX[mon]) {
              data[cap][khoi].DGTX[mon] = getEmptyDGTX(mon);
            }
          }
        }
      }
    }
    data.migrated_v7 = true;
    migrated = true;
  }

  if (!data.migrated_v8) {
    for (const khoi in data["TH"] || {}) {
      if (data["TH"][khoi] && data["TH"][khoi].HOC_BA_GVCN) {
        const emptyHocBaGVCN = getEmptyHocBaGVCN();
        for (const lv of EVAL_LEVELS_TH) {
           data["TH"][khoi].HOC_BA_GVCN[lv] = emptyHocBaGVCN[lv];
        }
      }
    }
    data.migrated_v8 = true;
    migrated = true;
  }

  if (!data.migrated_v9) {
    for (const khoi in data["TH"] || {}) {
      if (data["TH"][khoi]) {
        if (!data["TH"][khoi].DGTX) data["TH"][khoi].DGTX = {};
        for (const subj of DGTX_TONG_HOP_SUBJECTS) {
           data["TH"][khoi].DGTX[subj] = getEmptyDGTX(subj);
        }
      }
    }
    data.migrated_v9 = true;
    migrated = true;
  }

  if (!data.migrated_v10) {
    for (const cap in data) {
      if (cap.startsWith("migrated_")) continue;
      for (const khoi in data[cap]) {
        if (!data[cap][khoi]) continue;
        
        // Reset HOC_BA_GVBM
        if (data[cap][khoi].HOC_BA_GVBM) {
          data[cap][khoi].HOC_BA_GVBM = getEmptyHocBaGVBM();
        }
        
        // Reset HOC_BA_GVCN
        if (data[cap][khoi].HOC_BA_GVCN) {
          data[cap][khoi].HOC_BA_GVCN = getEmptyHocBaGVCN();
        }

        if (cap === "TH") {
          data[cap][khoi].TH_NLPC = getEmptyThNlPc();
        }

        // Reset DGTX
        if (data[cap][khoi].DGTX) {
          const subjects = getSubjects(cap, khoi);
          for (const mon of subjects) {
             data[cap][khoi].DGTX[mon] = getEmptyDGTX(mon);
          }
          if (cap === "TH") {
            for (const subj of DGTX_TONG_HOP_SUBJECTS) {
               data[cap][khoi].DGTX[subj] = getEmptyDGTX(subj);
            }
          }
        }
      }
    }
    data.migrated_v10 = true;
    migrated = true;
  }

  if (!data.migrated_v11) {
    for (const cap in data) {
      if (cap.startsWith("migrated_")) continue;
      for (const khoi in data[cap]) {
        if (!data[cap][khoi]) continue;
        if (data[cap][khoi].DGTX) {
          for (const subj in data[cap][khoi].DGTX) {
            if (data[cap][khoi].DGTX[subj] && data[cap][khoi].DGTX[subj]["Chung"]) {
              data[cap][khoi].DGTX[subj] = getEmptyDGTX(subj);
            }
          }
        }
      }
    }
    data.migrated_v11 = true;
    migrated = true;
  }

  if (!data.migrated_v12) {
    for (const cap in data) {
      if (cap.startsWith("migrated_")) continue;
      for (const khoi in data[cap]) {
        if (!data[cap][khoi]) continue;
        
        // Reset DGTX
        if (data[cap][khoi].DGTX) {
          const subjects = getDGTXSubjects(cap, khoi);
          for (const mon of subjects) {
             data[cap][khoi].DGTX[mon] = getEmptyDGTX(mon);
          }
        }
      }
    }
    data.migrated_v12 = true;
    migrated = true;
  }

  if (!data.migrated_v16) {
    if (data.TH) {
      for (const khoi in data.TH) {
        if (!data.TH[khoi]) continue;
        const renameKeys = (obj) => {
          if (!obj) return;
          if (obj["Hoàn thành Tốt"] && !obj["T"]) { obj["T"] = obj["Hoàn thành Tốt"]; delete obj["Hoàn thành Tốt"]; }
          if (obj["Hoàn thành"] && !obj["H"]) { obj["H"] = obj["Hoàn thành"]; delete obj["Hoàn thành"]; }
          if (obj["Chưa hoàn thành"] && !obj["C"]) { obj["C"] = obj["Chưa hoàn thành"]; delete obj["Chưa hoàn thành"]; }
        };
        
        if (data.TH[khoi].GVBM) {
          for (const mon in data.TH[khoi].GVBM) {
            renameKeys(data.TH[khoi].GVBM[mon]);
          }
        }
        renameKeys(data.TH[khoi].HOC_BA_GVBM);
        renameKeys(data.TH[khoi].HOC_BA_GVCN);
        renameKeys(data.TH[khoi].HIEU_TRUONG);
      }
    }
    data.migrated_v16 = true;
    migrated = true;
  }

  // Handle old array formats in GVBM Toán
  try {
    const testObj = data.THCS["6"].GVBM["Toán"];
    if (testObj && (Array.isArray(testObj["Giỏi"]) || Array.isArray(testObj["Tốt"])), undefined, khoi) {
       // Deeply corrupted with old version format, just regenerate
       return { data: generateAllSampleData(), migrated: true };
    }
  } catch (e) {}

  if (!data.migrated_v15) {
    for (const cap in data) {
      if (cap.startsWith("migrated_")) continue;
      for (const khoi in data[cap]) {
        if (!data[cap][khoi]) continue;
        data[cap][khoi].HOC_BA_GVCN = getEmptyHocBaGVCN();
      }
    }
    data.migrated_v15 = true;
    migrated = true;
  }

  if (!data.migrated_v17) {
    if (data.TH) {
      for (const khoi in data.TH) {
        if (!data.TH[khoi]) continue;
        const renameV17 = (obj) => {
          if (!obj) return;
          if (obj["T"] && !obj["Tốt"]) { obj["Tốt"] = obj["T"]; delete obj["T"]; }
          if (obj["H"] && !obj["Khá"]) { obj["Khá"] = obj["H"]; delete obj["H"]; }
          // If we also want to provide "Đạt" as a clone of "H" if missing:
          if (obj["Khá"] && !obj["Đạt"]) { obj["Đạt"] = JSON.parse(JSON.stringify(obj["Khá"])); obj["Đạt"].code = "Đ"; obj["Đạt"].min = 5; obj["Đạt"].max = 6.4; obj["Đạt"].mucDG = "H"; }
          if (obj["C"] && !obj["Chưa Đạt"]) { obj["Chưa Đạt"] = obj["C"]; delete obj["C"]; }
        };
        
        if (data.TH[khoi].GVBM) {
          for (const mon in data.TH[khoi].GVBM) {
            renameV17(data.TH[khoi].GVBM[mon]);
          }
        }
        if (data.TH[khoi].DGTX) {
          for (const mon in data.TH[khoi].DGTX) {
            renameV17(data.TH[khoi].DGTX[mon]);
          }
        }
        renameV17(data.TH[khoi].HOC_BA_GVBM);
        renameV17(data.TH[khoi].HOC_BA_GVCN);
        renameV17(data.TH[khoi].HIEU_TRUONG);
      }
    }
    data.migrated_v17 = true;
    migrated = true;
  }

  
  if (!data.migrated_v18) {
    const addMucDG = (obj) => {
      if (!obj) return;
      for (const key in obj) {
          if (obj[key] && typeof obj[key] === 'object') {
              if (obj[key].mucDG === undefined) {
                  const c = (obj[key].code || "").toUpperCase();
                  if (c === "T" || c === "TỐT") obj[key].mucDG = "T";
                  else if (c === "K" || c === "KHÁ" || c === "H" || c === "HT") obj[key].mucDG = "H";
                  else if (c === "Đ" || c === "D" || c === "ĐẠT") obj[key].mucDG = "Đ";
                  else if (c === "CĐ" || c === "C" || c === "CHT" || c === "Y") obj[key].mucDG = "C";
                  else obj[key].mucDG = "";
              }
          }
      }
    };
    for (const cap in data) {
       if (cap.startsWith('migrated_')) continue;
       for (const khoi in data[cap]) {
           if (!data[cap][khoi]) continue;
           
           if (data[cap][khoi].GVBM) {
              for (const mon in data[cap][khoi].GVBM) addMucDG(data[cap][khoi].GVBM[mon]);
           }
           if (data[cap][khoi].DGTX) {
              for (const mon in data[cap][khoi].DGTX) addMucDG(data[cap][khoi].DGTX[mon]);
           }
           addMucDG(data[cap][khoi].HOC_BA_GVBM);
           addMucDG(data[cap][khoi].HIEU_TRUONG);
           if (data[cap][khoi].TH_NLPC) addMucDG(data[cap][khoi].TH_NLPC);
       }
    }
    data.migrated_v18 = true;
    migrated = true;
  }

  if (!data.migrated_v19) {
    const updateMucDGDat = (obj) => {
      if (!obj) return;
      for (const key in obj) {
        if (obj[key] && typeof obj[key] === 'object' && obj[key].code === 'Đ') {
           if (obj[key].mucDG === 'Đ') {
               obj[key].mucDG = 'H';
           }
        }
      }
    };
    for (const cap in data) {
       if (cap.startsWith('migrated_')) continue;
       for (const khoi in data[cap]) {
           if (!data[cap][khoi]) continue;
           
           if (data[cap][khoi].GVBM) {
              for (const mon in data[cap][khoi].GVBM) updateMucDGDat(data[cap][khoi].GVBM[mon]);
           }
           if (data[cap][khoi].DGTX) {
              for (const mon in data[cap][khoi].DGTX) updateMucDGDat(data[cap][khoi].DGTX[mon]);
           }
           updateMucDGDat(data[cap][khoi].HOC_BA_GVBM);
           updateMucDGDat(data[cap][khoi].HIEU_TRUONG);
           // TH_NLPC uses 'Đ' not 'H'
       }
    }
    data.migrated_v19 = true;
    migrated = true;
  }

  if (!data.migrated_v20) {
    for (const khoi in data.TH || {}) {
      if (data.TH[khoi] && data.TH[khoi].TH_NLPC) {
        const dObj = data.TH[khoi].TH_NLPC["Đạt"];
        if (dObj && dObj.code === "D") {
          dObj.code = "Đ";
        }
      }
    }
    data.migrated_v20 = true;
    migrated = true;
  }

  if (!data.migrated_v23) {
    for (const cap in data) {
      if (cap.startsWith("migrated_")) continue;
      for (const khoi in data[cap]) {
        if (!data[cap][khoi] || !data[cap][khoi].DGTX) continue;
        const dgtxKeys = Object.keys(data[cap][khoi].DGTX);
        const existingMainKeys = new Set();
        
        for (const k of dgtxKeys) {
          if (k.endsWith("_Thang9")) {
            const mainKey = k.replace("_Thang9", "");
            existingMainKeys.add(mainKey);
            data[cap][khoi].DGTX[k] = getEmptyDGTX(mainKey, 9, khoi);
          } else if (k.endsWith("_Thang10")) {
            const mainKey = k.replace("_Thang10", "");
            existingMainKeys.add(mainKey);
            data[cap][khoi].DGTX[k] = getEmptyDGTX(mainKey, 10, khoi);
          }
        }
        
        // Ensure that any main key that exists has both Thang9 and Thang10
        for (const mainKey of existingMainKeys) {
           if (!data[cap][khoi].DGTX[`${mainKey}_Thang9`]) data[cap][khoi].DGTX[`${mainKey}_Thang9`] = getEmptyDGTX(mainKey, 9, khoi);
           if (!data[cap][khoi].DGTX[`${mainKey}_Thang10`]) data[cap][khoi].DGTX[`${mainKey}_Thang10`] = getEmptyDGTX(mainKey, 10, khoi);
        }
        // Also ensure all subjects have _Thang9 and _Thang10 initialized
        const subjects = getDGTXSubjects(cap, khoi);
        for (const mon of subjects) {
           const t9Key = cap === "TH" ? `${mon}_Môn học và hoạt động giáo dục_Thang9` : `${mon}_Thang9`;
           data[cap][khoi].DGTX[t9Key] = getEmptyDGTX(mon, 9, khoi);
           
           const t10Key = cap === "TH" ? `${mon}_Môn học và hoạt động giáo dục_Thang10` : `${mon}_Thang10`;
           data[cap][khoi].DGTX[t10Key] = getEmptyDGTX(mon, 10, khoi);
           
           if (cap === "TH") {
               const nlcKey = `${mon}_Nhận xét năng lực chung_Thang9`;
               const nldKey = `${mon}_Nhận xét năng lực đặc thù_Thang9`;
               const pcKey = `${mon}_Nhận xét phẩm chất chủ yếu_Thang9`;
               data[cap][khoi].DGTX[nlcKey] = getEmptyDGTX(`${mon}_Nhận xét năng lực chung`, 9, khoi);
               data[cap][khoi].DGTX[nldKey] = getEmptyDGTX(`${mon}_Nhận xét năng lực đặc thù`, 9, khoi);
               data[cap][khoi].DGTX[pcKey] = getEmptyDGTX(`${mon}_Nhận xét phẩm chất chủ yếu`, 9, khoi);

               const nlc10Key = `${mon}_Nhận xét năng lực chung_Thang10`;
               const nld10Key = `${mon}_Nhận xét năng lực đặc thù_Thang10`;
               const pc10Key = `${mon}_Nhận xét phẩm chất chủ yếu_Thang10`;
               data[cap][khoi].DGTX[nlc10Key] = getEmptyDGTX(`${mon}_Nhận xét năng lực chung`, 10, khoi);
               data[cap][khoi].DGTX[nld10Key] = getEmptyDGTX(`${mon}_Nhận xét năng lực đặc thù`, 10, khoi);
               data[cap][khoi].DGTX[pc10Key] = getEmptyDGTX(`${mon}_Nhận xét phẩm chất chủ yếu`, 10, khoi);
           }
        }
        
        if (cap === "TH") {
             const thSubjects = ["Sổ tổng hợp - Môn học và HĐGD", "Sổ tổng hợp - Năng lực chung", "Sổ tổng hợp - Năng lực đặc thù", "Sổ tổng hợp - Phẩm chất chủ yếu"];
             for (const subj of thSubjects) {
                  data[cap][khoi].DGTX[`${subj}_Thang9`] = getEmptyDGTX(subj, 9, khoi);
                  data[cap][khoi].DGTX[`${subj}_Thang10`] = getEmptyDGTX(subj, 10, khoi);
             }
        }
      }
    }
    data.migrated_v23 = true;
    migrated = true;
  }


  if (!data.migrated_v24) {
    for (const cap in data) {
      if (cap.startsWith("migrated_")) continue;
      for (const khoi in data[cap]) {
        if (!data[cap][khoi] || !data[cap][khoi].DGTX) continue;
        const dgtxKeys = Object.keys(data[cap][khoi].DGTX);
        const existingMainKeys = new Set();
        
        for (const k of dgtxKeys) {
          if (k.endsWith("_Thang9")) {
            const mainKey = k.replace("_Thang9", "");
            existingMainKeys.add(mainKey);
            data[cap][khoi].DGTX[k] = getEmptyDGTX(mainKey, 9, khoi);
          } else if (k.endsWith("_Thang10")) {
            const mainKey = k.replace("_Thang10", "");
            existingMainKeys.add(mainKey);
            data[cap][khoi].DGTX[k] = getEmptyDGTX(mainKey, 10, khoi);
          } else if (k.endsWith("_Thang11")) {
            const mainKey = k.replace("_Thang11", "");
            existingMainKeys.add(mainKey);
            data[cap][khoi].DGTX[k] = getEmptyDGTX(mainKey, 11, khoi);
          } else if (k.endsWith("_Thang12")) {
            const mainKey = k.replace("_Thang12", "");
            existingMainKeys.add(mainKey);
            data[cap][khoi].DGTX[k] = getEmptyDGTX(mainKey, 12, khoi);
          }
        }
        
        // Ensure that any main key that exists has 9, 10, 11, 12
        for (const mainKey of existingMainKeys) {
           if (!data[cap][khoi].DGTX[`${mainKey}_Thang9`]) data[cap][khoi].DGTX[`${mainKey}_Thang9`] = getEmptyDGTX(mainKey, 9, khoi);
           if (!data[cap][khoi].DGTX[`${mainKey}_Thang10`]) data[cap][khoi].DGTX[`${mainKey}_Thang10`] = getEmptyDGTX(mainKey, 10, khoi);
           if (!data[cap][khoi].DGTX[`${mainKey}_Thang11`]) data[cap][khoi].DGTX[`${mainKey}_Thang11`] = getEmptyDGTX(mainKey, 11, khoi);
           if (!data[cap][khoi].DGTX[`${mainKey}_Thang12`]) data[cap][khoi].DGTX[`${mainKey}_Thang12`] = getEmptyDGTX(mainKey, 12, khoi);
        }
        
        const subjects = getDGTXSubjects(cap, khoi);
        for (const mon of subjects) {
           const t11Key = cap === "TH" ? `${mon}_Môn học và hoạt động giáo dục_Thang11` : `${mon}_Thang11`;
           data[cap][khoi].DGTX[t11Key] = getEmptyDGTX(mon, 11, khoi);
           
           const t12Key = cap === "TH" ? `${mon}_Môn học và hoạt động giáo dục_Thang12` : `${mon}_Thang12`;
           data[cap][khoi].DGTX[t12Key] = getEmptyDGTX(mon, 12, khoi);
           
           if (cap === "TH") {
               const nlc11Key = `${mon}_Nhận xét năng lực chung_Thang11`;
               const nld11Key = `${mon}_Nhận xét năng lực đặc thù_Thang11`;
               const pc11Key = `${mon}_Nhận xét phẩm chất chủ yếu_Thang11`;
               data[cap][khoi].DGTX[nlc11Key] = getEmptyDGTX(`${mon}_Nhận xét năng lực chung`, 11, khoi);
               data[cap][khoi].DGTX[nld11Key] = getEmptyDGTX(`${mon}_Nhận xét năng lực đặc thù`, 11, khoi);
               data[cap][khoi].DGTX[pc11Key] = getEmptyDGTX(`${mon}_Nhận xét phẩm chất chủ yếu`, 11, khoi);

               const nlc12Key = `${mon}_Nhận xét năng lực chung_Thang12`;
               const nld12Key = `${mon}_Nhận xét năng lực đặc thù_Thang12`;
               const pc12Key = `${mon}_Nhận xét phẩm chất chủ yếu_Thang12`;
               data[cap][khoi].DGTX[nlc12Key] = getEmptyDGTX(`${mon}_Nhận xét năng lực chung`, 12, khoi);
               data[cap][khoi].DGTX[nld12Key] = getEmptyDGTX(`${mon}_Nhận xét năng lực đặc thù`, 12, khoi);
               data[cap][khoi].DGTX[pc12Key] = getEmptyDGTX(`${mon}_Nhận xét phẩm chất chủ yếu`, 12, khoi);
           }
        }
        
        if (cap === "TH") {
             const thSubjects = ["Sổ tổng hợp - Môn học và HĐGD", "Sổ tổng hợp - Năng lực chung", "Sổ tổng hợp - Năng lực đặc thù", "Sổ tổng hợp - Phẩm chất chủ yếu"];
             for (const subj of thSubjects) {
                  data[cap][khoi].DGTX[`${subj}_Thang11`] = getEmptyDGTX(subj, 11, khoi);
                  data[cap][khoi].DGTX[`${subj}_Thang12`] = getEmptyDGTX(subj, 12, khoi);
             }
        }
      }
    }
    data.migrated_v24 = true;
    migrated = true;
  }


  if (!data.migrated_v25) {
    for (const cap in data) {
      if (cap.startsWith("migrated_")) continue;
      for (const khoi in data[cap]) {
        if (!data[cap][khoi] || !data[cap][khoi].DGTX) continue;
        const dgtxKeys = Object.keys(data[cap][khoi].DGTX);
        const existingMainKeys = new Set();
        
        for (const k of dgtxKeys) {
          if (k.endsWith("_Thang9")) {
            const mainKey = k.replace("_Thang9", "");
            existingMainKeys.add(mainKey);
            data[cap][khoi].DGTX[k] = getEmptyDGTX(mainKey, 9, khoi);
          } else if (k.endsWith("_Thang10")) {
            const mainKey = k.replace("_Thang10", "");
            existingMainKeys.add(mainKey);
            data[cap][khoi].DGTX[k] = getEmptyDGTX(mainKey, 10, khoi);
          } else if (k.endsWith("_Thang11")) {
            const mainKey = k.replace("_Thang11", "");
            existingMainKeys.add(mainKey);
            data[cap][khoi].DGTX[k] = getEmptyDGTX(mainKey, 11, khoi);
          } else if (k.endsWith("_Thang12")) {
            const mainKey = k.replace("_Thang12", "");
            existingMainKeys.add(mainKey);
            data[cap][khoi].DGTX[k] = getEmptyDGTX(mainKey, 12, khoi);
          } else if (k.endsWith("_Thang1")) {
            const mainKey = k.replace("_Thang1", "");
            existingMainKeys.add(mainKey);
            data[cap][khoi].DGTX[k] = getEmptyDGTX(mainKey, 1, khoi);
          } else if (k.endsWith("_Thang2")) {
            const mainKey = k.replace("_Thang2", "");
            existingMainKeys.add(mainKey);
            data[cap][khoi].DGTX[k] = getEmptyDGTX(mainKey, 2, khoi);
          }
        }
        
        // Ensure that any main key that exists has 1, 2
        for (const mainKey of existingMainKeys) {
           if (!data[cap][khoi].DGTX[`${mainKey}_Thang1`]) data[cap][khoi].DGTX[`${mainKey}_Thang1`] = getEmptyDGTX(mainKey, 1, khoi);
           if (!data[cap][khoi].DGTX[`${mainKey}_Thang2`]) data[cap][khoi].DGTX[`${mainKey}_Thang2`] = getEmptyDGTX(mainKey, 2, khoi);
        }
        
        const subjects = getDGTXSubjects(cap, khoi);
        for (const mon of subjects) {
           const t1Key = cap === "TH" ? `${mon}_Môn học và hoạt động giáo dục_Thang1` : `${mon}_Thang1`;
           data[cap][khoi].DGTX[t1Key] = getEmptyDGTX(mon, 1, khoi);
           
           const t2Key = cap === "TH" ? `${mon}_Môn học và hoạt động giáo dục_Thang2` : `${mon}_Thang2`;
           data[cap][khoi].DGTX[t2Key] = getEmptyDGTX(mon, 2, khoi);
           
           if (cap === "TH") {
               const nlc1Key = `${mon}_Nhận xét năng lực chung_Thang1`;
               const nld1Key = `${mon}_Nhận xét năng lực đặc thù_Thang1`;
               const pc1Key = `${mon}_Nhận xét phẩm chất chủ yếu_Thang1`;
               data[cap][khoi].DGTX[nlc1Key] = getEmptyDGTX(`${mon}_Nhận xét năng lực chung`, 1, khoi);
               data[cap][khoi].DGTX[nld1Key] = getEmptyDGTX(`${mon}_Nhận xét năng lực đặc thù`, 1, khoi);
               data[cap][khoi].DGTX[pc1Key] = getEmptyDGTX(`${mon}_Nhận xét phẩm chất chủ yếu`, 1, khoi);

               const nlc2Key = `${mon}_Nhận xét năng lực chung_Thang2`;
               const nld2Key = `${mon}_Nhận xét năng lực đặc thù_Thang2`;
               const pc2Key = `${mon}_Nhận xét phẩm chất chủ yếu_Thang2`;
               data[cap][khoi].DGTX[nlc2Key] = getEmptyDGTX(`${mon}_Nhận xét năng lực chung`, 2, khoi);
               data[cap][khoi].DGTX[nld2Key] = getEmptyDGTX(`${mon}_Nhận xét năng lực đặc thù`, 2, khoi);
               data[cap][khoi].DGTX[pc2Key] = getEmptyDGTX(`${mon}_Nhận xét phẩm chất chủ yếu`, 2, khoi);
           }
        }
        
        if (cap === "TH") {
             const thSubjects = ["Sổ tổng hợp - Môn học và HĐGD", "Sổ tổng hợp - Năng lực chung", "Sổ tổng hợp - Năng lực đặc thù", "Sổ tổng hợp - Phẩm chất chủ yếu"];
             for (const subj of thSubjects) {
                  data[cap][khoi].DGTX[`${subj}_Thang1`] = getEmptyDGTX(subj, 1, khoi);
                  data[cap][khoi].DGTX[`${subj}_Thang2`] = getEmptyDGTX(subj, 2, khoi);
             }
        }
      }
    }
    data.migrated_v25 = true;
    migrated = true;
  }


  if (!data.migrated_v26) {
    for (const cap in data) {
      if (cap.startsWith("migrated_")) continue;
      for (const khoi in data[cap]) {
        if (!data[cap][khoi] || !data[cap][khoi].DGTX) continue;
        const dgtxKeys = Object.keys(data[cap][khoi].DGTX);
        const existingMainKeys = new Set();
        
        for (const k of dgtxKeys) {
          if (k.endsWith("_Thang3")) {
            const mainKey = k.replace("_Thang3", "");
            existingMainKeys.add(mainKey);
            data[cap][khoi].DGTX[k] = getEmptyDGTX(mainKey, 3, khoi);
          } else if (k.endsWith("_Thang4")) {
            const mainKey = k.replace("_Thang4", "");
            existingMainKeys.add(mainKey);
            data[cap][khoi].DGTX[k] = getEmptyDGTX(mainKey, 4, khoi);
          }
        }
        
        // Ensure that any main key that exists has 3, 4
        for (const mainKey of existingMainKeys) {
           if (!data[cap][khoi].DGTX[`${mainKey}_Thang3`]) data[cap][khoi].DGTX[`${mainKey}_Thang3`] = getEmptyDGTX(mainKey, 3, khoi);
           if (!data[cap][khoi].DGTX[`${mainKey}_Thang4`]) data[cap][khoi].DGTX[`${mainKey}_Thang4`] = getEmptyDGTX(mainKey, 4, khoi);
        }
        
        const subjects = getDGTXSubjects(cap, khoi);
        for (const mon of subjects) {
           const t3Key = cap === "TH" ? `${mon}_Môn học và hoạt động giáo dục_Thang3` : `${mon}_Thang3`;
           data[cap][khoi].DGTX[t3Key] = getEmptyDGTX(mon, 3, khoi);
           
           const t4Key = cap === "TH" ? `${mon}_Môn học và hoạt động giáo dục_Thang4` : `${mon}_Thang4`;
           data[cap][khoi].DGTX[t4Key] = getEmptyDGTX(mon, 4, khoi);
           
           if (cap === "TH") {
               const nlc3Key = `${mon}_Nhận xét năng lực chung_Thang3`;
               const nld3Key = `${mon}_Nhận xét năng lực đặc thù_Thang3`;
               const pc3Key = `${mon}_Nhận xét phẩm chất chủ yếu_Thang3`;
               data[cap][khoi].DGTX[nlc3Key] = getEmptyDGTX(`${mon}_Nhận xét năng lực chung`, 3, khoi);
               data[cap][khoi].DGTX[nld3Key] = getEmptyDGTX(`${mon}_Nhận xét năng lực đặc thù`, 3, khoi);
               data[cap][khoi].DGTX[pc3Key] = getEmptyDGTX(`${mon}_Nhận xét phẩm chất chủ yếu`, 3, khoi);

               const nlc4Key = `${mon}_Nhận xét năng lực chung_Thang4`;
               const nld4Key = `${mon}_Nhận xét năng lực đặc thù_Thang4`;
               const pc4Key = `${mon}_Nhận xét phẩm chất chủ yếu_Thang4`;
               data[cap][khoi].DGTX[nlc4Key] = getEmptyDGTX(`${mon}_Nhận xét năng lực chung`, 4, khoi);
               data[cap][khoi].DGTX[nld4Key] = getEmptyDGTX(`${mon}_Nhận xét năng lực đặc thù`, 4, khoi);
               data[cap][khoi].DGTX[pc4Key] = getEmptyDGTX(`${mon}_Nhận xét phẩm chất chủ yếu`, 4, khoi);
           }
        }
        
        if (cap === "TH") {
             const thSubjects = ["Sổ tổng hợp - Môn học và HĐGD", "Sổ tổng hợp - Năng lực chung", "Sổ tổng hợp - Năng lực đặc thù", "Sổ tổng hợp - Phẩm chất chủ yếu"];
             for (const subj of thSubjects) {
                  data[cap][khoi].DGTX[`${subj}_Thang3`] = getEmptyDGTX(subj, 3, khoi);
                  data[cap][khoi].DGTX[`${subj}_Thang4`] = getEmptyDGTX(subj, 4, khoi);
             }
        }
      }
    }
    data.migrated_v26 = true;
    migrated = true;
  }


  if (!data.migrated_v27) {
    for (const cap in data) {
      if (cap.startsWith("migrated_")) continue;
      for (const khoi in data[cap]) {
        if (!data[cap][khoi] || !data[cap][khoi].DGTX) continue;
        const dgtxKeys = Object.keys(data[cap][khoi].DGTX);
        const existingMainKeys = new Set();
        
        for (const k of dgtxKeys) {
          if (k.endsWith("_Thang5")) {
            const mainKey = k.replace("_Thang5", "");
            existingMainKeys.add(mainKey);
            data[cap][khoi].DGTX[k] = getEmptyDGTX(mainKey, 5, khoi);
          } else if (k.endsWith("_Thang8")) {
            const mainKey = k.replace("_Thang8", "");
            existingMainKeys.add(mainKey);
            data[cap][khoi].DGTX[k] = getEmptyDGTX(mainKey, 8, khoi);
          }
        }
        
        // Ensure that any main key that exists has 5, 8
        for (const mainKey of existingMainKeys) {
           if (!data[cap][khoi].DGTX[`${mainKey}_Thang5`]) data[cap][khoi].DGTX[`${mainKey}_Thang5`] = getEmptyDGTX(mainKey, 5, khoi);
           if (!data[cap][khoi].DGTX[`${mainKey}_Thang8`]) data[cap][khoi].DGTX[`${mainKey}_Thang8`] = getEmptyDGTX(mainKey, 8, khoi);
        }
        
        const subjects = getDGTXSubjects(cap, khoi);
        for (const mon of subjects) {
           const t5Key = cap === "TH" ? `${mon}_Môn học và hoạt động giáo dục_Thang5` : `${mon}_Thang5`;
           data[cap][khoi].DGTX[t5Key] = getEmptyDGTX(mon, 5, khoi);
           
           const t8Key = cap === "TH" ? `${mon}_Môn học và hoạt động giáo dục_Thang8` : `${mon}_Thang8`;
           data[cap][khoi].DGTX[t8Key] = getEmptyDGTX(mon, 8, khoi);
           
           if (cap === "TH") {
               const nlc5Key = `${mon}_Nhận xét năng lực chung_Thang5`;
               const nld5Key = `${mon}_Nhận xét năng lực đặc thù_Thang5`;
               const pc5Key = `${mon}_Nhận xét phẩm chất chủ yếu_Thang5`;
               data[cap][khoi].DGTX[nlc5Key] = getEmptyDGTX(`${mon}_Nhận xét năng lực chung`, 5, khoi);
               data[cap][khoi].DGTX[nld5Key] = getEmptyDGTX(`${mon}_Nhận xét năng lực đặc thù`, 5, khoi);
               data[cap][khoi].DGTX[pc5Key] = getEmptyDGTX(`${mon}_Nhận xét phẩm chất chủ yếu`, 5, khoi);

               const nlc8Key = `${mon}_Nhận xét năng lực chung_Thang8`;
               const nld8Key = `${mon}_Nhận xét năng lực đặc thù_Thang8`;
               const pc8Key = `${mon}_Nhận xét phẩm chất chủ yếu_Thang8`;
               data[cap][khoi].DGTX[nlc8Key] = getEmptyDGTX(`${mon}_Nhận xét năng lực chung`, 8, khoi);
               data[cap][khoi].DGTX[nld8Key] = getEmptyDGTX(`${mon}_Nhận xét năng lực đặc thù`, 8, khoi);
               data[cap][khoi].DGTX[pc8Key] = getEmptyDGTX(`${mon}_Nhận xét phẩm chất chủ yếu`, 8, khoi);
           }
        }
        
        if (cap === "TH") {
             const thSubjects = ["Sổ tổng hợp - Môn học và HĐGD", "Sổ tổng hợp - Năng lực chung", "Sổ tổng hợp - Năng lực đặc thù", "Sổ tổng hợp - Phẩm chất chủ yếu"];
             for (const subj of thSubjects) {
                  data[cap][khoi].DGTX[`${subj}_Thang5`] = getEmptyDGTX(subj, 5, khoi);
                  data[cap][khoi].DGTX[`${subj}_Thang8`] = getEmptyDGTX(subj, 8, khoi);
             }
        }
      }
    }
    data.migrated_v27 = true;
    migrated = true;
  }

  
  if (!data.migrated_v29) {
    for (const khoi in data.TH || {}) {
      if (data.TH[khoi] && data.TH[khoi].HOC_BA_GVCN) {
        data.TH[khoi].HOC_BA_GVCN = getEmptyHocBaGVCN_TH();
      }
    }
    data.migrated_v29 = true;
    migrated = true;
  }

  if (!data.migrated_v30) {
    for (const cap in data) {
      if (cap.startsWith("migrated_")) continue;
      for (const khoi in data[cap] || {}) {
        if (data[cap][khoi] && data[cap][khoi].HIEU_TRUONG) {
          const oldHT = data[cap][khoi].HIEU_TRUONG;
          if (oldHT["Tốt"] || oldHT["T"]) {
            let allComments = [];
            for (const key in oldHT) {
              if (oldHT[key] && oldHT[key].comments) {
                allComments = allComments.concat(oldHT[key].comments);
              }
            }
            allComments = [...new Set(allComments)];
            if (allComments.length === 0) {
              data[cap][khoi].HIEU_TRUONG = getEmptyHieuTruong(khoi);
            } else {
              data[cap][khoi].HIEU_TRUONG = {
                "Nhận xét chung": {
                  min: 0, max: 10, code: "", mucDG: "", comments: allComments
                }
              };
            }
          }
        }
      }
    }
    data.migrated_v30 = true;
    migrated = true;
  }

  if (!data.migrated_v31) {
    for (const khoi in data.TH || {}) {
      if (data.TH[khoi]) {
        if (!data.TH[khoi].VNEDU_NLPC_HB) {
          data.TH[khoi].VNEDU_NLPC_HB = getEmptyVneduNlpcHb(khoi);
        }
      }
    }
    data.migrated_v31 = true;
    migrated = true;
  }

  if (!data.migrated_v32) {
    for (const khoi in data.TH || {}) {
      if (data.TH[khoi]) {
        // Force overwrite to apply standard PDF comments
        data.TH[khoi].VNEDU_NLPC_HB = getEmptyVneduNlpcHb(khoi);
      }
    }
    data.migrated_v32 = true;
    migrated = true;
  }

  if (!data.migrated_v33) {
    // Force upgrade THCS Pass/Fail subjects
    if (data.THCS) {
        for (const khoi in data.THCS) {
            if (data.THCS[khoi] && data.THCS[khoi].GVBM) {
                ["Giáo dục thể chất", "Nghệ thuật", "Âm nhạc", "Mĩ thuật", "Nội dung giáo dục địa phương"].forEach(subj => {
                    data.THCS[khoi].GVBM[subj] = getEmptySubject(subj, 'THCS');
                });
            }
        }
    }
    // Force upgrade Cong Nghe THCS/THPT
    ['THCS', 'THPT'].forEach(cap => {
        if (data[cap]) {
            for (const khoi in data[cap]) {
                if (data[cap][khoi] && data[cap][khoi].GVBM && data[cap][khoi].GVBM['Công nghệ']) {
                    data[cap][khoi].GVBM['Công nghệ'] = getEmptySubject('Công nghệ', cap);
                }
            }
        }
    });
    data.migrated_v33 = true;
    migrated = true;
  }

  if (!data.migrated_v6_hocky) {
    for (const cap of ["THCS", "THPT"]) {
      if (data[cap]) {
        for (const khoi in data[cap]) {
          if (data[cap][khoi] && data[cap][khoi].GVBM) {
            const gvbm = data[cap][khoi].GVBM;
            const subs = SUBJECTS_MAP[cap] || [];
            for (const sub of subs) {
              if (gvbm[sub]) {
                const subData = gvbm[sub];
                gvbm[`${sub}_Học kỳ 1`] = JSON.parse(JSON.stringify(subData));
                gvbm[`${sub}_Học kỳ 2`] = JSON.parse(JSON.stringify(subData));
                delete gvbm[sub];
              } else {
                gvbm[`${sub}_Học kỳ 1`] = getEmptySubject(sub);
                gvbm[`${sub}_Học kỳ 2`] = getEmptySubject(sub);
              }
            }
          }
        }
      }
    }
    data.migrated_v6_hocky = true;
    migrated = true;
  }

  if (!data.migrated_v34) {
    // Force upgrade pass/fail subjects in THCS and THPT for Hoạt động trải nghiệm
    ['THCS', 'THPT'].forEach(cap => {
        if (data[cap]) {
            for (const khoi in data[cap]) {
                if (data[cap][khoi] && data[cap][khoi].GVBM) {
                    ["Giáo dục thể chất", "Nghệ thuật", "Âm nhạc", "Mĩ thuật", "Nội dung giáo dục địa phương", "Hoạt động trải nghiệm", "Hoạt động trải nghiệm, hướng nghiệp"].forEach(subj => {
                        data[cap][khoi].GVBM[subj] = getEmptySubject(subj, cap);
                    });
                }
            }
        }
    });
    data.migrated_v34 = true;
    migrated = true;
  }

  if (!data.migrated_v35) {
    ['THCS', 'THPT'].forEach(cap => {
        if (data[cap]) {
            for (const khoi in data[cap]) {
                if (data[cap][khoi] && data[cap][khoi].GVBM) {
                    ["Giáo dục thể chất", "Nghệ thuật", "Âm nhạc", "Mĩ thuật", "Mỹ thuật", "Nội dung giáo dục địa phương", "Hoạt động trải nghiệm"].forEach(subj => {
                        if (data[cap][khoi].GVBM[`${subj}_Học kỳ 1`]) data[cap][khoi].GVBM[`${subj}_Học kỳ 1`] = getEmptySubject(subj, cap);
                        if (data[cap][khoi].GVBM[`${subj}_Học kỳ 2`]) data[cap][khoi].GVBM[`${subj}_Học kỳ 2`] = getEmptySubject(subj, cap);
                    });
                }
            }
        }
    });
    data.migrated_v35 = true;
    migrated = true;
  }

  if (!data.migrated_v36) {
    ['THCS', 'THPT'].forEach(cap => {
        if (data[cap]) {
            for (const khoi in data[cap]) {
                if (data[cap][khoi] && data[cap][khoi].GVBM) {
                    ["Giáo dục thể chất", "Nghệ thuật", "Âm nhạc", "Mĩ thuật", "Mỹ thuật", "Nội dung giáo dục địa phương", "Hoạt động trải nghiệm", "Hoạt động trải nghiệm, hướng nghiệp", "HĐTN", "GDĐP"].forEach(subj => {
                        if (data[cap][khoi].GVBM[`${subj}_Học kỳ 1`]) data[cap][khoi].GVBM[`${subj}_Học kỳ 1`] = getEmptySubject(subj, cap);
                        if (data[cap][khoi].GVBM[`${subj}_Học kỳ 2`]) data[cap][khoi].GVBM[`${subj}_Học kỳ 2`] = getEmptySubject(subj, cap);
                        if (data[cap][khoi].GVBM[subj]) data[cap][khoi].GVBM[subj] = getEmptySubject(subj, cap);
                    });
                }
            }
        }
    });
    data.migrated_v36 = true;
    migrated = true;
  }

  return { data, migrated };
};

export const generateAllSampleData = () => {
  const currentData = { TH: {}, THCS: {}, THPT: {}, migrated_v5: true, migrated_v6: true, migrated_v6_hocky: true, migrated_v7: true, migrated_v8: true, migrated_v9: true, migrated_v10: true, migrated_v11: true, migrated_v12: true, migrated_v13: true, migrated_v14: true, migrated_v15: true, migrated_v16: true, migrated_v17: true, migrated_v18: true, migrated_v19: true, migrated_v20: true, migrated_v21: true, migrated_v22: true, migrated_v23: true, migrated_v24: true, migrated_v25: true, migrated_v26: true, migrated_v27: true, migrated_v28: true, migrated_v29: true, migrated_v30: true, migrated_v31: true, migrated_v32: true, migrated_v33: true, migrated_v34: true, migrated_v35: true, migrated_v36: true };
  for (const capHoc of Object.keys(GRADE_LEVELS)) {
    for (const khoi of GRADE_LEVELS[capHoc]) {
      const h = khoi;
      currentData[capHoc][h] = {
        GVBM: {},
        DGTX: {},
        HOC_BA_GVBM: getEmptyHocBaGVBM(),
        HOC_BA_GVCN: capHoc === "TH" ? getEmptyHocBaGVCN_TH() : getEmptyHocBaGVCN(),
        HIEU_TRUONG: getEmptyHieuTruong(h),
      };
      
      if (capHoc === "TH") {
        currentData[capHoc][h].TH_NLPC = getEmptyThNlPc();
        currentData[capHoc][h].VNEDU_NLPC_HB = getEmptyVneduNlpcHb(h);
      }

      // Add GVBM samples for all subjects
      const subjects = getSubjects(capHoc, h);
      for (const mon of subjects) {
        if (capHoc === "THCS" || capHoc === "THPT") {
          currentData[capHoc][h].GVBM[`${mon}_Học kỳ 1`] = getEmptySubject(mon, capHoc);
          currentData[capHoc][h].GVBM[`${mon}_Học kỳ 2`] = getEmptySubject(mon, capHoc);
        } else {
          currentData[capHoc][h].GVBM[mon] = getEmptySubject(mon, capHoc);
        }
      }
      const dgtxSubjects = getDGTXSubjects(capHoc, h);
      for (const mon of dgtxSubjects) {
        currentData[capHoc][h].DGTX[mon] = getEmptyDGTX(mon, undefined, khoi);
      }
    }
  }
  return currentData;
};
