/**
 * Created by hnt5 on 4/6/17.
 */

angular.module('tcl').factory('DataSynchService', function (TestObjectUtil,EntityUtilsService) {
    function DataSynch() {

        var ctrl = this;
        var ledger = {};

        ctrl.clean  = function (object,exclude) {
            var obj = angular.copy(object);
            if(exclude){
                TestObjectUtil.cleanObject(obj, exclude);
            }

            TestObjectUtil.cleanObject(obj, new RegExp("^[_$]+.*"));
            return obj;
        };
        
        ctrl.fingerprint = function (obj,exclude) {
            var clone = ctrl.clean(obj,exclude);
            return objectHash.MD5(clone);
        };

        ctrl.unregister = function (id) {
            delete ledger[id];
        };

        ctrl.register = function (object,exclude,edit) {
            var obj = ctrl.edit(object,edit);
            if(Array.isArray(obj)){
                for(var i = 0; i < obj.length; i++){
                    ctrl.register(obj[i]);
                }
            }
            else if(typeof obj === 'object'){
                if(obj.hasOwnProperty("id") && !ledger.hasOwnProperty(obj.id) && EntityUtilsService.inSynch(obj)){
                    ledger[obj.id] = ctrl.fingerprint(obj,exclude);
                }
            }
        };

        ctrl.edit = function (what,how) {
            if(how){
                return how(what);
            }
            else {
                return what;
            }
        };

        ctrl.changed = function (object,exclude,edit) {
            var obj = ctrl.edit(object,edit);
            if(obj && obj.hasOwnProperty("id") && typeof obj.id === 'string' && obj.id !== ""){
                if(ledger.hasOwnProperty(obj.id)){
                    return ctrl.fingerprint(obj,exclude) !== ledger[obj.id];
                }
                return true;
            }
            else {
                throw "Object has No ID or ID is invalid";
            }
        };

        ctrl.clear = function () {
            ledger = {};
        };

        ctrl.save = function (object,exclude,edit) {
            var obj = ctrl.edit(object,edit);
            if(obj.hasOwnProperty("id") && typeof obj.id === 'string' && obj.id !== "") {
                ledger[obj.id] = ctrl.fingerprint(obj,exclude);
            }
            else {
                throw "Object has No ID or ID is invalid";
            }
        };



    }
    return new DataSynch();
});