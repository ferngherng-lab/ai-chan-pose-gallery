// Phase C：aichan 換裝核心純函數（資料層，無 React / 無 IO）
// 供 UI 建構 DressupState；生成時由 aiGenerator 編譯為既有 3 圖模型。
import type {
  AichanInherent,
  AichanSlotTaxonomy,
  CostumeItem,
  DressupSlotSelection,
  DressupState,
  PortraitItem,
} from '@/types/gallery'

/** 角色固有件（耳/角/尾/面部特徵）→ 拆出「必現」與「可選（翼）」 */
export function subjectInherentItems(
  key: string,
  costumes: CostumeItem[],
  inherent: AichanInherent
): { parts: CostumeItem[]; optional: CostumeItem[]; hair: CostumeItem[] } {
  const entry = inherent[key] ?? { parts: [], optional: [] }
  const byId = new Map(costumes.map((c) => [c.id, c]))
  return {
    parts: entry.parts.map((id) => byId.get(id)).filter((c): c is CostumeItem => Boolean(c)),
    optional: entry.optional.map((id) => byId.get(id)).filter((c): c is CostumeItem => Boolean(c)),
    hair: (entry.hair ?? []).map((id) => byId.get(id)).filter((c): c is CostumeItem => Boolean(c)),
  }
}

/** 角色三视图（正面/侧面/背面） */
export function subjectViews(key: string, portraits: PortraitItem[]): PortraitItem[] {
  return portraits.filter((p) => p.角色 === key && p.分区 === '三视图')
}

/** 角色表情子集 */
export function subjectExpressions(key: string, portraits: PortraitItem[]): PortraitItem[] {
  return portraits.filter((p) => p.角色 === key && p.分区 === '表情')
}

/** 角色自身裝飾按槽位歸併（slotId → 裝飾件[]）；固有不參與槽位 */
export function subjectDecorations(
  key: string,
  costumes: CostumeItem[],
  inherent: AichanInherent,
  taxonomy: AichanSlotTaxonomy
): Map<string, CostumeItem[]> {
  const entry = inherent[key] ?? { parts: [], optional: [] }
  const inherentIds = new Set([...entry.parts, ...entry.optional, ...(entry.hair ?? [])])
  const result = new Map<string, CostumeItem[]>()
  for (const c of costumes) {
    if (c.角色 !== key || inherentIds.has(c.id)) continue
    const slot = taxonomy.mapping[c.id]
    if (!slot) continue
    const arr = result.get(slot) ?? []
    arr.push(c)
    result.set(slot, arr)
  }
  return result
}

/** 全角色裝飾池（slotId → {item, owner}[]），供跨角色混搭與隨機 */
export function decorationPool(
  costumes: CostumeItem[],
  inherent: AichanInherent,
  taxonomy: AichanSlotTaxonomy
): Map<string, { item: CostumeItem; owner: string }[]> {
  const allInherentIds = new Set(Object.values(inherent).flatMap((e) => [...e.parts, ...e.optional, ...(e.hair ?? [])]))
  const result = new Map<string, { item: CostumeItem; owner: string }[]>()
  for (const c of costumes) {
    if (allInherentIds.has(c.id)) continue
    const slot = taxonomy.mapping[c.id]
    if (!slot) continue
    const arr = result.get(slot) ?? []
    arr.push({ item: c, owner: c.角色 ?? '' })
    result.set(slot, arr)
  }
  return result
}

/** 建立指定主體的初始換裝狀態（僅內部替換） */
export function buildInitialDressup(
  key: string,
  costumes: CostumeItem[],
  portraits: PortraitItem[],
  inherent: AichanInherent,
  taxonomy: AichanSlotTaxonomy
): DressupState {
  const { parts, optional, hair } = subjectInherentItems(key, costumes, inherent)
  const views = subjectViews(key, portraits)
  const expressions = subjectExpressions(key, portraits)
  const deco = subjectDecorations(key, costumes, inherent, taxonomy)
  const slots = fillSlotsWithSubject(buildSlotSkeleton(taxonomy), deco)
  return {
    subject: key,
    subjectView: pickFrontView(views),
    expression: expressions[0] ?? null,
    inherent: parts,
    wings: optional,
    wingsOn: optional.length > 0,
    hair,
    hairOn: hair.length > 0,
    slots,
  }
}

export function pickFrontView(views: PortraitItem[]): PortraitItem | null {
  return views.find((v) => v.id.includes('正面') || v.标题.includes('正面')) ?? views[0] ?? null
}

/** 建立 14 槽位骨架（有序、預設留空） */
export function buildSlotSkeleton(taxonomy: AichanSlotTaxonomy): DressupSlotSelection[] {
  return [...taxonomy.slots]
    .sort((a, b) => a.order - b.order)
    .map((s) => ({ slotId: s.id, slotLabel: s.label, order: s.order, items: [] }))
}

/** 從槽位骨架 + 某角色自身裝飾，填入該角色默認著裝（＝主體默認裝飾） */
export function fillSlotsWithSubject(
  skeleton: DressupSlotSelection[],
  subjectDeco: Map<string, CostumeItem[]>
): DressupSlotSelection[] {
  return skeleton.map((s) => ({ ...s, items: [...(subjectDeco.get(s.slotId) ?? [])] }))
}

/** 隨機裝飾＝隨機抽一個角色（≠主體）的成套配飾。回傳 owner（供 toast 顯示）；無候選則清空並回傳 null。 */
export function randomizeDecorations(
  subjectKey: string,
  skeleton: DressupSlotSelection[],
  pool: Map<string, { item: CostumeItem; owner: string }[]>
): { slots: DressupSlotSelection[]; owner: string | null } {
  const owners = new Set<string>()
  for (const list of pool.values()) {
    for (const c of list) {
      if (c.owner && c.owner !== subjectKey) owners.add(c.owner)
    }
  }
  const candidates = [...owners]
  if (!candidates.length) {
    return { slots: skeleton.map((s) => ({ ...s, items: [] })), owner: null }
  }
  const pick = candidates[Math.floor(Math.random() * candidates.length)]
  const slots = skeleton.map((s) => {
    const items = (pool.get(s.slotId) ?? []).filter((c) => c.owner === pick).map((c) => c.item)
    return { ...s, items }
  })
  return { slots, owner: pick }
}
