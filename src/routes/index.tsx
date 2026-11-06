import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import {
  ArrowRightIcon,
  CheckIcon,
  LayersIcon,
  PersonStandingIcon,
  PlusIcon,
  ShirtIcon,
  SparklesIcon,
  UserRoundIcon,
} from 'lucide-react'
import { aichanCostumesQuery, aichanPortraitsQuery, posesQuery } from '@/api/gallery'
import { PageHeader } from '@/components/common/PageHeader'
import { StatCard } from '@/components/common/StatCard'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useStudio } from '@/store/studioStore'
import { referenceImageUrl } from '@/lib/recipeImages'

export const Route = createFileRoute('/')({
  staticData: { title: '图库总览' },
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(posesQuery),
      context.queryClient.ensureQueryData(aichanCostumesQuery),
      context.queryClient.ensureQueryData(aichanPortraitsQuery),
    ]),
  pendingComponent: () => <Skeleton className="h-[520px] rounded-[22px]" />,
  component: DashboardPage,
})

function DashboardPage() {
  const { data: posesData } = useSuspenseQuery(posesQuery)
  const { data: costumes } = useSuspenseQuery(aichanCostumesQuery)
  const { data: portraits } = useSuspenseQuery(aichanPortraitsQuery)
  const { recipe, togglePortrait } = useStudio()

  const topPortraits = portraits.slice(0, 10)
  const totalImages = posesData.items.length + costumes.length + portraits.length

  return (
    <>
      <PageHeader title="AI 角色参考库" />

      {/* 核心数据指标卡片 */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          title="总参考图"
          value={totalImages.toLocaleString('zh-CN')}
          icon={<LayersIcon />}
          desc="AI 娘 + 姿势 + 配饰"
        />
        <StatCard
          title="动作姿势 (Pose)"
          value={`${posesData.groups.length} 组`}
          icon={<PersonStandingIcon />}
          desc={`${posesData.items.length} 张 · 白模/深度`}
        />
        <StatCard
          title="服装配饰 (Outfit)"
          value={`${costumes.length.toLocaleString('zh-CN')} 套`}
          icon={<ShirtIcon />}
          desc="服装 + 道具 · 17 位 AI 娘"
        />
        <StatCard
          title="AI 娘角色 (Character)"
          value={`${portraits.length.toLocaleString('zh-CN')} 张`}
          icon={<UserRoundIcon />}
          desc="三视图 + 表情 · 17 位 AI 娘"
        />
      </div>

      {/* 三大核心图库入口卡片 */}
      <div className="grid gap-3 sm:grid-cols-3 sm:gap-4">
        <Link
          to="/poses"
          className="group flex flex-col justify-between rounded-[20px] bg-muted p-4 transition hover:bg-muted/70"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">🕺 动作姿势库</h2>
            <Badge variant="secondary">1,439</Badge>
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

        <Link
          to="/characters"
          className="group flex flex-col justify-between rounded-[20px] bg-muted p-4 transition hover:bg-muted/70"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">👤 AI 娘角色库</h2>
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

        <Link
          to="/outfits"
          className="group flex flex-col justify-between rounded-[20px] bg-muted p-4 transition hover:bg-muted/70"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">👗 服装配饰库</h2>
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

      {/* AI 娘角色速选区 */}
      <section className="rounded-[20px] bg-muted p-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="flex items-center gap-1.5 text-sm font-semibold sm:text-base">
            <SparklesIcon className="size-4 text-violet-500" />
            AI 娘角色速选
          </h2>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/characters">
              全部
              <ArrowRightIcon className="size-3.5" />
            </Link>
          </Button>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-5 lg:grid-cols-10">
          {topPortraits.map((item) => {
            const picked = recipe.portrait?.id === item.id
            return (
              <div
                key={item.id}
                onClick={() => togglePortrait(item)}
                className="group relative cursor-pointer overflow-hidden rounded-xl bg-background transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="relative aspect-4/5 overflow-hidden bg-white">
                  <img
                    src={referenceImageUrl(item.缩略图)}
                    alt={item.标题}
                    loading="lazy"
                    className="h-full w-full object-contain transition group-hover:scale-105"
                  />
                  <span className="absolute top-1.5 left-1.5 rounded-md bg-black/70 px-1.5 py-0.5 text-[10px] font-bold text-white">
                    {item.分区}
                  </span>
                  <span
                    className={`absolute right-1.5 bottom-1.5 flex size-6 items-center justify-center rounded-full text-white shadow ${
                      picked ? 'bg-emerald-600' : 'bg-black/65 group-hover:bg-primary'
                    }`}
                  >
                    {picked ? <CheckIcon className="size-3.5" /> : <PlusIcon className="size-3.5" />}
                  </span>
                </div>
                <div className="p-1.5">
                  <div className="truncate text-[11px] font-medium">{item.角色名}</div>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* 底部免责声明提示条 */}
      <footer className="rounded-[18px] border border-border/60 bg-muted/50 px-4 py-3 text-xs leading-relaxed text-muted-foreground">
        <strong className="text-foreground">⚠️ 免责声明：</strong>
        本站动作姿势参考图源自 X 创作者{' '}
        <a
          href="https://x.com/giaaibusi"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-foreground"
        >
          ギア (@giaaibusi)
        </a>{' '}
        公开分享；AI 娘角色/服装/配饰素材来自{' '}
        <a href="https://github.com/lmy414/ai-chan-sheets" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">
          ai-chan-sheets
        </a>
        ，采用{' '}
        <strong className="text-foreground">CC BY-NC-SA 4.0（署名 · 非商业 · 相同方式共享）</strong>，请保留署名、勿用于商业用途。默认已开启「安全模式 (SFW)」隐藏 18+ 敏感分类，未满 18 周岁请勿关闭。本工具与素材
        <strong className="text-foreground">仅供个人学习与合法艺术创作使用，严禁用于任何违法违规或侵害他人肖像权用途</strong>。{' '}
        <Link to="/guide" className="font-medium text-primary underline">
          查看完整免责声明 →
        </Link>
      </footer>
    </>
  )
}
