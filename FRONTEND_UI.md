# Frontend UI Build Guide — Srenniw

## Đọc trước khi code
1. Đọc CLAUDE.md — hiểu toàn bộ project context
2. Đọc API.md — hiểu endpoint nào gọi ở đâu
3. Đọc FRONTEND.md — hiểu lib/api.ts và lib/websocket.ts đã có sẵn
4. File này override phần "Pages to Build" trong FRONTEND.md về mặt UI/UX

---

## Yêu cầu tổng quát

Tech stack: Next.js 14 App Router, TypeScript, Tailwind CSS, shadcn/ui, Lucide React
Package manager: pnpm (luôn luôn, không dùng npm)
Auth: Clerk (đã setup trong FRONTEND.md)
API calls: dùng useApi() từ src/lib/api.ts
WebSocket: dùng useChat() và useChatbot() từ src/lib/websocket.ts

Design system:
- Primary blue: #3B82F6 (blue-500)
- Calm green: #10B981 (emerald-500)  
- Warm orange: #F59E0B (amber-500)
- Soft purple: #8B5CF6 (violet-500)
- Font: Inter (thêm vào layout.tsx)
- Border radius: rounded-2xl cho cards, rounded-full cho buttons nhỏ
- Shadow: shadow-sm mặc định, shadow-md khi hover
- Transition: transition-all duration-200 cho tất cả interactive elements

---

## Cấu trúc file cần tạo

```
frontend/src/
├── app/
│   ├── page.tsx                          ← Welcome / Role Selection screen
│   ├── teacher/
│   │   ├── layout.tsx                    ← Teacher shell với sidebar
│   │   ├── dashboard/page.tsx            ← Command Center (analytics + briefs list)
│   │   ├── compose/page.tsx              ← Compose form + preview
│   │   └── chat/page.tsx                 ← Real-time chat với parents
│   └── parent/
│       ├── layout.tsx                    ← Parent shell với bottom nav
│       ├── digest/page.tsx               ← Tab 1: Smart Learning Digest
│       ├── journal/page.tsx              ← Tab 2: Child Development Journal
│       ├── action/page.tsx               ← Tab 3: Connection & Activities
│       ├── play/page.tsx                 ← Tab 4: Game (Sandpack renderer)
│       └── chat/page.tsx                 ← Real-time chat với teacher
├── components/
│   ├── shared/
│   │   ├── CommunicationHub.tsx          ← FAB + slide-over (AI chatbot + Teacher chat)
│   │   ├── ContributionCard.tsx          ← Weekly contribution mirror card
│   │   └── GamePlayer.tsx                ← Sandpack game renderer
│   ├── teacher/
│   │   ├── ComposeForm.tsx               ← Input form
│   │   ├── ParentPreviewWidget.tsx       ← Preview generated brief
│   │   ├── ClassInsightsHeatmap.tsx      ← Aggregated feedback heatmap
│   │   └── BriefStatusCard.tsx           ← Brief list item với status badge
│   └── parent/
│       ├── DigestCard.tsx                ← 60s / Deep Dive / Flashcard toggle
│       ├── JournalForm.tsx               ← Bloom slider + emoji mood
│       ├── ConversationStarter.tsx       ← Daily prompt card với shuffle
│       ├── ActivityCard.tsx              ← Activity planner card
│       └── NotificationCard.tsx          ← Inbox notification item
```

---

## 1. WELCOME SCREEN — app/page.tsx

Role selection với split-screen layout. Đọc Clerk user role rồi redirect tự động.

```
Layout: 2 cột lớn full-screen (min-h-screen)

Cột trái — Teacher Portal:
  Background: gradient từ blue-50 đến blue-100
  Icon: GraduationCap (Lucide) size 48px màu blue-500
  Title: "Teacher Portal" — 2xl font-bold
  Subtitle: "Communicate smarter, not harder. Share learning goals
             in minutes — AI handles the rest."
  Button: [Enter Portal] → /teacher/dashboard
    Style: bg-blue-500 hover:bg-blue-600 text-white px-8 py-3 rounded-full

Cột phải — Family Dashboard:
  Background: gradient từ emerald-50 đến emerald-100
  Icon: Home (Lucide) size 48px màu emerald-500
  Title: "Family Dashboard"
  Subtitle: "Turn classroom learning into family moments.
             Understand, help, and grow together."
  Button: [Go to Dashboard] → /parent/digest
    Style: bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-3 rounded-full

Center divider: chữ "or" với line kẻ hai bên
Header: Logo "Srenniw" + Clerk UserButton góc trên phải

Mobile: stack dọc (flex-col), mỗi cột chiếm full width

Logic:
  const { user } = useUser()
  useEffect: nếu role=teacher → redirect /teacher/dashboard
             nếu role=parent → redirect /parent/digest
```

