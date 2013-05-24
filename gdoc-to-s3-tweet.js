var $   = require('jquery'),
  AWS   = require('aws-sdk'),
  T     = require('twit');

AWS.config.loadFromPath('/path/to/credentials.json');
var s3 = new AWS.S3();


var Twit = require('twit')

var T = new Twit({
  consumer_key:         '...',
  consumer_secret:      '...',
  access_token:         '...',
  access_token_secret:  '...'
});


/* ------------------------ */
/*    SET UP ACCOUNT INFO   */
/*      AND FILE SCHEMA     */
/* ------------------------ */
var CONFIG = {
  bucket: '',
  key: '0Aoev8mClJKw_dFFEUHZLV1UzQmloaHRMdHIzeXVGZFE',
  input_schema:  ['name','color'], // These are the columns in your Google Doc used to verify the response
  output_schema: ['name','color'], // These are the columns to carry over into your csv on S3
  output_path: 'tests/',
  file_name: 'names.csv'
};

function fetchGDoc(key){
  $.ajax({
    url: 'https://docs.google.com/spreadsheet/pub?key=' + key + '&output=csv',
    success:function(response){

      var timestamp      = getFormattedISOTimeStamp();
      var header_columns = response.split('\n')[0].split(',');

      if (arraysEqual(header_columns, CONFIG.input_schema)){
        var status        = 'Fetch successful: ' + timestamp;
        reportStatus(status);

        var json          = csvToJSON(response, header_columns);
        var sanitized_csv = sanitizeData(json);

        uploadToS3_backup(response, timestamp);
        uploadToS3_live(response, timestamp);
      };

    },
    error: function(err){
      console.log(err);
      var timestamp = getFormattedISOTimeStamp();
      var status    = 'Ajax error: ' + timestamp;
      tweetStatus(status);
    }
  })
}

function reportStatus(text){
    console.log(text);
    tweetStatus(text);
}

function tweetStatus(text){
  T.post('statuses/update', { status: text }, function(err, reply) {})
}

function arraysEqual(arr1, arr2) {
  if(arr1.length !== arr2.length){
    return false;
  }
  for(var i = arr1.length; i--;) {
    if(arr1[i] !== arr2[i]){
      return false;
    }
  }
  return true;
}

function sanitizeData(json){
  var csv = CONFIG.output_schema.join(',') + '\n';
  for (var i = 0; i < json.length; i++){
    var row = [];
    for (var q = 0; q < CONFIG.output_schema.length; q++){
      row.push(json[i][CONFIG.output_schema[q]])
    }
    if (i < json.length - 1){
      csv += row.join(',') + '\n';
    }else{
      csv += row.join(',');
    }
  }

  return csv;
}

function csvToJSON(response, header_columns){
  var json = [];
  var rows = response.split('\n');
  // Skip the first row because it's the header row
  for (var i = 1; i < rows.length; i++){
    var obj = {};
    var vals = rows[i].split(',');
    for (var q = 0; q < vals.length; q++){
      obj[header_columns[q]] = vals[q];
    }
    json.push(obj);
  }
  return json;
}

function uploadToS3_backup(response, timestamp){
  var data = {
    Bucket: CONFIG.bucket,
    Key: CONFIG.output_path + 'backups/' + timestamp + CONFIG.file_name,
    Body: response
  };
  s3.client.putObject( data , function (resp) {
    if (resp == null){
      var status = 'Backup upload successful: ' + timestamp;
      reportStatus(status);
    };
  });
}

function uploadToS3_live(response, timestamp){
  var data = {
    Bucket: CONFIG.bucket,
    Key: CONFIG.output_path + CONFIG.file_name,
    Body: response
  };
  s3.client.putObject( data , function (resp) {
    if (resp == null){
      var status = 'Live file overwrite successful: ' + timestamp;
      reportStatus(status);
    };
  });
}

function getFormattedISOTimeStamp(){
  // Format the time a bit more readable by replacing colons, getting rid of the Z
  // and adding an underscore at the end to separate it from the file_name
  return new Date().toISOString().replace(/:/g,'_').replace('Z','') + '_';
}
fetchGDoc(CONFIG.key);