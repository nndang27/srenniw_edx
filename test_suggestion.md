# Test Plan: Suggestion Subagent — Exhaustive QA Script
**Target:** `backend/agent/subagents/suggestion_agent.py` + `backend/agent/tools/suggestion/__init__.py`  
**Rules Enforced:** `SuggestionRule.md`  
**Engineer:** QA Automation  
**Date:** 2026-04-08  
**Severity Scale:** P0 (Blocker) · P1 (Critical) · P2 (Major) · P3 (Minor)

---

## Preamble: Tool Pipeline Reference

Every valid agent run MUST produce tool calls in one of these two legal orderings:

| Step | Tool | Mandatory? |
|------|------|------------|
| 1 | `curricullm_generate` | Only when inline classwork text needs concept extraction |
| 2 | `suggestion_get_family_background` | Always |
| 3 | `suggestion_get_recent_classwork` | Only when `class_id` is provided |
| 4 | `suggestion_fetch_local_events` | Always |
| 5 | `suggestion_match_event_to_concept` | Always |
| 6 | `suggestion_save_to_brief` | Only when `brief_id` is provided |

**Global Pass Criteria (apply to ALL scenarios):**

- [ ] No output contains the words `curriculum`, `educational`, or `learning objective`
- [ ] Each suggestion blurb is ≤ 50 words
- [ ] The exact Markdown block format is used (🗓 📍 🎓 💬 🔗)
- [ ] No religious venue appears for a non-matching family
- [ ] No event where `age_min > child_age` appears in output
- [ ] Agent does not hallucinate events not returned by `suggestion_match_event_to_concept`

---

## Scenario 1: The CurricuLLM Flex — Chaotic Inline Input

**Severity:** P0  
**ID:** SUGG-001  
**Goal:** Force the agent to invoke `curricullm_generate` to distil coherent learning concepts from a chaotic, mixed-discipline parent message before running the event pipeline. Validates that the agent does NOT skip the CurricuLLM step and pass raw noise directly into `suggestion_match_event_to_concept`.

---

### Given

```json
{
  "parent_clerk_id": "user_2abc123XYZtest001",
  "class_id": null,
  "brief_id": null
}
```

**User Prompt (verbatim — chaotic inline text):**

> "Hi! So my daughter had a really rough week. Her teacher said she's been acting out in class and not focusing, BUT she did come home very excited about something — I think it was to do with those old-timey prisoners that came on boats to Australia? Like convicts or something? She kept saying 'they had no choice Mum' which was sweet. ALSO she brought home a maths sheet about cutting pizzas into equal pieces — halves and quarters I think? Three quarters of the pizza was eaten LOL. And then her teacher mentioned something about finding equivalent fractions and comparing ones with different denominators but honestly that went over my head. Anyway I just want to do something fun with her this weekend that ties into what she's been learning. She's in Year 4. No class ID sorry, I don't have that."

---

### Mock DB States

**`suggestion_get_family_background` returns:**
```json
{
  "religion": null,
  "cultural_origin": "australian-anglo",
  "languages_spoken": ["en"],
  "suburb": "Newtown",
  "interests": ["history", "food", "markets"],
  "family_size": 3,
  "transport": "public",
  "budget_level": "medium",
  "weekend_availability": "saturday",
  "child_name": "Lily"
}
```

**`suggestion_get_recent_classwork`:** NOT CALLED (no `class_id` provided).

**`suggestion_fetch_local_events` returns (mock, full pool):**
```json
{
  "source": "mock",
  "events": [
    {
      "title": "Hyde Park Barracks — Convict Sydney",
      "venue": "Sydney Living Museums",
      "suburb": "Sydney CBD",
      "date_range": "Daily, 10am – 4pm",
      "age_min": 7,
      "cost": "$",
      "category": "history",
      "concepts": ["history", "community", "writing"],
      "description": "Self-guided audio tour where kids hear the voices of real convict children who lived here.",
      "url": "https://sydneylivingmuseums.com.au/hyde-park-barracks",
      "religious_venue": false,
      "religion": null
    },
    {
      "title": "Art Gallery of NSW — Kids Drawing Workshop",
      "venue": "Art Gallery of NSW",
      "suburb": "The Domain",
      "date_range": "Saturdays, 11am",
      "age_min": 5,
      "cost": "free",
      "category": "art",
      "concepts": ["art", "geometry", "writing"],
      "description": "Free 45-minute workshop where kids sketch a famous painting and learn about colour, shape and storytelling.",
      "url": "https://www.artgallery.nsw.gov.au",
      "religious_venue": false,
      "religion": null
    },
    {
      "title": "Australian Museum — First Nations Gallery",
      "venue": "Australian Museum",
      "suburb": "Sydney CBD",
      "date_range": "Daily, 10am – 5pm",
      "age_min": 5,
      "cost": "free",
      "category": "history",
      "concepts": ["history", "community", "indigenous", "art"],
      "description": "See real artefacts and storytelling from over 250 First Nations communities.",
      "url": "https://australian.museum",
      "religious_venue": false,
      "religion": null
    },
    {
      "title": "St Mary's Cathedral — Family Heritage Tour",
      "venue": "St Mary's Cathedral",
      "suburb": "Sydney CBD",
      "date_range": "Sundays after 10:30am Mass",
      "age_min": 5,
      "cost": "free",
      "category": "religion",
      "concepts": ["religion", "history", "architecture"],
      "description": "Gothic Revival cathedral tour.",
      "url": "https://www.stmaryscathedral.org.au",
      "religious_venue": true,
      "religion": "catholic"
    }
  ]
}
```

**`curricullm_generate` — Expected Input Payload:**
```json
{
  "task": "concept_extraction",
  "text": "[full parent message above]",
  "instructions": "Extract 1-2 core academic concepts a primary school child has been studying. Return them as a short comma-separated list, suitable for event matching. Ignore behavioral notes and parent confusion.",
  "year_level": "Year 4"
}
```

**`curricullm_generate` — Mock Return:**
```json
{
  "concepts": ["Australian convict history", "fractions"],
  "year_level": "Year 4",
  "confidence": 0.91,
  "notes": "Primary concept is colonial/convict history; secondary is fractions (halves, quarters, equivalent fractions). Behavioural context is irrelevant."
}
```

