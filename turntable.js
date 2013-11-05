var $   = require('jquery'),
    dsv   = require('dsv'),
    AWS   = require('aws-sdk'),
    S3,
    TweetBot,
    T,
    aws_info,
    gdoc_info,
    tweetbot_info;

var callback_status = {
  live: null,
  backup: null
};


function initS3(aws_info){
  AWS.config.loadFromPath(aws_info.credentials);
  s3 = new AWS.S3();
}

var fetchAndUpload = function(aws_opts, gdoc_opts, tweetbot_opts, callback){
  aws_info      = $.extend({
    "credentials": "/path/to/credentials.json",
    "bucket": "bucket_name",
    "output_path": "tests/",
    "backup_path": "tests/backups/",
    "file_name": "names.csv",
    "make_backup": true,
  }, aws_opts);

  gdoc_info     = $.extend({
    "key": "0Aoev8mClJKw_dFFEUHZLV1UzQmloaHRMdHIzeXVGZFE",
    "output_schema": ["name", "color"],
    "moderate": false
  }, gdoc_opts);

  tweetbot_info = $.extend({
    "use_twitter_bot":      false,
    "consumer_key":         "w",
    "consumer_secret":      "x",
    "access_token":         "y",
    "access_token_secret":  "z"
  }, tweetbot_opts);

  if (tweetbot_info.use_twitter_bot){
    TweetBot = require('twit');
    T = new TweetBot( tweetbot_info );
  };

  initS3(aws_info);

  $.ajax({
    url: 'https://docs.google.com/spreadsheet/pub?key=' + gdoc_info.key + '&output=csv',
    success:function(response){

      var timestamp      = getFormattedISOTimeStamp();

      var status         = 'Successful fetch: ' + timestamp;
      reportStatus(status);

      var data           = dsv.csv.parse(response);
      if (gdoc_info.moderate){
        data = moderateData(data);
      }
      if (gdoc_opts.output_schema){
        data = sanitizeData(data);
      }

      if (aws_info.file_name.split('.')[1] == 'csv'){
        data =  dsv.csv.format(data);
      }else if(aws_info.file_name.split('.')[1] == 'json'){
        data =  JSON.stringify(data);
      }

      if (aws_info.make_backup){
        uploadToS3(data, timestamp, 'backup', callback);
      }
      uploadToS3(data, timestamp, 'live', callback);

    },
    error: function(err){
      var timestamp = getFormattedISOTimeStamp();
      var status    = 'ERROR IN AJAX!: ' + timestamp + ' ' + err.responseText;
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

function moderateData(json){
  var moderated_json = [];
  json.forEach(function(row){
    if (row[gdoc_info.moderate.column_name] == gdoc_info.moderate.approved_stamp){
      moderated_json.push(row)
    }
  });
  return moderated_json
}

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
  return sanitized_json;
}

function checkCallback(callback){
  var msg;
  if (aws_info.make_backup == false){
    msg = 'Live file upload ' + callback_status['live']
  }else{
    msg = 'Live file upload ' + callback_status['live'] + ' and backup file upload ' + callback_status['backup']
    if (callback_status['live'] != null && callback_status['backup'] != null){ // This could also be done with something like underscore's _.after() or setting a counter and only calling `callback` the second time, but setting another variable or including a whole other library seems expensive for just one function that can be accomplished this way.
      callback(msg)
    };
  };

};

function uploadToS3(sanitized_data, timestamp, which_file, callback){
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
    Body: sanitized_data,
    ACL: 'public-read'
  };

  s3.client.putObject( data , function (resp) {
    if (resp == null){
      status = 'Successful '+which_file+' upload: ' + timestamp;
      reportStatus(status);
      callback_status[which_file] = 'success';
    }else{
      status = 'ERROR IN '+which_file.toUpperCase()+' UPLOAD: ' + timestamp + ' ' + resp;
      reportStatus(status);
      callback_status[which_file] = 'error';
    };

    checkCallback(callback);
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
