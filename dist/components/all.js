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

			//console.log(movement);

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

		 var url = "http://services.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer";
		 var layer = "0";
		 var imageryProvider = new Cesium.ArcGisMapServerImageryProvider({
			 url : url,
			 layers: layer,
			 rectangle: ausExtent
		 });

		 miniMapService.init(_viewer, imageryProvider);

	 };



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

'use strict';

angular.module('cossap.charts.stream', [])


.directive('chartStream', [function() {
	return {
		templateUrl : 'components/charts/chart-stream.html',
		controller : 'streamChartController'
	};
}])

.controller('streamChartController', ['$scope', 'cossapChartState', function($scope, cossapChartState) {

	$scope.cossapChartState = cossapChartState;

}])



.factory('streamChartService', ['$rootScope', 'cossapChartState', function($rootScope, cossapChartState) {

	var service = {};

	service.initChart = function(){

		console.log("initChart..");



		if(cossapChartState.chartPanel){
			cossapChartState.chartPanel = false;
			$("#streamChartD3").html("");
			return;
		}

        cossapChartState.chartPanel = true;

        /*---------------------------------------- D3 -----------------------------------------*/

  		// #8dd3c7
		// #ffffb3
		// #bebada
		// #fb8072
		// #80b1d3
		// #fdb462
		// #b3de69
		// #fccde5
		// #d9d9d9

        var margin = {top: 0, right: 100, bottom: 30, left: 100},
          width  = 1000,
          height = 320  - margin.top  - margin.bottom;

	      var x = d3.scale.ordinal()
	          .rangeRoundBands([0, width], .1);

	      var y = d3.scale.linear()
	          .rangeRound([height, 0]);

	      var xAxis = d3.svg.axis()
	          .scale(x)
	          .orient("bottom");

	      var yAxis = d3.svg.axis()
	          .scale(y)
	          .orient("left");

	      var stack = d3.layout.stack()
	          .offset("wiggle")
	          .values(function (d) { return d.values; })
	          .x(function (d) { return x(d.label) + x.rangeBand() / 2; })
	          .y(function (d) { return d.value; });

	      var area = d3.svg.area()
	          .interpolate("cardinal")
	          .x(function (d) { return x(d.label) + x.rangeBand() / 2; })
	          .y0(function (d) { return y(d.y0); })
	          .y1(function (d) { return y(d.y0 + d.y); });

	      var color = d3.scale.ordinal()
	          .range([
	          	'#8dd3c7',
				'#ffffb3',
				'#bebada',
				'#fb8072',
				'#80b1d3'
			]);

	      var svg = d3.select("#streamChartD3").append("svg")
	          .attr("width",  width  + margin.left + margin.right)
	          .attr("height", height + margin.top  + margin.bottom)
	        .append("g")
	          .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

	      d3.csv("components/charts/demo.csv", function (error, data) {

	      	console.log(data);

	        var labelVar = 'quarter';
	        var varNames = d3.keys(data[0])
	            .filter(function (key) { return key !== labelVar;});
	        color.domain(varNames);

	        var seriesArr = [], series = {};
	        varNames.forEach(function (name) {
	          series[name] = {name: name, values:[]};
	          seriesArr.push(series[name]);
	        });

	        data.forEach(function (d) {
	          varNames.map(function (name) {
	            series[name].values.push({name: name, label: d[labelVar], value: +d[name]});
	          });
	        });

	        x.domain(data.map(function (d) { return d.quarter; }));

	        stack(seriesArr);

	        y.domain([0, d3.max(seriesArr, function (c) { 
	            return d3.max(c.values, function (d) { return d.y0 + d.y; });
	          })]);

	        svg.append("g")
	            .attr("class", "x axis")
	            .attr("transform", "translate(0," + height + ")")
	            .call(xAxis);

	        svg.append("g")
	            .attr("class", "y axis")
	            .call(yAxis)
	          .append("text")
	            .attr("transform", "rotate(-90)")
	            .attr("y", 6)
	            .attr("dy", ".71em")
	            .style("text-anchor", "end")
	            .style("fill", "#FFF")
	            .text("Number of Rounds");

	        var selection = svg.selectAll(".series")
	          .data(seriesArr)
	          .enter().append("g")
	            .attr("class", "series");

	        selection.append("path")
	          .attr("class", "streamPath")
	          .attr("d", function (d) { return area(d.values); })
	          .style("fill", function (d) { return color(d.name); })
	          .style("stroke", "grey");

	        var points = svg.selectAll(".seriesPoints")
	          .data(seriesArr)
	          .enter().append("g")
	            .attr("class", "seriesPoints");

	        points.selectAll(".point")
	          .data(function (d) { return d.values; })
	          .enter().append("circle")
	           .attr("class", "point")
	           .attr("cx", function (d) { return x(d.label) + x.rangeBand() / 2; })
	           .attr("cy", function (d) { return y(d.y0 + d.y); })
	           .attr("r", "10px")
	           .style("fill",function (d) { return color(d.name); })
	           .on("mouseover", function (d) { showPopover.call(this, d); })
	           .on("mouseout",  function (d) { removePopovers(); })

	        var legend = svg.selectAll(".legend")
	            .data(varNames.slice().reverse())
	          .enter().append("g")
	            .attr("class", "legend")
	            .attr("transform", function (d, i) { return "translate(55," + i * 20 + ")"; });

	        legend.append("rect")
	            .attr("x", width - 10)
	            .attr("width", 10)
	            .attr("height", 10)
	            .style("fill", color)
	            .style("stroke", "grey");

	        legend.append("text")
	            .attr("x", width - 12)
	            .attr("y", 6)
	            .attr("dy", ".35em")
	            .style("text-anchor", "end")
	            .style("fill", "#FFF")
	            .text(function (d) { return d; });

	        function removePopovers () {
	          $('.popover').each(function() {
	            $(this).remove();
	          }); 
	        }

	        function showPopover (d) {
	          $(this).popover({
	            title: d.name,
	            placement: 'auto top',
	            container: 'body',
	            trigger: 'manual',
	            html : true,
	            content: function() { 
	              return "Quarter: " + d.label + 
	                     "<br/>Rounds: " + d3.format(",")(d.value ? d.value: d.y1 - d.y0); }
	          });
	          $(this).popover('show')
	        }

	      });


        /*---------------------------------------- /D3 -----------------------------------------*/

        
        // safe apply
        if(!$rootScope.$$phase) {
        	$rootScope.$apply();
        };
	};


	
	return service;

}]);
'use strict';

