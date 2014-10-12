(function() {
	//Feature Detection
	if(!(document.querySelector || ('querySelector' in document))) {
		alert('You have an old browser. Kindly check in a new browser');
		//return;
	}
	//Variables
	var reportData = {},
		scriptList = document.querySelector("#scriptFileList"),
		//chartList = document.querySelector("#chartTypeList"),
		browserList = document.querySelector("#browserList"),
		toggleButtonCollection = document.querySelectorAll(".btn-toggle-expand");
		browserArr = [],
		detectionArr = [],
		scriptFileArr = [],
		chartInstanceArr = [],
		colorArr = ['#B64926', '#ED8C2B', '#225378', '#1695A3'];

	//Event Registrations
	scriptList.addEventListener('change', handleScriptChange, false);
	//chartList.addEventListener('change', handleChartTypeChange, false);
	browserList.addEventListener('change', handleBrowserChange, false);
	for(var i =0; i < toggleButtonCollection.length; i++) {
		toggleButtonCollection[i].addEventListener('click', toggleWidgetContent, false);
	}

	function handleScriptChange() {
		getParseAndExecTimeForScript(this.options[this.selectedIndex].value);
	}
	function handleChartTypeChange() {
		chartInstanceArr[0].transform(this.options[this.selectedIndex].value.toLowerCase());
	}

	function handleBrowserChange() {
		getParseAndExecTimeForBrowser(this.options[this.selectedIndex].value);
	}

	function toggleWidgetContent(evt) {
		var toggleButtonImg = evt.currentTarget.firstChild,
			widgetContent = evt.currentTarget.parentNode.parentNode.nextSibling;//document.querySelector("#content-chart1");

		if(toggleButtonImg.src.search("up") > 0) {
			collapse(widgetContent);
			toggleButtonImg.src = "down.svg";
		} else {
			toggleButtonImg.src = "up.svg";
			expand(widgetContent);
		}
		evt.preventDefault();
		return false;
	}

	//collapse, expand - separate functions for future enhancements
	function collapse(container) {
		container.style.display = "none";
	}
	function expand(container) {
		container.style.display = "block";
	}


	function sendAjaxReq(url) {
		var req = new XMLHttpRequest();
		req.open("GET", url, true);
		req.onreadystatechange = function() {
			if(req.status === 200 && req.readyState === 4) {
				reportData = JSON.parse(req.response);
				//console.log(reportData);

				getAllScriptFileNames(); //for select list
				getAllBrowserNames(); //for select list

				chartInstanceArr.push(createChart('#combo_chart', '', '', 0, colorArr[0], colorArr[1]));   //create the barebones of chart1 and keep it ready
				chartInstanceArr.push(createChart('#another_chart', '', '', 0, colorArr[2], colorArr[3]));   //create the barebones of chart2 and keep it ready

				getParseAndExecTimeForScript(scriptFileArr[0]);
				getParseAndExecTimeForBrowser(browserArr[0]);
			}
		};
		req.send();
	}

	function spoofUserAgent(userAgentString) {
		return new MobileDetect(userAgentString);
	}

	function getAllScriptFileNames() {
		for(var ua in reportData) {
			for(var key in reportData[ua].times) {
				var newOption = document.createElement('option');
				newOption.text = key.slice(1, key.length);
				scriptFileArr.push(key.slice(1, key.length));
				scriptList.add(newOption);
			}
			return;  //return after one  iteration of the outer loop
		}
	}

	function getAllBrowserNames() {
		for(var ua in reportData) {
			var newOption = document.createElement('option');
			browserArr.push(ua);
			detectionArr.push(reportData[ua].detect);
			newOption.text = reportData[ua].detect;
			newOption.value = ua;
			browserList.add(newOption);
		}
	}


	function getParseAndExecTimeForScript(scriptFileName) {
		var parseArr = [], execArr = [], _scriptObj;
		for(var ua in reportData) {
			_scriptObj = reportData[ua].times["/" + scriptFileName];
			//console.log(_scriptObj.parse + "/" + _scriptObj.exec);
			parseArr.push(_scriptObj.parse);
			execArr.push(_scriptObj.exec);
		}
		reloadChartData(chartInstanceArr[0], parseArr, execArr, false);
	}

	function getParseAndExecTimeForBrowser(browserName) {
		var parseArr = [], execArr = [];
		for(var scriptFile in reportData[browserName].times) {
			//console.log('----' , reportData[browserName].times[scriptFile]);
			parseArr.push(reportData[browserName].times[scriptFile].parse);
			execArr.push(reportData[browserName].times[scriptFile].exec);
		}
		reloadChartData(chartInstanceArr[1], parseArr, execArr, true);
	}

	function createChart(bindingContainer, xLabel, yLabel, tickRotateAngle, color1, color2) {
		return c3.generate({
	    	bindto: bindingContainer,
	    	/*size: {
		        height: 400
		    },*/
		    data: {
		        x : 'x',
		        /*groups: [
		            ['parse', 'execution']    //for stacked chart enable this
		        ],*/
		        json: {},
		        type: 'bar',
		        labels: true,
		        colors: {
		            parse: color1,
		            execution: color2
		        }
		    },
		    /*zoom: {
		        enabled: true
		    },*/
		    grid: {
		        /*x: {
		            show: true
		        }*/
		        y: {
		        	show: true
		        }
		    },
		    legend: {
		        position: 'right'
		    },
		    tooltip: {
		        grouped: false // Default true
		    },
		    axis: {
		    	//rotated: true,
		        x: {
		        	label: {
		        		text: xLabel,
		        		position: 'outer-center'
		                // inner-right : default
		                // inner-center
		                // inner-left
		                // outer-right
		                // outer-center
		                // outer-left
		        	},
		            type: 'category', // this needed to load string x value
		            tick: {
		                rotate: tickRotateAngle,
		                culling: { max: 5 }
		            }
		            //height: 200
		        },
		        y: {
		            label: {
		                text: yLabel,
		                position: 'outer-middle'
		                // inner-top : default
		                // inner-middle
		                // inner-bottom
		                // outer-top
		                // outer-middle
		                // outer-bottom
		            },
		            padding: {top: 10, bottom: 0},
		            tick: {
			          format: function(d) {
			          	return d + " ms";
			          }
			        }
		        }
		    }
		});
	}

	function reloadChartData(chartInstance, parseArr, execArr, scriptOrBrowser) {
		chartInstance.load({
			json: {
		        	x: (scriptOrBrowser) ? scriptFileArr : detectionArr,
		        	parse: parseArr,
		        	execution: execArr
	        }
    	});
	}

	//starting point
	sendAjaxReq("report.json");   //send request for report json and start rendering
})();
