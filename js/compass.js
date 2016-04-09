var Compass = (function(){
	
	function Compass(){
		
		console.log("new Compass");
		
		this.isSupported = false;
		
		if (window.DeviceOrientationEvent) {
			this.isSupported = true;
		}
		
	};
	
	
	Compass.prototype.start = function(){
		
		this.promise = FULLTILT.getDeviceOrientation({'type': 'world'});
		this.promise.then(function(orientationControl) {
			
			orientationControl.listen(function() {

				// Get latest screen-adjusted deviceorientation data
				var screenAdjustedEvent = orientationControl.getScreenAdjustedEuler();
	
				// Convert true north heading to radians
				this.device_heading = screenAdjustedEvent.alpha * Math.PI / 180;
				
				var event = new CustomEvent("compassChange", {
					detail: {
						heading: this.device_heading
					}
				});				
				document.dispatchEvent( event );
			});
				
			}).catch(function(error){						
				console.warn(error);
			});
		};
	
	return Compass;
	
})();