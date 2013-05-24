# Google Docs to S3

A Node.js script, ideal for a chron, that will download data from a Google Spreadsheet and put it on an Amazon S3 bucket. To get your spreadsheet key, do `File > Publish to the Web` in Google Spreadsheets.

You'll want to create an AWS `credentials.json` file [per these instructions](http://docs.aws.amazon.com/AWSJavaScriptSDK/guide/configuring.html) and put it somewhere like `~/.aws/credentials.json` and type that path into ``path`` in ``config/aws-info.json``.

Tested on Node 0.10.7

### Features
* Only uploads the columns you specify in ``output_schema`` in ``config/gdoc_info.json`` in case there are fields you use internally that aren't meant for production. For instance, you might have an "Edited by" or "Written by" column that you want to keep in your document but don't need to show publicly.
* Uploads two copies of your data: the production copy that gets overwritten each time with new data; and a timestamped copy that goes into the ``backups`` directory specified in ``output_path`` in ``config/aws-info``. This way, you can easily revert to an old version if necessary.

### TODO

* Override other config files based on command line arguments.
* Set up as exportable module per jsvine's suggestion

### Twitter updates
You can optionally set up a Twitter bot to deliver notifications by setting ``use_twitter_bot`` to ``true`` in ``config/tweetbot_info.json``. This can be used mostly likely on a private account for easy team notifications. Setting @-replies for errors could be an effective notification systems. Successes needn't be so noisy.

### A note on data privacy
As long as you don't share you key with anyone, publishing to the web doesn't alter your sharing and security preferences for that doc. If there are columns that you don't want visible in your csv on S3. There are two options:

<ol>
  <li>If you're okay with that data being accessible if someone know the spreadsheet key, then, in the script, you can specify which columns it will copy over to S3 by naming them in the ``output_schema`` in ``config/gdoc-info.json``.</li>
  <li>If you want more security, create a second sheet with a formula like ``=Sheet1!A:A`` in Column A, ``=Sheet1!B:B`` in Column B and so on. If you copy that formula down, it will take the values from Sheet1 only for the columns you specify. The downside: if you don't copy the formula in Sheet 2 to enough rows, then it won't carry over the data. So you have to keep an eye on it and make sure your formula is in all rows. You'll want to overwrite the ajax url to make sure it grabs the proper worksheet.</li>
</ol>

### Dependencies

#### [AWS SDK](http://aws.amazon.com/sdkfornodejs/)
You can install with
````
npm install aws-sdk
````

#### [DSV for CSV parsing (extracted from D3.js)](https://github.com/mbostock/dsv)
You can install with
````
npm install dsv
````

#### [jQuery for Node](https://github.com/coolaj86/node-jquery)
You can install with
````
npm install jquery
````

## Optional
#### [Twitter Client for Node](https://github.com/ttezel/twit)
You can install with
````
npm install twit
````
