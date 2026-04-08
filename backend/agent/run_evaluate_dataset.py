import asyncio
import sys
import os
import json
import re

# Adjust python path just like run_suggestion_agent.py
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

os.environ.setdefault("CURRICULLM_BASE_URL", "http://localhost:11434")
os.environ.setdefault("CURRICULLM_API_KEY", "ollama")
os.environ.setdefault("CURRICULLM_MODEL", "minimax-m2.5:cloud")
os.environ.setdefault("LANGCHAIN_TRACING_V2", "false")

from langchain_core.messages import HumanMessage
from langchain_openai import ChatOpenAI
from langchain_core.prompts import PromptTemplate

# Load agent logic
from agent.core.graph import create_deep_agent
from agent.subagents.suggestion_agent import SYSTEM_PROMPT, get_tools
import agent.tools.suggestion as sugg_tools

# ── Model: Ollama minimax-m2.5:cloud ────
def get_model():
    return ChatOpenAI(
        model="minimax-m2.5:cloud",
        base_url="http://localhost:11434/v1",
        api_key="ollama",
        temperature=0.3,
    )

def get_judge_model():
    return ChatOpenAI(
        model="minimax-m2.5:cloud",
        base_url="http://localhost:11434/v1",
        api_key="ollama",
        temperature=0.0,
    )

# ── DB Mocking ────
class MockQuery:
    def __init__(self, data):
        self._data = data
    def select(self, *args, **kwargs): return self
    def eq(self, *args, **kwargs): return self
    def order(self, *args, **kwargs): return self
    def limit(self, *args, **kwargs): return self
    def update(self, *args, **kwargs): return self
    def execute(self):
        class Result:
            def __init__(self, d):
                self.data = d
        return Result(self._data)

class MockDB:
    def __init__(self, state):
        self.state = state
    def table(self, name):
        if name == "class_parents":
            return MockQuery(self.state.get("class_parents", []))
        elif name == "briefs":
            if self.state.get("is_update"):
                return MockQuery([])
            return MockQuery(self.state.get("briefs", []))
        return MockQuery([])

def setup_mock_db(state):
    def fake_get_db():
        if state.get("db_error"):
            return None, "DB Offline"
        return MockDB(state), None
    sugg_tools._get_db = fake_get_db

