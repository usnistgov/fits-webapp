/**
 * Created by hnt5 on 4/3/17.
 */

angular.module('tcl').filter('pending', function () {
    return function (items, f) {
        if (!items || !items.length) {
            return;
        }
        if (!f || f === "") return items;
        return items.filter(function (item) {
            return (f === 'e' && !item.pending) || (f === 'd' && item.pending);
        });
    };
});

angular
    .module('tcl')
    .controller(
        'UserManagementCtrl',
        function ($parse, $document, $scope, $rootScope, $templateCache,
                  Restangular, $http, $filter, $modal, $cookies, $anchorScroll, $location,
                  $timeout, userInfoService, ngTreetableParams,
                  $interval, ViewSettings, StorageService, $q,
                  notifications, IgDocumentService, ElementUtils,
                  AutoSaveService, $sce, Notification, TestObjectUtil, TestObjectFactory, VaccineService, TestObjectSynchronize, TestDataService) {

            $scope.accounts = [];
            $scope.init = function () {
                $http.get("api/accounts/list").then(function (res) {
                    $scope.accounts = res.data;
                });
            };

            $scope.filterS = "";

            $scope.toggle = function (acc) {
                if (acc.pending) {
                    $scope.enable(acc);
                }
                else {
                    $scope.disable(acc);
                }
            };


            $scope.enable = function (acc) {
                $http.get("api/accounts/" + acc.id+"/enable").then(function (res) {
                    Object.assign(acc, res.data);
                })
            };

            $scope.disable = function (acc) {
                $http.get("api/accounts/" + acc.id +"/disable").then(function (res) {
                    Object.assign(acc, res.data);
                })
            };


        })
;