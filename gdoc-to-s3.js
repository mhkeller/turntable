var $   = require('jquery'),
    dsv   = require('dsv'),
    AWS   = require('aws-sdk'),
    TweetBot,
    T;

var aws_info      = require('./config/aws-info.json')
    gdoc_info     = require('./config/gdoc-info.json'),
    tweetbot_info = require('./config/tweetbot-info.json');

AWS.config.loadFromPath(aws_info.credentials);
var s3 = new AWS.S3();

/* ------------------------ */
/*    SET UP ACCOUNT INFO   */
/*      AND FILE SCHEMA     */
/* ------------------------ */

if (tweetbot_info.use_twitter_bot){
  TweetBot = require('twit');
  T = new TweetBot( tweetbot_info );
};

function fetchGDoc(key){
  $.ajax({
    url: 'https://docs.google.com/spreadsheet/pub?key=' + key + '&output=csv',
    success:function(response){

      var timestamp      = getFormattedISOTimeStamp();

      var status        = 'Successful fetch: ' + timestamp;
      reportStatus(status);

      var json          = dsv.csv.parse(response);
      var sanitized_csv = sanitizeData(json);

      uploadToS3(sanitized_csv, timestamp);

    },
    error: function(err){
      console.log(err);
      var timestamp = getFormattedISOTimeStamp();
      var status    = 'ERROR IN AJAX!: ' + timestamp;
      reportStatus(status);
    }
  })
}

function reportStatus(text){
    console.log(text);
    if(tweetbot_info.use_twitter_bot){
        tweetStatus(text);
    }
}

function tweetStatus(text){
  T.post('statuses/update', { status: text }, function(err, reply) {
    console.log(err)
  });
};

function sanitizeData(json){
  var sanitized_json = [];
  json.forEach(function(row){
    var obj = {};
    gdoc_info.output_schema.forEach(function(col){
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
  var status;
  var data = {
    Bucket: aws_info.bucket,
    Key: aws_info.output_path + 'backups/' + timestamp + aws_info.file_name,
    Body: sanitized_csv
  };
  s3.client.putObject( data , function (resp) {
    if (resp == null){
      status = 'Successful backup upload: ' + timestamp;
      reportStatus(status);
    }else{
      status = 'ERROR IN BACKUP UPLOAD: ' + timestamp;
      reportStatus(status);
    };
  });
}

function uploadToS3_live(sanitized_csv, timestamp){
  var status;
  var data = {
    Bucket: aws_info.bucket,
    Key: aws_info.output_path + aws_info.file_name,
    Body: sanitized_csv
  };
  s3.client.putObject( data , function (resp) {
    if (resp == null){
      status = 'Successful live file overwrite: ' + timestamp;
      reportStatus(status);
    }else{
      status = 'ERROR IN LIVE UPLOAD: ' + timestamp;
      reportStatus(status);
    };
  });
}

function getFormattedISOTimeStamp(){
  // Format the time a bit more readable by replacing colons, getting rid of the Z
  // and adding an underscore at the end to separate it from the file_name
  return new Date().toISOString().replace(/:/g,'_').replace('Z','') + '_';
}
fetchGDoc(gdoc_info.key);