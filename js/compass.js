function Compass(){
	
	console.log("new Compass");
	
	this.isReady = false;
	
	this.device_heading = 0;
	
	this.promise = FULLTILT.getDeviceOrientation({'type': 'world'});
	
	this.promise.then(function(orientationControl) {
		
		this.isReady = true;
		
		orientationControl.listen(function() {

			// Get latest screen-adjusted deviceorientation data
			var screenAdjustedEvent = orientationControl.getScreenAdjustedEuler();

			// Convert true north heading to radians
			this.device_heading = screenAdjustedEvent.alpha * Math.PI / 180;
			
			var event = new CustomEvent("compass_update", {
				detail: {
					heading: this.device_heading
				}
			});
			
			document.dispatchEvent( event );
		});
	})
	.catch(function(message) {	
		console.warn(message);
    });
}