"use client"

import * as React from "react"
import { pb } from "@/lib/pb"
import { Flame, TrendingUp, Image as ImageIcon, PenSquare, Video, LayoutTemplate, Palette, ShieldCheck, DollarSign, BarChart2, RefreshCw } from "lucide-react"
import Link from "next/link"

// ── Cost estimates per task type (USD) ───────────────────────────────────────
const COST_MAP: Record<string, { label: string; cost: number; icon: React.ReactNode; color: string }> = {
  campaign_plan:      { label: "Campaign Plan",   cost: 0.02, icon: <Flame className="h-4 w-4" />,          color: "text-orange-400" },
  ad_copy:            { label: "Ad Copy",          cost: 0.03, icon: <PenSquare className="h-4 w-4" />,      color: "text-emerald-400" },
  article:            { label: "Article",          cost: 0.04, icon: <PenSquare className="h-4 w-4" />,      color: "text-emerald-400" },
  visual_prompts:     { label: "Visual Direction", cost: 0.02, icon: <Palette className="h-4 w-4" />,        color: "text-pink-400" },
  background_images:  { label: "AI Images",        cost: 0.15, icon: <ImageIcon className="h-4 w-4" />,      color: "text-cyan-400" },
  banner_set:         { label: "Banners",          cost: 0.20, icon: <LayoutTemplate className="h-4 w-4" />, color: "text-amber-400" },
  banner_composer:    { label: "Banner Composer",  cost: 0.10, icon: <LayoutTemplate className="h-4 w-4" />, color: "text-amber-300" },
  landing_page:       { label: "Landing Page",     cost: 0.05, icon: <LayoutTemplate className="h-4 w-4" />, color: "text-blue-400" },
  video:              { label: "Video",            cost: 0.45, icon: <Video className="h-4 w-4" />,          color: "text-purple-400" },
  qa_review:          { label: "QA Review",        cost: 0.02, icon: <ShieldCheck className="h-4 w-4" />,    color: "text-green-400" },
}

const FULL_CAMPAIGN_COST = Object.values(COST_MAP).reduce((s, v) => s + v.cost, 0)

type TaskRecord = {
  id: string
  type?: string
  assigned_agent?: string
  status?: string
  created?: string
  goal_id?: string
}

type GoalRecord = {
  id: string
  title: string
}

function fmt(n: number) {
  return `$${n.toFixed(2)}`
}

function fmtMonth(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric" })
}

