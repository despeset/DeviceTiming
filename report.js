/**
 * This is the `report` component. Given a set of `results` data as collected by
 * the `server` component it gets the mean values, then generates an HTML
 * document with bars 'n things.
 *
 * This is done via straight up string iterpolation.
 * TODO: Probably use a templating language instead.
 *
 * @author    Daniel Espeset <desp@etsy.com>
 * @copyright (c) 2014 Etsy, Inc.
 *
 * Modified by Joseph Khan <jkhan@yodlee.com> - 11 Oct 2014
 * Now the report generated will also have the browser-os detecion info
 * See result.json for the format of browser detection
 **/

var fs      = require('fs'),
    path    = require('path');


function uniqueSort(arr){
    return arr.reverse()
              .filter(function(e, i, arr){
                  return arr.indexOf(e, i+1) === -1;
              })
              .reverse()
              .sort(function(a,b){
                 return a-b;
              });
}

// Summerizes the results data into mean values,
// returns the data structure used to build the HTML
function buildReportData(results) {
    var report = {};
    for ( var UA in results ) {
        report[UA] = { detect: {}, times: {} };
        for ( var key in results[UA] ) {
            if(key === "device") {
                report[UA].detect = results[UA][key];
            } else {
                results[UA][key].parse = uniqueSort(results[UA][key].parse);
                results[UA][key].exec = uniqueSort(results[UA][key].exec);
                report[UA].times[key] = {
                    parse: results[UA][key].parse[Math.floor(results[UA][key].parse.length/2)],
                    exec:  results[UA][key].exec[Math.floor(results[UA][key].exec.length/2)]
                }
            }
        }
    }
    return report;
}

// Given the data structure returned by `buildReportData`, generates HTML
function generateHTML(report) {

    var html =
    [ "<!DOCTYPE html",
      "<html>",
      "<head>",
        "<style>",
            "body { box-sizing: border-box; -moz-box-sizing: border-box; }",
            "table { border-spacing: 0px }",
            "tr { height: 20px; }",
            "td { border-bottom: 1px solid #333; border-left: 1px solid #333; padding: 2px 8px; }",
            "tr:nth-child(odd) { background: #dadad1 }",
        "</style>",
      "</head>",
      "<body style='background:#fafaf1;color:#333;font-family:Arial;'>",
      "<h1>Initial parse & execution times for some JS files on mobile devices.</h1>",
      "<p>Median of several runs on each device, <strong>excludes network time</strong>.</p>" ];

    // Convert ms `parse` or `execute` int to pixel value
    // by dividing by constand 1.8
    function f(n) { return Math.round(n/1.8); }
    // Generate a color for a given parse time as n
    function cp(n) { var delta = Math.round(255 * ((n / 1000) > 1 ? 1 : n / 1000)); return 'rgb('+delta+','+(255-delta)+',80)'; }
    // Generate a color for a given exec time as n
    function ce(n) { var delta = Math.round(255 * ((n / 1000) > 1 ? 1 : n / 1000)); return 'rgb('+delta+','+100+','+(255-delta)+')'; }

    // Styled "ms"
    var ms = "<span style='color:#aaa;font-size:0.8em'>ms</span>";

    // Loop through the report data and generate content for each User Agent
    for ( var UA in report ) {
        var sum = 0;
        html.push("<div style='clear:both;display:table;padding-top:20px;font-family:monospace;font-size:1.1em'>");

        if ( report[UA].device ) {
            html.push("<h1 style='margin-bottom:5px'>" + report[UA].device.vendor + " " + report[UA].device.marketing_name + " (" + report[UA].device.model + ")</h1>");
            html.push("<h3 style='font-weight:normal;margin:5px 0 0;'>" + report[UA].device.browser + " " + report[UA].device.version + " on " + (report[UA].device.os_ios === 't' ? "iOS" : report[UA].device.os_android === 't' ? "Android" : "Unknown OS") + " " + report[UA].device.os_version + "</h3>");
            html.push("<h3 style='font-weight:normal;margin-top:0px;'>RAM: " + report[UA].device.RAM + "mb CPU: " + report[UA].device.CPU + "mhz " + (report[UA].device.GPU.length > 1 ? "GPU: " + report[UA].device.GPU + 'mhz ' : 'GPU: N/A' )+"</h3>");
        } else {
            html.push("<h1>" + UA + "</h1>");
        }
        html.push(["<div style='clear:left; float:left;'>",
                        "<table>",
                            "<tr>",
                                "<th>file</th><th>parse</th><th>exec</th><th>total</th>",
                            "</tr>"].join("\n"));

        for ( var js in report[UA].times ) {
            var data = report[UA].times[js]
            html.push(["<tr>",
                           "<td width='250'>" + js + "</td>",
                           "<td width='40'>" + data.parse + ms + "</td>",
                           "<td width='40'>" + data.exec + ms + "</td>",
                           "<td width='40'>" + (data.parse + data.exec) + ms + "</td>",
                       "</tr>"].join("\n"));
        }

        html.push("</table>");
        html.push("</div>");
        html.push("<div style='float:left;margin-top:20px;'>");

        for ( var js in report[UA].times ) {
            html.push("<div style='clear:left;float:left;margin-bottom:1px;height:19px;background:"+cp(report[UA].times[js].parse)+";width:"+f(report[UA].times[js].parse)+"px;'></div>");
            html.push("<div style='float:left;height:19px;margin-bottom:1px;background:"+ce(report[UA].times[js].exec)+";width:"+f(report[UA].times[js].exec)+"px;'></div>");
            sum += parseInt(report[UA].times[js].parse) + parseInt(report[UA].times[js].exec);
        }

        html.push("</div>");
        html.push("</div>");
        html.push("<div style='clear:both;width:435px;padding-top:5px;text-align:right;font-size:1em;'>sum: <span style='color:"+ce(sum)+"'>"+sum+ms+"</span></div>");
    }

    html.push("</body></html>");
    return html.join("\n");
}

// Given results and an outputPath, writes report.json and report.html
function outputReport(results, outputPath) {
    var jsonPath   = path.resolve(outputPath, 'report.json'),
        htmlPath   = path.resolve(outputPath, 'report.html'),
        report     = buildReportData(results),
        html       = generateHTML(report);

    fs.writeFileSync(jsonPath, JSON.stringify(report, null, '    '), 'utf8');
    fs.writeFileSync(htmlPath, html, 'utf8');

    //path for visualization folder
    var vPath = path.resolve(__dirname, 'lib', 'visualization');
    // Recursively traverse dirpath, copy each file to reports folder
    recurseDir(vPath, {
            file: function(d, f) {  //d - directory, f - file
                //copy each file into reports directory
                fs.writeFileSync(path.resolve(outputPath + '/' + f), fs.readFileSync(d + '/' + f), 'utf8');  //targetFile, sourceFile, encoding
            }
    });
}

function recurseDir(dirpath, callbacks) {
    fs.readdirSync(dirpath).forEach(function(f) {
        if (fs.lstatSync(path.resolve(dirpath, f)).isDirectory()) {
            callbacks.dir && callbacks.dir(dirpath, f);
            return recurseDir(path.resolve(dirpath, f), callbacks);
        }
        callbacks.file && callbacks.file(dirpath, f);
    });
}

module.exports = {
    buildReportData: buildReportData,
    generateHTML: generateHTML,
    outputReport: outputReport
};