"use client"

import * as React from "react"
import { pb } from "@/lib/pb"
import type {
  DropResult,
  DroppableProvided,
  DroppableStateSnapshot,
  DraggableProvided,
  DraggableStateSnapshot,
} from "@hello-pangea/dnd"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import {
  ChevronLeft,
  Clock3,
  DollarSign,
  Sparkles,
  PenSquare,
  Palette,
  Image as ImageIcon,
  PanelsTopLeft,
  Video,
  ShieldCheck,
  LayoutTemplate,
  Copy,
  Check,
  Play,
  RotateCcw,
  ExternalLink,
  Download,
  CheckCircle,
} from "lucide-react"

type DndModule = typeof import("@hello-pangea/dnd")

type ColumnId = "backlog" | "in_progress" | "done"
type AnyStatus = ColumnId | "failed" | string
type TaskPriority = "low" | "normal" | "high" | "urgent"

type GoalOption = {
  id: string
  title: string
}

type TaskRecord = {
  id: string
  title: string
  status?: AnyStatus
  assigned_agent?: string
  type?: string
  priority?: TaskPriority | string
  goal_id?: string | null
  campaign_id?: string | null
  input_data?: any
  output_data?: any
  created?: string
  updated?: string
}

type BannerItem = {
  name?: string
  size?: string
  headline?: string
  subheadline?: string
  cta?: string
  disclaimer?: string
  logo_url?: string
  background_image_ref?: string
  background_image_url?: string
  layout?: string
  visual_focus?: string
  image_prompt?: string
  design_notes?: string
  asset_usage?: string
}

type ComposedBannerItem = {
  name?: string
  size?: string
  headline?: string
  subheadline?: string
  cta?: string
  disclaimer?: string
  background_image_ref?: string
  file_name?: string
  file_path?: string
  relative_path?: string
  public_url?: string
  composition_status?: string
}

// ── NEW: Generated image item from image_generator output ─────────────────────
type GeneratedImageItem = {
  banner_name?: string
  requested_size?: string
  image_size?: string
  aspect_ratio?: string
  output_width?: number
  output_height?: number
  image_public_url?: string
  image_file_path?: string
  generation_status?: string
  generator?: string
  generator_model?: string
  prompt?: string
}

const COLUMN_ORDER: ColumnId[] = ["backlog", "in_progress", "done"]

const COLUMN_LABEL: Record<ColumnId, string> = {
  backlog: "BACKLOG",
  in_progress: "IN PROGRESS",
  done: "DONE",
}

const COLUMN_DOT: Record<ColumnId, string> = {
  backlog: "bg-white/50",
  in_progress: "bg-yellow-400",
  done: "bg-emerald-400",
}

const TASK_TYPE_OPTIONS = [
  { value: "campaign_plan", label: "campaign_plan" },
  { value: "article", label: "article" },
  { value: "ad_copy", label: "ad_copy" },
  { value: "visual_prompts", label: "visual_prompts" },
  { value: "background_images", label: "background_images" },
  { value: "banner_set", label: "banner_set" },
  { value: "banner_compose", label: "banner_compose" },
  { value: "landing_page", label: "landing_page" },
  { value: "video", label: "video" },
  { value: "qa_review", label: "qa_review" },
] as const

const PRIORITY_OPTIONS: TaskPriority[] = ["low", "normal", "high", "urgent"]

function normalizeStatus(raw?: AnyStatus | null): ColumnId {
  const s = String(raw ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/-/g, "_")

  if (s === "backlog") return "backlog"
  if (s === "in_progress" || s === "inprogress") return "in_progress"
  if (s === "done") return "done"

  return "backlog"
}

function normalizeRawStatus(raw?: AnyStatus | null): string {
  return String(raw ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/-/g, "_")
}

function normalizeText(value: unknown, fallback = ""): string {
  if (typeof value === "string") {
    const trimmed = value.trim()
    return trimmed || fallback
  }

  if (typeof value === "number") {
    return String(value)
  }

  return fallback
}

function esc(v: string) {
  return v.replace(/\\/g, "\\\\").replace(/"/g, '\\"')
}

function buildFilter(goalId: string | null, agent: string | null) {
  const parts: string[] = []
  if (goalId) parts.push(`goal_id = "${esc(goalId)}"`)
  if (agent) parts.push(`assigned_agent = "${esc(agent)}"`)
  return parts.length ? parts.join(" && ") : ""
}

function groupByStatus(tasks: TaskRecord[]) {
  const next: Record<ColumnId, TaskRecord[]> = {
    backlog: [],
    in_progress: [],
    done: [],
  }

  for (const t of tasks) {
    const st = normalizeStatus(t.status)
    next[st].push({ ...t, status: st })
  }

  return next
}

function safeJsonStringify(value: any) {
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
}

function splitLines(value: string) {
  return value
    .split("\n")
    .map((v) => v.trim())
    .filter(Boolean)
}

function agentIcon(agent?: string) {
  switch (agent) {
    case "planner":
      return <Sparkles className="h-3.5 w-3.5" />
    case "copywriter":
      return <PenSquare className="h-3.5 w-3.5" />
    case "visual_director":
      return <Palette className="h-3.5 w-3.5" />
    case "image_generator":
      return <ImageIcon className="h-3.5 w-3.5" />
    case "banner_renderer":
      return <PanelsTopLeft className="h-3.5 w-3.5" />
    case "banner_composer":
      return <PanelsTopLeft className="h-3.5 w-3.5" />
    case "video_producer":
      return <Video className="h-3.5 w-3.5" />
    case "qa":
      return <ShieldCheck className="h-3.5 w-3.5" />
    case "landing_page_builder":
      return <LayoutTemplate className="h-3.5 w-3.5" />
    default:
      return <Sparkles className="h-3.5 w-3.5" />
  }
}

function priorityClass(priority?: string) {
  if (priority === "urgent") return "bg-red-500/15 text-red-300 border-red-500/20"
  if (priority === "high") return "bg-orange-500/15 text-orange-300 border-orange-500/20"
  if (priority === "low") return "bg-white/5 text-white/55 border-white/10"
  return "bg-white/10 text-white/70 border-white/10"
}

function isArticleOutput(output: any) {
  return Boolean(output?.article_text || output?.article_html)
}

function isAdsOutput(output: any) {
  return Array.isArray(output?.headlines) || Array.isArray(output?.primary_texts)
}

function isBannerOutput(output: any) {
  return (
    (Array.isArray(output?.banners) && output.banners.length > 0) ||
    (Array.isArray(output?.final_banners) && output.final_banners.length > 0)
  )
}

function isComposedBannerOutput(output: any) {
  return Array.isArray(output?.composed_banners) && output.composed_banners.length > 0
}

// ── NEW: detect generated images output ───────────────────────────────────────
function isGeneratedImagesOutput(output: any) {
  return Array.isArray(output?.generated_images) && output.generated_images.length > 0
}

function getGeneratedImages(output: any): GeneratedImageItem[] {
  if (Array.isArray(output?.generated_images)) return output.generated_images
  return []
}

function getBannerItems(output: any): BannerItem[] {
  if (Array.isArray(output?.final_banners)) return output.final_banners
  if (Array.isArray(output?.banners)) return output.banners
  return []
}

function getComposedBannerItems(output: any): ComposedBannerItem[] {
  if (Array.isArray(output?.composed_banners)) return output.composed_banners
  return []
}

function getArticleParagraphs(output: any): string[] {
  const raw = String(output?.article_text ?? "").trim()
  if (!raw) return []

  const splitByDoubleBreak = raw
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)

  if (splitByDoubleBreak.length > 1) return splitByDoubleBreak

  const sentences = raw
    .split(/(?<=[.!?])\s+|(?<=\.)\s+|(?<=\u05F3)\s+/)
    .map((s) => s.trim())
    .filter(Boolean)

  if (sentences.length <= 3) return [raw]

  const chunkSize = Math.max(2, Math.ceil(sentences.length / 5))
  const chunks: string[] = []

  for (let i = 0; i < sentences.length; i += chunkSize) {
    chunks.push(sentences.slice(i, i + chunkSize).join(" "))
  }

  return chunks
}

function getRevisionDeliverable(type?: string) {
  if (type === "article") return "article"
  if (type === "ad_copy") return "ads"
  return type ?? "general"
}

function getAgentForTaskType(taskType: string, fallbackAgent: string | null) {
  if (fallbackAgent) return fallbackAgent

  switch (taskType) {
    case "article":
    case "ad_copy":
      return "copywriter"
    case "visual_prompts":
      return "visual_director"
    case "background_images":
      return "image_generator"
    case "banner_set":
      return "banner_renderer"
    case "banner_compose":
      return "banner_composer"
    case "landing_page":
      return "landing_page_builder"
    case "video":
      return "video_producer"
    case "qa_review":
      return "qa"
    default:
      return "planner"
  }
}

function getDeliverableForTaskType(taskType: string) {
  if (taskType === "article") return "article"
  if (taskType === "ad_copy") return "ads"
  return taskType
}

function getCopyPayload(output: any) {
  if (!output) return null

  if (output?.article_text) {
    return {
      label: "Copy Article",
      text: String(output.article_text).trim(),
    }
  }

  if (Array.isArray(output?.headlines) || Array.isArray(output?.primary_texts)) {
    const headlines = Array.isArray(output?.headlines) ? output.headlines : []
    const primaryTexts = Array.isArray(output?.primary_texts) ? output.primary_texts : []

    const chunks: string[] = []

    if (headlines.length) {
      chunks.push("HEADLINES")
      chunks.push(headlines.join("\n"))
    }

    if (primaryTexts.length) {
      chunks.push("PRIMARY TEXTS")
      chunks.push(primaryTexts.join("\n\n"))
    }

    return {
      label: "Copy Ads",
      text: chunks.join("\n\n").trim(),
    }
  }

  if (Array.isArray(output?.composed_banners) && output.composed_banners.length > 0) {
    return {
      label: "Copy Composed Banners JSON",
      text: safeJsonStringify(output.composed_banners),
    }
  }

  if (Array.isArray(output?.final_banners) && output.final_banners.length > 0) {
    return {
      label: "Copy Banner JSON",
      text: safeJsonStringify(output.final_banners),
    }
  }

  if (Array.isArray(output?.banners) && output.banners.length > 0) {
    return {
      label: "Copy Banner JSON",
      text: safeJsonStringify(output.banners),
    }
  }

  if (output?.script) {
    return {
      label: "Copy Script",
      text: String(output.script).trim(),
    }
  }

  if (output?.hebrew_copy) {
    return {
      label: "Copy Text",
      text: String(output.hebrew_copy).trim(),
    }
  }

  if (output?.summary) {
    return {
      label: "Copy Summary",
      text: String(output.summary).trim(),
    }
  }

  if (output?.landing_page?.html) {
    return {
      label: "Copy HTML",
      text: String(output.landing_page.html).trim(),
    }
  }

  if (output && Object.keys(output).length > 0) {
    return {
      label: "Copy Output",
      text: safeJsonStringify(output),
    }
  }

  return null
}

// ── NEW: Download image via fetch → blob → anchor click ───────────────────────
async function downloadImageFromUrl(url: string, filename: string) {
  try {
    const response = await fetch(url)
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const blob = await response.blob()
    const objectUrl = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = objectUrl
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(objectUrl)
  } catch (err) {
    console.error("Download failed:", err)
    // Fallback: open in new tab
    window.open(url, "_blank")
  }
}


// ── Cost estimates ────────────────────────────────────────────────────────────
const COST_MAP: Record<string, { label: string; cost: number; color: string }> = {
  campaign_plan:     { label: "Campaign Plan",   cost: 0.02, color: "text-orange-400" },
  ad_copy:           { label: "Ad Copy",          cost: 0.03, color: "text-emerald-400" },
  article:           { label: "Article",          cost: 0.04, color: "text-emerald-400" },
  visual_prompts:    { label: "Visual Direction", cost: 0.02, color: "text-pink-400" },
  background_images: { label: "AI Images",        cost: 0.15, color: "text-cyan-400" },
  banner_set:        { label: "Banners",          cost: 0.20, color: "text-amber-400" },
  banner_composer:   { label: "Banner Composer",  cost: 0.10, color: "text-amber-300" },
  landing_page:      { label: "Landing Page",     cost: 0.05, color: "text-blue-400" },
  video:             { label: "Video",            cost: 0.45, color: "text-purple-400" },
  qa_review:         { label: "QA Review",        cost: 0.02, color: "text-green-400" },
}
const FULL_CAMPAIGN_COST = Object.values(COST_MAP).reduce((s, v) => s + v.cost, 0)

function fmt$(n: number) { return `$${n.toFixed(2)}` }
function fmtMonth(d: string) { return new Date(d).toLocaleDateString("en-US", { month: "short", year: "numeric" }) }