angular.module('cossap.charts', [])


.directive('cossapChartPanel', [function() {
	return {
		templateUrl : 'components/charts/charts.html',
		controller : 'cossapChartController'
	};e
}])


.controller('cossapChartController', ['$scope', 'cossapChartState', 
	function($scope, cossapChartState) {

	
	$scope.cossapChartState = cossapChartState;

}])

.factory('cossapChartState', [function() {

	var state = {};

	state.chartPanel = false;
	state.streamChart = false;

	return state;

}]);

/**
 * Created by danielwild on 26/08/2015.
 */

'use strict';

angular.module('cesium.drawhelper', [])

/**
 * A collection of helper functions for drawing shapes etc.
 *
 * Point Marker
 * PolyLine
 * Polygon
 * Extent
 * Circle
 *
 */
.factory('drawHelperService', [function() {

	var service = {};

	service.active = false;
	service.drawHelper;
	service.scene;
	service.loggingMessage;

	// reuse our shape material
	var material = Cesium.Material.fromType(Cesium.Material.ColorType);
	material.uniforms.color = new Cesium.Color(0, 0, 153, 0.4);

	// create a collection to hold out primitives;
	// keep the markers in withing their own nested billboard collection
	var primitivesCollection = new Cesium.PrimitiveCollection();
	var billboardCollection = new Cesium.BillboardCollection();

		/**
		 *
 		 * @param cesiumWidget Object
		 *
		 * Should work with Cesium.Viewer or Cesium.Widget
		 *
		 */
	service.init = function(cesiumWidget) {

		// create the scene with a master PrimitivesCollection to hold our shapes
		service.scene = cesiumWidget.scene;
		primitivesCollection.add(billboardCollection);
		service.scene.primitives.add(primitivesCollection);

		// start the draw helper to enable shape creation and editing
		service.drawHelper = new DrawHelper(cesiumWidget);

		// init logging
		var logging = document.getElementById('logging');
		service.loggingMessage = function (message) {
			logging.innerHTML = message;
		}
	};

	/**
	 *
	 * Wrapper for DrawHelper.startDrawingMarker
	 *
	 * @param options {
	 *      callback: Function, // returns the created primitive
	 *      imgUrl: String
	 * }
	 *
	 *
	 */
	service.drawMarker = function(options){

		service.active = true;

		service.drawHelper.startDrawingMarker({

			callback: function(position) {

				service.loggingMessage('Marker created at ' + position.toString());

				var billboard = billboardCollection.add({
					show : true,
					position : position,
					pixelOffset : new Cesium.Cartesian2(0, 0),
					eyeOffset : new Cesium.Cartesian3(0.0, 0.0, 0.0),
					horizontalOrigin : Cesium.HorizontalOrigin.CENTER,
					verticalOrigin : Cesium.VerticalOrigin.CENTER,
					scale : 1.0,
					image: options.imgUrl,
					color : new Cesium.Color(1.0, 1.0, 1.0, 1.0)
				});
				billboard.setEditable();

				options.hasOwnProperty('callback') ? options.callback(billboard) : console.log(billboard);
			}
		});
	};

	/**
	 *
	 * Wrapper for DrawHelper.startDrawingPolyline
	 *
     * @param options {
	 *      callback: Function, // returns the created primitive
	 *      editable: Boolean,
	 *      width: Number,
	 *      geodesic: Boolean
	 * }
	 *
	 */
	service.drawPolyline = function(options){

		service.active = true;

		service.drawHelper.startDrawingPolyline({

			callback: function(positions) {

				service.loggingMessage('Polyline created with ' + positions.length + ' points');
				var polyline = new DrawHelper.PolylinePrimitive({
					positions: positions,
					width: options.width || 5,
					geodesic: options.hasOwnProperty("geodesic") ? options.geodesic : true
				});
				primitivesCollection.add(polyline);

				if(options.hasOwnProperty("editable") && options.editable){

					polyline.setEditable();
					polyline.addListener('onEdited', function(event) {
						service.loggingMessage('Polyline edited, ' + event.positions.length + ' points');
					});
				}

				options.hasOwnProperty('callback') ? options.callback(polyline) : console.log(polyline);
			}
		});
	};

	/**
	 *
	 * Wrapper for DrawHelper.startDrawingPolygon
	 *
	 * @param options {
	 *      callback: Function, // returns the created primitive
	 *       editable: Boolean
	 * }
	 *
	 */
	service.drawPolygon = function(options){

		service.active = true;

		service.drawHelper.startDrawingPolygon({

			callback: function(positions) {

				service.loggingMessage('Polygon created with ' + positions.length + ' points');

				var polygon = new DrawHelper.PolygonPrimitive({
					positions: positions,
					material : material
				});

				primitivesCollection.add(polygon);

				if(options.hasOwnProperty("editable") && options.editable) {

					polygon.setEditable();
					polygon.addListener('onEdited', function (event) {
						console.log(event);
						service.loggingMessage('Polygon edited, ' + event.positions.length + ' points');
					});
				}

				options.hasOwnProperty('callback') ? options.callback(polygon) : console.log(polygon);
			}
		});
	};

	/**
	 *
	 * Wrapper for DrawHelper.startDrawingPolygon
	 *
	 * @param options {
	 *      callback: Function, // returns the created primitive
	 *      editable: Boolean
	 * }
	 *
	 */
	service.drawExtent = function(options){

		service.active = true;

		service.drawHelper.startDrawingExtent({

			callback: function(extent) {

				service.loggingMessage('Extent created (N: ' + extent.north.toFixed(3) + ', E: ' + extent.east.toFixed(3) + ', S: ' + extent.south.toFixed(3) + ', W: ' + extent.west.toFixed(3) + ')');

				var extentPrimitive = new DrawHelper.ExtentPrimitive({
					extent: extent,
					material: material
				});

				primitivesCollection.add(extentPrimitive);

				if(options.hasOwnProperty("editable") && options.editable) {

					extentPrimitive.setEditable();
					extentPrimitive.addListener('onEdited', function (event) {
						service.loggingMessage('Extent edited: extent is (N: ' + event.extent.north.toFixed(3) + ', E: ' + event.extent.east.toFixed(3) + ', S: ' + event.extent.south.toFixed(3) + ', W: ' + event.extent.west.toFixed(3) + ')');
					});
				};

				options.hasOwnProperty('callback') ? options.callback(extentPrimitive) : console.log(extentPrimitive);
			}
		});
	};

	/**
	 *
	 * Wrapper for DrawHelper.startDrawingCircle
	 *
	 * @param options {
	 *      callback: Function, // returns the created primitive
	 *      editable: Boolean
	 * }
	 *
	 */
	service.drawCircle = function(options){

		service.active = true;

		service.drawHelper.startDrawingCircle({

			callback: function(center, radius) {

				service.loggingMessage('Circle created: center is ' + center.toString() + ' and radius is ' + radius.toFixed(1) + ' meters');
				var circle = new DrawHelper.CirclePrimitive({
					center: center,
					radius: radius,
					material: material
				});

				primitivesCollection.add(circle);

				if(options.hasOwnProperty("editable") && options.editable) {

					circle.setEditable();
					circle.addListener('onEdited', function (event) {
						service.loggingMessage('Circle edited: radius is ' + event.radius.toFixed(1) + ' meters');
					});
				};

				options.hasOwnProperty('callback') ? options.callback(circle) : console.log(circle);
			}
		});
	};

	service.removeAllPrimitives = function(){

		primitivesCollection.removeAll();

		// reset collections
		primitivesCollection = new Cesium.PrimitiveCollection();
		billboardCollection = new Cesium.BillboardCollection();
		primitivesCollection.add(billboardCollection);
		service.scene.primitives.add(primitivesCollection);
	};

	/**
	 * @param cartographic
	 * @param precision
	 * @returns {string}
	 */
	service.getDisplayLatLngString = function(cartographic, precision) {
		return Cesium.Math.toDegrees(cartographic.longitude).toFixed(2) + ", " + Cesium.Math.toDegrees(cartographic.latitude).toFixed(2);
	};


	return service;

}])
/**
 * Created by danielwild on 10/09/2015.
 */

