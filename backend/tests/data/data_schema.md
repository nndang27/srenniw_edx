# Unified Data Schema (Teacher & Parent Portal)

Dựa trên việc đọc mã nguồn UI của Parent (`journal.ts`, `transcript/page.tsx`), UI của Teacher (`mockTeacherData.ts`), và đối chiếu với dữ liệu tham chiếu AI Insights (`mock_data_400days.json`), đây là bản thiết kế cấu trúc dữ liệu (`Data Model`) hoàn chỉnh, dùng để đồng bộ Frontend và Backend.

Dữ liệu được tổ chức thành 3 cụm chính: **Users & Classes**, **Daily Insights (Nhật ký học tập & AI)**, và **Academic Records (Bảng điểm & Curriculum)**.

---

## 1. Biểu diễn quan hệ các trường (Entity Relationship Graph)

Biểu đồ mô tả cách dữ liệu giữa Học Sinh, Nhật ký hàng ngày (có điểm AI Teacher/Parent) và kết quả học bạ liên kết với nhau.

```mermaid
erDiagram
    CLASS ||--o{ STUDENT : "contains (1-n)"
    CLASS ||--o{ CURRICULUM : "has syllabus (1-n)"
    STUDENT ||--o{ DAILY_INSIGHT : "logs daily (1-n)"
    STUDENT ||--o{ TRANSCRIPT_TERM : "receives term grades (1-n)"
    TRANSCRIPT_TERM ||--o{ GRADE_SUMMARY : "contains subjects (1-n)"

    DAILY_INSIGHT {
        string date "YYYY-MM-DD"
        boolean is_school_day
        string subject "Can be null"
        int cognitiveLevel "1-5"
        string emotion "Curious, Anxious, etc."
        string parent_note "From Parent UI"
        json parent_note_scores "AI Processed"
        string teacher_note "From Teacher UI"
        json teacher_note_scores "AI Processed"
        int timeSpent "Mins spent"
    }

    STUDENT {
        string id PK
        string name
        string avatar
    }

    CLASS {
        string id PK
        string name "e.g. Year 4A"
        int studentCount
    }

    GRADE_SUMMARY {
        string subject
        string achievement "A, B, C, etc."
        string effort "Outstanding, High..."
        int score "0-100"
        string comment "Descriptive Feedback"
    }
```

---

## 2. Chi tiết các trường dữ liệu (Ready-to-use Schema)

*Lưu ý: Đây là những trường cứng bắt buộc phải có để UI hiện tại render được chính xác biểu đồ, cảnh báo (alerts) và AI Insight.*

### A. Core Daily Insight (`mock_data_400days.json` & Journaling)
Model này đại diện cho 1 điểm chạm trong ngày. Được gộp từ dữ liệu của cả Teacher và Parent khi họ note về học sinh.

```json
{
  "date": "2025-01-01",                   // String: YYYY-MM-DD
  "is_school_day": true,                  // Boolean: Trẻ có đi học hay nghỉ
  "subject": "Maths",                     // String | Null: Môn học (Maths, Science, English, etc.) hoặc Null nếu là nhật ký chung chung.
  "cognitiveLevel": 3,                    // Integer | Null: Thang Bloom (1-5). Ảnh hưởng trực tiếp đến Radar Chart.
  "emotion": "Curious",                   // Enum: 'Curious' | 'Excited' | 'Disengaged' | 'Anxious' | 'Happy' | 'Neutral'
  "timeSpent": 60,                        // Integer: Số phút học (Có trong code, chưa có trong mock JSON cũ, bắt buộc cho UI Parent).
  
  // -- Dữ liệu từ Phụ Huynh --
  "parent_note": "Bé khóc vì toán...",     // String | Null: Ghi chú của phụ huynh (Map với `notes` trong `journal.ts`).
  "parent_note_scores": {                 // Object | Null: AI chấm điểm từ `parent_note`
    "emotion_sentiment": 2.26,            // Float: Cảm xúc (0-5)
    "parent_child_connection": 0.0,       // Float: Mức độ tương tác (0-1)
    "activity_level": 0.0,                // Float: Mức vận động
    "social_engagement": 0.0,             // Float: Sự giao tiếp xã hội
    "curiosity_index": 0.0,               // Float: Chỉ số tò mò
    "focus_depth": 0.0                    // Float: Độ tập trung
  },

  // -- Dữ liệu từ Giáo Viên --
  "teacher_note": "Excellent mental...",  // String | Null: Trùng với `notes` trong teacher portal.
  "teacher_note_scores": {                // Object | Null: AI chấm điểm từ `teacher_note`
    "emotion_sentiment": 3.67,            // Float: Đoạn note tích cực hay tiêu cực
    "encouragement_level": 1.0,           // Float: Giáo viên có khích lệ không
    "difficulty_signal": 0.0,             // Float: Phát hiện học sinh đang gặp khó khăn (Trigger Alerts cho giáo viên)
    "engagement_observed": 0.0            // Float: Chỉ số chú ý trên lớp
  }
}
```

