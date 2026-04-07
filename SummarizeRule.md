Here is the final updated blueprint incorporating your exact selections.
Srenniw Digest Agent Logic Structure
Step 1: Take in the Material and Apply the Rules
INPUT: Raw classroom materials (teacher slides, reading assignments, etc.).[ which stored in a folder in cloud]
Global Constraints: * Keep it completely family-friendly (G-rated).
Do not invent any outside information (Strictly stick to the INPUT).
Step 2: Feed to the Sub-Agent AI
Pass the (INPUT) and the (Global Constraints) to the AI processing agent.
Step 3: The AI Thinking
Think 1 - Summarize Simplification:
Essence: Write a main simple summary which captures the lecture knowledge (INPUT), in plain language, easy for general people to understand.
Limit: 35 to 45 words.
Constraint (Bottom Line Up Front): The very first sentence MUST be “Today class is” then state exactly what the topic is. No other warm-up phrases.
Example: Provide one real-world, everyday example of that concept.
Limit: 25 to 35 words.
Constraint (No-Fluff): Do not start with "For example...". Jump straight into the scenario.
Think 2 - Deep Dive: Break down the lecture knowledge (INPUT) into three specific academic parts.
Core Concept: explain the lecture knowledge (INPUT) topic in a detailed academic tone.
Limit: 40 to 60 words.
Constraint (Textbook): Use formal academic language.
Constraint (No-Fluff): Start directly with the definition. Do not use intro phrases like "The core concept is...".
Key Vocabulary: Give each term a simple definition.
Limit: Exactly 2 to 4 important terms. 15 to 25 words per definition.
Constraint (Strict Extraction): The AI can ONLY select terms that physically exist in the (INPUT) text.
Constraint (Standalone): Each definition must make sense completely on its own without referencing other vocabulary words.
Why This Matters: Explain how this lesson is actually used outside the classroom.
Limit: 40 to 60 words.
Constraint (Practical): Focus on the practical use case, future development
Think 3 - Pick Video Search Keywords:
Scan the lecture knowledge (INPUT) for highly visual concepts to be used for video searches later.
Limit: 1 to 2 short phrases. Strictly 2 to 4 words long.
Constraint (Visual-Action): At least one word in the phrase must imply motion or visuals (e.g., "visualized," "animation," "experiment").
Constraint (No Stop-Words): Strip out all unnecessary filler words (e.g., "the," "a," "an," "and," "of").
Step 4: Package the Final Output
Take all the completed summaries, definitions, and search keywords, and place them perfectly into the final JSON data format into a data folder so the dashboard can look into them then load them into the proper columns.