# ── Scenarios Definition ────
SCENARIOS = [
    {
        "id": "SUGG-001",
        "description": "The CurricuLLM Flex — Chaotic Inline Input",
        "parent_clerk_id": "user_2abc123XYZtest001",
        "class_id": None,
        "brief_id": None,
        "prompt": "Hi! So my daughter had a really rough week. Her teacher said she's been acting out in class and not focusing, BUT she did come home very excited about something — I think it was to do with those old-timey prisoners that came on boats to Australia? Like convicts or something? She kept saying 'they had no choice Mum' which was sweet. ALSO she brought home a maths sheet about cutting pizzas into equal pieces — halves and quarters I think? Three quarters of the pizza was eaten LOL. And then her teacher mentioned something about equivalent fractions and comparing ones with different denominators but honestly that went over my head. Anyway I just want to do something fun with her this weekend that ties into what she's been learning. She's in Year 4. No class ID sorry, I don't have that.",
        "db": {
            "class_parents": [{
                "family_background": json.dumps({"religion": None, "cultural_origin": "australian-anglo", "languages_spoken": ["en"], "suburb": "Newtown", "interests": ["history", "food", "markets"], "family_size": 3, "transport": "public", "budget_level": "medium", "weekend_availability": "saturday"}),
                "preferred_language": "en", "child_name": "Lily", "class_id": None
            }],
            "briefs": []
        },
        "expected_tools": ["suggestion_get_family_background", "suggestion_fetch_local_events", "suggestion_match_event_to_concept"],
        "disallowed_tools": ["suggestion_get_recent_classwork", "suggestion_save_to_brief"],
        "constraints_text": "Must suggest 'Hyde Park Barracks' since it matches Convict History. NO religious venues. MUST feature the child's name Lily."
    },
    {
        "id": "SUGG-002",
        "description": "Budget + Transport + Age Constraints",
        "parent_clerk_id": "user_2def456ABCtest002",
        "class_id": "class_uuid_year1_auburn_primary",
        "brief_id": None,
        "prompt": "Hey, what can we do with my son this Saturday? He's in Year 1. We don't have a car so we need things close to Auburn or easy on public transport, and we really can't spend much — free or cheap only please.",
        "db": {
            "class_parents": [{
                "family_background": json.dumps({"religion": None, "cultural_origin": "lebanese-australian", "languages_spoken": ["en", "ar"], "suburb": "Auburn", "interests": ["sport", "animals", "nature"], "family_size": 5, "transport": "limited", "budget_level": "low", "weekend_availability": "saturday_only"}),
                "preferred_language": "en", "child_name": "Ziad", "class_id": "class_uuid_year1_auburn_primary"
            }],
            "briefs": [{
                "id": "brief_uuid_001", "subject": "Science and Technology", "year_level": "Year 1", "content_type": "classwork", "processed_en": "This week the class explored living things and their basic needs — water, food, and shelter. Students observed a worm farm and discussed what animals eat.", "at_home_activities": [], "published_at": "2026-04-06T09:00:00Z"
            }]
        },
        "expected_tools": ["suggestion_get_family_background", "suggestion_get_recent_classwork", "suggestion_fetch_local_events", "suggestion_match_event_to_concept"],
        "disallowed_tools": ["curricullm_generate", "suggestion_save_to_brief"],
        "constraints_text": "Sydney Observatory MUST NOT appear (age_min 7 too high). Auburn Botanic Gardens must be recommended. Taronga must have transport caveat. No religious venues."
    },
    {
        "id": "SUGG-003A",
        "description": "The Religion Collision — Secular profile",
        "parent_clerk_id": "user_2ghi789DEFtest003",
        "class_id": "class_uuid_year5_architecture",
        "brief_id": "brief_uuid_architecture_002",
        "prompt": "Our class has been exploring how communities are built and what different buildings mean to different groups of people. Can you suggest something fun for this weekend? My daughter is in Year 5.",
        "db": {
            "class_parents": [{
                "family_background": json.dumps({"religion": "secular", "cultural_origin": "mixed-european", "languages_spoken": ["en"], "suburb": "Surry Hills", "interests": ["architecture", "art", "markets", "history"], "family_size": 4, "transport": "public", "budget_level": "medium", "weekend_availability": "any"}),
                "preferred_language": "en", "child_name": "Elara", "class_id": "class_uuid_year5_architecture"
            }],
            "briefs": [{
                "id": "brief_uuid_architecture_002", "subject": "HSIE", "year_level": "Year 5", "content_type": "classwork", "processed_en": "Students investigated how buildings reflect the values and history of the communities that built them. They studied the Sydney Opera House, the Rocks precinct, and various local community buildings. They compared building materials, architectural styles, and the purpose of public vs private spaces.", "at_home_activities": [], "published_at": "2026-04-07T08:30:00Z"
            }]
        },
        "expected_tools": ["suggestion_get_family_background", "suggestion_get_recent_classwork", "suggestion_fetch_local_events", "suggestion_match_event_to_concept", "suggestion_save_to_brief"],
        "disallowed_tools": [],
        "constraints_text": "'St Mary\\'s Cathedral' and 'Lakemba Mosque' must NEVER appear in the output. Sydney Opera House should appear."
    },
    {
        "id": "SUGG-003B",
        "description": "The Religion Collision — Buddhist profile",
        "parent_clerk_id": "user_3b",
        "class_id": "class_uuid_year5_architecture",
        "brief_id": "brief_uuid_architecture_002",
        "prompt": "Our class has been exploring how communities are built and what different buildings mean to different groups of people. Can you suggest something fun for this weekend? My daughter is in Year 5.",
        "db": {
            "class_parents": [{
                "family_background": json.dumps({"religion": "buddhist", "cultural_origin": "vietnamese-australian", "languages_spoken": ["en", "vi"], "suburb": "Cabramatta", "interests": ["architecture", "community", "nature"], "family_size": 6, "transport": "public", "budget_level": "medium", "weekend_availability": "sunday"}),
                "preferred_language": "en", "child_name": "An", "class_id": "class_uuid_year5_architecture"
            }],
            "briefs": [{
                "id": "brief_uuid_architecture_002", "subject": "HSIE", "year_level": "Year 5", "content_type": "classwork", "processed_en": "Students investigated how buildings reflect the values and history of the communities that built them. They studied the Sydney Opera House, the Rocks precinct, and various local community buildings. They compared building materials, architectural styles, and the purpose of public vs private spaces.", "at_home_activities": [], "published_at": "2026-04-07T08:30:00Z"
            }]
        },
        "expected_tools": ["suggestion_get_family_background", "suggestion_get_recent_classwork", "suggestion_fetch_local_events", "suggestion_match_event_to_concept", "suggestion_save_to_brief"],
        "disallowed_tools": [],
        "constraints_text": "'St Mary\\'s Cathedral' and 'Lakemba Mosque' must NEVER appear in the output. Sydney Opera House should appear."
    },
    {
        "id": "SUGG-004",
        "description": "The Vague/Empty Profile Fallback",
        "parent_clerk_id": "user_2newparent999XYZ",
        "class_id": "class_uuid_brand_new_no_briefs",
        "brief_id": None,
        "prompt": "What can we do this weekend? My kid is in Year 3 and loves animals.",
        "db": {"class_parents": [], "briefs": []},
        "expected_tools": ["suggestion_get_family_background", "suggestion_get_recent_classwork", "suggestion_fetch_local_events", "suggestion_match_event_to_concept"],
        "disallowed_tools": ["suggestion_save_to_brief"],
        "constraints_text": "Agent must not crash. No religious venues. Taronga Zoo and Centennial should appear."
    },
    {
        "id": "SUGG-005",
        "description": "Multi-Disciplinary Override",
        "parent_clerk_id": "user_2jkl321GHItest005",
        "class_id": "class_uuid_year6_mixed_curriculum",
        "brief_id": "brief_uuid_yr6_week12",
        "prompt": "My daughter had the most hectic week! Science was about energy and machines, and then art class they did sculpture and colour mixing. She loved both. What's the best weekend outing that brings either of those together? High budget, we have a car. She's Year 6.",
        "db": {
            "class_parents": [{
                "family_background": json.dumps({"religion": None, "cultural_origin": "chinese-australian", "languages_spoken": ["en", "zh"], "suburb": "Chatswood", "interests": ["science", "art", "technology", "design"], "family_size": 3, "transport": "car", "budget_level": "high", "weekend_availability": "saturday"}),
                "preferred_language": "en", "child_name": "Mei", "class_id": "class_uuid_year6_mixed_curriculum"
            }],
            "briefs": [
                {"id": "brief_uuid_yr6_week12", "subject": "Science and Technology", "year_level": "Year 6", "content_type": "classwork", "processed_en": "Students investigated forms of energy — stored energy, energy in moving objects, and simple machines including levers, pulleys and gears. They built a working pulley system using string and cardboard spools and tested how the effort needed changed with more pulleys.", "at_home_activities": [], "published_at": "2026-04-07T09:00:00Z"},
                {"id": "brief_uuid_yr6_week11", "subject": "Creative Arts", "year_level": "Year 6", "content_type": "classwork", "processed_en": "The class explored three-dimensional art making: clay sculpture, wire armature construction, and mixed-media assemblage. Students also studied colour theory — primary, secondary and complementary colours — and applied it in a final watercolour composition.", "at_home_activities": [], "published_at": "2026-04-04T09:00:00Z"}
            ]
        },
        "expected_tools": ["suggestion_get_family_background", "suggestion_get_recent_classwork", "suggestion_fetch_local_events", "suggestion_match_event_to_concept", "suggestion_save_to_brief"],
        "disallowed_tools": [],
        "constraints_text": "Final output covers BOTH science AND art ideas. No religious venues."
    }
]

