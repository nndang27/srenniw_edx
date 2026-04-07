const fs = require('fs')
const path = require('path')

const OUT_DIR = path.join(__dirname, '../backend/tests/data')

// Ensure directory exists
if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true })
}

// ── 1. GENERATE TIMETABLE (400 days) ── 
const startDate = new Date('2025-01-01')
const endDate = new Date('2026-02-05')
const sampleTimetable = {}

const weekTemplates = [
  // Mon
  [
    { subject: 'Maths', time: '9:00–10:00', teacher: 'Ms. Smith', topic: 'Fractions & Decimals', type: 'before-school' },
    { subject: 'English', time: '10:30–11:30', teacher: 'Ms. Brown', topic: 'Narrative Writing', type: 'before-school' },
    { subject: 'PE', time: '13:00–14:00', teacher: 'Coach Davis', topic: 'Team Relay Races', type: 'before-school' }
  ],
  // Tue
  [
    { subject: 'Science', time: '9:00–10:00', teacher: 'Mr. Jones', topic: 'States of Matter', type: 'before-school' },
    { subject: 'HSIE', time: '10:30–11:30', teacher: 'Mr. Wilson', topic: 'Australian Communities', type: 'before-school' },
    { subject: 'Maths', time: '13:00–14:00', teacher: 'Ms. Smith', topic: 'Multiplication Tables', type: 'before-school' },
    { subject: 'Creative Arts', time: '14:15–15:00', teacher: 'Ms. Chen', topic: 'Watercolour Basics', type: 'before-school' }
  ],
  // Wed
  [
    { subject: 'English', time: '9:00–10:00', teacher: 'Ms. Brown', topic: 'Reading Comprehension', type: 'before-school' },
    { subject: 'Maths', time: '10:30–11:30', teacher: 'Ms. Smith', topic: 'Mental Math Challenge', type: 'before-school' },
    { subject: 'Science', time: '13:00–14:00', teacher: 'Mr. Jones', topic: 'Plant Life Cycles', type: 'before-school' }
  ],
  // Thu
  [
    { subject: 'HSIE', time: '9:00–10:00', teacher: 'Mr. Wilson', topic: 'Local Geography', type: 'before-school' },
    { subject: 'English', time: '10:30–11:30', teacher: 'Ms. Brown', topic: 'Spelling & Grammar', type: 'before-school' },
    { subject: 'PE', time: '13:00–14:00', teacher: 'Coach Davis', topic: 'Fitness Circuit', type: 'before-school' }
  ],
  // Fri
  [
    { subject: 'Maths', time: '9:00–10:00', teacher: 'Ms. Smith', topic: 'Weekly Review Test', type: 'before-school' },
    { subject: 'Creative Arts', time: '10:30–11:30', teacher: 'Ms. Chen', topic: 'Clay Modeling', type: 'before-school' },
    { subject: 'Science', time: '13:00–14:00', teacher: 'Mr. Jones', topic: 'Science Experiments Fair', type: 'before-school' }
  ],
  // Sat
  [],
  // Sun
  []
]

const topicsPool = {
  Maths: ['Fractions & Decimals', 'Multiplication Tables', 'Mental Math Challenge', 'Weekly Review Test', 'Geometry Shapes', 'Algebra Basics', 'Division Tricks'],
  Science: ['States of Matter', 'Plant Life Cycles', 'Science Experiments Fair', 'Space & Planets', 'Weather Systems'],
  English: ['Narrative Writing', 'Reading Comprehension', 'Spelling & Grammar', 'Poetry', 'Persuasive Writing'],
  HSIE: ['Australian Communities', 'Local Geography', 'History of Transport', 'World Cultures', 'Civics & Citizenship'],
  'Creative Arts': ['Watercolour Basics', 'Clay Modeling', 'Drama & Roleplay', 'Music Rhythms', 'Drawing Techniques'],
  PE: ['Team Relay Races', 'Fitness Circuit', 'Basketball Skills', 'Gymnastics Basics', 'Soccer Drills']
}

