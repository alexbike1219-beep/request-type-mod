import { expect, test } from 'claude-code/testing'

const BAND = { plugin: 'request-type', component: 'AbovePrompt', props: { hasSurvey: false, isCollapsed: false, isWorking: false, maxRows: 5, bodyColumns: 80, scroll: { offset: 0, bodyRows: 5 }, view: {} }, surface: 'desktop' } as const

test('selected type prefixes the prompt then clears', async ($, on) => {
  let seen: any
  on('prompt.submit', (_, e) => { seen = e; return { text: e.text, context: e.context } })
  const ui = await $.ui.mount(BAND as any)
  await ui.press({ key: '除錯' })
  await $.prompt.submit({ text: 'hi' } as any)
  expect(seen.text).toBe('【類型：除錯】hi')
  await $.prompt.submit({ text: 'again' } as any)
  expect(seen.text).toBe('again')
  await ui.unmount()
})
