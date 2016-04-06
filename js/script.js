const DISTANCE_THRESHOLD = 20; // in meters
const WAYPOINT_FILE_PATH = "js/islington.json";

var start_time, waypoint_time;
var finished = false;
var wpid, secid;
var map;
var location_point, location_source;
var waypoint_t_point, waypoint_t_source;
var waypoint_index = 0;
var waypoint_reminder_index = -1;
var waypointsObj;

var soundplayer = new SoundPlayer();

var heading = 0;

var current_user_position_marker;
var current_user_position_latlng;


$(document).ready(function(){
	

	var promise = FULLTILT.getDeviceOrientation({'type': 'world'});
	
	promise.then(function(orientationControl) {
		
		orientationControl.listen(function() {

			// Get latest screen-adjusted deviceorientation data
			var screenAdjustedEvent = orientationControl.getScreenAdjustedEuler();

			// Convert true north heading to radians
			heading = screenAdjustedEvent.alpha * Math.PI / 180;

		});

	}).catch(function(message) {
		console.log(message);
    });


    $.ajax({
        type: 'GET',
        url: WAYPOINT_FILE_PATH,
        dataType: 'json',
    })
    .done(function(data, textStatus, jqXHR){
	    
        waypointsObj = data;
//         $("#status .stories").html(data["stories"].length);

		console.log( waypointsObj.stories );

        /* first user event click to start */
        $(".submit").click(function(){        
            play_sound("audio/hmcro/1_Welcome.mp3");
            if (navigator.geolocation) {
                geomap_init();
                $('#intro').remove();
            } else {
                show_error("Geolocation has been disabled. Please check Settings > Privacy > Location.");
            }

        });

        $("#intro .submit").prop('disabled', false);

        /* second user event click to refresh */
        $(document).on("click", "a.refresh", function(){
            location.reload();
        });

        /* skipping waypoints user interaction */
        $(document).on("click", "a.nextwaypoint", function(){
            geomap_next_waypoint();
        });

    })
    .fail(function(jqXHR, textStatus, errorThrown){
        show_error("The GPS waypoints and audio could not be loaded.<br>"+textStatus);
    });
});

/* GEOMAP SPECIFIC STUFF */