for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
  const dateStr = d.toISOString().split('T')[0]
  let dayIdx = d.getDay() - 1 // Mon=0, Sun=6
  if (dayIdx === -1) dayIdx = 6
  
  // Create a deep copy of the template for this day
  const dailyClasses = JSON.parse(JSON.stringify(weekTemplates[dayIdx]))
  
  // Randomize the topic for each class based on the subject
  for (const cls of dailyClasses) {
    const pool = topicsPool[cls.subject]
    if (pool) {
      // Pick a random topic (use simple hash of date so it's stable but looks random)
      const hash = dateStr.split('-').reduce((acc, val) => acc + parseInt(val), 0) + cls.time.length
      // Or just genuinely random:
      const randomIdx = Math.floor(Math.random() * pool.length)
      cls.topic = pool[randomIdx]
    }
  }
  
  sampleTimetable[dateStr] = dailyClasses
}
fs.writeFileSync(path.join(OUT_DIR, 'sample_timetable.json'), JSON.stringify(sampleTimetable, null, 2))


// ── 2. GENERATE ACTIVITIES ──
const sampleActivities = {
  previewPrompts: {
    'Maths': 'Do you know what we use fractions for in real life?',
    'Science': 'Can you name one thing that changes from solid to liquid?',
    'English': 'What makes a piece of writing convincing to you?',
    'HSIE': 'What do you know about how our local community works?',
    'Creative Arts': 'What colours do you think make a painting look peaceful?',
    'PE': "How do you think you can improve your team's speed?"
  },
  suggestions: {
    'Maths': [
      { emoji: '🎲', title: 'Fraction War Card Game', desc: 'Use a deck of cards to create fractions. Highest fraction wins the round.' },
      { emoji: '🛒', title: 'Supermarket Maths', desc: 'Let them calculate totals and change during the next grocery run.' },
      { emoji: '📏', title: 'Measure the House', desc: 'Estimate then measure furniture — compare metric and informal units.' }
    ],
    'Science': [
      { emoji: '🌱', title: 'Kitchen Garden Experiment', desc: 'Grow beans in a jar — observe roots and shoots forming over days.' },
      { emoji: '🧊', title: 'States of Matter Kitchen Lab', desc: 'Observe ice melting and water boiling — record observations together.' },
      { emoji: '🔦', title: 'Shadow Tracing', desc: 'Trace shadows hourly to understand how the sun moves.' }
    ],
    'English': [
      { emoji: '✍️', title: 'Story Starter Jar', desc: 'Write prompts on paper, pull one out, write for 10 minutes.' },
      { emoji: '📰', title: 'Family Newspaper', desc: 'Write a short article about something that happened this week.' },
      { emoji: '🎙️', title: 'Persuasion Challenge', desc: 'Give them 2 mins to convince you of something — then discuss.' }
    ],
    'HSIE': [
      { emoji: '🗺️', title: 'Map Your Neighbourhood', desc: 'Draw a map of your local area with landmarks.' },
      { emoji: '📸', title: 'Community Photo Walk', desc: 'Photograph things that show community roles (post box, park, school).' },
      { emoji: '🌍', title: 'Country Research Box', desc: 'Pick a country and find 5 interesting facts together.' }
    ],
    'Creative Arts': [
      { emoji: '🖌️', title: 'Watercolour Wash Sunset', desc: 'Practice blending colours to create a gradient sky.' },
      { emoji: '🎵', title: 'Rhythm Clapping Game', desc: 'Clap patterns and challenge each other to repeat them.' },
      { emoji: '🎭', title: 'Mini Play', desc: 'Act out a favourite story scene — swap roles.' }
    ],
    'PE': [
      { emoji: '⏱️', title: 'Backyard Obstacle Course', desc: 'Set up a timed course with hula hoops, cones, and jumps.' },
      { emoji: '🎯', title: 'Target Throwing', desc: 'Throw beanbags at chalk circles — record accuracy.' },
      { emoji: '🚴', title: 'Bike Ride Challenge', desc: 'Set a distance goal and track it on a map app.' }
    ]
  },
  playQuestions: {
    'Maths': [
      { q: 'What is 3/4 of 20?', options: ['12', '15', '10', '8'], answer: 1 },
      { q: 'Which is bigger: 0.75 or 3/4?', options: ['0.75', '3/4', 'They are equal', 'Cannot tell'], answer: 2 }
    ],
    'Science': [
      { q: 'Water changing from liquid to gas is called?', options: ['Freezing', 'Condensation', 'Evaporation', 'Melting'], answer: 2 },
      { q: 'Which organism makes its own food from sunlight?', options: ['Lion', 'Mushroom', 'Plant', 'Fish'], answer: 2 }
    ],
    'English': [
      { q: 'Which word is an adjective?', options: ['Run', 'Quickly', 'Beautiful', 'Jump'], answer: 2 },
      { q: 'A piece of writing that tries to convince is called…?', options: ['Narrative', 'Persuasive', 'Descriptive', 'Report'], answer: 1 }
    ],
    'HSIE': [
      { q: 'What is the capital of Australia?', options: ['Sydney', 'Melbourne', 'Canberra', 'Brisbane'], answer: 2 },
      { q: 'Who makes laws in Australia?', options: ['The Police', 'Parliament', 'The Queen', 'Schools'], answer: 1 }
    ],
    'Creative Arts': [
      { q: 'Red + Blue = ?', options: ['Orange', 'Green', 'Purple', 'Brown'], answer: 2 },
      { q: 'What is a melody?', options: ['A beat pattern', 'A tune of notes', 'A type of dance', 'A painting style'], answer: 1 }
    ],
    'PE': [
      { q: 'How many players in a basketball team on court?', options: ['4', '5', '6', '7'], answer: 1 },
      { q: 'Which muscle group do squats primarily work?', options: ['Arms', 'Chest', 'Legs', 'Back'], answer: 2 }
    ]
  }
}
fs.writeFileSync(path.join(OUT_DIR, 'sample_activities.json'), JSON.stringify(sampleActivities, null, 2))


