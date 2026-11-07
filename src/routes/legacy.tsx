import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import { LayersIcon, PersonStandingIcon, ShirtIcon, UserRoundIcon } from 'lucide-react'
import { costumesQuery, portraitsQuery, posesQuery } from '@/api/gallery'
import { PageHeader } from '@/components/common/PageHeader'
import { StatCard } from '@/components/common/StatCard'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { referenceImageUrl } from '@/lib/recipeImages'

export const Route = createFileRoute('/legacy')({
  staticData: { title: '原版圖庫總覽' },
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(posesQuery),
      context.queryClient.ensureQueryData(portraitsQuery),
      context.queryClient.ensureQueryData(costumesQuery),
    ]),
  pendingComponent: () => <Skeleton className="h-[520px] rounded-[22px]" />,
  component: LegacyPage,
})

function LegacyPage() {
  const { data: posesData } = useSuspenseQuery(posesQuery)
  const { data: portraits } = useSuspenseQuery(portraitsQuery)
  const { data: costumes } = useSuspenseQuery(costumesQuery)

  const totalImages = posesData.items.length + portraits.length + costumes.length

  return (
    <>
      <PageHeader title="原版圖庫總覽" />

      {/* 核心數據指標 */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          title="合計參考圖"
          value={totalImages.toLocaleString('zh-CN')}
          icon={<LayersIcon />}
          desc="姿勢 + 人像 + 服裝"
        />
        <StatCard
          title="動作姿勢 (Pose)"
          value={`${posesData.groups.length} 組`}
          icon={<PersonStandingIcon />}
          desc={`${posesData.items.length} 张 · 白模/深度`}
        />
        <StatCard
          title="原版人像 (Portrait)"
          value={`${portraits.length.toLocaleString('zh-CN')} 张`}
          icon={<UserRoundIcon />}
          desc="原版人像參考庫"
        />
        <StatCard
          title="原版服裝 (Costume)"
          value={`${costumes.length.toLocaleString('zh-CN')} 套`}
          icon={<ShirtIcon />}
          desc="原版服裝參考庫"
        />
      </div>

      {/* 原版三大圖庫入口 */}
      <div className="grid gap-3 sm:grid-cols-3 sm:gap-4">
        <Link to="/poses" className="group flex flex-col justify-between rounded-[20px] bg-muted p-4 transition hover:bg-muted/70">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">🕺 動作姿勢庫</h2>
            <Badge variant="secondary">{posesData.items.length}</Badge>
          </div>
          <div className="mt-3 grid grid-cols-4 gap-1.5">
            {posesData.groups.slice(0, 4).map((g) => (
              <img
                key={g.key}
                src={`/${g.order[0].缩略图}`}
                alt={g.name}
                loading="lazy"
                className="aspect-3/4 w-full rounded-lg bg-background object-cover"
              />
            ))}
          </div>
        </Link>

        <Link to="/portraits" className="group flex flex-col justify-between rounded-[20px] bg-muted p-4 transition hover:bg-muted/70">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">🧑 原版人像庫</h2>
            <Badge variant="secondary">{portraits.length}</Badge>
          </div>
          <div className="mt-3 grid grid-cols-4 gap-1.5">
            {portraits.slice(0, 4).map((p) => (
              <img
                key={p.id}
                src={referenceImageUrl(p.缩略图)}
                alt={p.标题}
                loading="lazy"
                className="aspect-3/4 w-full rounded-lg bg-white object-contain"
              />
            ))}
          </div>
        </Link>

        <Link to="/costumes" className="group flex flex-col justify-between rounded-[20px] bg-muted p-4 transition hover:bg-muted/70">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">👘 原版服裝庫</h2>
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
      </div>

      {/* 底部來源說明 */}
      <footer className="rounded-[18px] border border-border/60 bg-muted/50 px-4 py-3 text-xs leading-relaxed text-muted-foreground">
        <strong className="text-foreground">⚠️ 來源說明：</strong>
        本站原版動作姿勢參考圖源自 X 創作者{' '}
        <a
          href="https://x.com/giaaibusi"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-foreground"
        >
          ギア (@giaaibusi)
        </a>{' '}
        公開分享；原版人像 / 服裝素材來自公開人像庫。請保留署名、勿用於商業用途。默認已開啟「安全模式 (SFW)」隱藏 18+ 敏感分類，未滿 18 周歲請勿關閉。本工具與素材
        <strong className="text-foreground">僅供個人學習與合法藝術創作使用</strong>。
        <Link to="/guide" className="font-medium text-primary underline">
          查看完整免責聲明 →
        </Link>
      </footer>
    </>
  )
}
