import { isChinaRegion } from "@/lib/config/region"

export function useRunbookVideoUrl(): string {
  if (isChinaRegion()) {
    // TODO: Replace with Tencent COS URL for China region
    // Example: return "https://your-cos-bucket.cos.ap-guangzhou.myqcloud.com/runbook-demo.mp4"
    return "https://vjs.zencdn.net/v/oceans.mp4"
  } else {
    // TODO: Replace with international CDN URL
    // Example: return "https://your-cdn.example.com/runbook-demo.mp4"
    return "https://vjs.zencdn.net/v/oceans.mp4"
  }
}
