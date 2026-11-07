import { createFileRoute } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { PlusIcon, Trash2Icon, UserRoundIcon, Wand2Icon, XIcon } from 'lucide-react'
import { toast } from '@/lib/notifications'
import { PageHeader } from '@/components/common/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import { referenceImageUrl } from '@/lib/recipeImages'
import { useStudio } from '@/store/studioStore'
import {
  aichanCharactersQuery,
  aichanCostumesQuery,
  aichanInherentQuery,
  aichanPortraitsQuery,
  aichanSlotTaxonomyQuery,
} from '@/api/gallery'
import {
  buildInitialDressup,
  buildSlotSkeleton,
  decorationPool,
  fillSlotsWithSubject,
  pickFrontView,
  subjectDecorations,
  subjectExpressions,
  subjectInherentItems,
  subjectViews,
} from '@/lib/dressup'
import type { CostumeItem, DressupState, PortraitItem } from '@/types/gallery'

export const Route = createFileRoute('/dressup')({
  staticData: { title: 'aichan 換裝' },
  validateSearch: (search: Record<string, unknown>): { subject?: string; apply?: string } => ({
    ...(typeof search.subject === 'string' && search.subject ? { subject: search.subject } : {}),
    ...(typeof search.apply === 'string' && search.apply ? { apply: search.apply } : {}),
  }),
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(aichanCharactersQuery),
      context.queryClient.ensureQueryData(aichanPortraitsQuery),
      context.queryClient.ensureQueryData(aichanCostumesQuery),
      context.queryClient.ensureQueryData(aichanInherentQuery),
      context.queryClient.ensureQueryData(aichanSlotTaxonomyQuery),
    ]),
  component: DressupPage,
})

function viewLabel(v: PortraitItem): string {
  if (v.标题.includes('正面')) return '正面'
  if (v.标题.includes('侧面')) return '侧面'
  if (v.标题.includes('背面')) return '背面'
  return v.标题 || '视图'
}

/** 小型縮略圖（不可選，僅展示） */
function Thumb({ src, label, size = 'w-16' }: { src: string; label: string; size?: string }) {
  return (
    <div className={cn('flex flex-col items-center gap-1', size)}>
      <div className="aspect-4/5 w-full overflow-hidden rounded-md bg-white">
        <img src={referenceImageUrl(src)} alt={label} loading="lazy" className="h-full w-full object-contain" />
      </div>
      <span className="w-full truncate text-center text-[10px] leading-tight text-muted-foreground">{label}</span>
    </div>
  )
}

/** 可選縮略圖（三视图 / 表情） */
function SelectThumb({
  src,
  label,
  active,
  onClick,
  size = 'w-24',
}: {
  src: string
  label: string
  active: boolean
  onClick: () => void
  size?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn('flex shrink-0 flex-col items-center gap-1 rounded-lg p-1 transition', size, active ? 'bg-primary/10 ring-2 ring-primary' : 'opacity-70 hover:opacity-100')}
    >
      <div className="aspect-4/5 w-full overflow-hidden rounded-md bg-white">
        <img src={referenceImageUrl(src)} alt={label} loading="lazy" className="h-full w-full object-contain" />
      </div>
      <span className="w-full truncate text-center text-[11px] leading-tight">{label}</span>
    </button>
  )
}

