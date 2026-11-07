import { createFileRoute } from '@tanstack/react-router'
import { Section } from '@/components/common/FormSection'
import { PageHeader } from '@/components/common/PageHeader'
import { Badge } from '@/components/ui/badge'

export const Route = createFileRoute('/guide')({
  staticData: { title: '使用指南与免责声明' },
  component: GuidePage,
})

function GuidePage() {
  return (
    <>
      <PageHeader title="使用指南与免责声明" />

      <Section title="角色合成流程" className="@lg/section:grid-cols-3">
        <div className="rounded-2xl bg-background p-4">
          <Badge>1. 人像</Badge>
          <h3 className="mt-2 text-sm font-semibold">人像颜值库 (1,499)</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            挑选五官与发型参考，或在合成台直接上传自定义人像图，锁定角色面部特征。
          </p>
        </div>

        <div className="rounded-2xl bg-background p-4">
          <Badge>2. 服装</Badge>
          <h3 className="mt-2 text-sm font-semibold">服装穿搭库 (3,224)</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            按全部 / 现实 / 二次元及来源、分类、标签挑选；含ギア写实 1,407 套、Shisei 中国历代 57 套（227 视角）、ギア动漫 1,320 套与 CharaDB 二次元 440 套。
          </p>
        </div>

        <div className="rounded-2xl bg-background p-4">
          <Badge>3. 姿势 + 附图</Badge>
          <h3 className="mt-2 text-sm font-semibold">动作姿势库 (1,439)</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            挑选 5 视角 3D 素体白模或深度图（Depth），结合云端 API 或本地 ComfyUI 一键生成角色立绘。
          </p>
        </div>
      </Section>

      <Section title="AI 娘（aichan）角色與配飾來源" className="@lg/section:grid-cols-1">
        <div className="space-y-2.5 rounded-2xl bg-background p-4 text-xs leading-relaxed text-muted-foreground">
          <p>
            <strong className="text-foreground">• AI 娘擬人化角色：</strong>
            本站「aichan 形象 / 服裝配飾 / 換裝」收錄 18 位 AI 娘（GPT 娘、DeepSeek 娘、Claude 娘、Gemini 娘、Kimi 娘、豆包 Seed 娘、文心一言娘、通義千問娘、MiniMax 娘、Grok 娘、MiMo 兔娘、LongCat 娘等）的設定圖、三視圖、表情與配飾素材。
          </p>
          <p>
            <strong className="text-foreground">• 非官方聲明：</strong>
            上述 AI 娘均為粉絲二次創作的擬人化形象，
            <strong className="text-foreground">與 OpenAI / Google / Anthropic / DeepSeek / 智譜（GLM）/ 字節跳動 / 阿里巴巴 / 百度 / 月之暗面 / MiniMax / xAI / 小米 / 美團等實際公司及其產品無關</strong>
            ，未獲任何官方授權或背書；相關名稱與商標權利均歸各自公司所有。
          </p>
          <p>
            <strong className="text-foreground">• 資料來源與授權：</strong>
            原始角色立繪出自 <strong className="text-foreground">ZipZipPipe</strong>，由{' '}
            <a className="underline hover:text-foreground" href="https://github.com/lmy414/ai-chan-sheets" target="_blank" rel="noopener noreferrer">lmy414/ai-chan-sheets</a>{' '}
            補全為橫版完整設定圖（三視圖 / 表情 / 服裝 / 道具，原生像素 1:1 拼接），遵循{' '}
            <strong className="text-foreground">CC BY-NC-SA 4.0（署名－非商業性使用－相同方式共享）</strong>。本站僅作中文整理與前端學習存檔，請遵守非商業使用與署名要求。
          </p>
        </div>
      </Section>

      <Section title="免责声明与合规使用规范（必读）" className="@lg/section:grid-cols-1">
        <div className="space-y-2.5 rounded-2xl bg-background p-4 text-xs leading-relaxed text-muted-foreground">
          <p>
            <strong className="text-foreground">1. 仅供学习与合法艺术创作（严禁违法）：</strong>
            本项目（含网页工作台、本地 ComfyUI 插件与工作流模板）
            <strong className="text-foreground">仅供个人学习、人体结构研究、插画构图参考与技术交流使用</strong>
            。严禁使用本工具生成、制作或传播任何违反法律法规、淫秽色情、暴力违禁内容，严禁未经他人明确授权上传真实人物照片进行换脸或深伪合成（Deepfake）等侵犯他人肖像权、隐私权与名誉权的行为。
          </p>
          <p>
            <strong className="text-foreground">2. NSFW（18+）敏感内容提示：</strong>
            图库中包含部分成人向 3D 素体姿势（全身单人・性感系、双人缠绵）与内衣/性感穿搭参考，旨在服务绘画与动作设计练习。系统默认开启「安全模式 (SFW)」屏蔽上述分类，
            <strong className="text-rose-600 dark:text-rose-400">未满 18 周岁的未成年人严禁关闭安全模式或访问相关内容</strong>。
          </p>
          <p>
            <strong className="text-foreground">3. 隐私保护与使用者责任归属：</strong>
            本工作台为纯前端本地应用，所有 AI 生图请求均由使用者自行配置的云端 API Key 或使用者本机 ComfyUI 环境直接执行，平台不收集、不存储任何用户上传的图片或生成结果。
            <strong className="text-foreground">因使用者违规使用或不当传播所产生的一切法律责任，均由使用者本人独立承担，与本项目及维护者无关。</strong>
          </p>
        </div>
      </Section>

      <Section title="数据来源与版权说明" className="@lg/section:grid-cols-1">
        <div className="space-y-2.5 rounded-2xl bg-background p-4 text-xs leading-relaxed text-muted-foreground">
          <p>
            <strong className="text-foreground">• 原作者版权归属：</strong>
            本仓库原有姿势（<code>ai-pose-gallery.pages.dev</code>、<code>ai-pose-depth-gallery.pages.dev</code>）、现实服装（<code>ai-costume-gallery.pages.dev</code>）、人像（<code>ai-portrait-gallery.pages.dev</code>）参考图与原始元数据源自原作者{' '}
            <strong className="text-foreground">ギア（@giaaibusi）</strong> 公开站点，著作权归原作者所有。本仓库仅为中文本地化翻译整理与前端工程学习存档，不对原始图片主张任何所有权。
          </p>
          <p>
            <strong className="text-foreground">• 二次元服装来源：</strong>
            440 套二次元服装源自 <a className="underline hover:text-foreground" href="https://charadb-2fi.pages.dev/" target="_blank" rel="noopener noreferrer">たき AI · CharaDB</a>（标签与名称遵循 CC0，图片从原站在线加载，仅供学习与生图参考，禁止用于真人/未成年人或将原图二次分发，详见 <a className="underline hover:text-foreground" href="https://github.com/taki-ttt/charadb/blob/main/LICENSE" target="_blank" rel="noopener noreferrer">原作者说明</a>）。
          </p>
          <p>
            <strong className="text-foreground">• AI 娘（aichan）来源：</strong>
            18 位 AI 娘擬人化形象源自{' '}
            <a className="underline hover:text-foreground" href="https://github.com/lmy414/ai-chan-sheets" target="_blank" rel="noopener noreferrer">lmy414/ai-chan-sheets</a>{' '}
            （原作者 ZipZipPipe，CC BY-NC-SA 4.0 非商業）；均為粉絲二次創作的非官方擬人化，與對應 AI 公司無關。
          </p>
          <p>
            <strong className="text-foreground">• 使用与分发限制：</strong>
            人像库遵循 <strong className="text-emerald-600 dark:text-emerald-400">CC0 1.0 协议</strong>；原有姿势库与现实服装库免费供个人学习与 AI 生图参考使用，
            <strong className="text-foreground">严禁将本图库原始图片打包转售或用于付费分发</strong>。
          </p>
        </div>
      </Section>
    </>
  )
}
