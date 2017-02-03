/**
 * Created by Jungyub on 5/12/16
 */
angular.module('tcl').filter('startFrom', function() {
    return function(input, start) {
    	 if (!input || !input.length) { return; }
        start = +start; //parse to int
        return input.slice(start);
    }
});

angular.module('tcl').filter('vaccine', function () {
  return function (items,str) {
	  if (!items || !items.length) { return; }
	  return items.filter(function (item) {
		  if(!str || str === "") return true;
		  var s = str.toLowerCase();
		  return item.vx.name.toLowerCase().includes(s) || item.vx.cvx.includes(s);
	  });
  };
});

angular.module('tcl').filter('vaccineEpt', function () {
    return function (items,str) {
        if (!items || !items.length) { return; }
        return items.filter(function (item) {
            if(!str || str === "") return false;
            var s = str.toLowerCase();
            return item.vx.name.toLowerCase().includes(s) || item.vx.cvx.includes(s);
        });
    };
});

angular.module('tcl').filter('product', function () {
	  return function (items,str) {
		  if (!items || !items.length) { return; }
		  return items.filter(function (item) {
			  if(!str || str === "") return true;
			  var s = str.toLowerCase();
			  return item.name.toLowerCase().includes(s) || item.mx.mvx.toLowerCase().includes(s) || item.mx.name.toLowerCase().includes(s);
		  });
	  };
});

angular.module('tcl').filter('productEpt', function () {
    return function (items,str) {
        if (!items || !items.length) { return; }
        return items.filter(function (item) {
            if(!str || str === "") return false;
            var s = str.toLowerCase();
            return  item.name.toLowerCase().includes(s) || item.mx.mvx.toLowerCase().includes(s);
        });
    };
});

angular.module('tcl').filter('unspecified', function () {
	  return function (items,usp) {
		  if (!items || !items.length) { return; }
		  return items.filter(function (item) {
			  if(!usp) return true;
			  return item.group;
		  });
	  };
});

angular.module('tcl').filter('testcase', function () {
    return function (items,str) {
        if (!items || !items.length) { return; }
        return items.filter(function (item) {
            if(!str || str === "") return true;
            var s = str.toLowerCase();
            return item.name.toLowerCase().includes(s);
        });
    };
});

angular.module('tcl').filter('vxgroup', function () {
	
	return function(items,groups){
		if (!items || !items.length) { return; }
		var filter = function (item) {
			
				var hasGroup = function(mp,gr) {
					if(mp.groups && mp.groups.length !== 0){
						var found = false;
						for(var mG in mp.groups){
							if(mp.groups[mG].cvx === gr.cvx){
								found = true;
								break;
							}
						}
						return found;
					}
					return false;
				};
				
				if(!groups || groups.length === 0) return true;
				for(var x in groups){
					if(!hasGroup(item,groups[x])){
						return false;
					}
				}
				return true;
		};
		return items.filter(filter);
	};
});

