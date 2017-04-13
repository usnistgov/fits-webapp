/**
 * Created by Hossam Tamri on 4/8/17.
 */

angular.module('tcl').factory('SaveService', function ($timeout, PopUp, $q, ResponseService, TCSaveService, TPSaveService, TGSaveService, EntityService) {

    function SaveService() {
        var ctrl = this;
        var action = EntityService.action.SAVE;

        this.save = function (wire, type, obj, container) {
            var delay = $q.defer();

            if(ctrl.checkArguments(type, obj, container)){
                ctrl.routeSaveRequest(wire, type, obj, container, delay).then(function (response) {
                    delay.resolve(response);
                });
            }
            else {
                delay.resolve(ResponseService.appError(type,action,"INVALID ARGUMENTS"));
            }

            return delay.promise;
        };

        this.checkArguments = function (type, obj, container) {
            if(type === EntityService.type.TEST_CASE || type === EntityService.type.TEST_CASE_GROUP){
                return obj && container;
            }
            else if(type === EntityService.type.TEST_PLAN){
                return obj;
            }
        };

        this.handleError = function (wire, type, obj, error, container, deferred) {
            if(!error.status && error.code && error.code === EntityService.codes.CONTAINER_IS_LOCAL) {
                var additional = error.additional;
                ctrl.routeSaveRequest(wire, additional.container_type, additional.container_obj, container, deferred).then(function (response) {
                    if(response.status){
                        ctrl.routeSaveRequest(wire, type, obj, error, container, deferred)
                    }
                    else {
                        ctrl.handleError(wire, additional.container_type, additional.container_obj, response, container, deferred)
                    }
                });
            }
            else {
                deferred.resolve(error);
            }
        };

        this.routeSaveRequest = function (wire, type, obj, container) {
            var delay = $q.defer();

            this.promiseHandler = function (response) {
                if (response.status) {
                    delay.resolve(response);
                }
                else {
                    var error = response;
                    if(!error.status && error.code && error.code === EntityService.codes.CONTAINER_IS_LOCAL) {
                        var additional = error.additional;
                        ctrl.routeSaveRequest(wire, additional.container_type, additional.container_obj, container).then(function (containerSaveResponse) {
                            if(containerSaveResponse.status){
                                ctrl.routeSaveRequest(wire, type, obj, container).then(function (objSaveResponse) {
                                    delay.resolve(objSaveResponse);
                                });
                            }
                            else {
                                delay.resolve(containerSaveResponse);
                            }
                        });
                    }
                    else {
                        delay.resolve(response);
                    }
                }
            };

            if(type === EntityService.type.TEST_CASE){
                TCSaveService.save(wire, container, obj).then(this.promiseHandler);
            }
            else if(type === EntityService.type.TEST_CASE_GROUP){
                TGSaveService.save(wire, container, obj).then(this.promiseHandler);
            }
            else if(type === EntityService.type.TEST_PLAN){
                TPSaveService.save(wire, obj).then(this.promiseHandler);
            }
            else {
                throw "FITS : Save Unknown Type";
            }

            return delay.promise;
        };

    }

    return new SaveService();

});