'use strict';

angular.module('cesium.minimap', [])

/**
 *
 * TODO: ng refactor
 *
 * An ng service wrapper to add 2d mini map to your cesium viewer
 *
 */
.factory('miniMapService', [function() {


		var service = {};

		service.parentViewer;
		service.parentCamera;

		service.expanded = true;
		service.miniViewer;
		service.container;
		service.toggleButton;
		service.logging;
		service.bounds;

		service.options = {
			animation: false,
			baseLayerPicker: false,
			fullscreenButton: false,
			geocoder: false,
			homeButton: false,
			infoBox: false,
			sceneModePicker: false,
			selectionIndicator: false,
			timeline: false,
			navigationHelpButton: false,
			navigationInstructionsInitiallyVisible: false,
			orderIndependentTranslucency: false,
			sceneMode: Cesium.SceneMode.SCENE2D,
			mapProjection: new Cesium.WebMercatorProjection()
		};

		/**
		 *
		 * @param parentViewer the 3d parent globe viewer
		 * @param imageryProvider the imageryProvider to be used on the minimap
		 *
		 */
		service.init = function(parentViewer, imageryProvider){

			service.parentViewer = parentViewer;
			service.parentCamera = service.parentViewer.scene.camera;

			// create container div -> directive...?
			var div = document.createElement('div');
			div.className = 'minimap-container';
			service.logging = document.createElement('div');
			service.logging.innerHTML = "Using National Scale"
			service.logging.className = 'minimap-logging';
			div.appendChild(service.logging);

			service.container = getContainer();
			service.container.appendChild(div);
			service.toggleButton = createToggleButton();
			service.container.appendChild(service.toggleButton);
			setupMap(div);
			setupListeners();

			service.miniViewer.scene.imageryLayers.addImageryProvider(imageryProvider);
			service.miniViewer.camera.viewRectangle(ausExtent);
		};

		/**
		 *
		 * TODO hide/show national scale display
		 *
		 */
		service.toggle = function() {
			service.expanded = !service.expanded;

			if (service.expanded) {
				service.container.style.width = '200px';
				service.container.style.height = '200px';
				service.toggleButton.className = service.toggleButton.className.replace(
					' minimized',
					''
				);
			} else {
				//close
				service.container.style.width = '19px';
				service.container.style.height = '19px';
				service.toggleButton.className += ' minimized';
			}
		};


		// gets the miniMap container div
		function getContainer() {
			var parentDiv = document.createElement('div');
			parentDiv.className = 'cesium-minimap';
			service.parentViewer.bottomContainer.appendChild(parentDiv);
			return parentDiv;
		}

		function addLayer(layer) {
			service.miniViewer.imageryLayers.addImageryProvider(layer.imageryProvider);
		}

		function setupMap(div) {

			service.options.creditContainer = document.createElement('div');

			var viewer = new Cesium.Viewer(div, service.options);
			viewer.scene.imageryLayers.removeAll();

			var scene = viewer.scene;
			scene.screenSpaceCameraController.enableRotate = false;
			scene.screenSpaceCameraController.enableTranslate = false;
			scene.screenSpaceCameraController.enableZoom = false;
			scene.screenSpaceCameraController.enableTilt = false;
			scene.screenSpaceCameraController.enableLook = false;

			// inherit parent map..? nah
			//service.parentViewer.scene.imageryLayers.layerAdded.addEventListener(addLayer);

			service.miniViewer = viewer;
		}

		// use move start/stop so we're only looping when it matters
		function mapMoving(){

			service.intervalHandle = setInterval(function() {

				// get buffered rectangle for extent
				service.bounds = getExtentBounds(50);

				if(service.bounds){

					updateOrAddRectangleEntity(service.miniViewer, service.bounds.rectangle, "miniExtent");

					// get miniMap rectangle for display bounds
					var miniMapRectangle = getViewRectangle(300);
					service.miniViewer.scene.camera.viewRectangle(miniMapRectangle);
				}
				else {
					fallbackView();
				}

			}, 10);

		};

		// clear interval when map inactive
		function mapStopped(){
			clearInterval(service.intervalHandle);

			// TODO fire off our event?
			//service.bounds.extent;

			console.log("stopped");
		};

		/**
		 * Use this to hide/show the target extent rectangle on globe
		 */
		function toggleExtentVis(){
			updateOrAddRectangleEntity(service.parentViewer, service.bounds.rectangle, "parentExtent");
		};

		function updateOrAddRectangleEntity(viewer, rectangle, id) {

			var entities = viewer.entities;
			var rectangleEntity = viewer.entities.getById(id);

			if(rectangleEntity){
				rectangleEntity.rectangle.coordinates = rectangle;
			}

			// add new
			else {

				console.log("add new "+ id);

				entities.add({
					id: id,
					rectangle : {
						coordinates : rectangle,
						outline : true,
						outlineColor : Cesium.Color.RED,
						outlineWidth : 3,
						material : Cesium.Color.RED.withAlpha(0.0)
					}
				});
			}

		};

		// get a position for each four corners of the canvas
		function getCanvasCorners(offset){

			// retina displays are the future, man
			var pixelRatio = window.devicePixelRatio || 1;
			var ellipsoid = Cesium.Ellipsoid.WGS84;

			var corners = [];

			// topLeft
			var c2Pos = new Cesium.Cartesian2(-offset, -offset);
			corners.push(service.parentViewer.scene.camera.pickEllipsoid(c2Pos, ellipsoid));

			// bottomLeft
			c2Pos = new Cesium.Cartesian2(
				-offset,
				(service.parentViewer.scene.canvas.height / pixelRatio) + offset
			);
			corners.push(service.parentViewer.scene.camera.pickEllipsoid(c2Pos, ellipsoid));

			// bottomRight
			c2Pos = new Cesium.Cartesian2(
				(service.parentViewer.scene.canvas.width / pixelRatio) + offset,
				(service.parentViewer.scene.canvas.height / pixelRatio) + offset
			);
			corners.push(service.parentViewer.scene.camera.pickEllipsoid(c2Pos, ellipsoid));

			// topRight
			var c2Pos = new Cesium.Cartesian2(
				(service.parentViewer.scene.canvas.width / pixelRatio) + offset,
				-offset
			);
			corners.push(service.parentViewer.scene.camera.pickEllipsoid(c2Pos, ellipsoid));


			// make sure we've got valid positions for each of the canvas corners
			// (won't if we've got sky)

			for(var i = 0; i < corners.length; i++){

				if(corners[i]){
					corners[i] = ellipsoid.cartesianToCartographic(corners[i]);
				}

				else {
					fallbackView();
					return;
				}
			}


			return corners;
		};

		// shuffles the canvas corner orientations to
		// eliminate rectangle skew caused by offset globe headings
		// i.e. if globe is at 20 degrees topRight becomes the highest latitude for our 2d bounds
		function getOrientedBounds(degrees, corners){

			var rectangle;

			/*
				 <degrees> -> <north corner>

				 0-90 -> topRight
				 90-180 -> bottomRight
				 180-270 -> bottomLeft
				 270-360 -> topRight

				 <northIndex> -> [cornerIndexes]

				 0 = [0,1,2,3]
				 1 = [3,0,1,2]
				 2 = [2,3,0,1]
				 3 = [1,2,3,0]
			 */

			var northCornerIndex = Math.abs(parseInt(degrees / 90));
			var cornerPositions = [
				[0,1,2,3],
				[3,0,1,2],
				[2,3,0,1],
				[1,2,3,0]
			];

			// west, south, east, north
			rectangle = new Cesium.Rectangle.fromDegrees(
				Cesium.Math.toDegrees(corners[ cornerPositions[northCornerIndex][0] ].longitude),
				Cesium.Math.toDegrees(corners[ cornerPositions[northCornerIndex][1] ].latitude),
				Cesium.Math.toDegrees(corners[ cornerPositions[northCornerIndex][2] ].longitude),
				Cesium.Math.toDegrees(corners[ cornerPositions[northCornerIndex][3] ].latitude)
			);

			//xmin, ymin, xmax, ymax
			var extent = {
				'xmin': Cesium.Math.toDegrees(corners[ cornerPositions[northCornerIndex][0] ].longitude),
				'ymin': Cesium.Math.toDegrees(corners[ cornerPositions[northCornerIndex][1] ].latitude),
				'xmax': Cesium.Math.toDegrees(corners[ cornerPositions[northCornerIndex][2] ].longitude),
				'ymax': Cesium.Math.toDegrees(corners[ cornerPositions[northCornerIndex][3] ].latitude)
			};

			return {
				rectangle: rectangle,
				extent: extent
			};
		};

		// gets the extent of bounds + offset
		function getExtentBounds(offset) {

			var corners = getCanvasCorners(offset);

			if(!corners){
				return;
			}

			var heading = parseFloat(Cesium.Math.toDegrees(service.parentCamera.heading));
			var degrees = 360 - heading;

			return getOrientedBounds(degrees, corners);
		};

		// get rectangle of current view + offset
		// don't bother adjusting orientation as viewRectangle() seems to work ok regardless
		function getViewRectangle(offset){

			var ellipsoid = Cesium.Ellipsoid.WGS84;

			// retina displays are the future, man
			var pixelRatio = window.devicePixelRatio || 1;

			var c2 = new Cesium.Cartesian2(-offset, -offset);
			var leftTop = service.parentViewer.scene.camera.pickEllipsoid(c2, ellipsoid);

			c2 = new Cesium.Cartesian2(
				(service.parentViewer.scene.canvas.width / pixelRatio) + offset,
				(service.parentViewer.scene.canvas.height / pixelRatio) + offset
			);

			var rightDown = service.parentViewer.scene.camera.pickEllipsoid(c2, ellipsoid);

			if(leftTop != null && rightDown != null){

				leftTop = ellipsoid.cartesianToCartographic(leftTop);
				rightDown = ellipsoid.cartesianToCartographic(rightDown);

				// west, south, east, north
				var rectangle = new Cesium.Rectangle.fromDegrees(
					Cesium.Math.toDegrees(leftTop.longitude),
					Cesium.Math.toDegrees(rightDown.latitude),
					Cesium.Math.toDegrees(rightDown.longitude),
					Cesium.Math.toDegrees(leftTop.latitude)
				);

				service.logging.style.display = "none";

				return rectangle;
			}

			// The sky is visible in 3D, fallback to ausExtent national map
			else {

				fallbackView();
				return null;
			}
		}

		function fallbackView(){

			// TODO handle national scale fallback extent..

			console.log("the sky is falling");

			service.miniViewer.camera.viewRectangle(ausExtent);
			service.logging.style.display = "block";

			return;
		};

		function setupListeners() {
			service.parentViewer.scene.camera.moveStart.addEventListener(mapMoving);
			service.parentViewer.scene.camera.moveEnd.addEventListener(mapStopped);
		}

		function createToggleButton() {

			var btn = document.createElement('a');
			btn.className = 'minimap-toggle-display';

			var icon = document.createElement('i');
			icon.className = 'fa fa-arrow-right';

			btn.appendChild(icon);

			btn.onclick = function (e) {
				e.preventDefault();
				service.toggle();
				return false;
			};
			return btn;
		}

		return service;


		/*

		Potential helper functions from OL3-cesium...


		 computeBoundingBoxAtTarget = function(scene, target, amount) {
			 var pixelSize = olcs.core.computePixelSizeAtCoordinate(scene, target);
			 var transform = Cesium.Transforms.eastNorthUpToFixedFrame(target);

			 var bottomLeft = Cesium.Matrix4.multiplyByPoint(
			 transform,
			 new Cesium.Cartesian3(-pixelSize.x * amount, -pixelSize.y * amount, 0),
			 new Cesium.Cartesian3());

			 var topRight = Cesium.Matrix4.multiplyByPoint(
			 transform,
			 new Cesium.Cartesian3(pixelSize.x * amount, pixelSize.y * amount, 0),
			 new Cesium.Cartesian3());

			 return Cesium.Ellipsoid.WGS84.cartesianArrayToCartographicArray(
			 [bottomLeft, topRight]);
		 };




		 getAltitude = function() {
			 var carto = Cesium.Ellipsoid.WGS84.cartesianToCartographic(
			 this.cam_.position);

			 return carto.height;
		 };


		Calculates position under the camera.
		getPosition = function() {

			var carto = Cesium.Ellipsoid.WGS84.cartesianToCartographic(
				this.cam_.position);

			var pos = this.fromLonLat_([goog.math.toDegrees(carto.longitude),
				goog.math.toDegrees(carto.latitude)]);

			return pos;
		};



		 */

}]);
/**
 * Created by danielwild on 31/08/2015.
 */

