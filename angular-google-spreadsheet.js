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

angular.
 module('ngGSpreadsheet', []).
 factory('spreadsheet', ['$http', '$q', spreadsheet]);
