var DOE = {};
var utils = {};
(function() {
	
	var STATE = 'state', PROD_YEAR = 'prodYear', RATE_CLASS = 'rateClass';
	
	var alwaysTrue = _.constant(true);
	
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

	var dsRegistry = DOE.dsRegistry = [database];
	
	function filterDatabase(field, event) {
		var values = event.sender.value(),
			newFilter = database.filter();
			filter = _.find(newFilter.filters, function(item) { return item.field === field });
		if (values.length === 0) {
			filter.operator = alwaysTrue;	
		} else {
			if (field === PROD_YEAR) {
				values = _.map(values, function(year) { return '01/01/' + year; });
			}
			filter.operator = function(value) {
				return values.indexOf(value) >= 0;
			};			
		}
		_.each(dsRegistry, function(ds) {
			ds.filter(newFilter);			
		});
	}
	
	function initCharts(JSONData) {
		var lineChartDatasource = new kendo.data.DataSource({
			schema : {
				model : {
					fields : {
						prodYear : {
							type : 'date'
						},
						state : {
							type : 'string'
						},
						rateClass : {
							type : 'number'
						},
						numOilWells : {
							type : 'number'
						}
						
					}
				}
			},
			data: JSONData,
			group : {
				field : "state"
			},
			sort : {
				field : "prodYear",
				dir : "asc"
		}});
		dsRegistry.push(lineChartDatasource);
		$("#data-visulizer").kendoChart({
			title : {
				text : "Wells Per State"
			},
			dataSource : lineChartDatasource,
			series : [ {
				type : "line",
				field : "numOilWells",
				categoryField : 'prodYear',
				name : "#= group.value #",
				aggregate : "sum",
				padding : 10, 
				colorField: 'color'
			} ],
			legend : {
				position : "bottom",
				visible : true
			},
			valueAxis : {
				labels : {
					format : "{0}"
				}
			},
			categoryAxis : {
				field : "prodYear",
				baseUnit : "fit",
				type : 'date',
				labels : {
					format : "yyyy",
					rotation : 315
				}
			},
			tooltip : {
				visible : true,
				template : "State: #= series.name #: #= value #"
			}
		});		
	}
	
	function initFiltering(JSONData) {
		var stateDataSource = new kendo.data.DataSource({
			data: _.chain(JSONData).pluck(STATE).uniq().value()
		});
		var yearDataSource = new kendo.data.DataSource({
			data: _.chain(JSONData).pluck(PROD_YEAR).uniq()
				.map(function(item) { return item.substring(6); }).value(),
			sort: { dir: 'asc' }
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
		databaseReadPromise.then(function() {
			var JSONData = database.data().toJSON();
			kendo.ui.progress($('html'), false);
			initFiltering(JSONData);
			initCharts(JSONData);
			// pull all the data in as soon as its available
			_.each(dsRegistry, function(ds) { ds.read(); }); 
		});
	}
	
	$(init);
	
}());


(function(){
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
            console.log('loading map. . .');
        },
        loadPieChart: function() {
            console.log('loading pie chart. . .');
        },
        loadLineChart: function() {
            console.log('loading line chart. . .');
        },
        loadBarGraph: function() {
            console.log('loading bar graph. . .');
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
            var modalWindow = $('#modal').data('kendoWindow');
            modalWindow.close();
        }
    };
    kendo.bind($('#modal'), kendo.observable(modalEvents));
}());