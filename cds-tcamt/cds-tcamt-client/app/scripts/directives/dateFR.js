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
		controller : function($scope) {
			var ctrl = this;

            $scope.$watch('ctrl.type', function (newValue, oldValue) {
            	console.log("watch");

                if(oldValue && ctrl.dt.type !== newValue.toLowerCase()){
                	if(newValue === 'FIXED'){
						ctrl.dt = ctrl.createFixed();
					}
					else if(newValue === 'RELATIVE'){
                        ctrl.dt = ctrl.createRelative();
					}
				}
            });

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
					date : "",
					_dateObj : null
				};
			};
			ctrl.createRelative = function(){
				return {
                    type : "relative",
					rules : []
				}
			};
            ctrl.refType = function (rule) {
            	if(rule.relativeTo.type && rule.relativeTo.type !== ''){
            		if(rule.relativeTo.type === 'DOB' && rule.position === 'BEFORE'){
                        rule.position = 'AFTER';
					}
				}
            };
            ctrl.createRule = function(){
                return {
                    position : 'AFTER',
                    year : 0,
					month : 0,
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
			
			// ctrl.initialize = function(date){
			// 	if(date){
			// 		if(date.hasOwnProperty("fixed") && date.hasOwnProperty("relative") &&  date.hasOwnProperty(ctrl.typeAttr)){
			// 			ctrl.type  = date[ctrl.typeAttr];
			// 		}
			// 		else if(date.hasOwnProperty("fixed")){
			// 			ctrl.type  = "fixed";
			// 			date[ctrl.typeAttr] = "fixed";
			// 			date.relative = ctrl.createRelative();
			// 		}
			// 		else if(date.hasOwnProperty("relative")){
			// 			ctrl.type  = "relative";
			// 			date[ctrl.typeAttr] = "relative";
			// 			date.fixed = ctrl.createFixed();
			// 		}
			// 	}
			// 	else {
			// 		date = ctrl.createNew();
			// 	}
			// };
			//
			// $scope.$watch('ctrl', function (newValue, oldValue, scope) {
			// 	ctrl.initialize(ctrl.dt);
			// });
			//
			ctrl.dateChange = function(dateObj){
				dateObj.date = dateObj._dateObj.getTime();
			};
			//
			// $scope.$watch('ctrl.dt.relative.relativeTo', function (newValue, oldValue, scope) {
			//     if(newValue && newValue != ""){
			//     	if(!ctrl.validate(ctrl.dt,[])){
			//     		console.log("Not Valid");
			//     		ctrl.dt._type  = "error";
			//     		ctrl.errRelative = newValue;
			//     		ctrl.dt.relative.relativeTo = "";
			//     	}
			//     }
			// });
			//
			// ctrl.dismiss = function(){
			// 	ctrl.dt._type  = "relative";
			// };
			//
			// ctrl.filter = function(date){
			// 	if(date){
			// 		if(date.hasOwnProperty(ctrl.typeAttr)){
			// 			if(date[ctrl.typeAttr] === "relative"){
			// 				return {obj : date.relative, type : "relative"};
			// 			}
			// 			else if(date[ctrl.typeAttr] === "fixed"){
			// 				return {obj : date.fixed, type : "fixed"};
			// 			}
			// 			else
			// 				return null;
			// 		}
			// 		else {
			// 			if(date.hasOwnProperty("fixed")){
			// 				return {obj : date.fixed, type : "fixed"};
			// 			}
			// 			else if(date.hasOwnProperty("relative")){
			// 				return {obj : date.relative, type : "relative"};
			// 			}
			// 			else
			// 				return null;
			// 		}
			// 	}
			// 	else
			// 		return null;
			// };
			//
			// ctrl.resolvable = function(date){
			// 	if(date.type === "fixed"){
			// 		return true;
			// 	}
			// 	else if(date.type === "relative" && date.obj.hasOwnProperty("relativeTo") && date.obj.relativeTo === "TODAY"){
			// 		return true;
			// 	}
			// 	else {
			// 		return false;
			// 	}
			// };
			//
			// ctrl.validate = function(date,stack){
			// 	var _date = ctrl.filter(date);
			// 	if(_date){
			// 		if(ctrl.resolvable(_date)){
			// 			console.log("is Resolvable");
			// 			return true;
			// 		}
			// 		else {
			// 			if(_date.type === "relative" && _date.obj.hasOwnProperty("relativeTo")){
			// 				console.log("is not resolvable");
			// 				if(_date.obj.relativeTo === "DOB" && stack.indexOf("DOB") === -1){
			// 					console.log("check DOB");
			// 					stack.push("DOB");
			// 					return ctrl.validate(ctrl.tc.patient.dob,stack)
			// 				}
			// 				else if(_date.obj.relativeTo === "EVALDATE" && stack.indexOf("EVALDATE") === -1){
			// 					console.log("check EvalDate");
			// 					stack.push("EVALDATE");
			// 					return ctrl.validate(ctrl.tc.evalDate,stack);
			// 				}
			// 				else if(_date.obj.relativeTo === "TODAY"){
			// 					console.log("is Today");
			// 					return true;
			// 				}
			// 			}
			// 			else
			// 				return false;
			// 		}
			// 	}
			// 	return false;
			// };
			
		},
		controllerAs: 'ctrl',
		bindToController: true
	};
});