---

### Expected Tool Execution Order

```
1. curricullm_generate(
     task="concept_extraction",
     text="<parent chaotic message>",
     year_level="Year 4"
   )
   → returns: ["Australian convict history", "fractions"]

2. suggestion_get_family_background(
     parent_clerk_id="user_2abc123XYZtest001",
     class_id=""
   )
   → returns: { religion: null, suburb: "Newtown", transport: "public", budget_level: "medium", ... }

3. suggestion_fetch_local_events(
     suburb="Newtown",
     category="any",
     weeks_ahead=4
   )
   → returns: full mock event pool

4. suggestion_match_event_to_concept(
     events_json="<output of step 3>",
     learning_concept="Australian convict history",
     year_level="Year 4",
     family_background_json="<output of step 2>",
     top_n=3
   )
   → returns: ranked matches, Hyde Park Barracks ranked #1

5. [NO suggestion_save_to_brief — no brief_id provided]
```

---

### Assertions

| # | Assertion | Severity |
|---|-----------|----------|
| 1.1 | `curricullm_generate` is called BEFORE any suggestion tool | P0 |
| 1.2 | `suggestion_get_recent_classwork` is NOT called (no `class_id`) | P1 |
| 1.3 | The concept fed to `suggestion_match_event_to_concept` is `"Australian convict history"` (clean), NOT the raw parent message | P0 |
| 1.4 | `St Mary's Cathedral` does NOT appear in output (religion=null family) | P0 |
| 1.5 | `Hyde Park Barracks` appears as top suggestion (age_min=7 ≤ Year 4 age=9 ✓, history match) | P1 |
| 1.6 | Output blurbs contain child's name "Lily" or personal warmth | P2 |
| 1.7 | No output uses the word "curriculum", "educational", or "learning objective" | P0 |
| 1.8 | Each blurb is ≤ 50 words | P1 |
| 1.9 | `suggestion_save_to_brief` is NOT called | P1 |

---

### Expected Final Output (Canonical Form)

```markdown
🗓 Hyde Park Barracks — Convict Sydney
📍 Sydney Living Museums · Sydney CBD  |  🕐 Daily, 10am – 4pm  |  💲$
🎓 Learning link: Lily gets to hear actual voices of convict kids who arrived on those ships — the exact story she was excited about.
💬 What to say on the way there: "If you had to pack everything you owned into one bag and sail for four months, what would you bring?"
🔗 https://sydneylivingmuseums.com.au/hyde-park-barracks

---

🗓 Australian Museum — First Nations Gallery
📍 Australian Museum · Sydney CBD  |  🕐 Daily, 10am – 5pm  |  💲free
🎓 Learning link: The Museum shows what life was like in Australia long before those convict ships arrived — great for putting the timeline together.
💬 What to say on the way there: "What do you think people ate for breakfast in Sydney 500 years ago?"
🔗 https://australian.museum

---

🗓 Royal Botanic Garden — Aboriginal Heritage Walk
📍 Royal Botanic Garden · Sydney CBD  |  🕐 Wed, Fri, Sun 10am  |  💲free
🎓 Learning link: A First Nations guide explains how this land was used and managed — the other side of the colonial story.
💬 What to say on the way there: "If you were living here before any Europeans arrived, what rules would you make for your community?"
🔗 https://www.botanicgardens.org.au
```

**Anti-Pattern Check (must NOT appear):**
- ❌ `"This is a great educational opportunity"`
- ❌ `"aligned with the curriculum"`
- ❌ Any mention of St Mary's Cathedral

---

---

## Scenario 2: The Ultimate Constraint Squeeze — Budget + Transport + Age

**Severity:** P0  
**ID:** SUGG-002  
**Goal:** Simultaneously activate all three hard constraint filters in `_score_event`: age gate (`age_min > child_age`), budget penalty (`budget == "low"` and `cost == "$$$"`), and transport penalty (`transport == "limited"` + suburban distance). Verify that the scoring function correctly eliminates or heavily penalizes events, and that the agent's output reflects only genuinely reachable, affordable, age-appropriate options.

---

### Given

```json
{
  "parent_clerk_id": "user_2def456ABCtest002",
  "class_id": "class_uuid_year1_auburn_primary",
  "brief_id": null
}
```

**User Prompt:**
> "Hey, what can we do with my son this Saturday? He's in Year 1. We don't have a car so we need things close to Auburn or easy on public transport, and we really can't spend much — free or cheap only please."

---

### Mock DB States

**`suggestion_get_family_background` returns:**
```json
{
  "religion": null,
  "cultural_origin": "lebanese-australian",
  "languages_spoken": ["en", "ar"],
  "suburb": "Auburn",
  "interests": ["sport", "animals", "nature"],
  "family_size": 5,
  "transport": "limited",
  "budget_level": "low",
  "weekend_availability": "saturday_only",
  "child_name": "Ziad"
}
```

**`suggestion_get_recent_classwork` returns:**
```json
{
  "briefs": [
    {
      "brief_id": "brief_uuid_001",
      "subject": "Science and Technology",
      "year_level": "Year 1",
      "content_type": "classwork",
      "processed_en": "This week the class explored living things and their basic needs — water, food, and shelter. Students observed a worm farm and discussed what animals eat.",
      "at_home_activities": [
        { "type": "home", "title": "Build a bug hotel from sticks and leaves in your backyard" }
      ],
      "published_at": "2026-04-06T09:00:00Z"
    }
  ],
  "count": 1
}
```

