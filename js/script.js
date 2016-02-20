const DISTANCE_THRESHOLD = 20; // in meters

var start_time, waypoint_time;
var finished = false;
var wpid, secid;
var map;
var location_point, location_source;
var waypoint_t_point, waypoint_t_source;
var waypoint_index = 0;
var waypoint_reminder_index = -1;

var waypointsObj;


$(document).ready(function(){

    $.ajax({
        url: "http://hmcro.github.io/GPS-Walk/js/waypoints.json"
    })
    .done(function(data, textStatus, jqXHR){
        waypointsObj = data;
        $("#status .stories").html(waypointsObj.stories.length);
        console.log("json: " + textStatus);
    })
    .fail(function(jqXHR, textStatus, errorThrown){
        show_error("The GPS waypoints and audio could not be loaded.");
    });

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

    /* second user event click to refresh */
    $(document).on("click", "a.refresh", function(){
        location.reload();
    });

    /* skipping waypoints user interaction */
    $(document).on("click", "a.nextwaypoint", function(){
        geomap_next_waypoint();
    });
});

/* GEOMAP SPECIFIC STUFF */

function geomap_init(){
    mapboxgl.accessToken = "pk.eyJ1IjoibHVrZXN0dXJnZW9uIiwiYSI6ImNpazcwenlzYjAwenZpZm0yZGVtOXpzNGoifQ.qBHqidaLVWQtIEu09uhSkg";

    //mapbox://styles/lukesturgeon/cikfgefxf0019sjlxx6l8cl2j

    map = new mapboxgl.Map({
        container:'map', 
        style:'mapbox://styles/mapbox/basic-v8',
        zoom: 16,
        center: [waypointsObj.waypoints[0]["longitude"],waypointsObj.waypoints[0]["latitude"]],
        interactive: true
    });

    map.on('style.load', function(){
        /* create a geojson object to store the waypoints */
        var waypoints_geojson = {
            "type":"geojson",
            "data":{
                "type":"Feature",
                "properties":{},
                "geometry":{
                    "type":"LineString",
                    "coordinates":[]
                }
            }
        };

        /* populate the geojson with waypoints */
        for (var i = 0; i < waypointsObj.waypoints.length; i++) 
        {
            waypoints_geojson["data"]["geometry"]["coordinates"].push([
                waypointsObj.waypoints[i]["longitude"],
                waypointsObj.waypoints[i]["latitude"]
                ]);
        }

        map.addSource("waypoints", waypoints_geojson);
        map.addLayer({
            "id": "waypoints",
            "type": "line",
            "source": "waypoints",
            "layout": {
                "line-join": "round",
                "line-cap": "round"
            },
            "paint": {
                "line-color": "#f15a24",
                "line-width": 14
            }
        });

        /* create a current waypoint marker */
        waypoint_t_point = {
            "type": "Point",
            "coordinates": [waypointsObj.waypoints[waypoint_index]["longitude"], 
            waypointsObj.waypoints[waypoint_index]["latitude"]]
        };
        waypoint_t_source = new mapboxgl.GeoJSONSource({
            "data": waypoint_t_point
        });
        map.addSource('target', waypoint_t_source);
        map.addLayer({
            "id": "target",
            "type": "circle",
            "source": "target",
            "paint": {
                "circle-radius": 5,
                "circle-color": "#000000",
                "circle-opacity": 1
            }
        });

        /* create a current location cursor */
        location_point = {
            "type": "Point",
            "coordinates": [ 0, 0 ]
        };

        location_source = new mapboxgl.GeoJSONSource({
            "data": location_point
        });

        map.addSource('drone', location_source);

        map.addLayer({
            "id": "drone-outer",
            "type": "circle",
            "source": "drone",
            "paint": {
                "circle-radius": 15,
                "circle-color": "#f15a24",
                "circle-opacity": 1
            }
        });

        map.addLayer({
            "id": "drone-inner",
            "type": "circle",
            "source": "drone",
            "paint": {
                "circle-radius": 5,
                "circle-color": "#fff",
                "circle-opacity": 1
            }
        });

        /* create story markers */
        var story_geojson = {
            "type": "geojson",
            "data": {
                "type": "FeatureCollection",
                "features": [{
                    "type": "Feature",
                    "geometry": {
                        "type": "Point",
                        "coordinates": [-0.10176301, 51.533069]
                    }
                }, ]
            }
        }

        /* populate the geojson with waypoints */
        for (var story in waypointsObj.stories) 
        {
            story_geojson["data"]["features"].push({
                "type": "Feature",
                "geometry": {
                    "type": "Point",
                    "coordinates": [waypointsObj.stories[story].longitude, waypointsObj.stories[story].latitude]
                }
            });

            // console.log(waypointsObj.stories[story].longitude, waypointsObj.stories[story].latitude);
        }

        map.addSource("markers", story_geojson);
        map.addLayer({
            "id": "markers",
            "type": "circle",
            "source": "markers",
            "paint": {
                "circle-radius": 40,
                "circle-color": "#f15a24",
                "circle-opacity": 0.2
            }
        });

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
    });
}


function geomap_receive(position){
    var longitude = position.coords.longitude;
    var latitude = position.coords.latitude;

    // map.panTo([longitude, latitude]);

    location_point.coordinates[0] = longitude;
    location_point.coordinates[1] = latitude;
    location_source.setData(location_point);  

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
    if (waypoint_index+1 < waypoints.length) 
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
        play_sound( waypointsObj.waypoints[++waypoint_index]["mp3"] );
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
    var snd = new Audio(url);
    snd.play();
}