angular.module('tcl').factory('TCSaveService', function (DataSynchService, EntityUtilsService, ResponseService, EntityService, $q, $http) {

    function SaveService() {
        var url = "testcase/save";
        var type = EntityService.type.TEST_CASE;
        var action = EntityService.action.SAVE;
        var ctrl = this;


        ctrl.save = function (wire,tp,tc){
            var deferred = $q.defer();
            var location = ctrl.location(tc);
            var saveURL = EntityUtilsService.createURL(url);

            if(ctrl.canSave(tp,tc,location)){

                var _tc = DataSynchService.clean(tc);

                $http.post(saveURL,_tc).then(function (response) {

                    EntityUtilsService.sanitizeTC(response.data);

                    tc.errors = response.data.errors;
                    _.merge(tc,response.data);

                    wire.$broadcast('entity_saved', tc, tc);
                    if(tc.runnable){
                        deferred.resolve(ResponseService.success(type,action, "Test Case Saved Successfully", tc));}
                    else{
                        deferred.resolve(ResponseService.warn(type,action, "Test Case saved, but cannot be run due to incomplete testing data", tc ,EntityService.codes.INCOMPLETE_TC));
                    }

                },
                function (error) {
                    deferred.resolve(ResponseService.error(type,action, "Failed To Save Test Case", error));
                });

            }
            else {

                var additional_data = {
                    container_type : location,
                    container_obj  : location === EntityService.type.TEST_PLAN ? tp : EntityUtilsService.findGroup(tp,tc.group)
                };

                deferred.resolve(ResponseService.error(type,action, "Container is local", tc, EntityService.codes.CONTAINER_IS_LOCAL,additional_data));
            }

            return deferred.promise;
        };

        ctrl.canSave = function (tp,tc,location) {
            if(location === EntityService.type.TEST_CASE_GROUP){
                var grp = EntityUtilsService.findGroup(tp,tc.group);

                if(grp){
                    return !EntityUtilsService.isLocal(grp);
                }
                return false;
            }
            else if(location === EntityService.type.TEST_PLAN){
                return !EntityUtilsService.isLocal(tp);
            }
            else {
                throw "FITS : Unknown location of TestCase "+tc.id;
            }
        };

        ctrl.location = function (tc) {
            if(tc.group && tc.group !== ""){
                return EntityService.type.TEST_CASE_GROUP;
            }
            else {
                return EntityService.type.TEST_PLAN;
            }
        };
    }

    return new SaveService();

});

angular.module('tcl').factory('TPSaveService', function (DataSynchService, EntityUtilsService, ResponseService, EntityService, $q, $http) {

    function SaveService() {
        var url = "testplan/save";
        var type = EntityService.type.TEST_PLAN;
        var action = EntityService.action.SAVE;
        var ctrl = this;

        ctrl.save = function (wire,tp){
            var deferred = $q.defer();
            var saveURL = EntityUtilsService.createURL(url);

            var _tp = DataSynchService.clean(tp);
            $http.post(saveURL,_tp).then(function (response) {
                // ---- Carve
                delete response.data.testCases;
                delete response.data.testCaseGroups;
                // ----------
                EntityUtilsService.sanitizeTP(response.data);
                _.merge(tp,response.data);

                wire.$broadcast('entity_saved', tp, EntityUtilsService.transformTP(tp));
                deferred.resolve(ResponseService.success(type,action, "Test Plan Saved Successfully", tp));
            },
            function (error) {
                deferred.resolve(ResponseService.error(type,action, "Failed To Save Test Case", error));
            });
            return deferred.promise;
        };


    }

    return new SaveService();

});

angular.module('tcl').factory('TGSaveService', function (DataSynchService, EntityUtilsService, ResponseService, EntityService, $q, $http) {

    function SaveService() {
        var url = "testcasegroup/save";
        var type = EntityService.type.TEST_CASE_GROUP;
        var action = EntityService.action.SAVE;
        var ctrl = this;

        ctrl.save = function (wire,tp,tg){
            var deferred = $q.defer();

            if(ctrl.canSave(tp)){
                var saveURL = EntityUtilsService.createURL(url);

                var _tg = DataSynchService.clean(tg);
                $http.post(saveURL,_tg).then(function (response) {

                    //---- Carve
                    delete response.data.testCases;
                    //----------

                    EntityUtilsService.sanitizeTG(response.data);
                    _.merge(tg,response.data);

                    wire.$broadcast('entity_saved', tg, EntityUtilsService.transformTG(tg));
                    deferred.resolve(ResponseService.success(type,action, "Test Case Group Saved Successfully", tg));
                },
                function (error) {
                    deferred.resolve(ResponseService.error(type,action, "Failed To Save Test Case Group", error));
                });
            }
            else {

                var additional_data = {
                    container_type : EntityService.type.TEST_PLAN,
                    container_obj  : tp
                };

                deferred.resolve(ResponseService.error(type,action, "Container is local", tg, EntityService.codes.CONTAINER_IS_LOCAL,additional_data));
            }

            return deferred.promise;
        };

        ctrl.canSave = function (tp) {
            return !EntityUtilsService.isLocal(tp);
        };

    }

    return new SaveService();

});