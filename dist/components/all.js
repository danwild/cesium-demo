'use strict';

angular.module('cossap.catalogue', [])


.directive('cossapCatalogue', [function() {
	return {
		templateUrl : 'components/catalogue/catalogue.html',
		controller : 'cossapCatalogueController'
	};
}])


.controller('cossapCatalogueController', ['$scope', 'streamChartService',
 function($scope, streamChartService) {

	
	var layers = _viewer.scene.imageryLayers;
	var canvas = _viewer.canvas;
	var ellipsoid = _viewer.scene.globe.ellipsoid;

	var myWms;
	var myTiles;
	var myBoreholes;


	$scope.demoGraph = function(){

		streamChartService.initChart();
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

'use strict';

angular.module('cossap.charts', [])


.directive('cossapChartPanel', [function() {
	return {
		templateUrl : 'components/charts/charts.html',
		controller : 'cossapChartController'
	};
}])


.controller('cossapChartController', ['$scope', 'cossapChartState', 
	function($scope, cossapChartState) {

	
	$scope.cossapChartState = cossapChartState;

}])

.factory('cossapChartState', [function() {

	var state = {};

	state.chartPanel = true;
	state.streamChart = false;

	return state;

}]);

'use strict';

angular.module('cossap.charts.stream', [])


.directive('chartStream', [function() {
	return {
		templateUrl : 'components/charts/stream-chart.html',
		controller : 'streamChartController'
	};
}])


.controller('streamChartController', ['$scope', 'cossapChartState', 'streamChartService', 
	function($scope, cossapChartState, streamChartService) {

	
	$scope.cossapChartState = cossapChartState;


}])



.factory('streamChartService', ['$rootScope', 'cossapChartState', function($rootScope, cossapChartState) {

	var service = {};


	service.initChart = function(){

		console.log("initChart..");

		cossapChartState.chartPanel = true;

		// safe apply
        if(!$rootScope.$$phase) {
        	$rootScope.$apply();
        }
	};


	
	return service;

}]);
'use strict';

/**

	Just an ng html wrap so we can hook into the layout for different app states

*/
angular.module('cossap.cesiumpanel', [])


.controller('CesiumPanelController', ['$scope', 'cossapChartState',
	function($scope, cossapChartState) {

		$scope.cossapChartState = cossapChartState;

}]);
