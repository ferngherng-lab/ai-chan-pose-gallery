export interface PoseItem {
  source?: 'upload'
  /** 是否使用灰阶深度图（Depth Map）代替素体白模 */
  useDepth?: boolean
  id: string
  体系: string
  姿势编号: string
  分类: string
  姿势名称: string
  角度: string
  缩略图: string
  原图: string
  检索: string
}

export interface PoseGroup {
  key: string
  system: string
  number: string
  name: string
  category: string
  items: PoseItem[]
  angles: Record<string, PoseItem>
  order: PoseItem[]
}

export interface CostumeView {
  id: string
  label: string
  缩略图: string
  预览图: string
  原图: string
}

export interface CostumeItem {
  source?: 'upload' | 'charadb' | 'gia-anime' | 'shisei' | 'aichan'
  views?: CostumeView[]
  selectedView?: string
  一级分类?: '现实' | '二次元'
  来源?: string
  来源地址?: string
  日文名称?: string
  敏感?: boolean
  角色?: string
  角色名?: string
  id: string
  分类: string
  服装名称: string
  标签: string[]
  关键词: string
  缩略图: string
  预览图: string
  原图: string
  检索: string
}

export interface PortraitItem {
  source?: 'upload' | 'aichan'
  /** 是否為「三視圖合成」設定圖（正面/側面/背面拼成一張），提示詞據此切換 */
  sheet?: boolean
  id: string
  分区: string
  发长: string
  发型名称: string
  标题: string
  角色?: string
  角色名?: string
  /** 拼入形象複合圖的固有件名稱（角/耳/尾/翼/面部特徵），供提示詞精確列舉；人形角色為空 */
  固有?: string[]
  宽: number
  高: number
  字节数: number
  精选: boolean
  热门: boolean
  缩略图: string
  原图: string
  检索: string
}

export interface ExtraReferenceImage {
  role?: 'character_sheet'
  id: string
  name: string
  url: string
}

// ---- 子欄位（進階層）：useSubfields 開關控制，預設關閉（退出策略）----
export type AssetRegion = '形象' | '服飾'
export type CostumeZone = '上裝' | '下裝' | '其他'
export type CostumeZones = CostumeZone[]

export type AssetKind = '固有' | '裝飾'

export interface CostumePiece {
  item: CostumeItem
  region: AssetRegion
  zones: CostumeZones
  /** 固有＝隨主體固定（耳/角/尾/翼/面部特徵）；裝飾＝可換 */
  kind?: AssetKind
}

export interface CostumeBlock {
  top: CostumePiece[]
  bottom: CostumePiece[]
  extras: CostumePiece[]
}

export interface PortraitBlock {
  base: PortraitItem | null
  expression: PortraitItem | null
  hair: CostumeItem[]
}

// ---- 換裝層（Phase C）：DressupState 編譯到既有 3 圖模型，不新增生成路徑 ----

export interface DressupSlotSelection {
  slotId: string
  slotLabel: string
  order: number
  items: CostumeItem[]
}

export interface DressupState {
  /** 主體角色 key（形象錨點） */
  subject: string
  /** 主體三视图（正面/侧面/背面） */
  subjectView: PortraitItem | null
  /** 角色三視圖（正面/側面/背面）；三視圖開關 ON 時拼入形象圖 */
  threeViews: PortraitItem[]
  /** 表情（該角色 分区=表情 子集） */
  expression: PortraitItem | null
  /** 固有件：耳/角/尾/面部特徵（隨主體固定，不可換） */
  inherent: CostumeItem[]
  /** 翼（可選固有） */
  wings: CostumeItem[]
  /** 翼開關：false 時不渲染、提示詞不提（不做否定強調） */
  wingsOn: boolean
  /** 髮型固有（呆毛/发丝/编发，可選固有） */
  hair: CostumeItem[]
  /** 髮型開關：false 時不渲染、提示詞不提 */
  hairOn: boolean
  /** 三視圖開關：true＝拼圖時拼入三視圖（3 張），false＝只拼正面單圖 */
  threeViewOn: boolean
  /** 表情開關：true＝套用表情，false＝無表情 */
  expressionOn: boolean
  /** 14 槽位自上而下，每槽 0..n 件（可留空 / 可混搭多來源） */
  slots: DressupSlotSelection[]
}

