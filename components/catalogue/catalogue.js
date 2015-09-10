'use strict';

angular.module('cossap.catalogue', [])


.directive('cossapCatalogue', [function() {
	return {
		templateUrl : 'components/catalogue/catalogue.html',
		controller : 'cossapCatalogueController'
	};
}])


.controller('cossapCatalogueController', ['$scope', 'streamChartService', 'drawHelperService', 'pickService', 'miniMapService',
 function($scope, streamChartService, drawHelperService, pickService, miniMapService) {


	$scope.drawHelperService = drawHelperService;
	

	var layers = _viewer.scene.imageryLayers;
	//var canvas = _viewer.canvas;


	var handler;


	var myWms;
    var myProxyLayer;
	var myTiles;
	var myBoreholes;


	 $scope.drawHelperService.init(_viewer);
	 $scope.pickService = pickService;

	 var myDrawCallback = function(entity){
		 console.log("myDrawCallback");
		 console.log(entity);
	 };

	 $scope.initDrawTools = function(){
		 $scope.drawHelperService.active = true;
	 };

	 $scope.callDrawMarker = function(){

		 var options = {
			 callback: myDrawCallback,
			 imgUrl: 'bower_components/cesium-ng-drawhelper/img/dragIcon.png'
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

	 $scope.destroyCursorHandler = function(){
		 if(handler){
			 handler.destroy();
			 handler = null;
		 }
	}

	$scope.addCursorHandler = function(){

		var ellipsoid = _viewer.scene.globe.ellipsoid;
		var entity = _viewer.entities.add({
			label : {
				show : false
			}
		});

		// Mouse over the globe to see the cartographic position
		handler = new Cesium.ScreenSpaceEventHandler(_viewer.scene.canvas);
		handler.setInputAction(function(movement) {

			console.log(movement);

			var cartesian = _viewer.camera.pickEllipsoid(movement.endPosition, ellipsoid);
			if (cartesian) {
				var cartographic = ellipsoid.cartesianToCartographic(cartesian);
				var longitudeString = Cesium.Math.toDegrees(cartographic.longitude).toFixed(2);
				var latitudeString = Cesium.Math.toDegrees(cartographic.latitude).toFixed(2);

				entity.position = cartesian;
				entity.label.show = true;
				entity.label.text = '(' + longitudeString + ', ' + latitudeString + ')';
			} else {
				entity.label.show = false;
			}
		}, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

	};

	 $scope.addPickListener = function(){

		 pickService.addPickListener();

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
            },
			enablePickFeatures: true // enables built-in GetFeatureInfo()
		}));

		myWms.alpha = 0.6;

		console.log(_viewer.scene.imageryLayers);

	};

	$scope.wmsProxy = function(){

		console.log("text proxy");

		if(myProxyLayer){
			layers.remove(myProxyLayer);
			console.log("removing layer..");
			myProxyLayer = null;
			return;
		}

		var url = "http://localhost:9090/geoserver/cossap/wms?service=WMS";
		var layer = "cossap:Acreage_AcreageReleaseAreas_2014";

		myProxyLayer = layers.addImageryProvider(new Cesium.WebMapServiceImageryProvider({
			url : url,
			layers: layer,
			rectangle: ausExtent, // only load imagery for australia
			parameters : {
				transparent : 'true',
				format : 'image/png',
				//proxy: new Cesium.DefaultProxy('/proxy/')
				proxy : {
					getURL : function(url) {
						// can tack on additional params, tokens etc this way if we need to..
						return '/proxy/url?url=' + encodeURIComponent(url);
					}
				}
			},
			enablePickFeatures: true // enables built-in GetFeatureInfo()
		}));

		myProxyLayer.alpha = 0.6;

		console.log(_viewer.scene.imageryLayers);

	}

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

	 $scope.demoMiniMap = function(){

		 miniMapService.init(_viewer);

	 };



}]);