**Full Event Pool fed to `suggestion_fetch_local_events`:**
```json
{
  "source": "mock",
  "events": [
    {
      "title": "Taronga Zoo — Wild Australia Trail",
      "venue": "Taronga Zoo",
      "suburb": "Mosman",
      "date_range": "Daily, 9:30am – 4:30pm",
      "age_min": 3,
      "cost": "$$$",
      "category": "biology",
      "concepts": ["biology", "habitats", "adaptation", "food chain"],
      "description": "Meet kangaroos, koalas and platypus.",
      "url": "https://taronga.org.au",
      "religious_venue": false,
      "religion": null
    },
    {
      "title": "Sydney Observatory — Family Stargazing",
      "venue": "Sydney Observatory",
      "suburb": "The Rocks",
      "date_range": "Friday & Saturday evenings",
      "age_min": 7,
      "cost": "$$",
      "category": "science",
      "concepts": ["space", "physics"],
      "description": "See Saturn's rings through real telescopes.",
      "url": "https://maas.museum/sydney-observatory",
      "religious_venue": false,
      "religion": null
    },
    {
      "title": "Centennial Parklands — Family Bike & Nature Loop",
      "venue": "Centennial Parklands",
      "suburb": "Centennial Park",
      "date_range": "Open daily, sunrise – sunset",
      "age_min": 3,
      "cost": "free",
      "category": "nature",
      "concepts": ["biology", "physics", "community"],
      "description": "A 3.6km flat loop. Spot ducks, ibis and turtles.",
      "url": "https://www.centennialparklands.com.au",
      "religious_venue": false,
      "religion": null
    },
    {
      "title": "Australian Museum — First Nations Gallery",
      "venue": "Australian Museum",
      "suburb": "Sydney CBD",
      "date_range": "Daily, 10am – 5pm",
      "age_min": 5,
      "cost": "free",
      "category": "history",
      "concepts": ["history", "community", "indigenous", "art"],
      "description": "See real artefacts and storytelling from over 250 First Nations communities.",
      "url": "https://australian.museum",
      "religious_venue": false,
      "religion": null
    },
    {
      "title": "Auburn Botanic Gardens — Nature Explorers Walk",
      "venue": "Auburn Botanic Gardens",
      "suburb": "Auburn",
      "date_range": "Open daily, 7am – sunset",
      "age_min": 2,
      "cost": "free",
      "category": "nature",
      "concepts": ["biology", "habitats", "community"],
      "description": "A family-friendly garden walk with diverse native plants and a Japanese garden. Flat, pram-accessible paths.",
      "url": "https://www.cumberland.nsw.gov.au/auburn-botanic-gardens",
      "religious_venue": false,
      "religion": null
    }
  ]
}
```

---

### Expected `_score_event` Trace (Manual Walkthrough)

| Event | age_min | child_age (Yr1=6) | Age Pass? | Religion Gate | Budget Penalty | Transport Penalty | Concept Score | Final Score |
|-------|---------|-------------------|-----------|---------------|----------------|-------------------|---------------|-------------|
| Taronga Zoo | 3 | 6 | ✅ | N/A | cost="$$$", budget="low" → **-1** | suburb=Mosman, family=Auburn, transport=limited → **-1** | biology+habitats match → +6 | **4** |
| Sydney Observatory | 7 | 6 | ❌ **DROPPED** (`age_min 7 > 6`) | — | — | — | — | **-1** |
| Centennial Parklands | 3 | 6 | ✅ | N/A | cost=free → **+1** | suburb=Centennial Park ≠ Auburn → **-1** | biology match → +3 | **3** |
| Australian Museum | 5 | 6 | ✅ | N/A | cost=free → **+1** | suburb=Sydney CBD ≠ Auburn → **-1** | history, no concept match | **0** → DROPPED |
| Auburn Botanic Gardens | 2 | 6 | ✅ | N/A | cost=free → **+1** | suburb=Auburn = Auburn → **+2** | biology+habitats → +6 | **9** |

**Expected ranking:** Auburn Botanic Gardens (9) > Taronga Zoo (4) > Centennial Parklands (3)

---

### Expected Tool Execution Order

```
1. suggestion_get_family_background(
     parent_clerk_id="user_2def456ABCtest002",
     class_id="class_uuid_year1_auburn_primary"
   )
   → { transport: "limited", budget_level: "low", suburb: "Auburn", religion: null }

2. suggestion_get_recent_classwork(
     class_id="class_uuid_year1_auburn_primary",
     limit=3
   )
   → { briefs: [{ subject: "Science and Technology", year_level: "Year 1", processed_en: "living things..." }] }

3. suggestion_fetch_local_events(
     suburb="Auburn",
     category="any",
     weeks_ahead=4
   )

4. suggestion_match_event_to_concept(
     events_json="<step 3 output>",
     learning_concept="living things habitats biology",
     year_level="Year 1",
     family_background_json="<step 1 output>",
     top_n=3
   )
   → matches ranked: Auburn Botanic Gardens, Taronga Zoo, Centennial Parklands

5. [curricullm_generate NOT called — classwork text is structured and clear]
6. [suggestion_save_to_brief NOT called — no brief_id]
```

---

### Assertions

| # | Assertion | Severity |
|---|-----------|----------|
| 2.1 | Sydney Observatory is ABSENT from all output (age_min=7 > child_age=6) | P0 |
| 2.2 | Auburn Botanic Gardens is ranked #1 (highest score: suburb match + free + concept) | P0 |
| 2.3 | Taronga Zoo output explicitly notes it is accessible by ferry/bus (transport=limited) | P1 |
| 2.4 | Free events are framed positively ("completely free!" style) in output | P2 |
| 2.5 | No event with `cost="$$$"` is presented without a transport/cost caveat | P1 |
| 2.6 | `curricullm_generate` is NOT called (structured classwork from DB — no need) | P1 |
| 2.7 | `suggestion_save_to_brief` is NOT called (no brief_id in payload) | P1 |
| 2.8 | Output uses child's name "Ziad" | P2 |
| 2.9 | No religious venues appear | P0 |

---

### Expected Final Output (Canonical Form)

