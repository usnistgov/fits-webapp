/**
 * Created by hnt5 on 12/31/17.
 */
app.directive('dateLocal', ['$parse', '$rootScope', '$filter', function ($parse,$rootScope,$filter) {
    var directive = {
        restrict: 'A',
        require: ['ngModel'],
        link: link
    };
    return directive;

    function link(scope, element, attr, ctrls) {
        var ngModelController = ctrls[0];

        // called with a JavaScript Date object when picked from the datepicker
        ngModelController.$parsers.push(function (viewValue) {
            if (!viewValue) {
                return undefined;
            }
            return $rootScope.toUTC(viewValue);
        });

        // called with a Unix timestamp to format
        ngModelController.$formatters.push(function (modelValue) {
            if (!modelValue) {
                return undefined;
            }

            var dt = new Date(modelValue);
            dt.setMinutes(dt.getMinutes() + dt.getTimezoneOffset());
            return dt;
        });
    }
}]);