/**
 * Created by Hossam Tamri on 4/8/17.
 */

angular.module('tcl').factory('EntityService', function () {

    function Entity() {
        this.type = {
            TEST_CASE : 'Test Case',
            TEST_CASE_GROUP : 'Test Case Group',
            TEST_PLAN : 'Test Plan'
        };

        this.action = {
            SAVE : 'save',
            LOAD : 'load',
            DELETE : 'delete',
            IMPORT : 'import',
            EXECUTE : 'execute'
        };

        this.codes = {
            CONTAINER_IS_LOCAL : 'CONTAINER_IS_LOCAL',
            APP_ERROR : 'APP_ERROR',
            INCOMPLETE_TC : 'INCOMPLETE_TC'
        };

        this.severity = {
            ERROR : 'ERROR',
            WARNING : 'WARNING',
            SUCCESS : 'SUCCESS'
        }

    }

    return new Entity();
});

angular.module('tcl').factory('ResponseService', function (EntityService) {

    function ResponseFactory() {
        var ctrl = this;
        this.create = function (type, action, status, message, obj,code, additional, severity) {
            var response = {
                status : status,
                severity : severity,
                type : type,
                action : action,
                message : message,
                obj : obj,
                code : code,
                additional : additional
            };

            return response;
        };

        this.warn = function (type, action, message, obj, code) {
            return ctrl.create(type,action,false,message,obj,code, null, EntityService.severity.WARNING);
        };

        this.error = function (type, action, message, obj, code, additional) {
            return ctrl.create(type,action,false,message,obj,code, additional, EntityService.severity.ERROR);
        };

        this.success = function (type, action, message, obj) {
            return ctrl.create(type,action,true,message, obj, null, null, EntityService.severity.SUCCESS);
        };

        this.appError = function (type, action, message) {
            return {
                status : false,
                type : type,
                action : action,
                message : message,
                code : EntityService.codes.APP_ERROR
            };
        };
    }

    return new ResponseFactory();
});

angular.module('tcl').factory('EntityUtilsService', function () {

    function Utils() {

        var ctrl = this;
        var baseURL = "api/";

        this.createURL = function (url) {
            return baseURL+url;
        };

        this.isLocal = function (obj) {
            return !obj || obj._local;
        };

        this.inSynch = function (obj) {
            return obj && !ctrl.isLocal(obj) && !obj._changed;
        };

        this.findGroup = function (tp,group) {
            for(var g = 0; g < tp.testCaseGroups.length ; g++){
                if(tp.testCaseGroups[g].id === group){
                    return tp.testCaseGroups[g];
                }
            }
            throw "FITS : Group NOT Found (Grp : "+group+" )";
        };

        this.extractIDs = function (entity) {
            var ids = [];
            if(entity && entity.id){
                ids.push(entity.id);
                if(entity.hasOwnProperty("testCases")){
                    _.forEach(entity.testCases,function (tc) {
                        ids.push(tc.id);
                    });
                }
                if(entity.hasOwnProperty("testCaseGroups")){
                    _.forEach(entity.testCaseGroups,function (tg) {
                        ids.push(tg.id);
                        _.forEach(tg.testCases,function (tc) {
                            ids.push(tc.id);
                        });
                    });
                }
            }
            return ids;
        };

        this.locateEntityInList = function (list,entity) {
            return _.findIndex(list,function (o) {
                return entity && entity.id && o && o.id && o.id === entity.id;
            });
        };

        this.findTcInTp = function (tp,entity) {
            var lvl1 = _.findIndex(tp.testCases,function (o) {
                return entity && entity.id && o && o.id && o.id === entity.id;
            });

            if(~lvl1){
                return tp.testCases[lvl1];
            }
            else {
                var obj = null;
                _.forEach(tp.testCaseGroups,function (tg) {
                    var tmp = _.findIndex(tg.testCases,function (o) {
                        return entity && entity.id && o && o.id && o.id === entity.id;
                    });
                    if(~tmp){
                        obj = tg.testCases[tmp];
                    }
                });
                return obj;

            }
        };


        this.sanitizeTC = function (tc) {
            tc._dateType = tc.dateType;
            // if(tc.hasOwnProperty("errors") && tc.errors.length > 0){
            //     // _.forEach(tc.errors,function (error) {
            //     //     error._path = ctrl.sanitizeErrorPath(error.path);
            //     // });
            // }
            ctrl.sanitizeDates(tc);
        };

        this.capitalize = function (string) {
            return string.charAt(0).toUpperCase() + string.slice(1);
        };

        this.sanitizeErrorPath = function (path) {
            var result;
            var elements = path.split(".");
            for (var i = 0; i < elements.length; i++) {
                elements[i] = ctrl.capitalize(elements[i]);
            }
            path = elements.join(" ");
            result = path.replace('\\.', ' ');
            if (result.indexOf('Events[') !== -1) {
                result = result.replace('Events[', 'Vaccination Event ID # ');
                result = result.replace(']', ' ');
            }

            result = result.replace('Forecast', 'Forecast');
            result = result.replace('EvalDate Date', 'Assessment Date');
            result = result.replace('EvalDate', 'Assessment Date');
            result = result.replace('Dob Date', 'Date Of Birth');
            result = result.replace('Dob', 'Date Of Birth');
            result = result.replace('Dob Date', 'Date Of Birth');
            result = result.replace('Date Date', 'Date');
            return result;
        };


        this.sanitizeTP = function (tp) {
            ctrl.sanitizeDates(tp.metaData);
            _.forEach(tp.testCaseGroups, function(tg) {
                ctrl.sanitizeTG(tg);
            });
            _.forEach(tp.testCases, function(tc) {
                ctrl.sanitizeTC(tc);
            });
        };

        this.sanitizeTG = function (tg) {
            _.forEach(tg.testCases, function(tc) {
                ctrl.sanitizeTC(tc);
            });
        };

        this.sanitizeDate = function (obj) {
            if (obj) {
                if (obj.hasOwnProperty("type")) {
                    if (obj.type === 'fixed') {
                        obj._dateObj = new Date(obj.date);
                    }
                }
            }
        };

        this.sanitizeDates = function (obj) {
            if (typeof obj === 'object') {
                if (Array.isArray(obj)) {
                    for (var i = 0; i < obj.length; i++) {
                        ctrl.sanitizeDates(obj[i]);
                    }
                }
                else {
                    for (var x in obj) {
                        if(obj.hasOwnProperty(x)){
                            if (~x.search(/date/i) || ~x.search(/earliest/i) || ~x.search(/recommended/i) ||  ~x.search(/complete/i) || ~x.search(/dob/i) || ~x.search(/pastDue/i)) {
                                if (typeof obj[x] === 'number') {
                                    obj["_" + x] = new Date(obj[x]);
                                }
                                else {
                                    ctrl.sanitizeDate(obj[x]);
                                }
                            }
                            else {
                                ctrl.sanitizeDates(obj[x]);
                            }
                        }
                    }
                }
            }
        };

        this.transformTP = function (tp) {
            return {
                id : tp.id,
                name : tp.name,
                version : tp.metaData.version,
                changeLog : tp.metaData.changeLog,
                description : tp.description
            };
        };

        this.transformTG = function (gp) {
            return {
                id : gp.id,
                name : gp.name,
                description : gp.description
            };
        };
    }

    return new Utils();
});