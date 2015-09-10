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


		// this is the guts...
		//function updateMapPosition(){
		//
		//	console.log("ping");
		//
		//	var childCamera = service.miniViewer.scene.camera;
		//
		//	var pos = Cesium.Ellipsoid.WGS84.cartesianToCartographic(
		//		service.parentCamera.position.clone()
		//	);
		//
		//
		//	childCamera.setView({
		//		positionCartographic: pos,
		//		heading: service.parentCamera.heading
		//	});
		//};


		// loop fast when camera is being moved
		function mapMoving(){

			service.intervalHandle = setInterval(function() {

				//var camera = _viewer.scene.camera;
				//var store = {  position: camera.position.clone(),
				//		direction: camera.direction.clone(),
				//		up: camera.up.clone(),
				//		right: camera.right.clone(),
				//		transform: camera.transform.clone(),
				//		frustum: camera.frustum.clone()
				//	};

				//update UI elements

				var pos = Cesium.Ellipsoid.WGS84.cartesianToCartographic(
					service.parentCamera.position.clone()
				);

				service.miniViewer.scene.camera.setView({
					positionCartographic: pos,
					heading: service.parentCamera.heading
				});

				//console.log("updated");


			}, 10);

		};

		// clear interval when map inactive
		function mapStopped(){
			clearInterval(service.intervalHandle);
			console.log("stopped");
		};

		function setupListeners() {
			service.parentViewer.scene.camera.moveStart.addEventListener(mapMoving);
			service.parentViewer.scene.camera.moveEnd.addEventListener(mapStopped);
		}

		function toggle() {
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
			if (service.parentViewer.imageryLayers.length) {
				addLayer(service.parentViewer.imageryLayers.get(0));
			}
		}







		return service;

}])