### B. User, Class & Curriculum (Teacher Portal Backbone)
Bắt buộc để hiển thị Dashboard của giáo viên.

**Class Schema (`TeacherClass`)**:
```json
{
  "id": "4a",
  "name": "Year 4A",
  "studentCount": 20,
  "students": [ "Array of Student Schema" ]
}
```

**Student Schema (`Student`)**:
```json
{
  "id": "4a-s1",
  "name": "Olivia Chen",
  "avatar": "https://api.dicebear.com/7.x/personas/svg?seed=Olivia",
  "journalEntries": [ "Array of Core Daily Insight" ]  // Trả về timeline của học sinh
}
```

**Curriculum Schema (`ClassCurriculum`)**: Dùng cho sổ ghi đầu bài của giáo viên.
```json
{
  "classId": "4a",
  "subject": "Maths",
  "weeklyTopics": [
    {
      "week": 1,
      "topic": "Place Value to 10,000",
      "learningGoal": "Read, write and order numbers to 10,000"
    }
  ]
}
```

### C. Academic Records (Parent Transcript Backend)
Dữ liệu để map vào trang `/parent/transcript/page.tsx` mới xây dựng.

**Transcript Response Model**:
```json
{
  "studentId": "4a-s1",
  "year": "2026",
  "term": "Term 2",
  "status": "in-progress",                  // Enum: 'completed' | 'in-progress' | 'future'
  "grades": [                               // Data cho bảng điểm
    {
      "subject": "Maths",
      "score": 92,                          // Integer: 0-100
      "achievement": "A (Outstanding)",     // String
      "effort": "Outstanding",              // String
      "comment": "Consistently strong..."   // String: Teacher's summative remark
    }
  ]
}
```

---

## 3. Giải thích luồng hoạt động (Data Flow)

1. **Hiển thị Insight (AI Backend ⇔ UI)**: 
   - Backend sẽ chạy mô hình AI lên `teacher_note` và `parent_note` mỗi ngày để sinh ra cụm json con `teacher_note_scores` và `parent_note_scores`. 
   - Frontend sẽ quét mảng `Daily Insight` này. Nếu phát hiện `emotion === 'Anxious'` lớn hơn 3 lần/tuần, hoặc `cognitiveLevel` giảm sút (so với các Index rỗng/bị trừ điểm), giao diện giáo viên (`mockTeacherData.ts: studentsNeedingAttention`) sẽ nhảy thông báo đói hỏi Support 1:1.
2. **Transcript vs Daily Insights**: 
   - Dữ liệu `GRADE_SUMMARY` là dữ liệu đánh giá cuối kỳ do giáo viên chốt. 
   - `Term Insight Panel` trên UI của Parent không trực tiếp dùng `cognitiveLevel` ở Journal nữa, mà sẽ tự động generate biểu đồ Radar dựa trên điểm số `score` của `GRADE_SUMMARY`.
3. **Tính nhất quán**: Các trường tên của môn học (`subject`) bắt buộc phải bám theo chuẩn: `['Maths', 'Science', 'English', 'HSIE', 'Creative Arts', 'PE']`. Nếu Null, ghi chú đó được hiểu là thuộc trạng thái sinh hoạt ngoại khóa (như thể hiện trong `mock_data_400days.json`).