function geomap_init(){
	
    L.mapbox.accessToken = 'pk.eyJ1IjoibHVrZXN0dXJnZW9uIiwiYSI6ImNpazcwenlzYjAwenZpZm0yZGVtOXpzNGoifQ.qBHqidaLVWQtIEu09uhSkg';

    map = L.mapbox.map('map', 'lukesturgeon.pgbe95a4').setView([51.506245, -0.25065243], 16);
    
    /* create custom RotatedMarker code */
    L.RotatedMarker = L.Marker.extend({
		options: { angle: 0 },
		_setPos: function(pos) {
			L.Marker.prototype._setPos.call(this, pos);
			if (L.DomUtil.TRANSFORM) {
				// use the CSS transform rule if available
				this._icon.style[L.DomUtil.TRANSFORM] += ' rotate(' + this.options.angle + 'deg)';
			} else if (L.Browser.ie) {
				// fallback for IE6, IE7, IE8
				var rad = this.options.angle * L.LatLng.DEG_TO_RAD,
				costheta = Math.cos(rad),
				sintheta = Math.sin(rad);
				this._icon.style.filter += ' progid:DXImageTransform.Microsoft.Matrix(sizingMethod=\'auto expand\', M11=' +
		costheta + ', M12=' + (-sintheta) + ', M21=' + sintheta + ', M22=' + costheta + ')';
			}
		}
	});	
	L.rotatedMarker = function(pos, options) {
		return new L.RotatedMarker(pos, options);
	};

	/* create current position marker */
	current_user_position_latlng = L.latLng([51.506245, -0.25065243]);
    current_user_position_marker = L.rotatedMarker(current_user_position_latlng, {
	    icon: L.icon({
	    iconUrl: 'img/direction-marker.png',
	    iconSize: [128, 128],
	  }),
	}).addTo(map);	
	
	window.setInterval(function() {	    
	    current_user_position_marker.options.angle = -heading * (180 / Math.PI);
	    current_user_position_marker.setLatLng( current_user_position_latlng );
	}, 50);
    
    
    var yourMarker = L.icon({
		iconUrl: 'img/your-marker.png',
		iconRetinaUrl: 'img/your-marker.png',
		iconSize: [128, 128],
		iconAnchor: [64, 64]
	});
	
	var miscMarker = L.icon({
		iconUrl: 'img/misc-marker.png',
		iconRetinaUrl: 'img/misc-marker.png',
		iconSize: [128, 128],
		iconAnchor: [64, 64]
	});
    
     // create a red polyline from an arrays of LatLng points
	var polyline = L.polyline([], {
		color: '#f15a24',
		weight: 12,
		opacity: 1.0
		
	}).addTo(map);

    for (var i = 0; i < waypointsObj.waypoints.length; i++) 
    {
	    var ll = L.latLng([ waypointsObj.waypoints[i].latitude, waypointsObj.waypoints[i].longitude ]);
		polyline.addLatLng( ll );
    }
    
    /* populate the geojson with waypoints */
    var theMarker;
    for (var story in waypointsObj.stories) 
    {
	    /* change the alpha based on type of story */
	    switch (waypointsObj.stories[story].dir) {
		    
			case "adversity" :
				theMarker = yourMarker;
			    break;
			    
		    case "affluent" :			    
		    case "comfortable" :			    
		    case "prosperity" :			    
		    case "stretched" :			    
		    case "hmcro" :
		    default :
			    theMarker = miscMarker;
			    break;
	    }
	    
	    
	    var ll = L.latLng([ waypointsObj.stories[story].latitude, waypointsObj.stories[story].longitude ]);	    
		L.marker(ll, {
			icon: 		theMarker,
			clickable: 	false,
			keyboard: 	false,
			opacity:	1.0
		}).addTo(map);
    }
    
    /* setup the geolocation callbacks */
    wpid = navigator.geolocation.watchPosition( geomap_receive , geomap_error , {
        enableHighAccuracy: true, 
        maximumAge        : 30000, 
        timeout           : 27000
    });

    /* start a timer */
    start_time = waypoint_time = new Date().getTime();

    secid = setInterval(function(){
        timer_tick();
    }, 1000);

    /* show the status data */
    $("#status").show();
}


function geomap_receive(position){
    var longitude = position.coords.longitude;
    var latitude = position.coords.latitude;

    // map.panTo([longitude, latitude]);

/*
    location_point.coordinates[0] = longitude;
    location_point.coordinates[1] = latitude;
    location_source.setData(location_point);
*/
    
    current_user_position_latlng = L.latLng(latitude, longitude);

    // $("#status .latitude").html(latitude);
    // $("#status .longitude").html(longitude);

    /* calculate distance between here and target */
    var t_latitude = waypointsObj.waypoints[waypoint_index]["latitude"];
    var t_longitude = waypointsObj.waypoints[waypoint_index]["longitude"];
    var dist = Math.floor( geomap_distance(latitude, longitude, t_latitude, t_longitude) );

    /* check distance to target */
    if ( dist <= DISTANCE_THRESHOLD ) {
        geomap_next_waypoint();        
    }

    console.log(longitude, latitude);

    console.log("check stories...");

    /* check distance to stories */
    for (var s in waypointsObj.stories) {
        dist = geomap_distance(latitude, longitude, waypointsObj.stories[s].latitude, waypointsObj.stories[s].longitude);

        // console.log(s, dist);

        if ( dist <= DISTANCE_THRESHOLD ) {
            // play story
            play_sound( waypointsObj.stories[s].mp3 );

            // remove waypoints from array
            waypointsObj.stories.splice(s, 1);

            /* update the visual ui so we can see how many stories are left */
            $("#status .stories").html(waypointsObj.stories.length);
            break;
        }
    }
}