FORBIDDEN_WORDS = [
    r'\bcurriculum\b', r'\beducational\b', r'\blearning objective[s]?\b',
    r'\bpedagog\w+\b', r'\bstandard[s]?\b', r'\boutcome[s]?\b',
    r'\bsyllabus\b', r'\bunit of work\b', r'\bcross-curricular\b',
    r'\bgrade \d+\b', r'\bmiddle school\b', r'\bgpa\b'
]

# ── Evaluator Logic ────
async def evaluate_output(output, scenario, tool_calls_made):
    report_lines = []
    success = True
    
    # 1. Tool Check
    missing_tools = set(scenario['expected_tools']) - set(tool_calls_made)
    bad_tools = set(tool_calls_made).intersection(set(scenario['disallowed_tools']))
    
    if missing_tools:
        report_lines.append(f"❌ Missing required tools: {missing_tools}")
        success = False
    else:
        report_lines.append(f"✅ Required tools called")
        
    if bad_tools:
        report_lines.append(f"❌ Called disallowed tools: {bad_tools}")
        success = False
    else:
        report_lines.append(f"✅ No disallowed tools called")
    
    # 2. Local Regex/String constraints
    output_lower = output.lower()
    found_forbidden = []
    for pattern in FORBIDDEN_WORDS:
        if re.search(pattern, output_lower):
            found_forbidden.append(pattern)
            
    if found_forbidden:
        report_lines.append(f"❌ Forbidden strings found (Tone/Americanisms): {found_forbidden}")
        success = False
    else:
        report_lines.append("✅ Tone & Lexicon (no 'curriculum/education' jargon, Australian contexts respected)")
        
    # Formatting Schema Check
    required_blocks = ["🗓", "📍", "🎓", "💬", "🔗"]
    missing_blocks = [mb for mb in required_blocks if mb not in output]
    if missing_blocks:
        report_lines.append(f"❌ Missing formatted blocks: {missing_blocks}")
        success = False
    else:
        report_lines.append("✅ Schema Compliance (Markdown formatting exists)")
        
    # 3. Use Model to do semantic validation of constraints
    judge_prompt = PromptTemplate(
        input_variables=["constraints", "output"],
        template=(
            "You are an expert QA evaluator testing an AI application.\n"
            "Evaluate the following output snippet against these constraints: {constraints}\n\n"
            "Output to evaluate:\n"
            "```\n{output}\n```\n\n"
            "Respond ONLY with a JSON object. No other text.\n"
            "Format: {{\"success\": bool, \"reason\": \"string\"}}"
        )
    )
    
    chain = judge_prompt | get_judge_model()
    try:
        raw_res = await chain.ainvoke({"constraints": scenario["constraints_text"], "output": output})
        text_content = raw_res.content
        match = re.search(r'\{.*\}', text_content, re.DOTALL)
        if match:
            res_json = json.loads(match.group(0))
            if not res_json.get("success"):
                success = False
                report_lines.append(f"❌ Constraint Failed: {res_json.get('reason')}")
            else:
                report_lines.append(f"✅ Constraint Passed: {res_json.get('reason')}")
        else:
             report_lines.append(f"⚠️ Could not parse JSON from judge: {text_content}")
             success = False
    except Exception as e:
         report_lines.append(f"⚠️ Exception during LLM judge text parsing. Error {str(e)}")
         success = False

    return success, "\n".join(report_lines)

