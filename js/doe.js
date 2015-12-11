var DOE = {};
var utils = {};
(function() {
	
	var STATE = 'state', PROD_YEAR = 'prodYear', RATE_CLASS = 'rateClass';
	
	var alwaysTrue = _.constant(true);
	
	var DOEData = null;
	var DOEStateMap = null;
	
	/*
	var database = DOE.database = new kendo.data.DataSource({
		transport: {
			read: 'data/states.json'
		},
		//schema: { model: DataModel },
		filter: {
			logic: 'and',
			filters: [
				{ field: STATE, operator: alwaysTrue },
				{ field: PROD_YEAR, operator: alwaysTrue },
				{ field: RATE_CLASS, operator: alwaysTrue }
			]
		}
	});
	
	var databaseReadPromise = database.read();
	*/
	
	var dsRegistry = DOE.dsRegistry = [];
	
	function filterDatabase(field, event) {
		return; // TODO: fix this
		var values = event.sender.value(),
			newFilter = database.filter();
			filter = _.find(newFilter.filters, function(item) { return item.field === field }),
			isProdYear = field === PROD_YEAR;
		if (values.length === 0) {
			filter.operator = alwaysTrue;
		} else {
			if (isProdYear) {
				values = _.map(values, function(year) { return new Date('01/01/' + year).getTime(); });
			}
			filter.operator = function(value) {
				if (isProdYear) {
					if (value instanceof Date) {
						value = value.getTime();
					} else {
						value = new Date(value).getTime();
					}
				}
				return values.indexOf(value) >= 0;
			};			
		}
		_.each(dsRegistry, function(ds) {
			ds.filter(newFilter);			
		});
	}
	
	function initCharts(JSONData) {
		initLineChart(JSONData);
		initPieChart(JSONData);	
		initTable(JSONData);
	}
	function initMaps(JSONdata){
	$('#wellsMap').kendoMap({
    	center: [39.5, -120],
        zoom: 4,
        minSize: 300,
        controls:{
          	attribution: false,
           	navigator: false,
           	zoom: false
        },
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
                    opacity: 0.7,
                    color: 'blue'
                }
            }
        }],
        shapeCreated: function(e){
          	var shape = e.shape,
           		createdState = shape.dataItem.properties.name,
           		filteredData = DOEData,
           		oilSumTotal = 0,
           		gasSumTotal = 0,
           		stateGasTotal = 0,
           		stateOilTotal = 0;
           		stateData = $.map(filteredData, function(n, i){
           			oilSumTotal += n.numOilWells;
           			gasSumTotal += n.numGasWells;
           			if(DOEStateMap[n.state] === createdState){
           				stateOilTotal += n.numOilWells;
           				stateGasTotal += n.numGasWells;             				
           				return n;
           			}
           		});
            		// console.log('stateOilTotal:', stateOilTotal);
            		// console.log('stateGasTotal:', stateGasTotal);
            		// console.log('oilSumTotal:', oilSumTotal);
            		// console.log('gasSumTotal:', gasSumTotal); 
            		// console.log('% gas usage by state ' + createdState +':', (stateGasTotal / gasSumTotal) * 100);
            		// console.log('% oil usage by state ' + createdState +':', (stateOilTotal / oilSumTotal) * 100);     		
            		// console.log('shape:', shape);
       		shape.options.fill.opacity = (stateOilTotal / oilSumTotal) * 100;
            }
         });				
	}
	
	function initTable(JSONData){
		$("#table").kendoGrid({
			dataSource: {
				data: JSONData,
				schema: {
					model: {
						fields: {
							state: { type: "string" },
							prodYear: { type: "date" },
							rateClass: { type: "number" },
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
				{ field: "prodYear", title: "Production Year", format:"{0:yyyy}" },
				{ field: "rateClass", title: "Rate Class"},
				{ field: "numOilWells", title: "# of Oil Wells" },
				{ field: "oilProdBBL", title: "Barrels of Oil Produced" },
				{ field: "oilWellsDayson", title: "# of Days Oil Wells On" },
				{ field: "numGasWells", title: "# of Gas Wells"},
				{ field: "condenProdBBL", title: "condenProdBBL" },
				{ field: "gasWellsDayson", title: "# of Days Gas Wells On" }
			]
		});
		
		
	}
	
	function initLineChart(JSONData){
		var lineChartDatasource = new kendo.data.DataSource({
			data: JSONData,
			group:{
				field: "rateClass",
				aggregates: [{ field: "numOilWells", aggregate: "sum" },
				{field: "numGasWells", aggregate: "sum" },
				{ field: "oilWellsDayson", aggregate: "sum" },
				{ field: "gasWellsDayson", aggregate: "sum" }]
			}});
		lineChartDatasource.read();
		
		var oilWellSeries = [],
		gasWellSeries = [],
		gasDaysOnSeries = [],
		oilDaysOnSeries = [],
		categories = [],
		items = lineChartDatasource.view(),
		length = items.length,
		item;
		//create the chart series  
		for (var i = 0; i < length; i++) {
			item = items[i];
			categories.push(items[i].value);
			oilWellSeries.push({type : "line",name: "Oil Wells", category: item.value, value: item.aggregates.numOilWells.sum});
			gasWellSeries.push({type : "line",name: "Gas Wells", category: item.value, value: item.aggregates.numGasWells.sum});
			gasDaysOnSeries.push({type : "line",name: "Gas Days On", category: item.value, value: item.aggregates.oilWellsDayson.sum});
			oilDaysOnSeries.push({type : "line",name: "Oil Days On", category: item.value, value: item.aggregates.gasWellsDayson.sum});
		}
		
		dsRegistry.push(lineChartDatasource);
		$("#daysOnLineChart").kendoChart({
			title : {
				text : "Days On per Rate Class"
			},
			theme:"material",
			dataSource : lineChartDatasource,
			series : [gasDaysOnSeries, oilDaysOnSeries ],
			legend : {
				position : "bottom",
				visible : true
			},
			valueAxis : {
				labels : {
					format : "{0}"
				}
			},
			categoryAxis: {
				categories:categories
			},
			tooltip : {
				visible : true
			}
		});	
		
		$("#wellsLineChart").kendoChart({
			title : {
				text : "Wells per Rate Class"
			},
			theme:"material",
			dataSource : lineChartDatasource,
			series : [oilWellSeries, gasWellSeries ],
			legend : {
				position : "bottom",
				visible : true
			},
			valueAxis : {
				labels : {
					format : "{0}"
				}
			},
			categoryAxis: {
				categories:categories
			},
			tooltip : {
				visible : true
			}
		});
	}
	
	
	function initPieChart(JSONData){
		var pieChartWellsDatasource = new kendo.data.DataSource({
			data: JSONData,
			//filter: { field: "prodYear", operator: "gt", value: "01/01/2005" },
			group:{field: "rateClass",
				aggregates: [{ field: "numOilWells", aggregate: "sum" },
				{ field: "numGasWells", aggregate: "sum" },
					{ field: "oilWellsDayson", aggregate: "sum" },
				{ field: "gasWellsDayson", aggregate: "sum" }]
			}
		});
		pieChartWellsDatasource.read();
		var oilWellSeries = [],
		gasWellSeries = [],
		gasDaysOnSeries = [],
		oilDaysOnSeries = [],
		items = pieChartWellsDatasource.view(),
		length = items.length,
		item;
		//create the chart series  
		for (var i = 0; i < length; i++) {
			item = items[i];
			oilWellSeries.push({ category: item.value, value: item.aggregates.numOilWells.sum});
			gasWellSeries.push({ category: item.value, value: item.aggregates.numGasWells.sum});
			gasDaysOnSeries.push({ category: item.value, value: item.aggregates.oilWellsDayson.sum});
			oilDaysOnSeries.push({ category: item.value, value: item.aggregates.gasWellsDayson.sum});
		}
		dsRegistry.push(pieChartWellsDatasource);
		
		$("#wellsOilPieChart").kendoChart({
			title : {
				text : "Oil Wells per Rate Class"
			},
			seriesDefaults: {
				type: "pie"
			},
			dataSource : pieChartWellsDatasource,
			series: [{data:oilWellSeries}],
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
			dataSource : pieChartWellsDatasource,
			series: [{data:gasWellSeries}],
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
			dataSource : pieChartWellsDatasource,
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
			dataSource : pieChartWellsDatasource,
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
			data: _.chain(JSONData).pluck(PROD_YEAR).uniq()
				.map(function(item) { return item.substring(6); }).value()
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
			{ field: PROD_YEAR, display: 'Years' }, 
			{ field: RATE_CLASS, display: 'Rate Classes' }
		];
		var $secondFilter = $('#second-filter'), $thirdFilter = $('#third-filter');
		var filtering = {
			refreshFilters: function() {
				$('#first-filter-select').data('kendoMultiSelect').refresh();
				$('#second-filter-select').data('kendoMultiSelect').refresh();
				$('#third-filter-select').data('kendoMultiSelect').refresh();
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
					if (!$thirdFilter.is(':hidden')) {
						kendo.fx($thirdFilter).expand('vertical').reverse();
					}
					self.thirdFilter.set('dataSource', emptyDataSource);
					self.refreshFilters();
				},
				dataSource: emptyDataSource,
				filter: null,
				filterChange: function(event) {
					filterDatabase(this.firstFilter.filterType, event);
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
						if (!$thirdFilter.is(':hidden')) {
							kendo.fx($thirdFilter).expand('vertical').reverse();							
						}
					} else {
						self.secondFilter.set('filterType', field);
						self.secondFilter.set('dataSource', dataSourceMap[field]);
						if ($thirdFilter.is(':hidden')) {
							kendo.fx($thirdFilter).expand('vertical').play();							
						}
						self.thirdFilter.filterTypeSource.filter({
							field: 'field', 
							operator: function(field) {
								var firstFilterType = 
									$('#first-filter-type').data('kendoDropDownList').value();
								var secondFilterType = 
									$('#second-filter-type').data('kendoDropDownList').value();
								return !(firstFilterType === field || secondFilterType === field);
							}
						});
 					}
					self.thirdFilter.set('dataSource', emptyDataSource);
					self.refreshFilters();
				},
				filterType: null,
				dataSource: emptyDataSource,
				filter: null,
				filterChange: function(event) {
					filterDatabase(this.secondFilter.filterType, event);
				}
			},
			thirdFilter: {
				filterTypeSource: new kendo.data.DataSource({
					data: filterTypes
				}),
				filterTypeSelect: function(event) {
					var self = this,
						dataItem = event.sender.dataItem(event.item),
						field = dataItem.field;
					self.thirdFilter.set('filterType', field);
					self.thirdFilter.set('dataSource', dataSourceMap[field]);
					self.refreshFilters();
				},
				filterType: null,
				dataSource: emptyDataSource,
				filter: null,
				filterChange: function(event) {
					filterDatabase(this.thirdFilter.filterType, event);
				}
			}
		};
		kendo.bind($('#filters'), kendo.observable(filtering));
		$('#second-filter').hide();
		$('#third-filter').hide();
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
			});
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
        		$dataVizContaienr = $('#data-visulizer');

			$("#lineChart, #pieChart, #barChart, #table").hide();
			$map.css({display: 'block', width:$dataVizContaienr.outerWidth()});
			mapData.resize(); //force redraw to fit to container
			mapData.scroller.enabled = false; //disable scrolling
        },
        loadPieChart: function() {
			$("#pieChart").show();
			$("#lineChart, #map, #barChart, #table").hide();
        },
        loadLineChart: function() {
        	$("#lineChart").show();
			$("#pieChart, #map, #barChart, #table").hide();
        },
        loadBarGraph: function() {
        	$("#barChart").show();
			$("#pieChart, #map, #lineChart, #table").hide();
        },
		loadTable: function() {
        	$("#table").show();
			$("#pieChart, #map, #lineChart, #barChart").hide();
        },
        loadExportView: function() {
            var $modal = $('#modal').kendoWindow({
                modal: true,
                height: '40%',
                width: '30%',
                draggable: false,
                pinned: true,
                resizable: false,
                activate: function() {
                    this.wrapper.find('div.k-header').hide();
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
                	//reset filename field
                	console.log(this.wrapper)
                	this.wrapper.find('#filename').val('');
                }
            }).data('kendoWindow');
            $modal.open().center();
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
                console.log(utils.validateFilename(saveFileName));
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