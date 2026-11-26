import { atom, read, update } from 'claude-code'
import type { Register } from 'claude-code'

const TYPES = ['細節調整', '功能製作', '除錯', '規劃調整', '補充', '諮詢'] as const

const selected = atom({ plugin: 'request-type', key: 'selected' } as const, null)

const HINT_PICKED = (t: string) =>
  `使用者已用介面選定需求類型「${t}」。不要顯示類型選單，直接依 tiered-model-workflow 的「${t}」流程進行。`
const HINT_NONE =
  '使用者未選需求類型。不要顯示類型選單，當作一般使用，照平常方式回答。'

export const register: Register = on => {
  on('prompt.submit', async ($, e, next) => {
    // 只處理使用者自己在輸入框按 Enter 的訊息；斜線指令、通知、排程等原樣放行
    if (e.command || e.isMeta || (e.origin !== undefined && e.origin.kind !== 'composer')) {
      return next(e)
    }

    const type = await read($, selected)
    await update($, selected, () => null) // 每次送出都清除

    if (type === null) {
      return next({ ...e, context: [...(e.context ?? []), HINT_NONE] })
    }

    return next({
      ...e,
      text: `【類型：${type}】${e.text}`,
      context: [...(e.context ?? []), HINT_PICKED(type)],
    })
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (e.props.hasSurvey) {
      return next(e)
    }

    const current = await read($, selected)
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
      </Box>
    )
  })
}
