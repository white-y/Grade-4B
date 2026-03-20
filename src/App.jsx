import { useEffect, useMemo, useRef, useState } from 'react'
import axios from 'axios'
import SidebarPanel from './components/SidebarPanel'
import DayOverviewSection from './components/DayOverviewSection'
import MemoryLogicSection from './components/MemoryLogicSection'
import WordCardsSection from './components/WordCardsSection'
import ChallengeSection from './components/ChallengeSection'
import FullscreenImageModal from './components/FullscreenImageModal'
import { dayAssets, ipaMap, learningData } from './data/learningData'
import { buildQuizQueue, shuffle, uniqCards } from './utils/learningUtils'

function getReviewIntervalMs(stats) {
  const base = stats.wrong > stats.correct ? 1000 * 60 * 60 * 6 : 1000 * 60 * 60 * 12
  if (stats.streak >= 4) return 1000 * 60 * 60 * 72
  if (stats.streak === 3) return 1000 * 60 * 60 * 48
  if (stats.streak === 2) return 1000 * 60 * 60 * 24
  return base
}

function withBase(path) {
  const normalized = path.replace(/^\/+/, '')
  return `${import.meta.env.BASE_URL}${normalized}`
}

function App() {
  const cacheKey = 'pronunciation-cache-v1'
  const reviewStatsKey = 'review-stats-v1'
  const cacheTtlMs = 1000 * 60 * 60 * 24 * 7
  const cacheMissTtlMs = 1000 * 60 * 60 * 12
  const [current, setCurrent] = useState(0)
  const [score, setScore] = useState(0)
  const [quizQueue, setQuizQueue] = useState([])
  const [quizIndex, setQuizIndex] = useState(0)
  const [quizTip, setQuizTip] = useState('开始闯关后，系统会自动覆盖当天所有词。')
  const [activeTab, setActiveTab] = useState('quiz')
  const [fillValue, setFillValue] = useState('')
  const [optionResult, setOptionResult] = useState(null)
  const [logicOpen, setLogicOpen] = useState(false)
  const [logicMarkdown, setLogicMarkdown] = useState('点击“展开记忆逻辑”查看当天记忆逻辑。')
  const [logicLoadedDay, setLogicLoadedDay] = useState(-1)
  const [imageOpen, setImageOpen] = useState(false)
  const [leftItems, setLeftItems] = useState([])
  const [rightItems, setRightItems] = useState([])
  const [leftSelected, setLeftSelected] = useState(null)
  const [rightSelected, setRightSelected] = useState(null)
  const [doneIds, setDoneIds] = useState([])
  const [matchTip, setMatchTip] = useState('请选择左边一个中文，再选右边一个英文。')
  const [pronunciationStatus, setPronunciationStatus] = useState('idle')
  const [speakingWord, setSpeakingWord] = useState('')
  const [speakingSource, setSpeakingSource] = useState('none')
  const [reviewStats, setReviewStats] = useState({})
  const fullImageRef = useRef(null)
  const pronunciationCacheRef = useRef(new Map())
  const reviewStatsRef = useRef({})
  const dueWordsRef = useRef([])
  const readingSessionRef = useRef(0)
  const activeAudioRef = useRef(null)

  const dayData = learningData[current]
  const cards = useMemo(() => uniqCards(dayData.cards), [dayData])
  const asset = dayAssets[dayData.day]
  const currentImagePath = asset ? withBase(`${asset.folder}/${asset.image}`) : ''
  const q = quizQueue[quizIndex]
  const currentChoiceField = q?.type === 'en2zh' ? 'zh' : 'en'
  const currentQuizChoices = useMemo(() => {
    if (!q || q.type === 'fill') return []
    const pool = cards.filter(([en]) => en !== q.en)
    const others = shuffle(pool).slice(0, 3)
    const values = currentChoiceField === 'en' ? [q.en, ...others.map((item) => item[0])] : [q.zh, ...others.map((item) => item[1])]
    return shuffle(values)
  }, [cards, currentChoiceField, q])
  const cardsSpeakingWord = speakingSource === 'cards' || speakingSource === 'all' ? speakingWord : ''
  const cardsPronunciationStatus = speakingSource === 'cards' || speakingSource === 'all' ? pronunciationStatus : 'idle'

  const progress = useMemo(() => {
    const total = quizQueue.length + (cards.length > 0 ? 1 : 0)
    const matchingDone = doneIds.length === cards.length && cards.length > 0 ? 1 : 0
    const done = Math.min(quizIndex, quizQueue.length) + matchingDone
    const percent = total ? Math.round((done / total) * 100) : 0
    return { total, done, percent }
  }, [cards.length, doneIds.length, quizIndex, quizQueue.length])

  const stars = useMemo(() => {
    if (progress.percent >= 90) return '⭐⭐⭐'
    if (progress.percent >= 60) return '⭐⭐'
    if (progress.percent >= 30) return '⭐'
    return ''
  }, [progress.percent])

  const weakWords = useMemo(() => {
    return cards
      .map(([en, zh]) => {
        const stats = reviewStats[en.toLowerCase()]
        if (!stats || stats.wrong <= stats.correct) return null
        return { en, zh, wrong: stats.wrong, correct: stats.correct }
      })
      .filter(Boolean)
      .sort((a, b) => b.wrong - a.wrong)
      .slice(0, 5)
  }, [cards, reviewStats])

  const dayAccuracy = useMemo(() => {
    const totals = cards.reduce((acc, [en]) => {
      const stats = reviewStats[en.toLowerCase()]
      if (!stats) return acc
      acc.correct += stats.correct
      acc.wrong += stats.wrong
      return acc
    }, { correct: 0, wrong: 0 })
    const attempts = totals.correct + totals.wrong
    if (!attempts) return '--'
    return `${Math.round((totals.correct / attempts) * 100)}%`
  }, [cards, reviewStats])

  const dueWords = useMemo(() => {
    const now = Date.now()
    return cards
      .map(([en, zh]) => {
        const stats = reviewStats[en.toLowerCase()]
        if (!stats) return null
        const intervalMs = getReviewIntervalMs(stats)
        const lastSeenAt = typeof stats.lastSeenAt === 'number' ? stats.lastSeenAt : 0
        const due = now - lastSeenAt >= intervalMs
        const urgent = stats.wrong > stats.correct
        if (!due && !urgent) return null
        return { en, zh, wrong: stats.wrong, correct: stats.correct, due, urgent }
      })
      .filter(Boolean)
      .sort((a, b) => {
        if (a.urgent !== b.urgent) return a.urgent ? -1 : 1
        return b.wrong - a.wrong
      })
      .slice(0, 5)
  }, [cards, reviewStats])

  useEffect(() => {
    reviewStatsRef.current = reviewStats
  }, [reviewStats])

  useEffect(() => {
    dueWordsRef.current = dueWords.map((item) => item.en)
  }, [dueWords])

  useEffect(() => {
    setScore(0)
    setQuizQueue(buildQuizQueue(cards, reviewStatsRef.current, dueWordsRef.current))
    setQuizIndex(0)
    setQuizTip('闯关已就绪，开始答题吧。')
    setActiveTab('quiz')
    setFillValue('')
    setOptionResult(null)
    setLogicOpen(false)
    setLogicLoadedDay(-1)
    setLogicMarkdown('点击“展开记忆逻辑”查看当天记忆逻辑。')
    const left = cards.map(([en, zh], idx) => ({ id: idx, en, zh }))
    const right = shuffle(cards.map(([en], idx) => ({ id: idx, en })))
    setLeftItems(left)
    setRightItems(right)
    setLeftSelected(null)
    setRightSelected(null)
    setDoneIds([])
    setMatchTip('请选择左边一个中文，再选右边一个英文。')
  }, [cards])

  useEffect(() => {
    if (!imageOpen || !fullImageRef.current) return
    if (fullImageRef.current.requestFullscreen) {
      fullImageRef.current.requestFullscreen().catch(() => {})
    }
  }, [imageOpen])

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(cacheKey)
      if (!raw) return
      const data = JSON.parse(raw)
      if (!Array.isArray(data)) return
      const now = Date.now()
      const loaded = data.filter((item) => item && typeof item.key === 'string' && typeof item.expiresAt === 'number' && item.expiresAt > now)
      pronunciationCacheRef.current = new Map(loaded.map((item) => [item.key, { url: item.url ?? null, expiresAt: item.expiresAt }]))
    } catch {
      pronunciationCacheRef.current = new Map()
    }
  }, [cacheKey])

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(reviewStatsKey)
      if (!raw) return
      const data = JSON.parse(raw)
      if (data && typeof data === 'object') {
        setReviewStats(data)
      }
    } catch {
      setReviewStats({})
    }
  }, [reviewStatsKey])

  useEffect(() => {
    try {
      window.localStorage.setItem(reviewStatsKey, JSON.stringify(reviewStats))
    } catch {
      return
    }
  }, [reviewStats, reviewStatsKey])

  useEffect(() => {
    const onChange = () => {
      if (!document.fullscreenElement) {
        setImageOpen(false)
      }
    }
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])

  function persistPronunciationCache() {
    try {
      const entries = [...pronunciationCacheRef.current.entries()].map(([key, value]) => ({
        key,
        url: value?.url ?? null,
        expiresAt: value?.expiresAt ?? 0
      }))
      window.localStorage.setItem(cacheKey, JSON.stringify(entries))
    } catch {
      return
    }
  }

  function setPronunciationCache(key, url, ttl) {
    pronunciationCacheRef.current.set(key, { url, expiresAt: Date.now() + ttl })
    persistPronunciationCache()
  }

  function stopCurrentPlayback() {
    if (activeAudioRef.current) {
      activeAudioRef.current.pause()
      activeAudioRef.current.currentTime = 0
      activeAudioRef.current = null
    }
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel()
    }
  }

  function wait(ms) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms)
    })
  }

  function recordWordResult(word, isCorrect) {
    const key = word.trim().toLowerCase()
    if (!key) return
    const now = Date.now()
    setReviewStats((prev) => {
      const currentStats = prev[key] || { correct: 0, wrong: 0, streak: 0, lastSeenAt: 0, lastWrongAt: 0 }
      const next = {
        ...currentStats,
        correct: isCorrect ? currentStats.correct + 1 : currentStats.correct,
        wrong: isCorrect ? currentStats.wrong : currentStats.wrong + 1,
        streak: isCorrect ? currentStats.streak + 1 : 0,
        lastSeenAt: now,
        lastWrongAt: isCorrect ? currentStats.lastWrongAt : now
      }
      return { ...prev, [key]: next }
    })
  }

  function playAudioSource(url, rate = 0.96) {
    return new Promise((resolve, reject) => {
      const audio = new Audio(url)
      activeAudioRef.current = audio
      audio.playbackRate = rate
      audio.onended = () => {
        if (activeAudioRef.current === audio) activeAudioRef.current = null
        resolve(true)
      }
      audio.onerror = () => reject(new Error('audio play failed'))
      audio.play().catch(reject)
    })
  }

  function waitForVoices(timeoutMs = 1200) {
    return new Promise((resolve) => {
      if (!('speechSynthesis' in window)) {
        resolve([])
        return
      }
      const existing = speechSynthesis.getVoices()
      if (existing.length) {
        resolve(existing)
        return
      }
      let done = false
      const finish = () => {
        if (done) return
        done = true
        speechSynthesis.removeEventListener('voiceschanged', onVoicesChanged)
        resolve(speechSynthesis.getVoices())
      }
      const onVoicesChanged = () => finish()
      speechSynthesis.addEventListener('voiceschanged', onVoicesChanged)
      setTimeout(finish, timeoutMs)
    })
  }

  function playSpeechSynthesis(word, rate = 0.9) {
    return new Promise((resolve, reject) => {
      if (!('speechSynthesis' in window)) {
        reject(new Error('speech synthesis unsupported'))
        return
      }
      waitForVoices()
        .then((voices) => {
          const englishVoice = voices.find((voice) => /^en[-_]/i.test(voice.lang))
          const utter = new SpeechSynthesisUtterance(word)
          if (englishVoice) {
            utter.voice = englishVoice
            utter.lang = englishVoice.lang
          } else {
            utter.lang = 'en-US'
          }
          utter.rate = rate
          utter.volume = 1
          utter.onend = () => resolve(true)
          utter.onerror = () => reject(new Error('speech synthesis failed'))
          speechSynthesis.cancel()
          speechSynthesis.speak(utter)
        })
        .catch(() => reject(new Error('speech synthesis failed')))
    })
  }

  async function getPronunciationAudio(word) {
    const key = word.trim().toLowerCase()
    if (!key) return null
    if (pronunciationCacheRef.current.has(key)) {
      const cached = pronunciationCacheRef.current.get(key)
      if (cached && cached.expiresAt > Date.now()) {
        return cached.url
      }
      pronunciationCacheRef.current.delete(key)
      persistPronunciationCache()
    }
    const backoff = [0, 280, 760]
    for (let i = 0; i < backoff.length; i += 1) {
      if (backoff[i] > 0) {
        await wait(backoff[i])
      }
      try {
        const res = await axios.get(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(key)}`, { timeout: 5000 })
        const list = Array.isArray(res.data) ? res.data : []
        const source = list
          .flatMap((entry) => (Array.isArray(entry?.phonetics) ? entry.phonetics : []))
          .map((item) => item?.audio)
          .find((audio) => typeof audio === 'string' && audio.trim())
        if (!source) {
          setPronunciationCache(key, null, cacheMissTtlMs)
          return null
        }
        const normalized = source.startsWith('//') ? `https:${source}` : source.replace(/^http:\/\//i, 'https://')
        setPronunciationCache(key, normalized, cacheTtlMs)
        return normalized
      } catch {
        if (i === backoff.length - 1) {
          setPronunciationCache(key, null, cacheMissTtlMs)
          return null
        }
      }
    }
    return null
  }

  async function speakWord(word, source = 'cards') {
    readingSessionRef.current += 1
    const sessionId = readingSessionRef.current
    stopCurrentPlayback()
    setSpeakingSource(source)
    setSpeakingWord(word)
    setPronunciationStatus('loading')
    const sourceUrl = await getPronunciationAudio(word)
    if (sessionId !== readingSessionRef.current) return
    if (sourceUrl) {
      try {
        setPronunciationStatus('playing')
        await playAudioSource(sourceUrl, 0.96)
        if (sessionId === readingSessionRef.current) {
          setPronunciationStatus('idle')
          setSpeakingWord('')
          setSpeakingSource('none')
        }
        return
      } catch {
        try {
          setPronunciationStatus('fallback')
          await playSpeechSynthesis(word, 0.9)
          if (sessionId === readingSessionRef.current) {
            setPronunciationStatus('idle')
            setSpeakingWord('')
            setSpeakingSource('none')
          }
          return
        } catch {
          setQuizTip('当前浏览器不支持语音朗读。')
        }
      }
    }
    try {
      setPronunciationStatus('fallback')
      await playSpeechSynthesis(word, 0.9)
    } catch {
      setQuizTip('当前浏览器不支持语音朗读。')
    } finally {
      if (sessionId === readingSessionRef.current) {
        setPronunciationStatus('idle')
        setSpeakingWord('')
        setSpeakingSource('none')
      }
    }
  }

  async function speakAllWords() {
    if (!cards.length) return
    readingSessionRef.current += 1
    const sessionId = readingSessionRef.current
    stopCurrentPlayback()
    setSpeakingSource('all')
    setPronunciationStatus('loading')
    for (const [word] of cards) {
      if (sessionId !== readingSessionRef.current) break
      setSpeakingWord(word)
      setPronunciationStatus('loading')
      const sourceUrl = await getPronunciationAudio(word)
      if (sessionId !== readingSessionRef.current) break
      if (sourceUrl) {
        try {
          setPronunciationStatus('playing')
          await playAudioSource(sourceUrl, 0.93)
        } catch {
          try {
            setPronunciationStatus('fallback')
            await playSpeechSynthesis(word, 0.86)
          } catch {
            setQuizTip('当前浏览器不支持语音朗读。')
            break
          }
        }
      } else {
        try {
          setPronunciationStatus('fallback')
          await playSpeechSynthesis(word, 0.86)
        } catch {
          setQuizTip('当前浏览器不支持语音朗读。')
          break
        }
      }
      await wait(160)
    }
    if (sessionId === readingSessionRef.current) {
      setPronunciationStatus('idle')
      setSpeakingWord('')
      setSpeakingSource('none')
    }
  }

  async function loadLogic() {
    if (!asset) {
      setLogicMarkdown('该天暂未提供记忆逻辑文件。')
      setLogicLoadedDay(dayData.day)
      return
    }
    if (logicLoadedDay === dayData.day) return
    const path = withBase(`${asset.folder}/记忆逻辑.md`)
    setLogicMarkdown('加载中...')
    try {
      const res = await fetch(path)
      if (!res.ok) throw new Error('load failed')
      const text = await res.text()
      setLogicMarkdown(text)
      setLogicLoadedDay(dayData.day)
    } catch {
      setLogicMarkdown(`当前环境无法直接读取本地 Markdown。\n\n文件路径：${path}`)
      setLogicLoadedDay(dayData.day)
    }
  }

  function toggleLogic() {
    const nextOpen = !logicOpen
    setLogicOpen(nextOpen)
    if (nextOpen) {
      loadLogic()
    }
  }

  function moveNextQuiz(delay = 700) {
    setTimeout(() => {
      setQuizIndex((prev) => Math.min(prev + 1, quizQueue.length))
      setFillValue('')
      setOptionResult(null)
    }, delay)
  }

  function onSelectOption(opt, correctValue, scoreDelta = 10, answerWord = '') {
    if (optionResult) return
    const correct = opt === correctValue
    if (answerWord) {
      recordWordResult(answerWord, correct)
    }
    if (correct) {
      setScore((prev) => prev + scoreDelta)
      setQuizTip('答对啦！')
    } else {
      setQuizTip(`正确答案：${correctValue}`)
    }
    setOptionResult({ chosen: opt, correctValue })
    moveNextQuiz(700)
  }

  function onSubmitFill(answer, scoreDelta = 12) {
    const val = fillValue.trim().toLowerCase()
    const correct = val === answer.toLowerCase()
    recordWordResult(answer, correct)
    if (correct) {
      setScore((prev) => prev + scoreDelta)
      setQuizTip('拼写正确！')
    } else {
      setQuizTip(`正确拼写：${answer}`)
    }
    moveNextQuiz(800)
  }

  function resetMatchingGame() {
    const left = cards.map(([en, zh], idx) => ({ id: idx, en, zh }))
    const right = shuffle(cards.map(([en], idx) => ({ id: idx, en })))
    setLeftItems(left)
    setRightItems(right)
    setLeftSelected(null)
    setRightSelected(null)
    setDoneIds([])
    setMatchTip('请选择左边一个中文，再选右边一个英文。')
  }

  function checkPair(newLeft, newRight) {
    const ok = newLeft === newRight
    const word = cards[newLeft]?.[0]
    if (word) {
      recordWordResult(word, ok)
    }
    if (ok) {
      let bonus = 0
      setDoneIds((prev) => {
        if (prev.includes(newLeft)) return prev
        const next = [...prev, newLeft]
        if (next.length === cards.length) {
          bonus = 20
          setMatchTip('连线全部完成！额外奖励 +20 分！')
        } else {
          setMatchTip('配对正确！继续。')
        }
        return next
      })
      setScore((prev) => prev + 5 + bonus)
      setLeftSelected(null)
      setRightSelected(null)
      return
    }
    setMatchTip('配对不对，再试一次。')
    setTimeout(() => {
      setLeftSelected(null)
      setRightSelected(null)
    }, 320)
  }

  function onMatchClick(side, id) {
    if (doneIds.includes(id)) return
    if (side === 'left') {
      const newLeft = id
      setLeftSelected(newLeft)
      if (rightSelected !== null) checkPair(newLeft, rightSelected)
      return
    }
    const newRight = id
    setRightSelected(newRight)
    if (leftSelected !== null) checkPair(leftSelected, newRight)
  }

  function resetCurrentDay() {
    setScore(0)
    setQuizQueue(buildQuizQueue(cards, reviewStatsRef.current, dueWordsRef.current))
    setQuizIndex(0)
    setFillValue('')
    setOptionResult(null)
    setQuizTip('已重置，当天闯关重新开始。')
    resetMatchingGame()
  }

  function closeImage() {
    setImageOpen(false)
    if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch(() => {})
    }
  }

  function restartQuiz() {
    setQuizQueue(buildQuizQueue(cards, reviewStatsRef.current, dueWordsRef.current))
    setQuizIndex(0)
    setQuizTip('已开始新一轮闯关。')
  }

  return (
    <div className="relative min-h-screen pb-5">
      <div className="float-layer" />
      <main className="mx-auto grid w-[96%] max-w-[1280px] grid-cols-1 gap-3 py-3 lg:grid-cols-[290px_1fr]">
        <SidebarPanel
          current={current}
          data={learningData}
          logicOpen={logicOpen}
          onPrevDay={() => setCurrent((prev) => (prev - 1 + learningData.length) % learningData.length)}
          onNextDay={() => setCurrent((prev) => (prev + 1) % learningData.length)}
          onChangeDay={setCurrent}
          onToggleLogic={toggleLogic}
          onSpeakAllWords={speakAllWords}
          onResetCurrentDay={resetCurrentDay}
          progress={progress}
          stars={stars}
        />

        <section className="rounded-[20px] border-2 border-[#d8e6ff] bg-white/90 p-3.5 shadow-[0_14px_28px_rgba(87,111,184,.16)]">
          <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2.5">
            <h1 className="m-0 text-[27px] font-black text-[#3553bd]">{`Day ${dayData.day} 动画卡片`}</h1>
            <div className="rounded-full bg-[#ecf3ff] px-2.5 py-1.5 text-[13px] font-extrabold text-[#3d57b6]">{`得分：${score}`}</div>
          </div>
          <div className="mb-2 rounded-xl bg-[#eef4ff] px-3 py-2 text-[13px] font-bold text-[#3f589f]">
            {pronunciationStatus === 'loading'
              ? `发音准备中：${speakingWord || '...'}`
              : pronunciationStatus === 'playing'
                ? `在线音源播放中：${speakingWord || '...'}`
                : pronunciationStatus === 'fallback'
                  ? `正在使用兜底朗读：${speakingWord || '...'}`
                  : '发音状态：就绪'}
          </div>
          <div className="mb-2 rounded-xl bg-[#f4f7ff] px-3 py-2 text-[13px] font-bold text-[#41578f]">
            <div>{`当日答题正确率：${dayAccuracy}`}</div>
            <div className="mt-1">
              {weakWords.length ? `重点复习：${weakWords.map((item) => `${item.en}(${item.wrong}错/${item.correct}对)`).join('、')}` : '重点复习：暂无，继续保持！'}
            </div>
            <div className="mt-1">
              {dueWords.length ? `到期复习：${dueWords.map((item) => item.en).join('、')}` : '到期复习：暂无'}
            </div>
          </div>

          <DayOverviewSection
            dayData={dayData}
            cards={cards}
            currentImagePath={currentImagePath}
            onOpenImage={() => setImageOpen(true)}
          />

          <MemoryLogicSection
            day={dayData.day}
            logicOpen={logicOpen}
            logicMarkdown={logicMarkdown}
            onToggleLogic={toggleLogic}
          />

          <WordCardsSection
            day={dayData.day}
            cards={cards}
            ipaMap={ipaMap}
            onSpeakWord={(word) => speakWord(word, 'cards')}
            speakingWord={cardsSpeakingWord}
            pronunciationStatus={cardsPronunciationStatus}
          />

          <ChallengeSection
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            quizIndex={quizIndex}
            quizQueue={quizQueue}
            q={q}
            dayData={dayData}
            ipaMap={ipaMap}
            fillValue={fillValue}
            setFillValue={setFillValue}
            onSubmitFill={onSubmitFill}
            choices={currentQuizChoices}
            optionResult={optionResult}
            onSelectOption={onSelectOption}
            quizTip={quizTip}
            onRestartQuiz={restartQuiz}
            onSpeakWord={(word) => speakWord(word, 'quiz')}
            leftItems={leftItems}
            rightItems={rightItems}
            doneIds={doneIds}
            leftSelected={leftSelected}
            rightSelected={rightSelected}
            onMatchClick={onMatchClick}
            resetMatchingGame={resetMatchingGame}
            matchTip={matchTip}
          />
        </section>
      </main>

      {imageOpen ? (
        <FullscreenImageModal imagePath={currentImagePath} fullImageRef={fullImageRef} onClose={closeImage} />
      ) : null}
    </div>
  )
}

export default App