---

## 2. TEACHER MODE

### app/teacher/layout.tsx — Command Center Shell

```
Desktop layout: sidebar trái 240px + main content bên phải

Sidebar:
  Top: Logo "Srenniw" + tagline nhỏ
  Nav items (với icon Lucide):
    - LayoutDashboard  → /teacher/dashboard   "Dashboard"
    - PenSquare        → /teacher/compose      "Compose"
    - MessageCircle    → /teacher/chat         "Messages"
  Bottom: UserButton của Clerk + tên giáo viên

Mobile: bottom navigation bar (4 tab) + hamburger

Active state: bg-blue-50 text-blue-600 rounded-xl px-3 py-2
```

### app/teacher/compose/page.tsx — Compose + Preview

```
2 cột (40% | 60%), gap-6, min-h-screen

=== CỘT TRÁI (40%) — ComposeForm ===

Card với border rounded-2xl shadow-sm p-6:

  Title: "What are your students learning this week?" — font-semibold text-lg

  Dropdowns (hàng ngang, 3 select):
    - Class: lấy từ GET /api/teacher/classes
    - Content Type: "Assignment" | "Comment" | "Weekly Update"  
    - Subject + Year Level (2 dropdown)

  Textarea:
    placeholder="e.g. This week we're exploring fractions —
                  students will learn to add fractions with the
                  same denominator using visual models..."
    rows=8, resize-none
    border-2 border-gray-200 focus:border-blue-400
    rounded-xl p-4 text-sm

  Button: [✨ Generate via CurricuLLM API]
    Style: w-full bg-blue-500 hover:bg-blue-600 text-white
           py-3 rounded-xl font-medium
    Loading state: spinner + "AI is processing..."
    Gọi: POST /api/teacher/compose
    Sau submit: brief_id trả về → poll trạng thái

  Character count: góc dưới phải textarea "0 / 500"

=== CỘT PHẢI (60%) — Preview + Analytics ===

Phần trên (55%): ParentPreviewWidget
  Card rounded-2xl border-2 border-dashed border-blue-200 p-6
  
  Header: "Parent Preview" badge màu blue + icon Eye
  
  Khi chưa generate: 
    Empty state với icon FileText màu gray-300
    Text: "Your parent-friendly brief will appear here..."
  
  Khi status=processing:
    Skeleton loading animation (3 dòng)
    Text: "CurricuLLM is simplifying curriculum language..."
  
  Khi status=done — hiện:
    Section "📝 Summary" — processed_en text
    Section "🏠 At-Home Activities" — list các activity với:
      - Tên activity (font-medium)
      - Mô tả (text-sm text-gray-600)
      - Badge thời gian: "10 min" (bg-amber-100 text-amber-700 rounded-full px-2)
    Section "🌍 Available in" — language badges: EN VI ZH AR
    
  Button: [📤 Publish to Parents]
    Chỉ active khi status=done
    Style: bg-emerald-500 text-white w-full py-3 rounded-xl
    (Không cần gọi thêm API — publish xảy ra tự động khi agent xong)

Phần dưới (45%): ClassInsightsHeatmap
  Card rounded-2xl p-6
  Title: "Class Insights" — font-semibold

  Hiển thị từ GET /api/teacher/briefs/{brief_id}/feedback
  
  Mock data + real data kết hợp:
  
  Row 1 — Understanding heatmap:
    "Understood" [████████░░] 70%  màu emerald
    "Partially"  [████░░░░░░] 35%  màu amber  
    "Struggling" [██░░░░░░░░] 15%  màu red
  
  Row 2 — Recent feedback snippets (3 items):
    Mỗi item: avatar chữ cái + text + thời gian
    e.g. "My child struggled with part 2" — 2h ago
  
  Row 3 — Engagement stats:
    Opened: 18/22 parents
    Replied: 6 parents
    Activities tried: 4 families reported
```