```markdown
🗓 Auburn Botanic Gardens — Nature Explorers Walk
📍 Auburn Botanic Gardens · Auburn  |  🕐 Open daily, 7am – sunset  |  💲free
🎓 Learning link: Ziad's been studying what living things need to survive — he can spot actual habitats and bugs doing exactly that, five minutes from home.
💬 What to say on the way there: "Let's count how many different animals are using this garden as their home."
🔗 https://www.cumberland.nsw.gov.au/auburn-botanic-gardens

---

🗓 Taronga Zoo — Wild Australia Trail
📍 Taronga Zoo · Mosman  |  🕐 Daily, 9:30am – 4:30pm  |  💲$$$
🎓 Learning link: Every enclosure is basically a real-life lesson about what animals eat and where they live — Ziad will recognise it all from class.
💬 What to say on the way there: "Which animal do you think has the toughest job finding food?"
🔗 https://taronga.org.au

---

🗓 Centennial Parklands — Family Bike & Nature Loop
📍 Centennial Parklands · Centennial Park  |  🕐 Open daily, sunrise – sunset  |  💲free
🎓 Learning link: The duck ponds and ibis nests are a free, live version of the food chain Ziad drew in class this week.
💬 What to say on the way there: "See if you can spot something eating something else!"
🔗 https://www.centennialparklands.com.au
```

**Transport note (must appear for Taronga):**
> Agent MUST note that Taronga is reachable via ferry from Circular Quay given `transport="limited"`.

---

---

## Scenario 3: The Religion Collision — Strict Rule Enforcement

**Severity:** P0  
**ID:** SUGG-003  
**Goal:** This is the most legally and ethically sensitive test. The classwork topic ("community and local architecture") maps directly onto both St Mary's Cathedral (`concepts: ["religion","history","architecture"]`) and Lakemba Mosque (`concepts: ["religion","history","architecture","community"]`). Both events would score very high on concept overlap. The test verifies that `_score_event` hard-drops both events and that the LLM's final output does not mention either — not even as a footnote or "you might also consider" suggestion.

Two sub-variants are run:

- **3A:** `religion = "secular"` — explicit secular declaration
- **3B:** `religion = "buddhist"` — declared faith that does not match either venue

---

### Given (Shared)

```json
{
  "parent_clerk_id": "user_2ghi789DEFtest003",
  "class_id": "class_uuid_year5_architecture",
  "brief_id": "brief_uuid_architecture_002"
}
```

**User Prompt:**
> "Our class has been exploring how communities are built and what different buildings mean to different groups of people. Can you suggest something fun for this weekend? My daughter is in Year 5."

---

### Mock DB States — Variant 3A (Secular)

**`suggestion_get_family_background` returns:**
```json
{
  "religion": "secular",
  "cultural_origin": "mixed-european",
  "languages_spoken": ["en"],
  "suburb": "Surry Hills",
  "interests": ["architecture", "art", "markets", "history"],
  "family_size": 4,
  "transport": "public",
  "budget_level": "medium",
  "weekend_availability": "any",
  "child_name": "Elara"
}
```

### Mock DB States — Variant 3B (Buddhist)

**`suggestion_get_family_background` returns:**
```json
{
  "religion": "buddhist",
  "cultural_origin": "vietnamese-australian",
  "languages_spoken": ["en", "vi"],
  "suburb": "Cabramatta",
  "interests": ["architecture", "community", "nature"],
  "family_size": 6,
  "transport": "public",
  "budget_level": "medium",
  "weekend_availability": "sunday",
  "child_name": "An"
}
```

**`suggestion_get_recent_classwork` returns (shared):**
```json
{
  "briefs": [
    {
      "brief_id": "brief_uuid_architecture_002",
      "subject": "HSIE",
      "year_level": "Year 5",
      "content_type": "classwork",
      "processed_en": "Students investigated how buildings reflect the values and history of the communities that built them. They studied the Sydney Opera House, the Rocks precinct, and various local community buildings. They compared building materials, architectural styles, and the purpose of public vs private spaces.",
      "at_home_activities": [],
      "published_at": "2026-04-07T08:30:00Z"
    }
  ],
  "count": 1
}
```

**Critical Events in Pool (partial list, these must be filtered):**
```json
[
  {
    "title": "St Mary's Cathedral — Family Heritage Tour",
    "venue": "St Mary's Cathedral",
    "suburb": "Sydney CBD",
    "date_range": "Sundays after 10:30am Mass",
    "age_min": 5,
    "cost": "free",
    "category": "religion",
    "concepts": ["religion", "history", "architecture"],
    "religious_venue": true,
    "religion": "catholic"
  },
  {
    "title": "Lakemba Mosque — Open Day Family Visit",
    "venue": "Lakemba Mosque",
    "suburb": "Lakemba",
    "date_range": "Saturdays, 10am – 2pm",
    "age_min": 5,
    "cost": "free",
    "category": "religion",
    "concepts": ["religion", "history", "architecture", "community"],
    "religious_venue": true,
    "religion": "muslim"
  },
  {
    "title": "Sydney Opera House — Family Architecture Tour",
    "venue": "Sydney Opera House",
    "suburb": "Sydney CBD",
    "date_range": "Every Saturday & Sunday, 10am",
    "age_min": 6,
    "cost": "$$",
    "category": "architecture",
    "concepts": ["geometry", "architecture", "music", "design", "engineering"],
    "religious_venue": false,
    "religion": null
  }
]
```

---

### Expected `_score_event` Trace for Religion Gate

| Event | `religious_venue` | Family religion (3A) | Family religion (3B) | Event religion | Gate Result |
|-------|-------------------|---------------------|---------------------|----------------|-------------|
| St Mary's Cathedral | `true` | `"secular"` | `"buddhist"` | `"catholic"` | **HARD DROP** both variants |
| Lakemba Mosque | `true` | `"secular"` | `"buddhist"` | `"muslim"` | **HARD DROP** both variants |
| Sydney Opera House | `false` | N/A | N/A | N/A | Passes gate — scored normally |

---

### Expected Tool Execution Order

```
1. suggestion_get_family_background(
     parent_clerk_id="user_2ghi789DEFtest003",
     class_id="class_uuid_year5_architecture"
   )

2. suggestion_get_recent_classwork(
     class_id="class_uuid_year5_architecture",
     limit=3
   )

3. suggestion_fetch_local_events(
     suburb="Surry Hills",   [3A] OR "Cabramatta" [3B]
     category="any",
     weeks_ahead=4
   )

4. suggestion_match_event_to_concept(
     events_json="<step 3>",
     learning_concept="community buildings architecture design",
     year_level="Year 5",
     family_background_json="<step 1>",
     top_n=3
   )
   → Religious venues are scored -1 (DROPPED) internally before returning

5. suggestion_save_to_brief(
     brief_id="brief_uuid_architecture_002",
     suggestions_json="<step 4 output>"
   )
   [brief_id IS provided — save must fire]
```

