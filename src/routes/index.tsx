import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import {
  ArrowRightIcon,
  CheckIcon,
  LayersIcon,
  LoaderCircleIcon,
  PlusIcon,
  ShirtIcon,
  SparklesIcon,
  UserRoundIcon,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import {
  aichanCharactersQuery,
  aichanCostumesQuery,
  aichanInherentQuery,
  aichanPortraitsQuery,
  type AichanCharacter,
} from '@/api/gallery'
import { PageHeader } from '@/components/common/PageHeader'
import { StatCard } from '@/components/common/StatCard'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { pickFrontView, subjectExpressions, subjectInherentItems, subjectViews } from '@/lib/dressup'
import { referenceImageUrl } from '@/lib/recipeImages'
import { buildCharacterPortrait } from '@/services/aiGenerator'
import { useStudio } from '@/store/studioStore'
import type { PortraitItem } from '@/types/gallery'

const frontCompositeId = (key: string) => `${key}/形象合成`

export const Route = createFileRoute('/')({
  staticData: { title: 'aichan 圖庫總覽' },
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(aichanCharactersQuery),
      context.queryClient.ensureQueryData(aichanPortraitsQuery),
      context.queryClient.ensureQueryData(aichanCostumesQuery),
      context.queryClient.ensureQueryData(aichanInherentQuery),
    ]),
  pendingComponent: () => <Skeleton className="h-[520px] rounded-[22px]" />,
  component: DashboardPage,
})

interface SpeedPick {
  brand: string
  char: AichanCharacter
  front: PortraitItem
  views: PortraitItem[]
}

