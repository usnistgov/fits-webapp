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
					else {
						
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
								if(typeof obj[x] === 'number'){
									obj["_"+x] = new Date(obj[x]);
								}
								else {
									testObjectService.sanitizeDate(obj[x]);
								}
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

			group : function (list) {
				var ugroup = [];
				for(var tc in list){
					if(list[tc].group && ugroup.indexOf(list[tc].group) === -1){
						ugroup.push(list[tc].group);
					}
				}

				var groups = [];
				for(var g in ugroup){
					var tmp = list.filter(function (item) {
						return item.group === ugroup[g];
                    });

					groups.push({
						label : ugroup[g],
						children : tmp
					})
				}
				var tcs = list.filter(function (item) {
                    return !item.group;
                });
				return { groups : groups, testCases : tcs, keys : ugroup };
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
				return obj.hasOwnProperty("id") ? (obj.id.indexOf("cl_") === 0 ? true : false) : true;
			},

			isLocalID : function(id){
            	return typeof id === 'string' ? (id.indexOf("cl_") === 0 ? true : false) : true;
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
							dateCreated : dt.getTime(),
							dateLastUpdated : dt.getTime()
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
							dateCreated : dt.getTime(),
							dateLastUpdated : dt.getTime()
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
				return {
						relatedTo : null,
						status : ""
				};
			}

	};
	return testObjectService;
});

angular.module('tcl').factory('TestObjectSynchronize', function ($q, $http,TestObjectUtil) {
    var TestObjectSynchronize = {
    	syncTC : function(tps, tp,tc, _validation){
            var deferred = $q.defer();
            // var _validation = TestObjectValidation.validateTC(tc);

            if(TestObjectUtil.isLocal(tp)){
                console.log("Cannot Save, Local TP, Must Save");
                TestObjectSynchronize.syncTP(tps,tp).then(
                	function(response){
                        TestObjectSynchronize.syncTC(tps, response.tp, tc, _validation).then(
                        	function (response) {
                                deferred.resolve(response);
                            },
                            function (response) {
                                deferred.reject(response);
                            }
						);
					},
                    function(response){
                        deferred.reject(response);
                    }
				);// deferred.reject({ status : false, message : 'Cannot Save TestCase, please save the TestPlan before saving TestCase'})
                return deferred.promise;
            }

            // if(_validation.saveable){
            	var id = tc.id;
            	var _tc = TestObjectSynchronize.prepare(tc);
                $http.post('api/testcase/' + tp.id + '/save', _tc).then(
                	function(response){
                        var newTC = response.data;
                        TestObjectUtil.sanitizeDates(newTC);
                        TestObjectUtil.sanitizeEvents(newTC);
                        TestObjectUtil.synchronize(id,tp.testCases,newTC);

                        deferred.resolve({
                            status : true,
                            message : "TestCase Saved",
							tc : newTC
                        });
					},
                    function(response){
                        deferred.reject({
                            status : false,
                            message : "Error While Saving TestCase"
                        });
                    }
				);
			// }
			// else {
             //    deferred.reject({
             //        status : false,
             //        message : "TestCase Contains Errors, please fix them and try again",
			// 		errors : _validation.errors
             //    });
			// }
			return deferred.promise;
		},
		syncTP : function (tps,tp) {
            var deferred = $q.defer();
            var _tp = JSON.parse(JSON.stringify(tp));
            delete _tp.testCases;
            var id = _tp.id;
            if(TestObjectUtil.isLocal(_tp)){
                delete _tp.id;
            }
            TestObjectUtil.cleanObject(_tp,new RegExp("^_.*"));
            $http.post('api/testplan/partial/save', _tp).then(
				function(response){
                    var newTP = response.data;
                    for(var tc in newTP.testCases){
                        TestObjectUtil.sanitizeEvents(newTP.testCases[tc]);
                    }
                    TestObjectUtil.sanitizeDates(newTP);
                    TestObjectUtil.synchronize(id,tps,newTP);
                    TestObjectSynchronize.mergeTP(tp,newTP);
                    deferred.resolve({
                        status : true,
						tp : tp,
						message : "TestPlan Saved"
                    });
				},
				function(response){
					deferred.reject({
						status : false,
						message : "Error While Saving TestPlan"
					});
				}
			);

            return deferred.promise;
        },
		mergeTP : function(local,remote){
    		local.id = remote.id;
    		local.name = remote.name;
    		local.description = remote.description;
    		local.metaData = remote.metaData;

    		for(var tc in remote.testCases){
    			var i = TestObjectUtil.index(local.testCases,"id",remote.testCases[tc].id);
				local.testCases[i] = remote.testCases[tc];
			}
		},
		prepare : function(tc){
            var _tc = JSON.parse(JSON.stringify(tc));
            if (_tc.hasOwnProperty("position")) {
                delete _tc.position;
            }
            if(TestObjectUtil.isLocal(_tc)){
                delete _tc.id;
            }
            TestObjectUtil.cleanDates(_tc);
            TestObjectUtil.cleanObject(_tc,new RegExp("^_.*"));
            return _tc;
		}
    };
    return TestObjectSynchronize;
});