angular
		.module('tcl')
		.controller(
				'TestPlanCtrl',
				function($document, $scope, $rootScope, $templateCache,
						Restangular, $http, $filter, $modal, $cookies,
						$timeout, userInfoService, ngTreetableParams,
						$interval, ViewSettings, StorageService, $q,
						notifications, IgDocumentService, ElementUtils,
						AutoSaveService, $sce, Notification, TestObjectUtil, TestObjectFactory, VaccineService, TestObjectSynchronize, TestDataService) {
					$scope.vxm = [];
					$scope.loading = false;
					$scope.selectedTabTP = 0;
					$scope.sfile = "BROWSE";
					$scope.sfileO = null;
					$scope.fileErr = false;
					$scope.selectedTestStepTab = 1;
					$scope.selectedEvent = {};
					$rootScope.selectedTestPlan1 = {};
					$scope.selectedForecast = {};
					$scope.selectedType = "none";
					$scope.testPlanOptions = [];
					$scope.accordi = {
						metaData : false,
						definition : true,
						tpList : true,
						tpDetails : false
					};
					$rootScope.usageViewFilter = 'All';
					$rootScope.selectedTemplate = null;
					$scope.DocAccordi = {};
					$scope.DocAccordi.testdata = false;
					$scope.DocAccordi.messageContents = false;
					$scope.DocAccordi.jurorDocument = false;
					$scope.nistStd = {};
					$scope.nistStd.nist = false;
					$scope.nistStd.std = false;
					$scope.exportCDC = {
							ignore : false,
							from : 1,
							to : 1000,
							all : true
					};
					
					// ------------------------------------------------------------------------------------------
					// CDSI TCAMT
					$scope.importing = false;
                    $scope.impDiag = null;
					$scope.selectedEvent = null;
					$scope.selectedForecast = null;
					$scope.selectedTP = null;
					$scope.selectedTC = null;
					$scope.selectedTG = null;
					$scope.tps = [];
					$scope.tpTree = [];
					$scope.evalStatus = [];
					$scope.evalReason = [];
					$scope.serieStatus = [];
					$scope.gender = [];
                    $scope.selectedTabTC = 0;
                    $scope.tcSearch = "";
                    $scope.export = {
                    	type : 'NIST'
					};
					$scope.control = {
						error : {
							isSet : false,
							tc : null,
							obj : null,
						}
					};
					$scope.excelmime = [
                        "application/vnd.ms-excel",
                        "application/msexcel",
                        "application/x-msexcel",
                        "application/x-ms-excel",
                        "application/x-excel",
                        "application/x-dos_ms_excel",
                        "application/xls",
                        "application/x-xls",
                        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
					];

					$scope.valueForEnum = function(code,enumList){
						for(var i in enumList){
							if(enumList[i].code === code){
								return enumList[i].details;
							}
						}
						return "";
					};
					
					$scope.eventLabel = function(event){
						if(!event.vaccination.date)
							return "";
						if(event.vaccination.date._type){
							if(event.vaccination.date._type === 'fixed')
								return $filter('date')(event.vaccination.date.fixed.date, "MM/dd/yyyy");
							else if(event.vaccination.date._type === 'relative')
								return "Relative";
							else
								return "Invalid Date";
						}
						else
							return "";
					};
					
					$scope.newTestPlan = function() {
						var tp = TestObjectFactory.createTP();
						$scope.tps.push(tp);
						$scope.selectTP(tp);
					};

					$scope.initEnums = function(){
                        var d = $q.defer();
                        TestDataService.loadEnums().then(function (data) {
							for(k in data){
								if(data.hasOwnProperty(k))
									$scope[k] = data[k];
							}
							d.resolve(true);
						},
						function (err) {
							console.log(err);
                            d.resolve(false);
						});
                        return d.promise;
					};

                    $scope.loadVaccines = function () {
                        var d = $q.defer();
						VaccineService.load().then(function (data) {
							for(k in data){
								if(data.hasOwnProperty(k))
									$scope[k] = data[k];
							}
							d.resolve(true);
                        },
						function (err) {
							console.log(err);
                            d.resolve(false);
                        });
                        return d.promise;
                    };

					$scope.loadTestCases = function() {
						var d = $q.defer();
                        TestDataService.loadTestPlans().then(function (data) {
                                $scope.tps = data;
                            	d.resolve(true);
                        }, function (err) {
                                console.log(err);
                                d.resolve(false);
                        });
                        return d.promise;
					};

					$scope.selectEvent = function(e) {
						waitingDialog.show('Opening Event', {
							dialogSize : 'xs',
							progressType : 'info'
						});
						$timeout(function() {
							// Selection
							$scope.selectedEvent = e;
							$scope.selectedForecast = null;
							$scope.selectedType = "evt";
							
							// View
							$scope.subview = "EditEventData.html";
                            $rootScope.$emit('vp_clear', true);
							waitingDialog.hide();
						}, 0);
					};

					$scope.selectForecast = function(f) {
						waitingDialog.show('Opening Forecast', {
							dialogSize : 'xs',
							progressType : 'info'
						});
						$timeout(function() {
							// Selection
							$scope.selectedForecast = f;
							$scope.selectedEvent = null;
							$scope.selectedType = "fc";
							// View
							$scope.subview = "EditForecastData.html";
							waitingDialog.hide();
						}, 0);
					};

					$scope.selectTP = function(tp) {
						waitingDialog.show('Opening Test Plan', {
							dialogSize : 'xs',
							progressType : 'info'
						});
						$timeout(function() {
							console.log("SelectTP");
							// Selection
							$scope.selectedEvent = null;
							$scope.selectedForecast = null;
							$scope.selectedTC = null;
							$scope.selectedTG = null;
							$scope.tpTree = [];
							$scope.selectedTP = tp;
							$scope.tpTree.push($scope.selectedTP);
							$scope.selectedType = "tp";

							// View
							$scope.selectTPTab(1);
							$scope.subview = "EditTestPlanData.html";
							waitingDialog.hide();
						}, 0);
					};

					$scope.selectTC = function(tc) {
						waitingDialog.show('Opening Test Case', {
							dialogSize : 'xs',
							progressType : 'info'
						});
						$timeout(function() {
							// Selection
							$scope.selectedEvent = null;
							$scope.selectedForecast = null;
							$scope.selectedTC = tc;
							$scope.selectedTG = null;
							$scope.selectedType = "tc";

							// View
							$scope.subview = "EditTestPlanMetadata.html";
							waitingDialog.hide();
						}, 0);
					};

					$scope.validateTC = function(tc) {
						var errors = {
							type : "",
							id : "",
							errorMessages : [],
							within : []
						};
						var has = $scope.has;
						errors.type = "TestCase";
						errors.id = "1";

						if (tc) {
							if (!has(tc, "name"))
								errors.errorMessages
										.push("Test Case must have a name");

							if (!has(tc, "description"))
								errors.errorMessages
										.push("Test Case must have a description");

							if (!has(tc, "patient"))
								errors.errorMessages
										.push("Test Case must have a patient");
							else
								$scope.mergeErrors(errors.within, $scope
										.validatePT(tc.patient));

							if (!has(tc, "metaData"))
								errors.errorMessages
										.push("Test Case must have meta-data");
							else
								$scope.mergeErrors(errors.within, $scope
										.validateMD(tc.metaData));

							if (!has(tc, "evalDate"))
								errors.errorMessages
										.push("Test Case must have an evaluation date");
							else {
								$scope.mergeErrors(errors.within, $scope
										.validateDT(tc.evalDate,
												"Evaluation Date"));
							}

							if (has(tc, "events")) {
								if (tc.events.length > 0) {
									for ( var x in tc.events) {
										$scope.mergeErrors(errors.within,
												$scope.validateEV(tc.events[x],
														x));
									}
								}
							}

							if (has(tc, "forecast")) {
								if (tc.forecast.length > 0) {
									for ( var x in tc.forecast) {
										$scope.mergeErrors(errors.within,
												$scope.validateFC(
														tc.forecast[x], x));
									}
								}
							}
						} else {
							errors.errorMessages.push("Internal Error");
						}

						return errors;
					};

					$scope.validatePT = function(pt) {
						var errors = {
							type : "",
							id : "",
							errorMessages : [],
							within : []
						};
						var has = $scope.has;
						errors.type = "Patient";
						errors.id = "1";

						if (pt) {
							if (!has(pt, "gender")) {
								errors.errorMessages
										.push("Patient must have a gender");
							} else {
								if (pt.gender !== 'F' && pt.gender !== 'M') {
									errors.errorMessages
											.push("Patient gender must be M or F");
								}
							}

							if (!has(pt, "dob"))
								errors.errorMessages
										.push("Patient must have date of birth");
							else
								$scope.mergeErrors(errors.within, $scope
										.validateDT(pt.dob, "Date Of Birth"));

						} else {
							errors.errorMessages.push("Internal Error");
						}

						return errors;
					};

					$scope.validateMD = function(md) {
						var errors = {
							type : "",
							id : "",
							errorMessages : [],
							within : []
						};
						var has = $scope.has;
						errors.type = "Metadata";
						errors.id = "1";

						if (md) {
							if (!has(md, "version"))
								errors.errorMessages
										.push("Meta-data must have a 'version' attribute");

							if (!md.hasOwnProperty("imported"))
								errors.errorMessages
										.push("Meta-data must have an 'imported' attribute");

							if (!has(md, "version"))
								errors.errorMessages
										.push("Meta-data must have a version attribute");

							if (!has(md, "dateCreated"))
								errors.errorMessages
										.push("Meta-data must have a creation date attribute");
							else
								$scope.mergeErrors(errors.within, $scope
										.validateDT(md.dateCreated,
												"Date Created"));

							if (!has(md, "dateLastUpdated"))
								errors.errorMessages
										.push("Meta-data must have a last update date attribute");
							else
								$scope.mergeErrors(errors.within, $scope
										.validateDT(md.dateLastUpdated,
												"Date Last Updated"));

						} else {
							errors.errorMessages.push("Internal Error");
						}

						return errors;
					};

					$scope.validateDT = function(dt, id) {
						var errors = {
							type : "",
							id : "",
							errorMessages : [],
							within : []
						};
						var has = $scope.has;
						errors.type = "Date";
						errors.id = id;

						if (dt) {

							if ((has(dt, "_type") && dt._type === "fixed")
									|| (!has(dt, "_type") && has(dt, "fixed"))) {
								errors.errorMessages.push.apply(
										errors.errorMessages, $scope
												.validateDTFX(dt.fixed));
							} else if ((has(dt, "_type") && dt._type === "relative")
									|| (!has(dt, "_type") && has(dt, "relative"))) {
								errors.errorMessages.push.apply(
										errors.errorMessages, $scope
												.validateDTRL(dt.relative));
							} else {
								errors.errorMessages.push("Date Error");
							}

						} else {
							errors.errorMessages.push("Internal Error");
						}

						return errors;
					};

					$scope.validateDTFX = function(dt) {
						var errors = [];
						var has = $scope.has;

						if (dt) {
							if (!has(dt, "date"))
								errors.push("Malformed Fixed Date");
						} else {
							errors.push("Internal Error");
						}

						return errors;
					};

					$scope.validateDTRL = function(dt) {
						var errors = [];
						var has = $scope.has;
						if (dt) {
							if (!has(dt, "relativeTo"))
								errors
										.push("Malformed relative date relativeTo attibute not set");

							if (!dt.hasOwnProperty("year"))
								errors
										.push("Malformed relative date year attibute not set");

							if (!dt.hasOwnProperty("day"))
								errors
										.push("Malformed relative date day attibute not set");

							if (!dt.hasOwnProperty("month"))
								errors
										.push("Malformed relative date month attibute not set");

						} else {
							errors.push("Internal Error");
						}

						return errors;
					};

					$scope.validateEV = function(ev, id) {
						var errors = {
							type : "",
							id : "",
							errorMessages : [],
							within : []
						};
						var has = $scope.has;
						errors.type = "Event";
						errors.id = id;

						if (ev) {
							if (!has(ev, "vaccination"))
								errors.errorMessages.push("Event error");
							else {
								var vaccination = ev.vaccination;

								if (!has(vaccination, "date"))
									errors.errorMessages
											.push("Event must have a date");
								else {
									$scope.mergeErrors(errors.within, $scope
											.validateDT(vaccination.date,
													"Event Date"));
								}

								if (!has(vaccination, "administred"))
									errors.errorMessages
											.push("Event must have an administred vaccine");
								else {
									$scope
											.mergeErrors(
													errors.within,
													$scope
															.validateVC(vaccination.administred));
								}

								if (has(vaccination, "evaluations")) {
									if (vaccination.evaluations.length > 0) {
										for ( var x in vaccination.evaluations) {
											$scope
													.mergeErrors(
															errors.within,
															$scope
																	.validateEL(vaccination.evaluations[x]));
										}
									}
								}
							}

						} else {
							errors.push("Internal Error");
						}

						return errors;

					};
					
					$scope.evalStatusChange = function(evaluation){
						if(evaluation.status !== 'INVALID'){
							if(evaluation.hasOwnProperty("reason")){
								delete evaluation.reason;
							}
						}
					};

					$scope.cloneTP = function(tp){
                        var x = TestObjectUtil.cloneEntity(tp);
                        x.name = "[CLONE] " + x.name;
                        for(var t in x.testCases){
                        	TestObjectUtil.markWithCLID(x.testCases[t]);
                            TestObjectUtil.sanitizeEvents(x);
						}
                        TestObjectUtil.sanitizeDates(x);
                        $scope.tps.push(x);
                        $scope.selectTP(x);
					};
					
					$scope.validateVC = function(vc) {
						var errors = {
							type : "",
							id : "",
							errorMessages : [],
							within : []
						};
						var has = $scope.has;
						errors.type = "Vaccine";
						errors.id = "none";

						if (vc) {
							if (!has(vc, "id")) {
								errors.errorMessages.push("Invalid vaccine");
								return errors;
							}
						} else {
							errors.errorMessages.push("Internal Error");
						}

						return errors;
					};

					$scope.validateEL = function(el) {
						var errors = {
							type : "",
							id : "",
							errorMessages : [],
							within : []
						};
						var has = $scope.has;
						errors.type = "Evaluation";
						errors.id = "none";

						if (el) {
							if (!has(el, "status"))
								errors.errorMessages
										.push("Evaluation must have a status");
							else {
								if (el.status !== "VALID"
										&& el.status !== "INVALID") {
									errors.errorMessages
											.push("Evaluation status must be 'Valid' or 'Invalid'");
								}
							}

							if (!has(el, "relatedTo"))
								errors.errorMessages
										.push("Evaluation must specify the vaccine it is related to");
							else {
								$scope.mergeErrors(errors.within, $scope
										.validateVC(el.relatedTo));
								if (has(el.relatedTo, "name")) {
									errors.id = el.relatedTo.name;
								}
							}

						} else {
							errors.push("Internal Error");
						}

						return errors;
					};

					$scope.mergeErrors = function(ls, obj) {
						var has = $scope.has;
						if (has(obj, "errorMessages") && has(obj, "within")) {
							if (obj.errorMessages.length > 0) {
								ls.push(obj);
							} else {
								if (obj.within.length > 0) {
									ls.push(obj);
								}
							}
						}
					};

					$scope.validateFC = function(fc, id) {
						var errors = {
							type : "",
							id : "",
							errorMessages : [],
							within : []
						};
						var has = $scope.has;
						errors.type = "Forecast";
						errors.id = id;

						if (fc) {

							if (!has(fc, "serieStatus"))
								errors.errorMessages
										.push("Forecast must have a status");
							else {

								if (fc.serieStatus !== 'C') {
									if (!has(fc, "earliest"))
										errors.errorMessages
												.push("Forecast must have an earliest date");
									else {
										$scope.mergeErrors(errors.within,
												$scope.validateDT(fc.earliest,
														"Earliest"));
									}

									if (!has(fc, "recommended"))
										errors.errorMessages
												.push("Forecast must have a recommended date");
									else {
										$scope.mergeErrors(errors.within,
												$scope.validateDT(
														fc.recommended,
														"Recommended"));
									}

									if (!has(fc, "pastDue"))
										errors.errorMessages
												.push("Forecast must have a pastDue date");
									else {
										$scope.mergeErrors(errors.within,
												$scope.validateDT(fc.pastDue,
														"Past Due"));
									}
								}
							}

							if (!has(fc, "target"))
								errors.errorMessages
										.push("Forecast must have a target");
							else {
								$scope.mergeErrors(errors.within, $scope
										.validateVC(fc.target));
							}

						} else {
							errors.errorMessages.push("Internal Error");
						}

						return errors;
					};

					$scope.isSelectedTC = function(t) {
						return t === $scope.selectedTC;
					};

					$scope.isSelectedEvent = function(e) {
						return e === $scope.selectedEvent;
					};

					$scope.isSelectedForecast = function(f) {
						return f === $scope.selectedForecast;
					};

					$scope.isSelectedTPv = function() {
						return $scope.subview === "EditTestPlanData.html";
					};

					$scope.isSelectedTCv = function() {
						return $scope.subview === "EditTestPlanMetadata.html";
					};

					$scope.aTCisSelected = function() {
						return $scope.selectedTC && $scope.selectedTC !== {};
					};

					$scope.aTPisSelected = function() {
						return $scope.selectedTP && $scope.selectedTP !== {};
					};

					$scope.anEvisSelected = function() {
						return $scope.selectedEvent
								&& $scope.selectedEvent !== {};
					};

					$scope.aFisSelected = function() {
						return $scope.selectedForecast
								&& $scope.selectedForecast !== {};
					};

					$scope.addEvent = function() {
						var event = TestObjectFactory.createEvent();
						$scope.selectedTC.events.push(event);
						$scope.selectEvent(event);
					};

					$scope.addForecast = function() {
						var fc = TestObjectFactory.createForecast();
						$scope.selectedTC.forecast.push(fc);
						$scope.selectForecast(fc);
					};

					$scope.prepareTestCase = function(tc) {
						if (tc.hasOwnProperty("position")) {
							delete tc.position;
						}
						if(TestObjectUtil.isLocal(tc)){
							delete tc.id;
						}
						TestObjectUtil.cleanDates(tc);
						TestObjectUtil.cleanObject(tc,new RegExp("^_.*"));
					};
					
					$scope.closeTestPlanEdit = function() {
						$scope.selectedEvent = null;
						$scope.selectedForecast = null;
						$scope.selectedTP = null;
						$scope.selectedTC = null;
						$scope.selectedTG = null;
						$scope.selectedType = "";
						$scope.selectTPTab(0);
					};

					$scope.has = function(a, b) {
						return a.hasOwnProperty(b) && a[b];
					};

					$scope.newEvaluation = function(list) {
						var eval = TestObjectFactory.createEvaluation();
						list.push(eval);
					};

					$scope.deleteEvaluation = function(list, index) {
						list.splice(index, 1);
					};
					
					$scope.importButton = function() {
						$scope.selectTP($scope.selectedTP);
						$scope.selectedTabTP = 1;
					};

					$scope.summary = function () {
                        $scope.selectTC($scope.selectedTC);
                        $scope.selectedTabTC = 3;
                    };

					$scope.eventCM = [ 
					     [ 'Delete Event', 
					       function(modelValue) {
					    	$scope.selectedTC.events.splice(modelValue.$index, 1);
					    	$scope.selectTC($scope.selectedTC);
					    } ] ];

					$scope.forecastCM = [ 
					        [ 'Delete Forecast',
					          function(modelValue) {
								$scope.selectedTC.forecast.splice(modelValue.$index, 1);
								$scope.selectTC($scope.selectedTC);
							} ] ];

					$scope.tpCM = [ 
					        [ 'Add Test Case', 
					          function(modelValue) {
					        	var tc = TestObjectFactory.createTC();
					        	$scope.selectedTP.testCases.push(tc);
					        	$scope.selectTC(tc);
					        } ], 
					        [ 'Import Test Case', 
					          function(modelValue) {
					        	$scope.selectTP($scope.selectedTP);
					        	$scope.selectedTabTP = 1;
					        },
							function () {
								return !$scope.isLocal($scope.selectedTP);
                            }] ];

					$scope.tcCM = [
					         [	'Clone Test Case',
					          	function(modelValue) {
					        	 var obj = $scope.selectedTP.testCases[modelValue.$index];
					        	 var clone = TestObjectUtil.cloneEntity(obj);
					        	 clone.name = "[CLONE] " + clone.name;
					        	 TestObjectUtil.sanitizeDates(clone);
					        	 TestObjectUtil.sanitizeEvents(clone);
					        	 $scope.selectedTP.testCases.push(clone);
					        	 $scope.selectTC(clone);
					         } ],
					         [  'Delete Test Case',
					            function(modelValue) {
					        	 var tc = $scope.selectedTP.testCases[modelValue.$index];
					        	 if(TestObjectUtil.isLocal(tc)){
					        		 $scope.selectedTP.testCases.splice(modelValue.$index, 1);
					        		 $scope.selectTP($scope.selectedTP);
					        	 }
					        	 else{
					        		 $http.post('api/testcase/'+ tc.id +'/delete')
					        		 .then(function(r) {
					        			 $scope.selectedTP.testCases.splice(modelValue.$index,1);
					        			 $scope.selectTP($scope.selectedTP);
					        			 Notification
					        			 .success({
					        				 message : "Test Case Deleted",
					        				 delay : 1000
					        			 });
					        		 },
					        		 function(r) {
					        			 Notification
					        			 .error({
					        				 message : "Error Deleting",
					        				 delay : 1000
					        			 });
					        		 });
					        	 }
					         } ] ];
					
					$scope.fileChange = function(files) {
						console.log("change");
                        console.log(files[0].type);
						if($scope.export.type === 'NIST') {
							if(files[0].type === "text/xml") {
                                $scope.$apply(function () {
                                    $scope.sfile = files[0].name;
                                    $scope.fileErr = false;
                                    $scope.sfileO = files[0];
                                });
                            }
                            else {
                                $scope.$apply(function() {
                                    $scope.sfile = "File should be XML";
                                    $scope.fileErr = true;
                                });
							}
						}
						else {
                            if (~$scope.excelmime.indexOf(files[0].type)) {
                                $scope.$apply(function () {
                                    $scope.sfile = files[0].name;
                                    $scope.fileErr = false;
                                    $scope.sfileO = files[0];
                                });
                            }
                            else {
                                $scope.$apply(function() {
                                    $scope.sfile = "File should be Excel Spreadsheet";
                                    $scope.fileErr = true;
                                });
                            }
						}
					};
					
					$scope.sanitizeTestCase = function(tc){
						TestObjectUtil.sanitizeDates(tc);
						TestObjectUtil.sanitizeEvents(tc);
					};
					
					$scope.uploadNIST = function() {
						if ($scope.sfileO != null && !$scope.fileErr) {
                            $scope.importing = true;
							var fd = new FormData();
							fd.append("file", $scope.sfileO);
							$http
									.post(
											"api/testcase/"
													+ $scope.selectedTP.id
													+ "/import/nist",
											fd,
											{
												transformRequest : angular.identity,
												headers : {
													'Content-Type' : undefined
												}
											})
									.success(
											function(data) {
												console.log(data);
												if (data.status) {
													$scope.sanitizeTestCase(data.imported);
													$scope.selectedTP.testCases.push(data.imported);
                                                    $scope.importing = false;
                                                    Notification
                                                        .success({
                                                            message : "TestCase Imported",
                                                            delay : 1000
                                                        });
												} else {
                                                    $scope.importing = false;
													Notification
															.error({
																message : "Error While Importing",
																delay : 1000
															});
												}

												$scope.sfile = "browse";
												$scope.sfileO = null;

											}).error(function(data) {
                                		$scope.importing = false;
										Notification.error({
											message : "Error While Importing",
											delay : 1000
										});
										$scope.sfile = "browse";
										$scope.sfileO = null;
									});
						}
					};

                    $scope.$watch('importing', function (newValue, oldValue) {
                        if(newValue === false){
                            $scope.impDiag.close({});
                        }
                        else if(newValue === true){
                            $scope.impDiag = $modal.open({
                                templateUrl : 'ImportLoading.html',
                                controller : 'ConfirmTestPlanDeleteCtrl',
                                resolve : {
                                    testplanToDelete : function() {
                                        return null;
                                    },
                                    tps : function() {
                                        return $scope.tps;
                                    }
                                }
                            });
						}
                    });

                    $scope.typeChange = function(){
                        $scope.sfile = "browse";
                        $scope.sfileO = null;
                        $scope.fileErr = false;
                    };
					
					$scope.upload = function(){
						console.log($scope.export.type);
						if($scope.export.type === 'NIST'){
							$scope.uploadNIST();
						}
						else {
                            $scope.uploadCDC();
                        }
					};
					
					$scope.uploadCDC = function() {
						if ($scope.sfileO != null && !$scope.fileErr) {
                            $scope.importing = true;
							var fd = new FormData();
							fd.append("file", $scope.sfileO);
							fd.append('config', new Blob([JSON.stringify($scope.exportCDC)], {
							    type: "application/json"
							}));
							$http.post(
											"api/testcase/"
													+ $scope.selectedTP.id
													+ "/import/cdc",
											fd,
											{
												transformRequest : angular.identity,
												headers : {
													'Content-Type' : undefined
												}
											})
									.success(
											function(data) {
												console.log(data);
												if (data.status) {
													for(var i in data.testCases){
														$scope.sanitizeTestCase(data.testCases[i]);
														$scope.selectedTP.testCases.push(data.testCases[i]);
													}
                                                    Notification
                                                        .success({
                                                            message : "TestCases Imported",
                                                            delay : 1000
                                                        });
												} else {
													Notification
															.error({
																message : "Error While Importing",
																delay : 1000
															});
												}

												$scope.sfile = "browse";
												$scope.sfileO = null;
                                                $scope.importing = false;
											}).error(function(data) {
                                		$scope.importing = false;
										Notification.error({
											message : "Error While Importing",
											delay : 1000
										});
										$scope.sfile = "browse";
										$scope.sfileO = null;
									});
						}
					};

					$scope.vacFilter = function(query) {
						var lowercaseQuery = angular.lowercase(query);
						return function filterFn(vaccine) {
							var n = angular.lowercase(vaccine.name);
							var d = angular.lowercase(vaccine.details);
							var c = vaccine.cvx;
							return (n.indexOf(lowercaseQuery) === 0
									|| d.indexOf(lowercaseQuery) === 0 || c
									.indexOf(lowercaseQuery) === 0);
						};
					};

					$scope.searchV = function(query) {
						return query ? $scope.AllVaccines.filter($scope
								.vacFilter(query)) : $scope.AllVaccines;
					};

					

					$scope.exportNIST = function() {
						if ($scope.selectedTC.id != null
								&& $scope.selectedTC.id != undefined) {
							var form = document.createElement("form");
							form.action = $rootScope.api('api/testcase/'
									+ $scope.selectedTC.id + '/export/nist');
							form.method = "POST";
							form.target = "_target";
							form.style.display = 'none';
							document.body.appendChild(form);
							form.submit();
						}
					};

					$scope.tpChanged = function() {

					};

					$scope.tcChanged = function() {

					};

					$scope.unsaved = function() {
						return false;
					};

					// --------------------------------------------------------------------------------------------------------
					
					$scope.initTestCases = function() {
						$scope.loading = true;
						$scope.loadTestCases().then(function (a) {
                            $scope.initEnums().then(function (b) {
                                $scope.loadVaccines().then(function (c) {
                                    console.log($scope.tps);
                                    $scope.loading = false;
                                    $scope.error = null;
                                });
                            });
                        });
					};


					$scope.confirmDeleteTestPlan = function(testplan) {
						var modalInstance = $modal.open({
							templateUrl : 'ConfirmTestPlanDeleteCtrl.html',
							controller : 'ConfirmTestPlanDeleteCtrl',
							resolve : {
								testplanToDelete : function() {
									return testplan;
								},
								tps : function() {
									return $scope.tps;
								}
							}
						});
						modalInstance.result.then(function() {
							
						});
					};

					$scope.isLocal = function(tp) {
						return TestObjectUtil.isLocal(tp);
                    };
//----					
					$scope.prefill = function(list,x){
						var groups = $scope.getGroups(x);
						if(groups.length === 0){
							var eval = TestObjectFactory.createEvaluation();
							var mp = $scope.getMapping(x);
							console.log(x);
							eval.relatedTo = $scope.getVx(mp.vx.cvx);
							list.push(eval);
						}
						else {
							for(var i in groups){
								var eval = TestObjectFactory.createEvaluation();
								eval.relatedTo = $scope.getVx(groups[i].cvx);
								list.push(eval);
							}
						}
					};
					
					$scope.getVx =  function(x){
						return VaccineService.getVx($scope.vxm,x);
					};
					$scope.getMapping =  function(x){
						return VaccineService.getMapping($scope.vxm,x);
					};
					$scope.getGroups =  function(x){
						return VaccineService.getGroups($scope.vxm,x);
					};
//----
					$scope.selectTPTab = function(value) {
						if (value === 1) {
							$scope.accordi.tpList = false;
							$scope.accordi.tpDetails = true;
						} else {
							$scope.accordi.tpList = true;
							$scope.accordi.tpDetails = false;
						}
					};

					$scope.saveableTC = function(tc) {
						var obj = $scope.validateTC(tc);
						if (obj.errorMessages.length > 0 || obj.within.length > 0) {
							console.log(tc);
							console.log(obj);
							$scope.control.error.isSet = true;
							$scope.control.error.obj.push(obj);
							$scope.control.error.tc = tc;
							return null;
						} else {
							var _tc = JSON.parse(JSON.stringify(tc));
							$scope.prepareTestCase(_tc);
							return _tc;
						}
					};
                    // TestObjectSynchronize
					$scope.saveTC = function(tp, tc, id) {
						var deferred = $q.defer();
						if (tc === null) {
							deferred.resolve(false);
						} else {
							if(TestObjectUtil.isLocal(tp)){
								console.log("TP is Local => Save TP");
								return $scope.saveTP(tp);
							}
							console.log("DIRECT SAVE");
							console.log(tc);
							$http.post('api/testcase/' + tp.id + '/save', tc)
							.then(function(response) {
								console.log("Saving");
								console.log(tc);
								
								var newTC = response.data;
								TestObjectUtil.sanitizeDates(newTC);
								TestObjectUtil.sanitizeEvents(newTC);
								var i = TestObjectUtil.index(tp.testCases,"id",id);
								TestObjectUtil.synchronize(id,tp.testCases,newTC);
								tc = newTC;
								//$scope.selectTC(newTC);
								deferred.resolve({
									status : true,
									id : i
								});
							}, 
							function(error) {
								console.log("Save Error");
								deferred.resolve({
									status : false
								});
							});
						}
						return deferred.promise;
					};

                    $scope.saveTPOnly = function(tp) {
                        var deferred = $q.defer();
                        var _tp = JSON.parse(JSON.stringify(tp));
                        var id = _tp.id;
                        if(TestObjectUtil.isLocal(_tp)){
                            delete _tp.id;
                        }
                        delete _tp.testCases;
                        TestObjectUtil.cleanObject(_tp,new RegExp("^_.*"));
                        $http.post('api/testplan/save', _tp).then(function(response) {
								var newTP = response.data;
								TestObjectUtil.sanitizeDates(newTP);
								TestObjectUtil.sanitizeEvents(newTP);
								TestObjectUtil.synchronize(id,$scope.tps,newTP);
								tp = newTP;
								$scope.selectTP(newTP);
								deferred.resolve({
									status : true
								});
							},
							function(error) {
                        		deferred.resolve({
									status : false
								});
                        });
                    };

					$scope.saveTP = function(tp) {
						var deferred = $q.defer();
						var ready = true;
						var _tp = JSON.parse(JSON.stringify(tp));
						for ( var tc in tp.testCases) {
							var _tc = $scope.saveableTC(_tp.testCases[tc]);
							if (_tc === null) {
								console.log("NOT S");
								deferred.resolve({
									status : false
								});
								ready = false;
								break;
							} else {
								_tp.testCases[tc] = _tc;
							}
						}

						if (ready) {
							var id = _tp.id;
							if(TestObjectUtil.isLocal(_tp)){
								delete _tp.id;
							}
                            TestObjectUtil.cleanObject(_tp,new RegExp("^_.*"));
							console.log("DIRECT SAVE");
							console.log(_tp);
							$http.post('api/testplan/save', _tp)
							.then(function(response) {

								var newTP = response.data;
								for(var tc in newTP.testCases){
									TestObjectUtil.sanitizeEvents(newTP.testCases[tc]);
								}
								TestObjectUtil.sanitizeDates(newTP);
								TestObjectUtil.synchronize(id,$scope.tps,newTP);
								tp = newTP;
								$scope.selectTP(newTP);
								deferred.resolve({
									status : true
								});
							}, 
							function(error) {
								deferred.resolve({
									status : false
								});
							});
						}
						return deferred.promise;
					};

					$scope.saveAllChangedTestPlans = function() {
						$scope.control.error.isSet = false;
						$scope.control.error.obj = [];

						if ($scope.aTPisSelected() && !$scope.aTCisSelected()) {
                            console.log("Saving");
                            console.log($scope.selectedTP);

                            TestObjectSynchronize.syncTP($scope.tps,$scope.selectedTP).then(
                                function (result) {
                                    Notification.success({
                                        message : result.message,
                                        delay : 1000
                                    });
                                },
                                function (result) {
                                    Notification.error({
                                        message : result.message,
                                        delay : 1000
                                    });
                                }
                            );
							// $scope.saveTP($scope.selectedTP)
							// .then(function(response) {
							// 	if (response.status) {
							// 		Notification.success({
							// 			message : "Test Plan Saved",
							// 			delay : 1000
							// 		});
							// 	} else {
							// 		Notification.error({
							// 			message : "Error Saving",
							// 			delay : 1000
							// 		});
							// 	}
							// },
							// function(error) {
							// 	Notification.error({
							// 		message : "Error Saving",
							// 		delay : 1000
							// 	});
							// });
							
						} else if ($scope.aTCisSelected()) {
							console.log("Saving");
							console.log($scope.selectedTC);

							//------ Validation
                            var obj = $scope.validateTC($scope.selectedTC);
                            var validation = {};
                            if (obj.errorMessages.length > 0 || obj.within.length > 0) {
                                validation.saveable = false;
                                validation.errors = ["ER1","ER2"];
                                console.log(obj);
                            }
                            else {
                                validation.saveable = true;
							}
							//------- Validation

                            TestObjectSynchronize.syncTC($scope.tps, $scope.selectedTP, $scope.selectedTC, validation).then(
                            	function (result) {
                            		$scope.selectTC(result.tc);
									Notification.success({
										message : result.message,
										delay : 1000
									});
                                },
                                function (result) {

                            		if(result.hasOwnProperty("errors")){
                                        $scope.control.error.isSet = true;
									}
                                    Notification.error({
                                        message : result.message,
                                        delay : 1000
                                    });
                                }
							);
							// if (tc !== null) {
							// 	$scope.saveTC($scope.selectedTP, tc , $scope.selectedTC.id)
							// 	.then(function(response) {
							// 		console.log(response);
							// 		if (response.status) {
							// 			Notification
							// 			.success({
							// 				message : "Test Case Saved",
							// 				delay : 1000
							// 			});
							// 			$scope.selectTC($scope.selectedTP.testCases[response.id]);
							// 		}
							// 		else {
							// 			Notification
							// 			.error({
							// 				message : "Error Saving",
							// 				delay : 1000
							// 			});
							// 		}
							// 	},
							// 	function(error) {
							// 		Notification
							// 		.error({
							// 			message : "Error Saving",
							// 			delay : 1000
							// 		});
							// 	});
							// }
						}
					};

				});

