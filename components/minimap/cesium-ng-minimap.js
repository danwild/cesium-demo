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
				console.log('degrees: '+ (360 - heading));

				// get buffered rectangle for extent
				var bounds = getExtentBounds(50);

				//updateRectangleEntity(service.parentViewer, bounds.rectangle);
				// or just save co-ords and update on mouseEnter

				updateRectangleEntity(service.miniViewer, bounds.rectangle, heading);

				// TODO fire off our event?  Or set timeout?
				//bounds.extent;

				// get miniMap rectangle for display bounds
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



		// get a postion for each four corners of the canvas
		function getCanvasBounds(offset){

			// retina displays are the future, man
			var pixelRatio = window.devicePixelRatio || 1;
			var ellipsoid = Cesium.Ellipsoid.WGS84;


			// topLeft
			var c2Pos = new Cesium.Cartesian2(-offset, -offset);
			var topLeft = service.parentViewer.scene.camera.pickEllipsoid(c2Pos, ellipsoid);


			// topRight
			var c2Pos = new Cesium.Cartesian2(
				(service.parentViewer.scene.canvas.width / pixelRatio) + offset,
				-offset
			);
			var topRight = service.parentViewer.scene.camera.pickEllipsoid(c2Pos, ellipsoid);


			// bottomLeft
			c2Pos = new Cesium.Cartesian2(
				-offset,
				(service.parentViewer.scene.canvas.height / pixelRatio) + offset
			);
			var bottomLeft = service.parentViewer.scene.camera.pickEllipsoid(c2Pos, ellipsoid);


			// bottomRight
			c2Pos = new Cesium.Cartesian2(
				(service.parentViewer.scene.canvas.width / pixelRatio) + offset,
				(service.parentViewer.scene.canvas.height / pixelRatio) + offset
			);

			var bottomRight = service.parentViewer.scene.camera.pickEllipsoid(c2Pos, ellipsoid);


			return [
				ellipsoid.cartesianToCartographic(topLeft),
				ellipsoid.cartesianToCartographic(bottomLeft),
				ellipsoid.cartesianToCartographic(bottomRight),
				ellipsoid.cartesianToCartographic(topRight)
			];

			//return {
			//	topLeft: ellipsoid.cartesianToCartographic(topLeft),
			//	topRight: ellipsoid.cartesianToCartographic(topRight),
			//	bottomLeft: ellipsoid.cartesianToCartographic(bottomLeft),
			//	bottomRight: ellipsoid.cartesianToCartographic(bottomRight)
			//};

		};

		// shuffles the canvas corner positons to
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

			 */

			var northCornerIndex = Math.abs(parseInt(degrees / 90));

			console.log("index "+northCornerIndex);

			//switch (northCornerIndex){
			//
			//	case 0:
			//
			//		// west, south, east, north
			//		// 0-90 -> topRight
			//		rectangle = new Cesium.Rectangle.fromDegrees(
			//			Cesium.Math.toDegrees(corners.topLeft.longitude), // lon
			//			Cesium.Math.toDegrees(corners.bottomLeft.latitude), // lat
			//			Cesium.Math.toDegrees(corners.bottomRight.longitude), // lon
			//			Cesium.Math.toDegrees(corners.topRight.latitude) // lat
			//		);
			//
			//		break;
			//
			//
			//	case 1:
			//
			//		// west, south, east, north
			//		// 90-180 -> bottomRight
			//		rectangle = new Cesium.Rectangle.fromDegrees(
			//			Cesium.Math.toDegrees(corners.topRight.longitude), // lon
			//			Cesium.Math.toDegrees(corners.topLeft.latitude), // lat
			//			Cesium.Math.toDegrees(corners.bottomLeft.longitude), // lon
			//			Cesium.Math.toDegrees(corners.bottomRight.latitude) // lat
			//		);
			//
			//		break;
			//
			//	case 2:
			//
			//		// west, south, east, north
			//		// 180-270 -> bottomLeft
			//		rectangle = new Cesium.Rectangle.fromDegrees(
			//			Cesium.Math.toDegrees(corners.bottomRight.longitude), // lon
			//			Cesium.Math.toDegrees(corners.topRight.latitude), // lat
			//			Cesium.Math.toDegrees(corners.topLeft.longitude), // lon
			//			Cesium.Math.toDegrees(corners.bottomLeft.latitude) // lat
			//		);
			//
			//		break;
			//
			//	case 3:
			//
			//		// west, south, east, north
			//		// 270-360 -> topRight
			//		rectangle = new Cesium.Rectangle.fromDegrees(
			//			Cesium.Math.toDegrees(corners.bottomLeft.longitude), // lon
			//			Cesium.Math.toDegrees(corners.bottomRight.latitude), // lat
			//			Cesium.Math.toDegrees(corners.topRight.longitude), // lon
			//			Cesium.Math.toDegrees(corners.topLeft.latitude) // lat
			//		);
			//
			//		break;
			//
			//	default:
			//
			//		// west, south, east, north
			//		// 0-90 -> topRight
			//		rectangle = new Cesium.Rectangle.fromDegrees(
			//			Cesium.Math.toDegrees(corners.topLeft.longitude), // lon
			//			Cesium.Math.toDegrees(corners.bottomLeft.latitude), // lat
			//			Cesium.Math.toDegrees(corners.bottomRight.longitude), // lon
			//			Cesium.Math.toDegrees(corners.topRight.latitude) // lat
			//		);
			//
			//		break;
			//
			//}



			/*

			 <northIndex> -> [cornerIndexes]

			 0 = [0,1,2,3]
			 1 = [3,0,1,2]
			 2 = [2,3,0,1]
			 3 = [1,2,3,0]

			 */

			var cornerLookup = [
				[0,1,2,3],
				[3,0,1,2],
				[2,3,0,1],
				[1,2,3,0]
			];

			// west, south, east, north
			rectangle = new Cesium.Rectangle.fromDegrees(
				Cesium.Math.toDegrees(corners[ cornerLookup[northCornerIndex][0] ].longitude), // lon
				Cesium.Math.toDegrees(corners[ cornerLookup[northCornerIndex][1] ].latitude), // lat
				Cesium.Math.toDegrees(corners[ cornerLookup[northCornerIndex][2] ].longitude), // lon
				Cesium.Math.toDegrees(corners[ cornerLookup[northCornerIndex][3] ].latitude) // lat
			);


			//xmin, ymin, xmax, ymax
			var extent = {
				'xmin': Cesium.Math.toDegrees(corners[ cornerLookup[northCornerIndex][0] ].longitude),
				'ymin': Cesium.Math.toDegrees(corners[ cornerLookup[northCornerIndex][1] ].latitude),
				'xmax': Cesium.Math.toDegrees(corners[ cornerLookup[northCornerIndex][2] ].longitude),
				'ymax': Cesium.Math.toDegrees(corners[ cornerLookup[northCornerIndex][3] ].latitude)
			};

			return {
				rectangle: rectangle,
				extent: extent
			};
		};

		// gets the extent of bounds + offset
		function getExtentBounds(offset) {

			var corners = getCanvasBounds(offset);

			console.log(corners);

			var heading = parseFloat(Cesium.Math.toDegrees(service.parentCamera.heading));
			var degrees = 360 - heading;

			return getOrientedBounds(degrees, corners);

		};

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

				fallback();

				return null;
			}
		}

		function fallback(){

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