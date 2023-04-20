#  line-chatgpt-bot

ChatGPTをLINEで利用できるようにしたものです。
LINE messaging APIとChatGPTAPIの取得が必要です。

#DEMO
コードの利用方法です。
* Google Apps Script(GAS)で動かします。
* LINE messaging APIを取得
* GASでWebhookを取得しLINE Developerに登録
* ChatGPTAPIを取得
* スプレッドシートを作成し、IDを取得
*　LINE、ChatGPT、スプシIDをコードに入力
```javascript
const LINE_ACCESS_TOKEN = "LINE_API_KEY";
const GPT_KEY = "GPT_API_KEY";
const SPREAD_ID ="SHEET_ID"
```
