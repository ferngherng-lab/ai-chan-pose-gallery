import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import {
  CheckIcon,
  LoaderCircleIcon,
  PlusIcon,
  RotateCcwIcon,
  SearchIcon,
  UserRoundIcon,
  Wand2Icon,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from '@/lib/notifications'
import {
  aichanCharactersQuery,
  aichanCostumesQuery,
  aichanInherentQuery,
  aichanPortraitsQuery,
  type AichanCharacter,
} from '@/api/gallery'
import { EmptyState } from '@/components/common/EmptyState'
import { PageHeader } from '@/components/common/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { referenceImageUrl } from '@/lib/recipeImages'
import { pickFrontView, subjectInherentItems, subjectViews } from '@/lib/dressup'
import { buildCharacterPortrait } from '@/services/aiGenerator'
import { useStudio } from '@/store/studioStore'
import type { PortraitItem } from '@/types/gallery'

const frontCompositeId = (key: string) => `${key}/形象合成`
const sheetCompositeId = (key: string) => `${key}/三视图合成`

function viewOrder(v: PortraitItem): number {
  const text = `${v.标题}${v.id}`
  if (text.includes('正面')) return 0
  if (text.includes('侧面') || text.includes('側面') || text.includes('左侧') || text.includes('左側')) return 1
  if (text.includes('背面')) return 2
  return 3
}
function viewLabel(v: PortraitItem): string {
  const text = `${v.标题}${v.id}`
  if (text.includes('正面')) return '正面'
  if (text.includes('侧面') || text.includes('側面') || text.includes('左侧') || text.includes('左側')) return '側面'
  if (text.includes('背面')) return '背面'
  return '視角'
}

export const Route = createFileRoute('/characters')({
  staticData: { title: 'aichan 形象' },
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(aichanCharactersQuery),
      context.queryClient.ensureQueryData(aichanPortraitsQuery),
      context.queryClient.ensureQueryData(aichanCostumesQuery),
      context.queryClient.ensureQueryData(aichanInherentQuery),
    ]),
  pendingComponent: () => <Skeleton className="h-[540px] rounded-[22px]" />,
  component: CharactersPage,
})

