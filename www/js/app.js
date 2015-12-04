// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
angular.module('starter', ['ionic', 'ngCordova'])
.constant('ApiEndpoint', {
  url: 'http://52.34.224.16/api/markers.php' //http://localhost:8100/api'
})
.run(function($ionicPlatform, GoogleMaps) {
  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if(window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
    }
    if(window.StatusBar) {
      StatusBar.styleDefault();
    }

    GoogleMaps.init('AIzaSyAZRZH4lwmdmoEtHjvRjy3z4LQqxTFmoWY');
  });
})
.config(function($stateProvider, $urlRouterProvider) {
 
  $stateProvider
  .state('map', {
    url: '/',
    templateUrl: 'templates/map.html',
    controller: 'MapCtrl'
  });
 
  $urlRouterProvider.otherwise("/");
 
})
.controller('MapCtrl', function($scope, $state, $cordovaGeolocation) { 

})

.factory('Markers', function($http, ApiEndpoint) {
 console.log('ApiEndpoint', ApiEndpoint)
  var markers = []; 
 
  return {
    getMarkers: function(){      
      
      return $http.get(ApiEndpoint.url).then(function(response){
          markers = response;
          return markers;
      });
 
    },
    getMarker: function(id){
 
    }
  }
})

.factory('GoogleMaps', function($cordovaGeolocation, $ionicLoading, Markers, ConnectivityMonitor){
 
  var apiKey = false;
  var map = null;
 
  function initMap(){
 
    var options = {timeout: 10000, enableHighAccuracy: true};
 
    $cordovaGeolocation.getCurrentPosition(options).then(function(position){
 
      var latLng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
 
      var mapOptions = {
        center: latLng,
        zoom: 13,
        mapTypeId: google.maps.MapTypeId.ROADMAP
      };
 
      map = new google.maps.Map(document.getElementById("map"), mapOptions);
 
      //Wait until the map is loaded
      google.maps.event.addListenerOnce(map, 'idle', function(){
 
        //Load the markers
        loadMarkers();
        enableMap();       
      
      });
 
    }, function(error){
      console.log("Could not get location");
 
        //Load the markers
        loadMarkers();
    });
 
  }
 
 function enableMap(){
    $ionicLoading.hide();
  }
 
  function disableMap(){
    $ionicLoading.show({
      template: 'You must be connected to the Internet to view this map.'
    });
  }

  function loadGoogleMaps(){
 
    $ionicLoading.show({
      template: 'Loading Google Maps'
    });
 
    //This function will be called once the SDK has been loaded
    window.mapInit = function(){
      initMap();
    };  
 
    //Create a script element to insert into the page
    var script = document.createElement("script");
    script.type = "text/javascript";
    script.id = "googleMaps";
 
    //Note the callback function in the URL is the one we created above
    if(apiKey){
      script.src = 'http://maps.google.com/maps/api/js?key=' + apiKey + '&sensor=true&callback=mapInit';
    }
    else {
        script.src = 'http://maps.google.com/maps/api/js?sensor=true&callback=mapInit';
    }
 
    document.body.appendChild(script);
 
  }
 
  function checkLoaded(){
    if(typeof google == "undefined" || typeof google.maps == "undefined"){
      loadGoogleMaps();
    } else {
      enableMap();
    }       
  }

  function loadMarkers(){
 
      //Get all of the markers from our Markers factory
      Markers.getMarkers().then(function(markers){
 
        console.log("Markers: ", markers);
 
        var records = markers.data.result;
 
        for (var i = 0; i < records.length; i++) {
 
          var record = records[i];   
          var markerPos = new google.maps.LatLng(record.lat, record.lng);
 
          // Add the markerto the map
          var marker = new google.maps.Marker({
              map: map,
              animation: google.maps.Animation.DROP,
              position: markerPos
          });
 
          var infoWindowContent = "<h4>" + record.name + "</h4>";          
 
          addInfoWindow(marker, infoWindowContent, record);
 
        }
 
       })
 
  }
 
  function addInfoWindow(marker, message, record) {
 
      var infoWindow = new google.maps.InfoWindow({
          content: message
      });
 
      google.maps.event.addListener(marker, 'click', function () {
          infoWindow.open(map, marker);
      });
 
  }
 
 function addConnectivityListeners(){
 
    if(ionic.Platform.isWebView()){
 
      // Check if the map is already loaded when the user comes online, 
//if not, load it
      $rootScope.$on('$cordovaNetwork:online', function(event, networkState){
        checkLoaded();
      });
 
      // Disable the map when the user goes offline
      $rootScope.$on('$cordovaNetwork:offline', function(event, networkState){
        disableMap();
      });
 
    }
    else {
 
      //Same as above but for when we are not running on a device
      window.addEventListener("online", function(e) {
        checkLoaded();
      }, false);    
 
      window.addEventListener("offline", function(e) {
        disableMap();
      }, false);  
    }
 
  }

  return {
    init: function(key){
      if(typeof key != "undefined"){
        apiKey = key;
      }
 
      if(typeof google == "undefined" || typeof google.maps == "undefined"){
 
        console.warn("Google Maps SDK needs to be loaded");
 
        disableMap();
 
        if(ConnectivityMonitor.isOnline()){
          loadGoogleMaps();
        }
      }
      else {
        if(ConnectivityMonitor.isOnline()){
          initMap();
          enableMap();
        } else {
          disableMap();
        }
      }
 
      addConnectivityListeners();
 
    
    }
  }
 
})
.factory('ConnectivityMonitor', function($rootScope, $cordovaNetwork){
 
  return {
    isOnline: function(){
 
      if(ionic.Platform.isWebView()){
        return $cordovaNetwork.isOnline();    
      } else {
        return navigator.onLine;
      }
 
    },
    ifOffline: function(){
 
      if(ionic.Platform.isWebView()){
        return !$cordovaNetwork.isOnline();    
      } else {
        return !navigator.onLine;
      }
 
    }
  }
})
;