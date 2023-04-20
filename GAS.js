const LINE_ACCESS_TOKEN = "LINE_API_KEY";
const LINE_URL = "https://api.line.me/v2/bot/message/reply";
const GPT_KEY = "GPT_API_KEY";
const GPT_URL = "https://api.openai.com/v1/chat/completions";
const SPREAD_ID ="SHEET_ID"

var ss = SpreadsheetApp.openById(SPREAD_ID);
var sheet = ss.getActiveSheet();
var lastRow = sheet.getLastRow();


function doPost(e){
  
var reply_token = JSON.parse(e.postData.contents).events[0].replyToken;
if(typeof reply_token === "undefined"){
return;
}

var user_message = JSON.parse(e.postData.contents).events[0].message.text;

if (user_message === "削除して"){
sheet.deleteRows(2,lastRow-1);

}else{
sheet.appendRow([user_message]);
var gpt_format = format_data_for_api(user_message);
var gpt_message = gpt_response(gpt_format);
line_reply(gpt_message,reply_token);

var lastRow = sheet.getLastRow();
sheet.getRange("B"+lastRow).setValue(gpt_message);
}
}

function format_data_for_api(user_message){
  var lastRow = sheet.getLastRow();
	var data = [];
	for (var i = 2; i <= lastRow; i++) {
    var row = sheet.getRange(i, 1, 1, 1).getValue();
    data.push({
	    "role": "user",
      "content": row
    });
    var row = sheet.getRange(i, 2, 1, 1).getValue();
    if(!sheet.getRange(i,2,1,1).isBlank()){
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