function DashboardPage() {
  const { data: chars } = useSuspenseQuery(aichanCharactersQuery)
  const { data: portraits } = useSuspenseQuery(aichanPortraitsQuery)
  const { data: costumes } = useSuspenseQuery(aichanCostumesQuery)
  const { data: inherent } = useSuspenseQuery(aichanInherentQuery)
  const { recipe, togglePortrait } = useStudio()

  const [stitchingKey, setStitchingKey] = useState<string | null>(null)

  // 廠商（品牌）依角色順序去重；「前幾個廠商」＝此順序。
  const overview = useMemo(() => {
    const brands = [...new Set(chars.map((c) => c.品牌 || '其他'))]
    const firstChar = (b: string) => chars.find((c) => (c.品牌 || '其他') === b)

    // [37] 點 2：AI 娘角色庫預覽圖 = 前幾個廠商的第一個表情圖。
    const expressionPreviews = brands
      .map((b) => {
        const ch = firstChar(b)
        return ch ? (subjectExpressions(ch.key, portraits)[0] ?? null) : null
      })
      .filter((p): p is PortraitItem => Boolean(p))
      .slice(0, 4)

    // [37] 點 3：AI 娘角色速選 = 前幾個廠商的第一個正面圖。
    const speedPicks = brands
      .map((b) => {
        const ch = firstChar(b)
        if (!ch) return null
        const views = subjectViews(ch.key, portraits)
        const front = pickFrontView(views) ?? views[0] ?? null
        return front ? { brand: b, char: ch, front, views } : null
      })
      .filter((x): x is SpeedPick => Boolean(x))
      .slice(0, 10)

    const frontPreviews = brands
      .map((b) => {
        const ch = firstChar(b)
        if (!ch) return null
        const views = subjectViews(ch.key, portraits)
        return pickFrontView(views) ?? views[0] ?? null
      })
      .filter((p): p is PortraitItem => Boolean(p))
      .slice(0, 4)

    return { brands, expressionPreviews, speedPicks, frontPreviews }
  }, [chars, portraits])

  const selectFront = async (char: AichanCharacter, views: PortraitItem[]) => {
    if (!views.length) return
    setStitchingKey(char.key)
    try {
      const composite = await buildCharacterPortrait(
        views,
        subjectInherentItems(char.key, costumes, inherent).parts,
        char.角色名,
        false
      )
      if (composite) togglePortrait(composite)
    } catch {
      /* 拼合失敗靜默忽略，保留既有配置 */
    } finally {
      setStitchingKey(null)
    }
  }

  return (
    <>
      <PageHeader title="aichan 圖庫總覽" />

      {/* 核心數據指標 */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard title="AI 娘角色" value={chars.length} icon={<UserRoundIcon />} desc={`${overview.brands.length} 家廠商`} />
        <StatCard title="形象素材" value={portraits.length} icon={<LayersIcon />} desc="三视图 + 表情" />
        <StatCard title="服裝配飾" value={costumes.length} icon={<ShirtIcon />} desc="服装 + 道具" />
        <StatCard title="廠商（品牌）" value={overview.brands.length} icon={<SparklesIcon />} desc="AI 娘原創來源" />
      </div>

      {/* aichan 三大入口卡片 */}
      <div className="grid gap-3 sm:grid-cols-3 sm:gap-4">
        <Link to="/characters" className="group flex flex-col justify-between rounded-[20px] bg-muted p-4 transition hover:bg-muted/70">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">👤 AI 娘角色庫</h2>
            <Badge variant="secondary">{chars.length}</Badge>
          </div>
          <div className="mt-3 grid grid-cols-4 gap-1.5">
            {overview.expressionPreviews.map((p) => (
              <img
                key={p.id}
                src={referenceImageUrl(p.缩略图)}
                alt={p.角色名 || p.标题}
                loading="lazy"
                className="aspect-3/4 w-full rounded-lg bg-white object-contain"
              />
            ))}
          </div>
        </Link>

        <Link to="/outfits" className="group flex flex-col justify-between rounded-[20px] bg-muted p-4 transition hover:bg-muted/70">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">👗 aichan 服裝配飾</h2>
            <Badge variant="secondary">{costumes.length}</Badge>
          </div>
          <div className="mt-3 grid grid-cols-4 gap-1.5">
            {costumes.slice(0, 4).map((c) => (
              <img
                key={c.id}
                src={referenceImageUrl(c.缩略图)}
                alt={c.服装名称}
                loading="lazy"
                className="aspect-3/4 w-full rounded-lg bg-white object-contain"
              />
            ))}
          </div>
        </Link>

        <Link to="/dressup" search={{ subject: undefined }} className="group flex flex-col justify-between rounded-[20px] bg-muted p-4 transition hover:bg-muted/70">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">🧙 aichan 換裝</h2>
            <Badge variant="secondary" className="bg-primary text-primary-foreground">NEW</Badge>
          </div>
          <div className="mt-3 grid grid-cols-4 gap-1.5">
            {overview.frontPreviews.map((p) => (
              <img
                key={p.id}
                src={referenceImageUrl(p.缩略图)}
                alt={p.角色名 || p.标题}
                loading="lazy"
                className="aspect-3/4 w-full rounded-lg bg-white object-contain"
              />
            ))}
          </div>
        </Link>
      </div>

      {/* AI 娘角色速選：前幾個廠商的第一個正面圖 */}
      <section className="rounded-[20px] bg-muted p-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="flex items-center gap-1.5 text-sm font-semibold sm:text-base">
            <SparklesIcon className="size-4 text-violet-500" />
            AI 娘角色速選
          </h2>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/characters">
              全部
              <ArrowRightIcon className="size-3.5" />
            </Link>
          </Button>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-5 lg:grid-cols-10">
          {overview.speedPicks.map(({ brand, char, front, views }) => {
            const picked = recipe.portrait?.id === frontCompositeId(char.key)
            const busy = stitchingKey === char.key
            return (
              <div
                key={char.key}
                onClick={() => void selectFront(char, views)}
                className="group relative cursor-pointer overflow-hidden rounded-xl bg-background transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="relative aspect-4/5 overflow-hidden bg-white">
                  <img
                    src={referenceImageUrl(front.缩略图)}
                    alt={char.角色名}
                    loading="lazy"
                    className="h-full w-full object-contain transition group-hover:scale-105"
                  />
                  <span className="absolute top-1.5 left-1.5 max-w-[75%] truncate rounded-md bg-black/70 px-1.5 py-0.5 text-[10px] font-bold text-white">
                    {brand}
                  </span>
                  <span
                    className={`absolute right-1.5 bottom-1.5 flex size-6 items-center justify-center rounded-full text-white shadow ${
                      picked ? 'bg-emerald-600' : 'bg-black/65 group-hover:bg-primary'
                    }`}
                  >
                    {busy ? <LoaderCircleIcon className="size-3.5 animate-spin" /> : picked ? <CheckIcon className="size-3.5" /> : <PlusIcon className="size-3.5" />}
                  </span>
                </div>
                <div className="p-1.5">
                  <div className="truncate text-[11px] font-medium">{char.角色名}</div>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* 底部來源說明 */}
      <footer className="rounded-[18px] border border-border/60 bg-muted/50 px-4 py-3 text-xs leading-relaxed text-muted-foreground">
        <strong className="text-foreground">⚠️ 來源說明：</strong>
        本站 AI 娘角色 / 服裝 / 配飾素材來自{' '}
        <a href="https://github.com/lmy414/ai-chan-sheets" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">
          ai-chan-sheets
        </a>
        ，採用{' '}
        <strong className="text-foreground">CC BY-NC-SA 4.0（署名 · 非商業 · 相同方式共享）</strong>，請保留署名、勿用於商業用途。角色固有件（耳 / 尾等）不可分割，正面圖與三視圖均會自動拼合固有件以確保角色一致性。默認已開啟「安全模式 (SFW)」隱藏 18+ 敏感分類，未滿 18 周歲請勿關閉。本工具與素材
        <strong className="text-foreground">僅供個人學習與合法藝術創作使用</strong>。
        <Link to="/guide" className="font-medium text-primary underline">
          查看完整免責聲明 →
        </Link>
      </footer>
    </>
  )
}