---

### Assertions (Both 3A and 3B)

| # | Assertion | Severity |
|---|-----------|----------|
| 3.1 | "St Mary's Cathedral" string does NOT appear anywhere in final output | P0 |
| 3.2 | "Lakemba Mosque" string does NOT appear anywhere in final output | P0 |
| 3.3 | No phrase like "you might also consider" followed by a religious venue | P0 |
| 3.4 | Sydney Opera House IS suggested (architecture match, non-religious) | P1 |
| 3.5 | `suggestion_save_to_brief` IS called with `brief_id="brief_uuid_architecture_002"` | P0 |
| 3.6 | `suggestion_save_to_brief` receives only the non-religious matches | P0 |
| 3.7 | For 3B (Buddhist family, `suburb="Cabramatta"`): agent uses "Cabramatta" as the suburb in `suggestion_fetch_local_events` | P1 |
| 3.8 | Agent does NOT guess that a Vietnamese-Australian family is Buddhist from cultural origin alone (3B baseline test only — religion field must come from DB) | P0 |
| 3.9 | `curricullm_generate` NOT called (classwork is structured prose from DB) | P2 |

---

### Expected Final Output (3A — Secular family)

```markdown
🗓 Sydney Opera House — Family Architecture Tour
📍 Sydney Opera House · Sydney CBD  |  🕐 Every Saturday & Sunday, 10am  |  💲$$
🎓 Learning link: Elara can actually walk under those famous concrete sails and see how 1,056 identical curved pieces were cut from one giant sphere — the real building is wilder than any diagram.
💬 What to say on the way there: "How do you think they got a curved roof to hold up its own weight without falling in?"
🔗 https://www.sydneyoperahouse.com/visit-us/tours

---

🗓 Hyde Park Barracks — Convict Sydney
📍 Sydney Living Museums · Sydney CBD  |  🕐 Daily, 10am – 4pm  |  💲$
🎓 Learning link: This building was designed to control people — Elara can see how architecture can shape a community's whole way of living, for better or worse.
💬 What to say on the way there: "If you had to design a building that showed what our neighbourhood values most, what would it look like?"
🔗 https://sydneylivingmuseums.com.au/hyde-park-barracks

---

🗓 Australian Museum — First Nations Gallery
📍 Australian Museum · Sydney CBD  |  🕐 Daily, 10am – 5pm  |  💲free
🎓 Learning link: The galleries show how communities built meaning into spaces long before European-style architecture arrived in Sydney.
💬 What to say on the way there: "What makes a space feel like it belongs to a community?"
🔗 https://australian.museum
```

---

---

## Scenario 4: The Vague/Empty Profile Fallback — Graceful Degradation

**Severity:** P1  
**ID:** SUGG-004  
**Goal:** Test the entire tool chain's resilience when `suggestion_get_family_background` returns no DB row (new parent, never filled profile) and `suggestion_get_recent_classwork` returns an empty briefs list (class has no published briefs yet). The agent must not crash, must not hallucinate family data, and must fall back to `DEFAULT_FAMILY_BACKGROUND` values — producing safe, secular, medium-budget, generic-suburb recommendations.

---

### Given

```json
{
  "parent_clerk_id": "user_2newparent999XYZ",
  "class_id": "class_uuid_brand_new_no_briefs",
  "brief_id": null
}
```

**User Prompt:**
> "What can we do this weekend? My kid is in Year 3 and loves animals."

---

### Mock DB States

**`suggestion_get_family_background`:**

The Supabase query returns an empty result set (`rows.data = []`).

Expected tool return value (per code path `if not rows.data: return json.dumps(DEFAULT_FAMILY_BACKGROUND)`):
```json
{
  "religion": null,
  "cultural_origin": null,
  "languages_spoken": ["en"],
  "suburb": "Sydney",
  "interests": [],
  "family_size": null,
  "transport": "public",
  "budget_level": "medium",
  "weekend_availability": "any"
}
```

**`suggestion_get_recent_classwork`:**

The Supabase query returns `rows.data = []` (no published briefs for this class yet).

Expected tool return value:
```json
{
  "briefs": [],
  "count": 0
}
```

**`suggestion_fetch_local_events`:**

Called with `suburb="Sydney"` (DEFAULT). Returns full mock pool.

---

### Fallback Behaviour Contract

When `briefs` is empty AND the user message contains inline learning content ("loves animals"), the agent MUST:

1. Extract concept from the user's inline message ("animals" → maps to `biology`, `habitats`)
2. Use `curricullm_generate` if the inline text is ambiguous; or infer directly if single-word ("animals")
3. Proceed with `suggestion_fetch_local_events` and `suggestion_match_event_to_concept` using `DEFAULT_FAMILY_BACKGROUND`
4. Produce output safe for a secular/null-religion family

---

### Expected Tool Execution Order

```
1. suggestion_get_family_background(
     parent_clerk_id="user_2newparent999XYZ",
     class_id="class_uuid_brand_new_no_briefs"
   )
   → returns DEFAULT_FAMILY_BACKGROUND (empty DB row)

2. suggestion_get_recent_classwork(
     class_id="class_uuid_brand_new_no_briefs",
     limit=3
   )
   → returns { briefs: [], count: 0 }

3. [Agent detects empty briefs — must use inline user text]
   [Agent may optionally call curricullm_generate on "My kid is in Year 3 and loves animals"]
   → concept: "biology animals habitats"

4. suggestion_fetch_local_events(
     suburb="Sydney",
     category="any",
     weeks_ahead=4
   )

5. suggestion_match_event_to_concept(
     events_json="<step 4>",
     learning_concept="biology animals habitats",
     year_level="Year 3",
     family_background_json='{"religion": null, "suburb": "Sydney", "transport": "public", "budget_level": "medium", ...}',
     top_n=3
   )

6. [suggestion_save_to_brief NOT called — no brief_id]
```

---

