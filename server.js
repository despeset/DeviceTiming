/**
 * @author    Daniel Espeset <desp@etsy.com>
 * @copyright (c) 2014 Etsy, Inc.
 * Modified by Joseph Khan <jkhan@yodlee.com> - 11 Oct 2014
 *
 * This is the server component. It has two parts:-
 *  1. It starts a http server (by default at port 8537) that treats all POST
 *  requests as data beacons from the instrumented client code, which it adds
 *  to the results global - this is persisted to results.json on the filesystem
 *
 *  2. It starts another server at port 3000 which serves the visualization and reports generated. 
 *  The reporting server also responds to the following GET requests (eg. http://localhost:3000/data):
 *
 *      /data     returns the `results` data as JSON
 *      /summary  returns the `results` data reduced to mean values as JSON
 *
 * The reporting server can be started by the report command. See devicetiming for more info
 *
 * TODO: Add a GET route that acts as an instrumenting proxy for the JS code,
 * to allow non-destructive instrumentation.
 *
 *
 * Modifications:
 * 1. Instead of normal node HTTP server, I am using Express server, mainly to serve static pages. 
 * 2. I am not persisting results data. I log fresh data into results.json
 * 3. Why I am using 2 servers (port 8537 and 3000)?
 *    So that instrumentation and reporting can run parallelly. Also keeping in mind point no 2 from TODO's mentioned below.
 * 4. Detecting the client and browser from the user agent string. Storing that info in the results.json file
 * 5. After reports and visualization pages are generated, the reporting server automatically launches the default browser and serves the visualization page.
 *
 * TODO: Rather than serving visualization pages as static path at port 3000, somehow integrate visualization into the response
 *       Use live reload techniques to automatically refresh visualization page upon logging instrumented info
 **/

var http = require('http'),
      qs = require('querystring'),
      fs = require('fs'),
    path = require('path'),
  report = require('./report'),
     url = require('url'),
   spawn = require('child_process').spawn,
    open = require("open"),
 express = require('express'),
 detect  = require('./lib/client_detection');

var app = express(),
    application_root = __dirname;


var results = {};   //do not persist data.

function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
}

// Debounced persistence of `results` to filesystem
function save() {
    clearTimeout(save.timer || -1);
    save.timer = setTimeout(writeResults, 500);
}

function removeResultsFile() {
    var filePath = path.resolve(__dirname, 'results.json');
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
    }
}
// Write results to ./results.json TODO: make this configurable
function writeResults() {
    fs.writeFileSync(path.resolve(__dirname, 'results.json'), JSON.stringify(results, null, '    '), 'utf8');
}

// Start the server, accepts option for port to listen on
function startServer(opts) {
    var PORT = opts.p || opts.port || 8537;

    //launch an express server to listen to POST request coming from instrumented scripts
    app.listen(PORT, function() {
        console.log('-- LOG --Instrumentation Server started, listening on port %d', PORT);
    });

    app.post('/', function(req, res) {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader("Access-Control-Allow-Headers", req.headers["Access-Control-Request-Headers"]);

        var body = "";
        req.on('data', function(chunk) {
            body += chunk;
        });
        req.on('end', function() {
            var data = JSON.parse(qs.parse(body).results);
            var result = results[req.headers['user-agent']] || ( results[req.headers['user-agent']] = {});
            result.device = detect.clientDetect(req.headers['user-agent']);   //save detected client\browser info into results
            for ( var k in data ) {
                result[k] = result[k] || { parse: [], exec: [] };
                result[k].parse.push(data[k].parse);
                result[k].exec.push(data[k].exec);
            }
            console.log((Object.keys(data).length) + " tested :: " + req.headers['user-agent']);
            res.write(JSON.stringify({ success: true }));
            res.end();
            save();  //
        });
    });

    //removeResultsFile();  //remove results.json when server starts

    // Ensure results have been persisted before exiting the process
    process.on('exit', function() { writeResults(); });
}

//Starts an express server at port 3000 to serve the visualization and reporting pages
//takes the global resuts data and the output path
function startReportServer(results, outputPath, port) {
    var port = port || 3000;
    app.use(express.static(outputPath)); //launch a server to serve static resources from the output path

    app.listen(port, function() {
        console.log('-- LOG --Reporting  Server started, listening on port %d', port);

        open("http://localhost:" + port);   //launch default browser and serve the visualization page
    });

    // returns the `results` data as JSON
    app.get('/data', function(req, res) {
        res.write(JSON.stringify(results,null,'    '));
        res.end();
    });
    // returns the `results` data reduced to mean values as JSON
    app.get('/summary', function(req, res) {
        res.write(JSON.stringify(report.buildReportData(clone(results))));
        res.end();
    });
}

module.exports = {
    startServer: startServer,
    startReportServer: startReportServer
}