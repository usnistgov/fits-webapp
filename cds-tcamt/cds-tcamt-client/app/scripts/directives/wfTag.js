/**
 * Created by haffo on 4/5/15.
 */
angular.module('tcl').directive('wfTag', [ function() {
        return {
            restrict: 'E',
            template : "<span  style='background-color: {{wft.colorFor(code)}}; padding: 0 !important; margin-right: 5px; font-size: 10px;' class='badge'>&nbsp;</span>",
            scope : {
                code : '='
            },
            controllerAs : 'wft',
            controller : function () {

                var ctrl = this;

                this.colors = {
                    SUGGESTED : "lightgreen",
                    DELETED : "lightcoral",
                    ONHOLD : "orange",
                    FINAL : "blue"
                };

                ctrl.colorFor = function (x) {
                    if(ctrl.colors.hasOwnProperty(x))
                        return ctrl.colors[x];
                    else
                        return "grey";
                }
            }
        }
}]);