### Assertions

| # | Assertion | Severity |
|---|-----------|----------|
| 4.1 | Tool does NOT raise an exception or return error JSON when DB row is absent | P0 |
| 4.2 | `family_background_json` passed to `suggestion_match_event_to_concept` uses DEFAULT values, not nulls | P0 |
| 4.3 | No religious venues appear (religion=null default) | P0 |
| 4.4 | Taronga Zoo appears in top picks (strong biology+habitats match, age_min=3 ≤ Year 3 age=8) | P1 |
| 4.5 | Centennial Parklands appears (free, biology, Year 3 appropriate) | P1 |
| 4.6 | Agent does NOT say "I couldn't find your profile" or expose internal DB error language | P1 |
| 4.7 | Output does not assume suburb, religion, or budget beyond the defaults | P0 |
| 4.8 | If `curricullm_generate` is called, it receives a prompt that includes "Year 3" as context | P2 |
| 4.9 | Tone remains warm and friendly despite fallback mode | P2 |

---

### Additional Edge: DB Connection Error Variant (SUGG-004B)

Simulate the `_get_db()` function raising an exception (e.g., Supabase offline).

**Expected behaviour:** Both `suggestion_get_family_background` and `suggestion_get_recent_classwork` return graceful JSON with a `_note` or `note` field explaining the error. Agent must:
- Still proceed to steps 3–5 using defaults
- NOT expose the raw exception message to the user
- NOT terminate the pipeline

**Assertion 4B.1:** Output still contains 3 valid event suggestions despite DB failure (P0).  
**Assertion 4B.2:** No stack trace or Python exception text appears in final output (P0).

---

### Expected Final Output

```markdown
🗓 Taronga Zoo — Wild Australia Trail
📍 Taronga Zoo · Mosman  |  🕐 Daily, 9:30am – 4:30pm  |  💲$$$
🎓 Learning link: Every animal at Taronga lives in a habitat built to show exactly how it survives in the wild — perfect for a kid who loves animals.
💬 What to say on the way there: "Which animal here do you think would be hardest to keep as a pet, and why?"
🔗 https://taronga.org.au

---

🗓 Centennial Parklands — Family Bike & Nature Loop
📍 Centennial Parklands · Centennial Park  |  🕐 Open daily, sunrise – sunset  |  💲free
🎓 Learning link: The park ponds are full of real animals doing real animal things — great for spotting life cycles in action.
💬 What to say on the way there: "Can you find an animal that's doing something it does to survive?"
🔗 https://www.centennialparklands.com.au

---

🗓 Royal Botanic Garden — Aboriginal Heritage Walk
📍 Royal Botanic Garden · Sydney CBD  |  🕐 Wed, Fri, Sun 10am  |  💲free
🎓 Learning link: Discover which native plants animals depend on — and how First Nations people understood those relationships thousands of years before scientists.
💬 What to say on the way there: "Which plant do you think the most animals rely on in this garden?"
🔗 https://www.botanicgardens.org.au
```

---

---

## Scenario 5: Multi-Disciplinary Override — Dual Concept Ranking Conflict

**Severity:** P1  
**ID:** SUGG-005  
**Goal:** A Year 6 student has studied two entirely different subjects in the same week: Science and Technology — Physical World strand (stored energy, forces, simple machines) and Creative Arts (painting, colour theory, sculpture). These two concept domains have almost zero event overlap in the mock pool. The test examines whether the agent intelligently runs `suggestion_match_event_to_concept` for EACH concept and merges the top results, OR whether it naively conflates them into a single noisy concept string. Both approaches are evaluated for correctness and quality.

---

### Given

```json
{
  "parent_clerk_id": "user_2jkl321GHItest005",
  "class_id": "class_uuid_year6_mixed_curriculum",
  "brief_id": "brief_uuid_yr6_week12"
}
```

**User Prompt:**
> "My daughter had the most hectic week! Science was about energy and machines, and then art class they did sculpture and colour mixing. She loved both. What's the best weekend outing that brings either of those together? High budget, we have a car. She's Year 6."

---

### Mock DB States

**`suggestion_get_family_background` returns:**
```json
{
  "religion": null,
  "cultural_origin": "chinese-australian",
  "languages_spoken": ["en", "zh"],
  "suburb": "Chatswood",
  "interests": ["science", "art", "technology", "design"],
  "family_size": 3,
  "transport": "car",
  "budget_level": "high",
  "weekend_availability": "saturday",
  "child_name": "Mei"
}
```

**`suggestion_get_recent_classwork` returns:**
```json
{
  "briefs": [
    {
      "brief_id": "brief_uuid_yr6_week12",
      "subject": "Science and Technology",
      "year_level": "Year 6",
      "content_type": "classwork",
      "processed_en": "Students investigated forms of energy — stored energy, energy in moving objects, and simple machines including levers, pulleys and gears. They built a working pulley system using string and cardboard spools and tested how the effort needed changed with more pulleys.",
      "at_home_activities": [
        { "type": "home", "title": "Build a simple lever using a ruler and eraser and test how position changes the force needed" }
      ],
      "published_at": "2026-04-07T09:00:00Z"
    },
    {
      "brief_id": "brief_uuid_yr6_week11",
      "subject": "Creative Arts",
      "year_level": "Year 6",
      "content_type": "classwork",
      "processed_en": "The class explored three-dimensional art making: clay sculpture, wire armature construction, and mixed-media assemblage. Students also studied colour theory — primary, secondary and complementary colours — and applied it in a final watercolour composition.",
      "at_home_activities": [],
      "published_at": "2026-04-04T09:00:00Z"
    }
  ],
  "count": 2
}
```