### app/teacher/dashboard/page.tsx

```
Header: "Good morning, [teacher name] 👋" + ngày tháng

Stats row (4 card ngang):
  - Total Briefs: số lượng
  - Parents Reached: tổng notifications sent
  - Avg Response Rate: %
  - This Week: số brief tuần này
  Style: bg-white rounded-2xl p-4 border shadow-sm

Brief list (từ GET /api/teacher/briefs):
  Mỗi BriefStatusCard:
    - Subject badge (màu theo subject)
    - Content type tag
    - Created date
    - Status badge:
        pending    → bg-gray-100 text-gray-600 "Pending"
        processing → bg-blue-100 text-blue-600 animate-pulse "Processing..."
        done       → bg-emerald-100 text-emerald-600 "Published"
        failed     → bg-red-100 text-red-600 "Failed"
    - Preview text (truncated 80 chars)
    - "X feedback" counter
    - Click → expand để xem chi tiết + feedback

Supabase Realtime: subscribe notifications table
→ khi status đổi sang "done" → cập nhật badge không cần reload
```

### app/teacher/chat/page.tsx

```
Layout: 2 cột (30% | 70%)

Cột trái — Danh sách parent:
  Từ GET /api/teacher/chat-rooms
  Mỗi item:
    Avatar chữ cái (bg màu random từ tên)
    Parent name
    Last message preview (truncated)
    Timestamp
    Unread badge số (bg-blue-500 text-white rounded-full)
  Hover: bg-gray-50

Cột phải — Chat window:
  Header: tên parent + avatar
  
  Messages area (từ useChat hook):
    Teacher messages: bong bóng phải, bg-blue-500 text-white
    Parent messages: bong bóng trái, bg-gray-100 text-gray-800
    Timestamp nhỏ bên dưới mỗi message
    Typing indicator: "..." animated khi nhận typing event
  
  Input area:
    Textarea 1 dòng, expand khi nhập
    Button [Send] hoặc Enter để gửi
    Gọi sendMessage() từ useChat(roomId)
```

---

## 3. PARENT MODE

### app/parent/layout.tsx — Family Dashboard Shell

```
Mobile-first design (parent dùng điện thoại là chính)

Bottom Navigation (mobile):
  4 tab với icon + label:
  - BookOpen    → /parent/digest    "Digest"
  - BookMarked  → /parent/journal   "Journal"  
  - Lightbulb   → /parent/action    "Activities"
  - Gamepad2    → /parent/play      "Play"
  
  Active tab: text màu emerald-500, icon filled
  
Desktop: left sidebar tương tự teacher

Header (top):
  "Srenniw" logo trái
  Giữa: tên con + class (từ GET /api/parent/profile)
  Phải: Language selector dropdown + UserButton

Language selector:
  [EN] [VI] [中文] [AR]
  Gọi PATCH /api/parent/profile khi đổi
  Lưu vào localStorage để apply ngay không cần reload

=== FLOATING COMMUNICATION HUB (CommunicationHub.tsx) ===
Fixed bottom-right, z-50

FAB button:
  bg-blue-500 rounded-full w-14 h-14 shadow-xl
  Icon: MessageCircle màu white
  Unread badge đỏ góc trên phải

Click → slide-over panel từ phải:
  Width: 380px (desktop), full-width (mobile)
  Height: 70vh
  Background: white, rounded-tl-2xl rounded-bl-2xl
  Shadow-2xl

  2 Tabs trong panel:
  
  Tab "Ask AI 🤖":
    Chat interface với useChatbot hook
    Messages hiển thị streaming token by token
    Khi streaming: hiện cursor nhấp nháy "|" cuối text
    Suggestion chips (clickable):
      "What does this mean?" 
      "Give me easier activities"
      "Explain in Vietnamese"
      "Why is this important?"
    Input bottom: textarea + Send button
  
  Tab "💬 Teacher Chat":
    Chat interface với useChat hook
    Kết nối /ws/chat/{room_id}
    Tương tự teacher chat nhưng reversed (parent bên phải)
```

### app/parent/digest/page.tsx — Tab 1: Smart Learning Digest

