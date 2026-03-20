import PropTypes from 'prop-types'
import { useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

function MemoryLogicSection({ day, logicOpen, logicMarkdown, onToggleLogic }) {
  const headings = useMemo(() => {
    const lines = logicMarkdown.split(/\r?\n/)
    let idx = 0
    return lines
      .map((line) => line.match(/^(#{1,3})\s+(.+)$/))
      .filter(Boolean)
      .map((match) => {
        idx += 1
        return { id: `logic-${idx}`, level: match[1].length, text: match[2].trim() }
      })
  }, [logicMarkdown])

  let headingCursor = 0
  function nextHeadingId() {
    const heading = headings[headingCursor]
    headingCursor += 1
    return heading?.id || `logic-${headingCursor}`
  }

  return (
    <section className="mb-3 rounded-[18px] border-2 border-[#d8e6ff] bg-gradient-to-b from-white to-[#f7fbff]">
      <div className="flex items-center justify-between border-b border-[#e1ecff] px-3 py-3 text-base font-black text-[#3756bf]">
        <span>{`Day ${day} 记忆逻辑`}</span>
        <button className="rounded-xl bg-[#eaf1ff] px-3 py-1.5 text-sm font-extrabold text-[#2d4ba5]" onClick={onToggleLogic}>
          {logicOpen ? '收起' : '展开'}
        </button>
      </div>
      {logicOpen ? (
        <div className="max-h-80 overflow-auto p-3 text-sm leading-7 text-[#354a82]">
          {headings.length ? (
            <div className="mb-3 rounded-xl border border-[#d8e6ff] bg-white/70 p-2">
              <div className="mb-1 text-xs font-extrabold text-[#3b57a6]">目录导航</div>
              <div className="flex flex-wrap gap-1.5">
                {headings.map((item) => (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    className={`rounded-lg px-2 py-1 text-xs font-bold ${item.level === 1 ? 'bg-[#dce9ff] text-[#23418f]' : item.level === 2 ? 'bg-[#eaf2ff] text-[#3455a8]' : 'bg-[#f2f6ff] text-[#4a5f98]'}`}
                  >
                    {item.text}
                  </a>
                ))}
              </div>
            </div>
          ) : null}
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              h1: ({ children }) => {
                const id = nextHeadingId()
                return <h1 id={id} className="mt-2 text-base font-black text-[#2b4794]">{children}</h1>
              },
              h2: ({ children }) => {
                const id = nextHeadingId()
                return <h2 id={id} className="mt-2 text-[15px] font-black text-[#3152a8]">{children}</h2>
              },
              h3: ({ children }) => {
                const id = nextHeadingId()
                return <h3 id={id} className="mt-2 text-sm font-extrabold text-[#3b5fae]">{children}</h3>
              }
            }}
          >
            {logicMarkdown}
          </ReactMarkdown>
        </div>
      ) : null}
    </section>
  )
}

MemoryLogicSection.propTypes = {
  day: PropTypes.number.isRequired,
  logicOpen: PropTypes.bool.isRequired,
  logicMarkdown: PropTypes.string.isRequired,
  onToggleLogic: PropTypes.func.isRequired
}

export default MemoryLogicSection