// ── 3. GENERATE ANALYTICS INSIGHTS ──
// We will read the 400days mock data, bin the emotion trend properly, and emulate an AI response.
let rawInsights = [];
try {
  const contents = fs.readFileSync(path.join(OUT_DIR, 'mock_data_400days.json'), 'utf8')
  rawInsights = JSON.parse(contents)
} catch (e) {
  console.log('No mock_data_400days found. Falling back to an empty structure.');
}

const ESCORE = { Excited: 5, Happy: 5, Curious: 4, Neutral: 3, Anxious: 2, Disengaged: 1 }
const EMOJIS = { 5: '🤩', 4: '🤔', 3: '😐', 2: '😰', 1: '🥱' }

const sorted = rawInsights.sort((a,b) => a.date.localeCompare(b.date));
function generatePoints(sliceData) {
  return sliceData.map(e => {
    const sc = ESCORE[e.emotion] || 3;
    return { day: e.date.slice(5), date: e.date, score: sc, emoji: EMOJIS[sc] || '😐', emotion: e.emotion, parent_note: e.parent_note };
  });
}

const last365 = sorted.slice(-365) || []

// For week: last 7 points
const chartW = generatePoints(last365.slice(-7))

// For month: bin by week (average over 30 days) -> group last 30 days into 4 chunks
const chartM = []
const last30 = last365.slice(-30);
for (let i = 0; i < last30.length; i += 7) {
  const chunk = last30.slice(i, i+7);
  const avg = chunk.reduce((s, e) => s + (ESCORE[e.emotion]||3), 0) / chunk.length;
  const roundedAvg = Math.round(avg);
  const midDate = chunk[Math.floor(chunk.length/2)].date.slice(5);
  chartM.push({ day: midDate, date: chunk[0].date, score: avg, emoji: EMOJIS[roundedAvg], emotion: 'Averaged' });
}

