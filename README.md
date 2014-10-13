# DeviceTiming

DeviceTiming is a tool for measuring parse & execution times for JavaScript files. DeviceTiming has server and client components - the server waits for the clients to send timing data, stores it and produces static HTML reports. The client is added to your javascript files individually along with instrumentation to perform the tests. This assumes you have some kind of development or test server running your website's code, which you modify for this purpose and then restore.  **It is a tool built for testing in a controlled environment, use in production considered harmful**.

**This is a forked and modified repo of the original repo maintained at [https://github.com/etsy/DeviceTiming]**

**The original work is done by Daniel Espeset along with Performance and Frontend Infrastructure at Etsy. Some Modifications have been made by Joseph on top of the original tool. See below for the list of modifications**

## Modifications
   1. Added Charting capabilities for reports generated. Now user can visualize the data in the form of column charts.
   2. Using Express server. Using seperate server instances for instrumentation and reporting. See server.js and report.js for more info.
   3. Client and browser detection from the user agent string. The mobile device names cannot be captured as of now. Better detection mechanism will be provided in future.
   4. All reports by default are generated inside a "reports" folder under the output path specified by user in the report command.
   5. Once reports and visualization charts are generated the reporting server automatically launches the default browser and serves the visualization page.
   
To start reporting server and visualize charts see **Running the reports and visualizing the data** section.

## Installation
Clone the repo and install the dependecies:

```.sh
git clone https://github.com/etsy/DeviceTiming.git
cd DeviceTiming
npm install
```

## Setup the test
Note that DeviceTiming **will modify your javascript files - it is not reccomended that you use this tool without having a backup of your code**.

So first, backup your code:

```.sh
cp /path/to/your/js /path/to/your/js-unmodified
```

Then start the DeviceTiming server and provide a path to the javascript you wish to test.

```.sh
./devicetiming server /path/to/your/js
```
This will first recursively instrument all the code in the path provided.
Then it will start listening at port 8537 for beacons from the client code.
You can provide a differnt port with `-p`, see `devicetiming -h` for more.

When you're done you can restore your backed up copy:

```.sh
cp /path/to/your/js-unmodified /path/to/your/js
```

### More Options

See `devicetiming --help`

## Running The Tests

To run the tests, visit your development server hosting the instrumented code from each device you wish to test. We use Adobe Edge Inspect in our device lab to perform these tests across all the devices at once. Once you've loaded a page with instrumented code in the browser, it will continuously reload the page to send additional runs to the server. It will continue until you stop it by manually closing or leaving that page.

The instrumentation assumes that the DeviceTiming server can be found at the same hostname as the locations you hit in the browser, if you need to use a different hostname for those beacons, use the `--hostname` argument with `devicetiming server`.

## Running the reports and visualizing the data
Start the reporting server and provide the ouput path for reports

```.sh
report /path/to/results.json /path/to/output
```
This dumps the reports (report.html, report.json) and visualization pages inside a "reports" folder under the output path. The reporting server automatically launches the default browser and serves the visualization page at port 3000. The reporting server also responds to the following GET requests (eg. http://localhost:3000/data):

```.sh
/data     returns the results data as JSON
/summary  returns the results data reduced to mean values as JSON
```

## Methodology

The first draft of our tests was done by adding a timer to our primary javascript bundle that started on the first line, and ended on the last. This effectively timed the initial execution time of the js file. However, it left out parsing time. In order to capture both we crafted the `instrument.js` processor for our compiled JavaScripts that performs these steps on each file:

   1. Add a timer call at the top of the file, then turn the full contents into a properly escaped JavaScript string.

   2. Wrap that string in an `eval` call

   3. Add the timing code -- first we mark time before the eval call, then from there to the one at the beginning of the eval string we call the "parse" time. From the inside eval call timer, until a timer just after eval runs captures the "exec" time. This is functionally equivalent to the original, unmodified file executing in the browser.

## What's the deal with intermittant 0ms parse times?

It seems that some combinations of devices / browsers have an optimization that caches the bytecode generated by the parsing step and then skips it whenever possible. Additionally, it's possible that browsers that don't exhibit this behavior in our tests still have this optimization, but only for scripts that are parsed through a `<script>` tag and not strings run through eval. In other words, a cache keyed by URI rather than content hash.

## Tell me more

See slides and resources from [Unpacking the Black Box: Benchmarking JS Parsing and Execution on Mobile Devices][talk], a talk Daniel Espeset gave about this work at Velocity NYC 2014.

## Questions and comments welcome

Open an issue, submit a pull request or tweet at [@danielespeset][twitter1] on twitter - the original source for the tool.
For any questions or issue with the modifications, please tweet at [@joseph_rialab][twitter2]

## Credits
Made by Performance and Frontend Infrastructure at Etsy.

[talk]: http://talks.desp.in/unpacking-the-black-box
[twitter1]: http://twitter.com/danielespeset
[twitter2]: https://twitter.com/joseph_rialab

