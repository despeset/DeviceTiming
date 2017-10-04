/**
 * This is the server component - it starts a http server that treats all POST
 * requests as data beacons from the instrumented client code, which it adds
 * to the results global - this is persisted to results.json on the filesystem
 *
 * The server also responds to the following GET requests:
 *
 *      /         returns a static HTML report using the `report` component
 *      /data     returns the `results` data as JSON
 *      /summary  returns the `results` data reduced to mean values as JSON
 *
 * TODO: Add a GET route that acts as an instrumenting proxy for the JS code,
 * to allow non-destructive instrumentation.
 *
 * @author    Daniel Espeset <desp@etsy.com>
 * @copyright (c) 2014 Etsy, Inc.
 **/

var http = require('http'),
      qs = require('querystring'),
      fs = require('fs'),
    path = require('path'),
  report = require('./report'),
     url = require('url'),
   spawn = require('child_process').spawn;

// Load persisted data or initialize it
try {
    var results = require(path.resolve(__dirname, 'results'));
} catch(err) {
    var results = {};
}

function handlePost(req, res) {
    var body = "";
    req.on('data', function(chunk) {
        body += chunk;
    });
    req.on('end', function() {
        var data = JSON.parse(qs.parse(body).results);
        var result = results[req.headers['user-agent']] || ( results[req.headers['user-agent']] = {});
        for ( var k in data ) {
            result[k] = result[k] || { parse: [], exec: [] };
            result[k].parse.push(data[k].parse);
            result[k].exec.push(data[k].exec);
        }
        console.log((Object.keys(data).length) + " tested :: " + req.headers['user-agent']);
        res.write(JSON.stringify({ success: true }));
        res.end();
        save();
    });
}

function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
}

function handleGet(req, res) {
    var parsedUrl = url.parse(req.url, true);
    var pathArray = parsedUrl.pathname.replace(/^\/|\/$/g, '').split('/');
    switch (pathArray[0]) {
        case 'data':
            res.write(JSON.stringify(results,null,'    '));
            res.end();
            break;
        case '':
            res.write(report.generateHTML(report.buildReportData(clone(results))));
            res.end();
            break;
        case 'summary':
            res.write(JSON.stringify(report.buildReportData(clone(results))));
            res.end();
            break;
    }
}

// Debounced persistence of `results` to filesystem
function save() {
    clearTimeout(save.timer || -1);
    save.timer = setTimeout(writeResults, 500);
}

// Write results to ./results.json TODO: make this configurable
function writeResults() {
    fs.writeFileSync(path.resolve(__dirname, 'results.json'), JSON.stringify(results, null, '    '), 'utf8');
}

// Start the server, accepts option for port to listen on
function start(opts) {
    var PORT = opts.p || opts.port || 8537;

    http.createServer(function(req, res) {
        // CORS headers, allow everything
        res.setHeader('Access-Control-Allow-Origin', '*');
        if (req.headers["Access-Control-Request-Headers"]) {
            res.setHeader("Access-Control-Allow-Headers", req.headers["Access-Control-Request-Headers"]);
        }
        if (req.method === 'POST') {
            handlePost(req, res);
        } else {
            handleGet(req, res);
        }
    }).listen(PORT);

    // Ensure results have been persisted before exiting the process
    process.on('exit', function() { writeResults(); });
    console.log("Listening on port " + PORT);
}

module.exports = {
    start: start
}
