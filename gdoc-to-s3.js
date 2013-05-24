var $ = require('jquery'),
  AWS = require('aws-sdk');

AWS.config.loadFromPath('/path/to/credentials.json');
var s3 = new AWS.S3();


/* ------------------------ */
/*    SET UP ACCOUNT INFO   */
/*      AND FILE SCHEMA     */
/* ------------------------ */
var CONFIG = {
      bucket: '',
      key: '0Aoev8mClJKw_dFFEUHZLV1UzQmloaHRMdHIzeXVGZFE',
      schema: 'name,color',
      path: 'tests/',
      file_name: 'names.csv'
};

function fetchGDoc(key){
  $.ajax({
    url: 'https://docs.google.com/spreadsheet/pub?key=' + key + '&output=csv',
    success:function(response){

      var timestamp = getFormattedISOTimeStamp();
      var header_row = response.split('\n')[0];

      if (header_row === CONFIG.schema){
        console.log('Fetch successful', timestamp, response);

        uploadToS3_backup(response, timestamp);
        uploadToS3_live(response, timestamp);
      };


    },
    error: function(err){
      console.log(err)
    }
  })
}


function uploadToS3_backup(response, timestamp){
  var data = {
    Bucket: CONFIG.bucket,
    Key: CONFIG.path + 'backups/' + timestamp + CONFIG.file_name,
    Body: response
  };
  s3.client.putObject( data , function (resp) {
        if (resp == null){
          console.log('Backup upload successful', timestamp)
        };
  });
}

function uploadToS3_live(response, timestamp){
  var data = {
    Bucket: CONFIG.bucket,
    Key: CONFIG.path + CONFIG.file_name,
    Body: response
  };
  s3.client.putObject( data , function (resp) {
        if (resp == null){
          console.log('Live file overwrite successful', timestamp)
        };
  });
}

function getFormattedISOTimeStamp(){
  // Format the time a bit more readable by replacing colons, getting rid of the Z
  // and adding an underscore at the end to separate it from the file_name
  return new Date().toISOString().replace(/:/g,'_').replace('Z','') + '_';

}
fetchGDoc(CONFIG.key);