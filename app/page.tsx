"use client"

import * as React from "react"
import Link from "next/link"
import KanbanBoard from "@/components/board/kanban-board"
import { pb } from "@/lib/pb"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import {
  Bot,
  Sparkles,
  PenSquare,
  Palette,
  Image as ImageIcon,
  PanelsTopLeft,
  Video,
  ShieldCheck,
  LayoutTemplate,
  Target,
  ChevronLeft,
  Plus,
  Flame,
  DollarSign,
  Pencil,
  Link2,
  Upload,
  X,
  ImagePlus,
} from "lucide-react"

type AgentId =
  | "all"
  | "planner"
  | "copywriter"
  | "visual_director"
  | "image_generator"
  | "banner_renderer"
  | "banner_composer"
  | "video_producer"
  | "qa"
  | "landing_page_builder"

const AGENTS: {
  id: AgentId
  label: string
  icon: React.ComponentType<{ className?: string }>
  iconClass: string
}[] = [
  { id: "all", label: "All Agents", icon: Bot, iconClass: "text-blue-400" },
  { id: "planner", label: "Planner", icon: Sparkles, iconClass: "text-violet-400" },
  { id: "copywriter", label: "Copywriter", icon: PenSquare, iconClass: "text-emerald-400" },
  { id: "visual_director", label: "Visual Director", icon: Palette, iconClass: "text-pink-400" },
  { id: "image_generator", label: "Image Generator", icon: ImageIcon, iconClass: "text-cyan-400" },
  { id: "banner_renderer", label: "Banner Renderer", icon: PanelsTopLeft, iconClass: "text-amber-400" },
  { id: "banner_composer", label: "Banner Composer", icon: PanelsTopLeft, iconClass: "text-orange-400" },
  { id: "video_producer", label: "Video Producer", icon: Video, iconClass: "text-red-400" },
  { id: "qa", label: "QA", icon: ShieldCheck, iconClass: "text-lime-400" },
  { id: "landing_page_builder", label: "Landing Page Builder", icon: LayoutTemplate, iconClass: "text-sky-400" },
]

export type GoalRecord = {
  id: string
  title: string
  status?: "active" | "paused" | "done"
  campaign_id?: string
  progress?: number
  created?: string
}

type ClientAsset = {
  id: string
  goal_id: string
  asset_type: "logo" | "photo"
  name: string
  file_url: string
  created?: string
}

type ActivityRecord = {
  id: string
  event: string
  agent?: string
  details?: any
  campaign_id?: string | null
  task_id?: string | null
  created?: string
}

