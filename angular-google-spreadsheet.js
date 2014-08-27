function spreadsheet($http, $q) {
  
  var converter = {
    'list':{
      'yarrays':function(data){
        var d = data.feed.entry;
        var results = {};
        for(var i=0,imax=d.length;i<imax;i+=1) {
          entry = d[i].content.$t.replace(/ /g,'').split(",");
          for(var j=0, jmax=entry.length;j<jmax;j+=1) {
            pair = entry[j].split(":");
            key = pair[0];
            value = pair[1];
            if (!results[key]) {results[key] = []}
            results[key].push(value);         
          }
        }       
       return results;
      },
      'translations':function(data){
        var results = {};
        var record,
            key,
            keyPath,
            x,
            lang;
        for(var i=0,imax=data.feed.entry.length;i<imax;i+=1) {
          record = data.feed.entry[i];
          //fetch languages
          if (i===0){
            if (typeof record.gsx$key === 'undefined'){
              throw 'Spreadsheet must have "key" column';
            }
            for (x in record){
              if (x.substr(0,4) === 'gsx$'){
                results[x.substr(4,100)] = {};
              }
            }
            delete results.key;
          } 
          //default rows
          for (lang in results){
            keyPath = record.gsx$key.$t.split('.');
            baseTarget =  results[lang];

            for (j = 0, jj = keyPath.length;j<jj;j+=1){
              if (j !== keyPath.length-1){
                if (typeof baseTarget[keyPath[j]] === 'undefined'){
                  baseTarget[keyPath[j]] = {};
                }
                baseTarget = baseTarget[keyPath[j]];
              } else {
                baseTarget[keyPath[j]] = record['gsx$'+lang].$t;
              }
            }
          }
          
        }
       
        //console.log('results', results);
        return results;
      },
      'objects':function(data){
        return data;
      }      
    },
    'cells':{
      'objects':function(data){
        return data;
      }
    }
  };
  
  
  return function(feed, key, worksheet, type) {
    var url = 'https://spreadsheets.google.com/feeds/' + feed +
      '/' + key + '/' + worksheet + '/public/values?alt=json-in-script&callback=JSON_CALLBACK';
    var deferred = $q.defer();
    $http.jsonp(url).success(function(data, status) {
      var results = converter[feed][type](data);
     
      deferred.resolve(results);
    }).error(function(data, status) {
     deferred.reject(data);
    });
    
    return deferred.promise;

  };
}


/**
 * Stores a translation fetched from Google Spreadsheets while allowing it to live update it
 */
function translationBuffer(){
  var translationBuffer = {},
      objectStored = false;

  translationBuffer.getLang = function(key){
    return objectStored[key];
  };

  translationBuffer.isSet = function(){
    return (objectStored !== false);
  };

  translationBuffer.set = function(obj){
    objectStored = obj;
  };

  translationBuffer.update = function(lang, key, value){
    if (typeof objectStored[lang] === undefined){
      objectStored[lang] = {};
    }
    var keyPath = key.split(',');
    var currentObject = objectStored[lang];
    //travers key path to set value
    for (var i=0,ii=keyPath.length-1;i<ii;i+=1){
      if (typeof currentObject[keyPath[i]] === 'undefined'){
        currentObject[keyPath[i]] = {};
      }
      currentObject = currentObject[keyPath[i]];
    }
    currentObject[keyPath[keyPath.length-1]] = value;
  };

  return translationBuffer;
}



/*
 * Custom Loader for angular-translate
 */
function googleSpreadsheetLoader($http, $q, spreadsheet, translationBuffer) {
    // return loaderFn
    return function (options) {
      var deferred = $q.defer();
      console.log('translationBuffer.isSet()',translationBuffer.isSet());
      if (!translationBuffer.isSet()){
        spreadsheet('list', 
                    options.id,
                    options.sheet,
                    'translations').then(
          function(data){
            translationBuffer.set(data);
            return deferred.resolve(translationBuffer.getLang(options.key));
          }
        );
      } else {
        deferred.resolve(translationBuffer.getLang(options.key));
      }
      return deferred.promise;
    };
}



/**
 * Module definition 
 */ 
angular.
 module('ngGSpreadsheet', [])
 .factory('spreadsheet', ['$http', '$q', spreadsheet])
 .factory('translationBuffer', translationBuffer)
 .factory('googleSpreadsheetLoader', ['$http', '$q', 'spreadsheet', 'translationBuffer', googleSpreadsheetLoader]);
