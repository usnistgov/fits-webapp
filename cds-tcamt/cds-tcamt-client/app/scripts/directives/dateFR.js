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
		controller : function($scope,$rootScope) {
			var ctrl = this;
			
			$scope.$watch('ctrl.dt', function (newValue, oldValue, scope) {
				if(!ctrl.change)
					ctrl.init();
				else
					ctrl.change = false;
			});
			
			ctrl.init = function(){
				ctrl.change = true;
				ctrl.errRelative = "";
				if(ctrl.dt.hasOwnProperty("fixed") && ctrl.dt.hasOwnProperty("relative") && ctrl.dt.hasOwnProperty("type")){
					ctrl.type  = ctrl.dt.type;
				}
				else if(ctrl.dt.hasOwnProperty("fixed")){
					ctrl.dt.type = "fixed";
					ctrl.dt.relative = {
							relativeTo : "",
							year : 0,
							month : 0,
							day : 0
					};
				}
				else if(ctrl.dt.hasOwnProperty("relative")){
					ctrl.dt.type = "relative";
					ctrl.dt.fixed = {
							obj : new Date()
					};
					ctrl.dt.fixed.date = ctrl.dt.fixed.obj.getTime();
				}
			};
			
			ctrl.dateChange = function(dateObj){
				console.log("change");
				dateObj.date = dateObj.obj.getTime();
			};
			
//			ctrl.init = function(){
//				ctrl.type = "";
//				ctrl.fixedDateObj = {
//						fixed : {
//							obj : new Date()
//						}
//				};
//				ctrl.fixedDateObj.fixed.date = ctrl.fixedDateObj.fixed.obj.getTime();
//				ctrl.errRelative = "";
//				ctrl.relativeDateObj = {
//						relative : {
//							relativeTo : "",
//							year : 0,
//							month : 0,
//							day : 0
//						}
//				};
//				console.log("Handling Date L : "+ctrl.label);
//				if(ctrl.dt.hasOwnProperty("fixed")){
//					console.log("Is Fixed");
//					ctrl.type  = "fixed";
//					ctrl.fixedDateObj = $.extend(true, {},ctrl.dt);
//				}
//				else if(ctrl.dt.hasOwnProperty("relative")){
//					ctrl.type = "relative";
//					ctrl.relativeDateObj = $.extend(true, {},ctrl.dt);
//				}
//				else {
//					ctrl.type = "fixed";
//					ctrl.dt = $.extend(true, {},ctrl.fixedDateObj);
//				}
//			};
			
			
//			$scope.$watch('ctrl.dt.type', function (newValue, oldValue, scope) {
//				console.log("WATCH "+newValue);
//			    if(newValue === "fixed"){
//			    	ctrl.dt.type = "fixed";
//			    }
//			    else if (newValue === "relative"){
//			    	ctrl.dt.type = "relative";
//			    }
//			});
			
			$scope.$watch('ctrl.dt.relative.relativeTo', function (newValue, oldValue, scope) {
			    if(newValue && newValue != ""){
			    	if(!ctrl.validate(ctrl.dt,[])){
			    		console.log("Not Valid");
			    		ctrl.dt.type  = "error";
			    		ctrl.errRelative = newValue;
			    		ctrl.dt.relative.relativeTo = "";
			    	}
			    }
			});
			
			ctrl.dismiss = function(){
				ctrl.dt.type  = "relative";
			};
			
			ctrl.filter = function(date){
				if(date){
					if(date.hasOwnProperty("type")){
						if(date.type === "relative"){
							return {obj : date.relative, type : "relative"};
						}
						else if(date.type === "fixed"){
							return {obj : date.fixed, type : "fixed"};
						}
						else
							return null;
					}
					else {
						if(date.hasOwnProperty("fixed")){
							return {obj : date.fixed, type : "fixed"};
						}
						else if(date.hasOwnProperty("relative")){
							return {obj : date.relative, type : "relative"};
						}
						else
							return null;
					}
				}
				else
					return null;
			};
			
			ctrl.resolvable = function(date){
				if(date.type === "fixed"){
					return true;
				}
				else if(date.type === "relative" && date.obj.hasOwnProperty("relativeTo") && date.obj.relativeTo === "Today"){
					return true;
				}
				else {
					return false;
				}
			};
			
			ctrl.validate = function(date,stack){
				var _date = ctrl.filter(date);
				console.log(date);
				console.log(_date);
				if(_date){
					if(ctrl.resolvable(_date)){
						console.log("is Resolvable");
						return true;
					}
					else {
						if(_date.type === "relative" && _date.obj.hasOwnProperty("relativeTo")){
							console.log("is not resolvable");
							if(_date.obj.relativeTo === "DOB" && stack.indexOf("DOB") === -1){
								console.log("check DOB");
								stack.push("DOB");
								return ctrl.validate(ctrl.tc.patient.dob,stack)
							}
							else if(_date.obj.relativeTo === "EvalDate" && stack.indexOf("EvalDate") === -1){
								console.log("check EvalDate");
								stack.push("EvalDate");
								return ctrl.validate(ctrl.tc.evalDate,stack);
							}
							else if(_date.obj.relativeTo === "Today"){
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