export interface AichanInherentEntry {
  parts: string[]
  optional: string[]
  /** 髮型固有（呆毛/发丝/编发，可選開關，同翼） */
  hair?: string[]
}
export type AichanInherent = Record<string, AichanInherentEntry>

export interface DressupSlot {
  id: string
  label: string
  order: number
}
export interface AichanSlotTaxonomy {
  slots: DressupSlot[]
  mapping: Record<string, string>
}

export interface RecipeState {
  portrait: PortraitItem | null
  costume: CostumeItem | null
  pose: PoseItem | null
  /** 子欄位精細化（useSubfields 開關 ON 時才參與生成） */
  advancedPortrait?: PortraitBlock | null
  advancedCostume?: CostumeBlock | null
  /** 換裝（Phase C，useSubfields 開關 ON 時才參與生成） */
  dressup?: DressupState | null
  workflowImages?: Record<string, ExtraReferenceImage>
  workflowImagesIdentity?: string
  extraImages?: ExtraReferenceImage[]
}

export type ImageProviderId = 'gemini' | 'gpt' | 'qwen' | 'doubao' | 'comfyui'

export interface ProviderEndpointConfig {
  baseUrl: string
  apiKey: string
  model: string
  customModel: string
}

export type ImagePassMode = 'url' | 'base64'

export type WorkflowScalar = string | number | boolean

export interface WorkflowParameterOverrides {
  workflowId: string
  values: Record<string, Record<string, WorkflowScalar>>
}

export interface ComfyUiParams {
  parameterOverrides?: WorkflowParameterOverrides
  workflowPreset: 'qwen2509_3img' | 'qwen2509_2img' | 'qwen21_3img' | 'qwen21_2img' | 'custom'
  workflowJson: string
  promptNodeId: string
  portraitNodeId: string
  costumeNodeId: string
  poseNodeId: string
  stitchedNodeId: string
  randomizeSeed: boolean
  /** 单次生成最长等待秒数 */
  timeoutSec: number
  /** 配置结构版本，用于迁移旧版默认值 */
  configVersion?: number
}

export interface GptParams {
  endpointMode: 'images_edits_json' | 'images_edits' | 'responses' | 'chat'
  size: 'auto' | '1024x1536' | '1024x1024' | '1536x1024'
  quality: 'auto' | 'low' | 'medium' | 'high' | 'xhigh' | 'max'
  inputFidelity: 'high' | 'low'
  background: 'auto' | 'opaque' | 'transparent'
  outputFormat: 'png' | 'jpeg' | 'webp'
  moderation: 'auto' | 'low'
}

export interface GeminiParams {
  endpointMode: 'native' | 'openai_chat'
  aspectRatio: '3:4' | '1:1' | '4:3' | '9:16' | '16:9'
  imageSize: '1K' | '2K' | '4K'
}

export interface QwenParams {
  size: '1024*1536' | '1328*1328' | '928*1664' | '1664*928'
  promptExtend: boolean
  watermark: boolean
  negativePrompt: string
  n: number
}

export interface DoubaoParams {
  size: '2K' | '4K' | '1K' | '1728x2304' | '2048x2048' | '1440x2560' | '2560x1440'
  sequentialImageGeneration: 'disabled' | 'auto'
  watermark: boolean
  responseFormat: 'b64_json' | 'url'
}

export interface ApiConfig {
  activeProvider: ImageProviderId
  imagePassMode: ImagePassMode
  useProxy: boolean
  stylePreset: string
  sendStitchedSheet: boolean
  providers: Record<ImageProviderId, ProviderEndpointConfig>
  gptParams: GptParams
  geminiParams: GeminiParams
  qwenParams: QwenParams
  doubaoParams: DoubaoParams
  comfyuiParams: ComfyUiParams
}

export interface GenerationHistoryItem {
  id: string
  createdAt: number
  provider: ImageProviderId
  model: string
  prompt: string
  imageUrl: string
  recipeSummary: string
  snapshot?: GenerationSnapshot
}


export interface GenerationSnapshot {
  recipe: RecipeState
  prompt: string
  settings: Omit<ApiConfig, 'providers'>
  models: Record<ImageProviderId, Pick<ProviderEndpointConfig, 'model' | 'customModel'>>
  submittedWorkflowJson?: string
}