function GoalProgress({ value }: { value?: number }) {
  const pct = Math.max(0, Math.min(100, value ?? 0))
  const barColor = pct === 100 ? "bg-emerald-500" : pct >= 50 ? "bg-blue-500" : pct > 0 ? "bg-violet-500" : "bg-white/10"
  return (
    <div className="mt-3">
      <div className="mb-1 flex items-center justify-between text-[11px] text-white/45">
        <span>{pct}%</span>
        <span>{pct === 100 ? "✓ complete" : "progress"}</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-white/10">
        <div className={`h-1.5 rounded-full transition-all duration-700 ${barColor}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function formatTimeAgo(value?: string) {
  if (!value) return "just now"

  const then = new Date(value).getTime()
  const now = Date.now()
  const diffSec = Math.max(1, Math.floor((now - then) / 1000))

  if (diffSec < 60) return `${diffSec}s ago`
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  const diffDay = Math.floor(diffHr / 24)
  return `${diffDay}d ago`
}

function prettifyAgent(agent?: string) {
  if (!agent) return "system"
  return agent.replace(/_/g, " ")
}

function prettifyActivity(item: ActivityRecord) {
  const agent = prettifyAgent(item.agent)
  const title = item.details?.title || item.details?.brief_title || item.details?.type || ""

  switch (item.event) {
    case "task_started":
      return `${agent} started ${title || "a task"}`
    case "task_done":
      return `${agent} completed ${title || item.details?.type || "a task"}`
    case "task_failed":
      return `${agent} failed ${title || item.details?.type || "a task"}`
    default:
      return `${agent} ${item.event.replace(/_/g, " ")}`
  }
}

export default function Page() {
  const [selectedAgent, setSelectedAgent] = React.useState<AgentId>("all")
  const [selectedGoalId, setSelectedGoalId] = React.useState<string | null>(null)

  const [goals, setGoals] = React.useState<GoalRecord[]>([])
  const [goalsLoading, setGoalsLoading] = React.useState(false)
  const [goalsError, setGoalsError] = React.useState<string | null>(null)

  // tasks indexed by campaign_id for progress calculation
  const [tasksByCampaign, setTasksByCampaign] = React.useState<Record<string, any[]>>({})

  // Client assets
  const [assetsByGoal, setAssetsByGoal] = React.useState<Record<string, ClientAsset[]>>({})
  const [assetsOpen, setAssetsOpen] = React.useState<string | null>(null) // goal id
  const [uploadingAsset, setUploadingAsset] = React.useState(false)
  const [generatingLogo, setGeneratingLogo] = React.useState(false)
  const [logoGenOpen, setLogoGenOpen] = React.useState<string | null>(null)
  const [logoBrandName, setLogoBrandName] = React.useState("")
  const [logoDescription, setLogoDescription] = React.useState("")
  const [assetError, setAssetError] = React.useState<string | null>(null)
  const assetsInputRef = React.useRef<HTMLInputElement>(null)
  const logoInputRef = React.useRef<HTMLInputElement>(null)

  async function loadAssetsForGoal(goalId: string) {
    try {
      const res = await pb.collection("client_assets").getList(1, 100, {
        filter: `goal_id = "${goalId}"`,
        sort: "-created",
      })
      const pbUrl = process.env.NEXT_PUBLIC_POCKETBASE_URL || ""
      const items: ClientAsset[] = res.items.map((r: any) => ({
        id: r.id,
        goal_id: r.goal_id,
        asset_type: r.asset_type,
        name: r.name || r.file,
        file_url: r.file
          ? `${pbUrl}/api/files/client_assets/${r.id}/${r.file}`
          : r.file_url || "",
        created: r.created,
      }))
      setAssetsByGoal(prev => ({ ...prev, [goalId]: items }))
    } catch (e) {
      console.error("[ASSETS] load failed:", e)
    }
  }

  async function uploadAsset(goalId: string, file: File, assetType: "logo" | "photo") {
    setUploadingAsset(true)
    setAssetError(null)
    try {
      const formData = new FormData()
      formData.append("goal_id", goalId)
      formData.append("asset_type", assetType)
      formData.append("name", file.name)
      formData.append("file", file)
      await pb.collection("client_assets").create(formData)
      await loadAssetsForGoal(goalId)
    } catch (e: any) {
      setAssetError("Upload failed: " + (e?.message || "unknown error"))
    } finally {
      setUploadingAsset(false)
    }
  }

  async function deleteAsset(goalId: string, assetId: string) {
    try {
      await pb.collection("client_assets").delete(assetId)
      setAssetsByGoal(prev => ({
        ...prev,
        [goalId]: (prev[goalId] ?? []).filter(a => a.id !== assetId)
      }))
    } catch (e) {
      console.error("[ASSETS] delete failed:", e)
    }
  }

  async function generateLogo(goalId: string, brandName: string, description?: string) {
    const runnerUrl = process.env.NEXT_PUBLIC_AGENT_RUNNER_URL
    if (!runnerUrl) { setAssetError("חסר NEXT_PUBLIC_AGENT_RUNNER_URL"); return }
    setGeneratingLogo(true)
    setAssetError(null)
    try {
      const res = await fetch(`${runnerUrl}/generate-logo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goalId, brandName, description }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok || !data?.ok) throw new Error(data?.error || "Logo generation failed")
      await loadAssetsForGoal(goalId)
      setLogoGenOpen(null)
      setLogoBrandName("")
      setLogoDescription("")
    } catch (e: any) {
      setAssetError("Logo generation failed: " + (e?.message || "unknown"))
    } finally {
      setGeneratingLogo(false)
    }
  }

  const PIPELINE_AGENTS = ["planner","copywriter","visual_director","image_generator","banner_renderer","banner_composer","landing_page_builder","qa"]

  function calcProgress(campaignId?: string): number {
    if (!campaignId) return 0
    const tasks = tasksByCampaign[campaignId] ?? []
    if (tasks.length === 0) return 0
    const done = tasks.filter(t => (t.status ?? "").toLowerCase().includes("done") || (t.status ?? "").toLowerCase().includes("complet")).length
    return Math.round((done / Math.max(tasks.length, PIPELINE_AGENTS.length)) * 100)
  }

  function agentDone(campaignId: string | undefined, agent: string): boolean {
    if (!campaignId) return false
    const tasks = tasksByCampaign[campaignId] ?? []
    return tasks.some(t => t.assigned_agent === agent && ((t.status ?? "").toLowerCase().includes("done") || (t.status ?? "").toLowerCase().includes("complet")))
  }

  const [activity, setActivity] = React.useState<ActivityRecord[]>([])
  const [activityLoading, setActivityLoading] = React.useState(false)
  const [activityError, setActivityError] = React.useState<string | null>(null)

  const [newGoalOpen, setNewGoalOpen] = React.useState(false)
  const [newGoalTitle, setNewGoalTitle] = React.useState("")
  const [creatingGoal, setCreatingGoal] = React.useState(false)
  const [createError, setCreateError] = React.useState<string | null>(null)

  const loadGoals = React.useCallback(async () => {
    setGoalsLoading(true)
    setGoalsError(null)

    try {
      const res = await pb.collection("goals").getList<GoalRecord>(1, 200, { sort: "-created" })
      setGoals(res.items)

      // Load all tasks and index by campaign_id for progress calculation
      const taskRes = await pb.collection("tasks").getList(1, 500, { sort: "-created" })
      const byCampaign: Record<string, any[]> = {}
      for (const task of taskRes.items) {
        const cid = task.campaign_id ?? task.source_task_id ?? ""
        if (!cid) continue
        if (!byCampaign[cid]) byCampaign[cid] = []
        byCampaign[cid].push(task)
      }
      setTasksByCampaign(byCampaign)
    } catch (e: any) {
      setGoalsError("נכשל לטעון Clients. בדוק הרשאות/URL ל-PocketBase.")
      console.error("[GOALS] load failed:", e)
    } finally {
      setGoalsLoading(false)
    }
  }, [])

  const loadActivity = React.useCallback(async () => {
    setActivityLoading(true)
    setActivityError(null)

    try {
      const res = await pb.collection("activity_log").getList<ActivityRecord>(1, 60, {
        sort: "-created",
      })

      let items = res.items ?? []

      if (selectedGoalId) {
        const goal = goals.find((g) => g.id === selectedGoalId)
        const campaignId = goal?.campaign_id ?? null

        if (campaignId) {
          items = items.filter((item) => item.campaign_id === campaignId)
        } else {
          items = []
        }
      }

      setActivity(items)
    } catch (e: any) {
      setActivityError("נכשל לטעון Activity.")
      console.error("[ACTIVITY] load failed:", e)
    } finally {
      setActivityLoading(false)
    }
  }, [selectedGoalId, goals])

  React.useEffect(() => {
    loadGoals()
  }, [loadGoals])

  React.useEffect(() => {
    loadActivity()
  }, [loadActivity])

  function pickGoal(goalId: string | null) {
    setSelectedGoalId(goalId)
  }

  async function createGoal() {
    const title = newGoalTitle.trim()
    if (!title) {
      setCreateError("חייבים כותרת ל-Client.")
      return
    }

    setCreatingGoal(true)
    setCreateError(null)

    try {
      const created = await pb.collection("goals").create<GoalRecord>({
        title,
        status: "active",
      })

      setNewGoalOpen(false)
      setNewGoalTitle("")
      await loadGoals()
      setSelectedGoalId(created.id)
    } catch (e: any) {
      console.error("[GOALS] create failed:", e)
      setCreateError(
        e?.status === 403
          ? "אין הרשאה ליצור Client (403). בדוק Create rule ב-collection goals."
          : "נכשל ליצור Client. בדוק שדות חובה ב-PocketBase."
      )
    } finally {
      setCreatingGoal(false)
    }
  }

  const activeGoalsCount = goals.filter((g) => g.status !== "done").length

  return (
    <>
      <style>{`
        html, body {
          background: #05070B;
        }

        .dark-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: rgba(255, 255, 255, 0.18) #0a0d14;
        }

        .dark-scrollbar::-webkit-scrollbar {
          width: 10px;
          height: 10px;
        }

        .dark-scrollbar::-webkit-scrollbar-track {
          background: #0a0d14;
          border-radius: 9999px;
        }

        .dark-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.18);
          border-radius: 9999px;
          border: 2px solid #0a0d14;
        }

        .dark-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.28);
        }
      `}</style>

      <main className="min-h-screen overflow-x-hidden bg-[#05070B] text-white">
        <div className="mx-auto max-w-[1800px] px-4 py-4 md:px-6">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl border border-orange-500/20 bg-orange-500/10">
                <Flame className="h-5 w-5 text-orange-400" />
              </div>

              <div>
                <div className="text-[22px] font-semibold tracking-tight">HQ Dashboard</div>
                <div className="text-xs text-white/45">Agent Command</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/60 md:flex md:items-center md:gap-2">
                <Target className="h-3.5 w-3.5" />
                <span>{activeGoalsCount} active clients</span>
              </div>

              <Link
                href="/usage"
                className="hidden md:flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/70 hover:bg-white/10 transition-colors"
              >
                <DollarSign className="h-4 w-4" />
                Usage
              </Link>

              <Button
                className="rounded-xl bg-emerald-500 font-medium text-black hover:bg-emerald-600"
                onClick={() => {
                  setCreateError(null)
                  setNewGoalTitle("")
                  setNewGoalOpen(true)
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                New Client
              </Button>
            </div>
          </div>

          <div className="mb-5 overflow-x-auto dark-scrollbar">
            <div className="flex min-w-max gap-2 rounded-2xl border border-white/10 bg-[#0A0D14] p-2">
              {AGENTS.map((a) => {
                const active = selectedAgent === a.id
                const Icon = a.icon

                return (
                  <button
                    key={a.id}
                    onClick={() => setSelectedAgent(a.id)}
                    className={[
                      "flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition-all",
                      active
                        ? "border-blue-500/40 bg-[#101826] text-white shadow-[0_0_0_1px_rgba(59,130,246,0.15)]"
                        : "border-white/10 bg-white/[0.03] text-white/70 hover:bg-white/[0.06] hover:text-white",
                    ].join(" ")}
                  >
                    <Icon
                      className={[
                        "h-4 w-4 transition-colors",
                        active ? a.iconClass : `${a.iconClass} opacity-70`,
                      ].join(" ")}
                    />
                    <span className="whitespace-nowrap">{a.label}</span>
                    <span
                      className={[
                        "ml-1 h-2 w-2 rounded-full",
                        active ? "bg-emerald-400" : "bg-white/20",
                      ].join(" ")}
                    />
                  </button>
                )
              })}
            </div>
          </div>

          <div className="grid items-stretch gap-4 xl:grid-cols-[300px_300px_minmax(0,1fr)]">
            <div className="h-[calc(100vh-170px)] min-h-[720px]">
              <Card className="h-full border-white/10 bg-[#0A0D14] shadow-none">
                <CardHeader className="border-b border-white/5 pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-white/80">
                      <ChevronLeft className="h-4 w-4 text-white/35" />
                      <CardTitle className="text-sm font-medium tracking-wide">CLIENTS</CardTitle>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="rounded-md bg-white/5 px-2 py-0.5 text-[11px] text-white/50">
                        {goals.length}
                      </span>
                      <button
                        className="rounded-md p-1 text-white/40 hover:bg-white/5 hover:text-white/70"
                        onClick={() => {
                          setCreateError(null)
                          setNewGoalTitle("")
                          setNewGoalOpen(true)
                        }}
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {selectedGoalId ? (
                    <button
                      className="mt-3 text-left text-[11px] text-blue-400 hover:text-blue-300"
                      onClick={() => pickGoal(null)}
                    >
                      Clear filter (1)
                    </button>
                  ) : null}
                </CardHeader>

                <CardContent className="dark-scrollbar h-[calc(100%-73px)] space-y-3 overflow-y-auto pt-4">
                  <button
                    className={[
                      "w-full rounded-2xl border px-4 py-3 text-left transition-all",
                      selectedGoalId === null
                        ? "border-blue-500/40 bg-[#101826]"
                        : "border-white/10 bg-white/[0.03] hover:bg-white/[0.05]",
                    ].join(" ")}
                    onClick={() => pickGoal(null)}
                  >
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-white/50" />
                      <span className="text-sm font-medium text-white/90">All Clients</span>
                    </div>
                  </button>

                  {goalsLoading ? (
                    <div className="text-xs text-white/45">Loading clients...</div>
                  ) : goalsError ? (
                    <div className="text-xs text-red-400">{goalsError}</div>
                  ) : (
                    goals.map((g) => {
                      const active = selectedGoalId === g.id
                      const assetsExpanded = assetsOpen === g.id
                      const goalAssets = assetsByGoal[g.id] ?? []
                      const logo = goalAssets.find(a => a.asset_type === "logo")
                      const photos = goalAssets.filter(a => a.asset_type === "photo")

                      return (
                        <div key={g.id} className={[
                          "rounded-2xl border transition-all",
                          active ? "border-blue-500/40 bg-[#101826] shadow-[0_0_0_1px_rgba(59,130,246,0.12)]" : "border-white/10 bg-white/[0.03]",
                        ].join(" ")}>
                          {/* Main card clickable area */}
                          <div className="w-full px-4 py-3 text-left cursor-pointer hover:bg-white/[0.02] rounded-2xl" onClick={() => pickGoal(g.id)}>
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0 flex items-center gap-2">
                                {/* Logo thumbnail if exists */}
                                {logo ? (
                                  <img src={logo.file_url} className="h-7 w-7 rounded-md object-contain bg-white/5 border border-white/10 shrink-0" alt="logo" />
                                ) : (
                                  <div className="h-7 w-7 rounded-md bg-white/5 border border-white/10 shrink-0 flex items-center justify-center">
                                    <ImageIcon className="h-3.5 w-3.5 text-white/20" />
                                  </div>
                                )}
                                <div className="min-w-0">
                                  <div className="truncate text-sm font-medium text-white/90">{g.title}</div>
                                  <span className={[
                                    "rounded-full px-2 py-0.5 text-[10px] font-medium",
                                    g.status === "done" ? "bg-emerald-500/15 text-emerald-300"
                                    : g.status === "paused" ? "bg-yellow-500/15 text-yellow-300"
                                    : "bg-blue-500/15 text-blue-300",
                                  ].join(" ")}>
                                    {g.status ?? "active"}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                {/* Assets toggle button */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    if (!assetsExpanded) loadAssetsForGoal(g.id)
                                    setAssetsOpen(assetsExpanded ? null : g.id)
                                  }}
                                  className={[
                                    "rounded-lg border px-1.5 py-1 text-[10px] flex items-center gap-1 transition-all",
                                    assetsExpanded
                                      ? "border-violet-500/30 bg-violet-500/15 text-violet-300"
                                      : goalAssets.length > 0
                                      ? "border-violet-500/20 bg-violet-500/8 text-violet-400/70"
                                      : "border-white/10 bg-white/5 text-white/35 hover:text-white/60",
                                  ].join(" ")}
                                  title="Client Assets"
                                >
                                  <ImagePlus className="h-3 w-3" />
                                  {goalAssets.length > 0 ? goalAssets.length : ""}
                                </button>
                              </div>
                            </div>

                            <div className="mt-3 flex items-center gap-1.5">
                              <Sparkles className="h-3.5 w-3.5 text-violet-400/80" />
                              <PenSquare className="h-3.5 w-3.5 text-emerald-400/80" />
                              <Palette className="h-3.5 w-3.5 text-pink-400/80" />
                              <ImageIcon className="h-3.5 w-3.5 text-cyan-400/80" />
                              <PanelsTopLeft className="h-3.5 w-3.5 text-amber-400/80" />
                              <PanelsTopLeft className="h-3.5 w-3.5 text-orange-400/80" />
                              <Video className="h-3.5 w-3.5 text-red-400/80" />
                              <ShieldCheck className="h-3.5 w-3.5 text-lime-400/80" />
                            </div>
                          </div>

                          {/* Assets panel */}
                          {assetsExpanded && (
                            <div className="border-t border-white/5 px-4 py-3" onClick={e => e.stopPropagation()}>
                              <div className="mb-2 flex items-center justify-between">
                                <span className="text-[10px] font-medium uppercase tracking-wider text-white/40">Client Assets</span>
                                {assetError && <span className="text-[10px] text-red-400">{assetError}</span>}
                              </div>

                              {/* Logo section */}
                              <div className="mb-3">
                                <div className="mb-1.5 text-[10px] text-white/40">Logo</div>
                                {logo ? (
                                  <div className="flex items-center gap-2">
                                    <img src={logo.file_url} className="h-10 w-20 rounded-lg object-contain bg-white/5 border border-white/10" alt="logo" />
                                    <button onClick={() => deleteAsset(g.id, logo.id)} className="text-white/30 hover:text-red-400 transition-colors">
                                      <X className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex flex-col gap-1.5">
                                    <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-white/15 bg-white/[0.02] px-3 py-2 text-xs text-white/40 hover:border-violet-500/30 hover:text-violet-400/70 transition-all">
                                      <Upload className="h-3.5 w-3.5" />
                                      Upload logo
                                      <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                                        const file = e.target.files?.[0]
                                        if (file) await uploadAsset(g.id, file, "logo")
                                        e.target.value = ""
                                      }} />
                                    </label>

                                    {/* AI Generate toggle */}
                                    {logoGenOpen !== g.id ? (
                                      <button
                                        onClick={() => {
                                          setLogoGenOpen(g.id)
                                          setLogoBrandName(g.title)
                                          setLogoDescription("")
                                        }}
                                        className="flex items-center gap-2 rounded-lg border border-dashed border-violet-500/20 bg-violet-500/5 px-3 py-2 text-xs text-violet-400/70 hover:border-violet-500/40 hover:bg-violet-500/10 hover:text-violet-300 transition-all"
                                      >
                                        <Sparkles className="h-3.5 w-3.5" />
                                        Generate logo with AI
                                      </button>
                                    ) : (
                                      <div className="rounded-lg border border-violet-500/25 bg-violet-500/8 p-3 flex flex-col gap-2">
                                        <div className="flex items-center justify-between">
                                          <span className="text-[10px] font-medium text-violet-300/80 uppercase tracking-wider">AI Logo Generator</span>
                                          <button onClick={() => setLogoGenOpen(null)} className="text-white/30 hover:text-white/60">
                                            <X className="h-3 w-3" />
                                          </button>
                                        </div>
                                        <input
                                          placeholder="Brand name..."
                                          value={logoBrandName}
                                          onChange={e => setLogoBrandName(e.target.value)}
                                          className="rounded-md border border-white/10 bg-black/30 px-2.5 py-1.5 text-xs text-white placeholder-white/30 outline-none focus:border-violet-500/50"
                                        />
                                        <textarea
                                          placeholder="Description (optional) — e.g. luxury real estate, blue and gold colors, modern style..."
                                          value={logoDescription}
                                          onChange={e => setLogoDescription(e.target.value)}
                                          rows={2}
                                          className="rounded-md border border-white/10 bg-black/30 px-2.5 py-1.5 text-xs text-white placeholder-white/30 outline-none focus:border-violet-500/50 resize-none"
                                        />
                                        <button
                                          onClick={() => generateLogo(g.id, logoBrandName || g.title, logoDescription)}
                                          disabled={generatingLogo || !logoBrandName.trim()}
                                          className="flex items-center justify-center gap-2 rounded-md bg-violet-500/20 border border-violet-500/30 px-3 py-1.5 text-xs text-violet-200 hover:bg-violet-500/30 transition-all disabled:opacity-50"
                                        >
                                          {generatingLogo ? (
                                            <>
                                              <span className="h-3 w-3 animate-spin rounded-full border-2 border-violet-300 border-t-transparent" />
                                              Generating...
                                            </>
                                          ) : (
                                            <>
                                              <Sparkles className="h-3 w-3" />
                                              Generate
                                            </>
                                          )}
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>

                              {/* Photos section */}
                              <div>
                                <div className="mb-1.5 text-[10px] text-white/40">Property Photos ({photos.length})</div>
                                <div className="flex flex-wrap gap-1.5">
                                  {photos.map(p => (
                                    <div key={p.id} className="relative group">
                                      <img src={p.file_url} className="h-12 w-12 rounded-lg object-cover border border-white/10" alt={p.name} />
                                      <button
                                        onClick={() => deleteAsset(g.id, p.id)}
                                        className="absolute -top-1 -right-1 hidden group-hover:flex items-center justify-center h-4 w-4 rounded-full bg-red-500 text-white"
                                      >
                                        <X className="h-2.5 w-2.5" />
                                      </button>
                                    </div>
                                  ))}
                                  <label className="flex h-12 w-12 cursor-pointer items-center justify-center rounded-lg border border-dashed border-white/15 bg-white/[0.02] text-white/30 hover:border-violet-500/30 hover:text-violet-400/70 transition-all">
                                    {uploadingAsset ? (
                                      <span className="h-3 w-3 animate-spin rounded-full border-2 border-violet-400 border-t-transparent" />
                                    ) : (
                                      <Plus className="h-4 w-4" />
                                    )}
                                    <input type="file" accept="image/*" multiple className="hidden" onChange={async (e) => {
                                      const files = Array.from(e.target.files ?? [])
                                      for (const file of files) await uploadAsset(g.id, file, "photo")
                                      e.target.value = ""
                                    }} />
                                  </label>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="h-[calc(100vh-170px)] min-h-[720px]">
              <Card className="h-full border-white/10 bg-[#0A0D14] shadow-none">
                <CardHeader className="border-b border-white/5 pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-white/80">
                      <ChevronLeft className="h-4 w-4 text-white/35" />
                      <CardTitle className="text-sm font-medium tracking-wide">ACTIVITY</CardTitle>
                    </div>
                    <span className="rounded-md bg-white/5 px-2 py-0.5 text-[11px] text-white/50">
                      {activity.length}
                    </span>
                  </div>
                </CardHeader>

                <CardContent className="dark-scrollbar h-[calc(100%-73px)] space-y-4 overflow-y-auto pt-4 text-white/80">
                  {activityLoading ? (
                    <div className="text-xs text-white/45">Loading activity...</div>
                  ) : activityError ? (
                    <div className="text-xs text-red-400">{activityError}</div>
                  ) : activity.length === 0 ? (
                    <div className="text-xs text-white/35">No activity yet</div>
                  ) : (
                    activity.map((item) => (
                      <div key={item.id} className="border-b border-white/5 pb-4 last:border-b-0">
                        <div className="flex items-start gap-2">
                          <div className="mt-1 h-2 w-2 rounded-full bg-white/40" />
                          <div className="min-w-0">
                            <div className="text-sm leading-6 text-white/85">{prettifyActivity(item)}</div>
                            <div className="mt-1 text-[11px] text-white/35">{formatTimeAgo(item.created)}</div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="h-[calc(100vh-170px)] min-h-[720px] min-w-0">
              <KanbanBoard
                goalId={selectedGoalId}
                agent={selectedAgent === "all" ? null : selectedAgent}
                goals={goals.map((g) => ({ id: g.id, title: g.title }))}
              />
            </div>
          </div>
        </div>

        <Dialog open={newGoalOpen} onOpenChange={setNewGoalOpen}>
          <DialogContent className="border-white/10 bg-[#0B0F18] text-white">
            <DialogHeader>
              <DialogTitle>New Client</DialogTitle>
            </DialogHeader>

            <div className="space-y-2">
              <Label htmlFor="goalTitle" className="text-white/80">
                Title
              </Label>
              <Input
                id="goalTitle"
                value={newGoalTitle}
                onChange={(e) => setNewGoalTitle(e.target.value)}
                placeholder="למשל: קמפיין חדש..."
                className="border-white/10 bg-black/30 text-white"
                onKeyDown={(e) => {
                  if (e.key === "Enter") createGoal()
                }}
              />
              {createError ? <div className="text-xs text-red-400">{createError}</div> : null}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                className="border-white/15 bg-white/5 text-white hover:bg-white/10"
                onClick={() => setNewGoalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                className="bg-emerald-500 text-black hover:bg-emerald-600"
                onClick={createGoal}
                disabled={creatingGoal}
              >
                {creatingGoal ? "Creating..." : "Create Client"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </>
  )
}