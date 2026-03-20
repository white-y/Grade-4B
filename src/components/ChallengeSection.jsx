import PropTypes from 'prop-types'

function ChallengeSection({
  activeTab,
  setActiveTab,
  quizIndex,
  quizQueue,
  q,
  dayData,
  ipaMap,
  fillValue,
  setFillValue,
  onSubmitFill,
  buildChoices,
  optionResult,
  onSelectOption,
  quizTip,
  onRestartQuiz,
  onSpeakWord,
  leftItems,
  rightItems,
  doneIds,
  leftSelected,
  rightSelected,
  onMatchClick,
  resetMatchingGame,
  matchTip
}) {
  return (
    <section className="rounded-[18px] border-2 border-[#d7e6ff] bg-gradient-to-b from-white to-[#f7fbff] p-3">
      <h2 className="mb-2 text-[20px] font-black text-[#3554bb]">🎯 趣味闯关（覆盖当日全部单词）</h2>
      <div className="mb-2.5 flex flex-wrap gap-2">
        <button className={`rounded-[10px] px-2.5 py-2 text-[13px] font-extrabold ${activeTab === 'quiz' ? 'bg-gradient-to-br from-[#6a8eff] to-[#65c1ff] text-white' : 'bg-[#ebf2ff] text-[#3a54ad]'}`} onClick={() => setActiveTab('quiz')}>综合闯关</button>
        <button className={`rounded-[10px] px-2.5 py-2 text-[13px] font-extrabold ${activeTab === 'match' ? 'bg-gradient-to-br from-[#6a8eff] to-[#65c1ff] text-white' : 'bg-[#ebf2ff] text-[#3a54ad]'}`} onClick={() => setActiveTab('match')}>连线挑战</button>
      </div>

      {activeTab === 'quiz' ? (
        <section>
          <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
            <div className="text-[17px] font-black text-[#344eb2]">
              {quizIndex >= quizQueue.length ? '题型：已完成' : `题型：${q?.type === 'zh2en' ? '中译英' : q?.type === 'en2zh' ? '英译中' : q?.type === 'fill' ? '填词' : q?.type === 'audio' ? '听音辨词' : '联想场景'}`}
            </div>
            <div className="rounded-full bg-[#edf3ff] px-2.5 py-1 text-[13px] font-extrabold text-[#4059b0]">{`${Math.min(quizIndex + 1, quizQueue.length)}/${quizQueue.length}`}</div>
          </div>
          {quizIndex >= quizQueue.length ? (
            <div>
              <div className="mb-2 text-[18px] font-extrabold text-[#324679]">综合闯关完成！请继续完成连线挑战以巩固记忆。</div>
              <button className="rounded-xl bg-gradient-to-br from-[#6790ff] to-[#64b2ff] px-3 py-2.5 text-sm font-extrabold text-white" onClick={onRestartQuiz}>再挑战一次</button>
            </div>
          ) : (
            <div>
              {q?.type === 'fill' ? (
                <div>
                  <div className="mb-2 text-[18px] font-extrabold text-[#324679]">
                    {`根据中文“${q.zh}”填写英文：${q.en.length <= 3 ? `${q.en[0]}__` : `${q.en.slice(0, 1)}${'_'.repeat(q.en.length - 2)}${q.en.slice(-1)}`}（${ipaMap[q.en] || '暂无音标'}）`}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      className="min-w-[220px] rounded-xl border-2 border-[#c9dafd] bg-white px-3 py-2.5 text-sm font-extrabold text-[#314481] outline-none"
                      placeholder="输入英文单词"
                      value={fillValue}
                      onChange={(e) => setFillValue(e.target.value)}
                    />
                    <button className="rounded-xl bg-gradient-to-br from-[#6790ff] to-[#64b2ff] px-3 py-2.5 text-sm font-extrabold text-white" onClick={() => onSubmitFill(q.en)}>提交</button>
                    <button className="rounded-xl bg-gradient-to-br from-[#40d8c5] to-[#66e2d1] px-3 py-2.5 text-sm font-extrabold text-[#07343a]" onClick={() => onSpeakWord(q.en)}>🔊 听发音</button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="mb-2 text-[18px] font-extrabold text-[#324679]">
                    {q?.type === 'zh2en'
                      ? `中文：${q.zh}（${ipaMap[q.en] || '暂无音标'}）`
                      : q?.type === 'en2zh'
                        ? `英文：${q.en}（${ipaMap[q.en] || '暂无音标'}）`
                        : q?.type === 'audio'
                          ? '先点发音，再选择正确英文'
                          : `在“${dayData.scene}”中，与“${q.zh}”对应的是？（${ipaMap[q.en] || '暂无音标'}）`}
                  </div>
                  {(q?.type === 'audio' || q?.type === 'en2zh' || q?.type === 'associate') ? (
                    <button className="mb-2 rounded-xl bg-gradient-to-br from-[#40d8c5] to-[#66e2d1] px-3 py-2.5 text-sm font-extrabold text-[#07343a]" onClick={() => onSpeakWord(q.en)}>🔊 点击播放发音</button>
                  ) : null}
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {buildChoices(q, q?.type === 'en2zh' ? 'zh' : 'en').map((opt) => {
                      const locked = Boolean(optionResult)
                      const isCorrect = optionResult?.correctValue === opt
                      const isWrong = optionResult?.chosen === opt && optionResult?.chosen !== optionResult?.correctValue
                      return (
                        <button
                          key={opt}
                          disabled={locked}
                          className={`rounded-xl px-2.5 py-2.5 text-left text-sm font-extrabold ${isCorrect ? 'bg-[#ccf7df] text-[#0e7a45]' : isWrong ? 'bg-[#ffd9e4] text-[#9f1641]' : 'bg-[#eaf1ff] text-[#2b4698]'}`}
                          onClick={() => onSelectOption(opt, q?.type === 'en2zh' ? q.zh : q.en, 10, q?.en || '')}
                        >
                          {opt}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
          <div className="mt-2 text-[13px] font-bold text-[#4e6091]">{quizTip}</div>
        </section>
      ) : (
        <section>
          <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
            <div className="text-[17px] font-black text-[#344eb2]">连线挑战：把中文和英文正确配对</div>
            <button className="rounded-xl bg-[#eaf1ff] px-3 py-1.5 text-sm font-extrabold text-[#2d4ba5]" onClick={resetMatchingGame}>重置连线</button>
          </div>
          <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
            <div className="rounded-xl border border-[#d8e5ff] bg-[#f2f7ff] p-2">
              {leftItems.map((item) => (
                <button
                  key={`left-${item.id}`}
                  className={`mb-1.5 w-full rounded-[10px] border px-2 py-2 text-left text-sm font-extrabold ${doneIds.includes(item.id) ? 'border-[#9de8c0] bg-[#cbf6dd] text-[#0f7a46]' : leftSelected === item.id ? 'border-[#d6e4ff] bg-[#cde0ff] text-[#19368f]' : 'border-[#d6e4ff] bg-white text-[#3953aa]'}`}
                  onClick={() => onMatchClick('left', item.id)}
                >
                  {item.zh}
                </button>
              ))}
            </div>
            <div className="rounded-xl border border-[#d8e5ff] bg-[#f2f7ff] p-2">
              {rightItems.map((item) => (
                <button
                  key={`right-${item.id}`}
                  className={`mb-1.5 w-full rounded-[10px] border px-2 py-2 text-left text-sm font-extrabold ${doneIds.includes(item.id) ? 'border-[#9de8c0] bg-[#cbf6dd] text-[#0f7a46]' : rightSelected === item.id ? 'border-[#d6e4ff] bg-[#cde0ff] text-[#19368f]' : 'border-[#d6e4ff] bg-white text-[#3953aa]'}`}
                  onClick={() => onMatchClick('right', item.id)}
                >
                  {item.en}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-2 text-[13px] font-bold text-[#4e6091]">{matchTip}</div>
        </section>
      )}
    </section>
  )
}

ChallengeSection.propTypes = {
  activeTab: PropTypes.string.isRequired,
  setActiveTab: PropTypes.func.isRequired,
  quizIndex: PropTypes.number.isRequired,
  quizQueue: PropTypes.arrayOf(PropTypes.shape({
    en: PropTypes.string.isRequired,
    zh: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired
  })).isRequired,
  q: PropTypes.shape({
    en: PropTypes.string,
    zh: PropTypes.string,
    type: PropTypes.string
  }),
  dayData: PropTypes.shape({
    scene: PropTypes.string.isRequired
  }).isRequired,
  ipaMap: PropTypes.objectOf(PropTypes.string).isRequired,
  fillValue: PropTypes.string.isRequired,
  setFillValue: PropTypes.func.isRequired,
  onSubmitFill: PropTypes.func.isRequired,
  buildChoices: PropTypes.func.isRequired,
  optionResult: PropTypes.shape({
    chosen: PropTypes.string,
    correctValue: PropTypes.string
  }),
  onSelectOption: PropTypes.func.isRequired,
  quizTip: PropTypes.string.isRequired,
  onRestartQuiz: PropTypes.func.isRequired,
  onSpeakWord: PropTypes.func.isRequired,
  leftItems: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.number.isRequired,
    zh: PropTypes.string.isRequired
  })).isRequired,
  rightItems: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.number.isRequired,
    en: PropTypes.string.isRequired
  })).isRequired,
  doneIds: PropTypes.arrayOf(PropTypes.number).isRequired,
  leftSelected: PropTypes.number,
  rightSelected: PropTypes.number,
  onMatchClick: PropTypes.func.isRequired,
  resetMatchingGame: PropTypes.func.isRequired,
  matchTip: PropTypes.string.isRequired
}

ChallengeSection.defaultProps = {
  q: null,
  optionResult: null,
  leftSelected: null,
  rightSelected: null
}

export default ChallengeSection
