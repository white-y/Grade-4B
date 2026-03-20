export function uniqCards(cards) {
  const seen = new Set()
  return cards.filter(([en]) => {
    const key = en.toLowerCase()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export function shuffle(list) {
  const arr = [...list]
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

export function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export function markdownToHtml(md) {
  const lines = md.split(/\r?\n/)
  const html = []
  let listOpen = false
  lines.forEach((line) => {
    const t = line.trim()
    if (!t) {
      if (listOpen) {
        html.push('</ul>')
        listOpen = false
      }
      return
    }
    if (t.startsWith('### ')) {
      if (listOpen) {
        html.push('</ul>')
        listOpen = false
      }
      html.push(`<h3>${escapeHtml(t.slice(4))}</h3>`)
      return
    }
    if (t.startsWith('## ')) {
      if (listOpen) {
        html.push('</ul>')
        listOpen = false
      }
      html.push(`<h2>${escapeHtml(t.slice(3))}</h2>`)
      return
    }
    if (t.startsWith('# ')) {
      if (listOpen) {
        html.push('</ul>')
        listOpen = false
      }
      html.push(`<h1>${escapeHtml(t.slice(2))}</h1>`)
      return
    }
    if (/^-\s+/.test(t) || /^\d+\.\s+/.test(t)) {
      if (!listOpen) {
        html.push('<ul>')
        listOpen = true
      }
      html.push(`<li>${escapeHtml(t.replace(/^-\s+/, '').replace(/^\d+\.\s+/, ''))}</li>`)
      return
    }
    if (listOpen) {
      html.push('</ul>')
      listOpen = false
    }
    html.push(`<p>${escapeHtml(t)}</p>`)
  })
  if (listOpen) html.push('</ul>')
  return html.join('')
}

export function buildQuizQueue(cards, reviewStats = {}, dueWords = []) {
  if (!cards.length) return []
  const types = ['zh2en', 'en2zh', 'fill', 'audio', 'associate']
  const base = cards.map(([en, zh], idx) => ({ en, zh, type: types[idx % types.length] }))
  const used = new Set(base.map((q) => q.type))
  const missing = types.filter((type) => !used.has(type))
  const extra = missing.map((type, idx) => {
    const [en, zh] = cards[idx % cards.length]
    return { en, zh, type }
  })
  const dueSet = new Set(dueWords.map((word) => word.toLowerCase()))
  const reinforcement = cards
    .map(([en, zh], idx) => {
      const key = en.toLowerCase()
      const stats = reviewStats[key] || { correct: 0, wrong: 0, streak: 0 }
      const weakScore = Math.max(0, stats.wrong * 2 - stats.correct + (stats.streak >= 2 ? -1 : 0))
      const dueScore = dueSet.has(key) ? 3 : 0
      return { en, zh, idx, weakScore: weakScore + dueScore }
    })
    .filter((item) => item.weakScore > 0)
    .sort((a, b) => b.weakScore - a.weakScore)
    .slice(0, Math.min(cards.length, 4))
    .flatMap((item, idx) => ([
      { en: item.en, zh: item.zh, type: idx % 2 === 0 ? 'fill' : 'audio' },
      { en: item.en, zh: item.zh, type: idx % 2 === 0 ? 'zh2en' : 'associate' }
    ]))
  return shuffle([...base, ...extra, ...reinforcement])
}