function UsageView() {
  const [tasks, setTasks] = React.useState<TaskRecord[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    pb.collection("tasks").getFullList<TaskRecord>({ sort: "-created", fields: "id,type,assigned_agent,status,created,goal_id" })
      .then(setTasks).catch(console.error).finally(() => setLoading(false))
  }, [])

  const done = tasks.filter(t => t.status === "done")
  const countByType: Record<string, number> = {}
  for (const t of done) { const k = t.type || t.assigned_agent || "unknown"; countByType[k] = (countByType[k] || 0) + 1 }
  const totalCost = Object.entries(countByType).reduce((s, [k, n]) => s + (COST_MAP[k]?.cost || 0.02) * n, 0)

  const costByMonth: Record<string, number> = {}
  for (const t of done) {
    if (!t.created) continue
    const m = fmtMonth(t.created)
    const k = t.type || t.assigned_agent || "unknown"
    costByMonth[m] = (costByMonth[m] || 0) + (COST_MAP[k]?.cost || 0.02)
  }
  const months = Object.entries(costByMonth).sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
  const maxM = Math.max(...months.map(m => m[1]), 1)

  const thisMonth = fmtMonth(new Date().toISOString())
  const thisMonthCost = done.filter(t => t.created && fmtMonth(t.created) === thisMonth)
    .reduce((s, t) => s + (COST_MAP[t.type || t.assigned_agent || "unknown"]?.cost || 0.02), 0)
  const thisMonthCampaigns = done.filter(t => t.type === "campaign_plan" && t.created && fmtMonth(t.created) === thisMonth).length

  if (loading) return <div className="flex items-center justify-center py-20 text-white/40 text-sm">Loading usage data...</div>

  return (
    <div className="space-y-5 py-2">
      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {[
          { label: "Total Estimated Spend", value: fmt$(totalCost), sub: "all time", color: "border-emerald-500/20 bg-emerald-500/5" },
          { label: "This Month", value: fmt$(thisMonthCost), sub: `${done.filter(t => t.created && fmtMonth(t.created) === thisMonth).length} tasks`, color: "border-blue-500/20 bg-blue-500/5" },
          { label: "Campaigns This Month", value: String(thisMonthCampaigns), sub: `avg ${thisMonthCampaigns ? fmt$(thisMonthCost / thisMonthCampaigns) : "$0.00"}/campaign`, color: "border-purple-500/20 bg-purple-500/5" },
          { label: "Full Campaign Cost", value: fmt$(FULL_CAMPAIGN_COST), sub: "estimated per run", color: "border-amber-500/20 bg-amber-500/5" },
        ].map(s => (
          <div key={s.label} className={`rounded-2xl border p-4 ${s.color}`}>
            <div className="text-xs text-white/50 mb-1">{s.label}</div>
            <div className="text-2xl font-bold text-white">{s.value}</div>
            <div className="text-xs text-white/40 mt-0.5">{s.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        {/* By task type */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
          <div className="mb-4 text-sm font-medium text-white/70 flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-emerald-400" /> Cost by Task Type
          </div>
          <div className="space-y-3">
            {Object.entries(COST_MAP).map(([type, info]) => {
              const count = countByType[type] || 0
              const cost = info.cost * count
              return (
                <div key={type} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className={`${info.color}`}>{info.label}</span>
                    <span className="text-white font-medium">{fmt$(cost)} <span className="text-white/30 text-xs font-normal">{count}×</span></span>
                  </div>
                  <div className="h-1 w-full rounded-full bg-white/10">
                    <div className="h-1 rounded-full bg-white/25 transition-all" style={{ width: `${Math.min(100, totalCost > 0 ? (cost / totalCost) * 100 : 0)}%` }} />
                  </div>
                </div>
              )
            })}
            <div className="border-t border-white/10 pt-3 flex justify-between">
              <span className="text-sm text-white/50">Total</span>
              <span className="text-lg font-bold text-emerald-400">{fmt$(totalCost)}</span>
            </div>
          </div>
        </div>

        <div className="space-y-5">
          {/* Monthly chart */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
            <div className="mb-4 text-sm font-medium text-white/70">Monthly Spend</div>
            {months.length === 0 ? <div className="text-sm text-white/30">No data yet</div> : (
              <div className="flex items-end gap-2" style={{ height: "80px" }}>
                {months.map(([month, cost]) => (
                  <div key={month} className="flex flex-1 flex-col items-center gap-1">
                    <div className="text-[10px] text-white/50">{fmt$(cost)}</div>
                    <div className="w-full rounded-t-md bg-emerald-500/40 hover:bg-emerald-500/60 transition-all" style={{ height: `${Math.max(4, (cost / maxM) * 55)}px` }} />
                    <div className="text-[10px] text-white/30">{month}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pricing reference */}
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4">
            <div className="mb-2 text-xs font-medium text-amber-400">💡 Pricing Reference</div>
            <div className="space-y-1.5 text-xs text-white/60">
              <div className="flex justify-between"><span>Full campaign (all tasks)</span><span className="text-white/80">{fmt$(FULL_CAMPAIGN_COST)}</span></div>
              <div className="flex justify-between"><span>Images are the biggest cost</span><span className="text-white/80">${COST_MAP.background_images.cost}/run</span></div>
              <div className="flex justify-between"><span>Video (Creatomate/HeyGen)</span><span className="text-white/80">${COST_MAP.video.cost}/run</span></div>
              <div className="mt-2 pt-2 border-t border-white/10 text-white/35">Estimates based on typical API usage. Actual costs vary.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
// ─────────────────────────────────────────────────────────────────────────────

export default function KanbanBoard(
  props: { goalId?: string | null; agent?: string | null; goals?: GoalOption[] } = {}
) {
  const goalId = props.goalId ?? null
  const agent = props.agent ?? null
  const goals = props.goals ?? []
  const runnerUrl = process.env.NEXT_PUBLIC_AGENT_RUNNER_URL ?? ""

  const [dnd, setDnd] = React.useState<DndModule | null>(null)
  const [activeView, setActiveView] = React.useState<"kanban" | "campaigns" | "usage">("kanban")

  const [cols, setCols] = React.useState<Record<ColumnId, TaskRecord[]>>({
    backlog: [],
    in_progress: [],
    done: [],
  })

  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const [taskOpen, setTaskOpen] = React.useState(false)
  const [taskTitle, setTaskTitle] = React.useState("")
  const [taskContext, setTaskContext] = React.useState("")
  const [taskLogoUrls, setTaskLogoUrls] = React.useState("")
  const [taskImageUrls, setTaskImageUrls] = React.useState("")
  const [taskInspirationUrls, setTaskInspirationUrls] = React.useState("")
  const [taskType, setTaskType] = React.useState("campaign_plan")
  const [taskPriority, setTaskPriority] = React.useState<TaskPriority>("normal")
  const [taskGoalId, setTaskGoalId] = React.useState<string>(goalId ?? "")
  const [creating, setCreating] = React.useState(false)

  // ── Landing Page specific state ───────────────────────────────────────────────
  const [lpBrandName, setLpBrandName] = React.useState("")
  const [lpLogoUrl, setLpLogoUrl] = React.useState("")
  const [lpPageSlug, setLpPageSlug] = React.useState("")
  const [lpColorScheme, setLpColorScheme] = React.useState("dark_luxury")
  const [lpTemplate, setLpTemplate] = React.useState("auto")
  const [lpLanguage, setLpLanguage] = React.useState("he")
  const [lpWhatsappEnabled, setLpWhatsappEnabled] = React.useState(false)
  const [lpWhatsappNumber, setLpWhatsappNumber] = React.useState("")
  const [lpWhatsappMessage, setLpWhatsappMessage] = React.useState("")
  const [lpPhoneInNav, setLpPhoneInNav] = React.useState("")
  const [lpMetaPixelId, setLpMetaPixelId] = React.useState("")
  const [lpZapierWebhook, setLpZapierWebhook] = React.useState("")
  const [lpRedirectUrl, setLpRedirectUrl] = React.useState("")
  const [lpSubmitText, setLpSubmitText] = React.useState("")
  const [lpShowTestimonials, setLpShowTestimonials] = React.useState(true)
  const [lpShowFaq, setLpShowFaq] = React.useState(true)
  const [lpShowStats, setLpShowStats] = React.useState(true)
  // Form fields: default = name + phone + email
  const [lpFormFields, setLpFormFields] = React.useState<Array<{label: string; type: string; name: string; required: boolean}>>([
    { label: "שם מלא", type: "text", name: "name", required: true },
    { label: "טלפון", type: "tel", name: "phone", required: true },
    { label: "אימייל", type: "email", name: "email", required: false },
  ])

  const [detailsOpen, setDetailsOpen] = React.useState(false)
  const [selected, setSelected] = React.useState<TaskRecord | null>(null)
  const [templateOverride, setTemplateOverride] = React.useState<string>("auto")
  const [visualStyle, setVisualStyle] = React.useState<string>("auto")
  const [videoEngine, setVideoEngine] = React.useState<string>("creatomate")
  const [, setRunning] = React.useState(false)
  const [runError, setRunError] = React.useState<string | null>(null)
  const [copiedText, setCopiedText] = React.useState(false)
  const [activeTaskId, setActiveTaskId] = React.useState<string | null>(null)
  const [pipelineRunning, setPipelineRunning] = React.useState<string | null>(null) // planner task id
  const [pipelineProgress, setPipelineProgress] = React.useState<{done: number, total: number, current: string} | null>(null)
  // ── NEW: per-image download loading state ────────────────────────────────────
  const [downloadingUrl, setDownloadingUrl] = React.useState<string | null>(null)

  const [revisionNotes, setRevisionNotes] = React.useState("")
  const [requestingRevision, setRequestingRevision] = React.useState(false)

  // ── Landing page config editor ───────────────────────────────────────────────
  const [lpEditOpen, setLpEditOpen] = React.useState(false)
  const [lpEditWebhook, setLpEditWebhook] = React.useState("")
  const [lpEditPhone, setLpEditPhone] = React.useState("")
  const [lpEditWhatsapp, setLpEditWhatsapp] = React.useState("")
  const [lpEditWhatsappMsg, setLpEditWhatsappMsg] = React.useState("")
  const [lpEditPixel, setLpEditPixel] = React.useState("")
  const [lpEditRedirect, setLpEditRedirect] = React.useState("")
  const [lpEditSubmitText, setLpEditSubmitText] = React.useState("")
  const [lpEditSlug, setLpEditSlug] = React.useState("")
  const [lpEditSaving, setLpEditSaving] = React.useState(false)

  // ── Revision panel toggle ────────────────────────────────────────────────────
  const [revisionOpen, setRevisionOpen] = React.useState(false)

  // ── Confirm dialogs ──────────────────────────────────────────────────────────
  const [confirmDeleteTask, setConfirmDeleteTask] = React.useState(false)
  const [confirmDeleteCampaign, setConfirmDeleteCampaign] = React.useState<string | null>(null) // planner task id
  const [confirmResetCampaign, setConfirmResetCampaign] = React.useState<string | null>(null)   // planner task id
  const [campaignActionLoading, setCampaignActionLoading] = React.useState(false)

  const movedRef = React.useRef<{ id: string; to: ColumnId } | null>(null)

  React.useEffect(() => {
    let mounted = true

    import("@hello-pangea/dnd")
      .then((mod) => {
        if (mounted) setDnd(mod)
      })
      .catch((err) => {
        console.error("Failed to load @hello-pangea/dnd:", err)
        if (mounted) {
          setError("החבילה @hello-pangea/dnd לא מותקנת עדיין. צריך להריץ npm install.")
        }
      })

    return () => {
      mounted = false
    }
  }, [])

  React.useEffect(() => {
    setTaskGoalId(goalId ?? "")
  }, [goalId])

  React.useEffect(() => {
    if (!copiedText) return
    const timer = setTimeout(() => setCopiedText(false), 2000)
    return () => clearTimeout(timer)
  }, [copiedText])

  const loadTasks = React.useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const filter = buildFilter(goalId, agent)
      const res = await pb.collection("tasks").getList<TaskRecord>(1, 200, {
        sort: "-created",
        ...(filter ? { filter } : {}),
      })

      const normalized = (res.items ?? []).map((t) => ({
        ...t,
        status: normalizeStatus(t.status),
      }))

      setCols(groupByStatus(normalized))

      if (selected?.id) {
        const fresh = res.items.find((item) => item.id === selected.id)
        if (fresh) {
          setSelected(fresh)
        }
      }
    } catch (e: any) {
      console.error(e)
      if (e?.name !== "AbortError") {
        setError("נכשל לטעון Tasks. בדוק הרשאות/URL ל-PocketBase.")
      }
    } finally {
      setLoading(false)
    }
  }, [goalId, agent, selected?.id])

  React.useEffect(() => {
    loadTasks()
  }, [loadTasks])

  async function createTask() {
    const title = taskTitle.trim()
    if (!title) {
      setError("חייבים כותרת למשימה.")
      return
    }

    setCreating(true)
    setError(null)

    try {
      await pb.collection("tasks").create<TaskRecord>({
        title,
        status: "backlog",
        type: taskType,
        priority: taskPriority,
        assigned_agent: getAgentForTaskType(taskType, agent),
        goal_id: taskGoalId || null,
        input_data: {
          brief_title: title,
          additional_context: taskContext.trim(),
          language: taskType === "landing_page" ? lpLanguage : "he",
          word_count: 450,
          tone: taskType === "article" ? "marketing_editorial" : undefined,
          deliverable: getDeliverableForTaskType(taskType),
          visual_style: visualStyle !== "auto" ? visualStyle : undefined,
          video_engine: videoEngine,
          assets: {
            logos: splitLines(taskLogoUrls),
            images: splitLines(taskImageUrls),
            inspiration: splitLines(taskInspirationUrls),
          },
          // Landing page specific fields
          ...(taskType === "landing_page" ? {
            brand_name: lpBrandName.trim() || undefined,
            logo_url: lpLogoUrl.trim() || undefined,
            page_slug: lpPageSlug.trim() || undefined,
            color_scheme: lpColorScheme,
            template: lpTemplate !== "auto" ? lpTemplate : undefined,
            whatsapp_enabled: lpWhatsappEnabled,
            whatsapp_number: lpWhatsappNumber.trim() || undefined,
            whatsapp_message: lpWhatsappMessage.trim() || undefined,
            phone_in_nav: lpPhoneInNav.trim() || undefined,
            meta_pixel_id: lpMetaPixelId.trim() || undefined,
            zapier_webhook_url: lpZapierWebhook.trim() || undefined,
            redirect_url: lpRedirectUrl.trim() || undefined,
            submit_button_text: lpSubmitText.trim() || undefined,
            show_testimonials: lpShowTestimonials,
            show_faq: lpShowFaq,
            show_stats: lpShowStats,
            form_fields: lpFormFields,
          } : {}),
        },
      })

      setTaskOpen(false)
      setTaskTitle("")
      setTaskContext("")
      setTaskLogoUrls("")
      setTaskImageUrls("")
      setTaskInspirationUrls("")
      setTaskType("campaign_plan")
      setTaskPriority("normal")
      setVisualStyle("auto")
      setVideoEngine("creatomate")
      setLpBrandName(""); setLpLogoUrl(""); setLpPageSlug(""); setLpColorScheme("dark_luxury"); setLpTemplate("auto")
      setLpLanguage("he"); setLpWhatsappEnabled(false); setLpWhatsappNumber(""); setLpWhatsappMessage("")
      setLpPhoneInNav(""); setLpMetaPixelId(""); setLpZapierWebhook(""); setLpRedirectUrl("")
      setLpSubmitText(""); setLpShowTestimonials(true); setLpShowFaq(true); setLpShowStats(true)
      setLpFormFields([
        { label: "שם מלא", type: "text", name: "name", required: true },
        { label: "טלפון", type: "tel", name: "phone", required: true },
        { label: "אימייל", type: "email", name: "email", required: false },
      ])
      await loadTasks()
    } catch (e: any) {
      console.error("[TASKS] create failed:", e)
      setError(
        e?.status === 403
          ? "אין הרשאה ליצור Tasks (403). בדוק Create rule ב-tasks."
          : "נכשל ליצור Task."
      )
    } finally {
      setCreating(false)
    }
  }

  async function onDragEnd(result: DropResult) {
    const { source, destination } = result
    if (!destination) return

    const from = source.droppableId as ColumnId
    const to = destination.droppableId as ColumnId
    if (from === to && source.index === destination.index) return

    movedRef.current = null

    setCols((prev) => {
      const next = {
        backlog: Array.from(prev.backlog),
        in_progress: Array.from(prev.in_progress),
        done: Array.from(prev.done),
      }

      const fromItems = Array.from(next[from])
      const picked = fromItems[source.index]
      if (!picked) return prev

      fromItems.splice(source.index, 1)

      const updated: TaskRecord = { ...picked, status: to }
      const toItems = Array.from(next[to])
      toItems.splice(destination.index, 0, updated)

      next[from] = fromItems
      next[to] = toItems

      movedRef.current = { id: picked.id, to }
      return next
    })

    try {
      const moved = movedRef.current as { id: string; to: ColumnId } | null
      if (!moved) return
      await pb.collection("tasks").update(moved.id, { status: moved.to })
    } catch (e) {
      console.error(e)
      setError("נכשל לעדכן סטטוס. בדוק Update rule ב-tasks.")
      await loadTasks()
    }
  }

  function openDetails(task: TaskRecord) {
    setSelected(task)
    setRunError(null)
    setRevisionNotes("")
    setCopiedText(false)
    // Pre-fill template from existing input_data if set
    setTemplateOverride(task.input_data?.template || "auto")
    // Pre-fill landing page config editor
    setLpEditWebhook(task.input_data?.zapier_webhook_url || "")
    setLpEditPhone(task.input_data?.phone_in_nav || "")
    setLpEditWhatsapp(task.input_data?.whatsapp_number || "")
    setLpEditWhatsappMsg(task.input_data?.whatsapp_message || "")
    setLpEditPixel(task.input_data?.meta_pixel_id || "")
    setLpEditRedirect(task.input_data?.redirect_url || "")
    setLpEditSubmitText(task.input_data?.submit_button_text || "")
    setLpEditSlug(task.input_data?.page_slug || "")
    setLpEditOpen(false)
    setRevisionOpen(false)
    setDetailsOpen(true)
  }

  async function copyOutput(task?: TaskRecord | null) {
    const payload = getCopyPayload(task?.output_data)
    if (!payload?.text) return

    try {
      await navigator.clipboard.writeText(payload.text)
      setCopiedText(true)
    } catch (e) {
      console.error("copy failed", e)
      setRunError("נכשל להעתיק את התוכן.")
    }
  }

  async function runTask(task: TaskRecord) {
    if (activeTaskId) return

    if (!runnerUrl) {
      setRunError("חסר NEXT_PUBLIC_AGENT_RUNNER_URL בקובץ .env.local")
      return
    }

    setActiveTaskId(task.id)
    setRunning(selected?.id === task.id)
    setRunError(null)

    try {
      // Fire and don't await — long tasks (image_generator, banner_composer) timeout browser fetch
      const controller = new AbortController()
      const fetchPromise = fetch(`${runnerUrl}/run-task`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId: task.id }),
        signal: controller.signal,
      }).catch(() => null)

      // Poll PocketBase until task is done or failed (max 10 min)
      const POLL_INTERVAL = 3000
      const MAX_WAIT = 10 * 60 * 1000
      const started = Date.now()
      let finalStatus = "in_progress"

      while (Date.now() - started < MAX_WAIT) {
        await new Promise(r => setTimeout(r, POLL_INTERVAL))
        try {
          const fresh = await pb.collection("tasks").getOne<TaskRecord>(task.id)
          finalStatus = fresh.status ?? "in_progress"
          if (finalStatus === "done" || finalStatus === "failed") break
        } catch { /* ignore transient errors */ }
      }

      controller.abort()
      fetchPromise.catch(() => null) // suppress AbortError

      if (finalStatus === "failed") throw new Error("Agent failed — check task output")
      if (finalStatus !== "done") throw new Error("Agent timed out after 10 minutes")

      const updated = await pb.collection("tasks").getOne<TaskRecord>(task.id)
      if (selected?.id === task.id) setSelected(updated)
      await loadTasks()
    } catch (e: any) {
      console.error("[TASKS] run agent failed:", e)
      setRunError(e?.message || "נכשל להריץ Agent.")
    } finally {
      setActiveTaskId(null)
      setRunning(false)
    }
  }

  // Pipeline agent order
  const PIPELINE_ORDER = [
    "planner", "copywriter", "visual_director",
    "image_generator", "banner_renderer", "banner_composer",
    "landing_page_builder", "qa"
  ]

  async function runFullPipeline(plannerId: string, children: TaskRecord[]) {
    if (activeTaskId || pipelineRunning) return
    if (!runnerUrl) { setRunError("חסר NEXT_PUBLIC_AGENT_RUNNER_URL"); return }

    // Sort tasks by pipeline order, only backlog ones
    const pending = [...children]
      .filter(t => normalizeRawStatus(t.status) === "backlog")
      .sort((a, b) => {
        const ai = PIPELINE_ORDER.indexOf(a.assigned_agent ?? "")
        const bi = PIPELINE_ORDER.indexOf(b.assigned_agent ?? "")
        return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi)
      })

    if (pending.length === 0) return

    setPipelineRunning(plannerId)
    setPipelineProgress({ done: 0, total: pending.length, current: pending[0].assigned_agent ?? "" })
    setRunError(null)

    for (let i = 0; i < pending.length; i++) {
      const task = pending[i]
      setPipelineProgress({ done: i, total: pending.length, current: task.assigned_agent ?? task.title })
      setActiveTaskId(task.id)

      try {
        // Fire the request — don't await the full response (long tasks like image_generator time out the browser fetch)
        const controller = new AbortController()
        const fetchPromise = fetch(`${runnerUrl}/run-task`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ taskId: task.id }),
          signal: controller.signal,
        }).catch(() => null) // swallow fetch errors — we'll detect completion via polling

        // Poll PocketBase for task status until done/failed (max 10 min)
        const POLL_INTERVAL = 3000
        const MAX_WAIT = 10 * 60 * 1000
        const started = Date.now()
        let finalStatus = "in_progress"

        while (Date.now() - started < MAX_WAIT) {
          await new Promise(r => setTimeout(r, POLL_INTERVAL))
          try {
            const fresh = await pb.collection("tasks").getOne(task.id)
            finalStatus = fresh.status ?? "in_progress"
            if (finalStatus === "done" || finalStatus === "failed") break
          } catch { /* ignore transient PB errors */ }
        }

        controller.abort() // cancel fetch if still pending
        fetchPromise.catch(() => null) // suppress AbortError

        if (finalStatus === "failed") {
          throw new Error(`Agent "${task.assigned_agent}" failed`)
        }
        if (finalStatus !== "done") {
          throw new Error(`Agent "${task.assigned_agent}" timed out after 10 min`)
        }
        await loadTasks()
      } catch (e: any) {
        console.error(`[PIPELINE] failed at ${task.assigned_agent}:`, e)
        setRunError(`Pipeline stopped at "${task.assigned_agent}": ${e?.message}`)
        break
      } finally {
        setActiveTaskId(null)
      }
    }

    setPipelineProgress(prev => prev ? { ...prev, done: prev.total } : null)
    setTimeout(() => {
      setPipelineRunning(null)
      setPipelineProgress(null)
    }, 3000)
  }

  // ── Delete a single task ────────────────────────────────────────────────────
  async function deleteTask() {
    if (!selected) return
    setCampaignActionLoading(true)
    try {
      await pb.collection("tasks").delete(selected.id)
      setConfirmDeleteTask(false)
      setDetailsOpen(false)
      await loadTasks()
    } catch (e) {
      console.error(e)
      setRunError("שגיאה במחיקת המשימה.")
    } finally {
      setCampaignActionLoading(false)
    }
  }

  // ── Reset all tasks in a campaign to backlog ─────────────────────────────────
  async function resetCampaign(plannerId: string) {
    setCampaignActionLoading(true)
    try {
      const allTasks = [...cols.backlog, ...cols.in_progress, ...cols.done]
      const campaignTasks = allTasks.filter(t =>
        t.id === plannerId || t.input_data?.source_task_id === plannerId
      )
      await Promise.all(campaignTasks.map(t =>
        pb.collection("tasks").update(t.id, { status: "backlog", output_data: null })
      ))
      setConfirmResetCampaign(null)
      await loadTasks()
    } catch (e) {
      console.error(e)
    } finally {
      setCampaignActionLoading(false)
    }
  }

  // ── Delete a campaign and all its tasks ──────────────────────────────────────
  async function deleteCampaign(plannerId: string) {
    setCampaignActionLoading(true)
    try {
      const allTasks = [...cols.backlog, ...cols.in_progress, ...cols.done]
      const campaignTasks = allTasks.filter(t =>
        t.id === plannerId || t.input_data?.source_task_id === plannerId
      )
      await Promise.all(campaignTasks.map(t => pb.collection("tasks").delete(t.id)))
      setConfirmDeleteCampaign(null)
      await loadTasks()
    } catch (e) {
      console.error(e)
    } finally {
      setCampaignActionLoading(false)
    }
  }

  // Save landing page config changes + optionally re-run
  async function saveLpConfig(andRun = false) {
    if (!selected) return
    setLpEditSaving(true)
    setRunError(null)
    try {
      const updated = {
        ...selected.input_data,
        zapier_webhook_url: lpEditWebhook.trim() || undefined,
        phone_in_nav: lpEditPhone.trim() || undefined,
        whatsapp_number: lpEditWhatsapp.trim() || undefined,
        whatsapp_message: lpEditWhatsappMsg.trim() || undefined,
        whatsapp_enabled: Boolean(lpEditWhatsapp.trim()),
        meta_pixel_id: lpEditPixel.trim() || undefined,
        redirect_url: lpEditRedirect.trim() || undefined,
        submit_button_text: lpEditSubmitText.trim() || undefined,
        page_slug: lpEditSlug.trim() || undefined,
      }
      // Remove undefined keys
      Object.keys(updated).forEach(k => updated[k] === undefined && delete updated[k])
      await pb.collection("tasks").update(selected.id, {
        input_data: updated,
        status: andRun ? "backlog" : selected.status,
      })
      const fresh = await pb.collection("tasks").getOne<TaskRecord>(selected.id)
      setSelected(fresh)
      await loadTasks()
      setLpEditOpen(false)
      if (andRun) {
        runTask(fresh)
      }
    } catch (e) {
      console.error(e)
      setRunError("שגיאה בשמירת הגדרות.")
    } finally {
      setLpEditSaving(false)
    }
  }

  async function requestRevision() {
    if (!selected) return

    const notes = revisionNotes.trim()
    if (!notes) {
      setRunError("צריך לרשום הערות תיקון.")
      return
    }

    setRequestingRevision(true)
    setRunError(null)

    try {
      const newTask = await pb.collection("tasks").create<TaskRecord>({
        title: `Revision: ${selected.title.replace(/^(Revision:\s*)+/i, "")}`,
        status: "backlog",
        type: selected.type,
        assigned_agent: selected.assigned_agent,
        priority: "high",
        goal_id: selected.goal_id ?? null,
        campaign_id: selected.campaign_id ?? null,
        input_data: {
          mode: "revise",
          deliverable: getRevisionDeliverable(selected.type),
          brief_title:
            selected.input_data?.brief_title ??
            selected.output_data?.title ??
            selected.title,
          additional_context: selected.input_data?.additional_context ?? "",
          // carry over source_task_id so sibling lookups work (banners, images, landing page)
          source_task_id: selected.input_data?.source_task_id ?? null,
          planner_brief: selected.input_data?.planner_brief ?? null,
          assets: selected.input_data?.assets ?? {
            logos: [],
            images: [],
            inspiration: [],
          },
          // carry over all LP config fields
          language: selected.input_data?.language,
          template: selected.input_data?.template,
          page_slug: selected.input_data?.page_slug,
          zapier_webhook_url: selected.input_data?.zapier_webhook_url,
          phone_in_nav: selected.input_data?.phone_in_nav,
          whatsapp_enabled: selected.input_data?.whatsapp_enabled,
          whatsapp_number: selected.input_data?.whatsapp_number,
          whatsapp_message: selected.input_data?.whatsapp_message,
          meta_pixel_id: selected.input_data?.meta_pixel_id,
          redirect_url: selected.input_data?.redirect_url,
          submit_button_text: selected.input_data?.submit_button_text,
          show_testimonials: selected.input_data?.show_testimonials,
          show_faq: selected.input_data?.show_faq,
          show_stats: selected.input_data?.show_stats,
          form_fields: selected.input_data?.form_fields,
          // carry over campaign brief fields so all agents have full context
          tone: selected.input_data?.tone,
          audience: selected.input_data?.audience,
          angle: selected.input_data?.angle,
          cta: selected.input_data?.cta,
          key_points: selected.input_data?.key_points,
          disclaimer: selected.input_data?.disclaimer,
          goal_id: selected.input_data?.goal_id,
          revision_notes: notes,
          previous_output: selected.output_data ?? {},
        },
      })

      setRevisionNotes("")
      setRevisionOpen(false)
      setDetailsOpen(false)
      await loadTasks()
      // Auto-run the revision task immediately
      runTask(newTask)
    } catch (e) {
      console.error(e)
      setRunError("נכשל ליצור Revision task.")
    } finally {
      setRequestingRevision(false)
    }
  }

  const articleParagraphs = getArticleParagraphs(selected?.output_data)
  const bannerItems = getBannerItems(selected?.output_data)
  const composedBannerItems = getComposedBannerItems(selected?.output_data)
  // ── NEW ──────────────────────────────────────────────────────────────────────
  const generatedImages = getGeneratedImages(selected?.output_data)
  // ─────────────────────────────────────────────────────────────────────────────
  const selectedAssets = selected?.input_data?.assets ?? {}
  const selectedLogos = Array.isArray(selectedAssets?.logos) ? selectedAssets.logos : []
  const selectedImages = Array.isArray(selectedAssets?.images) ? selectedAssets.images : []
  const selectedInspiration = Array.isArray(selectedAssets?.inspiration)
    ? selectedAssets.inspiration
    : []
  const selectedCopyPayload = getCopyPayload(selected?.output_data)

  if (!dnd) {
    return (
      <Card className="h-full min-h-[780px] overflow-hidden border-white/10 bg-[#0A0D14] shadow-none">
        <CardHeader className="border-b border-white/5 pb-3">
          <div className="flex items-center gap-2 text-white/80">
            <ChevronLeft className="h-4 w-4 text-white/35" />
            <CardTitle className="text-sm font-medium tracking-wide">TASKS</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="text-xs text-white/45">Loading board...</div>
          {error ? <div className="mt-2 text-xs text-red-400">{error}</div> : null}
        </CardContent>
      </Card>
    )
  }

  const { DragDropContext, Droppable, Draggable } = dnd

  return (
    <>
      <style>{`
        .dark-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: rgba(148, 163, 184, 0.35) #0a0d14;
        }

        .dark-scrollbar::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }

        .dark-scrollbar::-webkit-scrollbar-track {
          background: #0a0d14;
          border-radius: 9999px;
        }

        .dark-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(148, 163, 184, 0.35);
          border-radius: 9999px;
          border: 1px solid #0a0d14;
        }

        .dark-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(148, 163, 184, 0.5);
        }
      `}</style>

      <Card className="h-full min-h-[780px] overflow-hidden border-white/10 bg-[#0A0D14] shadow-none">
        <CardHeader className="border-b border-white/5 pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-white/80">
                <ChevronLeft className="h-4 w-4 text-white/35" />
                <CardTitle className="text-sm font-medium tracking-wide">TASKS</CardTitle>
              </div>
              {/* View toggle */}
              <div className="flex rounded-lg border border-white/10 bg-white/5 p-0.5">
                <button
                  onClick={() => setActiveView("kanban")}
                  className={`rounded-md px-3 py-1 text-xs font-medium transition-all ${activeView === "kanban" ? "bg-white/10 text-white" : "text-white/40 hover:text-white/70"}`}
                >
                  Kanban
                </button>
                <button
                  onClick={() => setActiveView("campaigns")}
                  className={`rounded-md px-3 py-1 text-xs font-medium transition-all ${activeView === "campaigns" ? "bg-white/10 text-white" : "text-white/40 hover:text-white/70"}`}
                >
                  Campaigns
                </button>
                <button
                  onClick={() => setActiveView("usage")}
                  className={`rounded-md px-3 py-1 text-xs font-medium transition-all ${activeView === "usage" ? "bg-emerald-500/20 text-emerald-300" : "text-white/40 hover:text-white/70"}`}
                >
                  💰 Usage
                </button>
              </div>
            </div>

            <Button
              size="sm"
              className="rounded-xl border border-white/10 bg-white/10 text-white hover:bg-white/15"
              onClick={() => {
                setError(null)
                setTaskTitle("")
                setTaskContext("")
                setTaskLogoUrls("")
                setTaskImageUrls("")
                setTaskInspirationUrls("")
                setTaskType("campaign_plan")
                setTaskPriority("normal")
                setTaskGoalId(goalId ?? "")
                setTaskOpen(true)
              }}
            >
              New Task
            </Button>
          </div>
        </CardHeader>

        <CardContent className="flex min-h-0 flex-1 flex-col pt-4">
          {loading ? <div className="mb-3 text-xs text-white/45">Loading tasks...</div> : null}
          {error ? <div className="mb-3 text-xs text-red-400">{error}</div> : null}

          {/* ── Campaign Pipeline View ──────────────────────────────────────── */}
          {activeView === "campaigns" ? (() => {
            // Group tasks by campaign_id (source planner task id)
            const allTasks = [...cols.backlog, ...cols.in_progress, ...cols.done]

            // Find planner tasks as campaign roots
            const plannerTasks = allTasks.filter(t => t.assigned_agent === "planner")

            // Group children by source_task_id
            const bySource: Record<string, TaskRecord[]> = {}
            for (const t of allTasks) {
              const src = t.input_data?.source_task_id
              if (src) {
                if (!bySource[src]) bySource[src] = []
                bySource[src].push(t)
              }
            }

            const PIPELINE_STAGES = [
              { key: "planner",          label: "Plan",    agents: ["planner"] },
              { key: "copywriter",       label: "Copy",    agents: ["copywriter"] },
              { key: "visual_director",  label: "Visuals", agents: ["visual_director"] },
              { key: "image_generator",  label: "Images",  agents: ["image_generator"] },
              { key: "banner_renderer",  label: "Banners", agents: ["banner_renderer", "banner_composer"] },
              { key: "landing_page",     label: "Landing", agents: ["landing_page_builder"] },
              { key: "video_producer",   label: "Video",   agents: ["video_producer"] },
              { key: "qa",               label: "QA",      agents: ["qa"] },
            ]

            const stageTask = (children: TaskRecord[], agents: string[]) =>
              children.find(t => agents.includes(t.assigned_agent ?? ""))

            const stageColor = (t?: TaskRecord) => {
              if (!t) return "bg-white/5 text-white/20 border-white/8"
              const s = normalizeRawStatus(t.status)
              if (s === "done") return "bg-emerald-500/15 text-emerald-300 border-emerald-500/20"
              if (s === "in_progress") return "bg-blue-500/15 text-blue-300 border-blue-500/20"
              if (s === "failed") return "bg-red-500/15 text-red-300 border-red-500/20"
              return "bg-white/5 text-white/40 border-white/10"
            }

            const stageDot = (t?: TaskRecord) => {
              if (!t) return "bg-white/15"
              const s = normalizeRawStatus(t.status)
              if (s === "done") return "bg-emerald-400"
              if (s === "in_progress") return "bg-blue-400 animate-pulse"
              if (s === "failed") return "bg-red-400"
              return "bg-white/25"
            }

            if (plannerTasks.length === 0) {
              return (
                <div className="flex flex-1 items-center justify-center text-sm text-white/30">
                  No campaigns yet. Create a task with type "campaign_plan" to start.
                </div>
              )
            }

            return (
              <div className="dark-scrollbar flex-1 overflow-y-auto space-y-3 pr-1">
                {plannerTasks.map(planner => {
                  const children = bySource[planner.id] ?? []
                  const qaTask = stageTask(children, ["qa"])
                  const lpTask = stageTask(children, ["landing_page_builder"])
                  const qaScore = qaTask?.output_data?.score
                  const qaApproved = qaTask?.output_data?.approved
                  const lpUrl = lpTask?.output_data?.landing_page?.public_url
                  const plannerStatus = normalizeRawStatus(planner.status)

                  return (
                    <div key={planner.id} className="rounded-2xl border border-white/10 bg-[#070A11] p-4">
                      {/* Campaign title row */}
                      <div className="mb-3 flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${stageDot(planner)}`} />
                          <div className="min-w-0">
                            <div className="truncate text-sm font-semibold text-white/90">{planner.title}</div>
                            <div className="text-xs text-white/35 mt-0.5">{children.length} tasks</div>
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          {qaScore != null ? (
                            <span className={`text-sm font-bold ${qaApproved ? "text-emerald-400" : "text-yellow-400"}`}>
                              QA {qaScore}
                            </span>
                          ) : null}
                          {/* Reset + Delete campaign buttons */}
                          <button
                            onClick={() => setConfirmResetCampaign(planner.id)}
                            disabled={Boolean(pipelineRunning) || Boolean(activeTaskId)}
                            title="Reset all tasks to backlog"
                            className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs text-white/40 hover:bg-white/10 hover:text-white/70 disabled:opacity-30 transition-colors"
                          >
                            ↺ Reset
                          </button>
                          <button
                            onClick={() => setConfirmDeleteCampaign(planner.id)}
                            disabled={Boolean(pipelineRunning)}
                            title="Delete campaign and all tasks"
                            className="inline-flex items-center gap-1 rounded-lg border border-red-500/20 bg-red-500/5 px-2 py-1 text-xs text-red-400/60 hover:bg-red-500/15 hover:text-red-400 disabled:opacity-30 transition-colors"
                          >
                            ✕ Delete
                          </button>
                          {lpUrl ? (
                            <a href={lpUrl} target="_blank" rel="noreferrer"
                              className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 text-xs text-emerald-300 hover:bg-emerald-500/20">
                              <ExternalLink className="h-3 w-3" /> Page
                            </a>
                          ) : null}
                          {/* Run next pending task */}
                          {(() => {
                            const nextTask = children.find(t => normalizeRawStatus(t.status) === "backlog")
                            if (!nextTask) return null
                            return (
                              <button
                                onClick={() => runTask(nextTask)}
                                disabled={activeTaskId === nextTask.id}
                                className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs text-white/60 hover:bg-white/10 disabled:opacity-50"
                              >
                                <Play className="h-3 w-3" />
                                Run next
                              </button>
                            )
                          })()}
                          {/* Run full pipeline button */}
                          {(() => {
                            const pendingCount = children.filter(t => normalizeRawStatus(t.status) === "backlog").length
                            if (pendingCount === 0) return null
                            const isRunning = pipelineRunning === planner.id
                            return (
                              <button
                                onClick={() => runFullPipeline(planner.id, children)}
                                disabled={Boolean(activeTaskId) || Boolean(pipelineRunning)}
                                className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-xs font-medium transition-all disabled:opacity-50 ${isRunning ? "border-violet-500/40 bg-violet-500/20 text-violet-200" : "border-violet-500/25 bg-violet-500/15 text-violet-300 hover:bg-violet-500/25"}`}
                              >
                                {isRunning ? (
                                  <>
                                    <span className="h-3 w-3 animate-spin rounded-full border-2 border-violet-400 border-t-transparent" />
                                    {pipelineProgress ? `${pipelineProgress.done}/${pipelineProgress.total}` : "Running..."}
                                  </>
                                ) : (
                                  <>
                                    <Sparkles className="h-3 w-3" />
                                    Run all ({pendingCount})
                                  </>
                                )}
                              </button>
                            )
                          })()}
                        </div>
                      </div>

                      {/* Pipeline stages */}
                      <div className="flex flex-wrap gap-2">
                        {/* Planner itself */}
                        <div className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium ${stageColor(planner)}`}>
                          <Sparkles className="h-3 w-3" />
                          Plan
                          {plannerStatus === "done" ? " ✓" : plannerStatus === "in_progress" ? " ⏳" : ""}
                        </div>

                        {PIPELINE_STAGES.map(stage => {
                          const task = stageTask(children, stage.agents)
                          const status = task ? normalizeRawStatus(task.status) : null
                          return (
                            <button
                              key={stage.key}
                              onClick={() => task && setSelected(task)}
                              disabled={!task}
                              className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition-all ${stageColor(task)} ${task ? "cursor-pointer hover:opacity-80" : "cursor-default"}`}
                            >
                              {stage.label}
                              {status === "done" ? " ✓" : status === "in_progress" ? " ⏳" : status === "failed" ? " ✗" : status === "backlog" ? " —" : " –"}
                              {status === "failed" && (
                                <span className="ml-0.5 rounded bg-red-500/30 px-1 py-0.5 text-[9px] font-bold text-red-300 leading-none">RETRY</span>
                              )}
                            </button>
                          )
                        })}
                      </div>

                      {/* Pipeline progress bar */}
                      {pipelineRunning === planner.id && pipelineProgress ? (
                        <div className="mt-3">
                          <div className="mb-1 flex items-center justify-between text-[11px] text-white/45">
                            <span className="flex items-center gap-1.5">
                              <span className="h-2 w-2 animate-pulse rounded-full bg-violet-400" />
                              Running: {pipelineProgress.current.replace(/_/g, " ")}
                            </span>
                            <span>{pipelineProgress.done}/{pipelineProgress.total} tasks</span>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-white/10">
                            <div
                              className="h-1.5 rounded-full bg-violet-500 transition-all duration-500"
                              style={{ width: `${Math.round((pipelineProgress.done / pipelineProgress.total) * 100)}%` }}
                            />
                          </div>
                        </div>
                      ) : null}
                    </div>
                  )
                })}
              </div>
            )
          })() : null}

          {/* ── Kanban View ─────────────────────────────────────────────────── */}
          {activeView === "kanban" ? (
          <DragDropContext onDragEnd={onDragEnd}>
            <div className="flex min-h-0 flex-1">
              <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 xl:grid-cols-3">
                {COLUMN_ORDER.map((colId) => (
                  <Droppable key={colId} droppableId={colId}>
                    {(provided: DroppableProvided, snapshot: DroppableStateSnapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={[
                          "flex h-full min-h-0 flex-col rounded-2xl border bg-[#070A11] p-3 transition-all",
                          snapshot.isDraggingOver
                            ? "border-white/20 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]"
                            : "border-white/10",
                        ].join(" ")}
                      >
                        <div className="mb-3 flex items-center justify-between text-xs text-white/65">
                          <div className="flex items-center gap-2">
                            <span className={`h-2 w-2 rounded-full ${COLUMN_DOT[colId]}`} />
                            <span className="tracking-[0.2em]">{COLUMN_LABEL[colId]}</span>
                          </div>

                          <span className="rounded-md bg-white/5 px-2 py-0.5 text-[11px] text-white/50">
                            {cols[colId].length}
                          </span>
                        </div>

                        {cols[colId].length === 0 ? (
                          <div className="flex min-h-0 flex-1 items-center justify-center rounded-2xl border border-dashed border-white/10 text-xs text-white/25">
                            No tasks yet
                          </div>
                        ) : (
                          <div className="dark-scrollbar min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
                            {cols[colId].map((t, idx) => {
                              const rawStatus = normalizeRawStatus(t.status)
                              const copyPayload = getCopyPayload(t.output_data)
                              const taskError = normalizeText(t.output_data?.error, "")
                              const isTaskRunning = activeTaskId === t.id
                              const bannerCount = Array.isArray(t.output_data?.composed_banners)
                                ? t.output_data.composed_banners.length
                                : Array.isArray(t.output_data?.final_banners)
                                ? t.output_data.final_banners.length
                                : Array.isArray(t.output_data?.banners)
                                ? t.output_data.banners.length
                                : 0
                              const imageCount = Array.isArray(t.output_data?.generated_images)
                                ? t.output_data.generated_images.length
                                : 0

                              return (
                                <Draggable key={t.id} draggableId={t.id} index={idx}>
                                  {(
                                    dragProvided: DraggableProvided,
                                    dragSnapshot: DraggableStateSnapshot
                                  ) => (
                                    <div
                                      ref={dragProvided.innerRef}
                                      {...dragProvided.draggableProps}
                                      {...dragProvided.dragHandleProps}
                                      className={[
                                        "min-w-0 rounded-2xl border border-white/10 bg-[#0D1018] p-4 transition-all duration-200",
                                        "hover:border-white/15 hover:shadow-[0_10px_30px_rgba(0,0,0,0.28)]",
                                        dragSnapshot.isDragging ? "ring-2 ring-white/20 shadow-2xl" : "",
                                      ].join(" ")}
                                    >
                                      <div className="mb-2 break-words leading-6">
                                        {t.title?.includes(" for:") ? (() => {
                                          const [prefix, ...rest] = t.title.split(" for:")
                                          return (
                                            <>
                                              <div className="text-[11px] font-medium uppercase tracking-wider text-white/40">{prefix}</div>
                                              <div className="text-[15px] font-semibold text-white/92">{rest.join(" for:").trim()}</div>
                                            </>
                                          )
                                        })() : (
                                          <div className="text-[15px] font-medium text-white/92">{t.title}</div>
                                        )}
                                      </div>

                                      <div className="mb-3 flex flex-wrap gap-2">
                                        <Badge className="border border-white/10 bg-white/5 text-white/70">
                                          <span className="mr-1.5 text-white/45">{agentIcon(t.assigned_agent)}</span>
                                          {t.assigned_agent ?? "planner"}
                                        </Badge>

                                        <Badge className={priorityClass(String(t.priority ?? "normal"))}>
                                          {String(t.priority ?? "normal")}
                                        </Badge>

                                        <Badge className="border border-white/10 bg-white/5 text-white/60">
                                          {t.type ?? "campaign_plan"}
                                        </Badge>

                                        {bannerCount > 0 ? (
                                          <Badge className="border border-amber-500/15 bg-amber-500/8 text-amber-400/70">
                                            {bannerCount} banners
                                          </Badge>
                                        ) : null}

                                        {/* ── NEW: image count badge ── */}
                                        {imageCount > 0 ? (
                                          <Badge className="border border-cyan-500/20 bg-cyan-500/15 text-cyan-300">
                                            {imageCount} images
                                          </Badge>
                                        ) : null}

                                        {t.output_data?.landing_page?.public_url ? (
                                          <Badge className="border border-emerald-500/20 bg-emerald-500/15 text-emerald-300">
                                            page ✓
                                          </Badge>
                                        ) : null}

                                        {t.output_data?.checks ? (
                                          <Badge className={`border ${t.output_data.approved ? "border-emerald-500/20 bg-emerald-500/15 text-emerald-300" : "border-red-500/20 bg-red-500/15 text-red-300"}`}>
                                            QA {t.output_data.approved ? "✓" : "✗"} {t.output_data.score ?? ""}
                                          </Badge>
                                        ) : null}

                                        {rawStatus === "failed" ? (
                                          <Badge className="border border-red-500/20 bg-red-500/15 text-red-300">
                                            failed
                                          </Badge>
                                        ) : null}
                                      </div>

                                      {taskError ? (
                                        <div className="mb-3 break-words rounded-xl border border-red-500/15 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                                          {taskError}
                                        </div>
                                      ) : null}

                                      <div className="flex flex-wrap items-start justify-between gap-3">
                                        <div className="flex min-w-0 items-center gap-1.5 text-[11px] text-white/35">
                                          <Clock3 className="h-3.5 w-3.5 shrink-0" />
                                          <span className="truncate">
                                            {rawStatus === "failed"
                                              ? "failed"
                                              : colId === "done"
                                              ? "completed"
                                              : "active"}
                                          </span>
                                        </div>

                                        <div className="flex max-w-full flex-wrap items-center justify-end gap-2">
                                          {copyPayload?.text ? (
                                            <Button
                                              size="sm"
                                              variant="outline"
                                              className="h-8 shrink-0 rounded-lg border-blue-500/20 bg-blue-500/10 px-3 text-blue-300 hover:bg-blue-500/20"
                                              onClick={(e) => {
                                                e.stopPropagation()
                                                copyOutput(t)
                                              }}
                                            >
                                              <Copy className="mr-1.5 h-3.5 w-3.5" />
                                              Copy
                                            </Button>
                                          ) : null}

                                          {rawStatus !== "in_progress" ? (
                                            <Button
                                              size="sm"
                                              variant="outline"
                                              className="h-8 shrink-0 rounded-lg border-violet-500/30 bg-violet-500/15 px-3 text-violet-300 hover:bg-violet-500/25"
                                              onClick={(e) => {
                                                e.stopPropagation()
                                                runTask(t)
                                              }}
                                              disabled={Boolean(activeTaskId)}
                                            >
                                              {rawStatus === "failed" ? (
                                                <>
                                                  <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                                                  {isTaskRunning ? "Retrying..." : "Retry"}
                                                </>
                                              ) : (
                                                <>
                                                  <Play className="mr-1.5 h-3.5 w-3.5" />
                                                  {isTaskRunning ? "Running..." : "Run"}
                                                </>
                                              )}
                                            </Button>
                                          ) : null}

                                          <Button
                                            size="sm"
                                            variant="outline"
                                            className="h-8 shrink-0 rounded-lg border-white/15 bg-white/8 px-3 text-white/80 hover:bg-white/15"
                                            onClick={() => openDetails(t)}
                                          >
                                            Open
                                          </Button>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </Draggable>
                              )
                            })}

                            {provided.placeholder}
                          </div>
                        )}
                      </div>
                    )}
                  </Droppable>
                ))}
              </div>
            </div>
          </DragDropContext>
          ) : null}

          {/* ── Usage & Costs View ────────────────────────────────────────────── */}
          {activeView === "usage" ? <UsageView /> : null}
        </CardContent>
      </Card>

      {/* ── New Task Dialog ─────────────────────────────────────────────────────── */}
      <Dialog open={taskOpen} onOpenChange={setTaskOpen}>
        <DialogContent className="flex max-h-[92vh] max-w-[92vw] flex-col border-white/10 bg-[#0B0F18] p-0 text-white xl:max-w-3xl">
          <DialogHeader className="shrink-0 border-b border-white/5 px-6 py-4">
            <DialogTitle>New Task</DialogTitle>
          </DialogHeader>

          <div className="dark-scrollbar min-h-0 flex-1 overflow-y-auto px-6 py-4">
            <div className="space-y-3">
              <div className="space-y-2">
                <Label className="text-white/80">Title</Label>
                <Input
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="למשל: קרקע בחדרה החל מ-189 אלף ש״ח"
                  className="border-white/10 bg-black/30 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-white/80">Additional Info</Label>
                <textarea
                  value={taskContext}
                  onChange={(e) => setTaskContext(e.target.value)}
                  placeholder="כאן אפשר לכתוב חופשי על מה הכתבה, זווית, מחירים, מיקום, קהל יעד, יתרונות, מסרים חשובים וכו׳"
                  className="dark-scrollbar min-h-[100px] w-full rounded-xl border border-white/10 bg-black/30 p-3 text-sm text-white outline-none"
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-white/80">Type</Label>
                  <select
                    value={taskType}
                    onChange={(e) => setTaskType(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white outline-none"
                  >
                    {TASK_TYPE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className="text-white/80">Priority</Label>
                  <select
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value as TaskPriority)}
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white outline-none"
                  >
                    {PRIORITY_OPTIONS.map((priority) => (
                      <option key={priority} value={priority}>{priority}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-white/80">Client</Label>
                <select
                  value={taskGoalId}
                  onChange={(e) => setTaskGoalId(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none"
                >
                  <option value="">No goal / global task</option>
                  {goals.map((g) => (
                    <option key={g.id} value={g.id}>{g.title}</option>
                  ))}
                </select>
              </div>

              {/* ── Assets (for all non-landing-page tasks) ───────────────────── */}
              {taskType !== "landing_page" ? (
                <>
                  <div className="space-y-2">
                    <Label className="text-white/80">Logo URLs</Label>
                    <textarea
                      value={taskLogoUrls}
                      onChange={(e) => setTaskLogoUrls(e.target.value)}
                      placeholder="קישור אחד בכל שורה"
                      className="dark-scrollbar min-h-[72px] w-full rounded-xl border border-white/10 bg-black/30 p-3 text-sm text-white outline-none"
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white/80">Image URLs</Label>
                    <textarea
                      value={taskImageUrls}
                      onChange={(e) => setTaskImageUrls(e.target.value)}
                      placeholder="קישור אחד בכל שורה"
                      className="dark-scrollbar min-h-[72px] w-full rounded-xl border border-white/10 bg-black/30 p-3 text-sm text-white outline-none"
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white/80">Visual Style</Label>
                    <select
                      value={visualStyle}
                      onChange={(e) => setVisualStyle(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none"
                    >
                      <option value="auto">🤖 Auto — AI decides based on brief</option>
                      <option value="luxury_gold">👑 Luxury Gold — dark, premium, gold accents</option>
                      <option value="bold_modern">⚡ Bold & Modern — clean, strong colors, high contrast</option>
                      <option value="natural_warm">🌿 Natural & Warm — earthy tones, organic feel</option>
                      <option value="corporate_trust">🔵 Corporate & Trust — blues, professional, clean</option>
                      <option value="minimal_elegant">✦ Minimal Elegant — white space, typography-led</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white/80">Video Engine</Label>
                    <select
                      value={videoEngine}
                      onChange={(e) => setVideoEngine(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none"
                    >
                      <option value="creatomate">🎬 Creatomate — Pexels + ElevenLabs (full control)</option>
                      <option value="heygen">✨ HeyGen — AI generates everything automatically</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white/80">Inspiration URLs</Label>
                    <textarea
                      value={taskInspirationUrls}
                      onChange={(e) => setTaskInspirationUrls(e.target.value)}
                      placeholder="לינקים לדפי השראה, אחד בכל שורה"
                      className="dark-scrollbar min-h-[72px] w-full rounded-xl border border-white/10 bg-black/30 p-3 text-sm text-white outline-none"
                      rows={3}
                    />
                  </div>
                </>
              ) : null}

              {/* ── Landing Page specific fields ───────────────────────────────── */}
              {taskType === "landing_page" ? (
                <div className="space-y-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                  <div className="mb-1 flex items-center gap-2 text-sm font-medium text-emerald-400">
                    <LayoutTemplate className="h-4 w-4" />
                    Landing Page Settings
                  </div>

                  {/* Brand + Logo */}
                  <div className="space-y-3">
                    <div className="rounded-xl border border-white/8 bg-black/20 p-3 space-y-3">
                      <div className="text-xs font-medium text-white/50 uppercase tracking-wider">Logo</div>
                      <div className="space-y-2">
                        <Label className="text-white/70 text-xs">Logo URL (optional)</Label>
                        <Input
                          value={lpLogoUrl}
                          onChange={(e) => setLpLogoUrl(e.target.value)}
                          placeholder="https://... (השאר ריק ליצירה אוטומטית)"
                          className="border-white/10 bg-black/30 text-white text-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-white/70 text-xs">Brand Name — לוגו יווצר אוטומטית אם לא סיפקת URL</Label>
                        <Input
                          value={lpBrandName}
                          onChange={(e) => setLpBrandName(e.target.value)}
                          placeholder='למשל: "קרקע ישראל" או "נדל"ן פרמיום"'
                          className="border-white/10 bg-black/30 text-white text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Page settings */}
                  <div className="rounded-xl border border-white/8 bg-black/20 p-3 space-y-3">
                    <div className="text-xs font-medium text-white/50 uppercase tracking-wider">Page Settings</div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-white/70 text-xs">Page Slug (URL)</Label>
                        <Input
                          value={lpPageSlug}
                          onChange={(e) => setLpPageSlug(e.target.value)}
                          placeholder="karaka-hadera"
                          className="border-white/10 bg-black/30 text-white text-sm"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-white/70 text-xs">Language</Label>
                        <select
                          value={lpLanguage}
                          onChange={(e) => setLpLanguage(e.target.value)}
                          className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none"
                        >
                          <option value="he">עברית (he)</option>
                          <option value="en">English (en)</option>
                        </select>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-white/70 text-xs">HTML Template</Label>
                      <select
                        value={lpTemplate}
                        onChange={(e) => setLpTemplate(e.target.value)}
                        className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none"
                      >
                        <option value="auto">🤖 Auto (Planner decides)</option>
                        <option value="dark_luxury">🌑 Dark Luxury — נדל״ן יוקרתי, השקעות, פרימיום</option>
                        <option value="bold_modern">⚡ Bold Modern — פרויקטים מודרניים, טכנולוגיה</option>
                        <option value="minimal_clean">✦ Minimal Clean — בוטיק, שירותים, עיצוב אלגנטי</option>
                        <option value="clean_split">🪵 Clean Split — מוצרים, מותגים, תמונות חזקות</option>
                        <option value="high_convert">🎯 High Convert — המרה גבוהה, direct response</option>
                        <option value="hero_split">🏢 Hero Split — טופס בהירו + תוכן בצד (סגנון השקעות)</option>
                      </select>
                      <p className="text-white/30 text-xs">הצבעים נקבעים אוטומטית לפי הפלטה של הבאנרים</p>
                    </div>
                  </div>

                  {/* Images */}
                  <div className="rounded-xl border border-white/8 bg-black/20 p-3 space-y-3">
                    <div className="text-xs font-medium text-white/50 uppercase tracking-wider">Images (optional — uses AI-generated if empty)</div>
                    <div className="space-y-2">
                      <Input
                        value={taskImageUrls}
                        onChange={(e) => setTaskImageUrls(e.target.value)}
                        placeholder="קישורי תמונות, מופרדים בפסיק או שורה"
                        className="border-white/10 bg-black/30 text-white text-sm"
                      />
                    </div>
                  </div>

                  {/* Form fields */}
                  <div className="rounded-xl border border-white/8 bg-black/20 p-3 space-y-3">
                    <div className="text-xs font-medium text-white/50 uppercase tracking-wider">Form Fields</div>
                    <div className="space-y-2">
                      {lpFormFields.map((field, i) => (
                        <div key={i} className="flex items-center gap-2 rounded-lg border border-white/8 bg-black/20 px-3 py-2">
                          <div className="flex-1 min-w-0">
                            <div className="text-sm text-white/85">{field.label}</div>
                            <div className="text-xs text-white/40">{field.type} · {field.required ? "required" : "optional"}</div>
                          </div>
                          <button
                            onClick={() => setLpFormFields(prev => prev.map((f, j) => j === i ? { ...f, required: !f.required } : f))}
                            className={`shrink-0 rounded-lg px-2 py-1 text-xs font-medium border transition-colors ${field.required ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-300" : "border-white/10 bg-white/5 text-white/50"}`}
                          >
                            {field.required ? "✓ Required" : "Optional"}
                          </button>
                          {i > 0 ? (
                            <button
                              onClick={() => setLpFormFields(prev => prev.filter((_, j) => j !== i))}
                              className="shrink-0 rounded-lg border border-red-500/20 bg-red-500/10 px-2 py-1 text-xs text-red-400 hover:bg-red-500/20"
                            >
                              ✕
                            </button>
                          ) : null}
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setLpFormFields(prev => [...prev, { label: "שדה חדש", type: "text", name: `field_${prev.length + 1}`, required: false }])}
                        className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/70 hover:bg-white/10"
                      >
                        + Add Field
                      </button>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-white/70 text-xs">Submit Button Text</Label>
                      <Input
                        value={lpSubmitText}
                        onChange={(e) => setLpSubmitText(e.target.value)}
                        placeholder="שלח פרטים / קבל מחירון / לתיאום שיחה"
                        className="border-white/10 bg-black/30 text-white text-sm"
                      />
                    </div>
                  </div>

                  {/* Optional sections */}
                  <div className="rounded-xl border border-white/8 bg-black/20 p-3 space-y-3">
                    <div className="text-xs font-medium text-white/50 uppercase tracking-wider">Optional Sections</div>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { label: "Testimonials", value: lpShowTestimonials, set: setLpShowTestimonials },
                        { label: "FAQ", value: lpShowFaq, set: setLpShowFaq },
                        { label: "Stats Bar", value: lpShowStats, set: setLpShowStats },
                      ].map((item) => (
                        <button
                          key={item.label}
                          onClick={() => item.set(!item.value)}
                          className={`rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${item.value ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-300" : "border-white/10 bg-white/5 text-white/40"}`}
                        >
                          {item.value ? "✓ " : ""}{item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* WhatsApp */}
                  <div className="rounded-xl border border-white/8 bg-black/20 p-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-medium text-white/50 uppercase tracking-wider">WhatsApp Button</div>
                      <button
                        onClick={() => setLpWhatsappEnabled(!lpWhatsappEnabled)}
                        className={`rounded-lg border px-3 py-1 text-xs font-medium transition-colors ${lpWhatsappEnabled ? "border-green-500/30 bg-green-500/15 text-green-300" : "border-white/10 bg-white/5 text-white/40"}`}
                      >
                        {lpWhatsappEnabled ? "✓ On" : "Off"}
                      </button>
                    </div>
                    {lpWhatsappEnabled ? (
                      <div className="space-y-2">
                        <Input
                          value={lpWhatsappNumber}
                          onChange={(e) => setLpWhatsappNumber(e.target.value)}
                          placeholder="מספר טלפון (ללא רווחים): 0541234567"
                          className="border-white/10 bg-black/30 text-white text-sm"
                        />
                        <Input
                          value={lpWhatsappMessage}
                          onChange={(e) => setLpWhatsappMessage(e.target.value)}
                          placeholder="הודעת ברירת מחדל בוואטסאפ"
                          className="border-white/10 bg-black/30 text-white text-sm"
                        />
                      </div>
                    ) : null}
                  </div>

                  {/* Integrations */}
                  <div className="rounded-xl border border-white/8 bg-black/20 p-3 space-y-3">
                    <div className="text-xs font-medium text-white/50 uppercase tracking-wider">Integrations (optional)</div>
                    <div className="space-y-2">
                      <Label className="text-white/70 text-xs">Phone in Navbar</Label>
                      <Input value={lpPhoneInNav} onChange={(e) => setLpPhoneInNav(e.target.value)} placeholder="050-1234567" className="border-white/10 bg-black/30 text-white text-sm" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white/70 text-xs">Meta Pixel ID</Label>
                      <Input value={lpMetaPixelId} onChange={(e) => setLpMetaPixelId(e.target.value)} placeholder="123456789012345" className="border-white/10 bg-black/30 text-white text-sm" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white/70 text-xs">Zapier Webhook URL</Label>
                      <Input value={lpZapierWebhook} onChange={(e) => setLpZapierWebhook(e.target.value)} placeholder="https://hooks.zapier.com/..." className="border-white/10 bg-black/30 text-white text-sm" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white/70 text-xs">Redirect URL after Submit</Label>
                      <Input value={lpRedirectUrl} onChange={(e) => setLpRedirectUrl(e.target.value)} placeholder="https://thank-you-page.com" className="border-white/10 bg-black/30 text-white text-sm" />
                    </div>
                  </div>

                </div>
              ) : null}

              <div className="text-xs text-white/45">
                אם נבחר Client, המשימה תשויך אליו ותופיע בפילטר שלו.
              </div>
            </div>
          </div>

          <DialogFooter className="shrink-0 border-t border-white/5 px-6 py-4">
            <Button
              variant="outline"
              className="border-white/15 bg-white/5 text-white hover:bg-white/10"
              onClick={() => setTaskOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="bg-emerald-500 text-black hover:bg-emerald-600"
              onClick={createTask}
              disabled={creating}
            >
              {creating ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Task Details Dialog ─────────────────────────────────────────────────── */}
      {/* 
        FIX 1: max-w-[92vw] instead of max-w-5xl — much wider, never clips on most screens
        FIX 2: inner div gets dark-scrollbar + max-h-[78vh] + overflow-y-auto so it scrolls
               instead of clipping content
      */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="flex max-h-[92vh] max-w-[92vw] flex-col border-white/10 bg-[#0B0F18] p-0 text-white xl:max-w-6xl">
          <DialogHeader className="shrink-0 border-b border-white/5 px-6 py-4">
            <DialogTitle>Task Details</DialogTitle>
          </DialogHeader>

          {/* Scrollable body */}
          <div className="dark-scrollbar min-h-0 flex-1 overflow-y-auto px-6 py-4">
            {selected ? (
              <div className="space-y-4">
                <div>
                  <div className="mb-1 text-xs text-white/50">Title</div>
                  <div className="text-lg font-semibold text-white/95">{selected.title}</div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Badge className="border border-white/10 bg-white/5 text-white/70">
                    status: {normalizeRawStatus(selected.status) || normalizeStatus(selected.status)}
                  </Badge>
                  <Badge className="border border-white/10 bg-white/5 text-white/70">
                    agent: {selected.assigned_agent ?? "planner"}
                  </Badge>
                  <Badge className="border border-white/10 bg-white/5 text-white/70">
                    type: {selected.type ?? "campaign_plan"}
                  </Badge>
                  <Badge className="border border-white/10 bg-white/5 text-white/70">
                    priority: {String(selected.priority ?? "normal")}
                  </Badge>
                </div>

                {selected.input_data?.additional_context ? (
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <div className="mb-2 text-xs text-white/50">Additional Info</div>
                    <div className="dark-scrollbar max-h-[160px] overflow-y-auto whitespace-pre-wrap text-sm leading-7 text-white/80">
                      {selected.input_data.additional_context}
                    </div>
                  </div>
                ) : null}

                {selectedLogos.length > 0 || selectedImages.length > 0 || selectedInspiration.length > 0 ? (
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <div className="mb-3 text-xs text-white/50">Assets</div>

                    {selectedLogos.length > 0 ? (
                      <div className="mb-4">
                        <div className="mb-2 text-xs text-white/45">Logos</div>
                        <div className="space-y-2">
                          {selectedLogos.map((item: string, i: number) => (
                            <div
                              key={`logo-${i}`}
                              className="break-all rounded-xl border border-white/10 bg-[#0A0D14] px-3 py-2 text-sm text-white/85"
                            >
                              {item}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    {selectedImages.length > 0 ? (
                      <div className="mb-4">
                        <div className="mb-2 text-xs text-white/45">Images</div>
                        <div className="space-y-2">
                          {selectedImages.map((item: string, i: number) => (
                            <div
                              key={`image-${i}`}
                              className="break-all rounded-xl border border-white/10 bg-[#0A0D14] px-3 py-2 text-sm text-white/85"
                            >
                              {item}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    {selectedInspiration.length > 0 ? (
                      <div>
                        <div className="mb-2 text-xs text-white/45">Inspiration</div>
                        <div className="space-y-2">
                          {selectedInspiration.map((item: string, i: number) => (
                            <div
                              key={`inspiration-${i}`}
                              className="break-all rounded-xl border border-white/10 bg-[#0A0D14] px-3 py-2 text-sm text-white/85"
                            >
                              {item}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : null}

                {/* ── NEW: Generated Images section (image_generator output) ──────────── */}
                {isGeneratedImagesOutput(selected.output_data) ? (
                  <div className="rounded-2xl border border-violet-500/20 bg-black/20 p-4">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <ImageIcon className="h-4 w-4 text-violet-400" />
                        <div className="text-sm font-medium text-white/80">
                          Generated Images
                        </div>
                        <Badge className="border border-violet-500/20 bg-violet-500/15 text-violet-300">
                          {generatedImages.length}
                        </Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                      {generatedImages.map((img, i) => {
                        const url = img.image_public_url ?? ""
                        const name = normalizeText(img.banner_name, `image_${i + 1}`)
                        const filename = `${name}-${i + 1}.png`
                        const isDownloading = downloadingUrl === url

                        return (
                          <div
                            key={`gen-img-${i}`}
                            className="overflow-hidden rounded-2xl border border-white/10 bg-[#0A0D14]"
                          >
                            {/* Thumbnail */}
                            {url ? (
                              <div className="relative border-b border-white/10 bg-black/40">
                                <img
                                  src={url}
                                  alt={name}
                                  className="h-auto max-h-[260px] w-full object-contain"
                                />
                              </div>
                            ) : (
                              <div className="flex h-[200px] items-center justify-center border-b border-white/10 bg-[#06080D] text-xs text-white/35">
                                No preview
                              </div>
                            )}

                            {/* Info + buttons */}
                            <div className="p-3">
                              <div className="mb-3 flex flex-wrap items-center gap-2">
                                <Badge className="border border-white/10 bg-white/5 text-white/70">
                                  {name}
                                </Badge>
                                {img.requested_size ? (
                                  <Badge className="border border-white/10 bg-white/5 text-white/55">
                                    {img.requested_size}
                                  </Badge>
                                ) : null}
                                {img.generation_status === "generated" ? (
                                  <Badge className="border border-emerald-500/20 bg-emerald-500/15 text-emerald-300">
                                    ✓ generated
                                  </Badge>
                                ) : null}
                              </div>

                              {url ? (
                                <div className="flex gap-2">
                                  <a
                                    href={url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex flex-1 items-center justify-center rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white hover:bg-white/10"
                                  >
                                    <ExternalLink className="mr-2 h-3.5 w-3.5" />
                                    Open
                                  </a>

                                  <button
                                    onClick={async () => {
                                      setDownloadingUrl(url)
                                      await downloadImageFromUrl(url, filename)
                                      setDownloadingUrl(null)
                                    }}
                                    disabled={isDownloading}
                                    className="inline-flex flex-1 items-center justify-center rounded-lg border border-violet-500/25 bg-violet-500/10 px-3 py-2 text-sm text-violet-300 hover:bg-violet-500/20 disabled:opacity-50"
                                  >
                                    <Download className="mr-2 h-3.5 w-3.5" />
                                    {isDownloading ? "Downloading..." : "Download"}
                                  </button>
                                </div>
                              ) : null}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ) : null}
                {/* ─────────────────────────────────────────────────────────────────── */}

                {isArticleOutput(selected.output_data) ? (
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div className="text-xs text-white/50">Article Preview</div>

                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 rounded-lg border-white/10 bg-white/5 px-3 text-white hover:bg-white/10"
                        onClick={() => copyOutput(selected)}
                        disabled={!selectedCopyPayload?.text}
                      >
                        {copiedText ? (
                          <>
                            <Check className="mr-2 h-4 w-4" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="mr-2 h-4 w-4" />
                            {selectedCopyPayload?.label ?? "Copy"}
                          </>
                        )}
                      </Button>
                    </div>

                    {selected.output_data?.title ? (
                      <h2 className="mb-2 text-xl font-semibold leading-8 text-white/95">
                        {selected.output_data.title}
                      </h2>
                    ) : null}

                    {selected.output_data?.subtitle ? (
                      <div className="mb-4 text-sm leading-6 text-white/60">
                        {selected.output_data.subtitle}
                      </div>
                    ) : null}

                    <div className="dark-scrollbar max-h-[360px] overflow-y-auto rounded-xl border border-white/5 bg-[#0A0D14] p-5">
                      <div className="space-y-5 text-sm leading-8 text-white/85">
                        {articleParagraphs.length > 0 ? (
                          articleParagraphs.map((paragraph, i) => <p key={i}>{paragraph}</p>)
                        ) : (
                          <div className="whitespace-pre-wrap">
                            {selected.output_data?.article_text ?? ""}
                          </div>
                        )}
                      </div>
                    </div>

                    {selected.output_data?.estimated_word_count ? (
                      <div className="mt-3 text-xs text-white/45">
                        Word count: {selected.output_data.estimated_word_count}
                      </div>
                    ) : null}
                  </div>
                ) : null}

                {isAdsOutput(selected.output_data) ? (
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div className="text-xs text-white/50">Ads Preview</div>

                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 rounded-lg border-white/10 bg-white/5 px-3 text-white hover:bg-white/10"
                        onClick={() => copyOutput(selected)}
                        disabled={!selectedCopyPayload?.text}
                      >
                        {copiedText ? (
                          <>
                            <Check className="mr-2 h-4 w-4" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="mr-2 h-4 w-4" />
                            {selectedCopyPayload?.label ?? "Copy"}
                          </>
                        )}
                      </Button>
                    </div>

                    {Array.isArray(selected.output_data?.headlines) && selected.output_data.headlines.length ? (
                      <div className="mb-4">
                        <div className="mb-2 text-xs text-white/45">Headlines</div>
                        <div className="space-y-2">
                          {selected.output_data.headlines.map((h: string, i: number) => (
                            <div
                              key={i}
                              className="rounded-xl border border-white/10 bg-[#0A0D14] px-3 py-2 text-sm text-white/85"
                            >
                              {h}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    {Array.isArray(selected.output_data?.primary_texts) &&
                    selected.output_data.primary_texts.length ? (
                      <div>
                        <div className="mb-2 text-xs text-white/45">Primary Texts</div>
                        <div className="space-y-2">
                          {selected.output_data.primary_texts.map((t: string, i: number) => (
                            <div
                              key={i}
                              className="rounded-xl border border-white/10 bg-[#0A0D14] px-3 py-3 text-sm leading-6 text-white/85"
                            >
                              {t}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : null}

                {isBannerOutput(selected.output_data) ? (
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div className="text-xs text-white/50">Banner Set Preview</div>

                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 rounded-lg border-white/10 bg-white/5 px-3 text-white hover:bg-white/10"
                        onClick={() => copyOutput(selected)}
                        disabled={!selectedCopyPayload?.text}
                      >
                        {copiedText ? (
                          <>
                            <Check className="mr-2 h-4 w-4" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="mr-2 h-4 w-4" />
                            {selectedCopyPayload?.label ?? "Copy"}
                          </>
                        )}
                      </Button>
                    </div>

                    {selected.output_data?.master_direction ? (
                      <div className="mb-4 rounded-xl border border-white/10 bg-[#0A0D14] p-4">
                        <div className="mb-2 text-xs text-white/45">Master Direction</div>
                        <div className="whitespace-pre-wrap text-sm leading-7 text-white/85">
                          {selected.output_data.master_direction}
                        </div>
                      </div>
                    ) : null}

                    {selected.output_data?.visual_style ? (
                      <div className="mb-4 rounded-xl border border-white/10 bg-[#0A0D14] p-4">
                        <div className="mb-2 text-xs text-white/45">Visual Style</div>
                        <div className="whitespace-pre-wrap text-sm leading-7 text-white/85">
                          {selected.output_data.visual_style}
                        </div>
                      </div>
                    ) : null}

                    {Array.isArray(selected.output_data?.color_palette) &&
                    selected.output_data.color_palette.length > 0 ? (
                      <div className="mb-4">
                        <div className="mb-2 text-xs text-white/45">Color Palette</div>
                        <div className="flex flex-wrap gap-2">
                          {selected.output_data.color_palette.map((color: string, i: number) => (
                            <div
                              key={`${color}-${i}`}
                              className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#0A0D14] px-3 py-2 text-sm text-white/85"
                            >
                              <span
                                className="h-4 w-4 rounded-full border border-white/15"
                                style={{ backgroundColor: color }}
                              />
                              <span>{color}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                      {bannerItems.map((banner, i) => (
                        <div
                          key={`${banner.name ?? "banner"}-${i}`}
                          className="rounded-2xl border border-white/10 bg-[#0A0D14] p-4"
                        >
                          <div className="mb-3 flex flex-wrap items-center gap-2">
                            <Badge className="border border-white/10 bg-white/5 text-white/70">
                              {normalizeText(banner.name, `banner_${i + 1}`)}
                            </Badge>
                            {banner.size ? (
                              <Badge className="border border-white/10 bg-white/5 text-white/60">
                                {banner.size}
                              </Badge>
                            ) : null}
                          </div>

                          {banner.headline ? (
                            <div className="mb-2 text-lg font-semibold leading-7 text-white/95">
                              {banner.headline}
                            </div>
                          ) : null}

                          {banner.subheadline ? (
                            <div className="mb-4 text-sm leading-6 text-white/65">
                              {banner.subheadline}
                            </div>
                          ) : null}

                          <div className="space-y-3">
                            {banner.cta ? (
                              <div>
                                <div className="mb-1 text-[11px] uppercase tracking-wider text-white/40">CTA</div>
                                <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white/85">
                                  {banner.cta}
                                </div>
                              </div>
                            ) : null}

                            {banner.disclaimer ? (
                              <div>
                                <div className="mb-1 text-[11px] uppercase tracking-wider text-white/40">Disclaimer</div>
                                <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white/85">
                                  {banner.disclaimer}
                                </div>
                              </div>
                            ) : null}

                            {banner.background_image_ref ? (
                              <div>
                                <div className="mb-1 text-[11px] uppercase tracking-wider text-white/40">Background Image Ref</div>
                                <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white/85">
                                  {banner.background_image_ref}
                                </div>
                              </div>
                            ) : null}

                            {banner.image_prompt ? (
                              <div>
                                <div className="mb-1 text-[11px] uppercase tracking-wider text-white/40">Image Prompt</div>
                                <div className="whitespace-pre-wrap rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-sm leading-6 text-white/80">
                                  {banner.image_prompt}
                                </div>
                              </div>
                            ) : null}

                            {banner.visual_focus ? (
                              <div>
                                <div className="mb-1 text-[11px] uppercase tracking-wider text-white/40">Visual Focus</div>
                                <div className="whitespace-pre-wrap rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-sm leading-6 text-white/80">
                                  {banner.visual_focus}
                                </div>
                              </div>
                            ) : null}

                            {banner.design_notes ? (
                              <div>
                                <div className="mb-1 text-[11px] uppercase tracking-wider text-white/40">Design Notes</div>
                                <div className="whitespace-pre-wrap rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-sm leading-6 text-white/80">
                                  {banner.design_notes}
                                </div>
                              </div>
                            ) : null}
                          </div>
                        </div>
                      ))}
                    </div>

                    {selected.output_data?.global_design_notes ? (
                      <div className="mt-4 rounded-xl border border-white/10 bg-[#0A0D14] p-4">
                        <div className="mb-2 text-xs text-white/45">Global Design Notes</div>
                        <div className="whitespace-pre-wrap text-sm leading-7 text-white/85">
                          {selected.output_data.global_design_notes}
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : null}

                {isComposedBannerOutput(selected.output_data) ? (
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div className="text-xs text-white/50">Composed Banners</div>

                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 rounded-lg border-white/10 bg-white/5 px-3 text-white hover:bg-white/10"
                        onClick={() => copyOutput(selected)}
                        disabled={!selectedCopyPayload?.text}
                      >
                        {copiedText ? (
                          <>
                            <Check className="mr-2 h-4 w-4" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="mr-2 h-4 w-4" />
                            {selectedCopyPayload?.label ?? "Copy"}
                          </>
                        )}
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                      {composedBannerItems.map((banner, i) => {
                        const bannerUrl = banner.public_url ?? ""
                        const bannerFilename = banner.file_name ?? `${normalizeText(banner.name, `banner_${i + 1}`)}.png`
                        const isDownloading = downloadingUrl === bannerUrl

                        return (
                          <div
                            key={`${banner.name ?? "composed-banner"}-${i}`}
                            className="overflow-hidden rounded-2xl border border-white/10 bg-[#0A0D14]"
                          >
                            {bannerUrl ? (
                              <div className="border-b border-white/10 bg-black/30">
                                <img
                                  src={bannerUrl}
                                  alt={normalizeText(banner.name, `banner_${i + 1}`)}
                                  className="h-auto max-h-[320px] w-full object-contain bg-[#06080D]"
                                />
                              </div>
                            ) : (
                              <div className="flex h-[220px] items-center justify-center border-b border-white/10 bg-[#06080D] text-xs text-white/35">
                                No preview available
                              </div>
                            )}

                            <div className="p-4">
                              <div className="mb-3 flex flex-wrap items-center gap-2">
                                <Badge className="border border-white/10 bg-white/5 text-white/70">
                                  {normalizeText(banner.name, `banner_${i + 1}`)}
                                </Badge>

                                {banner.size ? (
                                  <Badge className="border border-white/10 bg-white/5 text-white/60">
                                    {banner.size}
                                  </Badge>
                                ) : null}

                                {banner.composition_status ? (
                                  <Badge className="border border-emerald-500/20 bg-emerald-500/15 text-emerald-300">
                                    {banner.composition_status}
                                  </Badge>
                                ) : null}
                              </div>

                              {banner.headline ? (
                                <div className="mb-2 text-lg font-semibold leading-7 text-white/95">
                                  {banner.headline}
                                </div>
                              ) : null}

                              {banner.subheadline ? (
                                <div className="mb-4 text-sm leading-6 text-white/65">
                                  {banner.subheadline}
                                </div>
                              ) : null}

                              <div className="space-y-3">
                                {banner.cta ? (
                                  <div>
                                    <div className="mb-1 text-[11px] uppercase tracking-wider text-white/40">CTA</div>
                                    <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white/85">
                                      {banner.cta}
                                    </div>
                                  </div>
                                ) : null}

                                {banner.disclaimer ? (
                                  <div>
                                    <div className="mb-1 text-[11px] uppercase tracking-wider text-white/40">Disclaimer</div>
                                    <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white/85">
                                      {banner.disclaimer}
                                    </div>
                                  </div>
                                ) : null}

                                {banner.background_image_ref ? (
                                  <div>
                                    <div className="mb-1 text-[11px] uppercase tracking-wider text-white/40">Background Image Ref</div>
                                    <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white/85">
                                      {banner.background_image_ref}
                                    </div>
                                  </div>
                                ) : null}

                                {bannerUrl ? (
                                  <div className="flex flex-wrap gap-2 pt-1">
                                    <a
                                      href={bannerUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="inline-flex flex-1 items-center justify-center rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white hover:bg-white/10"
                                    >
                                      <ExternalLink className="mr-2 h-3.5 w-3.5" />
                                      Open
                                    </a>

                                    <button
                                      onClick={async () => {
                                        setDownloadingUrl(bannerUrl)
                                        await downloadImageFromUrl(bannerUrl, bannerFilename)
                                        setDownloadingUrl(null)
                                      }}
                                      disabled={isDownloading}
                                      className="inline-flex flex-1 items-center justify-center rounded-lg border border-sky-500/25 bg-sky-500/10 px-3 py-2 text-sm text-sky-300 hover:bg-sky-500/20 disabled:opacity-50"
                                    >
                                      <Download className="mr-2 h-3.5 w-3.5" />
                                      {isDownloading ? "Downloading..." : "Download"}
                                    </button>
                                  </div>
                                ) : null}

                                {bannerUrl ? (
                                  <div>
                                    <div className="mb-1 text-[11px] uppercase tracking-wider text-white/40">Public URL</div>
                                    <div className="break-all rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white/85">
                                      {bannerUrl}
                                    </div>
                                  </div>
                                ) : null}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ) : null}

                {Array.isArray(selected.output_data?.created_children) &&
                selected.output_data.created_children.length > 0 ? (
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <div className="mb-3 text-xs text-white/50">Created Tasks</div>
                    <div className="space-y-2">
                      {selected.output_data.created_children.map((child: any) => (
                        <div
                          key={child.id}
                          className="rounded-xl border border-white/10 bg-[#0A0D14] px-3 py-3 text-sm text-white/85"
                        >
                          <div className="font-medium">{child.title}</div>
                          <div className="mt-1 text-xs text-white/45">
                            {child.type} • {child.assigned_agent} • {child.status}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                {/* ── Template selector (landing_page_builder only, before run) ── */}
                {selected.assigned_agent === "landing_page_builder" && (
                  <div className="rounded-2xl border border-violet-500/20 bg-black/20 p-4">
                    <div className="mb-3 flex items-center gap-2">
                      <LayoutTemplate className="h-4 w-4 text-violet-400" />
                      <div className="text-sm font-medium text-white/80">HTML Template</div>
                      {selected.input_data?.template && selected.input_data.template !== "auto" && (
                        <Badge className="border border-violet-500/20 bg-violet-500/15 text-violet-300">
                          {selected.input_data.template}
                        </Badge>
                      )}
                    </div>
                    <div className="flex gap-2 items-center">
                      <select
                        value={templateOverride}
                        onChange={(e) => setTemplateOverride(e.target.value)}
                        className="flex-1 rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none"
                      >
                        <option value="auto">🤖 Auto — Planner decides</option>
                        <option value="dark_luxury">🌑 Dark Luxury — נדל״ן יוקרתי, השקעות</option>
                        <option value="bold_modern">⚡ Bold Modern — פרויקטים מודרניים, טכנולוגיה</option>
                        <option value="minimal_clean">✦ Minimal Clean — בוטיק, שירותים, עיצוב</option>
                        <option value="clean_split">🪵 Clean Split — מוצרים, מותגים, תמונות חזקות</option>
                        <option value="high_convert">🎯 High Convert — המרה גבוהה, direct response</option>
                        <option value="hero_split">🏢 Hero Split — טופס בהירו + תוכן בצד (סגנון השקעות)</option>
                      </select>
                      <button
                        onClick={async () => {
                          if (!selected) return
                          const newTemplate = templateOverride === "auto" ? undefined : templateOverride
                          const updatedInput = { ...selected.input_data, template: newTemplate }
                          if (!newTemplate) delete updatedInput.template
                          await pb.collection("tasks").update(selected.id, { input_data: updatedInput })
                          const fresh = await pb.collection("tasks").getOne<TaskRecord>(selected.id)
                          setSelected(fresh)
                          await loadTasks()
                        }}
                        className="rounded-xl border border-violet-500/30 bg-violet-500/15 px-4 py-2 text-sm font-medium text-violet-300 hover:bg-violet-500/25 transition-colors"
                      >
                        Save
                      </button>
                    </div>
                    <p className="mt-2 text-xs text-white/30">הצבעים נקבעים אוטומטית לפי פלטת הבאנרים. שמור לפני הרצה.</p>
                  </div>
                )}

                {/* ── Landing Page Output ─────────────────────────────────────── */}
                {selected.output_data?.landing_page?.public_url ? (
                  <div className="rounded-2xl border border-emerald-500/20 bg-black/20 p-4">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <LayoutTemplate className="h-4 w-4 text-emerald-400" />
                        <div className="text-sm font-medium text-white/80">Landing Page</div>
                        <Badge className="border border-emerald-500/20 bg-emerald-500/15 text-emerald-300">
                          ✓ built
                        </Badge>
                      </div>
                      <div className="flex gap-2">
                        <a
                          href={selected.output_data.landing_page.public_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white hover:bg-white/10"
                        >
                          <ExternalLink className="mr-2 h-3.5 w-3.5" />
                          Open
                        </a>
                        <button
                          onClick={async () => {
                            const url = selected.output_data.landing_page.public_url
                            const slug = selected.output_data.landing_page.page_slug || "landing-page"
                            setDownloadingUrl(url)
                            await downloadImageFromUrl(url, `${slug}.html`)
                            setDownloadingUrl(null)
                          }}
                          disabled={downloadingUrl === selected.output_data.landing_page.public_url}
                          className="inline-flex items-center rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300 hover:bg-emerald-500/20 disabled:opacity-50"
                        >
                          <Download className="mr-2 h-3.5 w-3.5" />
                          {downloadingUrl === selected.output_data.landing_page.public_url ? "Downloading..." : "Download HTML"}
                        </button>
                      </div>
                    </div>

                    {/* Info row */}
                    <div className="mb-4 flex flex-wrap gap-2">
                      {selected.output_data.landing_page.page_slug ? (
                        <Badge className="border border-white/10 bg-white/5 text-white/60">
                          /{selected.output_data.landing_page.page_slug}
                        </Badge>
                      ) : null}
                      {selected.output_data.landing_page.language ? (
                        <Badge className="border border-white/10 bg-white/5 text-white/60">
                          {selected.output_data.landing_page.language}
                        </Badge>
                      ) : null}
                      {selected.output_data.landing_page.whatsapp_enabled ? (
                        <Badge className="border border-green-500/20 bg-green-500/15 text-green-300">
                          WhatsApp ✓
                        </Badge>
                      ) : null}
                      {selected.output_data.landing_page.has_meta_pixel ? (
                        <Badge className="border border-blue-500/20 bg-blue-500/15 text-blue-300">
                          Meta Pixel ✓
                        </Badge>
                      ) : null}
                      {selected.output_data.landing_page.has_zapier ? (
                        <Badge className="border border-orange-500/20 bg-orange-500/15 text-orange-300">
                          Zapier ✓
                        </Badge>
                      ) : null}
                      {selected.output_data.landing_page.html_size_bytes ? (
                        <Badge className="border border-white/10 bg-white/5 text-white/50">
                          {Math.round(selected.output_data.landing_page.html_size_bytes / 1024)}KB
                        </Badge>
                      ) : null}
                    </div>

                    {/* URL */}
                    <div className="break-all rounded-xl border border-white/10 bg-[#0A0D14] px-3 py-2 text-xs text-white/60">
                      {selected.output_data.landing_page.public_url}
                    </div>

                    {/* Config editor panel */}
                    <div className="mt-4">
                      {/* Iframe preview */}
                      <div className="mb-3">
                        <div className="mb-2 text-xs text-white/45">Preview</div>
                        <div className="overflow-hidden rounded-xl border border-white/10 bg-black" style={{ height: "380px" }}>
                          <iframe
                            src={selected.output_data.landing_page.public_url}
                            title="Landing Page Preview"
                            className="h-full w-full"
                            style={{ transform: "scale(0.75)", transformOrigin: "top left", width: "133%", height: "133%" }}
                            sandbox="allow-scripts allow-same-origin"
                          />
                        </div>
                      </div>
                      <button
                        onClick={() => setLpEditOpen(o => !o)}
                        className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/70 hover:bg-black/30 transition-colors"
                      >
                        <span className="flex items-center gap-2">⚙️ <span>Edit Config & Integrations</span></span>
                        <span className="text-white/30">{lpEditOpen ? "▲" : "▼"}</span>
                      </button>

                      {lpEditOpen && (
                        <div className="mt-2 rounded-xl border border-white/10 bg-black/20 p-4 space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <label className="text-xs text-white/50">Phone in Navbar</label>
                              <input value={lpEditPhone} onChange={e => setLpEditPhone(e.target.value)} placeholder="050-1234567" className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none placeholder:text-white/20" />
                            </div>
                            <div className="space-y-1">
                              <label className="text-xs text-white/50">Submit Button Text</label>
                              <input value={lpEditSubmitText} onChange={e => setLpEditSubmitText(e.target.value)} placeholder="שלח פרטים" className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none placeholder:text-white/20" />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <label className="text-xs text-white/50">WhatsApp Number</label>
                              <input value={lpEditWhatsapp} onChange={e => setLpEditWhatsapp(e.target.value)} placeholder="972501234567" className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none placeholder:text-white/20" />
                            </div>
                            <div className="space-y-1">
                              <label className="text-xs text-white/50">WhatsApp Message</label>
                              <input value={lpEditWhatsappMsg} onChange={e => setLpEditWhatsappMsg(e.target.value)} placeholder="שלום, אני מעוניין..." className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none placeholder:text-white/20" />
                            </div>
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs text-white/50">Zapier Webhook URL</label>
                            <input value={lpEditWebhook} onChange={e => setLpEditWebhook(e.target.value)} placeholder="https://hooks.zapier.com/..." className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none placeholder:text-white/20" />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <label className="text-xs text-white/50">Meta Pixel ID</label>
                              <input value={lpEditPixel} onChange={e => setLpEditPixel(e.target.value)} placeholder="123456789012345" className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none placeholder:text-white/20" />
                            </div>
                            <div className="space-y-1">
                              <label className="text-xs text-white/50">Redirect URL after Submit</label>
                              <input value={lpEditRedirect} onChange={e => setLpEditRedirect(e.target.value)} placeholder="https://thank-you.com" className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none placeholder:text-white/20" />
                            </div>
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs text-white/50">Page Slug (URL path)</label>
                            <input value={lpEditSlug} onChange={e => setLpEditSlug(e.target.value)} placeholder="my-landing-page" className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none placeholder:text-white/20" />
                          </div>
                          <div className="flex gap-2 pt-1">
                            <button
                              onClick={() => saveLpConfig(false)}
                              disabled={lpEditSaving}
                              className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm text-white hover:bg-white/10 disabled:opacity-50 transition-colors"
                            >
                              {lpEditSaving ? "Saving..." : "Save Only"}
                            </button>
                            <button
                              onClick={() => saveLpConfig(true)}
                              disabled={lpEditSaving || Boolean(activeTaskId)}
                              className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-black hover:bg-emerald-400 disabled:opacity-50 transition-colors"
                            >
                              💾 Save & Rebuild Page
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : null}

                {/* ── Video Output ────────────────────────────────────────────── */}
                {selected.output_data?.video_url ? (
                  <div className="rounded-2xl border border-purple-500/20 bg-black/20 p-4">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Video className="h-4 w-4 text-purple-400" />
                        <div className="text-sm font-medium text-white/80">Video</div>
                        <Badge className="border border-purple-500/20 bg-purple-500/15 text-purple-300">✓ ready</Badge>
                        {selected.output_data?.engine ? (
                          <Badge className="border border-white/10 bg-white/5 text-white/50">{selected.output_data.engine}</Badge>
                        ) : null}
                      </div>
                      <a
                        href={selected.output_data.video_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white hover:bg-white/10"
                      >
                        <ExternalLink className="mr-2 h-3.5 w-3.5" />
                        Open Video
                      </a>
                    </div>
                    <video
                      src={selected.output_data.video_url}
                      controls
                      className="w-full rounded-xl border border-white/10"
                      style={{ maxHeight: "480px" }}
                    />
                    {selected.output_data.duration ? (
                      <div className="mt-2 text-xs text-white/40">{selected.output_data.duration}s · {selected.output_data.scenes?.length ?? 0} scenes</div>
                    ) : null}
                  </div>
                ) : selected.output_data?.status === "rendering" ? (
                  <div className="rounded-2xl border border-purple-500/20 bg-black/20 p-4">
                    <div className="flex items-center gap-3">
                      <Video className="h-4 w-4 text-purple-400 animate-pulse" />
                      <div className="text-sm text-white/70">Rendering video... {selected.output_data.progress ?? 0}%</div>
                    </div>
                    <div className="mt-3 h-1.5 w-full rounded-full bg-white/10">
                      <div className="h-1.5 rounded-full bg-purple-500 transition-all" style={{ width: `${selected.output_data.progress ?? 0}%` }} />
                    </div>
                  </div>
                ) : null}

                {/* ── QA Output ───────────────────────────────────────────────── */}
                {selected.output_data?.checks ? (() => {
                  const qa = selected.output_data
                  const approved = qa.approved
                  const score = qa.score ?? 0
                  const checks = qa.checks ?? []
                  const passed = checks.filter((c: any) => c.passed).length
                  const total  = checks.length
                  return (
                    <div className={`rounded-2xl border p-4 ${approved ? "border-emerald-500/20 bg-black/20" : "border-red-500/20 bg-red-900/10"}`}>
                      {/* Header */}
                      <div className="mb-4 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <CheckCircle className={`h-4 w-4 ${approved ? "text-emerald-400" : "text-red-400"}`} />
                          <div className="text-sm font-medium text-white/80">QA Review</div>
                          <Badge className={`border ${approved ? "border-emerald-500/20 bg-emerald-500/15 text-emerald-300" : "border-red-500/20 bg-red-500/15 text-red-300"}`}>
                            {approved ? "✓ Approved" : "✗ Needs Work"}
                          </Badge>
                        </div>
                        {/* Score circle */}
                        <div className="flex items-center gap-2">
                          <div className={`text-2xl font-bold ${score >= 80 ? "text-emerald-400" : score >= 60 ? "text-yellow-400" : "text-red-400"}`}>
                            {score}
                          </div>
                          <div className="text-xs text-white/40">/ 100</div>
                        </div>
                      </div>

                      {/* Score bar */}
                      <div className="mb-4">
                        <div className="mb-1 flex justify-between text-xs text-white/40">
                          <span>{passed}/{total} checks passed</span>
                          <span>{score}%</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-white/10">
                          <div
                            className={`h-2 rounded-full transition-all ${score >= 80 ? "bg-emerald-500" : score >= 60 ? "bg-yellow-500" : "bg-red-500"}`}
                            style={{ width: `${score}%` }}
                          />
                        </div>
                      </div>

                      {/* Checks list */}
                      <div className="mb-4 space-y-1.5">
                        {checks.map((c: any) => (
                          <div key={c.id} className="flex items-start gap-2 rounded-lg bg-white/5 px-3 py-2">
                            <span className={`mt-0.5 text-sm ${c.passed ? "text-emerald-400" : "text-red-400"}`}>
                              {c.passed ? "✓" : "✗"}
                            </span>
                            <div className="flex-1 min-w-0">
                              <div className={`text-xs font-medium ${c.passed ? "text-white/80" : "text-white/60"}`}>{c.label}</div>
                              {c.detail ? <div className="text-xs text-white/35 mt-0.5">{c.detail}</div> : null}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Pipeline summary */}
                      {qa.pipeline_summary ? (
                        <div className="mb-4 flex flex-wrap gap-2">
                          {Object.entries(qa.pipeline_summary).map(([key, val]: [string, any]) => (
                            <Badge key={key} className={`border text-xs ${val ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300" : "border-red-500/20 bg-red-500/10 text-red-300"}`}>
                              {key.replace(/_/g, " ")} {val ? "✓" : "✗"}
                            </Badge>
                          ))}
                        </div>
                      ) : null}

                      {/* AI narrative */}
                      {qa.ai_review ? (
                        <div className="rounded-xl border border-white/10 bg-[#0A0D14] p-3">
                          <div className="mb-1.5 text-xs text-white/40">AI Review</div>
                          <p className="whitespace-pre-wrap text-sm text-white/75 leading-relaxed" dir="rtl">{qa.ai_review}</p>
                        </div>
                      ) : null}

                      {/* Banner Hebrew vision review */}
                      {qa.banner_hebrew_review ? (
                        <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-3">
                          <div className="mb-1.5 flex items-center gap-2 text-xs text-purple-300/70">
                            <span>🔤</span>
                            <span>Banner Hebrew Check (Gemini Vision)</span>
                          </div>
                          <p className="whitespace-pre-wrap text-sm text-white/70 leading-relaxed" dir="rtl">{qa.banner_hebrew_review}</p>
                        </div>
                      ) : null}
                    </div>
                  )
                })() : null}

                <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                  <div className="mb-2 text-xs text-white/50">Output (output_data)</div>
                  <pre className="dark-scrollbar max-h-[260px] overflow-y-auto whitespace-pre-wrap text-xs text-white/75">
                    {safeJsonStringify(selected.output_data ?? {})}
                  </pre>
                </div>

                {/* ── Collapsible Revision Panel ───────────────────────────── */}
                <div>
                  <button
                    onClick={() => setRevisionOpen(o => !o)}
                    className="flex w-full items-center justify-between rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-sm text-amber-300 hover:bg-amber-500/10 transition-colors"
                  >
                    <span className="flex items-center gap-2">✏️ <span>Request Revision</span></span>
                    <span className="text-amber-500/50">{revisionOpen ? "▲" : "▼"}</span>
                  </button>

                  {revisionOpen && (
                    <div className="mt-2 rounded-xl border border-amber-500/20 bg-black/20 p-4 space-y-3">
                      <p className="text-xs text-white/40">כתוב מה צריך לשנות — AI ייצור גרסה חדשה עם ההערות שלך.</p>
                      <textarea
                        value={revisionNotes}
                        onChange={(e) => setRevisionNotes(e.target.value)}
                        placeholder={"לדוגמה: תגרום לכותרת להיות יותר אגרסיבית, שנה את ה-CTA ל'קבל הצעת מחיר', הוסף דגש על המיקום..."}
                        className="dark-scrollbar w-full rounded-xl border border-white/10 bg-black/30 p-3 text-sm text-white outline-none placeholder:text-white/25"
                        rows={4}
                        autoFocus
                      />
                      <button
                        onClick={requestRevision}
                        disabled={!revisionNotes.trim() || requestingRevision}
                        className="w-full rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-semibold text-black hover:bg-amber-400 disabled:opacity-50 transition-colors"
                      >
                        {requestingRevision ? "יוצר Revision..." : "✏️ Create Revision Task"}
                      </button>
                    </div>
                  )}
                </div>

                {runError ? <div className="text-xs text-red-400">{runError}</div> : null}
              </div>
            ) : null}
          </div>

          {/* Sticky footer */}
          <DialogFooter className="shrink-0 border-t border-white/5 px-6 py-4">
            <Button
              variant="outline"
              className="border-white/15 bg-white/5 text-white hover:bg-white/10"
              onClick={() => setDetailsOpen(false)}
            >
              Close
            </Button>

            <Button
              variant="outline"
              className="border-red-500/20 bg-red-500/5 text-red-400 hover:bg-red-500/15 ml-auto"
              onClick={() => setConfirmDeleteTask(true)}
              disabled={!selected}
            >
              🗑 Delete Task
            </Button>

            <Button
              className="bg-emerald-500 text-black hover:bg-emerald-600"
              onClick={() => selected && runTask(selected)}
              disabled={!selected || Boolean(activeTaskId)}
            >
              {activeTaskId === selected?.id ? "Running..." : "Run Agent"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* ── Confirm: Delete Task ──────────────────────────────────────────── */}
      {confirmDeleteTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#0D1017] p-6 shadow-2xl">
            <div className="mb-2 text-base font-semibold text-white">מחיקת משימה</div>
            <div className="mb-5 text-sm text-white/50">האם למחוק את המשימה <span className="text-white/80">"{selected?.title}"</span>? פעולה זו אינה ניתנת לביטול.</div>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDeleteTask(false)} className="flex-1 rounded-xl border border-white/10 bg-white/5 py-2.5 text-sm text-white hover:bg-white/10 transition-colors">ביטול</button>
              <button
                onClick={deleteTask}
                disabled={campaignActionLoading}
                className="flex-1 rounded-xl bg-red-500 py-2.5 text-sm font-semibold text-white hover:bg-red-400 disabled:opacity-50 transition-colors"
              >{campaignActionLoading ? "מוחק..." : "🗑 מחק משימה"}</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirm: Reset Campaign ───────────────────────────────────────── */}
      {confirmResetCampaign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#0D1017] p-6 shadow-2xl">
            <div className="mb-2 text-base font-semibold text-white">איפוס קמפיין</div>
            <div className="mb-5 text-sm text-white/50">כל המשימות בקמפיין יחזרו לסטטוס <span className="text-white/80">Backlog</span> והפלטים ימחקו. פעולה זו אינה ניתנת לביטול.</div>
            <div className="flex gap-3">
              <button onClick={() => setConfirmResetCampaign(null)} className="flex-1 rounded-xl border border-white/10 bg-white/5 py-2.5 text-sm text-white hover:bg-white/10 transition-colors">ביטול</button>
              <button
                onClick={() => resetCampaign(confirmResetCampaign)}
                disabled={campaignActionLoading}
                className="flex-1 rounded-xl bg-amber-500 py-2.5 text-sm font-semibold text-black hover:bg-amber-400 disabled:opacity-50 transition-colors"
              >{campaignActionLoading ? "מאפס..." : "↺ אפס קמפיין"}</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirm: Delete Campaign ──────────────────────────────────────── */}
      {confirmDeleteCampaign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#0D1017] p-6 shadow-2xl">
            <div className="mb-2 text-base font-semibold text-white">מחיקת קמפיין</div>
            <div className="mb-5 text-sm text-white/50">הקמפיין וכל המשימות שלו יימחקו לצמיתות. פעולה זו אינה ניתנת לביטול.</div>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDeleteCampaign(null)} className="flex-1 rounded-xl border border-white/10 bg-white/5 py-2.5 text-sm text-white hover:bg-white/10 transition-colors">ביטול</button>
              <button
                onClick={() => deleteCampaign(confirmDeleteCampaign)}
                disabled={campaignActionLoading}
                className="flex-1 rounded-xl bg-red-500 py-2.5 text-sm font-semibold text-white hover:bg-red-400 disabled:opacity-50 transition-colors"
              >{campaignActionLoading ? "מוחק..." : "🗑 מחק קמפיין"}</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}