function CharactersPage() {
  const { data: portraits } = useSuspenseQuery(aichanPortraitsQuery)
  const { data: chars } = useSuspenseQuery(aichanCharactersQuery)
  const { data: aichanCostumes } = useSuspenseQuery(aichanCostumesQuery)
  const { data: inherent } = useSuspenseQuery(aichanInherentQuery)
  const { recipe, togglePortrait } = useStudio()
  const navigate = useNavigate()

  const [brand, setBrand] = useState('')
  const [query, setQuery] = useState('')
  const [viewerKey, setViewerKey] = useState<string | null>(null)
  const [stitchingKey, setStitchingKey] = useState<string | null>(null)

  const brands = useMemo(() => [...new Set(chars.map((c) => c.品牌 || '其他'))], [chars])

  const charMeta = useMemo(() => {
    const map = new Map<string, { front: PortraitItem | null; views: PortraitItem[] }>()
    for (const c of chars) {
      const views = [...subjectViews(c.key, portraits)].sort((a, b) => viewOrder(a) - viewOrder(b))
      map.set(c.key, { front: pickFrontView(views) ?? views[0] ?? null, views })
    }
    return map
  }, [chars, portraits])

  const inherentPartsOf = (key: string) => subjectInherentItems(key, aichanCostumes, inherent).parts

  const q = query.trim().toLowerCase()
  const filteredChars = useMemo(() => {
    return chars.filter((c) => {
      if (brand && (c.品牌 || '其他') !== brand) return false
      if (q && !c.角色名.toLowerCase().includes(q) && !(c.品牌 || '').toLowerCase().includes(q)) return false
      return true
    })
  }, [chars, brand, q])

  const viewer = viewerKey ? chars.find((c) => c.key === viewerKey) ?? null : null
  const viewerMeta = viewerKey ? charMeta.get(viewerKey) : undefined

  const isFrontPicked = (key: string) => recipe.portrait?.id === frontCompositeId(key)
  const isSheetPicked = (key: string) => recipe.portrait?.id === sheetCompositeId(key)

  // [37] 形象一致性：正面＝正面視圖＋固有；三視圖＝三視圖＋固有。固有件不可分割。
  const addFront = async (c: AichanCharacter) => {
    const meta = charMeta.get(c.key)
    if (!meta || !meta.front) {
      toast.info('該角色暫無正面素材')
      return
    }
    setStitchingKey(c.key)
    try {
      const composite = await buildCharacterPortrait(meta.views, inherentPartsOf(c.key), c.角色名, false)
      if (composite) togglePortrait(composite)
    } catch {
      toast.error('形象拼合失敗，請稍後重試')
    } finally {
      setStitchingKey(null)
    }
  }

  const addThreeView = async (c: AichanCharacter) => {
    const meta = charMeta.get(c.key)
    if (!meta || meta.views.length === 0) {
      toast.info('該角色暫無三視圖素材')
      return
    }
    setStitchingKey(c.key)
    try {
      const composite = await buildCharacterPortrait(meta.views, inherentPartsOf(c.key), c.角色名, true)
      if (composite) togglePortrait(composite)
    } catch {
      toast.error('三視圖拼合失敗，請稍後重試')
    } finally {
      setStitchingKey(null)
    }
  }

  return (
    <>
      <PageHeader title="aichan 形象" />

      {/* 品牌分類藥丸 */}
      <div className="flex gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:pb-0">
        <button
          type="button"
          onClick={() => setBrand('')}
          className={cn(
            'shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors',
            brand === '' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'
          )}
        >
          全部角色 ({chars.length})
        </button>
        {brands.map((b) => {
          const cnt = chars.filter((c) => (c.品牌 || '其他') === b).length
          return (
            <button
              key={b}
              type="button"
              onClick={() => setBrand(brand === b ? '' : b)}
              className={cn(
                'shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors',
                brand === b ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'
              )}
            >
              {b} ({cnt})
            </button>
          )
        })}
      </div>

      {/* 搜索與重置 */}
      <div className="grid gap-3 rounded-[22px] bg-muted p-4 @xl/main:grid-cols-[minmax(0,1fr)_auto]">
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索角色名稱或品牌…"
            className="bg-background pl-9"
          />
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-9"
          onClick={() => {
            setBrand('')
            setQuery('')
          }}
        >
          <RotateCcwIcon className="size-3.5" />
          重置
        </Button>
      </div>

      {filteredChars.length === 0 ? (
        <EmptyState title="没有找到匹配的角色" description="试试更换品牌或重置筛选" />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {filteredChars.map((c) => {
            const meta = charMeta.get(c.key)
            const front = meta?.front ?? null
            const views = meta?.views ?? []
            const { parts, optional } = subjectInherentItems(c.key, aichanCostumes, inherent)
            const frontPicked = isFrontPicked(c.key)
            const sheetPicked = isSheetPicked(c.key)
            const busy = stitchingKey === c.key
            return (
              <div
                key={c.key}
                className="group flex flex-col overflow-hidden rounded-[20px] bg-muted p-2 transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div
                  onClick={() => setViewerKey(c.key)}
                  className="relative aspect-4/5 cursor-zoom-in overflow-hidden rounded-2xl bg-white"
                >
                  {front ? (
                    <img
                      src={referenceImageUrl(front.缩略图)}
                      alt={c.角色名}
                      loading="lazy"
                      className="h-full w-full object-contain transition duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                      <UserRoundIcon className="size-8" />
                    </div>
                  )}
                </div>

                <div className="px-1.5 pt-2.5 pb-1">
                  <div className="truncate text-xs font-semibold">{c.角色名}</div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    <Badge variant="outline" className="text-[9px]">{c.品牌 || '其他'}</Badge>
                    {parts.length > 0 && <Badge variant="secondary" className="text-[9px]">固有×{parts.length}</Badge>}
                    {optional.length > 0 && <Badge variant="outline" className="text-[9px]">翼可選</Badge>}
                    {parts.length === 0 && optional.length === 0 && <Badge variant="outline" className="text-[9px] text-muted-foreground">無固有</Badge>}
                  </div>
                </div>

                <div className="mt-1 grid grid-cols-2 gap-1.5 px-1.5 pb-2">
                  <Button
                    size="sm"
                    variant={frontPicked ? 'secondary' : 'default'}
                    className="h-8 px-2 text-xs"
                    disabled={!front || busy}
                    onClick={() => void addFront(c)}
                  >
                    {busy ? <LoaderCircleIcon className="size-3.5 animate-spin" /> : frontPicked ? <CheckIcon className="size-3.5" /> : <PlusIcon className="size-3.5" />}
                    {frontPicked ? '已選正面' : '正面圖'}
                  </Button>
                  <Button
                    size="sm"
                    variant={sheetPicked ? 'secondary' : 'outline'}
                    className="h-8 px-2 text-xs"
                    disabled={views.length === 0 || busy}
                    onClick={() => void addThreeView(c)}
                  >
                    {busy ? <LoaderCircleIcon className="size-3.5 animate-spin" /> : sheetPicked ? <CheckIcon className="size-3.5" /> : <PlusIcon className="size-3.5" />}
                    {sheetPicked ? '已選三視圖' : '三視圖'}
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* 大圖彈窗：點擊形象即顯示三視圖 */}
      <Dialog open={viewerKey !== null} onOpenChange={(o) => !o && setViewerKey(null)}>
        <DialogContent className="max-h-[90dvh] w-[95vw] max-w-4xl overflow-y-auto p-0 sm:max-w-4xl">
          {viewer && viewerMeta && (
            <div className="flex flex-col">
              <div className="grid gap-3 p-4 sm:grid-cols-3">
                {viewerMeta.views.map((v) => (
                  <figure key={v.id} className="flex min-h-[180px] flex-col overflow-hidden rounded-2xl bg-white">
                    <div className="flex flex-1 items-center justify-center p-2">
                      <img
                        src={referenceImageUrl(v.原图 || v.缩略图)}
                        alt={v.标题}
                        loading="lazy"
                        className="max-h-[46dvh] w-full object-contain"
                      />
                    </div>
                    <figcaption className="border-t bg-muted/60 px-2 py-1 text-center text-xs font-semibold text-muted-foreground">
                      {viewLabel(v)}
                    </figcaption>
                  </figure>
                ))}
              </div>

              <div className="space-y-3 border-t p-5">
                <DialogHeader>
                  <div className="flex items-center gap-2">
                    <Badge>{viewer.品牌 || '其他'}</Badge>
                    <Badge variant="outline">aichan 形象</Badge>
                    <Badge variant="outline">{viewerMeta.views.length} 視角</Badge>
                  </div>
                  <DialogTitle className="mt-2 text-base leading-snug">{viewer.角色名}</DialogTitle>
                </DialogHeader>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant={isFrontPicked(viewer.key) ? 'secondary' : 'default'}
                    disabled={!viewerMeta.front || stitchingKey === viewer.key}
                    onClick={() => void addFront(viewer)}
                  >
                    {stitchingKey === viewer.key ? <LoaderCircleIcon className="size-4 animate-spin" /> : isFrontPicked(viewer.key) ? <CheckIcon className="size-4" /> : <PlusIcon className="size-4" />}
                    {isFrontPicked(viewer.key) ? '已選正面圖' : '正面圖加入配方'}
                  </Button>
                  <Button
                    size="sm"
                    variant={isSheetPicked(viewer.key) ? 'secondary' : 'outline'}
                    disabled={viewerMeta.views.length === 0 || stitchingKey === viewer.key}
                    onClick={() => void addThreeView(viewer)}
                  >
                    {stitchingKey === viewer.key ? <LoaderCircleIcon className="size-4 animate-spin" /> : isSheetPicked(viewer.key) ? <CheckIcon className="size-4" /> : <PlusIcon className="size-4" />}
                    {isSheetPicked(viewer.key) ? '已選三視圖' : '三視圖加入配方'}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => navigate({ to: '/dressup', search: { subject: viewer.key } })}>
                    <Wand2Icon className="size-4" /> 開始換裝
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
