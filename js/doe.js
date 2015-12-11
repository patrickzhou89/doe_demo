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
			title: 'Number of Wells',
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
			series: [{
				name: 'Number of Gas Wells',
				field: 'numGasWells' 
			}, {
				name: 'Number of Oil Wells',
				field: 'numOilWells' 
			}]
		});
		$("#daysOnBarChart").kendoChart({
			theme: THEME,
			title: 'Well Days On',
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
			series: [{
				name: 'Gas Wells Days On',
				field: 'gasWellsDayson' 
			}, {
				name: 'Oil Well Days On',
				field: 'oilWellsDayson' 
			}]
		});		
	}
	
	function initMaps(JSONdata){
	var wellmap = $('#wellsMap').kendoMap({
    	center: [39.5, -120],
        zoom: 4,
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
         }).data('kendoMap');		

		wellmap.resize();
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
				name: 'Gas Wells Days On',
				field: 'gasWellsDayson' 
			}, {
				name: 'Oil Well Days On',
				field: 'oilWellsDayson' 
			}],
			legend : {
				position : "bottom",
				visible : true
			},
			valueAxis : {
				labels : {
					format : "{0}"
				}
			},
			tooltip : {
				visible : true
			}
		});	
		
		$("#wellsLineChart").kendoChart({
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
					format : "{0}"
				}
			},
			tooltip : {
				visible : true
			}
		});
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
		function retrieveData(key) {
			return _.chain(JSONData).pluck(key).uniq().value();
		}
		
		var stateDataSource = new kendo.data.DataSource({
			data: retrieveData(STATE)
		});
		stateDataSource.read();
		var yearDataSource = new kendo.data.DataSource({
			data: retrieveData(PROD_YEAR)
		});
		yearDataSource.read();
		var emptyDataSource = new kendo.data.DataSource({ data: [] });
		var dataSourceMap = {};
		dataSourceMap[STATE] = stateDataSource;
		dataSourceMap[PROD_YEAR] = yearDataSource;
		var filterTypes = [
			{ field: STATE, display: 'States' }, 
			{ field: PROD_YEAR, display: 'Years' }
		];
		var $secondFilter = $('#second-filter');
		var filtering = {
			displaySeriesChecked: function(event) {
				var $target = $(event.target),
					daysOnLineChartSeries = $("#daysOnLineChart").getKendoChart().options.series,
					wellsLineChartSeries = $("#wellsLineChart").getKendoChart().options.series,
					wellsBarChartSeries = $("#wellsBarChart").getKendoChart().options.series,
					daysOnBarChartSeries = $("#daysOnBarChart").getKendoChart().options.series,
					showOil, showGas;
				if ($target.is("#displaySeriesBoth")) {
					showOil = showGas = true;
					$('#daysOnGasPieChart, #daysOnOilPieChart, #wellsGasPieChart, #wellsOilPieChart').show();
				} else if ($target.is("#displaySeriesGas")) {
					showOil = false;
					showGas = true;
					$('#daysOnGasPieChart').show();
					$('#daysOnOilPieChart').hide();
					$('#wellsGasPieChart').show();
					$('#wellsOilPieChart').hide();
				} else if ($target.is("#displaySeriesOil")) {
					showOil = true;
					showGas = false;
					$('#daysOnGasPieChart').hide();
					$('#daysOnOilPieChart').show();
					$('#wellsGasPieChart').hide();
					$('#wellsOilPieChart').show();
				}
				daysOnLineChartSeries[0].visible = showGas;
				daysOnLineChartSeries[1].visible = showOil;
				wellsLineChartSeries[0].visible = showGas;
				wellsLineChartSeries[1].visible = showOil;
				wellsBarChartSeries[0].visible = showGas;
				wellsBarChartSeries[1].visible = showOil;
				daysOnBarChartSeries[0].visible = showGas;
				daysOnBarChartSeries[1].visible = showOil;
				$("#daysOnLineChart").getKendoChart().redraw();
				$("#wellsLineChart").getKendoChart().redraw();
				$("#wellsBarChart").getKendoChart().redraw();
				$("#daysOnBarChart").getKendoChart().redraw();
			},
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
					self.filterDependentMultiselect();
					self.refreshFilters();
				},
				dataSource: emptyDataSource,
				filter: null,
				filterChange: function(event) {
					var self = this;
					applyFilters(self.firstFilter.filterType, event);
					self.filterDependentMultiselect();
				}
			},
			filterDependentMultiselect: function() {
				var self = this;
				if (!self.firstFilter.filter || !self.secondFilter.filterType) return;
				self.secondFilter.dataSource.data(_.chain(JSONData)
					.filter(function(item) {
						var matches = self.firstFilter.filter.indexOf(item[self.firstFilter.filterType]) >= 0;
						return matches ? !!(item.numGasWells || item.numOilWells || item.oilWellsDayson || item.gasWellsDayson) : false;
					}).pluck(self.secondFilter.filterType).uniq().value());
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
					self.filterDependentMultiselect();
					self.refreshFilters();
				},
				filterType: null,
				dataSource: emptyDataSource,
				filter: null,
				filterChange: function(event) {
					var self = this;
					applyFilters(self.secondFilter.filterType, event);
					self.filterDependentMultiselect();
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
    		$("#map").show();
			$("#lineChart, #pieChart, #barChart, #table").hide();
        },
        loadPieChart: function() {
        	if(chartref['pie']){
        		chartref['pie'].resize();
        	}
			$("#pieChart").show();
			$("#lineChart, #map, #barChart, #table").hide();
        	
        },
        loadLineChart: function() {
        	if(chartref['line']){
        		chartref['line'].resize();
        	}
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