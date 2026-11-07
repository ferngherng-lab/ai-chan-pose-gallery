import type { LinkProps } from '@tanstack/react-router'
import {
  BookOpenIcon,
  KeyRoundIcon,
  LayersIcon,
  LayoutDashboardIcon,
  PersonStandingIcon,
  ShirtIcon,
  SparklesIcon,
  UserRoundIcon,
  Wand2Icon,
  type LucideIcon,
} from 'lucide-react'

export interface NavItem {
  title: string
  to: NonNullable<LinkProps['to']>
  icon: LucideIcon
  badge?: string
  /** 標記為原版圖庫項目（受「原版图库」開關控制） */
  legacy?: boolean
}

export interface NavGroup {
  label: string
  items: NavItem[]
  id?: string
}

export const navGroups: NavGroup[] = [
  {
    label: '工作台',
    items: [
      { title: 'aichan 圖庫總覽', to: '/', icon: LayoutDashboardIcon },
      { title: '原版圖庫總覽', to: '/legacy', icon: LayersIcon, legacy: true },
      { title: 'aichan 換裝', to: '/dressup', icon: Wand2Icon, badge: 'NEW' },
      { title: 'AI 角色合成台', to: '/studio', icon: SparklesIcon, badge: 'PRO' },
    ],
  },
  {
    label: '參考圖庫',
    items: [
      { title: 'aichan 形象', to: '/characters', icon: UserRoundIcon, badge: '198' },
      { title: 'aichan 服裝配飾', to: '/outfits', icon: ShirtIcon, badge: '198' },
      { title: '動作姿勢庫', to: '/poses', icon: PersonStandingIcon, badge: '1,439' },
      { title: '原版服裝庫', to: '/costumes', icon: ShirtIcon, badge: '3,224', legacy: true },
      { title: '原版人像庫', to: '/portraits', icon: UserRoundIcon, badge: '1,499', legacy: true },
    ],
  },
  {
    label: '配置与说明',
    items: [
      { title: 'API 接口配置', to: '/settings', icon: KeyRoundIcon },
      { title: '使用说明与免责声明', to: '/guide', icon: BookOpenIcon },
    ],
  },
]

const allItems = navGroups.flatMap((g) => g.items)

export function activeNavTo(pathname: string): string | undefined {
  let best: string | undefined
  for (const { to } of allItems) {
    const hit = to === '/' ? pathname === '/' : pathname === to || pathname.startsWith(`${to}/`)
    if (hit && (!best || to.length > best.length)) best = to
  }
  return best
}