function geomap_next_waypoint() {
    if (waypoint_index+1 < waypointsObj.waypoints.length) 
    {
        /* update the list of points */
        play_sound( waypointsObj.waypoints[waypoint_index]["mp3"] );
        waypoint_index++;

        /* update the current waypoint marker position on the map */
        waypoint_t_point.coordinates[0] = waypointsObj.waypoints[waypoint_index]["longitude"];
        waypoint_t_point.coordinates[1] = waypointsObj.waypoints[waypoint_index]["latitude"];
        waypoint_t_source.setData(waypoint_t_point);

        waypoint_time = new Date().getTime();

        console.log("geomap_next_waypoint: " + waypoint_index);
    } 
    else 
    {
        play_sound( "audio/hmcro/21_Over.mp3" );
        finished = true;

        /* disable the map */
        navigator.geolocation.clearWatch( wpid );
        clearInterval( secid );
        map.remove();
        $("#status").remove();
        $("#map").remove();
        $("#end").show();
    }
}


function geomap_error(error) {

    if (error.code == 2) {
        //POSITION_UNAVAILABLE
        // show_error( "Your GPS position is unavailable.<br>Please check your Location settings." );
    } else {
        show_error( error.message );
    }
}


function geomap_distance(lat1, lon1, lat2, lon2) {
    var p = 0.017453292519943295;    // Math.PI / 180
    var c = Math.cos;
    var a = 0.5 - c((lat2 - lat1) * p)/2 + 
    c(lat1 * p) * c(lat2 * p) * 
    (1 - c((lon2 - lon1) * p))/2;
    var km = 12742 * Math.asin(Math.sqrt(a)); // 2 * R; R = 6371 km
    return km * 1000; // returm in meters
}


/* NON GEOMAP SPECIFIC STUFF */

function timer_tick() {
    var now = new Date().getTime();

    var date_diff = new Date( now - start_time );
    var diff_min = date_diff.getMinutes();
    var diff_sec = date_diff.getSeconds();
    /* format and display duration */
    if (diff_min < 10) diff_min = "0" + diff_min;
    if (diff_sec < 10) diff_sec = "0" + diff_sec;
    $("#status .time").html(diff_min + ":" + diff_sec );

    var waypoint_time_diff = new Date( now - waypoint_time );
    var waypoint_time_diff_min = waypoint_time_diff.getMinutes();
    var waypoint_time_diff_sec = waypoint_time_diff.getSeconds();

    if (waypoint_time_diff_min > 1 && waypoint_reminder_index != waypoint_index) {
        waypoint_reminder_index = waypoint_index;
        var mp3_file = "audio/hmcro/TimeKeeping_"+Math.floor(Math.random()*6.99)+".mp3";
        console.log ( mp3_file );

        play_sound( mp3_file );
    }
    /* format and display duration */
    // if (waypoint_time_diff_min < 10) waypoint_time_diff_min = "0" + waypoint_time_diff_min;
    // if (waypoint_time_diff_sec < 10) waypoint_time_diff_sec = "0" + waypoint_time_diff_sec;
    // $("#status .waypoint_time").html(waypoint_time_diff_min + ":" + waypoint_time_diff_sec );

    /* format and display current speed
    *  total distance = 2977.2m
    *  total distance / 45mins = 66m per minute
    */
    $("#status .speed").html( 66 * date_diff.getMinutes() + "m / 2977.2m" );
}

function show_error(message){
    /* need to add error to the page over everything */
    $("body").append('<div id="error"><h2>' + message + '</h2><a class="refresh">Refresh</a></div>');

    /* also stop the timers */
    navigator.geolocation.clearWatch( wpid );
    clearInterval( secid );
}

function play_sound(url){
	soundplayer.play_sound( url );
}