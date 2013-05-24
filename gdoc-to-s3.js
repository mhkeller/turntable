var $   = require('jquery'),
  dsv   = require('dsv'),
  AWS   = require('aws-sdk'),
  TweetBot,
  T;

AWS.config.loadFromPath('/path/to/credentials.json');
var s3 = new AWS.S3();

/* ------------------------ */
/*    SET UP ACCOUNT INFO   */
/*      AND FILE SCHEMA     */
/* ------------------------ */
var CONFIG = {
  bucket: '',
  key: '0Aoev8mClJKw_dFFEUHZLV1UzQmloaHRMdHIzeXVGZFE',
  output_schema: ['name','color'], // These are the columns to carry over into your file on S3
  output_path: 'tests/',
  file_name: 'names.csv',
  use_twitter_bot: false
};

if (CONFIG.use_twitter_bot){
  TweetBot = require('twit');
  T = new TweetBot({
    consumer_key:         'w',
    consumer_secret:      'x',
    access_token:         'y',
    access_token_secret:  'z'
  });

}

function fetchGDoc(key){
  $.ajax({
    url: 'https://docs.google.com/spreadsheet/pub?key=' + key + '&output=csv',
    success:function(response){

      var timestamp      = getFormattedISOTimeStamp();

      var status        = 'Fetch successful: ' + timestamp;
      reportStatus(status);

      var json          = dsv.csv.parse(response);
      var sanitized_csv = sanitizeData(json);

      uploadToS3(sanitized_csv, timestamp);

    },
    error: function(err){
      console.log(err);
      var timestamp = getFormattedISOTimeStamp();
      var status    = 'Ajax error: ' + timestamp;
      reportStatus(status);
    }
  })
}

function reportStatus(text){
    console.log(text);
    if(CONFIG.use_twitter_bot){
        tweetStatus(text);
      }
}

function tweetStatus(text){
  T.post('statuses/update', { status: text }, function(err, reply) {
    // console.log('Status updated')
  })
};

function sanitizeData(json){
  var sanitized_json = [];
  json.forEach(function(row){
    var obj = {};
    CONFIG.output_schema.forEach(function(col){
      obj[col] = row[col];
    });
    sanitized_json.push(obj);
  });

  // Convert to csv
  return dsv.csv.format(sanitized_json);
}

function uploadToS3(sanitized_csv, timestamp){
  uploadToS3_backup(sanitized_csv, timestamp);
  uploadToS3_live(sanitized_csv, timestamp);
}

function uploadToS3_backup(sanitized_csv, timestamp){
  var data = {
    Bucket: CONFIG.bucket,
    Key: CONFIG.output_path + 'backups/' + timestamp + CONFIG.file_name,
    Body: sanitized_csv
  };
  s3.client.putObject( data , function (resp) {
    if (resp == null){
      var status = 'Backup upload successful: ' + timestamp;
      reportStatus(status);
    };
  });
}

function uploadToS3_live(sanitized_csv, timestamp){
  var data = {
    Bucket: CONFIG.bucket,
    Key: CONFIG.output_path + CONFIG.file_name,
    Body: sanitized_csv
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