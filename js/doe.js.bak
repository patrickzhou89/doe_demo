var DOE = {};
var utils = {};
var chartref = {};
(function() {
	
	var THEME = 'material';
	
	var STATE = 'state', PROD_YEAR = 'prodYear', RATE_CLASS = 'rateClass',
		GAS_WELLS_DAYS_ON = 'gasWellsDayson', NUM_GAS_WELLS = 'numGasWells',
		OIL_WELLS_DAYS_ON = 'oilWellsDayson', NUM_OIL_WELLS = 'numOilWells',
		GAS = 'gas', OIL = 'oil';
	
	var alwaysTrue = _.constant(true);
	
	var DOEData = null;
	var DOEStateMap = null;
	
	var dsRegistry = DOE.dsRegistry = [];
	
	var defaultFilters = {
		logic: 'and',
		filters: [
			{ field: STATE, operator: alwaysTrue },
			{ field: PROD_YEAR, operator: alwaysTrue },
			{ field: RATE_CLASS, operator: alwaysTrue }
		]
	};
	
	function registerDataSource(ds) {
		ds.filter(defaultFilters);
		ds.read();
		dsRegistry.push(ds);
	}
	
	function filterDataSource(ds, field, event) {
		var values = event.sender.value(),
			newFilter = ds.filter();
			filter = _.find(newFilter.filters, function(item) { return item.field === field });
		if (values.length === 0) {
			filter.operator = alwaysTrue;
		} else {
			filter.operator = function(value) {
				return values.indexOf(value) >= 0;
			};			
		}
		ds.filter(newFilter);
	}
		
	function applyFilters(field, event) {
		_.each(dsRegistry, function(ds) {
			filterDataSource(ds, field, event);
		});
	}
	
	function initCharts(JSONData) {
		initBarCharts(JSONData);
		initLineChart(JSONData);
		initPieChart(JSONData);	
		initTable(JSONData);
	}
	
	function initBarCharts(JSONData) {
		var ds = new kendo.data.DataSource({ data: JSONData });
		registerDataSource(ds);
		$("#wellsBarChart").kendoChart({
			theme: THEME,
			title: 'Wells per Rate Class',
			dataSource: ds, 
			seriesDefaults: { 
				categoryField : 'rateClass',
				aggregate : "sum",
				type: "column" 
			},
			categoryAxis: {
				labels: {
					rotation: -45
				}								
			},
			valueAxis : {
				labels : {
					format: "n0",
					rotation : 315,
					padding:{
						top: 30
					}
				}
			},
			series: [{
				name: 'Number of Gas Wells',
				field: 'numGasWells' 
			}, {
				name: 'Number of Oil Wells',
				field: 'numOilWells' 
			}],
			tooltip : {
				visible : true,
				template: "#: series.name#<br/> Wells:#=kendo.toString(value, 'n0')#<br/> Rate Class:#: category#",
			}
		});
		$("#daysOnBarChart").kendoChart({
			theme: THEME,
			title: 'Days On per Rate Class',
			dataSource: ds,
			seriesDefaults: { 
				categoryField : 'rateClass',
				aggregate : "sum",
				type: "column" 
			},
			categoryAxis: {
				labels: {
					rotation: -45
				}								
			},
			valueAxis : {
				labels : {
					format: "n0",
					rotation : 315,
					padding:{
						top: 30
					}
				}
			},
			series: [{
				name: 'Gas Wells Days On',
				field: 'gasWellsDayson' 
			}, {
				name: 'Oil Well Days On',
				field: 'oilWellsDayson' 
			}],
			tooltip : {
				visible : true,
				template: "#: series.name#<br/> Days On:#=kendo.toString(value, 'n0')#<br/> Rate Class:#: category#",
			}
		});		
	}
	
	function initMaps(JSONdata){
		var numOilSum=0,numGasSum=0, numOilDaysSum=0,numGasDaysSum=0,maxOil=0,maxGas=0, maxOilDays=0, maxGasDays=0, stateList={};
   		$.each(DOEData, function(){
   			state=DOEStateMap[this.state];
   			if(stateList[state]){
   				stateList[state].numOilWellTotal+=this.numOilWells;
   				stateList[state].numGasWellTotal+=this.numGasWells;
   				stateList[state].numOilWellDaysOnTotal+=this.oilWellsDayson;
   				stateList[state].numGasWellDaysOnTotal+=this.gasWellsDayson;
   			}else{
   				stateList[state] = {
   					numOilWellTotal:this.numOilWells,
   					numGasWellTotal:this.numGasWells,
   					numOilWellDaysOnTotal:this.oilWellsDayson,
   					numGasWellDaysOnTotal:this.gasWellsDayson
   				}
   			}
   			numOilSum+=this.numOilWells;
   			numGasSum+=this.numGasWells;
   			numOilDaysSum+=this.oilWellsDayson;
   			numGasDaysSum+=this.gasWellsDayson;
   		});
   		$.each(stateList,function(){
   			var gasWellRatio=this.numGasWellTotal/numGasSum,
   			    oilWellRatio=this.numOilWellTotal/numOilSum,
   				gasWellDaysOnRatio=this.numGasWellDaysOnTotal/numGasDaysSum,
   				oilWellDaysOnRatio=this.numOilWellDaysOnTotal/numOilDaysSum;
   			if(gasWellRatio>maxGas){
   				maxGas=gasWellRatio;
   			}
   			if(oilWellRatio>maxOil){
   				maxOil=oilWellRatio;
   			}
   			if(gasWellDaysOnRatio>maxGasDays){
   				maxGasDays=gasWellDaysOnRatio;
   			}
   			if(oilWellDaysOnRatio>maxOilDays){
   				maxOilDays=oilWellDaysOnRatio;
   			}
   			this['gasRatio']=gasWellRatio;
   			this['oilRatio']=oilWellRatio;
   			this['gasDaysOnRatio']=gasWellDaysOnRatio;
   			this['oilDaysOnRatio']=oilWellDaysOnRatio;
   		})
	var wellmap = $('#wellsMap').kendoMap({
    	center: [38.5, -90],
        zoom: 4,
        controls:{
          	attribution: false,
           	navigator: false,
           	zoom: false
        },
        pannable:false,
        zoomable: false,
        layers: [{
            type: "shape",
              	dataSource: {
           	    type: "geojson",
               	transport: {
                	read: "data/us.geo.json"
               	}
           	},
            style: {
                fill: {
                    opacity: 0,
                    color: '#3E2723'
                }
            }
        }],
        shapeCreated: function(e){
          	var shape = e.shape,
       		createdState = shape.dataItem.properties.name;
       		if(stateList[createdState]){
       			shape.options.fill.opacity = stateList[createdState].oilRatio / maxOil;
       		}
        }
    }).data('kendoMap');

	wellmap.resize();
	var dayson = $('#daysOnMap').kendoMap({
    	center: [38.5, -90],
        zoom: 4,
        controls:{
          	attribution: false,
           	navigator: false,
           	zoom: false
        },
        pannable:true,
        zoomable: false,
        layers: [{
            type: "shape",
              	dataSource: {
           	    type: "geojson",
               	transport: {
                	read: "data/us.geo.json"
               	}
           	},
            style: {
                fill: {
                    opacity: 0,
                    color: '#3E2723'
                }
            }
        }],
        shapeCreated: function(e){
          	var shape = e.shape,
       		createdState = shape.dataItem.properties.name;
       		if(stateList[createdState]){
       			shape.options.fill.opacity = stateList[createdState].oilDaysOnRatio / maxOilDays;
       		}
     }}).data('kendoMap');	
	dayson.resize();
	}
	
	function initTable(JSONData){
		$("#table").kendoGrid({
			dataSource: {
				data: JSONData,
				schema: {
					model: {
						fields: {
							state: { type: "string" },
							prodYear: { type: "long" },
							rateClass: { type: "string" },
							numOilWells: { type: "number" },
							oilProdBBL: { type: "number" },
							oilWellsDayson: { type: "number" },
							numGasWells: { type: "number" },
							condenProdBBL: { type: "number" },
							gasWellsDayson: { type: "number" }
						}
					}
				},
				pageSize: 22
			},
			height: 600,
			scrollable: true,
			sortable: true,
			filterable: true,
			pageable: {
				input: true,
				numeric: false
			},
			columns: [
				{ field: "state", title: "State" },
				{ field: "prodYear", title: "Production Year" },
				{ field: "rateClass", title: "Rate Class"},
				{ field: "numOilWells", title: "# of Oil Wells" },
				{ field: "oilProdBBL", title: "Barrels of Oil Produced" },
				{ field: "oilWellsDayson", title: "# of Days Oil Wells On" },
				{ field: "numGasWells", title: "# of Gas Wells"},
				{ field: "condenProdBBL", title: "condenProdBBL" },
				{ field: "gasWellsDayson", title: "# of Days Gas Wells On" }
			]
		});
		registerDataSource($("#table").data('kendoGrid').dataSource);
	}
	
	function initLineChart(JSONData){
		var lineChartDatasource = new kendo.data.DataSource({
			data: JSONData
		});
		registerDataSource(lineChartDatasource);
		
		var oilWellSeries = [],
		gasWellSeries = [],
		gasDaysOnSeries = [],
		oilDaysOnSeries = [],
		categories = [],
		items = lineChartDatasource.view(),
		length = items.length,
		item;
		$("#daysOnLineChart").kendoChart({
			title : {
				text : "Days On per Rate Class"
			},
			theme: THEME,
			seriesDefaults: { 
				categoryField : 'rateClass',
				aggregate : "sum",
				type: "line" 
			},
			dataSource : lineChartDatasource,
			series: [{
				name: 'Gas',
				field: 'gasWellsDayson' 
			}, {
				name: 'Oil',
				field: 'oilWellsDayson' 
			}],
			legend : {
				position : "bottom",
				visible : true
			},
			valueAxis : {
				labels : {
					format: "n0",
					rotation : 315,
					padding:{
						top: 30
			}
				}
			},
			categoryAxis: {
				labels: {
					rotation: -45
				}								
			},
			tooltip : {
				template: "#: series.name#<br/> Days On:#=kendo.toString(value, 'n0')#<br/> Rate Class:#: category#",
				visible : true
			}
		});	
		
		var wellLines = $("#wellsLineChart").kendoChart({
			title : {
				text : "Wells per Rate Class"
			},
			theme: THEME,
			dataSource : lineChartDatasource,
			seriesDefaults: { 
				categoryField : 'rateClass',
				aggregate : "sum",
				type: "line" 
			},
			legend : {
				position : "bottom",
				visible : true
			},
			series: [{
				name: 'Number of Gas Wells',
				field: 'numGasWells' 
			}, {
				name: 'Number of Oil Wells',
				field: 'numOilWells' 
			}],
			valueAxis : {
				labels : {
					format: "n0",
					rotation : 315,
					padding:{
						top: 30
					}
				}
			},
			categoryAxis: {
				labels: {
					rotation: -45
				}								
			},
			tooltip : {
				visible : true,
				template: "#: series.name#<br/> Wells:#=kendo.toString(value, 'n0')#<br/> Rate Class:#: category#",
			}
		});	
		wellLines.resize();
	}
	
	
	function initPieChart(JSONData){
		var pieChartDatasource = new kendo.data.DataSource({
			data: JSONData,
			group:{field: "rateClass",
				aggregates: [{ field: "numOilWells", aggregate: "sum" },
					{ field: "numGasWells", aggregate: "sum" },
					{ field: "oilWellsDayson", aggregate: "sum" },
				{ field: "gasWellsDayson", aggregate: "sum" }]
			}
		});
		registerDataSource(pieChartDatasource);
		//console.log('pieChartDatasource', pieChartDatasource);
		var oilSeries = [],
		gasSeries = [],
		gasDaysOnSeries = [],
		oilDaysOnSeries = [],
		items = pieChartDatasource.view(),
		length = items.length,
		item;
		//create the chart series  
		for (var i = 0; i < length; i++) {
			item = items[i];
			oilSeries.push({ category: item.value, value: item.aggregates.numOilWells.sum});
			gasSeries.push({ category: item.value, value: item.aggregates.numGasWells.sum});
			gasDaysOnSeries.push({category: item.value, value: item.aggregates.oilWellsDayson.sum});
			oilDaysOnSeries.push({category: item.value, value: item.aggregates.gasWellsDayson.sum});
		}
		
		$("#wellsOilPieChart").kendoChart({
			title : {
				text : "Oil Wells per Rate Class"
			},
			seriesDefaults: {
				type: "pie"
			},
			dataSource : pieChartDatasource,
			series: [{data:oilSeries}],
			tooltip: {
				visible: true
			}
			
		});	

		$("#wellsGasPieChart").kendoChart({
			title : {
				text : "Gas Wells per Rate Class"
			},
			theme:"material",
			seriesDefaults: {
				type: "pie"
			},
			dataSource : pieChartDatasource,
			series: [{data:gasSeries}],
			tooltip: {
				visible: true
			}
			
		});	
		$("#daysOnOilPieChart").kendoChart({
			title : {
				text : "Oil Days On per Rate Class"
			},
			seriesDefaults: {
				type: "pie"
			},
			dataSource : pieChartDatasource,
			series: [{data:oilDaysOnSeries}],
			tooltip: {
				visible: true
			}
			
		});	
		
		$("#daysOnGasPieChart").kendoChart({
			title : {
				text : "Gas Days On per Rate Class"
			},
			theme:"material",
			seriesDefaults: {
				type: "pie"
			},
			dataSource : pieChartDatasource,
			series: [{data:gasDaysOnSeries}],
			tooltip: {
				visible: true
			}
		});	
	}
	
	function initFiltering(JSONData) {
		var stateDataSource = new kendo.data.DataSource({
			data: _.chain(JSONData).pluck(STATE).uniq().value()
		});
		var yearDataSource = new kendo.data.DataSource({
			data: _.chain(JSONData).pluck(PROD_YEAR).uniq().value()
		});
		var rateClassDataSource = new kendo.data.DataSource({
			data: _.range(1, 27)
		});
		var emptyDataSource = new kendo.data.DataSource({ data: [] });
		var dataSourceMap = {};
		dataSourceMap[STATE] = stateDataSource;
		dataSourceMap[PROD_YEAR] = yearDataSource;
		dataSourceMap[RATE_CLASS] = rateClassDataSource;
		var filterTypes = [
			{ field: STATE, display: 'States' }, 
			{ field: PROD_YEAR, display: 'Years' }
		];
		var $secondFilter = $('#second-filter');
		var filtering = {
			refreshFilters: function() {
				$('#first-filter-select').data('kendoMultiSelect').refresh();
				$('#second-filter-select').data('kendoMultiSelect').refresh();
			},
			firstFilter: {
				filterType: null,
				filterTypeSource: new kendo.data.DataSource({
					data: filterTypes
				}),
				filterTypeSelect: function(event) {
					var self = this,
						dataItem = event.sender.dataItem(event.item),
						field = dataItem.field;
					if (!field) {
						self.firstFilter.set('filterType', null);
						self.firstFilter.set('dataSource', emptyDataSource);
						if (!$secondFilter.is(':hidden')) {
							kendo.fx($secondFilter).expand('vertical').reverse();							
						}
						self.secondFilter.set('dataSource', emptyDataSource);
					} else {
						self.firstFilter.set('filterType', field);
						self.firstFilter.set('dataSource', dataSourceMap[field]);
						if ($secondFilter.is(':hidden')) {
							kendo.fx($secondFilter).expand('vertical').play();
						}
						self.secondFilter.set('filterType', null);
						self.secondFilter.set('dataSource', emptyDataSource);
						self.secondFilter.filterTypeSource.filter({
							field: 'field', 
							operator: function(field) {
								var firstFilterType = $('#first-filter-type').data('kendoDropDownList').value();
								return firstFilterType !== field;
							}
						});
 					}
					self.refreshFilters();
				},
				dataSource: emptyDataSource,
				filter: null,
				filterChange: function(event) {
					applyFilters(this.firstFilter.filterType, event);
				}
			},
			secondFilter: {
				filterTypeSource: new kendo.data.DataSource({
					data: filterTypes
				}),
				filterTypeSelect: function(event) {
					var self = this,
						dataItem = event.sender.dataItem(event.item),
						field = dataItem.field;
					if (!field) {
						self.secondFilter.set('filterType', null);
						self.secondFilter.set('dataSource', emptyDataSource);
					} else {
						self.secondFilter.set('filterType', field);
						self.secondFilter.set('dataSource', dataSourceMap[field]);
 					}
					self.refreshFilters();
				},
				filterType: null,
				dataSource: emptyDataSource,
				filter: null,
				filterChange: function(event) {
					applyFilters(this.secondFilter.filterType, event);
				}
			}
		};
		kendo.bind($('#filters'), kendo.observable(filtering));
		$('#second-filter').hide();
	}
	
	function init() {
		kendo.ui.progress($('html'), true);
		$.get('data/states.json', {}, 
			function(result) {
				DOE.data = DOEData = result;
				kendo.ui.progress($('html'), false);
				initFiltering(DOEData);
				initCharts(DOEData);					
				initMaps(DOEData);
			}, 'json');
		$.get('data/states_hash.json', {}, 
			function(result) {
				DOEStateMap = result;				
			});		
	}
	
	$(init);

}());


