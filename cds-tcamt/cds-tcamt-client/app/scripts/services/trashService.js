/**
 * Created by Hossam Tamri on 4/8/17.
 */

angular.module('tcl').factory('TrashService', function (EntityUtilsService, ResponseService, EntityService, $q, $http) {

    function TrashService() {
        var deleteTC = "testcase/{id}/delete";
        var deleteTP = "testplan/{id}/delete";
        var deleteTG = "testcasegroup/{id}/delete";
        var action = EntityService.action.DELETE;
        var ctrl = this;

        ctrl.deleteEntity = function (lists, obj, type) {
            var deferred = $q.defer();
            var url = ctrl.deleteURL(type,obj.id);

            if(EntityUtilsService.isLocal(obj)){
                ctrl.clean(lists, obj);
                deferred.resolve(ResponseService.success(type,action, "Deleted Successfully", null));
            }
            else {

                $http.delete(url).then(function () {
                    ctrl.clean(lists, obj);
                    deferred.resolve(ResponseService.success(type,action, "Deleted Successfully", null));
                },
                function (error) {
                    deferred.resolve(ResponseService.error(type,action, "Failed to delete", error));
                });

            }

            return deferred.promise;
        };

        ctrl.deleteURL = function (type, id) {
            if(type === EntityService.type.TEST_CASE){
                return EntityUtilsService.createURL(deleteTC.replace("{id}",id));
            }
            else if(type === EntityService.type.TEST_CASE_GROUP){
                return EntityUtilsService.createURL(deleteTG.replace("{id}",id));
            }
            else if(type === EntityService.type.TEST_PLAN){
                return EntityUtilsService.createURL(deleteTP.replace("{id}",id));
            }
            throw "FITS : Unknown Entity Type";
        };

        ctrl.clean = function (lists,obj) {
            for(var i = 0; i < lists.length; i++){
                ctrl.remove(lists[i],obj);
            }
        };

        ctrl.remove = function (list,obj) {
            var i = EntityUtilsService.locateEntityInList(list,obj);
            if(~i){
                list.splice(i,1);
            }
        };

    }

    return new TrashService();

});