angular.module('tcl').factory('TestDataService', function ($http,$q,TestObjectUtil) {
	return {
		loadTestPlans : function () {
            var deferred = $q.defer();
            var tps = [];
            $http.get('api/testplans').then(
				function(response) {
					tps = angular.fromJson(response.data);
					TestObjectUtil.sanitizeDates(tps);
					for(var tp in tps){
						for(var tc in tps[tp].testCases){
							TestObjectUtil.sanitizeEvents(tps[tp].testCases[tc]);
						}
					}
                    deferred.resolve(tps);
				},
				function(error) {
                    deferred.reject("Failed to load TestPlans");
				});
            return deferred.promise;
        },

		loadEnums : function () {
            var deferred = $q.defer();
            var enums = {};
            $http.get('api/enum/evaluationStatus').then(
				function(response) {
                    enums.evalStatus = response.data;
					$http.get('api/enum/evaluationReason').then(
						function(response) {
                            enums.evalReason = response.data;
							$http.get('api/enum/serieStatus').then(
								function(response) {
									enums.serieStatus = response.data;
									$http.get('api/enum/gender').then(
										function(response) {
											enums.gender = response.data;
											deferred.resolve(enums);
										},
										function(error) {
											deferred.reject("Failed To Load Genders");
										}
									);
								},
								function(error) {
									deferred.reject("Failed To Load Serie Status");
								}
							);
						},
						function(error) {
                            deferred.reject("Failed To Load Evaluation Reason");
						}
					);
				},
				function(error) {
                    deferred.reject("Failed To Load Evaluation Status");
				}
			);
			return deferred.promise;
        }
	}
});

angular.module('tcl').factory('TestObjectSchema', function () {
	return {
        config : {
            ids : {
                active : true,
                separator : "-"
            }
        },
        types : {
        	idType : {
        		choice : [
					{
						id : "N",
						options : {
							min : 0
						},
						discriminator : function (doc,parent) {
							return typeof parent.id === "number"
                        }
					},
                    {
						id : "S",
                        discriminator : function (doc,parent) {
                            return typeof parent.id !== "number"
                        }
                    }
				]
			},
            date : {
                id : "O",
                model : [
                    {
                        choice : [
                            {
                                key : "fixed",
								name : "Fixed",
								id  : "fx",
                                typeRef : "fixedDate",
                                usage : "R",
                                discriminator : function(parent,obj){
                                    return !parent.hasOwnProperty("relative");
                                }
                            },
                            {
                                key : "relative",
                                name : "Relative",
								id  : "rl",
                                typeRef : "relativeDate",
                                usage : "R",
                                discriminator : function(parent,obj){
                                    return !parent.hasOwnProperty("fixed");
                                }
                            },
                        ]
                    }
                ]
            },

            fixedDate : {
				id : "O",
				model : [
					{
						key : "id",
						id : "id",
                        name : "ID",
						typeRef : "idType",
						usage : "O"
					},
                    {
                        key : "date",
                        id : "dt",
                        name : "DateObj",
						type : {
                        	id : "N",
							options : {
                        		min : 0
							}
						},
                        usage : "R"
                    }
				]
			},

            relativeDate : {
				id : "O",
				model : [
                    {
                        key : "id",
                        id : "id",
                        name : "ID",
                        typeRef : "idType",
                        usage : "O"
                    },
                    {
                        key : "relativeTo",
                        id : "rlt",
                        name : "Relative To",
                        type : {
                        	id : "S",
							options : {
                        		min : 5
							}
						},
                        usage : "R"
                    },
                    {
                        key : "years",
                        id : "y",
                        name : "Years",
                        type : {
                            id : "N"
                        },
                        usage : "R"
                    },
                    {
                        key : "months",
                        id : "m",
                        name : "Months",
                        type : {
                            id : "N"
                        },
                        usage : "R"
                    },
                    {
                        key : "days",
                        id : "d",
                        name : "days",
                        type : {
                            id : "N"
                        },
                        usage : "R"
                    }
				]
			}

        }
    };
});