// For year: bin by month (average over 365 days) -> group last 365 days into 12 chunks (roughly 30 points each)
const chartY = []
const monthlyMap = {}
for (let item of last365) {
  const monthStr = item.date.slice(0,7); // YYYY-MM
  if (!monthlyMap[monthStr]) monthlyMap[monthStr] = [];
  monthlyMap[monthStr].push(item);
}

for (const [monthKey, chunk] of Object.entries(monthlyMap)) {
  const avg = chunk.reduce((s, e) => s + (ESCORE[e.emotion]||3), 0) / chunk.length;
  const roundedAvg = Math.round(avg);
  chartY.push({ day: monthKey, date: monthKey+'-01', score: avg, emoji: EMOJIS[roundedAvg], emotion: 'Averaged' });
}

const sampleAnalytics = {
  intelligences: { 
    radar_data: { Logical: 80, Linguistic: 75, Spatial: 65, Kinesthetic: 85, Musical: 50, Interpersonal: 90, Intrapersonal: 70, Naturalist: 60 },
    top_strengths: ['Interpersonal', 'Kinesthetic'], 
    insight_message: 'Strong potential in interpersonal communication & kinesthetic learning! Active and social learning styles work best.' 
  },
  vark: { 
    vark_distribution: { Visual: 25, Auditory: 20, Reading: 15, Kinesthetic: 40 }, 
    primary_hint: 'Kinesthetic', 
    multimodal_suggestion: 'Try a variety of hands-on, movement-based approaches mixed with visual aids.', 
    disclaimer: 'Multimodal learning yields the best results!' 
  },
  cognition: { 
    status_badge: 'Exploring Ahead', 
    position_value: 1.6, 
    milestones: [{ id: 0, label: 'Year 3' }, { id: 1, label: 'Year 4 (Current)' }, { id: 2, label: 'Year 5' }], 
    development_insight: 'Surpassing Year 4 cognitive targets consistently.', 
    recommended_support: 'Introduce more complex problem-solving scenarios to keep them challenged.', 
    average_bloom_level: 4.2, 
    weekly_trend: [{week:'W1', level:3.8}, {week:'W2', level:4.0}, {week:'W3', level:4.2}, {week:'W4', level:4.2}] 
  },
  emotion: { 
    today: { emotion: '🤩 Excited', score: 5, message: 'Extremely positive and engaged across all subjects today!', parent_note: null }, 
    ratio_status: 'Flourishing', 
    positivity_ratio: 0.85, 
    chart_data_week: chartW, 
    chart_data_month: chartM, 
    chart_data_year: chartY, 
    alert: null, 
    perma_scores: { Positive: 85, Engagement: 90, Relationships: 75, Meaning: 80, Achievement: 95 } 
  },
  personality: { 
    traits: { Openness: 80, Conscientiousness: 70, Extraversion: 90, Agreeableness: 85, Neuroticism: 20 }, 
    superpower: 'Social Catalyst', 
    insight: 'Energetic, outgoing, and highly emotionally intelligent.', 
    gentle_reminder: null 
  },
  career: { 
    riasec_scores: { Realistic: 75, Investigative: 65, Artistic: 70, Social: 95, Enterprising: 85, Conventional: 50 }, 
    holland_code: 'SE', 
    top_clusters: ['Social', 'Enterprising'], 
    cluster_groups: {}, 
    pathway_inspiration: 'High aptitude for leadership, education, or dynamic team environments.', 
    disclaimer: 'These interests keep growing — use as a fun lens to discover new hobbies!' 
  }
}

fs.writeFileSync(path.join(OUT_DIR, 'sample_analytics_insights.json'), JSON.stringify(sampleAnalytics, null, 2))

console.log('Successfully generated JSON payloads!')