**Extended Event Pool:**
```json
{
  "source": "mock",
  "events": [
    {
      "title": "Powerhouse Museum — Hands-on Science Lab",
      "venue": "Powerhouse Museum",
      "suburb": "Ultimo",
      "date_range": "Daily, 10am – 5pm",
      "age_min": 4,
      "cost": "$$",
      "category": "science",
      "concepts": ["physics", "matter", "engineering", "energy"],
      "description": "Touch real steam engines, experiment with magnets, and watch water change state.",
      "url": "https://powerhouse.com.au",
      "religious_venue": false,
      "religion": null
    },
    {
      "title": "Art Gallery of NSW — Kids Drawing Workshop",
      "venue": "Art Gallery of NSW",
      "suburb": "The Domain",
      "date_range": "Saturdays, 11am",
      "age_min": 5,
      "cost": "free",
      "category": "art",
      "concepts": ["art", "geometry", "writing"],
      "description": "Free 45-minute workshop where kids sketch a famous painting.",
      "url": "https://www.artgallery.nsw.gov.au",
      "religious_venue": false,
      "religion": null
    },
    {
      "title": "Australian National Maritime Museum — Tall Ships & Submarines",
      "venue": "Australian National Maritime Museum",
      "suburb": "Darling Harbour",
      "date_range": "Daily, 10am – 4pm",
      "age_min": 4,
      "cost": "$",
      "category": "history",
      "concepts": ["history", "physics", "community"],
      "description": "Climb a real submarine and tall ship. Hands-on stations show buoyancy and navigation.",
      "url": "https://www.sea.museum",
      "religious_venue": false,
      "religion": null
    },
    {
      "title": "Sydney Opera House — Family Architecture Tour",
      "venue": "Sydney Opera House",
      "suburb": "Sydney CBD",
      "date_range": "Every Saturday & Sunday, 10am",
      "age_min": 6,
      "cost": "$$",
      "category": "architecture",
      "concepts": ["geometry", "architecture", "music", "design", "engineering"],
      "description": "Walk under the famous sail roof — 1,056 precast concrete sections sliced from one sphere.",
      "url": "https://www.sydneyoperahouse.com/visit-us/tours",
      "religious_venue": false,
      "religion": null
    },
    {
      "title": "White Rabbit Gallery — Contemporary Chinese Art",
      "venue": "White Rabbit Gallery",
      "suburb": "Chippendale",
      "date_range": "Wed–Sun, 10am – 5pm",
      "age_min": 6,
      "cost": "free",
      "category": "art",
      "concepts": ["art", "sculpture", "design", "architecture"],
      "description": "Four floors of contemporary Chinese art including sculpture, installation and digital works. Family-friendly audio guides available.",
      "url": "https://www.whiterabbitcollection.org",
      "religious_venue": false,
      "religion": null
    }
  ]
}
```

---

### Dual-Concept Strategy (Two Valid Execution Paths)

**Path A — Sequential dual calls (preferred):**
```
4a. suggestion_match_event_to_concept(
      learning_concept="stored energy moving objects forces machines pulley",
      year_level="Year 6",
      top_n=3
    )
    → Powerhouse Museum #1, Maritime Museum #2, Sydney Opera House #3

4b. suggestion_match_event_to_concept(
      learning_concept="sculpture art colour theory painting",
      year_level="Year 6",
      top_n=3
    )
    → White Rabbit Gallery #1, Art Gallery NSW #2, Sydney Opera House #3

5. Agent merges results, deduplicates, picks best 3 covering BOTH disciplines
```

**Path B — Single fused call (acceptable but lower quality):**
```
4. suggestion_match_event_to_concept(
     learning_concept="energy physics machines sculpture art colour",
     year_level="Year 6",
     top_n=3
   )
   → Mixed results — less precise, but still acceptable if top events cover both
```

---

### Expected `_score_event` Trace (Physics concept run)

| Event | Concept Match | Category | Interest Boost | Budget | Score |
|-------|--------------|----------|----------------|--------|-------|
| Powerhouse Museum | physics+energy+engineering → +9 | science in interests → +1 | — | "$$", high budget → no penalty | **10** |
| Maritime Museum | physics → +3 | history | — | "$", high → no penalty | **3** |
| Sydney Opera House | engineering → +3 | architecture in interests → +1 | — | "$$" → ok | **4** |
| White Rabbit Gallery | 0 concept matches | — | — | — | **0** DROPPED |
| Art Gallery NSW | 0 physics match | — | — | free → ok | **0** DROPPED |

---

### Expected `_score_event` Trace (Art concept run)

| Event | Concept Match | Category | Interest Boost | Budget | Score |
|-------|--------------|----------|----------------|--------|-------|
| White Rabbit Gallery | art+sculpture+design → +9 | art in interests → +1 | — | free → ok | **10** |
| Art Gallery NSW | art → +3 | art in interests → +1 | — | free → ok | **4** |
| Sydney Opera House | design → +3 | architecture in interests → +1 | — | "$$" → ok | **4** |
| Powerhouse Museum | 0 art concept match | — | — | — | **0** DROPPED |

---

### Expected Tool Execution Order (Preferred Path A)

```
1. suggestion_get_family_background(
     parent_clerk_id="user_2jkl321GHItest005",
     class_id="class_uuid_year6_mixed_curriculum"
   )

2. suggestion_get_recent_classwork(
     class_id="class_uuid_year6_mixed_curriculum",
     limit=3
   )
   → 2 briefs: Science (energy/machines) + Creative Arts (sculpture/colour)

3. suggestion_fetch_local_events(
     suburb="Chatswood",
     category="any",
     weeks_ahead=4
   )

4a. suggestion_match_event_to_concept(
      events_json="<step 3>",
      learning_concept="stored energy moving objects forces machines pulley lever",
      year_level="Year 6",
      family_background_json="<step 1>",
      top_n=3
    )

4b. suggestion_match_event_to_concept(
      events_json="<step 3>",
      learning_concept="sculpture art colour theory painting watercolour",
      year_level="Year 6",
      family_background_json="<step 1>",
      top_n=3
    )

5. suggestion_save_to_brief(
     brief_id="brief_uuid_yr6_week12",
     suggestions_json="<merged top 3 from 4a+4b>"
   )
```

---

### Assertions

