"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useRunbookVideoUrl } from "@/hooks/use-runbook-video-url"
import { PlayCircle } from "lucide-react"

interface RunbookVideoModalProps {
  isOpen: boolean
  onClose: () => void
}

export function RunbookVideoModal({ isOpen, onClose }: RunbookVideoModalProps) {
  const videoUrl = useRunbookVideoUrl()

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 max-w-4xl w-[90vw] sm:w-full p-0">
        <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6">
          <DialogTitle className="flex items-center text-neutral-950 dark:text-white text-base sm:text-lg">
            <PlayCircle className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-indigo-600 dark:text-indigo-400" />
            操作演示
          </DialogTitle>
        </DialogHeader>
        <div className="px-4 sm:px-6 pb-4 sm:pb-6">
          <div className="relative w-full" style={{ aspectRatio: '16/9' }}>
            <video
              src={videoUrl}
              controls
              autoPlay
              className="absolute inset-0 w-full h-full rounded-lg object-cover"
            >
              您的浏览器不支持视频播放
            </video>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
