'use client'
import { useState } from 'react'
import { Star, Trophy, Play } from 'lucide-react'
import { useApi } from '@/lib/api'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

const LEVELS = [
  { id: 1, title: 'Recognition', question: 'Can you spot a fraction?', stars: 1, color: 'bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-900', activeColor: 'bg-blue-500 border-blue-600 text-white shadow-md scale-[1.02]' },
  { id: 2, title: 'Naming', question: "What's the name for the top number?", stars: 2, color: 'bg-green-50 hover:bg-green-100 border-green-200 text-green-900', activeColor: 'bg-green-500 border-green-600 text-white shadow-md scale-[1.02]' },
  { id: 3, title: 'Problem Solving', question: 'Are these fractions equivalent?', stars: 3, color: 'bg-orange-50 hover:bg-orange-100 border-orange-200 text-orange-900', activeColor: 'bg-orange-500 border-orange-600 text-white shadow-md scale-[1.02]' },
  { id: 4, title: 'Creative Thinking', question: 'Create your own fraction story!', stars: 4, color: 'bg-purple-50 hover:bg-purple-100 border-purple-200 text-purple-900', activeColor: 'bg-purple-500 border-purple-600 text-white shadow-md scale-[1.02]' },
]

export default function PlayPage() {
  const api = useApi()
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null)
  const [gameCode, setGameCode] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)

  const handleStartGame = async () => {
    if (!selectedLevel) return
    setIsGenerating(true)
    try {
      const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'
      const res = await fetch(`${BASE_URL}/api/game/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: 'Mathematics',
          year_level: 'Year 4',
          concept: 'fractions',
          difficulty: selectedLevel <= 2 ? 'easy' : selectedLevel === 3 ? 'medium' : 'hard',
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setGameCode(data.code)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsGenerating(false)
    }
  }

  if (gameCode) {
    return (
      <div className="w-full max-w-5xl mx-auto p-4 sm:p-6 pb-24">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-900">🎮 Level {selectedLevel} Challenge</h2>
          <Button variant="outline" onClick={() => { setGameCode(null); setSelectedLevel(null) }}>
            ← Back
          </Button>
        </div>
        <Card className="border-none shadow-md overflow-hidden">
          <CardContent className="p-0">
            <div className="bg-slate-900 text-white p-4 font-mono text-sm whitespace-pre-wrap max-h-[60vh] overflow-auto">
              {gameCode}
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100">
              <p className="text-sm text-slate-500">Game code generated! In production this renders with Sandpack.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8 p-4 sm:p-6 pb-32">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center justify-center p-3 bg-amber-100 rounded-full mb-2">
          <Trophy className="w-10 h-10 text-amber-600" />
        </div>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">Knowledge Challenge!</h2>
        <p className="text-lg text-slate-500 max-w-lg mx-auto">Test what you&apos;ve learned this week and earn stars for your collection.</p>
      </div>

      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <h3 className="font-bold text-slate-800">Weekly Progress</h3>
          <p className="text-sm text-slate-500">You&apos;re doing great!</p>
        </div>
        <div className="flex items-center gap-2 bg-amber-50 px-4 py-2 rounded-xl border border-amber-100">
          <Star className="w-6 h-6 text-amber-500 fill-amber-500" />
          <span className="text-2xl font-bold text-amber-600">3</span>
          <span className="text-amber-700/60 font-medium">/ 15</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        {LEVELS.map(level => {
          const isActive = selectedLevel === level.id
          return (
            <button
              key={level.id}
              onClick={() => setSelectedLevel(level.id)}
              className={`text-left p-6 rounded-2xl border-2 transition-all duration-300 relative overflow-hidden group ${isActive ? level.activeColor : level.color}`}
              data-testid={`level-card-${level.id}`}
            >
              <div className="flex justify-between items-start mb-4 relative z-10">
                <Badge variant="secondary" className="bg-white/80 border-none">Level {level.id}</Badge>
                <div className="flex gap-0.5">
                  {Array.from({ length: level.stars }).map((_, i) => (
                    <Star key={i} className={`w-4 h-4 ${isActive ? 'text-amber-300 fill-amber-300' : 'text-amber-500 fill-amber-500'}`} />
                  ))}
                </div>
              </div>
              <h3 className="text-xl font-bold mb-2 relative z-10">{level.title}</h3>
              <p className={`text-sm relative z-10 ${isActive ? 'text-white/90' : 'opacity-80'}`}>{level.question}</p>
              <div className={`absolute -right-4 -bottom-8 text-8xl font-black opacity-10 transition-transform group-hover:scale-110 ${isActive ? 'text-white' : ''}`}>
                {level.id}
              </div>
            </button>
          )
        })}
      </div>

      {/* Bonus Level */}
      <button
        onClick={() => setSelectedLevel(5)}
        className={`w-full text-left p-6 rounded-2xl border-2 transition-all duration-300 relative overflow-hidden group mt-2
          ${selectedLevel === 5
            ? 'bg-gradient-to-r from-amber-500 to-orange-500 border-amber-600 text-white shadow-md scale-[1.01]'
            : 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200 text-amber-900 hover:from-amber-100 hover:to-orange-100'}`}
        data-testid="level-card-5"
      >
        <div className="flex justify-between items-start mb-4 relative z-10">
          <Badge variant="secondary" className={`bg-white/80 border-none uppercase tracking-wider font-bold ${selectedLevel === 5 ? 'text-slate-900' : 'text-amber-700'}`}>
            Bonus
          </Badge>
          <div className="flex gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className={`w-4 h-4 ${selectedLevel === 5 ? 'text-amber-200 fill-amber-200' : 'text-amber-500 fill-amber-500'}`} />
            ))}
          </div>
        </div>
        <h3 className="text-xl font-bold mb-2 relative z-10">Challenge Mode</h3>
        <p className={`text-sm relative z-10 ${selectedLevel === 5 ? 'text-white/90' : 'opacity-80'}`}>Mixed challenge across all skills. Are you ready?</p>
        <Trophy className={`absolute -right-2 -bottom-4 w-32 h-32 opacity-10 transition-transform group-hover:scale-110 ${selectedLevel === 5 ? 'text-white' : 'text-amber-900'}`} />
      </button>

      {/* Start Button */}
      <div className={`transition-all duration-500 overflow-hidden flex justify-center ${selectedLevel ? 'max-h-32 opacity-100 mt-8' : 'max-h-0 opacity-0 mt-0'}`}>
        <Button
          size="lg"
          className="h-16 px-10 text-xl font-bold rounded-2xl bg-slate-900 hover:bg-slate-800 text-white shadow-lg group"
          onClick={handleStartGame}
          disabled={isGenerating}
          data-testid="button-start-challenge"
        >
          <Play className="w-6 h-6 mr-3 fill-current group-hover:scale-110 transition-transform" />
          {isGenerating ? 'Generating...' : `Start ${selectedLevel === 5 ? 'Bonus Challenge' : `Level ${selectedLevel}`}`}
        </Button>
      </div>
    </div>
  )
}
