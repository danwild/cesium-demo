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

