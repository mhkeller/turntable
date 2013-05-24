# Google Docs to S3

A Node.js script, ideal for a chron, that will download data from a Google Spreadsheet and put it on an Amazon S3 bucket. To get your spreadsheet key, do `File > Publish to the Web` in Google Spreadsheets.

You'll want to create an AWS `credentials.json` file [per these instructions](http://docs.aws.amazon.com/AWSJavaScriptSDK/guide/configuring.html) and put it somewhere like `~/.aws/credentials.json` and type that path into <code>AWS.config.loadFromPath()</code>.

### Features
*Checks the schema of the response to what your provide in ``input_schema`` to make sure the response is accurate
*Only uploads the columns you specify in ``output_schema`` in case there are fields you use internally that aren't meant for production.
*Uploads two copies of your data: the production copy that gets overwritten each time with new data; and a timestamped copy that goes into the ``backups`` directory specified in ``output_path`` next to the csv. This way, you can easily revert to an old version if necessary.

### Twitter updates
``gdoc-to-s3-tweet.js`` includes options to have a Twitter bot tweet the status of the script whenever it runs. You could set that up as a private Twitter account and have it followed by your team to get immediate updates of successes and/or failures.

### A note on data privacy
As long as you don't share you key with anyone, publishing to the web doesn't alter your sharing and security preferences for that doc. If there are columns that you don't want visible in your csv on S3. There are two options:

<ol>
  <li>If you're okay with that data being accessible if someone know the spreadsheet key, then, in the script, you can specify which columns it will copy over to S3 by naming them in the <code>output_schema</code> key of the <code>CONFIG</code> object.</li>
  <li>If you want more security, create a second sheet with a formula like <code>=Sheet1!A:A</code> in Column A, <code>=Sheet1!B:B</code> in Column B and so on. If you copy that formula down, it will take the values from Sheet1 only for the columns you specify. The downside: if you don't copy the formula in Sheet 2 to enough rows, then it won't carry over the data. So you have to keep an eye on it and make sure your formula is in all rows. You'll want to overwrite the ajax url to make sure it grabs the proper worksheet.</li>
</ol>

### Dependencies

#### [AWS SDK](http://aws.amazon.com/sdkfornodejs/)
You can install with
````
npm install aws-sdk
````

#### [jQuery for Node](https://github.com/coolaj86/node-jquery)
You can install with
````
npm install jquery
````
