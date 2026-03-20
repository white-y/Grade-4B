import PropTypes from 'prop-types'

function DayOverviewSection({ dayData, cards, currentImagePath, onOpenImage }) {
  return (
    <section className="mb-3 grid grid-cols-1 gap-3 xl:grid-cols-[1.85fr_1fr]">
      <div
        className="relative flex min-h-[420px] cursor-zoom-in items-center justify-center overflow-hidden rounded-[18px] border-2 border-[#d2e2ff] bg-gradient-to-b from-[#f4f9ff] to-white"
        onClick={() => currentImagePath && onOpenImage()}
      >
        <div className="absolute right-2.5 top-2.5 rounded-full bg-white/80 px-2.5 py-1 text-xs font-extrabold text-[#2f4ba9]">点击全屏</div>
        {currentImagePath ? (
          <img src={currentImagePath} alt={`Day ${dayData.day} 词汇图片`} className="h-full w-full object-contain" />
        ) : (
          <div className="p-3 text-center text-base font-extrabold leading-7 text-[#5068b3]">🖼️<br />该天暂无配图<br />请先使用词卡和闯关学习</div>
        )}
      </div>
      <article className="flex min-h-[220px] flex-col gap-2.5 rounded-[18px] border-2 border-[#d8e6ff] bg-gradient-to-b from-white to-[#f7fbff] p-3">
        <h3 className="m-0 text-[20px] font-black text-[#334fb3]">{`🎬 场景：${dayData.scene}`}</h3>
        <p className="m-0 text-base font-bold leading-6 text-[#3f5285]">{`🧠 记忆钩子：${dayData.hook}`}</p>
        <p className="m-0 text-base font-bold leading-6 text-[#3f5285]">点击“展开记忆逻辑”可查看详细脚本，不打断主页面学习节奏。</p>
        <div className="rounded-xl bg-[#edf4ff] p-2 text-[13px] leading-6 text-[#485a8f]">{`今日单词：${cards.map(([en]) => en).join(' / ')}`}</div>
      </article>
    </section>
  )
}

DayOverviewSection.propTypes = {
  dayData: PropTypes.shape({
    day: PropTypes.number.isRequired,
    scene: PropTypes.string.isRequired,
    hook: PropTypes.string.isRequired
  }).isRequired,
  cards: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.string)).isRequired,
  currentImagePath: PropTypes.string.isRequired,
  onOpenImage: PropTypes.func.isRequired
}

export default DayOverviewSection