angular.module('tcl').controller('ConfirmTestPlanDeleteCtrl',
	function($scope, $uibModalInstance, testplanToDelete, tps, $http) {
		$scope.testplanToDelete = testplanToDelete;
		$scope.loading = false;
		$scope.deleteTestPlan = function() {
			$scope.loading = true;
			if ((typeof testplanToDelete.id) === "string" && testplanToDelete.id.startsWith("cl_")) {
				var id = $scope.getIndex(tps, testplanToDelete.id);
				if (~id) {
					tps.splice(id, 1);
				}
                $scope.loading = false;
                $uibModalInstance.dismiss('cancel');
                $rootScope.msg().text = "testplanDeleteSuccess";
                $rootScope.msg().type = "success";
                $rootScope.msg().show = true;
			} 
			else {
				$http.post('api/testplan/'+ $scope.testplanToDelete.id + '/delete')
				.then(function(response) {
					var id = $scope.getIndex(tps,testplanToDelete.id);
					if (~id) {
						tps.splice(id, 1);
					}

					$scope.loading = false;
					$uibModalInstance.dismiss('cancel');
					$rootScope.msg().text = "testplanDeleteSuccess";
					$rootScope.msg().type = "success";
					$rootScope.msg().show = true;
				},
				function(error) {
					$scope.error = error;
					$scope.loading = false;
                    $uibModalInstance.dismiss('cancel');
					$rootScope.msg().text = "testplanDeleteFailed";
					$rootScope.msg().type = "danger";
					$rootScope.msg().show = true;
				});
			}			
		};

		$scope.getIndex = function(l, id) {
			for (var i = 0; i < l.length; i++) {
				if (l[i].id === id) {
					return i;
				}
			}
			return -1;
		};

		$scope.cancel = function() {
            $uibModalInstance.dismiss('cancel');
		};
});