'use strict';

/**
 *
 * Helper functions for feature picking... and service requests..?
 *
 */
angular.module('cesium.picker', [])



.factory('pickService', ['$q', function($q) {

        var service = {};
        var handler;

        service.destroyPickListener = function(){
            handler.destroy();
        };

        service.addPickListener = function(){

            var ellipsoid = _viewer.scene.globe.ellipsoid;
            var entity = _viewer.entities.add({
                label : {
                    show : false
                }
            });

            // Mouse over the globe to see the cartographic position
            handler = new Cesium.ScreenSpaceEventHandler(_viewer.scene.canvas);
            handler.setInputAction(function(pos) {

                var cartesian = _viewer.camera.pickEllipsoid(pos.position, ellipsoid);

                if (cartesian) {
                    var cartographic = ellipsoid.cartesianToCartographic(cartesian);
                    var longitudeString = Cesium.Math.toDegrees(cartographic.longitude).toFixed(2);
                    var latitudeString = Cesium.Math.toDegrees(cartographic.latitude).toFixed(2);

                    entity.position = cartesian;
                    entity.label.show = true;
                    entity.label.text = '(' + longitudeString + ', ' + latitudeString + ')';

                    service.pickImageryFeatures(pos.position); // Cartesian2

                } else {
                    entity.label.show = false;
                }
            }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

        };

        /**
         *
         * An improvised GetFeatureInfo(), determines the imagery layer features that are intersected by a pick ray.
         *
         *
         * TerriaJs uses a similar approach (we haven't added vector support etc. yet)
         * .../terriajs-1.0.36/lib/Models/Cesium.js (~ line 443)
         *
         *
         * @param cartesian Cartesian2
         */
        service.pickImageryFeatures = function(cartesian){

            var deferred = $q.defer();
            var pickRay = _viewer.scene.camera.getPickRay(cartesian);

            // Pick raster features
            var promise = _viewer.scene.imageryLayers.pickImageryLayerFeatures(pickRay, _viewer.scene);

            if (!Cesium.defined(promise)) {
                console.log('No features picked.');
            }

            else {

                Cesium.when(promise, function (features) {
                    console.log(features);
                    deferred.resolve(features);
                });
            }

            return deferred.promise;
        };



    return service;
}])

