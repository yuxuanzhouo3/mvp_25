export interface Requirement {
  category: '科目' | '难度' | '题型' | '考点' | '年份' | '数量' | '学段' | '考点/活动'
  value: string
}

export function parseRequirements(text: string): Requirement[] {
  const regex = /<<<JSON>>>(.*?)<<<JSON>>>/gs
  const matches = [...text.matchAll(regex)]

  return matches.flatMap(match => {
    try {
      const data = JSON.parse(match[1])
      return data.update || []
    } catch {
      return []
    }
  })
}

export function mergeRequirements(
  existing: Requirement[],
  updates: Requirement[]
): Requirement[] {
  const merged = [...existing]

  updates.forEach(update => {
    const index = merged.findIndex(r => r.category === update.category)
    if (index >= 0) {
      merged[index] = update
    } else {
      merged.push(update)
    }
  })

  return merged
}

export function hasSubject(requirements: Requirement[]): boolean {
  // Check for explicit subject category
  if (requirements.some(r => r.category === '科目')) {
    return true
  }

  // Fallback: check if any requirement value contains common subjects
  const subjectKeywords = ['英语', '数学', '语文', '物理', '化学', '生物', '历史', '地理', '政治']
  return requirements.some(r =>
    subjectKeywords.some(keyword => r.value.includes(keyword))
  )
}