(function(){
	var $modal = $('#modal').kendoWindow({
        modal: true,
        height: '180px',
        width: '400px',
        draggable: false,
        pinned: true,
        visible:false,
        resizable: false,
        activate: function() {
            this.wrapper.find('input#export-type').kendoDropDownList({
                dataSource: [{
                    fileType: 'Spreadsheet (xlsx)',
                    ext: 'excel'
                }, {
                    fileType: 'Spreadsheet (csv)',
                    ext: 'excel_csv'
                }, {
                    fileType: 'PDF',
                    ext: 'pdf'
                }, {
                    fileType: 'JSON',
                    ext: 'json'
                }, {
                    fileType: 'XML',
                    ext: 'xml'
                }],
                dataTextField: 'fileType',
                dataValueField: 'ext',
            });
        },
        close: function(){
        	//this.wrapper.find('#filename').val('');
        }
    }).data('kendoWindow');
    $('#modal').siblings('.k-header').remove();

	var header = {
		toggleFiltering:function(){
			$('#filter-bar').toggle('slide',{direction:'right'},200);
		}
	};
	kendo.bind($('#header'), kendo.observable(header));

	var sidebar = {
		toggleFiltering:function(){
			this.toggle();
		}
	};
	kendo.bind($('#sidebar'), kendo.observable(header));

    var sideBar = {
        loadMap: function() {
        	var $map = $("#wellsMap"),
        		mapData = $map.data('kendoMap'),
        		$dataVizContainer = $('#data-visualizer');
    		$("#map").css({'position':'static'});
			$("#lineChart, #pieChart, #barChart, #table").css({'position':'absolute'});
        },
        loadPieChart: function() {
        	if(chartref['pie']){
        		chartref['pie'].resize();
        	}
			$("#pieChart").css({'position':'static'});
			$("#lineChart, #map, #barChart, #table").css({'position':'absolute'});
        	
        },
        loadLineChart: function() {
        	if(chartref['line']){
        		chartref['line'].resize();
        	}
        	$("#lineChart").css({'position':'static'});
			$("#pieChart, #map, #barChart, #table").css({'position':'absolute'});
        },
        loadBarGraph: function() {
        	$("#barChart").css({'position':'static'});
			$("#pieChart, #map, #lineChart, #table").css({'position':'absolute'});
        },
		loadTable: function() {
        	$("#table").css({'position':'static'});
			$("#pieChart, #map, #lineChart, #barChart").css({'position':'absolute'});
        },
        loadExportView: function() {
            $('#modal').data('kendoWindow').open().center();
        }
    };
    kendo.bind($('#sidebar'), kendo.observable(sideBar));
}());
//begin modal events 
(function() {
    //create utility functions
    utils.gridJson2Xml = function(obj) {
        var xml = '';
        if (Object.keys(obj).length) {
            var self = this,
                consts = self.constants,
                keyCount = undefined,
                row_openTemplate = '',
                row_closeTemplate = '';
            xml = consts.XML_OPEN_TAG;
            $(obj).each(function(index, rowJSON) {
                keyCount = 0;
                row_openTemplate = consts.OPEN_TAG + consts.ROW + '_' + index + consts.END_TAG;
                row_closeTemplate = consts.OPEN_TAG + consts.FORWARD_SLASH + consts.ROW + '_' + index++ + consts.END_TAG;
                xml += row_openTemplate + consts.NEW_LINE + consts.TAB;
                for (var key in this) {
                    var numKeys = Object.keys(this).length,
                        value = this[key];
                    xml += consts.OPEN_TAG + key + consts.END_TAG + value + consts.OPEN_TAG + consts.FORWARD_SLASH + key + consts.END_TAG + consts.NEW_LINE;
                    if ((keyCount++ + 1) !== numKeys) {
                        xml += consts.TAB;
                    }
                }
                xml += row_closeTemplate + consts.NEW_LINE;

            });
        }
        return xml;
    };
    utils.clientSideDownload = function(filename, content) {
        var element = document.createElement('a');
        element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(content));
        element.setAttribute('download', filename);
        element.style.display = 'none';
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    };
    utils.validateFilename = function(filename){
    	var regex  = new RegExp("/^\.[0-9a-z]+$/i");
    	return regex.test(filename);
    };
    var modalEvents = {
        exportRawData: function() {
            var fileType = $('#modal').find('#export-type').data('kendoDropDownList').value(),
            	$filenameInput = $('#modal').find('#filename'), 
                userFilename = $filenameInput.val(),
                saveFileName = (userFilename) ? userFilename : 'export.' + fileType,
                exportType = {
                    JSON: 'json',
                    EXCEL: 'excel',
                    XML: 'xml',
                    PDF: 'pdf',
                    CSV: 'csv'
                };
                if(!utils.validateFilename(saveFileName)){
                	saveFileName += '.' + fileType;
                }
            switch (true) {
                case fileType === exportType.JSON:
                    var gridJSON = DOE.database.view(); //filtered datasource
                    utils.clientSideDownload(saveFileName, JSON.stringify(gridJSON));
                    break;
                case fileType === exportType.EXCEL:
                    $grid.saveAsExcel();
                    break;
                case fileType === exportType.XML:
                    var gridJSON = DOE.database.view(); //filtered datasource
                        xml = utils.gridJson2Xml(gridJSON);
                    utils.clientSideDownload(saveFileName, xml);
                    break;
                case fileType === exportType.PDF:
                    $grid.saveAsPDF();
                    break;
                default:
                    console.log('no type found. . .');
            };
        },
        cancelExport: function() {
        	//console.log('jdad');
            $('#modal').data('kendoWindow').close();
        }
    };
    kendo.bind($('#modal'), kendo.observable(modalEvents));
}());