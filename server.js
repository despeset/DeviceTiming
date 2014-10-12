/**
 * This is the server component - it starts a http server that treats all POST
 * requests as data beacons from the instrumented client code, which it adds
 * to the results global - this is persisted to results.json on the filesystem
 *
 * The reporting server also responds to the following GET requests:
 *
 *      /data     returns the `results` data as JSON
 *      /summary  returns the `results` data reduced to mean values as JSON
 *
 * TODO: Add a GET route that acts as an instrumenting proxy for the JS code,
 * to allow non-destructive instrumentation.
 *
 * @author    Daniel Espeset <desp@etsy.com>
 * @copyright (c) 2014 Etsy, Inc.
 *
 * Modified by Joseph Khan <jkhan@yodlee.com> - 11 Oct 2014
 *
 *
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


// Load persisted data or initialize it
/*try {
    var results = require(path.resolve(__dirname, 'results'));
} catch(err) {
    var results = {};
}*/
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
        console.log('-- LOG -- Server started, listening on port %d', PORT);
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
            result.device = detect.clientDetect(req.headers['user-agent']);
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

//to launch the visualization server
function startReportServer(results, outputPath, port) {
    var port = port || 3000;
    app.use(express.static(outputPath)); //launch a server to serve static resources from the output path

    app.listen(port, function() {
        console.log('-- LOG -- Server started, listening on port %d', port);

        open("http://localhost:" + port);   //launch default browser and serve the visualization page
    });

    app.get('/data', function(req, res) {
        res.write(JSON.stringify(results,null,'    '));
        res.end();
    });
    app.get('/summary', function(req, res) {
        res.write(JSON.stringify(report.buildReportData(clone(results))));
        res.end();
    });
}

module.exports = {
    startServer: startServer,
    startReportServer: startReportServer
}