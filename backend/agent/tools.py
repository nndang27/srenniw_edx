# Tool definitions for CurricuLLM API (OpenAI function calling format)
# MOCK — replace with real CurricuLLM tool schemas when API key is available

TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "simplify_content",
            "description": "Simplify teacher curriculum content into plain English for parents",
            "parameters": {
                "type": "object",
                "properties": {
                    "raw_input": {"type": "string", "description": "Original teacher text"},
                    "year_level": {"type": "string", "description": "Year level e.g. Year 4"},
                    "subject": {"type": "string", "description": "Subject name"}
                },
                "required": ["raw_input", "year_level", "subject"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "generate_activities",
            "description": "Generate at-home activities for parents based on curriculum content",
            "parameters": {
                "type": "object",
                "properties": {
                    "content": {"type": "string", "description": "Simplified content"},
                    "year_level": {"type": "string"},
                    "subject": {"type": "string"},
                    "count": {"type": "integer", "description": "Number of activities to generate", "default": 3}
                },
                "required": ["content", "year_level", "subject"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "translate_content",
            "description": "Translate simplified content and activities into target language",
            "parameters": {
                "type": "object",
                "properties": {
                    "content": {"type": "string"},
                    "activities": {"type": "array", "items": {"type": "object"}},
                    "target_language": {"type": "string", "enum": ["vi", "zh", "ar"]}
                },
                "required": ["content", "activities", "target_language"]
            }
        }
    }
]
