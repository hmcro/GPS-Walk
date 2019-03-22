/*global L, device, Media, console, alert */

// TODO: test on other Android device
// TODO: navbar on iphone overlaps
// TODO: gps log

var app = {

  // settings
  distanceThreshold: 20,
  waitTime: 3 * 60 * 1000,    // wait a few minutes before playing reminder sounds
  geoJsonRoute : 'https://raw.githubusercontent.com/hmcro/Maps/master/bcn-route.geojson',
  geoJsonGuidePoints: 'https://raw.githubusercontent.com/hmcro/Maps/master/bcn-points-cro.geojson',
  geoJsonPoints: [
    'https://raw.githubusercontent.com/hmcro/Maps/master/bcn-points-rp.geojson',
    'https://raw.githubusercontent.com/hmcro/Maps/master/bcn-points-cc.geojson'
  ],
  timekeepingFiles: [
    'TimeKeeping_0.mp3',
    'TimeKeeping_1.mp3',
    'TimeKeeping_2.mp3',
    'TimeKeeping_3.mp3',
    'TimeKeeping_4.mp3',
    'TimeKeeping_5.mp3',
    'TimeKeeping_6.mp3'
  ],

  // properties
  currentView: null,          // current view state, used for toggling pages
  prevView: null,             // last view state, used for toggling pages
  map: null,                  // map mapbox object
  pointsLayer: null,          // layer will all points, used to iterate and check distances
  croLayer: null,             // layer with all audio guide points, used to give directions
  isAudioPlaying: false,      // flag to queue or play a new audio file
  nextAudio: null,            // temporarily stores another audio file to play after current
  userMarker: null,           // reference to the map maker so it can be moved
  audioHistory: [],           // filled with mp3 filenames as they are played
  mediaPlayer: null,          // the reusable media playback object
  playbackTime: Date.now(),   // keep the time of last audio playback
  loopID: null,               // holds the ID for the main loop, so we can cancel later
  compassID: null,            // holds the ID for the compass timer

  initialize: function() {
    this.bindEvents();
  },

  // Bind Event Listeners
  bindEvents: function() {
    document.addEventListener('deviceready', this.onDeviceReady, false);
  },

  // this refers to the event, so create need to call function again from different scope
  onDeviceReady: function() {
    app._onDeviceReady();
  },

  // Update DOM on ready event
  _onDeviceReady: function() {

    console.log('init mapbox');

    console.log('init mapbox');

    // init map
    L.mapbox.accessToken = 'pk.eyJ1IjoibHVrZXN0dXJnZW9uIiwiYSI6ImNpazcwenlzYjAwenZpZm0yZGVtOXpzNGoifQ.qBHqidaLVWQtIEu09uhSkg';

    app.map = L.mapbox.map('map', 'mapbox.streets', {
      center: [51.506079, -0.250808],
      zoom: 15,
      minZoom: 14,
      maxZoom: 17,
      zoomControl: false,
      attributionControl: false
    })

    .on('ready',function(){
      // MIT-licensed code by Benjamin Becquet
      // https://github.com/bbecquet/Leaflet.PolylineDecorator
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

      // create a custom marker that can be rotated
      app.userMarker = L.rotatedMarker([0,0], {
        icon: L.divIcon({
          className: 'svg-marker',
          html: '<svg width="22px" height="39px" viewBox="155 319 22 39" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><g id="Group" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd" transform="translate(155.000000,319.000000)"><circle id="Oval-1" fill="#EA5E3E" cx="11" cy="29" r="10"></circle><polygon id="Triangle-1" fill-opacity="0.5" fill="#EA5E3E" points="0 0 22 0 11 38"></polygon></g></svg>',
          iconSize: [22, 39],
        })
      });
      app.userMarker.addTo(app.map);
    })

    .on('error', function(error){
      $('#info-log').append(JSON.stringify(error));
    })

    .on('locationfound', function(e){
      $('#info-gps').text(e.latlng.lat + ', ' + e.latlng.lng);

      // update the position of the userMarker
      if (app.userMarker !== null) {
        app.userMarker.setLatLng(e.latlng);
      }

      // check distance to narrative audio
      if (app.pointsLayer) {
        app.pointsLayer.eachLayer(function(layer){
          var d = e.latlng.distanceTo(layer.getLatLng());
          // check if distance is close enough to trigger audio
          if (d <= app.distanceThreshold) {
            var mp3Path = layer.feature.properties.mp3;
            if (app.audioHistory.indexOf(mp3Path) === -1) {
              layer.setStyle({
                fillColor: '#EA5E3E'
              });
              app.audioHistory.push(mp3Path);
              app.playAudio(mp3Path);
            }
          }
        });
      }

      // check distance to cro audio
      if (app.croLayer) {
        app.croLayer.eachLayer(function(layer){
          var d = e.latlng.distanceTo(layer.getLatLng());
          // check if distance is close enough to trigger audio
          if (d <= app.distanceThreshold) {
            var mp3Path = layer.feature.properties.mp3;
            if (app.audioHistory.indexOf(mp3Path) === -1) {
              app.audioHistory.push(mp3Path);
              app.playAudio(mp3Path);
            }
          }
        });
      }
    })

    .on('locationerror', function(error){
      $('#info-log').append(JSON.stringify(error));
    });

    // load the mp3 points from github
    var i = Math.floor( Math.random() * app.geoJsonPoints.length );

    // load points to map
    var pointsFile = app.geoJsonPoints[i];
    app.pointsLayer = L.mapbox.featureLayer(pointsFile, {
      pointToLayer: function(feature,latlng){
        return L.circleMarker(latlng, {
          color: '#EA5E3E',
          weight: 10,
          opacity: 1,
          fillColor: '#FFFFFF',
          fillOpacity: 1
        });
      }
    }).addTo(app.map);
    app.pointsLayer.on('ready',function(){
      app.pointsLayer.eachLayer(function(layer){
        layer.bindPopup(layer.feature.properties.mp3);
        layer.on('click',function(e){
          app.playAudio(e.target.feature.properties.mp3);
        });
      });
      app.map.fitBounds(app.pointsLayer.getBounds());
    });

    // load the route from github
    var routeLayer = L.mapbox.featureLayer();
    routeLayer.addTo(app.map);
    routeLayer.loadURL(app.geoJsonRoute);

    // load guide audio from github
    app.croLayer = L.mapbox.featureLayer(app.geoJsonGuidePoints);

    // bind interface buttons
    $('#info-buttons .open-button').click(function(){
      app.switchView('info-view');
    });

    $('#info-buttons .close-button').click(function(){
      app.switchView(app.prevView);
    });

    $('#intro-name').click(function(){
      $('#intro-submit').show();
    });

    // handle the intro form, it appears at the start and asks for a name
    $('#intro-form').submit(function(event){
      event.preventDefault();
      var n = $('#intro-name').val();
      if (n.length > 0) {
        console.log("name = " + n);
        $('#info-name').text(n);
        app.switchView('loading-view');

        // play the intro audio
        app.playAudio('cro_1_intro.mp3', function(){
          app.switchView('map-view');
        });

      } else {
        alert("Please enter a name");
      }
      console.log("done submit");
    });

    // handle the skip button, that appears when intro audio is playing
    $('#loading-form').submit(function(event){
      event.preventDefault();
      console.log('skip to map');
      app.mediaPlayer.stop();
      app.isAudioPlaying = false;
      app.switchView('map-view');
      console.log('done skip');
    });

    console.log('init loop');

    // start the loop timer
    app.loopID = setInterval(app.loop, 1000);

    // setup intro screen
    $('#info-deviceplatform').text(device.platform);
    app.switchView('intro-view');
    $('#info-log').append('Device Ready');
  },

  loop: function(){
    var n = Date.now();
    if (n - app.playbackTime > app.waitTime) {
      var i = Math.floor( Math.random() * app.timekeepingFiles.length );
      console.log('rand = ' + i);
      app.playAudio(app.timekeepingFiles[i]);
    }
  },

  // transition between views
  switchView: function(id) {

    // disable and hide view
    if (app.currentView !== null) {
      app.prevView = app.currentView;
      $('#'+app.currentView).hide();
    }

    // activate new view
    app.currentView = id;
    $('#'+app.currentView).show();

    // custom view bits
    if ( app.currentView === 'info-view') {
      $('#info-buttons .open-button').hide();
      $('#info-buttons .close-button').show();
    } else {
      $('#info-buttons .open-button').show();
      $('#info-buttons .close-button').hide();
    }

    if (app.currentView === 'map-view') {
      // start the compass
      app.compassID = navigator.compass.watchHeading(function(heading){
        if (app.userMarker) {
            // set the angle on the marker
          app.userMarker.options.angle = heading.trueHeading;
          app.userMarker.update();
        }
      }, function(error){
        console.log('compass: ' + error);
      }, {frequency: 100});

      // start the map
      app.map.locate({
        watch: true,
        enableHighAccuracy: true
      });

      // show the map
      $('#map').show();

      // invalidate the size to force it to recalculate size
      app.map.invalidateSize();

    } else {
      // stop the compass
      navigator.compass.clearWatch(app.compassID);

      // stop the map
      app.map.stopLocate();

      // hide the map
      $('#map').hide();
    }

    console.log('> switch to new view: ' + id);
  },

  // play audio using the cordova media plugin
  playAudio: function(mp3, callback) {
    console.log("PLAYAUDIO");
    if (app.isAudioPlaying) {
      // queue up this new file
      app.nextAudio = mp3;
      console.log('still playing: queue up the audio');
    } else {
      // start playing the file immediately
      var path = window.location.pathname;
      path = path.substr( path, path.length - 10 );
      path = path + 'audio/' + mp3;

      // add platform specific file prefix
      // Depending on the device, a few examples are:
      // - 'Android'
      // - 'BlackBerry'
      // - 'iOS'
      // - 'webOS'
      // - 'WinCE'
      // - 'Tizen'
      if (device.platform === 'Android') {
        path = 'file://' + path;
      }

      // release any previous audio
      if (app.mediaPlayer !== null) {
        app.mediaPlayer.release();
      }

      // create the new media playback instance
      console.log('playAudio: ' + path );
      app.mediaPlayer = new Media(path, function(){
        app.isAudioPlaying = false;
        console.log('audio finished');

        // play a queued audio file and remove from queue
        if (app.nextAudio !== null) {
          var q = app.nextAudio;
          app.nextAudio = null;
          app.playAudio(q);
        } else {
          // there's nothing left to do, except check for callbacks
          if (callback !== undefined) {
            callback.call(null);
          }
        }
      }, function(err){
        console.log('err: ' + JSON.stringify(err));
      });

      // start playing the audio file
      app.mediaPlayer.play();

      // store the time
      app.playbackTime = Date.now();

      // set playing flag
      app.isAudioPlaying = true;

      // update the ui
      var t = app.pointsLayer.getLayers().length + app.croLayer.getLayers().length;
      $('#info-audio').text(app.audioHistory.length + ' / ' + t);
    }
  }
};
