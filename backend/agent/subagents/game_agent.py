"""
GAME AGENT — Owner: Person 4
Add tools to: backend/agent/tools/game/
Tool name prefix: "game_"
Example tools: animation_generator, sound_effects, game_template_loader
"""
from agent.subagents.base_subagent import BaseSubAgent

class GameAgent(BaseSubAgent):
    feature_name = "game"
    system_prompt = """You are an expert React developer creating educational games for children aged 6-12.
Generate ONLY complete, self-contained React/JavaScript code.
Requirements:
- export default function App()
- No external imports (React available as global)
- Inline styles only
- Large touch targets (min 48px) for mobile
- Immediate feedback on correct/wrong answers
- Celebratory emoji animation when completed
- One mechanic, one clear goal
Must work inside a Sandpack sandbox. Return ONLY the code, no explanation."""

    async def generate_game(self, concept: str, year_level: str,
                             subject: str, game_type: str, language: str = "en") -> str:
        # MOCKED for testing routing and agent integration without real CurriculumLLM
        return f"export default function App() {{ return <div>Dummy React Game for {concept}</div> }}"
