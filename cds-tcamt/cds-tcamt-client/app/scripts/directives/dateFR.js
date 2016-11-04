angular.module('tcl').directive('dateChoose', function() {
	return {
		templateUrl : 'date.html',
		restrict : 'E',
		scope	 : {
			dt  : "=",
			label    : "=",
			tc : "=",
			exclude : "="
		},
		controller : function($scope) {
			var ctrl = this;
			$scope.type = "";
			$scope.relativeTo = "";
			$scope.year = 0;
			$scope.month = 0;
			$scope.day = 0;
			
			var fixedObj = {};
			var relativeObj = {};
			console.log($scope);
			
			if(ctrl.dt.hasOwnProperty("fixed")){
				$scope.type = "fixed";
				ctrl.fixedObj = ctrl.dt.fixed;
			}
			else if(ctrl.dt.hasOwnProperty("relative")){
				$scope.type = "relative";
				ctrl.relativeObj = ctrl.dt.relative;
			}
			else {
				$scope.type = "fixed";
				ctrl.dt = {
						fixed : fixedObj
				};
			}
			
			$scope.$watch('type', function (newValue, oldValue, scope) {
			    if(newValue === "fixed"){
			    	var obj = {
			    			fixed : ctrl.fixedObj
			    	};
			    	if($scope.validate(obj)){
			    		ctrl.dt = obj;
			    	}
			    	else {
//			    		console.log("Invalid Date");
			    	}
			    }
			    else {
			    	var obj = {
			    			relative : {
			    				relativeTo : $scope.relativeTo,
			    				year : $scope.year,
			    				month : $scope.month,
			    				day : $scope.day = 0
			    			}
			    	};
			    	if($scope.relativeTo !== ""){
				    	if($scope.validate(obj)){
				    		ctrl.dt = obj;
				    	}
				    	else {
//				    		console.log("Type Watch Invalid Date");
				    	}
			    	}
			    	else {
			    		ctrl.dt = obj;
			    	}
			    }
			});
			
			$scope.$watch('relativeTo', function (newValue, oldValue, scope) {
				$scope.relativeTo = newValue;
			    if($scope.type === "relative"){
			    	if(!$scope.validate(ctrl.dt)){
			    		console.log("relativeTo Invalid Date");
			    		console.log($scope.relativeTo);
			    		console.log(newValue);
			    	}
			    }
			});
			
			$scope.resolvable = function(date){
				if(date && date.hasOwnProperty("fixed")){
					return true;
				}
				else if(date && date.hasOwnProperty("relative") && date.relative.hasOwnProperty("relativeTo") && date.relative.relativeTo === "Today"){
					return true;
				}
				else {
					return false;
				}
			};
			
			$scope.validate = function(_date){
				console.log("Validating Date");
				console.log(_date);
				if(_date){
					if($scope.resolvable(_date)){
						console.log("is Resolvable");
						return true;
					}
					else {
						if(_date.hasOwnProperty("relative") && _date.relative.hasOwnProperty("relativeTo")){
							console.log("is not resolvable");
							if(_date.relative.relativeTo === "DOB"){
								console.log("check DOB");
								return $scope.validate(ctrl.tc.patient.dob)
							}
							else if(_date.relative.relativeTo === "EvalDate"){
								console.log("check EvalDate");
								return $scope.validate(ctrl.tc.evalDate);
							}
							else if(ctrl.dt.relativeTo === "Today"){
								console.log("is Today");
								return true;
							}
						}
						else
							return false;
					}
				}
				
				return false;
				
			};
			
		},
		controllerAs: 'ctrl',
		bindToController: true
	};
});