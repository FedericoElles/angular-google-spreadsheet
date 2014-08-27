angular-google-spreadsheet
==========================

Service to fetch Googe Speadsheet data via JSON



*AngularJS configuration*

    .config(function ($translateProvider) {
      $translateProvider.useLoader('googleSpreadsheetLoader', {
        id: '1-TdI_u4vMrxQC8orUrv1TNnLRN8WAyfvnk8rDvR8A2o',
        sheet: 1
      });
      $translateProvider.preferredLanguage('de');
    })
    

*Changing language*
                  
    $rootScope.changeLanguage = function (langKey) {
      $translate.use(langKey);
    };
    
    
*Updating language on the fly*

    //Live Update demonstration
    $rootScope.liveUpdate = function(){
      translationBuffer.update('de', 'NAVBAR.SEARCH', 'Finden');
      $translate.refresh();
    }
