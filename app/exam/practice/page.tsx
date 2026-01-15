"use client"

import { useEffect, useState } from "react"
import { PracticeArena } from "@/components/exam/PracticeArena"
import { useT } from "@/lib/i18n"

export default function PracticePage() {
  const t = useT()
  const [examName, setExamName] = useState(t.wrongBook.defaultExam)

  useEffect(() => {
    // 从 localStorage 获取考试信息
    const savedExam = localStorage.getItem('currentExam')
    if (savedExam) {
      try {
        const exam = JSON.parse(savedExam)
        setExamName(exam.examName || t.wrongBook.defaultExam)
      } catch (e) {
        console.error('Failed to parse exam info')
      }
    }
  }, [t.wrongBook.defaultExam])

  return <PracticeArena examName={examName} />
}
