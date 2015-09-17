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