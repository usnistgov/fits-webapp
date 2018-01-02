/**
 * Created by Hossam Tamri on 4/8/17.
 */

angular.module('tcl').factory('ShareService', function ($q, $http, EntityUtilsService, ResponseService, EntityService) {

    function ShareService() {
        var ctrl = this;
        var url = {
            share : 'share',
            unshare : 'unshare',
            public : 'public'
        };

        var action = EntityService.action.SHARE;
        var type = EntityService.type.TEST_PLAN;

        this.public = function (tpId, bool) {
            var delay = $q.defer();
            var URL = EntityUtilsService.createURL(url.public);
            URL += '/'+tpId+'/'+bool;
            var msg = bool ? 'public' : 'private';
            $http.post(URL).then(function (result) {

                    delay.resolve(ResponseService.success(type,action, "Test Plan made "+msg+" Successfully", null));
                },
                function (error) {
                    delay.resolve(ResponseService.error(type,action, "Failed to make Test Plan "+msg, null));
                });

            return delay.promise;
        };

        this.share = function (tpId, user) {
            var delay = $q.defer();
            var URL = EntityUtilsService.createURL(url.share);
            var shareObj = {
                userId : user,
                tpId : tpId
            };

            $http.post(URL,shareObj).then(function (result) {
                delay.resolve(ctrl.createResponse(result.data));
            },
            function (error) {
                delay.resolve(ResponseService.error(type,action, "Failed to Share Test Plan", null));
            });

            return delay.promise;
        };

        this.unshare = function (tpId, user) {
            var delay = $q.defer();
            var URL = EntityUtilsService.createURL(url.unshare);
            var shareObj = {
                userId : user,
                tpId : tpId
            };

            $http.post(URL,shareObj).then(function (result) {
                delay.resolve(ResponseService.success(type,action, "Test Plan Unshared Successfully", null));
            },
            function (error) {
                delay.resolve(ResponseService.error(type,action, "Failed to Unshare Test Plan", null));
            });

            return delay.promise;
        };

        this.createResponse = function (result) {
            if(result.status){
                return ResponseService.success(type,action, "Test Plan Shared Successfully", null);
            }
            else {
                if(result.code === 'user-not-found'){
                    return ResponseService.error(type,action, "No user '"+result.id+"' found", null);
                }
                else if(result.code === 'tp-not-found'){
                    return ResponseService.error(type,action, "No testplan '"+result.id+"' found", null);
                }
                else if(result.code === 'self'){
                    return ResponseService.error(type,action, "You can't share a Test Plan with yourself", null);
                }
                else {
                    return ResponseService.error(type,action, "Failed to share Test Plan", null);
                }
            }
        }
    }

    return new ShareService();

});
