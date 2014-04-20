# Turntable

A Node.js module, ideal for a chron, that will download data from a Google Spreadsheet and put select columns on an Amazon S3 bucket. To get your spreadsheet key, do `File > Publish to the Web` in Google Spreadsheets.

You'll want to create an AWS `credentials.json` file [like the sample](https://github.com/mhkeller/turntable/blob/master/examples/credentials.sample.json) and put it somewhere like `~/.aws/credentials.json` and type that path into `path` in `config/aws-info.json`.

Tested on Node 0.10.7

### Installation

````
npm install turntable
````

### Usage

See <code>[example.js](https://github.com/mhkeller/gdoc-to-s3/blob/master/examples/example.js)</code>

The options are fairly self-explanatory. The only two that aren't immediately obvious are `output_schema` and `moderate`.

* `output_schema` is an array of column names to copy over into your public table. This is useful if you collect reader contact info that you want to keep but that you don't want to make public. Set `output_schema` to `false` to copy all columns.

* `moderate` sets options that will only copy over approved rows. Set the name of the moderation column in `column_name` and the string that approves a row in `approved_stamp`. Set `moderate` to `false` to copy all rows.


### Features
* Can only uploads moderator-approved rows.
* Can only uploads the columns you specify in ``output_schema`` `gdoc_info`. Handy in case there are fields you use internally that aren't meant for production. For instance, you might have an "Edited by" or "Written by" column that you want to keep in your document but don't need to show publicly.
* Uploads two copies of your data: 1) the production copy that gets overwritten each time with new data; 2) a timestamped copy that goes into the `backups` directory. The default directory is `backups` in the same directory as your `output_path`. You can set your own backup directory in the `aws-info`. With backups, you can easily revert to an old version if necessary.


### Twitter updates
You can optionally set up a Twitter bot to deliver notifications by setting ``use_twitter_bot`` to ``true`` in the <code>[tweetbot_info](https://github.com/mhkeller/gdoc-to-s3/blob/master/examples/example.js)</code> object. This can be used mostly likely on a private account for easy team notifications. Setting @-replies for errors could be an effective notification systems. Successes needn't be so noisy.

### A note on data privacy
As long as you don't share you key with anyone, publishing to the web doesn't alter your sharing and security preferences for that doc. If there are columns that you don't want visible in your csv on S3. There are two options:

1. If you're okay with that data being accessible if someone know the spreadsheet key, then, in the script, you can specify which columns it will copy over to S3 by naming them in the <code>output_schema</code> in the <code>[gdoc-info](https://github.com/mhkeller/gdoc-to-s3/blob/master/examples/example.js)</code> object.
2. If you want more security, create a second sheet with a formula like <code>=Sheet1!A:A</code> in Column A, <code>=Sheet1!B:B</code> in Column B and so on. If you copy that formula down, it will take the values from Sheet1 only for the columns you specify. The downside: if you don't copy the formula in Sheet 2 to enough rows, then it won't carry over the data. So you have to keep an eye on it and make sure your formula is in all rows. You'll want to overwrite the ajax url to make sure it grabs the proper worksheet.
