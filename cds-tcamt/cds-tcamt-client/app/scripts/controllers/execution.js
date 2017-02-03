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
    $scope.heigth = {
        'heigth' : '100%'
    };
    $scope.tabStyle = $scope.heigth;
    $scope.init = function(){
        $scope.loadTestCases();
    };
    $scope.dragOver = function (index, item, external, type) {
        if($scope.inQueue(item) && !item.hasOwnProperty("_pg"))
            return false;
        else {
            item._pg = 0;
            item._pgt = 'determinate';
            $scope.tcQueue.splice(index, 0, item);
            return true;
        }

    };

    $scope.dragMoved = function (index) {
        console.log(index);
    };

    $scope.inQueue = function(tc){
        return $scope.tcQueue.find(function (item) {
            return item.id === tc.id;
        });
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
    $scope.models = {
        selected: null,
        lists: {"A": [], "B": []}
    };

    // Generate initial model
    for (var i = 1; i <= 3; ++i) {
        $scope.models.lists.A.push({label: "Item A" + i});
        $scope.models.lists.B.push({label: "Item B" + i});
    }

    // Model to JSON for demo purpose
    $scope.$watch('models', function(model) {
        $scope.modelAsJson = angular.toJson(model, true);
    }, true);
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
