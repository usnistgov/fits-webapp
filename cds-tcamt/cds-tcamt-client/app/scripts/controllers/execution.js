'use strict';

/**
 * @ngdoc function
 * @name clientApp.controller:ExecutionCtrl
 * @description
 * # ExecutionCtrl
 * Controller of the clientApp
 */
angular.module('tcl').controller('ExecutionCtrl', function ($scope,TestDataService,$timeout,ngTreetableParams,$q) {
    $scope.tps = [];
    $scope.selectedTC = null;
    $scope.selectedTP = null;
    $scope.tcQueue = [];
    $scope.exec = false;
    $scope.addConfig = false;
    $scope.configStub = {
        name : "",
        endPoint : "",
        connector : ""
    };
    $scope.selectedConfig = null;

    $scope.init = function(){
        $scope.loadTestCases();
    };

    $scope.inQueue = function(tc){
        return $scope.tcQueue.indexOf(tc) !== -1;
    };

    $scope.loadTestCases = function () {
        TestDataService.loadTestPlans().then(function (data) {
            $scope.tps = data;
        },
        function (err) {
            console.log(err);
        });
    };

    $scope.selectTC = function (tc) {
        $scope.selectedTC = tc;
        $scope.selectedTP = null;
    };

    $scope.selectTP = function (tp) {
        $scope.selectedTP = tp;
        $scope.selectedTC = null;
    };

    $scope.addQueue = function (tc) {
        tc._pg = 0;
        tc._pgt = 'determinate';
        $scope.tcQueue.push(tc);
    };

    $scope.exe = function () {
        $scope.exec = true;
        $scope.execT(0);
    };

    $scope.execT = function (id) {
        if(id < $scope.tcQueue.length){
            $scope.tcQueue[id]._pgt = 'indeterminate';
            $timeout(function () {
                $scope.tcQueue[id]._pgt = 'determinate';
                $scope.tcQueue[id]._pg = 100;
                $scope.execT(id+1);
            }, 5000);
        }
    };

    $scope.canRun = function () {
        return  $scope.selectedConfig && $scope.tcQueue.length;
    };

    $scope.deleteTCL = function (id) {
        $scope.tcQueue.splice(id,1);
    };

    $scope.clear = function () {
        $scope.tcQueue = [];
        $scope.selectedConfig = null;
    };

    $scope.isSelectedTC = function (tc) {
        return $scope.selectedTC === tc;
    };

    $scope.isSelectedTP = function (tp) {
        return $scope.selectedTP === tp;
    };

});
