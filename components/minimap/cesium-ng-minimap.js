/**
 * Created by danielwild on 10/09/2015.
 */

'use strict';

angular.module('cesium.minimap', [])

/**
 * An ng service wrapper to add a 2d mini map to your cesium viewer
 *
 */
.factory('miniMapService', [function() {


		var service = {};


		//options = options || {};
		//var expanded = options.expanded || true;

		service.parentViewer;
		service.parentCamera;

		service.expanded = true;
		service.miniViewer;
		service.container;
		service.toggleButton;

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


		service.init = function(parentViewer){


			service.parentViewer = parentViewer;
			service.parentCamera = service.parentViewer.scene.camera;

			console.log("and we're off..");

			// kick it off..
			init();

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

			service.parentViewer.scene.imageryLayers.layerAdded.addEventListener(addLayer);

			service.miniViewer = viewer;
		}


		// loop fast when camera is being moved
		function mapMoving(){

			service.intervalHandle = setInterval(function() {

				getExtentView();

				// using the parent position directly fails with pitch and yaw
				//var pos = Cesium.Ellipsoid.WGS84.cartesianToCartographic(
				//	service.parentCamera.position.clone()
				//);
				//
				//service.miniViewer.scene.camera.setView({
				//	positionCartographic: pos,
				//	heading: service.parentCamera.heading
				//});

			}, 10);

		};

		// clear interval when map inactive
		function mapStopped(){
			clearInterval(service.intervalHandle);
			console.log("stopped");
		};

		// get 2d rectangle from current view
		function getExtentView(){

			var ellipsoid = Cesium.Ellipsoid.WGS84;


			var c2 = new Cesium.Cartesian2(0,0);
			var leftTop = service.parentViewer.scene.camera.pickEllipsoid(c2, ellipsoid);

			c2 = new Cesium.Cartesian2(service.parentViewer.scene.canvas.width, service.parentViewer.scene.canvas.height);
			var rightDown = service.parentViewer.scene.camera.pickEllipsoid(c2, ellipsoid);


			if(leftTop != null && rightDown != null){

				leftTop = ellipsoid.cartesianToCartographic(leftTop);
				rightDown = ellipsoid.cartesianToCartographic(rightDown);

				// west, south, east, north
				var extent = new Cesium.Rectangle.fromDegrees(

					Cesium.Math.toDegrees(leftTop.longitude),
					Cesium.Math.toDegrees(rightDown.latitude),
					Cesium.Math.toDegrees(rightDown.longitude),
					Cesium.Math.toDegrees(leftTop.latitude)

				);

				//console.log(extent);
				service.miniViewer.scene.camera.viewRectangle(extent);



				console.log("view changed");

				// entity...
				//var cartesianPositions = ellipsoid.cartographicArrayToCartesianArray(
				//	Cesium.Math.toDegrees(leftTop.longitude),
				//	Cesium.Math.toDegrees(rightDown.latitude),
				//	Cesium.Math.toDegrees(rightDown.longitude),
				//	Cesium.Math.toDegrees(leftTop.latitude)
				//);
				//var entity = service.parentViewer.entities.add({
				//	polygon : {
				//		hierarchy : cartesianPositions,
				//		outline : true,
				//		outlineColor : Cesium.Color.RED,
				//		outlineWidth : 9,
				//		perPositionHeight: true,
				//		material : Cesium.Color.BLUE.withAlpha(0.0),
				//	}
				//});



				return extent;
			}

			else{//The sky is visible in 3D

				console.log("the sky is falling :(");

				return null;
			}
		}

		function preRender(scene) {

			var time = Cesium.getTimestamp();
			var position = service.parentCamera.position;

			if (!Cesium.Cartesian3.equalsEpsilon(service.lastPosition, position, Cesium.Math.EPSILON4)) {

				console.log("view changed");

				getExtentView();

				service.lastTime = time;
				//
				//var pos = Cesium.Ellipsoid.WGS84.cartesianToCartographic(
				//	service.parentCamera.position.clone()
				//);
				//
				//service.miniViewer.scene.camera.setView({
				//	positionCartographic: pos,
				//	heading: service.parentCamera.heading
				//});
			}

			else if (time - service.lastTime > 250) {

				//hide the 'view changed' message after 250 ms of inactivity
				service.lastTime = time;
				console.log("stopped");
			}
			service.lastPosition = position.clone();
		}

		function setupListeners() {

			//service.lastTime = Cesium.getTimestamp();
			//service.lastPosition = service.parentCamera.position.clone();
			//
			//service.parentViewer.scene.preRender.addEventListener(preRender);

			service.parentViewer.scene.camera.moveStart.addEventListener(mapMoving);
			service.parentViewer.scene.camera.moveEnd.addEventListener(mapStopped);
		}

		function toggle() {
			service.expanded = !service.expanded;

			if (service.expanded) {
				service.container.style.width = '350px';
				service.container.style.height = '350px';
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
		}

		function createToggleButton() {

			var btn = document.createElement('a');
			btn.className = 'minimap-toggle-display';

			var icon = document.createElement('i');
			icon.className = 'fa fa-arrow-right';

			btn.appendChild(icon);

			btn.onclick = function (e) {
				e.preventDefault();
				toggle();
				return false;
			};
			return btn;
		}


		function init() {

			// create container div -> directive...?
			var div = document.createElement('div');
			div.className = 'minimap-container';

			service.container = getContainer();
			service.container.appendChild(div);
			service.toggleButton = createToggleButton();
			service.container.appendChild(service.toggleButton);
			setupMap(div);
			setupListeners();

			var url = "http://www.ga.gov.au/gis/rest/services/topography/Australian_Topography_WM/MapServer";
			var layer = "0";



			var topoLayer = new Cesium.ArcGisMapServerImageryProvider({
				url : url,
				layers: layer,
				rectangle: ausExtent, // only load imagery for australia
			});

			addLayer(topoLayer);


			// inherit parent baselayer..?
			//if (service.parentViewer.imageryLayers.length) {
			//	addLayer(service.parentViewer.imageryLayers.get(0));
			//}
		}







		return service;

}])