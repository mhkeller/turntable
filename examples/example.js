var turntable = require('turntable');

var aws_opts            = {
  "credentials": "/path/to/aws/credentials.json",
  "bucket": "bucket_name",
  "output_path": "tests/",
  "backup_path": "tests/backups/",
  "file_name": "names.csv",
  "make_backup": true
}
var gdoc_opts           = {
  "key": "0Aoev8mClJKw_dFFEUHZLV1UzQmloaHRMdHIzeXVGZFE",
  "output_schema": ["name", "color"],
  "moderate": {
    "column_name": "approved",
    "approved_stamp": "yes"
  }
}
var tweetbot_opts       = {
  "use_twitter_bot":      false,
  "consumer_key":         "w",
  "consumer_secret":      "x",
  "access_token":         "y",
  "access_token_secret":  "z"
}

turntable.fetchAndUpload(aws_opts, gdoc_opts, tweetbot_opts, function(resp){
  console.log(resp); // Both files successfully uploaded!
});
