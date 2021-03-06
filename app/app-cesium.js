
// init cesium
var _viewer = new Cesium.Viewer('cesiumContainer', {
	mapProjection : new Cesium.WebMercatorProjection(),
	timeline: false,
	sceneModePicker: false,
	animation: false
});

var homeCamera = {
	"north": -8,
	"east": 158,
	"south": -45,
	"west": 109
}

// set aus extent, and assign default for home button etc.
var ausExtent = Cesium.Rectangle.fromDegrees(
	homeCamera.west,
	homeCamera.south,
	homeCamera.east,
	homeCamera.north
);

_viewer.camera.viewRectangle(ausExtent);

Cesium.Camera.DEFAULT_VIEW_RECTANGLE = ausExtent;

// set terrain here so we can keep baseLayerPicker
var cesiumTerrainProvider = new Cesium.CesiumTerrainProvider({
 url : '//assets.agi.com/stk-terrain/world'
});

_viewer.terrainProvider = cesiumTerrainProvider;