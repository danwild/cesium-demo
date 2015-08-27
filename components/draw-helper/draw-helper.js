/**
 * Created by danielwild on 26/08/2015.
 */

'use strict';

angular.module('cossap.drawhelper', [])


.factory('drawHelperService', [function() {

	var service = {};

	service.active = false;
	service.drawHelper;
	service.scene;
	service.loggingMessage;


	/**
	 *
	 * Wrapper for DrawHelper.startDrawingPolyline
	 *
     * @param options
	 *
	 * options.callback (returns the created entity)
	 * options.editable
	 * options.width
	 * options.geodesic
	 *
	 */

	service.drawLine = function(options){

		service.active = true;

		service.drawHelper.startDrawingPolyline({

			callback: function(positions) {

				service.loggingMessage('Polyline created with ' + positions.length + ' points');
				var polyline = new DrawHelper.PolylinePrimitive({
					positions: positions,
					width: options.width || 5,
					geodesic: options.hasOwnProperty("geodesic") ? options.geodesic : true
				});
				service.scene.primitives.add(polyline);

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


	service.init = function(){

		console.log("init drawhlper..");

		service.active = true;

		// create the scence for our shapes
		service.scene = _viewer.scene;

		// start the draw helper to enable shape creation and editing
		service.drawHelper = new DrawHelper(_viewer);

		// init logging
		var logging = document.getElementById('logging');
		service.loggingMessage = function(message) {
			logging.innerHTML = message;
		}


		//var toolbar = service.drawHelper.addToolbar(document.getElementById("toolbar"), {
		//	buttons: ['marker', 'polyline', 'polygon', 'circle', 'extent']
		//});
		//toolbar.addListener('markerCreated', function(event) {
		//	loggingMessage('Marker created at ' + event.position.toString());
		//	// create one common billboard collection for all billboards
		//	var b = new Cesium.BillboardCollection();
		//	scene.primitives.add(b);
		//	var billboard = b.add({
		//		show : true,
		//		position : event.position,
		//		pixelOffset : new Cesium.Cartesian2(0, 0),
		//		eyeOffset : new Cesium.Cartesian3(0.0, 0.0, 0.0),
		//		horizontalOrigin : Cesium.HorizontalOrigin.CENTER,
		//		verticalOrigin : Cesium.VerticalOrigin.CENTER,
		//		scale : 1.0,
		//		image: './img/glyphicons_242_google_maps.png',
		//		color : new Cesium.Color(1.0, 1.0, 1.0, 1.0)
		//	});
		//	billboard.setEditable();
		//});
		//toolbar.addListener('polylineCreated', function(event) {
		//	loggingMessage('Polyline created with ' + event.positions.length + ' points');
		//	var polyline = new DrawHelper.PolylinePrimitive({
		//		positions: event.positions,
		//		width: 5,
		//		geodesic: true
		//	});
		//	scene.primitives.add(polyline);
		//	polyline.setEditable();
		//	polyline.addListener('onEdited', function(event) {
		//		loggingMessage('Polyline edited, ' + event.positions.length + ' points');
		//	});
		//
		//});
		//toolbar.addListener('polygonCreated', function(event) {
		//	loggingMessage('Polygon created with ' + event.positions.length + ' points');
		//	var polygon = new DrawHelper.PolygonPrimitive({
		//		positions: event.positions,
		//		material : Cesium.Material.fromType('Checkerboard')
		//	});
		//	scene.primitives.add(polygon);
		//	polygon.setEditable();
		//	polygon.addListener('onEdited', function(event) {
		//		loggingMessage('Polygon edited, ' + event.positions.length + ' points');
		//	});
		//
		//});
		//toolbar.addListener('circleCreated', function(event) {
		//	loggingMessage('Circle created: center is ' + event.center.toString() + ' and radius is ' + event.radius.toFixed(1) + ' meters');
		//	var circle = new DrawHelper.CirclePrimitive({
		//		center: event.center,
		//		radius: event.radius,
		//		material: Cesium.Material.fromType(Cesium.Material.RimLightingType)
		//	});
		//	scene.primitives.add(circle);
		//	circle.setEditable();
		//	circle.addListener('onEdited', function(event) {
		//		loggingMessage('Circle edited: radius is ' + event.radius.toFixed(1) + ' meters');
		//	});
		//});
		//toolbar.addListener('extentCreated', function(event) {
		//	var extent = event.extent;
		//	loggingMessage('Extent created (N: ' + extent.north.toFixed(3) + ', E: ' + extent.east.toFixed(3) + ', S: ' + extent.south.toFixed(3) + ', W: ' + extent.west.toFixed(3) + ')');
		//	var extentPrimitive = new DrawHelper.ExtentPrimitive({
		//		extent: extent,
		//		material: Cesium.Material.fromType(Cesium.Material.StripeType)
		//	});
		//	scene.primitives.add(extentPrimitive);
		//	extentPrimitive.setEditable();
		//	extentPrimitive.addListener('onEdited', function(event) {
		//		loggingMessage('Extent edited: extent is (N: ' + event.extent.north.toFixed(3) + ', E: ' + event.extent.east.toFixed(3) + ', S: ' + event.extent.south.toFixed(3) + ', W: ' + event.extent.west.toFixed(3) + ')');
		//	});
		//});

















	};


	return service;

}])