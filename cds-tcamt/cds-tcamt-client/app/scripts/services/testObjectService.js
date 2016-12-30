angular.module('tcl').factory('TestObjectUtil', function () {
	var testObjectService = {
			
			cleanObject : function(obj,exp){
				if(typeof obj === 'object'){
					if(!Array.isArray(obj)) {
						for(var prop in obj){
							if(exp.test(prop)){
								delete obj[prop];
							}
							else {
								testObjectService.cleanObject(obj[prop],exp);
							}
						}
					}
					else {
						for(var i in obj){
							testObjectService.cleanObject(obj[i],exp);
						}
					}
				}
			},
			
			sanitizeDate : function(obj){
				if(obj){
					if(obj.hasOwnProperty("fixed")){
						obj['_type'] = "fixed";
						obj.fixed['_dateObj'] = new Date(obj.fixed.date);
					}
					else if(obj.hasOwnProperty("relative")){
						obj['_type'] = "relative";
					}
				}
			},
			
			sanitizeDates : function(obj){
				if(typeof obj === 'object'){
					if(Array.isArray(obj)) {
						for(var i in obj){
							testObjectService.sanitizeDates(obj[i]);
						}
					}
					else {
						for(var x in obj){
							if(~x.search(/date/i) || ~x.search(/earliest/i) || ~x.search(/recommended/i) || ~x.search(/dob/i) || ~x.search(/pastDue/i)){
								testObjectService.sanitizeDate(obj[x]);
							}
							else {
								testObjectService.sanitizeDates(obj[x]);
							}
						}
					}
				}
			},
			
			sanitizeEvents : function(tc){
				if(tc.events){
					for(var e in tc.events){
						tc.events[e]._type = "vaccination";
					}
				}
			},
			
			cleanDates : function(obj){
				if(typeof obj === 'object'){
					if(Array.isArray(obj)) {
						for(var i in obj){
							testObjectService.cleanDates(obj[i]);
						}
					}
					else {
						for(var x in obj){
							if(~x.search(/date/i) || ~x.search(/earliest/i) || ~x.search(/recommended/i) || ~x.search(/dob/i) || ~x.search(/pastDue/i)){
								testObjectService.cleanDate(obj[x]);
							}
							else {
								testObjectService.cleanDates(obj[x]);
							}
						}
					}
				}
			},
			
			cleanDate : function(obj){
				if(obj){
					if(obj.hasOwnProperty("_type")){
						var type = obj._type;
						if(type === "fixed"){
							delete obj.relative;
						}
						else if(type === "relative"){
							delete obj.fixed;
						}
						else {
							obj = null;
						}
					}
				}
			},
			
			clone : function(obj){
				var c = JSON.parse(JSON.stringify(obj));
				testObjectService.cleanObject(c,new RegExp("^id$"));
				return c;
			},
			
			cloneEntity : function(entity){
				var e = testObjectService.clone(entity);
				testObjectService.markWithCLID(e);
				return e;
			},
			
			synchronize : function(id , container, remoteObj){
				var indexOfObj = testObjectService.index(container,"id",id);
				container[indexOfObj] = remoteObj;
			},
			
			index : function(container,key,value){
				for(var i = 0; i < container.length; i++){
					if(typeof container[i] === 'object' && container[i].hasOwnProperty(key) && container[i][key]  === value){
						return i;
					}
				}
				return -1;
			},
			
			markWithCLID : function(obj){
				obj.id = "cl_"+testObjectService.generateUID();
			},
			
			isLocal : function(obj){
				return obj.hasOwnProperty("id") ? (typeof obj.id === 'string' ? true : false ) : true; 
			},
			
			generateUID : function(){
				var d = new Date().getTime();
				var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
					var r = (d + Math.random()*16)%16 | 0;
					d = Math.floor(d/16);
					return (c=='x' ? r : (r&0x3|0x8)).toString(16);
				});
				return uuid;
			}
	};
	return testObjectService;
});

angular.module('tcl').factory('TestObjectFactory', function (TestObjectUtil) {
	var testObjectService = {
			
			createTC : function(){
				var dt = new Date();
				var tc = {
						name : "New TC",
						_changed : true,
						description : "",
						patient : {
							dob : null,
							gender : "",
						},
						metaData : {
							version : 1,
							imported : false,
							dateCreated : {
								fixed : {
									date : dt.getTime()
								}
							},
							dateLastUpdated : {
								fixed : {
									date : dt.getTime()
								}
							}
						},
						evalDate : null,
						events : [],
						forecast : []
				};
				TestObjectUtil.sanitizeDates(tc);
				TestObjectUtil.markWithCLID(tc);
				return tc;
			},
			
			createTP : function(){
				var dt = new Date();
				var tp = {
						name : "New Test Plan",
						description : "",
						metaData : {
							version : "1",
							imported : false,
							dateCreated : {
								fixed : {
									date : dt.getTime(),
								}
							},
							dateLastUpdated : {
								fixed : {
									date : dt.getTime(),
								}
							}
						},
						testCases : []
				};
				TestObjectUtil.sanitizeDates(tp);
				TestObjectUtil.markWithCLID(tp);
				return tp;
			},
			
			createEvent : function(){
				var ev = {
						_type : "vaccination",
						vaccination : {
							administred : null,
							evaluations : [],
							type : "VACCINATION",
							date : null,
							doseNumber : 1
						}
				};
				return ev;
			},
			
			createForecast : function(){
				var fc = {
						doseNumber : 0,
						forecastReason : "",
						earliest : {
							fixed : {
								date : null
							}
						},
						recommended : {
							fixed : {
								date : null
							}
						},
						pastDue : {
							fixed : {
								date : null
							}
						},
						target : null
				};
				return fc;
			},
			
			createEvaluation : function(){
				var eval = {
						relatedTo : null,
						status : ""
				};
				return eval;
			}
			
	}
	return testObjectService;
});