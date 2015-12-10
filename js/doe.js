var DOE = {};

(function() {
	
	var STATE = 'state', PROD_YEAR = 'prod_year', RATE_CLASS = 'rate_class';
	
	var alwaysTrue = _.constant(true);
	
	var database = new kendo.data.DataSource({
		transport: {
			read: 'data/states.json'
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
		var filtering = {
			refreshFilters: function() {
				$('#first-filter-select').data('kendoMultiSelect').refresh();
				$('#second-filter-select').data('kendoMultiSelect').refresh();
				$('#third-filter-select').data('kendoMultiSelect').refresh();
			},
			firstFilter: {
				filterType: null,
				display: true,
				disabled: false,
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
						self.secondFilter.set('display', false);
						self.secondFilter.set('dataSource', emptyDataSource);
					} else {
						self.firstFilter.set('filterType', field);
						self.firstFilter.set('dataSource', dataSourceMap[field]);
						if (!self.secondFilter.display) {
							kendo.fx($('#second-filter')).slideIn('down').play();
							self.secondFilter.set('display', true);							
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
					self.thirdFilter.set('display', false);
					self.thirdFilter.set('dataSource', emptyDataSource);
					self.refreshFilters();
				},
				dataSource: stateDataSource,
				filter: null,
				filterChange: function(event) {
					filterDatabase(this.firstFilter.filterType, event);
				}
			},
			secondFilter: {
				display: false,
				disabled: false,
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
						self.thirdFilter.set('display', false);
					} else {
						self.secondFilter.set('filterType', field);
						self.secondFilter.set('dataSource', dataSourceMap[field]);
						if (!self.thirdFilter.display) {
							kendo.fx($('#third-filter')).slideIn('down').play();
							self.thirdFilter.set('display', true);							
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
				dataSource: [],
				filter: null,
				filterChange: function(event) {
					filterDatabase(this.secondFilter.filterType, event);
				}
			},
			thirdFilter: {
				display: false,
				disabled: false,
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
				dataSource: [],
				filter: null,
				filterChange: function(event) {
					filterDatabase(this.thirdFilter.filterType, event);
				}
			}
		};
		kendo.bind($('#filters'), kendo.observable(filtering));
	}
	
	function init() {
		kendo.ui.progress($('html'), true);
		databaseReadPromise.then(function() { 
			kendo.ui.progress($('html'), false);
			initFiltering();
		});
	}
	
	$(init);
	
}());