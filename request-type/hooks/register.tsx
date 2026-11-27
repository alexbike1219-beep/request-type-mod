import { atom, read, update } from 'claude-code'
import type { Register } from 'claude-code'

// 類型 → 模型（別名會自動對應到最新版本）
const MODEL_OF: Record<string, string> = {
  細節調整: 'sonnet',
  功能製作: 'sonnet',
  除錯: 'sonnet',
  規劃調整: 'opus',
  諮詢: 'sonnet',
  // 補充：沿用上一輪的模型，見下方
}
const TYPES = ['細節調整', '功能製作', '除錯', '規劃調整', '補充', '諮詢'] as const

const selected = atom({ plugin: 'request-type', key: 'selected' } as const, null)
const opus = atom({ plugin: 'request-type', key: 'opus' } as const, false)

const HINT_PICKED = (t: string) =>
  `使用者已用介面選定需求類型「${t}」。不要顯示類型選單。先看可用的 skill 清單：若有 tiered-model-workflow，本對話還沒載入過就先用 Skill 工具載入，再依其中「${t}」的流程進行（先對齊理解、依規模分級、遵守確認點）；本對話已載入過就不必重載，直接依「${t}」的流程進行。若沒有這個 skill，就照一般方式處理。主對話的模型已由介面依類型切換好，不要為了換模型而另派子代理。`
const HINT_NONE =
  '使用者未選需求類型。不要顯示類型選單；若有進行中的流程，照該流程繼續；沒有就當一般使用，照平常方式回答。'

type Plan = { label: string; model: string | null }

export const register: Register = on => {
  let pending: Plan | undefined // 送出時決定，交給下一個主對話回合
  const plans = new Map<string, Plan>() // turnId → 這一輪的安排
  let lastModel: string | undefined // 上一輪主對話實際用的模型（補充沿用）

  on('prompt.submit', async ($, e, next) => {
    // 只處理使用者自己在輸入框按 Enter 的訊息；斜線指令、通知、排程等原樣放行
    if (e.command || e.isMeta || (e.origin !== undefined && e.origin.kind !== 'composer')) {
      return next(e)
    }

    const type = await read($, selected)
    const forceOpus = await read($, opus)
    await update($, selected, () => null) // 每次送出都清除
    await update($, opus, () => false)

    const model = forceOpus
      ? 'opus'
      : type === null
        ? null // 沒選：用你 /model 設定的模型，不插手
        : type === '補充'
          ? (lastModel ?? null)
          : (MODEL_OF[type] ?? null)

    pending = { label: (type ?? '未選') + (forceOpus ? '+Opus' : ''), model }

    if (type === null) {
      return next({ ...e, context: [...(e.context ?? []), HINT_NONE] })
    }

    return next({
      ...e,
      text: `【類型：${type}】${e.text}`,
      context: [...(e.context ?? []), HINT_PICKED(type)],
    })
  })

  on('turn.start', ($, e, next) => {
    if (e.agentId === undefined && pending !== undefined) {
      plans.set(e.turnId, pending)
      pending = undefined
    }

    return next(e)
  })

  on('turn.step', async function* ($, e, next) {
    // 只改主對話；子代理有自己的模型設定
    if (e.agentId !== undefined) {
      return yield* next(e)
    }

    const plan = plans.get(e.turnId)
    const model = plan?.model ?? e.model
    lastModel = model

    if (e.index === 0) {
      $.ui.status(`本輪：${plan?.label ?? '未選'}｜${model}`)
    }

    return yield* next(model === e.model ? e : { ...e, model })
  })

  on('turn.complete', ($, e, next) => {
    plans.delete(e.turnId)

    return next(e)
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (e.props.hasSurvey) {
      return next(e)
    }

    const current = await read($, selected)
    const isOpus = await read($, opus)
    const { Box, Text, Button } = $.ui.resolve(e)

    return (
      <Box>
        <Text dimColor>需求類型 </Text>
        {TYPES.map(t => (
          <Button
            key={t}
            label={current === t ? `▶ ${t}` : t}
            variant={current === t ? 'primary' : undefined}
            onPress={() => update($, selected, v => (v === t ? null : t))}
          />
        ))}
        <Text dimColor> </Text>
        <Button
          key="opus"
          label={isOpus ? '▶ ⬆ Opus' : '⬆ Opus'}
          variant={isOpus ? 'primary' : undefined}
          onPress={() => update($, opus, v => !v)}
        />
      </Box>
    )
  })
}
