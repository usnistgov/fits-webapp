angular.module('tcl').directive('softwareConfiguration', function() {
	return {
		templateUrl : 'views/configurationTemplate.html',
		restrict : 'E',
		scope	 : {
            date  : "=",
            relative : "=",
            selectedConfig : '='
		},
		controller : function($scope, $rootScope, $http) {
			var ctrl = this;
			
			$scope.aEdit = false;
			$scope.cEdit = false;
            $scope.configStub = null;
            $scope.configs = [];
            $scope.relative = true;



            $scope.loadConfig = function () {
                $http.get("api/exec/configs").then(function (result) {
                    $scope.configs = angular.fromJson(result.data);
                });
            };
			
            $scope.onConfig = function (config) {
                if (!config) {
                    $scope.configStub = null;
                }
                else if (!config._local) {
                    ctrl.selectedConfig = config;
                    $scope.configStub = JSON.parse(angular.toJson(config));
                }
                else {
                    ctrl.selectedConfig = null;
                    $scope.configStub = JSON.parse(angular.toJson(config));
                }
            };

            $scope.createConf = function () {
                var x = {
                    _local: true,
                    id: new ObjectId().toString(),
                    name: "New",
                    endPoint: "",
                    connector: ""
                };
                $scope.configs.push(x);
                $scope.onConfig(x);
            };

            $scope.deleteConfig = function (index, id, local) {
                if (local) {
                    if ($scope.configs[index].id === $scope.configStub.id) {
                        $scope.configStub = null;
                        ctrl.selectedConfig = null;
                    }
                    $scope.configs.splice(index, 1);
                }
                else {
                    $http.post("api/exec/configs/delete/" + id).then(function () {
                        if (ctrl.selectedConfig.id === id) {
                            ctrl.selectedConfig = null;
                        }
                        if ($scope.configs[index].id === $scope.configStub.id) {
                            $scope.configStub = null;
                            ctrl.selectedConfig = null;
                        }
                        $scope.configs.splice(index, 1);
                    });
                }
            };

            $scope.saveConfig = function () {
                $http.post("api/exec/configs/save", $scope.configStub).then(function (result) {
                    var conf = angular.fromJson(result.data);
                    var idx = _.findIndex($scope.configs, function (x) {
                        return x.id === conf.id;
                    });
                    if (~idx) {
                        $scope.configs.splice(idx, 1, conf);
                    }
                    else {
                        $scope.configs.push(conf);
                    }
                    $scope.onConfig(conf);
                });
            };
			
        
            $scope.asDate = function(str){
                return moment(str, "MM/DD/YYYY", true).format("dddd, MMMM Do YYYY");
            };


            $rootScope.$on('event:loginConfirmed', function () {
                $scope.loadConfig();
            });

            $scope.init = function () {
                $scope.aEdit = false;
                $scope.cEdit = false;
                $scope.loadConfig();
            }

		},
		controllerAs: 'ctrl',
		bindToController: true
	};
});