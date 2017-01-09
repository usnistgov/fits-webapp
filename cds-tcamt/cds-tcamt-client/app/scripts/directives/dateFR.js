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
			ctrl.typeAttr  = "_type";
			ctrl.createFixed = function(){
				return {
					date : "",
					_dateObj : null
				};
			};
			ctrl.createRelative = function(){
				return {
					relativeTo : "",
					year : 0,
					month : 0,
					day : 0
				}
			};
			ctrl.createNew = function(){
				var obj = {};
				obj.fixed = ctrl.createFixed();
				obj.relative = ctrl.createRelative();
				obj[ctrl.typeAttr] = "undefined";
			};
			
			
			ctrl.initialize = function(date){
				if(date){
					if(date.hasOwnProperty("fixed") && date.hasOwnProperty("relative") &&  date.hasOwnProperty(ctrl.typeAttr)){
						ctrl.type  = date[ctrl.typeAttr];
					}
					else if(date.hasOwnProperty("fixed")){
						ctrl.type  = "fixed";
						date[ctrl.typeAttr] = "fixed";
						date.relative = ctrl.createRelative();
					}
					else if(date.hasOwnProperty("relative")){
						ctrl.type  = "relative";
						date[ctrl.typeAttr] = "relative";
						date.fixed = ctrl.createFixed();
					}
				}
				else {
					date = ctrl.createNew();
				}
			};
			
			$scope.$watch('ctrl', function (newValue, oldValue, scope) {
				ctrl.initialize(ctrl.dt);
			});
			
			ctrl.dateChange = function(dateObj){
				dateObj.date = dateObj._dateObj.getTime();
			};
			
			$scope.$watch('ctrl.dt.relative.relativeTo', function (newValue, oldValue, scope) {
			    if(newValue && newValue != ""){
			    	if(!ctrl.validate(ctrl.dt,[])){
			    		console.log("Not Valid");
			    		ctrl.dt._type  = "error";
			    		ctrl.errRelative = newValue;
			    		ctrl.dt.relative.relativeTo = "";
			    	}
			    }
			});
			
			ctrl.dismiss = function(){
				ctrl.dt._type  = "relative";
			};
			
			ctrl.filter = function(date){
				if(date){
					if(date.hasOwnProperty(ctrl.typeAttr)){
						if(date[ctrl.typeAttr] === "relative"){
							return {obj : date.relative, type : "relative"};
						}
						else if(date[ctrl.typeAttr] === "fixed"){
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
				else if(date.type === "relative" && date.obj.hasOwnProperty("relativeTo") && date.obj.relativeTo === "TODAY"){
					return true;
				}
				else {
					return false;
				}
			};
			
			ctrl.validate = function(date,stack){
				var _date = ctrl.filter(date);
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
							else if(_date.obj.relativeTo === "EVALDATE" && stack.indexOf("EVALDATE") === -1){
								console.log("check EvalDate");
								stack.push("EVALDATE");
								return ctrl.validate(ctrl.tc.evalDate,stack);
							}
							else if(_date.obj.relativeTo === "TODAY"){
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