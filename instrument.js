/**
 * This is the `instrument` component.  It exposes a function that takes an
 * array of paths to javascript files, and overwrites them with instrumented
 * versions.
 *
 * @author    Daniel Espeset <desp@etsy.com>
 * @copyright (c) 2014 Etsy, Inc.
 **/

var  fs = require('fs'),
   path = require('path'),
    esc = require('js-string-escape');

// Instrumentation.template.js is the runtime container for the instrumented
// code, it provides timers and beacon code + placeholders for the name and
// modified source.
var timers = fs.readFileSync(path.resolve(__dirname, 'lib', 'instrumentation.template.js'), 'utf8').split("// file content");

// Given an array of paths `targetFiles`, instrument any that haven't yet been
// instrumented.  Pass optional `hostname` for sending the beacons to, defaults
// to `process.env.HOSTNAME`
// **THIS IS DESTRUCTIVE** and idempotent
function rewriteTargetFiles(targetFiles, targetPath, hostname, port) {
    targetFiles.forEach(function(filename) {
        var c = fs.readFileSync(filename, 'utf8');
        if (c.split(/\n/)[0] === "// INSTRUMENTED FOR DEVICE-TIMING") {
            // NOOP if already instrumented
            process.stdout.write('x');
            return;
        }
        // Instrument the file - run the code through windowscoper
        // turn it into a string and stick it in the template
        // then write it to disk
        fs.writeFileSync(filename, render(timers[0], filename) + esc(c) + render(timers[1], filename), 'utf8');
        process.stdout.write('.');
    });

    // Intropolate template vars
    function render(str, filename) {
        return str.replace(/%%NAME%%/g, filename.substr(targetPath.length))
                  .replace(/%%MAIN%%/g, filename.replace(/[^a-zA-Z_]/g,''))
                  .replace(/%%DEVICE_TIMING_SERVER_ADDR%%/g, (hostname || process.env.HOSTNAME || 'localhost') + ':' + (port || '8537'));
    }
}

module.exports = {
    rewriteTargetFiles: rewriteTargetFiles
};