export default function UsagePage() {
  const [tasks, setTasks] = React.useState<TaskRecord[]>([])
  const [goals, setGoals] = React.useState<GoalRecord[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  async function loadData() {
    setLoading(true)
    setError(null)
    try {
      const [tasksRes, goalsRes] = await Promise.all([
        pb.collection("tasks").getFullList<TaskRecord>({ sort: "-created", fields: "id,type,assigned_agent,status,created,goal_id" }),
        pb.collection("goals").getFullList<GoalRecord>({ sort: "-created", fields: "id,title" }),
      ])
      setTasks(tasksRes)
      setGoals(goalsRes)
    } catch (e: any) {
      setError(e?.message || "Failed to load data")
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => { loadData() }, [])

  const doneTasks = tasks.filter(t => t.status === "done")

  // Count by type
  const countByType: Record<string, number> = {}
  for (const t of doneTasks) {
    const key = t.type || t.assigned_agent || "unknown"
    countByType[key] = (countByType[key] || 0) + 1
  }

  // Total estimated cost
  const totalCost = Object.entries(countByType).reduce((sum, [type, count]) => {
    return sum + (COST_MAP[type]?.cost || 0.02) * count
  }, 0)

  // Cost by month
  const costByMonth: Record<string, number> = {}
  for (const t of doneTasks) {
    if (!t.created) continue
    const month = fmtMonth(t.created)
    const key = t.type || t.assigned_agent || "unknown"
    costByMonth[month] = (costByMonth[month] || 0) + (COST_MAP[key]?.cost || 0.02)
  }
  const months = Object.entries(costByMonth).sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
  const maxMonthCost = Math.max(...months.map(m => m[1]), 1)

  // Cost by client
  const goalMap = Object.fromEntries(goals.map(g => [g.id, g.title]))
  const costByGoal: Record<string, { title: string; cost: number; count: number }> = {}
  for (const t of doneTasks) {
    if (!t.goal_id) continue
    const key = t.goal_id
    if (!costByGoal[key]) costByGoal[key] = { title: goalMap[key] || "Unknown", cost: 0, count: 0 }
    const type = t.type || t.assigned_agent || "unknown"
    costByGoal[key].cost += COST_MAP[type]?.cost || 0.02
    costByGoal[key].count++
  }
  const topClients = Object.values(costByGoal).sort((a, b) => b.cost - a.cost).slice(0, 8)

  // This month stats
  const thisMonth = fmtMonth(new Date().toISOString())
  const thisMonthTasks = doneTasks.filter(t => t.created && fmtMonth(t.created) === thisMonth)
  const thisMonthCost = thisMonthTasks.reduce((sum, t) => {
    const key = t.type || t.assigned_agent || "unknown"
    return sum + (COST_MAP[key]?.cost || 0.02)
  }, 0)
  const thisMonthCampaigns = thisMonthTasks.filter(t => t.type === "campaign_plan").length

  return (
    <>
      <style>{`
        html, body { background: #05070B; }
        .dark-scrollbar { scrollbar-width: thin; scrollbar-color: rgba(255,255,255,0.18) #0a0d14; }
      `}</style>
      <main className="min-h-screen bg-[#05070B] text-white">
        <div className="mx-auto max-w-[1400px] px-4 py-6 md:px-6">

          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10">
                <DollarSign className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <div className="text-xl font-semibold">Usage & Costs</div>
                <div className="text-xs text-white/45">Estimated AI spend per task and campaign</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/" className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70 hover:bg-white/10">
                ← Dashboard
              </Link>
              <button onClick={loadData} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70 hover:bg-white/10">
                <RefreshCw className="h-3.5 w-3.5" />
                Refresh
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20 text-white/40">Loading usage data...</div>
          ) : error ? (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-red-400">{error}</div>
          ) : (
            <>
              {/* Top stats */}
              <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
                {[
                  { label: "Total Estimated Spend", value: fmt(totalCost), sub: "all time", color: "border-emerald-500/20 bg-emerald-500/5", icon: <DollarSign className="h-5 w-5 text-emerald-400" /> },
                  { label: "This Month", value: fmt(thisMonthCost), sub: `${thisMonthTasks.length} tasks`, color: "border-blue-500/20 bg-blue-500/5", icon: <TrendingUp className="h-5 w-5 text-blue-400" /> },
                  { label: "Campaigns This Month", value: String(thisMonthCampaigns), sub: `avg ${thisMonthCampaigns ? fmt(thisMonthCost / thisMonthCampaigns) : "$0.00"}/campaign`, color: "border-purple-500/20 bg-purple-500/5", icon: <BarChart2 className="h-5 w-5 text-purple-400" /> },
                  { label: "Tasks Completed", value: String(doneTasks.length), sub: `full campaign ≈ ${fmt(FULL_CAMPAIGN_COST)}`, color: "border-amber-500/20 bg-amber-500/5", icon: <ShieldCheck className="h-5 w-5 text-amber-400" /> },
                ].map(s => (
                  <div key={s.label} className={`rounded-2xl border p-4 ${s.color}`}>
                    <div className="mb-2 flex items-center gap-2">{s.icon}<span className="text-xs text-white/50">{s.label}</span></div>
                    <div className="text-2xl font-bold text-white">{s.value}</div>
                    <div className="mt-1 text-xs text-white/40">{s.sub}</div>
                  </div>
                ))}
              </div>

              <div className="grid gap-6 md:grid-cols-2">

                {/* Cost by task type */}
                <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
                  <div className="mb-4 text-sm font-medium text-white/70">Cost by Task Type</div>
                  <div className="space-y-3">
                    {Object.entries(COST_MAP).map(([type, info]) => {
                      const count = countByType[type] || 0
                      const cost = info.cost * count
                      return (
                        <div key={type} className="flex items-center gap-3">
                          <div className={`w-5 shrink-0 ${info.color}`}>{info.icon}</div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-sm text-white/80">{info.label}</span>
                              <span className="text-sm font-medium text-white">{fmt(cost)}</span>
                            </div>
                            <div className="mt-1 flex items-center justify-between gap-2">
                              <div className="h-1 flex-1 rounded-full bg-white/10">
                                <div className="h-1 rounded-full bg-white/30" style={{ width: `${Math.min(100, (cost / (totalCost || 1)) * 100)}%` }} />
                              </div>
                              <span className="w-16 text-right text-xs text-white/40">{count}× @ {fmt(info.cost)}</span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  <div className="mt-4 border-t border-white/10 pt-3 flex items-center justify-between">
                    <span className="text-sm text-white/50">Total</span>
                    <span className="text-lg font-bold text-emerald-400">{fmt(totalCost)}</span>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Monthly spend chart */}
                  <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
                    <div className="mb-4 text-sm font-medium text-white/70">Monthly Spend</div>
                    {months.length === 0 ? (
                      <div className="text-sm text-white/30">No data yet</div>
                    ) : (
                      <div className="flex items-end gap-2" style={{ height: "100px" }}>
                        {months.map(([month, cost]) => (
                          <div key={month} className="flex flex-1 flex-col items-center gap-1">
                            <div className="text-xs text-white/50">{fmt(cost)}</div>
                            <div
                              className="w-full rounded-t-md bg-emerald-500/50 hover:bg-emerald-500/70 transition-all"
                              style={{ height: `${Math.max(4, (cost / maxMonthCost) * 70)}px` }}
                              title={`${month}: ${fmt(cost)}`}
                            />
                            <div className="text-[10px] text-white/30">{month}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Cost by client */}
                  <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
                    <div className="mb-4 text-sm font-medium text-white/70">Cost by Client</div>
                    {topClients.length === 0 ? (
                      <div className="text-sm text-white/30">No client data yet</div>
                    ) : (
                      <div className="space-y-2">
                        {topClients.map(({ title, cost, count }) => (
                          <div key={title} className="flex items-center justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between">
                                <span className="truncate text-sm text-white/80">{title}</span>
                                <span className="ml-2 shrink-0 text-sm font-medium text-white">{fmt(cost)}</span>
                              </div>
                              <div className="mt-1 h-1 w-full rounded-full bg-white/10">
                                <div className="h-1 rounded-full bg-blue-500/50" style={{ width: `${Math.min(100, (cost / (topClients[0]?.cost || 1)) * 100)}%` }} />
                              </div>
                            </div>
                            <span className="shrink-0 text-xs text-white/30">{count} tasks</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Cost reference card */}
                  <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4">
                    <div className="mb-2 text-xs font-medium text-amber-400">💡 Pricing Reference</div>
                    <div className="space-y-1 text-xs text-white/60">
                      <div className="flex justify-between"><span>Full campaign (all tasks)</span><span className="text-white/80">{fmt(FULL_CAMPAIGN_COST)}</span></div>
                      <div className="flex justify-between"><span>Images are the biggest cost</span><span className="text-white/80">${COST_MAP.background_images.cost}/run</span></div>
                      <div className="flex justify-between"><span>Video (Creatomate)</span><span className="text-white/80">${COST_MAP.video.cost}/run</span></div>
                      <div className="mt-2 pt-2 border-t border-white/10 text-white/40">
                        These are estimates based on typical API usage. Actual costs vary by content length and model calls.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </>
  )
}
