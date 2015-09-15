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

				var heading = parseFloat(Cesium.Math.toDegrees(service.parentCamera.heading));
				console.log("heading: "+ heading + ", degrees: "+ (360 - heading));

				// get buffered rectangle: getViewBounds(offset = 50)
				//	> plot rectangle entity on parent + mini viewers
				var bounds = getViewBounds(50);
				//updateRectangleEntity(service.parentViewer, bounds.rectangle);
				updateRectangleEntity(service.miniViewer, bounds.rectangle, heading);

				// fire off our event?  Or set timeout?
				//bounds.extent;

				// get miniMap rectangle: getViewBounds(offset = 300)
				// > use rectangle to set view for miniMap
				var miniMapRectangle = getViewBounds(300).rectangle;
				service.miniViewer.scene.camera.viewRectangle(miniMapRectangle);

			}, 10);

		};

		// clear interval when map inactive
		function mapStopped(){
			clearInterval(service.intervalHandle);
			console.log("stopped");
		};

		function updateRectangleEntity(viewer, rectangle, heading){

			rectangle = adjustRectangleSkew(rectangle, heading);

			var entities = viewer.entities;

			// TODO should just update existing
			entities.removeAll();

			entities.add({
				rectangle : {
					coordinates : rectangle,
					outline : true,
					outlineColor : Cesium.Color.RED,
					outlineWidth : 4,
					material : Cesium.Color.RED.withAlpha(0.0)
				}
			});

		};

		//function adjustRectangleSkew(rectangle, heading){
        //
		//	var degrees = 360 - heading;
        //
		//	//if(degrees < 180){
        //
		//		// west, south, east, north
		//		var newRectangle = new Cesium.Rectangle.fromDegrees(
		//			Cesium.Math.toDegrees(rectangle.west) - (degrees / 100),
		//			Cesium.Math.toDegrees(rectangle.south) - (degrees / 10),
		//			Cesium.Math.toDegrees(rectangle.east)  + (degrees / 100),
		//			Cesium.Math.toDegrees(rectangle.north) + (degrees / 10)
		//		);
		//	//}
         //   //
		//	//else {
		//	//	// west, south, east, north
		//	//	var newRectangle = new Cesium.Rectangle.fromDegrees(
		//	//		Cesium.Math.toDegrees(rectangle.west),
		//	//		Cesium.Math.toDegrees(rectangle.south) + heading / 10,
		//	//		Cesium.Math.toDegrees(rectangle.east),
		//	//		Cesium.Math.toDegrees(rectangle.north) - heading / 10
		//	//	);
		//	//}
        //
		//	console.log(rectangle);
		//	console.log(newRectangle);
        //
		//	//return rectangle;
		//	return newRectangle;
		//};

		// get extent of current view
		function getViewBounds(offset){

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

				// xmin, ymin, xmax, ymax
				var extent = {
					'xmin': Cesium.Math.toDegrees(leftTop.longitude),
					'ymin': Cesium.Math.toDegrees(rightDown.latitude),
					'xmax': Cesium.Math.toDegrees(rightDown.longitude),
					'ymax': Cesium.Math.toDegrees(leftTop.latitude)
				};

				//console.log("extent "+ offset);
				//console.log(extent);

				service.logging.style.display = "none";

				return {
					rectangle: rectangle,
					extent: extent
				};
			}

			// The sky is visible in 3D, fallback to ausExtent national map
			else {

				// TODO handle national scale fallback extent..

				console.log("the sky is falling");

				service.miniViewer.camera.viewRectangle(ausExtent);
				service.logging.style.display = "block";

				return null;
			}
		}

		// get extent of current view
		//function getViewBounds(){
        //
		//	var ellipsoid = Cesium.Ellipsoid.WGS84;
        //
		//	// retina displays are the future, man
		//	var pixelRatio = window.devicePixelRatio || 1;
        //
		//	var c2 = new Cesium.Cartesian2(0, 0);
		//	var leftTop = service.parentViewer.scene.camera.pickEllipsoid(c2, ellipsoid);
        //
		//	c2 = new Cesium.Cartesian2(
		//		service.parentViewer.scene.canvas.width / pixelRatio,
		//		service.parentViewer.scene.canvas.height / pixelRatio
		//	);
        //
		//	var rightDown = service.parentViewer.scene.camera.pickEllipsoid(c2, ellipsoid);
        //
		//	if(leftTop != null && rightDown != null){
        //
		//		leftTop = ellipsoid.cartesianToCartographic(leftTop);
		//		rightDown = ellipsoid.cartesianToCartographic(rightDown);
        //
		//		// west, south, east, north
		//		var rectangle = new Cesium.Rectangle.fromDegrees(
		//			Cesium.Math.toDegrees(leftTop.longitude),
		//			Cesium.Math.toDegrees(rightDown.latitude),
		//			Cesium.Math.toDegrees(rightDown.longitude),
		//			Cesium.Math.toDegrees(leftTop.latitude)
		//		);
        //
		//		// draw rectangle on miniViewer
		//		updateRectangleEntity(service.miniViewer, rectangle);
        //
		//		// update view rectangle
		//		service.miniViewer.scene.camera.viewRectangle(rectangle);
        //
		//		// zoom out a bit for context
        //
		//		// xmin, ymin, xmax, ymax
		//		var extent = {
		//			'xmin': Cesium.Math.toDegrees(leftTop.longitude),
		//			'ymin': Cesium.Math.toDegrees(rightDown.latitude),
		//			'xmax': Cesium.Math.toDegrees(rightDown.longitude),
		//			'ymax': Cesium.Math.toDegrees(leftTop.latitude)
		//		};
        //
		//		console.log(extent);
        //
		//		service.logging.style.display = "none";
        //
		//		return extent;
		//	}
        //
		//	// The sky is visible in 3D, fallback to ausExtent national map
		//	else {
        //
		//		console.log("the sky is falling");
        //
		//		service.miniViewer.camera.viewRectangle(ausExtent);
		//		service.logging.style.display = "block";
        //
		//		return null;
		//	}
		//}


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