async def run_scenario(agent, s):
    setup_mock_db(s["db"])
    
    parts = []
    if s.get("parent_clerk_id"):
        parts.append(f"parent_clerk_id: {s['parent_clerk_id']}")
    parts.append(f"class_id: {s.get('class_id') or 'null'}")
    parts.append(f"brief_id: {s.get('brief_id') or 'null'}")
    
    user_msg_str = " | ".join(parts) + "\n\n" + s["prompt"]
    
    print(f"\n{'='*70}\n🚀 Running Scenario: {s['id']} - {s['description']}\n{'='*70}")
    
    result = await agent.ainvoke({"messages": [HumanMessage(content=user_msg_str)]})
    messages = result.get("messages", [])
    
    # Extract tool calls history
    tool_calls_made = []
    for m in messages:
        if hasattr(m, 'tool_calls') and m.tool_calls:
            for tc in m.tool_calls:
                tool_calls_made.append(tc["name"].lower())
                
    final_output = messages[-1].content if messages else ""
    
    # Evaluate
    success, report = await evaluate_output(final_output, s, tool_calls_made)
    print(f"\n--- LLM Final Output ---\n{final_output}\n------------------------\n")
    print(f"--- Evaluation Report ---")
    print(report)
    print(f"Status: \033[92mPASS\033[0m" if success else f"Status: \033[91mFAIL\033[0m")
    
    return success

async def main():
    agent = create_deep_agent(
        model=get_model(),
        tools=get_tools(),
        system_prompt=SYSTEM_PROMPT,
        subagents=[],
    )
    
    total = len(SCENARIOS)
    passed = 0
    
    print("Beginning Automated QA Run...")
    for s in SCENARIOS:
        try:
            ok = await run_scenario(agent, s)
            if ok:
                passed += 1
        except Exception as e:
            print(f"❌ Scenario Execution Exception: {e}")
            
    print(f"\n{'='*70}\n🏁 Test Run Completed: {passed}/{total} Passed.\n{'='*70}")
    
if __name__ == "__main__":
    asyncio.run(main())
