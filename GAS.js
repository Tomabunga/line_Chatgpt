//PropertiesService.getScriptProperties().getProperty('API_KEY');
const LINE_ACCESS_TOKEN = "LINE_API_KEY";
const LINE_URL = "https://api.line.me/v2/bot/message/reply";
const GPT_KEY = "GPT_API_KEY";
const GPT_URL = "https://api.openai.com/v1/chat/completions";
const SPREAD_ID ="SPREAD_SHEET_ID"

var ss = SpreadsheetApp.openById(SPREAD_ID);


function doPost(e){

var event = JSON.parse(e.postData.contents).events[0];
 var type = event.source.type;
 if (type == 'user') {
    var id = event.source.userId;
  } else if (type == 'group') {
    var id = event.source.groupId;
  } else if (type == 'room') {
    var id = event.source.roomId;
  }
  set_sheet(id);//ユーザーIDを取得し、シートを作成する　
  var user_sheet = ss.getSheetByName(id);

var reply_token = JSON.parse(e.postData.contents).events[0].replyToken;
if(typeof reply_token === "undefined"){
return;
}
var user_message = JSON.parse(e.postData.contents).events[0].message.text;
  var lastRow = user_sheet.getLastRow();
if (user_message === "削除して") {
  var unused_seet = ss.getSheetByName("ゴミ箱");
  var data = user_sheet.getRange("A2:B" + user_sheet.getLastRow()).getValues();
  unused_seet.getRange(unused_seet.getLastRow() + 1, 1, data.length, data[0].length).setValues(data);
  var lastRow = user_sheet.getLastRow();
  user_sheet.deleteRows(2, lastRow - 1);
   line_reply("全てのデータを削除しました",reply_token);
}else if(user_message==="忘れて"){
  user_sheet.deleteRow(2);
   line_reply("一番古いデータのみ削除しました",reply_token);
}else{

user_sheet.appendRow([user_message]);
var gpt_format = format_data_for_api(user_sheet); //gpt用format変換
var gpt_message = gpt_response(gpt_format); //gptAPIに送信し返答を得る
line_reply(gpt_message,reply_token);//LINEに送信

var lastRow = user_sheet.getLastRow();
user_sheet.getRange("B"+lastRow).setValue(gpt_message);//返答をシートに追加
}
}

function format_data_for_api(user_sheet){
  var lastRow = user_sheet.getLastRow();
	var data = [];
	for (var i = 2; i <= lastRow; i++) {
    var row = user_sheet.getRange(i, 1, 1, 1).getValue();
    data.push({
	    "role": "user",
      "content": row
    });
    var row = user_sheet.getRange(i, 2, 1, 1).getValue();
    if(!user_sheet.getRange(i,2,1,1).isBlank()){
	    data.push({
	    "role":"assistant",
	    "content": row
     });
     }
  }
	var dataStr = JSON.stringify(data);
	var dataStr = JSON.parse(dataStr);
	
	const headers = {
    'Authorization':'Bearer '+ GPT_KEY,
    'Content-type': 'application/json',
    'X-Slack-No-Retry': 1
}

	const options = {
    'muteHttpExceptions' : true,
    'headers': headers, 
    'method': 'POST',
    'payload': JSON.stringify({
      'model': 'gpt-3.5-turbo',
      'max_tokens' : 1024,
      'temperature' : 0.9,
      'messages': dataStr
    }
    )
  };
    return options;
}

function gpt_response(gpt_format){
    const response = JSON.parse(UrlFetchApp.fetch(GPT_URL, gpt_format).getContentText());
    var gpt_message_format = response.choices[0].message.content;
    var gpt_message_format = gpt_message_format.replace(/^\n+/, '');
    return gpt_message_format;
    }

function line_reply(message,reply_token){
    var headers = {
        'Content-Type': 'application/json; charset=UTF-8',
        'Authorization': 'Bearer ' + LINE_ACCESS_TOKEN,
    };

    var line_reply_text = {
        'replyToken': reply_token,
        'messages': [{
            'type': 'text',
            'text':  message,
        }]
    }
    var options = {
        'headers':headers,
        'method': 'post',
        'payload': JSON.stringify(line_reply_text),
    }
    //送信
    UrlFetchApp.fetch(LINE_URL,options);
    
}

function set_sheet(name){
  //同じ名前のシートがなければ作成
  var sheet = ss.getSheetByName(name);
  if(sheet)
    return sheet;

  sheet=ss.insertSheet();
  sheet.setName(name);
  sheet.appendRow(["role","content"]);
  return sheet;
}
