var DOE = {};

(function() {
	
	var STATE = 'state', PROD_YEAR = 'prodYear', RATE_CLASS = 'rateClass';
	
	var alwaysTrue = _.constant(true);
	
	var database = new kendo.data.DataSource({
		transport: {
			read: 'data/statesNewer.json'
		},
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
	
	DOE.database = database;

	function filterDatabase(field, event) {
		var values = event.sender.value(),
			newFilter = database.filter();
			filter = _.find(newFilter.filters, function(item) { return item.field === field });
		if (values.length === 0) {
			filter.operator = alwaysTrue;	
		} else {
			filter.operator = function(value) {
				return values.length === 0 || values.indexOf(value) >= 0;
			};			
		}
		database.filter(newFilter);
	}
	
	function initCharts(){
		var lineChartDatasource = 	new kendo.data.DataSource({
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
			transport: {
				read: 'data/statesNewer.json',
				dataType:"json"
			},
			group : {
				field : "state"
			},
			sort : {
				field : "prodYear",
				dir : "asc"
		}});
		
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
	
	function initFiltering() {
		var JSONData = database.data().toJSON();
		var stateDataSource = new kendo.data.DataSource({
			data: _.chain(JSONData).pluck(STATE).uniq().value()
		});
		var yearDataSource = new kendo.data.DataSource({
			data: _.chain(JSONData).pluck(PROD_YEAR).uniq().value(),
			sort: { dir: 'asc' }
		});
		var rateClassDataSource = new kendo.data.DataSource({
			data: _.range(1, 27)
		});
		var dataSourceMap = {};
		dataSourceMap[STATE] = stateDataSource;
		dataSourceMap[PROD_YEAR] = yearDataSource;
		dataSourceMap[RATE_CLASS] = rateClassDataSource;
		var emptyDataSource = new kendo.data.DataSource({ data: [] });
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
					console.log($('#third-filter'));
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
	function initExportModule(){
		var exportModule = {
			loadExportView: function(){
				console.log('loading export view. . .');
			}
		};
		kendo.bind($('#sidebar'), kendo.observable(exportModule));
	}
	
	function init() {
		kendo.ui.progress($('html'), true);
		initExportModule();
		databaseReadPromise.then(function() { 
			kendo.ui.progress($('html'), false);
			initFiltering();
			initCharts();
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
}());