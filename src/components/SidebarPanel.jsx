import PropTypes from 'prop-types'

function SidebarPanel({
  current,
  data,
  logicOpen,
  onPrevDay,
  onNextDay,
  onChangeDay,
  onToggleLogic,
  onSpeakAllWords,
  onResetCurrentDay,
  progress,
  stars
}) {
  return (
    <aside className="h-fit rounded-[20px] border-2 border-[#d8e6ff] bg-white/90 p-3.5 shadow-[0_14px_28px_rgba(87,111,184,.16)] lg:sticky lg:top-2.5">
      <div className="mb-2 flex items-center gap-2 text-[22px] font-black text-[#3654c0]">
        <span className="text-[30px]">🧸</span>
        <span>单词学习乐园</span>
      </div>
      <div className="mb-2.5 text-[13px] font-bold leading-6 text-[#4f618f]">主流程：先看图 → 再读词卡 → 最后闯关。闯关会覆盖当天全部单词。</div>
      <div className="mb-2 grid grid-cols-2 gap-2">
        <button className="rounded-xl bg-gradient-to-br from-[#6790ff] to-[#64b2ff] px-3 py-2.5 text-sm font-extrabold text-white" onClick={onPrevDay}>上一天</button>
        <button className="rounded-xl bg-gradient-to-br from-[#6790ff] to-[#64b2ff] px-3 py-2.5 text-sm font-extrabold text-white" onClick={onNextDay}>下一天</button>
      </div>
      <div className="mb-2">
        <select
          className="w-full rounded-xl bg-gradient-to-br from-[#7598ff] to-[#8cb3ff] px-3 py-2.5 text-sm font-extrabold text-white"
          value={current}
          onChange={(e) => onChangeDay(Number(e.target.value))}
        >
          {data.map((item, idx) => (
            <option key={item.day} value={idx} className="text-black">
              {`Day ${item.day}`}
            </option>
          ))}
        </select>
      </div>
      <div className="mb-2">
        <button className="w-full rounded-xl bg-gradient-to-br from-[#ff7eb4] to-[#ff9bc2] px-3 py-2.5 text-sm font-extrabold text-white" onClick={onToggleLogic}>
          {logicOpen ? '收起记忆逻辑' : '展开记忆逻辑'}
        </button>
      </div>
      <div className="mb-2 grid grid-cols-2 gap-2">
        <button className="rounded-xl bg-gradient-to-br from-[#40d8c5] to-[#66e2d1] px-3 py-2.5 text-sm font-extrabold text-[#07343a]" onClick={onSpeakAllWords}>整组朗读</button>
        <button className="rounded-xl bg-gradient-to-br from-[#ffbe50] to-[#ffd783] px-3 py-2.5 text-sm font-extrabold text-[#5a3e00]" onClick={onResetCurrentDay}>重置闯关</button>
      </div>
      <div className="rounded-2xl border border-[#d7e5ff] bg-[#f4f7ff] p-2.5">
        <div className="mb-1.5 flex items-center justify-between text-[13px] font-extrabold text-[#4d629a]">
          <span>闯关进度</span>
          <strong>{`${progress.done}/${progress.total}`}</strong>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-[#dce7ff]">
          <div className="h-full bg-gradient-to-r from-[#6b8dff] to-[#55d6ff] transition-all" style={{ width: `${progress.percent}%` }} />
        </div>
        <div className="mt-1.5 min-h-6 text-[22px] tracking-[2px]">{stars}</div>
      </div>
    </aside>
  )
}

SidebarPanel.propTypes = {
  current: PropTypes.number.isRequired,
  data: PropTypes.arrayOf(PropTypes.shape({
    day: PropTypes.number.isRequired
  })).isRequired,
  logicOpen: PropTypes.bool.isRequired,
  onPrevDay: PropTypes.func.isRequired,
  onNextDay: PropTypes.func.isRequired,
  onChangeDay: PropTypes.func.isRequired,
  onToggleLogic: PropTypes.func.isRequired,
  onSpeakAllWords: PropTypes.func.isRequired,
  onResetCurrentDay: PropTypes.func.isRequired,
  progress: PropTypes.shape({
    done: PropTypes.number.isRequired,
    total: PropTypes.number.isRequired,
    percent: PropTypes.number.isRequired
  }).isRequired,
  stars: PropTypes.string.isRequired
}

export default SidebarPanel
