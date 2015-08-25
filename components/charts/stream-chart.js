'use strict';

angular.module('cossap.charts.stream', [])


.directive('chartStream', [function() {
	return {
		templateUrl : 'components/charts/stream-chart.html',
		controller : 'streamChartController'
	};
}])


.controller('streamChartController', ['$scope', 'cossapChartState', 'streamChartService', 
	function($scope, cossapChartState, streamChartService) {

	
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