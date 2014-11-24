/**
 * This is the client|browser detection component.  It exposes a function that takes an
 * user agent string and returns the os | browser names and their versions by spoofing against the user agent.
 *
 * Shortcomings - 1. cannot detect mobile device name as of now
 *                2. may not be as efficient. Better libraries may be out there.
 *
 * @author    Joseph Khan <jkhan@yodlee.com>
 * MIT License
 **/

function clientDetect(userAgentString) {
	//return browser, version, os, osverion
	var verOffset,
		version,
		majorVersion,
		browser;
		unknown = '-',
		iOSDevice = "";

	// Opera
	if ((verOffset = userAgentString.indexOf('Opera')) != -1) {
	    browser = 'Opera';
	    version = userAgentString.substring(verOffset + 6);
	    if ((verOffset = userAgentString.indexOf('Version')) != -1) {
	        version = userAgentString.substring(verOffset + 8);
	    }
	}
	// MSIE
	else if ((verOffset = userAgentString.indexOf('MSIE')) != -1) {
	    browser = 'IE';
	    version = userAgentString.substring(verOffset + 5);
	}
	// Chrome
	else if ((verOffset = userAgentString.indexOf('Chrome')) != -1) {
	    browser = 'Chrome';
	    version = userAgentString.substring(verOffset + 7);
	}
	// Safari
	else if ((verOffset = userAgentString.indexOf('Safari')) != -1) {
	    browser = 'Safari';
	    version = userAgentString.substring(verOffset + 7);
	    if ((verOffset = userAgentString.indexOf('Version')) != -1) {
	        version = userAgentString.substring(verOffset + 8);
	    }
	}
	// Firefox
	else if ((verOffset = userAgentString.indexOf('Firefox')) != -1) {
	    browser = 'Firefox';
	    version = userAgentString.substring(verOffset + 8);
	}
	// MSIE 11+
	else if (userAgentString.indexOf('Trident/') != -1) {
	    browser = 'IE';
	    version = userAgentString.substring(userAgentString.indexOf('rv:') + 3);
	}
	// Other browsers
	else if ((nameOffset = userAgentString.lastIndexOf(' ') + 1) < (verOffset = userAgentString.lastIndexOf('/'))) {
	    browser = userAgentString.substring(nameOffset, verOffset);
	    version = userAgentString.substring(verOffset + 1);
	    if (browser.toLowerCase() == browser.toUpperCase()) {
	        browser = navigator.appName;
	    }
	}

	// trim the version string
	if ((ix = version.indexOf(';')) != -1) version = version.substring(0, ix);
	if ((ix = version.indexOf(' ')) != -1) version = version.substring(0, ix);
	if ((ix = version.indexOf(')')) != -1) version = version.substring(0, ix);

	majorVersion = parseInt('' + version, 10);

	// system
	var os = unknown;
	var clientStrings = [
	    {s:'Windows 3.11', r:/Win16/},
	    {s:'Windows 95', r:/(Windows 95|Win95|Windows_95)/},
	    {s:'Windows ME', r:/(Win 9x 4.90|Windows ME)/},
	    {s:'Windows 98', r:/(Windows 98|Win98)/},
	    {s:'Windows CE', r:/Windows CE/},
	    {s:'Windows 2000', r:/(Windows NT 5.0|Windows 2000)/},
	    {s:'Windows XP', r:/(Windows NT 5.1|Windows XP)/},
	    {s:'Windows Server 2003', r:/Windows NT 5.2/},
	    {s:'Windows Vista', r:/Windows NT 6.0/},
	    {s:'Windows 7', r:/(Windows 7|Windows NT 6.1)/},
	    {s:'Windows 8.1', r:/(Windows 8.1|Windows NT 6.3)/},
	    {s:'Windows 8', r:/(Windows 8|Windows NT 6.2)/},
	    {s:'Windows NT 4.0', r:/(Windows NT 4.0|WinNT4.0|WinNT|Windows NT)/},
	    {s:'Windows ME', r:/Windows ME/},
	    {s:'Android', r:/Android/},
	    {s:'Open BSD', r:/OpenBSD/},
	    {s:'Sun OS', r:/SunOS/},
	    {s:'Linux', r:/(Linux|X11)/},
	    {s:'iOS', r:/(iPhone|iPad|iPod)/},
	    {s:'Mac OS X', r:/Mac OS X/},
	    {s:'Mac OS', r:/(MacPPC|MacIntel|Mac_PowerPC|Macintosh)/},
	    {s:'QNX', r:/QNX/},
	    {s:'UNIX', r:/UNIX/},
	    {s:'BeOS', r:/BeOS/},
	    {s:'OS/2', r:/OS\/2/},
	    {s:'Search Bot', r:/(nuhk|Googlebot|Yammybot|Openbot|Slurp|MSNBot|Ask Jeeves\/Teoma|ia_archiver)/}
	];

	for (var id in clientStrings) {
	    var cs = clientStrings[id];
	    if (cs.r.test(userAgentString)) {
	        os = cs.s;
	        break;
	    }
	}

	var osVersion = unknown;

	if (/Windows/.test(os)) {
	    osVersion = /Windows (.*)/.exec(os)[1];
	    os = 'Windows';
	}

	switch (os) {
	    case 'Mac OS X':
	        osVersion = /Mac OS X (10[\.\_\d]+)/.exec(userAgentString)[1];
	        break;

	    case 'Android':
	        osVersion = /Android ([\.\_\d]+)/.exec(userAgentString)[1];
	        break;

	    case 'iOS':
	        osVersion = /OS (\d+)_(\d+)_?(\d+)?/.exec(userAgentString);
	        osVersion = osVersion[1] + '.' + osVersion[2] + '.' + (osVersion[3] | 0);

	        //if it is iOS, I want to show iPhone, iPod or iPad
	        if(/iPhone/.test(userAgentString)) {
	        	iOSDevice = "iPhone";
	        } else if(/iPad/.test(userAgentString)) {
	        	iOSDevice = "iPad";
	        } else if(/iPod/.test(userAgentString)) {
	        	iOSDevice = "iPod";
	        }

	        break;
	}

	if(os === "iOS") {
		return browser + "" + majorVersion + "/" + iOSDevice + "(iOS" + osVersion + ")";
	}
	return browser + "" + majorVersion + "/" + os + "" + osVersion;

}

module.exports = {
	clientDetect : clientDetect
};
