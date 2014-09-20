// INSTRUMENTED FOR DEVICE-TIMING (github.com/etsy/DeviceTiming)
window.__devicetiming = {};
// start timing
__devicetiming.t = { start: new Date().getTime() };
// eval the code - the timer at the beginning of this string marks end of parse
eval("__devicetiming.t.parse = new Date().getTime();\n"+"// file content");
// end of parse to here is exec
__devicetiming.t.exec  = new Date().getTime();
// safe init window.__timing
window.__timing = window.__timing || {};
// epoch to ms
window.__timing['%%NAME%%'] = { parse: __devicetiming.t.parse - __devicetiming.t.start, exec: __devicetiming.t.exec - __devicetiming.t.parse };
// debounced becon - last file to run sends the timing data
clearTimeout(window.__timing_delay || -1);
window.__timing_delay = setTimeout(function(){
if (window.jQuery && jQuery.ajax) {
    jQuery.ajax({
        url: 'http://%%DEVICE_TIMING_SERVER_ADDR%%',
        type: 'POST',
        data: { results: JSON.stringify(window.__timing) },
        success: function() {
            window.location.reload();
        }
    });
} else {
    __devicetiming.r = new XMLHttpRequest();
    __devicetiming.r.open("POST", "http://%%DEVICE_TIMING_SERVER_ADDR%%", true);
    __devicetiming.r.onreadystatechange = function () {
        if (__devicetiming.r.readyState != 4 || __devicetiming.r.status != 200) return;
        window.location.reload();
    };
    __devicetiming.r.send("results="+encodeURIComponent(JSON.stringify(window.__timing)));
}
}, 6000);