angular.module('tcl').controller('VaccineBrowseCtrl',
		function($scope, $uibModalInstance, mappings, allowMvx, groups, $http, $filter) {
			$scope.vxgs = groups;
			$scope.vxm = mappings;
			$scope.allowMvx = allowMvx;
			$scope.vxGroups = [];
			$scope.vxT = "generic";
			$scope.filterData = [];
			$scope.filterPr = [];
			$scope.generic = true;
			$scope.selectedMapping = {};
			$scope.pageSize = 12;
			$scope.nbPagesG = Math.ceil($scope.vxm.length/$scope.pageSize);
			$scope.nbPagesS = 0;
			$scope.pcG = 1;
			$scope.pcS = 1;
			
			$scope.pages = function(list){
				var nb = $scope.nbPages(list);
				if(nb === 0){
					return [];
				}
				else
					return new Array(nb);
			};
			
			$scope.nbPages = function(list){
				if(!list || list.length === 0){
					return 0;
				}
				else {
					var nb = list.length / $scope.pageSize;
					return Math.ceil(nb);
				}
			};
			
			$scope.zoom = function(mp){
				$scope.generic = false;
				$scope.searchtxt = "";
				$scope.selectedMapping = mp;
			};
			
			$scope.unzoom = function(){
				$scope.generic = true;
				$scope.searchtxt = "";
				$scope.selectedMapping = {};
			};
			
			$scope.getNumber = function(num) {
				if(num == 0 || num < 0)
					return [];
				console.log(num);
			    return new Array(num);   
			};
			
			$scope.filterList = function(list,search){
				if (!list || list.length === 0) { 
					return []; 
				}
				else if(!search || search === ""){
					return list;
				}
				else {
					var str = search.toLowerCase();
					l = list.filter(function (item) {
						  return item.vx.name.toLowerCase().includes(str) || item.vx.cvx.includes(str);
					});
					$scope.nbT = Math.floor(l.length/6);
					$scope.cbT = 1;
					return l;
				}
			};
			
			$scope.goToPageG = function(num) {
				$scope.pcG = num;
			};
			
			$scope.goToPageS = function(num,v) {
				$scope.pcS = num;
			};
			
			$scope.forward = function() {
				var nb = ($scope.cbT + 1) % $scope.nbT;
				if(nb == 0)
					$scope.cbT = 1;
				else
					$scope.cbT = nb;
			};
			
			$scope.backward = function() {
				var nb = ($scope.cbT -1 ) % $scope.nbT;
				if(nb == -1)
					$scope.cbT = 1;
				else
					$scope.cbT = nb;
			};
			
			$scope.ceil = function(x){
				if(x === 0)
					return 0;
				return Math.ceil(x);
			};
			
			$scope.cancel = function() {
				$uibModalInstance.dismiss('cancel');
			};
			
			$scope.hasGroup = function(mp,gr){
				if(mp.groups && mp.groups.length !== 0){
					var found = false;
					for(var mG in mp.groups){
						if(mp.groups[mG].cvx === gr.cvx){
							found = true;
							break;
						}
					}
					return found;
				}
				return false;
			};
			$scope.tileCoords = function(index){
				var x = index % 2;
				var y = Math.floor(index/2);
				return { 'x' : x, 'y' : y%2 };
			};
			
			$scope.isW = function(index){
				var coords = $scope.tileCoords(index);
				if((coords.x - coords.y) === 0)
					return true;
				else
					return false;
			};
			
			$scope.select = function(x){
				var v = JSON.parse(JSON.stringify(x));
				$uibModalInstance.close(v);
			};
			
			$scope.vxdataChange = function(){
				$scope.pcG = 1;
				$scope.pcS = 1;
			};
	});
