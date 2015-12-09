(function(){
	
	var ds = new kendo.data.DataSource({
		transport: {
			read: './states.json'	
		}
	});
	
	function init() {
		$('#doe-map').kendoMap({
	        center: [30.268107, -97.744821],
	        zoom: 3,
	        layers: [{
	            type: "tile",
	            urlTemplate: "http://a.tile.openstreetmap.org/#= zoom #/#= x #/#= y #.png",
	            attribution: "&copy; OpenStreetMap"
	        }]
		});		
		console.log($('#doe-map').length);
	}
	
	$(init);
	
}());