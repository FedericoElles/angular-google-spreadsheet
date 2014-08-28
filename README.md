angular-google-spreadsheet
==========================

Service to fetch Googe Speadsheet data via JSON



Use Case #1 - Real time translations with angular-translate
------------------------------------

Use a Google Spreadsheet to translate your webapp. See the changes in your app in realtime.

## Requirements:

- Free [PubNub](http://www.pubnub.com/) Account for pushing changes to your app
- Google [Spreadsheet](https://docs.google.com/spreadsheet/) 
- AngularJS app with [angular-translate](http://angular-translate.github.io/) module


## Setup

#### PubNub

 - Create a free account. A Sandbox app will be created automagically for you
 - Have the **subscribe** and **publish** keys ready
 - Open the "Dev Console" (Small link below the green Upgrade button)
 - Change the chanell to 'translate' and subscribe. This way you will be able to see the changes pushed by the Google Spreadsheet

#### Google Docs

 - Create a new Google Spreadsheet
 - Make it public: 'File' -> 'Publish to the web'
 - Copy the unique file id: "...docs.google.com/spreadsheets/d/**1-TdI_u4vMrxQC8orUrv1TNnLRN8WAyfvnk8rDvR8A2o**/..."
 - Design the spreadsheet. It should look like



key | en | de
------------ | ------------- | -------------
NAVBAR.SEARCH | Search | Suche
NAVBAR.INSERT | Insert | Eingabe
NAVBAR.HELLO | Hello | Hallo

 - Open 'Tools' -> 'Script Editor', so we can add a script to submit changes to PubNub
 - Paste the following code

```javascript
var PUB_KEY = '<pubnub publish key>';
var SUB_KEY = '<pubnub subscribe key>';
var CHANNEL = 'translate';

function onEditNotify(e) {
  if (e) { 
    var ss = e.source.getActiveSheet();
    var r = e.source.getActiveRange(); 
    
    if (r.getRow() !== 1 && r.getColumn() !== 1) {
      
      var key = ss.getRange(e.range.getRow(), 1).getValue();
      var lang = ss.getRange(1, e.range.getColumn()).getValue();
      
      var msg = '' + lang + '___' + key + '___' + e.range.getValue();
      //e.range.setNote(msg);  
      
      var url = 'http://pubsub.pubnub.com/publish/' +
        PUB_KEY + '/' + SUB_KEY + '/0/' + CHANNEL + '/0/' + escape('"' + msg + '"');
      var response = UrlFetchApp.fetch(url);
    }
  }
}
```		

 - Hook up the onEditNotify function to the Spreadsheet onEdit event:
   - Menu -> Resources -> Current project's trigge
   - Add new trigger: Run 'onEditNotify' on Event 'From spreadsheet' 'On edit'
   - Save
 - Test: Change any cell in the spreadsheet and check if a message did arrive on the 'translate' channel in the PubNub Development console

#### Your App

1. Install the required bower libraries to your AngularJS project

```javascript
bower install angular-translate angular-google-spreadsheet pubnub-angular --save
```

2. Add scripts to your index.html

```javascript
<script src="http://cdn.pubnub.com/pubnub.min.js"></script>
<script src="components/angular-google-spreadsheet/angular-google-spreadsheet.js"></script>
<script src="components/pubnub-angular/pubnub-angular.js"></script>
```


3. Setup angular-translate with Google Spreadsheet Translation Provider

```javascript
var myApp = angular.module('myApp', [...]) //your app module

.config(function ($translateProvider) {
  $translateProvider.useLoader('googleSpreadsheetLoader', {
    id: '<your google docs public id>', //ADD MISSING INFORMATION HERE
    sheet: 1
  });
  $translateProvider.preferredLanguage('en');
})
```

4. Changing language is done via angular-translate. You have to inject the **$translate** service.

```javascript
.run(function($translate, pubNub, translationBuffer){... // Inject Services
	
  $rootScope.changeLanguage = function (langKey) {
  $translate.use(langKey);
};
```
    
    
5. Updating the language in realtime requires the **PubNub** and **translationBuffer** services.

```javascript
.run(function($translate, PubNub, translationBuffer){... // Inject Services

  //connect to PubNub
  PubNub.init({
    subscribe_key: '<pubnub subscribe key>',
    publish_key: '<pubnub publish key>'
  });

  //Subscribe to 'translate' channel
  PubNub.ngSubscribe({ channel: 'translate' });

  //Update translation on message
  $rootScope.$on(PubNub.ngMsgEv('translate'), function(ngEvent, payload) {
    var params = payload.message.split('___');

    //console.log('New Translation arrived:', payload.message, params);
    //Update translation Buffer with new translation value
    translationBuffer.update(params[0], params[1], params[2]);

    //Tell angular-translate to fetch new translations from 
    $translate.refresh();
  });
```  

6. Test: Change any translation in the Google Spreadsheet and validate if a message from PubNub arrives in your AngularJS app. The translated text value should change instantly.

#### Resources

- [Using PubNub with AngluarJS ](http://www.pubnub.com/blog/angularjs-101-from-zero-to-angular-in-seconds/)
- [PubNub REST API](http://www.pubnub.com/http-rest-push-api/)
