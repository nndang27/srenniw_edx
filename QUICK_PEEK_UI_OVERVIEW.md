# 🌟 Quick Peek: Feature Overview & UI Layout

## 💡 The Idea
**Quick Peek** is a dedicated dashboard feature designed to bridge the communication gap between the classroom and parents. Its primary goal is to take dense, curriculum-heavy teacher notes and immediately translate them into a warm, engaging, and parent-friendly format. 

Instead of asking parents to read a wall of academic text, Quick Peek provides:
1. A **60-second summary** of what their child is learning.
2. A **relatable, real-world example** to help parents discuss the topic at dinner.
3. A **dynamic video feed** (TikTok-style) to visually hook the child.
4. A **layered "deep dive"** for parents who want to learn more about the terminology and core concepts.

---

## 🏗️ The UI Layout Structure

The layout is built using a modern, responsive 3-column architecture (Next.js + Tailwind CSS + Shadcn/UI) that feels incredibly native, premium, and app-like.

### 1. The Global Sidebar (Left)
- Contains the main application navigation (Quick Peek, Journal, Activities, Play).
- Adapts to a bottom-tab navigation bar on mobile devices to save screen real estate.

### 2. The Knowledge Column (Center)
This is the heart of the page, where the daily learning content lives. It is designed to be highly readable with soft, engaging colors.
- **The 5-Day Calendar Horizon:** A horizontal line of bubbles (Monday ➔ Friday). The active day expands and highlights in indigo, with a progress bar connecting the dots.
- **✨ The 60-Second Summary Card:**
  - Displays the `essence_text` (A jargon-free paragraph).
  - Highlights a `relatable_example` inside a softly tinted box to stand out visually.
  - Dynamically displays a badge (e.g., "BIOLOGY", "MATH") so the parent knows exactly what subject they are reading about.
- **🚀 Dive Deeper Accordion:**
  - A 3-part interactive expandable menu ensuring the page isn't cluttered.
  - **Core Concept:** A concise definition of the active curriculum.
  - **Key Vocabulary:** A clean "dictionary" list of bolded terms and their definitions.
  - **Why This Matters:** A grounding paragraph explaining the real-world value of the lesson.
- **Subject Pagination:** If a day has multiple subjects (e.g., Math *and* Biology), elegant "Previous/Next Subject" arrows appear at the bottom, allowing parents to effortlessly swipe through the daily curriculum.

### 3. The Hook Panel (Right)
- A vertically scrollable, TikTok-style video feed.
- Features CSS Scroll Snapping so the user always lands perfectly on a full-screen video.
- **Smart Autoplay:** Uses an `IntersectionObserver`; videos automatically play when scrolled into view and pause when hidden.
- **Manual Scroll Controls:** For enhanced accessibility on desktop, dedicated Up and Down chevron buttons are positioned neatly to the right of the phone panel, allowing users to precisely scroll one video at a time without relying on a mouse wheel or swipe gestures.
- Mute/Unmute global toggle at the top of the feed to respect the user's environment.

---

## 🗂️ The Data Model (JSON Schema)

The entire UI is driven by a strictly typed data structure. The backend AI summarization pipeline generates data that maps perfectly into this frontend UI:

```json
{
  "subject": "Biology",
  "summarize_simplification": {
    "essence_text": "Today, the class learned how plants make their own food using sunlight!...",
    "relatable_example": "Imagine baking a cake. You need ingredients like flour, eggs..."
  },
  "more_knowledge_accordion": {
    "core_concept": "The scientific process where green plants use...",
    "key_vocabulary": {
      "Chlorophyll": "The special green color in leaves...",
      "Oxygen": "The fresh air that plants release..."
    },
    "why_this_matters": "Without this process, there would be no food for us..."
  },
  "tiktok_search_keywords": ["photosynthesis for kids", "how plants make food"],
  "videos": ["/samples/video1.mp4", "/samples/video2.mp4"]
}
```

---

## 🛠️ Instructions for Developers & Designers
> [!TIP]
> **Component Philosophy:** Do not overwhelm the user with text. Use `mockDigestData` logic to gracefully handle days with no content (rendering a "Stay tuned!" fallback).

1. **Styling Engine:** We use vanilla Tailwind CSS without heavy utility libraries. Keep the aesthetic soft and round (e.g., `rounded-3xl` for cards, `rounded-full` for badges). Use soft Drop Shadows (`shadow-[0_8px_30px_rgb(0,0,0,0.04)]`) rather than harsh borders.
2. **Icons vs Emojis:** We rely heavily on text-based Emojis (`✨` and `🚀`) in the titles rather than importing SVG bundles, making the text easily translatable and scalable.
3. **Responsiveness:** Ensure that on mobile, the layout stacks neatly. The 5-day calendar should be swipeable, and the TikTok video feed should stack *below* the main Knowledge Column.
4. **Interactivity:** Maintain micro-animations (e.g., hover states on the navigation arrows, smooth height transitions on the Accordions) to make the page feel alive and tactile.
