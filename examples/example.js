var gs3 = require('gdoc-to-s3');

gs3.aws_info      = {
  "credentials": "/path/to/aws/credentials.json",
  "bucket": "bucket_name",
  "output_path": "tests/",
  "backup_path": "tests/backups/",
  "file_name": "names.csv"
}
gs3.gdoc_info     = {
  "key": "0Aoev8mClJKw_dFFEUHZLV1UzQmloaHRMdHIzeXVGZFE",
  "output_schema": ["name", "color"]
}
gs3.tweetbot_info = {
  "use_twitter_bot":      false,
  "consumer_key":         "w",
  "consumer_secret":      "x",
  "access_token":         "y",
  "access_token_secret":  "z"
}

gs3.fetchAndUpload(gs3.aws_info, gs3.gdoc_info, gs3.tweetbot_info, function(resp){
  console.log(resp); // Both files successfully uploaded!
});