var $   = require('jquery'),
    dsv   = require('dsv'),
    AWS   = require('aws-sdk'),
    S3,
    TweetBot,
    T;

var aws_info      = require('./config/aws-info.json')
    gdoc_info     = require('./config/gdoc-info.json'),
    tweetbot_info = require('./config/tweetbot-info.json');

// To override the default config files
if (process.argv[2] != undefined && process.argv[2] != 'default'){
  aws_info = require(process.argv[2]);
}
if (process.argv[3] != undefined && process.argv[3] != 'default'){
  gdoc_info = require(process.argv[3]);
}
if (process.argv[4] != undefined && process.argv[4] != 'default'){
  tweetbot_info = require(process.argv[4]);
}

function initS3(aws_info){
  AWS.config.loadFromPath(aws_info.credentials);
  s3 = new AWS.S3();
}

if (tweetbot_info.use_twitter_bot){
  TweetBot = require('twit');
  T = new TweetBot( tweetbot_info );
};

var fetchAndUpload = function(aws_info, gdoc_info, tweetbot_info){
  initS3(aws_info);
  $.ajax({
    url: 'https://docs.google.com/spreadsheet/pub?key=' + gdoc_info.key + '&output=csv',
    success:function(response){

      var timestamp      = getFormattedISOTimeStamp();

      var status        = 'Successful fetch: ' + timestamp;
      reportStatus(status);

      var json          = dsv.csv.parse(response);
      var sanitized_csv = sanitizeData(json);

      uploadToS3(sanitized_csv, timestamp, 'backup');
      uploadToS3(sanitized_csv, timestamp, 'live');

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
    if (err == null){
      console.log('Successful tweet' + text)
    }else{
      console.log('ERROR TWEET ' + text + ' ' + err)
    };
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

function uploadToS3(sanitized_csv, timestamp, which_file){
  var status,
    key_info;

  if(which_file == 'backup'){
    key_info = aws_info.backup_path + timestamp + aws_info.file_name;
  }else{
    key_info = aws_info.output_path + aws_info.file_name;
  };

  var data = {
    Bucket: aws_info.bucket,
    Key: key_info,
    Body: sanitized_csv
  };

  s3.client.putObject( data , function (resp) {
    if (resp == null){
      status = 'Successful '+which_file+' upload: ' + timestamp;
      reportStatus(status);
    }else{
      status = 'ERROR IN '+which_file.toUpperCase()+' UPLOAD: ' + timestamp;
      reportStatus(status);
    };
  });
}

function getFormattedISOTimeStamp(){
  // Format the time a bit more readable by replacing colons, getting rid of the Z
  // and adding an underscore at the end to separate it from the file_name
  return new Date().toISOString().replace(/:/g,'_').replace('Z','') + '_';
}

module.exports = {
  fetchAndUpload: fetchAndUpload
}
