/**
 * Created by Hossam Tamri on 4/9/17.
 */


angular.module('tcl').factory('FITSBackEnd', function ($q, TrashService, SaveService, EntityLoadService) {

    function BackEnd() {
        var ctrl = this;

        // lists, obj, type
        ctrl.delete = TrashService.deleteEntity;
        // (wire, type, obj, container)
        ctrl.save = SaveService.save;
        // NO ARG
        ctrl.loadTestPlans = EntityLoadService.loadTPs;

    }
    return new BackEnd();

});