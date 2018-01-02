/**
 * Created by Hossam Tamri on 4/9/17.
 */


angular.module('tcl').factory('FITSBackEnd', function ($q, TrashService, EntityService, SaveService, EntityLoadService, ShareService) {

    function BackEnd() {
        var ctrl = this;

        // lists, obj, type
        ctrl.delete = TrashService.deleteEntity;
        // (wire, type, obj, container)
        ctrl.save = SaveService.save;
        // (wire, obj, tp)
        ctrl.saveAll = SaveService.saveAll;
        // ACCESS
        ctrl.loadTPSByAccess = EntityLoadService.loadTPSByAccess;
        // NO ARG
        ctrl.loadSharedTestPlans = EntityLoadService.loadViewTPs;
        // tpId, user
        ctrl.shareTestPlan = ShareService.share;
        // tpId, user
        ctrl.unshareTestPlan = ShareService.unshare;
        // tpId, bool
        ctrl.makePublic = ShareService.public;
    }
    return new BackEnd();

});