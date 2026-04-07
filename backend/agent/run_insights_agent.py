"""
Test runner cho Insights Agent — chạy trực tiếp với ollama

Cách chạy:
    cd backend
    python -m agent.run_insights_agent

Yêu cầu:
    - Ollama đang chạy trên localhost:11434
    - Model minimax-m2.5:cloud đã pull về (hoặc dùng model khác)
"""
import asyncio
import sys
import os
import json

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

# ── Dev: dùng Ollama làm LLM ─────────────────────────────────────────────────
os.environ.setdefault("CURRICULLM_BASE_URL", "http://localhost:11434")
os.environ.setdefault("CURRICULLM_API_KEY", "ollama")
os.environ.setdefault("CURRICULLM_MODEL", "minimax-m2.5:cloud")

from langchain_core.messages import HumanMessage
from langchain_openai import ChatOpenAI

from agent.core.graph import create_deep_agent
from agent.subagents.insights_agent import SYSTEM_PROMPT, get_tools

# ── Model ─────────────────────────────────────────────────────────────────────
model = ChatOpenAI(
    model="minimax-m2.5:cloud",
    base_url="http://localhost:11434/v1",
    api_key="ollama",
    temperature=0.3,
)

# ── Agent ─────────────────────────────────────────────────────────────────────
agent = create_deep_agent(
    model=model,
    tools=get_tools(),
    system_prompt=SYSTEM_PROMPT,
    subagents=[],
)

# ── Mock input data — 20 giả lập nhật ký học tập ─────────────────────────────
MOCK_ENTRIES = json.dumps([
    {"date": "2026-03-10", "subject": "Maths",         "cognitiveLevel": 3, "emotion": "Neutral",    "notes": "Bé làm toán cộng trừ, chưa hiểu hết"},
    {"date": "2026-03-10", "subject": "English",        "cognitiveLevel": 4, "emotion": "Curious",    "notes": "Bé kể chuyện rất hay hôm nay"},
    {"date": "2026-03-11", "subject": "Science",        "cognitiveLevel": 4, "emotion": "Excited",    "notes": "Bé xem video về động vật ngoài trời rất thích"},
    {"date": "2026-03-11", "subject": "PE",             "cognitiveLevel": 5, "emotion": "Excited",    "notes": "Bé chạy nhảy rất vui, chơi cùng bạn"},
    {"date": "2026-03-12", "subject": "Creative Arts",  "cognitiveLevel": 4, "emotion": "Happy",      "notes": "Bé vẽ tranh đẹp, rất tập trung"},
    {"date": "2026-03-12", "subject": "Maths",          "cognitiveLevel": 2, "emotion": "Anxious",    "notes": "Bé gặp khó khăn với bài chia, hơi lo lắng"},
    {"date": "2026-03-13", "subject": "HSIE",           "cognitiveLevel": 3, "emotion": "Neutral",    "notes": "Chia sẻ bài học về cộng đồng"},
    {"date": "2026-03-14", "subject": "English",        "cognitiveLevel": 5, "emotion": "Excited",    "notes": "Bé viết bài văn về con vật yêu thích rất hay"},
    {"date": "2026-03-17", "subject": "Maths",          "cognitiveLevel": 3, "emotion": "Neutral",    "notes": "Ôn tập số học, bé tự làm bài"},
    {"date": "2026-03-17", "subject": "Science",        "cognitiveLevel": 4, "emotion": "Curious",    "notes": "Thí nghiệm với cây trồng, bé hỏi tại sao rất nhiều"},
    {"date": "2026-03-18", "subject": "PE",             "cognitiveLevel": 5, "emotion": "Happy",      "notes": "Bé chơi bóng với bạn bè rất vui"},
    {"date": "2026-03-18", "subject": "Creative Arts",  "cognitiveLevel": 4, "emotion": "Happy",      "notes": "Bé xếp hình lego rất sáng tạo"},
    {"date": "2026-03-19", "subject": "Maths",          "cognitiveLevel": 4, "emotion": "Curious",    "notes": "Bé tự giải đố toán, hỏi tại sao phải chia như vậy"},
    {"date": "2026-03-19", "subject": "English",        "cognitiveLevel": 4, "emotion": "Curious",    "notes": "Đọc sách thiếu nhi, bé hỏi nghĩa từ mới"},
    {"date": "2026-03-20", "subject": "HSIE",           "cognitiveLevel": 3, "emotion": "Neutral",    "notes": "Bé nhường đồ chơi cho em, rất tốt"},
    {"date": "2026-03-24", "subject": "Maths",          "cognitiveLevel": 4, "emotion": "Happy",      "notes": "Bé làm đúng nhiều bài, tự làm không cần nhắc"},
    {"date": "2026-03-25", "subject": "Science",        "cognitiveLevel": 5, "emotion": "Excited",    "notes": "Bé quan sát thiên nhiên, đặt câu hỏi rất hay"},
    {"date": "2026-03-25", "subject": "PE",             "cognitiveLevel": 5, "emotion": "Excited",    "notes": "Bé hoạt động ngoài trời, không ngồi yên được"},
    {"date": "2026-03-26", "subject": "Creative Arts",  "cognitiveLevel": 4, "emotion": "Happy",      "notes": "Vẽ tranh cây cối và giải thích ý nghĩa"},
    {"date": "2026-03-26", "subject": "English",        "cognitiveLevel": 5, "emotion": "Curious",    "notes": "Bé tự đọc truyện, ghi chép từ mới vào vở"},
], ensure_ascii=False)

REQUEST = f"""
Phân tích toàn diện sự phát triển của bé dựa trên dữ liệu nhật ký sau.
Tuổi bé: 9 tuổi. Mốc chuẩn chương trình học (curriculum_benchmark): 3.0.
Số ngày phụ huynh ghi nhật ký liên tục (app_usage_streak): 14.

Dữ liệu nhật ký:
{MOCK_ENTRIES}

Hãy gọi đầy đủ 6 tools và trả về kết quả JSON tổng hợp.
"""


async def main():
    print("=" * 60)
    print("  INSIGHTS AGENT TEST — using ollama minimax-m2.5:cloud")
    print("=" * 60)
    print()

    result = await agent.ainvoke({
        "messages": [HumanMessage(content=REQUEST)]
    })

    messages = result.get("messages", [])
    final = messages[-1].content if messages else "(empty)"

    print("FINAL OUTPUT:")
    print("-" * 60)
    # Try to pretty-print JSON
    try:
        parsed = json.loads(final)
        print(json.dumps(parsed, ensure_ascii=False, indent=2))
    except json.JSONDecodeError:
        print(final)
    print("-" * 60)

    # Show tool calls summary
    tool_calls_summary = []
    for m in messages:
        tcs = getattr(m, "tool_calls", [])
        if tcs:
            for tc in tcs:
                tool_calls_summary.append(tc.get("name", "?"))
    if tool_calls_summary:
        print(f"\nTools called: {tool_calls_summary}")


if __name__ == "__main__":
    asyncio.run(main())
