'use strict';

angular.module('cossap.catalogue', [])


.directive('cossapCatalogue', [function() {
	return {
		templateUrl : 'components/catalogue/catalogue.html',
		controller : 'cossapCatalogueController'
	};
}])


.controller('cossapCatalogueController', ['$scope', 'streamChartService', 'drawHelperService',
 function($scope, streamChartService, drawHelperService) {


	$scope.drawHelperService = drawHelperService;
	
	var layers = _viewer.scene.imageryLayers;
	var canvas = _viewer.canvas;
	var ellipsoid = _viewer.scene.globe.ellipsoid;


	var myWms;
	var myTiles;
	var myBoreholes;

	 var myDrawCallback = function(entity){
		 console.log("myDrawCallback");
		 console.log(entity);
	 };

	 $scope.initDrawTools = function(){
		 $scope.drawHelperService.init(_viewer);
	 };

	 $scope.callDrawMarker = function(){

		 var options = {
			 callback: myDrawCallback,
			 imgUrl: 'http://localhost:8080/bower_components/cesium-drawtools/img/dragIcon.png'
		 };
		 $scope.drawHelperService.drawMarker(options);
	 };

	 $scope.callDrawLine = function(){

		 var options = {
			 callback: myDrawCallback,
			 editable: true,
			 width: 5,
	         geodesic: true
		 };
		 $scope.drawHelperService.drawPolyline(options);
	};

	$scope.callDrawPoly = function(){

		var options = {
			callback: myDrawCallback,
			editable: true
		};
		$scope.drawHelperService.drawPolygon(options);
	};

	 $scope.callDrawExtent = function(){

		 var options = {
			 callback: myDrawCallback,
			 editable: true
		 };
		 $scope.drawHelperService.drawExtent(options);
	 };

	 $scope.callDrawCircle = function(){

		 var options = {
			 callback: myDrawCallback,
			 editable: true
		 };
		 $scope.drawHelperService.drawCircle(options);
	 };

	$scope.demoGraph = function(){

		streamChartService.initChart();
	};

	$scope.demoPoly = function(){

		var orangePolygon = _viewer.entities.add({
		    name : 'Orange polygon with per-position heights and outline',
		    polygon : {
		        hierarchy : Cesium.Cartesian3.fromDegreesArrayHeights([138.0, -25.0, 100000,
		                                                               130.0, -25.0, 100000,
		                                                               130.0, -20.0, 100000,
		                                                               138.0, -20.0, 300000]),
		        extrudedHeight: 0,
		        perPositionHeight : true,
		        material : Cesium.Color.ORANGE.withAlpha(0.5),
		        outline : true,
		        outlineColor : Cesium.Color.BLACK
		    }
		});

		_viewer.zoomTo(_viewer.entities);

	};

	$scope.addClickCanvas = function(){

		canvas.onclick = function() {
		    console.log("CLICK");
		};
	};

	$scope.clickHandlerLocation = function(){

		var handler = new Cesium.ScreenSpaceEventHandler(canvas);
		var mousePosition;

		handler.setInputAction(function(movement) {
		    
			console.log(movement);

		    mousePosition = Cesium.Cartesian3.clone(movement.position);

		    var cartographicPosition = Cesium.Ellipsoid.WGS84.cartesianToCartographic(mousePosition);

		    console.log("Cesium.Cartesian mousePosition "+mousePosition);
		    console.log("Cesium.Cartographic mousePosition "+cartographicPosition);

		}, Cesium.ScreenSpaceEventType.LEFT_CLICK);

	};
	
	$scope.rest = function(){

		console.log("ArcGis");

		var url = "http://www.ga.gov.au/gis/rest/services/topography/Australian_Topography_WM/MapServer";
		var layer = "0";

		if(myTiles){
			layers.remove(myTiles);
			console.log("removing layer..");
			myTiles = null;
			return;
		}

		myTiles = layers.addImageryProvider(new Cesium.ArcGisMapServerImageryProvider({
	        url : url,        
	        layers: layer,
	        rectangle: ausExtent, // only load imagery for australia
	    }));

	};

	$scope.wms = function(){

		console.log("wms");

		if(myWms){
			layers.remove(myWms);
			console.log("removing layer..");
			myWms = null;
			return;
		}

		var url = "https://programs.communications.gov.au/geoserver/ows";
		var layer = "mybroadband:MyBroadband_ADSL_Availability";

		myWms = layers.addImageryProvider(new Cesium.WebMapServiceImageryProvider({
	        url : url,        
	        layers: layer,
	        rectangle: ausExtent, // only load imagery for australia
	        parameters : {
                transparent : 'true',
                format : 'image/png'
            }
		}));

		myWms.alpha = 0.6;
	};

	$scope.boreholes = function(){

		console.log("boreholes");

		if(myBoreholes){
			layers.remove(myBoreholes);
			console.log("removing layer..");
			myBoreholes = null;
			return;
		}

		var url = "http://www.ga.gov.au/borehole-gsmlborehole-gws/ows";
		var layer = "gsmlp:BoreholeView";

		var wmsCallback = function(){
			console.log("CALLBACK.. only fires when no features returned...");
		};


		myBoreholes = layers.addImageryProvider(new Cesium.WebMapServiceImageryProvider({
	        url : url,        
	        layers: layer,
	        rectangle: ausExtent, // only load imagery for australia
	        parameters : {
                transparent : 'true',
                format : 'image/png'
            },
            enablePickFeatures: true, // enable GetFeatureInfo()

            getFeatureInfoFormats: [new Cesium.GetFeatureInfoFormat('json', 'application/json', wmsCallback)]
            

        }));

		myBoreholes.alpha = 1;
	};


}]);
