"use client"

import { useEffect, useState } from "react"
import { PracticeArena } from "@/components/exam/PracticeArena"

export default function PracticePage() {
  const [examName, setExamName] = useState("考研数学")

  useEffect(() => {
    // 从 localStorage 获取考试信息
    const savedExam = localStorage.getItem('currentExam')
    if (savedExam) {
      try {
        const exam = JSON.parse(savedExam)
        setExamName(exam.examName || "考研数学")
      } catch (e) {
        console.error('Failed to parse exam info')
      }
    }
  }, [])

  return <PracticeArena examName={examName} />
}
