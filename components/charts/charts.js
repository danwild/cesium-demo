'use strict';

angular.module('cossap.charts', [])


.directive('cossapChartPanel', [function() {
	return {
		templateUrl : 'components/charts/charts.html',
		controller : 'cossapChartController'
	};e
}])


.controller('cossapChartController', ['$scope', 'cossapChartState', 
	function($scope, cossapChartState) {

	
	$scope.cossapChartState = cossapChartState;

}])

.factory('cossapChartState', [function() {

	var state = {};

	state.chartPanel = false;
	state.streamChart = false;

	return state;

}]);
