import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import {
  Brain,
  Check,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  Layers,
  RotateCcw,
  Sparkles,
  Trophy,
  X,
} from 'lucide-react'
import type { Flashcard } from '../types'
import * as fcApi from '../api/flashcards'
import './FlashcardsPage.css'

type MemoryFilter = 'all' | 'unknown' | 'partial' | 'known'
type MemoryLevel = 'again' | 'partial' | 'known'
type TimelineStyle = CSSProperties & { '--timeline-count': number }

export default function FlashcardsPage() {
  const [cards, setCards] = useState<Flashcard[]>([])
  const [period, setPeriod] = useState<string | null>(null)
  const [memoryFilter, setMemoryFilter] = useState<MemoryFilter>('all')
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [known, setKnown] = useState<Set<string>>(new Set())
  const [partial, setPartial] = useState<Set<string>>(new Set())
  const [reviewed, setReviewed] = useState<Set<string>>(new Set())
  const [studyIds, setStudyIds] = useState<string[] | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { void load() }, [])

  async function load() {
    setLoading(true)
    try {
      const [cardsData, status] = await Promise.all([
        fcApi.getFlashcards(),
        fcApi.getMyStatus().catch(() => []),
      ])
      setCards(cardsData)
      // Khôi phục tiến độ đã lưu: thẻ có lần đánh giá mới nhất = "Đã nhớ" → known
      // (không hiện "Đã nhớ 0" sai lệch sau khi F5). "Hơi nhớ" không lưu ở backend nên không khôi phục.
      setKnown(new Set(status.filter((s) => s.remembered).map((s) => s.flashcardId)))
    } finally { setLoading(false) }
  }

  const periods = useMemo(
    () => Array.from(new Set(cards.map((c) => c.period).filter(Boolean) as string[])).sort(),
    [cards],
  )

  const periodCards = useMemo(
    () => (period ? cards.filter((c) => c.period === period) : cards),
    [cards, period],
  )

  const liveFiltered = useMemo(() => {
    const byPeriod = periodCards
    if (memoryFilter === 'known') return byPeriod.filter((c) => known.has(c.id))
    if (memoryFilter === 'partial') return byPeriod.filter((c) => partial.has(c.id))
    if (memoryFilter === 'unknown') return byPeriod.filter((c) => !known.has(c.id) && !partial.has(c.id))
    return byPeriod
  }, [periodCards, memoryFilter, known, partial])

  const filtered = useMemo(() => {
    if (memoryFilter === 'all' || !studyIds) return liveFiltered
    const byId = new Map(periodCards.map((c) => [c.id, c]))
    return studyIds.map((id) => byId.get(id)).filter((c): c is Flashcard => Boolean(c))
  }, [liveFiltered, memoryFilter, periodCards, studyIds])

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null
      if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA') return
      if (!card) return

      if (e.code === 'Space') { e.preventDefault(); setFlipped((f) => !f) }
      if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1) }
      if (e.key === 'ArrowRight') { e.preventDefault(); go(1) }
      if (e.key === '1') { e.preventDefault(); void mark('again') }
      if (e.key === '2') { e.preventDefault(); void mark('partial') }
      if (e.key === '3') { e.preventDefault(); void mark('known') }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  })

  function pickPeriod(p: string | null) {
    setPeriod(p)
    setMemoryFilter(p ? 'unknown' : 'all')
    setIndex(0)
    setFlipped(false)
    setStudyIds(null)
  }

  function pickMemoryFilter(next: MemoryFilter) {
    setMemoryFilter(next)
    setIndex(0)
    setFlipped(false)
    if (next === 'all') {
      setStudyIds(null)
      return
    }

    const snapshot = periodCards.filter((c) => {
      if (next === 'known') return known.has(c.id)
      if (next === 'partial') return partial.has(c.id)
      return !known.has(c.id) && !partial.has(c.id)
    })
    setStudyIds(snapshot.map((c) => c.id))
  }

  const total = filtered.length
  const safeIndex = total ? Math.min(index, total - 1) : 0
  const card = filtered[safeIndex]
  const completed = cards.length > 0 && reviewed.size >= cards.length
  const rememberedCount = periodCards.filter((c) => known.has(c.id)).length
  const partialCount = periodCards.filter((c) => partial.has(c.id)).length
  const unknownCount = periodCards.filter((c) => !known.has(c.id) && !partial.has(c.id)).length
  const remainingCount = Math.max(periodCards.length - rememberedCount, 0)
  const streak = reviewed.size
  const progress = cards.length ? Math.round((reviewed.size / cards.length) * 100) : 0
  const activeTimelinePeriod = period ?? card?.period ?? null
  const currentPeriodCount = card?.period ? cards.filter((c) => c.period === card.period).length : total
  const showPeriodNav = periods.length > 1

  const go = (d: number) => {
    if (!filtered.length) return
    setFlipped(false)
    setIndex((i) => (i + d + filtered.length) % filtered.length)
  }

  const goPeriod = (d: number) => {
    if (!periods.length) return
    const current = activeTimelinePeriod ?? periods[0]
    const currentIndex = Math.max(0, periods.indexOf(current))
    pickPeriod(periods[(currentIndex + d + periods.length) % periods.length])
  }

  async function mark(level: MemoryLevel) {
    if (!card) return
    const remembered = level === 'known'
    await fcApi.reviewFlashcard(card.id, remembered)

    setKnown((prev) => {
      const n = new Set(prev)
      if (remembered) n.add(card.id); else n.delete(card.id)
      return n
    })
    setPartial((prev) => {
      const n = new Set(prev)
      if (level === 'partial') n.add(card.id); else n.delete(card.id)
      return n
    })
    setReviewed((prev) => new Set(prev).add(card.id))
    setTimeout(() => go(1), 300)
  }

  if (loading) return <div className="page"><div className="page-body muted">Đang tải thẻ...</div></div>

  return (
    <div className="page fc-page">
      <div className="page-head fc-head">
        <div>
          <h1>Thẻ ghi nhớ</h1>
          <p>Ôn tập theo nhịp của bạn. Dùng Space để lật thẻ, 1/2/3 để đánh giá.</p>
        </div>
      </div>

      <div className="page-body fc-body">
        <section className="fc-progress-panel">
          <strong>{progress}%</strong>
          <div className="fc-progress-track"><div style={{ width: `${progress}%` }} /></div>
          <div className="fc-mini-stats">
            <div><Check size={16} /><span>Đã nhớ</span><strong>{rememberedCount}</strong></div>
            <div><Layers size={16} /><span>Còn lại</span><strong>{remainingCount}</strong></div>
            <div><Sparkles size={16} /><span>Chuỗi học</span><strong>{streak}</strong></div>
          </div>
        </section>

        <div className="fc-filter-row">
          <div
            className="fc-timeline"
            aria-label="Timeline giai đoạn lịch sử"
            style={{ '--timeline-count': periods.length } as TimelineStyle}
          >
            {periods.map((p) => (
              <button key={p} className={'fc-timepoint' + (activeTimelinePeriod === p ? ' active' : '')} onClick={() => pickPeriod(p)}>
                <span />
                <strong>{p}</strong>
              </button>
            ))}
          </div>

          <div className="fc-status-filters">
            <button
              className={memoryFilter === 'unknown' ? 'active' : ''}
              onClick={() => pickMemoryFilter(memoryFilter === 'unknown' ? 'all' : 'unknown')}
            >
              <X size={15} /> Chưa nhớ ({unknownCount})
            </button>
            <button
              className={memoryFilter === 'partial' ? 'active' : ''}
              onClick={() => pickMemoryFilter(memoryFilter === 'partial' ? 'all' : 'partial')}
            >
              <HelpCircle size={15} /> Hơi nhớ ({partialCount})
            </button>
            <button
              className={memoryFilter === 'known' ? 'active' : ''}
              onClick={() => pickMemoryFilter(memoryFilter === 'known' ? 'all' : 'known')}
            >
              <Check size={15} /> Đã nhớ ({rememberedCount})
            </button>
          </div>
        </div>

        {completed && (
          <div className="fc-complete">
            <Trophy size={22} />
            <div>
              <strong>Hoàn thành bộ thẻ</strong>
              <span>Bạn đã đi qua toàn bộ thẻ. Có thể lọc thẻ chưa nhớ để ôn lại.</span>
            </div>
          </div>
        )}

        {card ? (
          <main className="fc-study">
            <div className={'fc-card-stage' + (showPeriodNav ? '' : ' no-period-nav')}>
              {showPeriodNav && (
                <button className="fc-side-nav left" onClick={() => goPeriod(-1)} title="Cột mốc trước"><ChevronLeft size={28} /></button>
              )}
              <button key={card.id} className={'fc-card' + (flipped ? ' flipped' : '')} onClick={() => setFlipped((f) => !f)}>
                <div className="fc-card-meta">
                  <span>Thẻ {safeIndex + 1}/{total}</span>
                  {card.period && <span>{card.period}</span>}
                  {partial.has(card.id) && <span>Hơi nhớ</span>}
                  {known.has(card.id) && <span>Đã nhớ</span>}
                </div>
                {currentPeriodCount > 1 && (
                  <div className="fc-period-count">Phần này có {currentPeriodCount} thẻ</div>
                )}
                <div className="fc-card-inner">
                  <div className="fc-face fc-front">
                    <span className="fc-tag">{card.topic}</span>
                    <p>{card.front}</p>
                    <span className="fc-hint"><RotateCcw size={13} /> Space để xem đáp án</span>
                  </div>
                  <div className="fc-face fc-back">
                    <span className="fc-tag">Đáp án</span>
                    <p>{card.back}</p>
                    <span className="fc-hint">Chọn 1 / 2 / 3 để đánh giá mức ghi nhớ</span>
                  </div>
                </div>
              </button>
              {showPeriodNav && (
                <button className="fc-side-nav right" onClick={() => goPeriod(1)} title="Cột mốc sau"><ChevronRight size={28} /></button>
              )}
            </div>

            <div className="fc-controls">
              {total > 1 && <button className="fc-nav" onClick={() => go(-1)} title="Thẻ trước"><ChevronLeft size={22} /></button>}
              <div className="fc-mark">
                <button className="fc-mark-btn again" onClick={() => mark('again')}><X size={18} /><span>Chưa nhớ</span><kbd>1</kbd></button>
                <button className="fc-mark-btn partial" onClick={() => mark('partial')}><HelpCircle size={18} /><span>Hơi nhớ</span><kbd>2</kbd></button>
                <button className="fc-mark-btn known" onClick={() => mark('known')}><Brain size={18} /><span>Đã nhớ</span><kbd>3</kbd></button>
              </div>
              {total > 1 && <button className="fc-nav" onClick={() => go(1)} title="Thẻ sau"><ChevronRight size={22} /></button>}
            </div>

            <div className="fc-shortcuts">
              <span><kbd>Space</kbd> Lật thẻ</span>
              <span><kbd>←</kbd><kbd>→</kbd> Chuyển thẻ</span>
              <span><kbd>1</kbd><kbd>2</kbd><kbd>3</kbd> Đánh giá</span>
            </div>
          </main>
        ) : (
          <main className="fc-study">
            <div className={'fc-card-stage' + (showPeriodNav ? '' : ' no-period-nav')}>
              {showPeriodNav && (
                <button className="fc-side-nav left" onClick={() => goPeriod(-1)} title="Cột mốc trước"><ChevronLeft size={28} /></button>
              )}
              <div className="fc-empty">
                <Layers size={30} />
                <strong>Không có thẻ phù hợp</strong>
                <span>Hãy đổi bộ lọc hoặc chọn cột mốc khác để tiếp tục ôn tập.</span>
              </div>
              {showPeriodNav && (
                <button className="fc-side-nav right" onClick={() => goPeriod(1)} title="Cột mốc sau"><ChevronRight size={28} /></button>
              )}
            </div>
          </main>
        )}
      </div>
    </div>
  )
}
