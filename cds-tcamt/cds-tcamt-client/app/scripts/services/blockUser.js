/**
 * Created by Hossam Tamri on 4/11/17.
 */

angular.module('tcl').factory('PopUp', function ($rootScope,$modal,$timeout) {
    function Block() {
        var ctrl = this;
        var on = false;
        ctrl.myDiag = null;

        ctrl.start = function (message) {
            ctrl.open(message);
        };


        ctrl.stop = function () {
            ctrl.close();
        };

        ctrl.open = function (message) {
            var txt;

            if(!message){
                txt = "Loading";
            }
            else {
                txt = message;
            }

            ctrl.myDiag = $modal.open({
                templateUrl: 'Block.html',
                controller: 'BlockCtrl',
                backdrop : 'static',
                keyboard : false,
                resolve: {
                    msg : function () {
                        return txt;
                    }
                }
            });

        };

        ctrl.close = function () {
            if(ctrl.myDiag){
                ctrl.myDiag.close();
            }
        };

    }

    return new Block();
});

angular.module('tcl').controller('BlockCtrl',
    function ($scope, $uibModalInstance, msg) {
        $scope.message = msg;
});