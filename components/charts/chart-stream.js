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

        cossapChartState.chartPanel = true;
        
        // safe apply
        if(!$rootScope.$$phase) {
        	$rootScope.$apply();
        }
	};


	
	return service;

}]);