| # | Assertion | Severity |
|---|-----------|----------|
| 5.1 | Powerhouse Museum appears in output (top physics/energy match) | P0 |
| 5.2 | White Rabbit Gallery OR Art Gallery NSW appears in output (art/sculpture match) | P0 |
| 5.3 | Final output covers BOTH science AND art disciplines across the 3 suggestions | P1 |
| 5.4 | Sydney Observatory does NOT appear (concepts don't match physics/art well enough vs Powerhouse) | P2 |
| 5.5 | `suggestion_save_to_brief` is called with `brief_id="brief_uuid_yr6_week12"` | P0 |
| 5.6 | The merged suggestions saved to brief do NOT include religious venues | P0 |
| 5.7 | Output does NOT use "curriculum", "educational", or "learning objective" | P0 |
| 5.8 | `curricullm_generate` is called IF agent determines it needs to parse the two distinct brief subjects (optional — depends on agent strategy) | P3 |
| 5.9 | Output uses child's name "Mei" | P2 |
| 5.10 | Transport note ("easy drive from Chatswood") appears given `transport="car"` | P2 |

---

### Expected Final Output (Canonical Form)

```markdown
🗓 Powerhouse Museum — Hands-on Science Lab
📍 Powerhouse Museum · Ultimo  |  🕐 Daily, 10am – 5pm  |  💲$$
🎓 Learning link: Mei can touch real pulleys and gears doing exactly the mechanical work she built with cardboard spools this week — but at full scale.
💬 What to say on the way there: "Can you find a machine that uses the same principle as your pulley model?"
🔗 https://powerhouse.com.au

---

🗓 White Rabbit Gallery — Contemporary Chinese Art
📍 White Rabbit Gallery · Chippendale  |  🕐 Wed–Sun, 10am – 5pm  |  💲free
🎓 Learning link: Four floors of sculpture and installation art — Mei can see exactly what professional artists do with the same 3D techniques she tried in class.
💬 What to say on the way there: "Pick one sculpture and tell me what it's made of and why the artist chose that material."
🔗 https://www.whiterabbitcollection.org

---

🗓 Sydney Opera House — Family Architecture Tour
📍 Sydney Opera House · Sydney CBD  |  🕐 Every Saturday & Sunday, 10am  |  💲$$
🎓 Learning link: The sails are an engineering puzzle AND a work of art — Mei can debate which subject it belongs to.
💬 What to say on the way there: "If you had to give this building a score for science and a score for art, what would each one be?"
🔗 https://www.sydneyoperahouse.com/visit-us/tours
```

---

---

## Appendix A: Regression Matrix

| Test ID | Religion Gate | Age Gate | Budget Gate | Transport Gate | curricullm_generate | Save to Brief | Fallback Default |
|---------|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| SUGG-001 | ✅ (null) | N/A | N/A | N/A | **Required** | ❌ | N/A |
| SUGG-002 | ✅ (null) | **Required P0** | **Required P0** | **Required P0** | ❌ | ❌ | N/A |
| SUGG-003A | **Required P0** (secular) | N/A | N/A | N/A | ❌ | **Required P0** | N/A |
| SUGG-003B | **Required P0** (buddhist) | N/A | N/A | N/A | ❌ | **Required P0** | N/A |
| SUGG-004 | ✅ (null default) | N/A | N/A | N/A | Optional | ❌ | **Required P0** |
| SUGG-004B | ✅ | N/A | N/A | N/A | N/A | ❌ | **Required P0** (DB error) |
| SUGG-005 | ✅ (null) | N/A | N/A | N/A | Optional | **Required P0** | N/A |

---

## Appendix B: Tone Compliance Checklist (Apply to ALL Outputs)

Run this regex scan against every generated response:

```
FORBIDDEN_WORDS = [
    r'\bcurriculum\b',
    r'\beducational\b',
    r'\blearning objective[s]?\b',
    r'\bpedagog\w+\b',
    r'\bstandard[s]?\b',
    r'\boutcome[s]?\b',
    r'\bsyllabus\b',
    r'\bunit of work\b',
    r'\bcross-curricular\b',
]
```

```
REQUIRED_ELEMENTS_PER_SUGGESTION = [
    r'^🗓 .+',
    r'^📍 .+',
    r'^🎓 Learning link: .+',
    r'^💬 What to say on the way there: ".+"',
    r'^🔗 https?://.+',
]
```

**Word count check:** Each block between `🗓` and `🔗` must not exceed 50 words (excluding the URL line).

---

## Appendix C: `curricullm_generate` Call Contract

When the agent calls `curricullm_generate` for concept extraction, the payload MUST conform to:

```json
{
  "task": "concept_extraction",
  "text": "<raw user or brief text>",
  "instructions": "Extract 1-2 core academic concepts a primary school child has been studying. Return them as a short phrase suitable for event matching. Ignore behavioral notes, parent confusion, or unrelated context.",
  "year_level": "<Year K through Year 6>",
  "max_concepts": 2
}
```

**Expected response shape:**
```json
{
  "concepts": ["<concept 1>", "<concept 2 optional>"],
  "year_level": "<echoed>",
  "confidence": 0.0,
  "notes": "<optional reasoning>"
}
```

**Failure modes to test:**

| Failure | Expected Behaviour |
|---------|-------------------|
| `curricullm_generate` returns empty `concepts: []` | Agent falls back to keyword extraction from raw text |
| `curricullm_generate` returns `confidence < 0.5` | Agent logs warning and uses its own concept inference |
| `curricullm_generate` times out | Agent retries once, then proceeds without it |
| `curricullm_generate` returns a concept with no keyword match in `CONCEPT_KEYWORDS` | `_expand_concept_keywords` falls back to word-level tokenisation |

---

## Appendix D: Save-to-Brief Payload Validation

When `suggestion_save_to_brief` is called, each activity entry in `at_home_activities` MUST contain:

```json
{
  "type": "event_outing",
  "title": "<non-null string>",
  "venue": "<non-null string>",
  "suburb": "<non-null string>",
  "when": "<non-null string>",
  "cost": "<one of: free | $ | $$ | $$$>",
  "url": "<valid https URL>",
  "description": "<non-null string>",
  "learning_link": "<non-null string>",
  "duration_mins": 90
}
```

**Assertion:** No `null` values in any of the required fields above (P1 for each field).  
**Assertion:** Saved activities do NOT include events that were filtered by `_score_event` (P0).  
**Assertion:** Saved activities do NOT include religious venues for non-matching families (P0).
