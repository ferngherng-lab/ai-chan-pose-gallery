import { ZoomViewport } from '@/components/common/ZoomViewport'
import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import {
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CopyIcon,
  DownloadIcon,
  ExternalLinkIcon,
  PlusIcon,
  RotateCcwIcon,
  SearchIcon,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { toast } from '@/lib/notifications'
import { aichanPortraitsQuery } from '@/api/gallery'
import { EmptyState } from '@/components/common/EmptyState'
import { PageHeader } from '@/components/common/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { referenceImageUrl } from '@/lib/recipeImages'
import { useStudio } from '@/store/studioStore'

export const Route = createFileRoute('/characters')({
  staticData: { title: 'AI 娘角色' },
  loader: ({ context }) => context.queryClient.ensureQueryData(aichanPortraitsQuery),
  pendingComponent: () => <Skeleton className="h-[540px] rounded-[22px]" />,
  component: CharactersPage,
})

const ZONES = ['三视图', '表情'] as const

function CharactersPage() {
  const { data: portraits } = useSuspenseQuery(aichanPortraitsQuery)
  const { recipe, togglePortrait } = useStudio()

  const [zone, setZone] = useState<'' | (typeof ZONES)[number]>('')
  const [character, setCharacter] = useState('all')
  const [query, setQuery] = useState('')
  const [shown, setShown] = useState(60)
  const [viewerIndex, setViewerIndex] = useState<number | null>(null)

  const characters = useMemo(
    () =>
      [...new Set(portraits.map((p) => p.角色名).filter((x): x is string => Boolean(x)))].sort((a, b) =>
        a.localeCompare(b, 'zh-CN')
      ),
    [portraits]
  )

  const q = query.trim().toLowerCase()

  const filtered = useMemo(() => {
    return portraits.filter((item) => {
      if (zone && item.分区 !== zone) return false
      if (character !== 'all' && item.角色名 !== character) return false
      if (q && !item.检索.toLowerCase().includes(q)) return false
      return true
    })
  }, [portraits, zone, character, q])

  const currentItem = viewerIndex !== null ? filtered[viewerIndex] : null

  useEffect(() => {
    if (viewerIndex === null || !filtered.length) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') setViewerIndex((viewerIndex + 1) % filtered.length)
      else if (e.key === 'ArrowLeft') setViewerIndex((viewerIndex - 1 + filtered.length) % filtered.length)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [viewerIndex, filtered.length])

  return (
    <>
      <PageHeader title="AI 娘角色" />

      {/* 分区切换药丸 */}
      <div className="flex gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:pb-0">
        <button
          type="button"
          onClick={() => {
            setZone('')
            setShown(60)
          }}
          className={cn(
            'shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors',
            zone === '' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'
          )}
        >
          全部角色素材 ({portraits.length})
        </button>
        {ZONES.map((sec) => {
          const cnt = portraits.filter((x) => x.分区 === sec).length
          return (
            <button
              key={sec}
              type="button"
              onClick={() => {
                setZone(zone === sec ? '' : sec)
                setShown(60)
              }}
              className={cn(
                'shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors',
                zone === sec ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'
              )}
            >
              {sec} ({cnt})
            </button>
          )
        })}
      </div>

      {/* 搜索与角色细分 */}
      <div className="grid gap-3 rounded-[22px] bg-muted p-4 @xl/main:grid-cols-2 @3xl/main:grid-cols-[minmax(0,1fr)_260px_auto]">
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setShown(60)
            }}
            placeholder="搜索角色、三视图、表情或 ID（如：狐耳、正面、惊讶、泳装）…"
            className="bg-background pl-9"
          />
        </div>

        <Select
          value={character}
          onValueChange={(v) => {
            setCharacter(v)
            setShown(60)
          }}
        >
          <SelectTrigger className="w-full bg-background">
            <SelectValue placeholder="全部 AI 娘角色" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部 AI 娘角色 ({characters.length})</SelectItem>
            {characters.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          variant="ghost"
          size="sm"
          className="h-9"
          onClick={() => {
            setZone('')
            setCharacter('all')
            setQuery('')
            setShown(60)
          }}
        >
          <RotateCcwIcon className="size-3.5" />
          重置
        </Button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="没有找到匹配的角色素材" description="试试更换角色或重置筛选" />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {filtered.slice(0, shown).map((item, idx) => {
            const picked = recipe.portrait?.id === item.id
            return (
              <div
                key={item.id}
                className="group flex flex-col overflow-hidden rounded-[20px] bg-muted p-2 transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div
                  onClick={() => setViewerIndex(idx)}
                  className="relative aspect-4/5 cursor-zoom-in overflow-hidden rounded-2xl bg-white"
                >
                  <img
                    src={referenceImageUrl(item.缩略图)}
                    alt={item.标题}
                    loading="lazy"
                    className="h-full w-full object-contain transition duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-x-2 top-2 flex items-center justify-between gap-1">
                    <span className="rounded-md bg-black/70 px-1.5 py-0.5 text-[10px] font-bold text-white">
                      {item.分区}
                    </span>
                    <span className="max-w-[60%] truncate rounded-md bg-white/90 px-1.5 py-0.5 text-[10px] font-semibold text-zinc-900">
                      {item.角色名}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      togglePortrait(item)
                    }}
                    className={cn(
                      'absolute bottom-2 left-2 flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-semibold text-white shadow transition',
                      picked ? 'bg-emerald-600' : 'bg-black/75 hover:bg-primary'
                    )}
                  >
                    {picked ? <CheckIcon className="size-3" /> : <PlusIcon className="size-3" />}
                    {picked ? '已选' : '加入配方'}
                  </button>
                </div>

                <div className="px-1.5 pt-2.5 pb-1">
                  <div className="line-clamp-2 min-h-[34px] text-xs leading-snug font-semibold">{item.发型名称}</div>
                  <div className="mt-1 flex items-center justify-between font-mono text-[10px] text-muted-foreground">
                    <span className="truncate">{item.id.split('/').pop()}</span>
                    <span>CC BY-NC-SA</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {shown < filtered.length && (
        <div className="flex justify-center pt-2">
          <Button variant="outline" onClick={() => setShown((s) => s + 60)}>
            加载更多（剩余 {filtered.length - shown} 张）
          </Button>
        </div>
      )}

      {/* 大图弹窗 */}
      <Dialog open={viewerIndex !== null} onOpenChange={(o) => !o && setViewerIndex(null)}>
        <DialogContent className="max-h-[90dvh] w-[95vw] max-w-4xl overflow-y-auto p-0 sm:max-w-4xl">
          {currentItem && viewerIndex !== null && (() => {
            const picked = recipe.portrait?.id === currentItem.id
            return (
              <div className="grid md:grid-cols-[1fr_320px]">
                <div className="relative flex max-h-[78dvh] min-h-[min(380px,65dvh)] items-center justify-center bg-muted/60 p-4">
                  <ZoomViewport imageUrl={referenceImageUrl(currentItem.原图)} alt={currentItem.标题} className="min-h-0 h-[58dvh]" />
                  <Button
                    variant="secondary"
                    size="icon"
                    aria-label="上一张图片" className="absolute top-1/2 left-3 min-h-11 min-w-11 -translate-y-1/2 rounded-full shadow"
                    onClick={() => setViewerIndex((viewerIndex - 1 + filtered.length) % filtered.length)}
                  >
                    <ChevronLeftIcon className="size-4" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="icon"
                    aria-label="下一张图片" className="absolute top-1/2 right-3 min-h-11 min-w-11 -translate-y-1/2 rounded-full shadow"
                    onClick={() => setViewerIndex((viewerIndex + 1) % filtered.length)}
                  >
                    <ChevronRightIcon className="size-4" />
                  </Button>
                </div>

                <div className="flex flex-col justify-between gap-4 border-t p-5 md:border-t-0 md:border-l">
                  <div className="space-y-4">
                    <DialogHeader>
                      <div className="flex items-center gap-2">
                        <Badge>{currentItem.分区}</Badge>
                        <Badge variant="outline">{currentItem.角色名}</Badge>
                      </div>
                      <DialogTitle className="mt-2 text-base leading-snug">{currentItem.标题}</DialogTitle>
                    </DialogHeader>

                    <div className="flex items-center justify-between rounded-lg bg-muted px-2.5 py-1.5 font-mono text-xs">
                      <span className="truncate">{currentItem.id}</span>
                      <button
                        type="button"
                        onClick={() => {
                          void navigator.clipboard.writeText(currentItem.id)
                          toast.success('已复制角色素材 ID')
                        }}
                        className="ml-2 shrink-0 text-primary hover:underline"
                      >
                        <CopyIcon className="size-3.5" />
                      </button>
                    </div>

                    <dl className="grid grid-cols-[72px_1fr] gap-y-1.5 text-xs">
                      <dt className="text-muted-foreground">所属角色</dt>
                      <dd className="font-medium">{currentItem.角色名}</dd>
                      <dt className="text-muted-foreground">素材标签</dt>
                      <dd className="font-medium">{currentItem.发型名称}</dd>
                      <dt className="text-muted-foreground">原图尺寸</dt>
                      <dd className="font-medium">
                        {currentItem.宽} × {currentItem.高}
                      </dd>
                      <dt className="text-muted-foreground">授权协议</dt>
                      <dd className="font-medium text-amber-600 dark:text-amber-400">
                        CC BY-NC-SA 4.0（非商业 · 署名 ai-chan-sheets）
                      </dd>
                    </dl>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Button onClick={() => togglePortrait(currentItem)} variant={picked ? 'secondary' : 'default'}>
                      {picked ? <CheckIcon className="size-4" /> : <PlusIcon className="size-4" />}
                      {picked ? '已在角色配方中（点击移除）' : '加入角色配方'}
                    </Button>
                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <a href={referenceImageUrl(currentItem.原图)} download={`${currentItem.id.split('/').pop()}.png`}>
                          <DownloadIcon className="size-3.5" />
                          下载高清原图
                        </a>
                      </Button>
                      <Button variant="outline" size="sm" asChild>
                        <a href={referenceImageUrl(currentItem.原图)} target="_blank" rel="noopener noreferrer">
                          <ExternalLinkIcon className="size-3.5" />
                          新窗口原图
                        </a>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })()}
        </DialogContent>
      </Dialog>
    </>
  )
}
