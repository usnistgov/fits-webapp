/**
 * Created by Hossam Tamri on 4/9/17.
 */

angular.module('tcl').factory('EntityLoadService', function ($q, $http, ResponseService, EntityService, EntityUtilsService) {

    function LoadService() {
        var urlTP = "testplans";
        var urlTPv = "vOnly/testplans";
        var urlExecTP = "exec/tps";
        var urlTPArchived = "archived/testplans";

        var action = EntityService.action.LOAD;
        var ctrl = this;

        ctrl.loadTP = function (id) {
            var deferred = $q.defer();
            var URL = EntityUtilsService.createURL("testplan/" + id);
            var type = EntityService.type.TEST_PLAN;

            $http.get(URL).then(function (response) {
                    var tp = response.data;
                    EntityUtilsService.sanitizeTP(tp);
                    deferred.resolve(ResponseService.success(type,action, "Test Plan Loaded Successfully", tp));
                },
                function (error) {
                    deferred.resolve(ResponseService.error(type,action, "Failed To Load Test Plan", error));
                });

            return deferred.promise;
        };

        ctrl.loadTPList = function (url) {
            var deferred = $q.defer();
            var URL = EntityUtilsService.createURL(url);
            var type = EntityService.type.TEST_PLAN;

            $http.get(URL).then(function (response) {
                var tps = response.data;
                for(var tpI = 0; tpI < tps.length; tpI++){
                    EntityUtilsService.sanitizeTP(tps[tpI]);
                }
                deferred.resolve(ResponseService.success(type,action, "Test Plans Loaded Successfully", tps));
            },
            function (error) {
                deferred.resolve(ResponseService.error(type,action, "Failed To Load Test Plans", error));
            });

            return deferred.promise;
        };

        ctrl.loadTPSByAccess = function (type) {
            if(type === EntityService.access.READ_ONLY){
                return ctrl.loadTPList(urlTPv);
            }
            else if(type === EntityService.access.WRITE){
                return ctrl.loadTPList(urlTP);
            }
            else if(type === EntityService.access.EXEC){
                return ctrl.loadTPList(urlExecTP);
            }
            else if(type === EntityService.access.ARCHIVED){
                return ctrl.loadTPList(urlTPArchived);
            }
        };
    }

    return new LoadService();
});