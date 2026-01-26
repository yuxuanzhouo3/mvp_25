'use client'

interface QuickActionChipsProps {
  onChipClick: (message: string) => void
}

const QUICK_ACTIONS = [
  '2026年真题卷',
  '针对函数考点',
  '难度：中等',
  '难度：困难',
  '5道题目',
  '阅读理解',
  '选择题',
  '高考真题'
]

export function QuickActionChips({ onChipClick }: QuickActionChipsProps) {
  return (
    <div className="w-full overflow-x-auto pb-2">
      <div className="flex gap-2 min-w-max px-1">
        {QUICK_ACTIONS.map((action) => (
          <button
            key={action}
            onClick={() => onChipClick(action)}
            className="px-4 py-2 rounded-full border border-blue-200 dark:border-blue-400/30 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:border-blue-300 dark:hover:border-blue-400 transition-all duration-200 cursor-pointer whitespace-nowrap"
          >
            {action}
          </button>
        ))}
      </div>
    </div>
  )
}
