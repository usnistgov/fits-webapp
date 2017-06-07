/**
 * Created by Hossam Tamri on 4/17/17.
 */

angular.module('tcl').directive('entityImport', function ($modal, FITSBackEnd, EntityService, EntityUtilsService, $http, $rootScope) {
    return {
        restrict: 'E',
        templateUrl: 'import.html',
        scope: {
            tp: '=',
            tps: '=',
            save : '='
        },
        controllerAs: 'ctrl',
        controller: function ($scope) {
            var ctrl = this;
            ctrl.formats = {
                NIST: 'NIST',
                CDC_SP: 'CDC_SP'
            };
            ctrl.configs = [
                {
                    id: ctrl.formats.NIST,
                    name: 'NIST XML Format',
                    multi_files: true,
                    label: 'nist',
                    message: 'File should be XML',
                    allow: ['text/xml']
                },
                {
                    id: ctrl.formats.CDC_SP,
                    name: 'CDC CDSi Spreadsheet',
                    label: 'cdc',
                    message: 'File should be EXCEL Spreadsheet',
                    multi_files: true,
                    allow: [
                        "application/vnd.ms-excel",
                        "application/msexcel",
                        "application/x-msexcel",
                        "application/x-ms-excel",
                        "application/x-excel",
                        "application/x-dos_ms_excel",
                        "application/xls",
                        "application/x-xls",
                        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                    ]
                }
            ];

            $scope.message = "";
            $scope.selectedFiles = [];
            $scope.validFiles = [];
            $scope.FORMAT = ctrl.formats.NIST;
            $scope.exportConfig = {
                all: true,
                ignore: false,
                lines : "",
                position: 1,
                ovGroup : false,
                groupId : ''
            };

            $scope.isMulti = function () {
                return ctrl.configFor($scope.FORMAT).multi_files;
            };

            ctrl.configFor = function (id) {
                var conf = _.find(ctrl.configs, function (conf) {
                    return conf.id === id;
                });
                $scope.message = conf.message;
                return conf;
            };

            $scope.select = function (list) {
                $scope.$apply(function () {
                    $scope.selectedFiles = [];
                    _.forEach(list, function (file) {
                        $scope.selectedFiles.push(file);
                    });
                    ctrl.validateFiles();
                    _.forEach($scope.validFiles, function (file) {
                        console.log(" F : " + file.name + " " + ctrl.isValid(file));
                    });
                });
            };

            ctrl.rmFile = function (id) {
                $scope.selectedFiles.splice(id, 1);
                ctrl.validateFiles();
            };

            ctrl.validateFiles = function () {
                $scope.validFiles = [];
                var config = ctrl.configFor($scope.FORMAT);
                _.forEach($scope.selectedFiles, function (file) {
                    if (~config.allow.indexOf(file.type)) {
                        $scope.validFiles.push(file);
                    }
                });
            };

            ctrl.isValid = function (file) {
                return $scope.validFiles.indexOf(file) !== -1;
            };

            $scope.$watch('FORMAT', function () {
                console.log("FORMAT CHANGE");
                ctrl.validateFiles();
            });

            $scope.regex = "\\d+(-\\d+)?(;\\d+(-\\d+)?)*";

            $scope.import = function () {
                var unsaved = EntityUtilsService.getUnsavedObject($scope.tp);
                if(!EntityUtilsService.unsavedObjectIsEmpty(unsaved)){

                    var saveModal = $modal.open({
                        templateUrl: 'ImportSave.html',
                        controller: 'ImportSaveCtrl'
                    });
                    saveModal.result.then(function (result) {
                        if(result.action === 'save'){
                            FITSBackEnd.saveAll($rootScope,unsaved, $scope.tp).then(function (result) {
                                console.log(result);
                            });
                        }
                    });
                    return;
                }

                var fd = new FormData();
                _.forEach($scope.validFiles, function (file) {
                    fd.append("files", file);
                });
                if($scope.importConfig && $scope.importConfig.$valid || !$scope.importConfig){
                    fd.append("config",new Blob([angular.toJson($scope.exportConfig)], { type: "application/json" }));
                    $rootScope.$broadcast("start_import");
                    try{
                        $http.post("api/testcase/import/" + $scope.tp.id + "/"+ ctrl.configFor($scope.FORMAT).label, fd,
                            {
                                transformRequest: angular.identity,
                                headers: {
                                    'Content-Type': undefined
                                }
                            })
                            .success(function (result) {
                                $rootScope.$broadcast("tp_import_success",result);
                            })
                            .error(function (result) {
                                $rootScope.$broadcast("tp_import_failure",result);
                            });
                    }
                    catch(ex){
                        $rootScope.$broadcast("end_import");
                        throw ex;
                    }
                }
                else {
                    console.log("CONFIG INVALID");
                }
            };
        }
    }
});