function DressupPage() {
  const { data: characters } = useSuspenseQuery(aichanCharactersQuery)
  const { data: portraits } = useSuspenseQuery(aichanPortraitsQuery)
  const { data: aichanCostumes } = useSuspenseQuery(aichanCostumesQuery)
  const { data: inherent } = useSuspenseQuery(aichanInherentQuery)
  const { data: taxonomy } = useSuspenseQuery(aichanSlotTaxonomyQuery)

  const {
    recipe,
    setDressup,
    useSubfields,
    toggleSubfields,
    startGeneration,
    isGenerating,
    generationProgress,
    generationError,
    previewUrl,
  } = useStudio()

  const dressup = recipe.dressup
  const [pickerSlot, setPickerSlot] = useState<string | null>(null)
  const [showExpressions, setShowExpressions] = useState(false)
  const { subject: presetSubject, apply: presetApply } = Route.useSearch()
  const seeded = useRef<{ subject?: string; apply?: string }>({})

  const charName = useMemo(() => {
    const m = new Map<string, string>()
    for (const c of characters) m.set(c.key, c.角色名)
    return m
  }, [characters])

  const pool = useMemo(() => decorationPool(aichanCostumes, inherent, taxonomy), [aichanCostumes, inherent, taxonomy])

  const candidates = useMemo(() => {
    const map = new Map<string, { item: CostumeItem; ownerName: string }[]>()
    for (const [slot, list] of pool) {
      map.set(slot, list.map((c) => ({ item: c.item, ownerName: charName.get(c.owner) ?? c.owner })))
    }
    return map
  }, [pool, charName])

  const selectSubject = useCallback(
    (key: string) => {
      if (!useSubfields) toggleSubfields()
      const state = buildInitialDressup(key, aichanCostumes, portraits, inherent, taxonomy)
      setDressup(state)
      toast.success(`已選主體：${charName.get(key) ?? key}`)
    },
    [useSubfields, toggleSubfields, setDressup, aichanCostumes, portraits, inherent, taxonomy, charName]
  )

  /** A 主體 + B 全套裝飾（一鍵） */
  const applyOtherDecorations = useCallback(
    (otherKey: string) => {
      if (!dressup) return
      const deco = subjectDecorations(otherKey, aichanCostumes, inherent, taxonomy)
      const slots = fillSlotsWithSubject(buildSlotSkeleton(taxonomy), deco)
      setDressup({ ...dressup, slots })
      toast.success(`已套用 ${charName.get(otherKey) ?? otherKey} 的全套裝飾`)
    },
    [dressup, setDressup, aichanCostumes, inherent, taxonomy, charName]
  )

  // 進入頁面時自動決定主體與待套用配飾（只觸發一次）：
  // 1) 主體來源優先序：search.subject > 既有 dressup.subject > 已選 aichan 形象（recipe.portrait）
  // 2) 主體就緒後，若帶 apply（＝B 全套裝飾），套用到當前主體（A 主體 + B 全套裝飾）
  useEffect(() => {
    const inheritSubject = recipe.portrait?.source === 'aichan' ? recipe.portrait.角色 : undefined
    const currentSubject = recipe.dressup?.subject
    const targetSubject = presetSubject ?? currentSubject ?? inheritSubject

    if (targetSubject && targetSubject !== currentSubject && seeded.current.subject !== targetSubject) {
      seeded.current.subject = targetSubject
      selectSubject(targetSubject)
      return
    }

    if (presetApply && currentSubject && presetApply !== currentSubject && seeded.current.apply !== presetApply) {
      seeded.current.apply = presetApply
      applyOtherDecorations(presetApply)
    }
  }, [presetSubject, presetApply, recipe.portrait, recipe.dressup?.subject, selectSubject, applyOtherDecorations])

  const update = (patch: Partial<DressupState>) => {
    if (!dressup) return
    setDressup({ ...dressup, ...patch })
  }

  const setSlotItems = (slotId: string, items: CostumeItem[]) => {
    if (!dressup) return
    setDressup({ ...dressup, slots: dressup.slots.map((s) => (s.slotId === slotId ? { ...s, items } : s)) })
  }

  const addToSlot = (slotId: string, item: CostumeItem) => {
    if (!dressup) return
    const slot = dressup.slots.find((s) => s.slotId === slotId)
    if (!slot || slot.items.some((i) => i.id === item.id)) return
    setSlotItems(slotId, [...slot.items, item])
  }

  const removeFromSlot = (slotId: string, itemId: string) => {
    if (!dressup) return
    const slot = dressup.slots.find((s) => s.slotId === slotId)
    if (!slot) return
    setSlotItems(slotId, slot.items.filter((i) => i.id !== itemId))
  }

  const clearSlot = (slotId: string) => setSlotItems(slotId, [])
  const clearAll = () => {
    if (!dressup) return
    setDressup({ ...dressup, slots: dressup.slots.map((s) => ({ ...s, items: [] })) })
    toast.success('已清空全部裝飾（固有不變）')
  }
  const restoreDefault = () => {
    if (!dressup) return
    setDressup(buildInitialDressup(dressup.subject, aichanCostumes, portraits, inherent, taxonomy))
    toast.success('已還原本體默認著裝')
  }

  const subjectViewsList = dressup ? subjectViews(dressup.subject, portraits) : []
  const subjectExpressionsList = dressup ? subjectExpressions(dressup.subject, portraits) : []
  const totalDecorations = dressup ? dressup.slots.reduce((n, s) => n + s.items.length, 0) : 0

  const canGenerate = totalDecorations > 0 || Boolean(dressup?.subjectView)

  if (!dressup) {
    return (
      <>
        <PageHeader title="aichan 換裝" description="選定主體 AI 形象，自由替換裝飾（固有部分隨主體固定）" />
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7">
          {characters.map((c) => {
            const { parts, optional, hair } = subjectInherentItems(c.key, aichanCostumes, inherent)
            const front = pickFrontView(subjectViews(c.key, portraits))
            return (
              <button
                key={c.key}
                type="button"
                onClick={() => selectSubject(c.key)}
                className="group flex flex-col overflow-hidden rounded-[16px] bg-muted p-2 text-left transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="aspect-4/5 w-full overflow-hidden rounded-lg bg-white">
                  {front ? (
                    <img src={referenceImageUrl(front.缩略图)} alt={c.角色名} loading="lazy" className="h-full w-full object-contain transition group-hover:scale-105" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                      <UserRoundIcon className="size-8" />
                    </div>
                  )}
                </div>
                <div className="mt-1.5 truncate text-[13px] font-semibold leading-snug">{c.角色名}</div>
                <div className="mt-0.5 flex flex-wrap gap-1">
                  {c.品牌 && <Badge variant="outline" className="text-[9px]">{c.品牌}</Badge>}
                  {parts.length > 0 && <Badge variant="secondary" className="text-[9px]">固有×{parts.length}</Badge>}
                  {optional.length > 0 && <Badge variant="outline" className="text-[9px]">翼可選</Badge>}
                  {hair.length > 0 && <Badge variant="outline" className="text-[9px]">髮可選</Badge>}
                  {parts.length === 0 && optional.length === 0 && hair.length === 0 && <Badge variant="outline" className="text-[9px] text-muted-foreground">無固有</Badge>}
                </div>
              </button>
            )
          })}
        </div>
      </>
    )
  }

  return (
    <>
      <PageHeader title="aichan 換裝" description="固有（耳/尾/翼/面部特徵）隨主體固定；裝飾自上而下自由替換" />

      {/* 頂部工具欄：操作 + 生成 */}
      <section className="flex flex-wrap items-center gap-2 rounded-[16px] bg-muted p-2">
        <span className="shrink-0 text-xs font-semibold">一鍵換裝：A 主體 + B 全套裝飾</span>
        <Select value="" onValueChange={applyOtherDecorations}>
          <SelectTrigger className="h-8 w-44 bg-background text-xs">
            <SelectValue placeholder="選角色 B / C / D…" />
          </SelectTrigger>
          <SelectContent>
            {characters.filter((c) => c.key !== dressup.subject).map((c) => (
              <SelectItem key={c.key} value={c.key}>{c.角色名}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" className="h-8" onClick={restoreDefault}>
          <Wand2Icon className="size-3.5" /> 還原本體
        </Button>
        <Button variant="destructive" size="sm" className="h-8" onClick={clearAll}>
          <Trash2Icon className="size-3.5" /> 一鍵清空裝飾
        </Button>
        <div className="flex flex-wrap items-center gap-1.5 rounded-lg bg-background px-2 py-1">
          <span className="shrink-0 text-[10px] text-muted-foreground">開關</span>
          {dressup.wings.length > 0 && (
            <label className="flex shrink-0 cursor-pointer items-center gap-1 text-[11px]">
              <Switch checked={dressup.wingsOn} onCheckedChange={(v) => update({ wingsOn: v })} />
              翅膀
            </label>
          )}
          {dressup.hair.length > 0 && (
            <label className="flex shrink-0 cursor-pointer items-center gap-1 text-[11px]">
              <Switch checked={dressup.hairOn} onCheckedChange={(v) => update({ hairOn: v })} />
              頭髮
            </label>
          )}
          {subjectViewsList.length > 0 && (
            <label className="flex shrink-0 cursor-pointer items-center gap-1 text-[11px]">
              <Switch
                checked={dressup.threeViewOn}
                onCheckedChange={(v) => update(v ? { threeViewOn: true } : { threeViewOn: false, subjectView: pickFrontView(subjectViewsList) })}
              />
              三視圖
            </label>
          )}
          {subjectExpressionsList.length > 0 && (
            <label className="flex shrink-0 cursor-pointer items-center gap-1 text-[11px]">
              <Switch
                checked={dressup.expressionOn}
                onCheckedChange={(v) => update(v ? { expressionOn: true, expression: dressup.expression ?? subjectExpressionsList[0] ?? null } : { expressionOn: false, expression: null })}
              />
              表情
            </label>
          )}
        </div>
        <div className="ml-auto flex items-center gap-2">
          {generationProgress && <span className="max-w-40 truncate text-xs text-muted-foreground">{generationProgress.message}</span>}
          {generationError && <span className="max-w-40 truncate text-xs text-destructive">{generationError}</span>}
          <Button size="sm" className="h-8" disabled={isGenerating || !canGenerate} onClick={() => void startGeneration()}>
            {isGenerating ? '生成中…' : '生成角色圖'}
          </Button>
        </div>
      </section>

      {/* 主體（橫排一塊） */}
      <section className="mt-2 rounded-[16px] bg-muted p-3">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">主體</span>
            <span className="text-xs text-muted-foreground">{charName.get(dressup.subject) ?? dressup.subject}</span>
            <Button variant="outline" size="sm" className="h-8 shrink-0" onClick={() => setDressup(null)}>
              <XIcon className="size-3.5" /> 更換主體
            </Button>
          </div>

          {subjectViewsList.length > 0 && dressup.threeViewOn && (
            <div className="flex flex-wrap items-end gap-1.5">
              <span className="mb-1 shrink-0 text-[11px] text-muted-foreground">三視圖</span>
              {subjectViewsList.map((v) => (
                <SelectThumb key={v.id} src={v.缩略图} label={viewLabel(v)} active={dressup.subjectView?.id === v.id} onClick={() => update({ subjectView: v })} size={showExpressions ? 'w-24' : 'w-40'} />
              ))}
            </div>
          )}

          <div className="flex flex-wrap items-end gap-1.5">
            <span className="mb-1 shrink-0 text-[11px] text-muted-foreground">固有</span>
            {[...dressup.inherent, ...(dressup.wingsOn ? dressup.wings : []), ...(dressup.hairOn ? dressup.hair : [])].map((i) => (
              <Thumb key={i.id} src={i.缩略图} label={i.服装名称} />
            ))}
            {dressup.inherent.length === 0 && dressup.wings.length === 0 && dressup.hair.length === 0 && (
              <span className="mb-1 text-[11px] text-muted-foreground">（人形，無固有）</span>
            )}
          </div>

          {subjectExpressionsList.length > 0 && dressup.expressionOn && (
            <div className="flex flex-wrap items-end gap-1.5">
              <label className="mb-1 flex shrink-0 cursor-pointer items-center gap-1.5 text-[11px] font-medium">
                <Switch checked={showExpressions} onCheckedChange={setShowExpressions} />
                表情（{subjectExpressionsList.length}）
              </label>
              {showExpressions && (
                <>
                  <button
                    type="button"
                    onClick={() => update({ expression: null })}
                    className={cn('flex w-24 shrink-0 flex-col items-center gap-1 rounded-lg p-1 transition', !dressup.expression ? 'bg-primary/10 ring-2 ring-primary' : 'opacity-70 hover:opacity-100')}
                  >
                    <div className="flex aspect-4/5 w-full items-center justify-center rounded-md bg-white text-sm text-muted-foreground">無</div>
                    <span className="w-full truncate text-center text-[11px] leading-tight">無表情</span>
                  </button>
                  {subjectExpressionsList.map((e) => (
                    <SelectThumb key={e.id} src={e.缩略图} label={e.发型名称 || e.标题} active={dressup.expression?.id === e.id} onClick={() => update({ expression: dressup.expression?.id === e.id ? null : e })} />
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      </section>

      {/* 裝飾（14 槽位，自上而下） */}
      <section className="mt-2">
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-sm font-semibold">裝飾（自上而下，點「＋」看縮略圖選）</span>
          <span className="text-xs text-muted-foreground">已選 {totalDecorations} 件</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {dressup.slots.map((slot) => (
            <div key={slot.slotId} className="flex items-center gap-1.5 rounded-lg border bg-background px-2 py-1">
              <span className="shrink-0 text-xs font-semibold">
                <span className="mr-1 font-mono text-[10px] text-muted-foreground">{slot.order}</span>
                {slot.slotLabel}
              </span>
              {slot.items.map((item) => (
                <div key={item.id} className="relative shrink-0">
                  <Thumb src={item.缩略图} label={item.服装名称} />
                  <button
                    type="button"
                    title="移除"
                    onClick={() => removeFromSlot(slot.slotId, item.id)}
                    className="absolute -right-1 -top-1 rounded-full bg-black/75 p-0.5 text-white shadow hover:bg-destructive"
                  >
                    <XIcon className="size-2.5" />
                  </button>
                </div>
              ))}
              {slot.items.length === 0 && <span className="text-[10px] text-muted-foreground">（空）</span>}
              <button
                type="button"
                title="添加配飾"
                onClick={() => setPickerSlot(slot.slotId)}
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground transition hover:bg-primary hover:text-primary-foreground"
              >
                <PlusIcon className="size-3" />
              </button>
              {slot.items.length > 0 && (
                <button
                  type="button"
                  title="清空此槽"
                  onClick={() => clearSlot(slot.slotId)}
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground transition hover:bg-destructive hover:text-white"
                >
                  <XIcon className="size-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 生成結果預覽（僅展示 API 生成後的結果） */}
      {previewUrl && (
        <section className="mt-2 overflow-hidden rounded-[16px] bg-muted p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-semibold">生成結果</span>
          </div>
          <img src={previewUrl} alt="生成結果" className="mx-auto max-h-[60dvh] rounded-lg bg-white object-contain" />
        </section>
      )}

      {/* 配飾縮略圖選擇器 */}
      <Dialog open={pickerSlot !== null} onOpenChange={(o) => !o && setPickerSlot(null)}>
        <DialogContent className="max-h-[85dvh] w-[95vw] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              添加「{pickerSlot ? (dressup.slots.find((s) => s.slotId === pickerSlot)?.slotLabel ?? '') : ''}」配飾
            </DialogTitle>
          </DialogHeader>
          {pickerSlot && (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
              {(candidates.get(pickerSlot) ?? []).map((c) => (
                <button
                  key={c.item.id}
                  type="button"
                  onClick={() => {
                    addToSlot(pickerSlot, c.item)
                    setPickerSlot(null)
                  }}
                  className="group flex flex-col items-center gap-1 rounded-lg p-1.5 transition hover:bg-muted"
                >
                  <div className="aspect-4/5 w-full overflow-hidden rounded-md bg-white">
                    <img src={referenceImageUrl(c.item.缩略图)} alt={c.item.服装名称} loading="lazy" className="h-full w-full object-contain transition group-hover:scale-105" />
                  </div>
                  <span className="w-full truncate text-center text-[11px] font-medium">{c.item.服装名称}</span>
                  <span className="w-full truncate text-center text-[10px] text-muted-foreground">{c.ownerName}</span>
                </button>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
