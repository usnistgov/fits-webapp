angular.module('tcl').factory('TestObjectUtil', function () {
	var testObjectService = {
			hash : function (list) {
				for(var i in list){
                    testObjectService.updateHash(list[i]);
				}
            },
			hashChanged : function (tc) {
                var _tc = testObjectService.prepare(tc);
                console.log("prepared");
                console.log(_tc);
                return md5(angular.toJson(_tc)) !== tc._hash;
            },
			updateHash : function (tc) {
                var _tc = testObjectService.prepare(tc);
                tc._hash = md5(angular.toJson(_tc));
                console.log("Updating Hash : "+tc._hash);
            },
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
					if(obj.hasOwnProperty("type")){
						if(obj.type === 'fixed'){
							obj._dateObj = new Date(obj.date);
						}
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
					for(var e = 0; e < tc.events.length; e++){
						tc.events[e]._type = "vaccination";
                        tc.events[e].vaccination.id = e;
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
					if(obj.hasOwnProperty("type")){
						if(obj.type === "fixed"){
							delete obj._dateObj;
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
				return obj.hasOwnProperty("id") && typeof obj.id === 'string' ? (obj.id.indexOf("cl_") === 0 ? true : false) : true;
				//return true;
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
			},
			prepare : function(tc){
				var _tc = JSON.parse(angular.toJson(tc));
				if (_tc.hasOwnProperty("position")) {
					delete _tc.position;
				}
				if(testObjectService.isLocal(_tc)){
					delete _tc.id;
				}
                testObjectService.cleanDates(_tc);
                testObjectService.cleanObject(_tc,new RegExp("^_.*"));
				return _tc;
			},
			updateDose : function (events) {
				var groups = _.groupBy(events,function (item) {
                    return item.vaccination.administred ? item.vaccination.administred.name : "new";
                });

				for(var group in groups){
					var list = groups[group];
					for(var i = 0; i < list.length; i++){
						list[i].vaccination.doseNumber = i+1;
					}
				}
            }
	};
	return testObjectService;
});

angular.module('tcl').factory('TestObjectFactory', function (TestObjectUtil) {
	var testObjectService = {
			createFD : function () {
                var dt = new Date();
				return {
					type : 'fixed',
					date : dt.getTime(),
					_dateObj : dt
				}
            },
			createRD : function () {
				return {
					type : 'relative',
					rules : []
				}
			},
			createREVD : function () {
				return {
					type : 'relative',
					rules : [
						{
							position : 'BEFORE',
							year : 0,
							month : 0,
							day : 0,
							relativeTo : {
								reference : 'static',
								id : 'EVALDATE'
							}
						}
					]
				}
			},
			createRDOB : function () {
				return {
					type : 'relative',
					rules : [
						{
							position : 'BEFORE',
							year : 0,
							month : 0,
							day : 0,
							relativeTo : {
								reference : 'static',
								id : 'EVALDATE'
							}
						}
					]
				}
			},
			createTC : function(){
				var dt = new Date();
				var tc = {
						name : "New TC",
						_changed : true,
						description : "",
						dateType : 'FIXED',
						_dateType : 'FIXED',
						patient : {
							dob : testObjectService.createFD(),
							gender : null
						},
						metaData : {
							version : 1,
							imported : false,
							dateCreated : dt.getTime(),
							dateLastUpdated : dt.getTime()
						},
						evalDate : testObjectService.createFD(),
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

			createEvent : function(pos,t){
                var dt;
				if(t === 'FIXED'){
                	dt = testObjectService.createFD();
				}
				else {
					dt = testObjectService.createRD();
				}
				var ev = {
						_type : "vaccination",
						vaccination : {
							administred : null,
							evaluations : [],
							type : "VACCINATION",
							date : dt,
							doseNumber : 1,
							position : pos
						}
				};
				return ev;
			},

			createForecast : function(t){
				var earliest;
                var recomm;
                if(t === 'FIXED'){
                    earliest = testObjectService.createFD();
                    recomm = testObjectService.createFD();
                }
                else {
                    earliest = testObjectService.createRD();
                    recomm = testObjectService.createRD();
                }
				var fc = {
						doseNumber : 0,
						forecastReason : "",
						earliest : earliest,
						recommended : recomm,
						pastDue : null,
						target : null
				};
				return fc;
			},

			createEvaluation : function(){
				return {
						relatedTo : null,
						status : null
				};
			}

	};
	return testObjectService;
});

angular.module('tcl').factory('TestObjectSynchronize', function ($q, $http,TestObjectUtil) {
    var TestObjectSynchronize = {
    	syncTC : function(id,tc){
            var deferred = $q.defer();
            if(TestObjectUtil.isLocalID(id)){
                console.log("Cannot Save, Local TP, Must Save");
                deferred.reject({
                	message : "TestPlan must be saved first",
                	tp : "local"
				});
            }
            else {
                var _tc = TestObjectSynchronize.prepare(tc);
                console.log("Saving "+_tc);
                $http.post('api/testcase/' + id + '/save', _tc).then(
                    function(response){
                        var newTC = response.data;
                        TestObjectUtil.sanitizeDates(newTC);
                        TestObjectUtil.sanitizeEvents(newTC);
                        newTC._dateType = newTC.dateType;
                        deferred.resolve({
                            status : true,
                            message : "TestCase Saved",
                            tc : newTC
                        });
                    },
                    function(response){
                        deferred.reject({
                            status : false,
                            message : "Error While Saving TestCase",
                            response : response.data
                        });
                    }
                );
			}
			return deferred.promise;
		},
		syncTP : function (tp) {
            var deferred = $q.defer();
            var _tp = JSON.parse(angular.toJson(tp));
            delete _tp.testCases;
            _tp = TestObjectSynchronize.prepare(_tp);

            $http.post('api/testplan/partial/save', _tp).then(
				function(response){
                    var newTP = response.data;
                    deferred.resolve({
                        status : true,
						tp : newTP,
						message : "TestPlan Saved"
                    });
				},
				function(response){
					deferred.reject({
						status : false,
						message : "Error While Saving TestPlan",
						response : response.data
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
            var _tc = JSON.parse(angular.toJson(tc));
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
					console.log("LOAD TP");
					tps = angular.fromJson(response.data);
					TestObjectUtil.sanitizeDates(tps);
					for(var tp in tps){
						for(var tc in tps[tp].testCases){
                            tps[tp].testCases[tc]._dateType = tps[tp].testCases[tc].dateType;
							TestObjectUtil.sanitizeEvents(tps[tp].testCases[tc]);
						}
					}
                    for(var tp in tps){
                        TestObjectUtil.hash(tps[tp].testCases);
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
