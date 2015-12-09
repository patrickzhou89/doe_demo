var DOE = {};

(function() {
	
	var database = new kendo.data.DataSource({
		transport: {
			read: 'data/states.json'
		}
	});
	
	DOE.database = database;
	
}());