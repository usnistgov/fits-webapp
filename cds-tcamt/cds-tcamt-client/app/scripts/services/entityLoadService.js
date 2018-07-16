/**
 * Created by Hossam Tamri on 4/9/17.
 */

angular.module('tcl').factory('EntityLoadService', function ($q, $http, ResponseService, EntityService, EntityUtilsService) {

    function LoadService() {
        var urlTP = "testplans";
        var urlTPv = "vOnly/testplans";
        var urlExecTP = "exec/tps";
        var action = EntityService.action.LOAD;
        var ctrl = this;

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
        };
    }

    return new LoadService();
});