```
Đây là trang đầu tiên parent thấy → phải WOW ngay

Header:
  "Hi [parent name]! 👋" — text-2xl font-bold
  "Here's what [child name] is learning this week" — text-gray-500
  Week selector dropdown: "Week of Apr 7" etc.

=== DigestCard — 3 format toggles ===

Toggle buttons (pill style, 3 nút):
  [⚡ 60s Read] [📖 Deep Dive] [🃏 Flashcards]
  Active: bg-blue-500 text-white
  Inactive: bg-gray-100 text-gray-600

FORMAT 1 — "60s Read":
  Card bg-gradient-to-br from-blue-50 to-emerald-50 rounded-2xl p-6
  Subject badge + Year level badge
  Content: processed_en text từ API
  Đọc khoảng thời gian: "⏱ 45 second read"
  At-home preview: 3 bullet points từ at_home_activities

FORMAT 2 — "Deep Dive":
  Accordion sections (shadcn Accordion):
    "🎯 What they're learning" — curriculum_notes
    "🧠 Key concepts" — breakdown
    "📚 Australian Curriculum" — ACMNA code etc.
    "🏠 How to help at home" — detailed activities

FORMAT 3 — "Flashcards":
  Swipeable card stack (CSS transform, drag gesture)
  Mỗi card:
    Front: câu hỏi — "What is a denominator?"
    Back: trả lời đơn giản + emoji — "The bottom number! 🍕 = 8 slices"
  Swipe right: "Got it! ✓" màu green
  Swipe left: "Review again" màu orange
  Progress: "3 / 5 cards"
  
  Implementation: dùng CSS transition + touch events
  Không cần library nặng

Bottom CTA:
  Button: [📓 Log Today's Journal] → navigate /parent/journal
  Style: w-full bg-amber-500 text-white py-4 rounded-2xl text-lg font-semibold

=== CONTRIBUTION MIRROR (ContributionCard) ===
Hiện cuối tuần (thứ Sáu, thứ Bảy):
  Card bg-gradient-to-r from-violet-50 to-purple-50 border border-violet-200
  "✨ Your Week in Learning"
  Stats: "12 minutes together · 3 activities tried · 2 conversations started"
  Text ấm áp: "That's equivalent to an extra tutoring session this week."
  
  Nếu có giáo viên gửi message đặc biệt:
    Quote card với avatar giáo viên:
    "Nam raised his hand for the first time this week. 
     Your support at home made a difference. — Ms. Smith"
```

### app/parent/journal/page.tsx — Tab 2: Child Development Journal

```
Centered form card, max-w-lg mx-auto, p-6

Title: "How did [child name] feel today? 📝"
Subtitle: "Takes 30 seconds. Helps the teacher understand better."

=== SECTION 1 — Bloom's Taxonomy Slider ===

Label: "Understanding Level"
5-step slider với labels:
  1 — Aware 🌱
  2 — Understands 💡
  3 — Applies 🔧
  4 — Analyses 🔍
  5 — Creates 🚀

Visual: custom slider với màu gradient
  Xanh lá nhạt → xanh lá đậm theo progress
  Thumb: circle trắng với shadow
  Mỗi bước: dot nhỏ + label bên dưới

Khi di chuyển: hiện tooltip "Your child can explain it back!" etc.

=== SECTION 2 — Emotional Observation ===

Label: "How was the mood?"
5 emoji buttons (lớn, dễ tap trên mobile):
  😊 Happy    🤔 Curious   😤 Frustrated
  😴 Tired    🌟 Excited

Selected: border-2 border-blue-500 bg-blue-50 scale-110
Unselected: border-2 border-gray-200

=== SECTION 3 — Quick Note (optional) ===

Textarea nhỏ:
  placeholder="Anything else? e.g. She asked great questions about pizza fractions!"
  rows=3

=== SUBMIT ===

Button: [💾 Save & Get Today's Ideas]
  w-full bg-emerald-500 text-white py-4 rounded-2xl text-lg

Sau khi save:
  Toast notification: "Journal saved! ✨ Here are today's activity ideas."
  Auto-navigate sang /parent/action sau 1.5s

Note: Journal data KHÔNG gọi backend riêng trong MVP
→ lưu localStorage, khi parent submit feedback (POST /api/parent/feedback)
→ đính kèm journal entry vào message field
```

