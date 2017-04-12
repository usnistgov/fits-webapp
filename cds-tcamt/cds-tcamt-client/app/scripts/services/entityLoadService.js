/**
 * Created by Hossam Tamri on 4/9/17.
 */

angular.module('tcl').factory('EntityLoadService', function ($q, $http, ResponseService, EntityService, EntityUtilsService) {

    function LoadService() {
        var url = "testplans";
        var action = EntityService.action.LOAD;
        var ctrl = this;

        ctrl.loadTPs = function () {
            var deferred = $q.defer();
            var saveURL = EntityUtilsService.createURL(url);
            var type = EntityService.type.TEST_PLAN;

            $http.get(saveURL).then(function (response) {
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
        }
    }

    return new LoadService();
});