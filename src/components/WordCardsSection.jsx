import PropTypes from 'prop-types'

function WordCardsSection({ day, cards, ipaMap, onSpeakWord, speakingWord, pronunciationStatus }) {
  return (
    <section className="mb-3">
      <h2 className="mb-2 text-[20px] font-black text-[#3554bb]">📚 今日词卡（含音标与发音）</h2>
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {cards.map(([en, zh]) => (
          <article key={`${day}-${en}`} className="grid min-h-[120px] gap-1.5 rounded-2xl border-2 border-[#d7e5ff] bg-gradient-to-br from-[#f2f8ff] to-white p-2.5 shadow-[0_10px_18px_rgba(82,106,180,.12)]">
            <div className="break-words text-[22px] font-black text-[#2b4a9b]">{en}</div>
            <div className="text-[18px] font-extrabold text-[#843f55]">{zh}</div>
            <div className="text-[13px] font-bold text-[#5d6f9f]">{ipaMap[en] || '暂无音标'}</div>
            <button
              className="rounded-[10px] bg-[#eaf1ff] px-2 py-1.5 text-xs font-extrabold text-[#2d4ba5]"
              onClick={() => onSpeakWord(en)}
              disabled={speakingWord === en && pronunciationStatus === 'loading'}
            >
              {speakingWord === en
                ? pronunciationStatus === 'loading'
                  ? '⏳ 加载中'
                  : pronunciationStatus === 'playing'
                    ? '🔊 播放中'
                    : pronunciationStatus === 'fallback'
                      ? '🗣️ 兜底朗读'
                      : '🔊 发音'
                : '🔊 发音'}
            </button>
          </article>
        ))}
      </div>
    </section>
  )
}

WordCardsSection.propTypes = {
  day: PropTypes.number.isRequired,
  cards: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.string)).isRequired,
  ipaMap: PropTypes.objectOf(PropTypes.string).isRequired,
  onSpeakWord: PropTypes.func.isRequired,
  speakingWord: PropTypes.string.isRequired,
  pronunciationStatus: PropTypes.string.isRequired
}

export default WordCardsSection