### app/parent/action/page.tsx — Tab 3: Activities

```
=== SECTION 1 — Daily Conversation Starter ===

Card đặc biệt, viền gradient animated:
  bg-white border-2 rounded-2xl p-6
  Border: animated rainbow gradient (CSS animation)

Icon: MessageCircle màu amber-500, size 32
Label: "💬 Try this today"
Content: contextual prompt từ at_home_activities[0]
  e.g. "At dinner tonight, ask: If we share this pizza equally,
        what fraction does each person get?"

Button [🔀 Shuffle]:
  Cycle qua các activities trong at_home_activities array
  Animation: fade out → fade in khi shuffle

=== SECTION 2 — AI Family Activity Planner ===

Title: "🗓 This Weekend's Ideas"
Subtitle: "AI-matched to what [child name] is learning"

Grid 2 cột (1 cột mobile):
  Mỗi ActivityCard:
    Image placeholder: gradient với emoji lớn (🏖️ 🦁 🍕 🎨)
      màu theo subject: Math=blue, English=purple, Science=green
    
    Badge: subject + "AI Pick ✨"
    
    Title: e.g. "Kitchen Fractions"
    
    Description:
      "While cooking dinner, practice fractions naturally.
       Connects to: Adding fractions with same denominator"
    
    Footer:
      "⏱ 15-20 min" + "🏠 At home"
      Button [+ Add to Calendar]
        → window.open Google Calendar link với pre-filled event
        → URL: https://calendar.google.com/calendar/r/eventedit?text=...
    
    Hover: shadow-lg transform -translate-y-1

Mock activities (3 cards — hardcode cho demo, đủ đẹp là được):
  Card 1: "🍕 Pizza Fraction Night" — cooking together
  Card 2: "🛒 Supermarket Math" — shopping trip
  Card 3: "🎨 Fraction Art" — drawing activity
```

### app/parent/play/page.tsx — Tab 4: Game

```
=== GAME LEVEL SELECTION (trước khi load game) ===

Full-screen colorful design:
  Background: gradient from-violet-100 to-blue-100

Title: "🎮 Learning Games"
Subtitle: "For [child name] · Year 4 Mathematics"

Level grid (2x2):
  Level 1 — "🌱 Recognition"    (easy, green)
  Level 2 — "⚡ Problem Solving" (medium, blue)
  Level 3 — "🔥 Challenge"      (hard, orange) — locked icon
  Level 4 — "🏆 Master"         (expert, purple) — locked icon

Mỗi level card:
  bg-white rounded-2xl p-6 shadow-md
  Big emoji + title + subtitle
  Locked levels: opacity-50 + lock icon overlay

Selected level: border-2 border-blue-500 ring-4 ring-blue-100

[▶ Start Challenge] button:
  w-full max-w-sm mx-auto
  bg-gradient-to-r from-blue-500 to-violet-500
  text-white text-xl py-4 rounded-2xl font-bold
  hover: scale-105 shadow-xl

=== GAME RENDERER (sau khi Start) ===

Import GamePlayer component:

  // components/shared/GamePlayer.tsx
  import { Sandpack } from "@codesandbox/sandpack-react"
  import "@codesandbox/sandpack-react/dist/index.css"

  Nhận prop: code (string React code từ API)
  
  Render:
    <Sandpack
      template="react"
      files={{ "/App.js": code }}
      options={{
        showNavigator: false,
        showTabs: false,
        showLineNumbers: false,
        showInlineErrors: true,
        autorun: true,
        editorHeight: 0,
      }}
      theme="light"
    />

Loading state trước khi code về:
  Animated placeholder với:
  "🎮 AI is creating your game..."
  Progress bar giả animated
  "Crafting a fractions game just for [child name]..."

API call:
  POST /api/game/generate với:
    { subject, year_level, concept, language, difficulty }
  Nhận về { code: string }
  Truyền code vào GamePlayer
```

---

## 4. SHARED COMPONENTS

### components/shared/CommunicationHub.tsx

