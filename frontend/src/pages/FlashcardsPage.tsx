import { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, RotateCcw, Check, X, Layers, Shuffle } from 'lucide-react'
import type { Flashcard } from '../types'
import * as fcApi from '../api/flashcards'
import './FlashcardsPage.css'

export default function FlashcardsPage() {
  const [cards, setCards] = useState<Flashcard[]>([])
  const [period, setPeriod] = useState<string | null>(null)
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [known, setKnown] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  useEffect(() => { void load() }, [])

  async function load() {
    setLoading(true)
    try { setCards(await fcApi.getFlashcards()) } finally { setLoading(false) }
  }

  const periods = useMemo(
    () => Array.from(new Set(cards.map((c) => c.period).filter(Boolean) as string[])).sort(),
    [cards],
  )
  const filtered = useMemo(
    () => (period ? cards.filter((c) => c.period === period) : cards),
    [cards, period],
  )

  function pickPeriod(p: string | null) { setPeriod(p); setIndex(0); setFlipped(false) }

  const card = filtered[index]
  const go = (d: number) => { setFlipped(false); setIndex((i) => (i + d + filtered.length) % filtered.length) }

  async function mark(remembered: boolean) {
    if (!card) return
    await fcApi.reviewFlashcard(card.id, remembered)
    setKnown((prev) => {
      const n = new Set(prev)
      if (remembered) n.add(card.id); else n.delete(card.id)
      return n
    })
    setTimeout(() => go(1), 180)
  }

  function shuffle() {
    setCards((prev) => [...prev].sort(() => Math.random() - 0.5))
    setIndex(0); setFlipped(false)
  }

  if (loading) return <div className="page"><div className="page-body muted">Đang tải thẻ…</div></div>

  return (
    <div className="page">
      <div className="page-head fc-head">
        <div><h1>Thẻ ghi nhớ</h1><p>Lật thẻ để ôn các mốc sự kiện · Đã nhớ {known.size}/{cards.length}</p></div>
        <button className="btn btn-ghost btn-sm" onClick={shuffle}><Shuffle size={16} /> Xáo trộn</button>
      </div>

      <div className="page-body fc-body">
        {/* Bộ lọc theo giai đoạn */}
        <div className="fc-filters">
          <button className={'fc-filter' + (period === null ? ' active' : '')} onClick={() => pickPeriod(null)}>Tất cả</button>
          {periods.map((p) => (
            <button key={p} className={'fc-filter' + (period === p ? ' active' : '')} onClick={() => pickPeriod(p)}>{p}</button>
          ))}
        </div>

        {card ? (
          <>
            <div className="fc-counter">
              <Layers size={16} /> Thẻ {index + 1} / {filtered.length}
              {card.period && <span className="badge badge-gold">{card.period}</span>}
            </div>

            <div className={'fc-card' + (flipped ? ' flipped' : '')} onClick={() => setFlipped((f) => !f)}>
              <div className="fc-face fc-front">
                <span className="fc-tag">{card.topic}</span>
                <p>{card.front}</p>
                <span className="fc-hint"><RotateCcw size={13} /> Nhấn để xem đáp án</span>
              </div>
              <div className="fc-face fc-back">
                <span className="fc-tag">Đáp án</span>
                <p>{card.back}</p>
              </div>
            </div>

            <div className="fc-controls">
              <button className="fc-nav" onClick={() => go(-1)} title="Thẻ trước"><ChevronLeft size={22} /></button>
              <div className="fc-mark">
                <button className="btn btn-ghost" onClick={() => mark(false)}><X size={18} /> Chưa nhớ</button>
                <button className="btn btn-gold" onClick={() => mark(true)}><Check size={18} /> Đã nhớ</button>
              </div>
              <button className="fc-nav" onClick={() => go(1)} title="Thẻ sau"><ChevronRight size={22} /></button>
            </div>
          </>
        ) : (
          <p className="muted" style={{ marginTop: 40 }}>Không có thẻ nào cho giai đoạn này.</p>
        )}
      </div>
    </div>
  )
}
