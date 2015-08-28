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

'use strict';

/**

	Just an ng html wrap so we can hook into the layout for different app states

*/
angular.module('cossap.cesiumpanel', [])


.controller('CesiumPanelController', ['$scope', 'cossapChartState',
	function($scope, cossapChartState) {

		$scope.cossapChartState = cossapChartState;

}]);

/**
 * Created by danielwild on 26/08/2015.
 */

'use strict';

angular.module('cesium.drawhelper', [])

/**
 * A collection of helper functions for drawing shapes etc.
 *
 * > Point Marker
 * > PolyLine
 * > Polygon
 * > Extent (rectangle)
 * > Circle
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
	 * Should work with cesium viewer or widget
	 *
	 */
	service.init = function(cesiumWidget) {

		service.active = true;

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
	 * @param options Object
	 *
	 * options.callback (returns the created entity) REQUIRED
	 * options.imgUrl
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

				options.callback(billboard);
			}
		});
	};

	/**
	 *
	 * Wrapper for DrawHelper.startDrawingPolyline
	 *
     * @param options Object
	 *
	 * options.callback (returns the created entity)
	 * options.editable
	 * options.width
	 * options.geodesic
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

				options.callback(polyline);
			}
		});
	};

	/**
	 *
	 * Wrapper for DrawHelper.startDrawingPolygon
	 *
	 * @param options Object
	 *
	 * options.callback (returns the created entity) REQUIRED
	 * options.editable
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

				options.callback(polygon);
			}
		});
	};

	/**
	 *
	 * Wrapper for DrawHelper.startDrawingPolygon
	 *
	 * @param options Object
	 *
	 * options.callback (returns the created entity) REQUIRED
	 * options.editable
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

				options.callback(extentPrimitive);
			}
		});
	};

	/**
	 *
	 * Wrapper for DrawHelper.startDrawingCircle
	 *
	 * @param options Object
	 *
	 * options.callback (returns the created entity) REQUIRED
	 * options.editable
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

				options.callback(circle);
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


	return service;

}])