```
Props: role ("teacher" | "parent"), roomId, parentId

FAB button (fixed bottom-right, z-50):
  mb-6 mr-6
  w-14 h-14 bg-blue-500 rounded-full shadow-xl
  Icon: MessageCircle white
  Badge đỏ nếu có unread

Slide-over panel:
  position: fixed, right-0, top-0, h-full
  width: 380px desktop / 100vw mobile
  bg-white shadow-2xl
  transform: translateX(100%) khi đóng
  transition-transform duration-300

  Header: "Communication Hub" + X close button

  2 Tabs (chỉ parent mới thấy cả 2):
    Tab "Ask AI 🤖":
      useChatbot(parentId)
      
      Messages:
        User: bong bóng phải bg-blue-500 text-white
        AI: bong bóng trái bg-gray-100
        Khi streaming: append token realtime, cursor nhấp nháy
      
      Suggestion chips:
        Horizontal scroll, clickable
        → gọi sendMessage(chip text) tự động
      
      Input: textarea bottom + Send button
    
    Tab "💬 Teacher Chat":
      useChat(roomId)
      Chat interface 2 chiều

### components/parent/NotificationCard.tsx

Inbox item card:
  Unread: border-l-4 border-blue-500 bg-blue-50/30
  Read: bg-white border border-gray-100
  
  Header: subject badge + content_type tag + timestamp
  Content: text truncated 3 dòng, expand khi click
  Activities: grid nhỏ 2 cột, mỗi activity có duration badge
  
  Actions:
    [👍 Understood] [~ Partially] [Need help]
    → POST /api/parent/feedback với message tương ứng
    
  data-testid="unread-indicator" khi is_read=false
```

---

## 5. CHÚ Ý QUAN TRỌNG KHI CODE

### Mapping UI → API thật

```typescript
// Digest page — lấy từ inbox
const { data } = await api.getInbox()
const latestBrief = data.items[0]?.brief

// Content theo language đã được API xử lý sẵn
// content field = đúng ngôn ngữ của parent
const displayContent = latestBrief.content  // không cần map thêm

// Activities
const activities = latestBrief.at_home_activities
```

```typescript
// Journal — lưu kèm feedback
const handleSave = async () => {
  await api.submitFeedback(briefId, 
    `Journal: Understanding=${bloomLevel}/5, Mood=${selectedMood}. ${note}`
  )
}
```

```typescript
// Game — gọi generate endpoint
const handleStartGame = async () => {
  const { code } = await fetch('/api/game/generate', {
    method: 'POST',
    body: JSON.stringify({ subject, year_level, concept: brief.subject, language })
  }).then(r => r.json())
  setGameCode(code)
}
```

### Realtime subscriptions (Supabase)

```typescript
// Parent inbox — nhận notification mới
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(url, anonKey)

useEffect(() => {
  const channel = supabase
    .channel('notifications')
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'notifications',
      filter: `parent_clerk_id=eq.${userId}`
    }, (payload) => {
      // Thêm vào inbox list, hiện toast
      toast("📬 New update from school!")
    })
    .subscribe()
  return () => supabase.removeChannel(channel)
}, [userId])
```

### Mobile-first checklist
- [ ] Bottom nav visible trên mobile (parent layout)
- [ ] FAB không che bottom nav → mb-20 trên mobile
- [ ] Flashcard swipe hoạt động trên touch
- [ ] Emoji mood buttons đủ lớn để tap (min 48px)
- [ ] Bloom slider dễ drag trên mobile
- [ ] Game Sandpack responsive

---

## 6. LỆNH CHẠY VỚI CLAUDE CODE

Paste lệnh này vào Claude Code terminal:

```
Read CLAUDE.md, API.md, FRONTEND.md, and FRONTEND_UI.md carefully.

Build the complete frontend UI for the Srenniw hackathon project.
Follow FRONTEND_UI.md exactly for design and layout.
Connect all components to real APIs as specified in API.md using useApi() from src/lib/api.ts.
Use pnpm for all installs.

Start with:
1. pnpm add @codesandbox/sandpack-react lucide-react
2. pnpm dlx shadcn@latest add accordion tabs toast slider
3. Build in this order:
   a. app/page.tsx (Welcome screen)
   b. app/teacher/layout.tsx + compose/page.tsx
   c. app/parent/layout.tsx + digest/page.tsx
   d. shared/CommunicationHub.tsx (chatbot streaming)
   e. Remaining pages

After each major component: run pnpm build to check for TypeScript errors.
Fix all errors before moving to next component.
```
