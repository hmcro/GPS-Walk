var Waypoints = (function(){
	
	function Waypoints(){
				
		console.log("new Waypoints");
		
		this.data = {};
	};
	
	Waypoints.prototype.setJSON = function(json){
		this.data = json;
	}
	
	Waypoints.prototype.getTotalWaypoints = function(){
		return this.data.waypoints.length;
	}
	
	return Waypoints;
	
})();