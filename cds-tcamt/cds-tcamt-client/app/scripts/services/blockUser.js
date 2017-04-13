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

        // $rootScope.$on("block_ui",function (ev,message) {
        //     ctrl.start(message);
        //     console.log("START "+start);
        // });
        //
        // $rootScope.$on("free_ui",function () {
        //     ctrl.stop();
        //     console.log("START "+stop);
        // });

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

                $timeout(function () {
                    ctrl.myDiag.close();
                },0);
            }
        };

    }

    return new Block();
});

angular.module('tcl').controller('BlockCtrl',
    function ($scope, $uibModalInstance, msg) {
        $scope.message = msg;
});