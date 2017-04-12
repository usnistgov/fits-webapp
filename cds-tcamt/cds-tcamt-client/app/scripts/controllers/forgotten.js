'use strict';

angular.module('tcl')
.controller('ForgottenCtrl', ['$scope', '$resource','Notification',
    function ($scope, $resource,Notification) {
        var ForgottenRequest = $resource('api/sooa/accounts/passwordreset', {username:'@username'});

        $scope.requestResetPassword =  function() {
            var resetReq = new ForgottenRequest();
            resetReq.username = $scope.username;
            resetReq.$save(function() {
                console.log("RESET");
                console.log(resetReq);
                console.log(resetReq.text);
                if ( resetReq.text === 'resetRequestProcessed' ) {
                    Notification.success({message:"An e-mail with instructions on how to reset  has been sent ", delay:1500});
                    $scope.username = '';
                }
                else {
                    Notification.error({message:"The username/email address was not recognized. The reset request wont be processed", delay:1500});
                }
            });
        };
    }
]);
