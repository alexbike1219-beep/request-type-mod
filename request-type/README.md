# request-type

在輸入框上方加一排「需求類型」按鈕：細節調整｜功能製作｜除錯｜規劃調整｜補充｜諮詢。

- 點選一個類型後按 Enter，訊息最前面會自動加上「【類型：除錯】」。
- 送出後選擇自動清除；沒選就原樣送出，不會擋住送出。
- 斜線指令（/xxx）不加前綴。
- 全部由介面處理，不額外呼叫模型；每則訊息只多附一句約 30 token 的隱藏提示，告訴模型不要再跳類型選單。

## 安裝

```
/plugin install request-type --marketplace <owner>/<repo>
```

搭配 tiered-model-workflow skill 使用：skill 需改為「看到【類型：X】前綴就直接走該流程，不再先顯示選單」。

## English summary

This mod adds a row of request-type buttons above the prompt box: detail tweak, feature build, debug, plan change, supplement and consult. Pick one, press Enter, and the message is sent with a type prefix such as the bracketed type label in front. The selection resets after every send, an unselected message goes out unchanged, and slash commands are never rewritten. Everything is handled in the interface with no extra model call, so it saves tokens compared with asking a menu question every turn.
