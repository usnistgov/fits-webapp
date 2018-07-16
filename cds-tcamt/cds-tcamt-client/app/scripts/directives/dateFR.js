angular.module('tcl').directive('dateChoose', function() {
	return {
		templateUrl : 'date.html',
		restrict : 'E',
		scope	 : {
			dt  : "=",
			type : "=",
			label    : "=",
			events : "=",
			nullable : "=",
			exclude : "="
		},
		controller : function($scope, $rootScope) {
			var ctrl = this;

            $scope.$watch('ctrl.type', function (newValue, oldValue) {
                if(oldValue && newValue && ctrl.dt && ctrl.dt.type !== newValue.toLowerCase()){
                	if(newValue === 'FIXED'){
						ctrl.dt = ctrl.createFixed();
					}
					else if(newValue === 'RELATIVE'){
                        ctrl.dt = ctrl.createRelative();
					}
				}
            });

            $scope.dateIsValid = function(str){
                return moment(str, "MM/DD/YYYY", true).isValid();
            };

            $scope.printDate = function(str){
                return moment(str, "MM/DD/YYYY").format("dddd, MMMM Do YYYY");
            };

            ctrl.toggle = function () {
            	if(ctrl.nullable){
                    if(ctrl.dt){
                        ctrl.dt = null;
                    }
                    else {
                        if(ctrl.type === 'FIXED'){
                            ctrl.dt = ctrl.createFixed();
                        }
                        else if(ctrl.type === 'RELATIVE'){
                            ctrl.dt = ctrl.createRelative();
                        }
                    }
				}
            };

            $scope.dateChange = function(str){
              if(!$scope.dateIsValid(str)) str = "";
            };

            ctrl.notCircular = function (event) {
            	if(event && event.date && event.date.rules && event.date.rules.length > 0){
            		for(var i = 0; i < event.date.rules.length; i++){
            			if(event.date.rules[i] && event.date.rules[i].relativeTo && event.date.rules[i].relativeTo.reference === 'dynamic' && event.date.rules[i].relativeTo.id+'' === ctrl.exclude+''){
							return false;
						}
					}
				}
				return true;
            };

			ctrl.createFixed = function(){
				return {
					type : "fixed",
					dateString : ""
				};
			};
			ctrl.createRelative = function(){
				return {
                    type : "relative",
					rules : []
				}
			};
            ctrl.refType = function (rule) {
            	if(rule.relativeTo.id && rule.relativeTo.id !== ''){
            		if(rule.relativeTo.id === 'DOB' && rule.position === 'BEFORE'){
                        rule.position = 'AFTER';
					}
				}
            };
            ctrl.createRule = function(){
                return {
                    position : 'AFTER',
                    year : 0,
					month : 0,
                    week : 0,
					day : 0,
					relativeTo : null
                }
            };
            ctrl.createStaticReference = function(type){
				return {
					reference : "static",
					id : type
				}
            };
            ctrl.createDynReference = function(id){
                return {
                    reference : "dynamic",
                    id : id
                }
            };

            ctrl.staticDOB = ctrl.createStaticReference('DOB');
            ctrl.staticEVAL = ctrl.createStaticReference('EVALDATE');

			// ctrl.dateChange = function(dateObj){
			//     console.log(dateObj._dateObj);
			//     console.log(dateObj._dateObj.getTime());
             //    console.log($rootScope.toUTC(dateObj._dateObj));
			// 	dateObj.date = $rootScope.toUTC(dateObj._dateObj);
			// };
			
		},
		controllerAs: 'ctrl',
		bindToController: true
	};
});