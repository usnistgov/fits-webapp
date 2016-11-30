/**
 * Created by Jungyub on 5/12/16
 */
angular.module('tcl').controller('ImportCtrl',
		function($scope, $rootScope, Restangular, $http, $filter, $modal) {

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
						AutoSaveService, $sce, Notification) {
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

					$(document)
							.keydown(
									function(e) {
										var nodeName = e.target.nodeName
												.toLowerCase();

										if (e.which === 8) {
											if ((nodeName === 'input' && e.target.type === 'text')
													|| nodeName === 'textarea') {
												// do nothing
											} else {
												e.preventDefault();
											}
										}
									});

					// ------------------------------------------------------------------------------------------
					// CDSI TCAMT
					$scope.selectedEvent = null;
					$scope.selectedForecast = null;
					$scope.selectedTP = null;
					$scope.selectedTC = null;
					$scope.selectedTG = null;
					$scope.tps = [];
					$scope.tpTree = [];
					$scope.control = {
						error : {
							isSet : false,
							tc : null,
							obj : null,
						}
					};

					$scope.generateUUID = function() {
					    var d = new Date().getTime();
					    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
					        var r = (d + Math.random()*16)%16 | 0;
					        d = Math.floor(d/16);
					        return (c=='x' ? r : (r&0x3|0x8)).toString(16);
					    });
					    return uuid;
					};
					
					$scope.getIndex = function(l,id){
						for(var i = 0; i < l.length; i++){
							if(l[i].id === id){
								return i;
							}
						}
						return -1;
					};
					
					$scope.loadTestCases = function() {
						var delay = $q.defer();
						$scope.error = null;
						$scope.loading = true;

						$http
								.get('api/testplans')
								.then(
										function(response) {
											$scope.tps = angular
													.fromJson(response.data);
											for (p in $scope.tps) {
												for (t in $scope.tps[p].testCases) {
													$scope
															.sanitizeDate($scope.tps[p].metaData.dateCreated);
													$scope
															.sanitizeDate($scope.tps[p].metaData.dateLastUpdated);
													$scope
															.sanitizeTestCase($scope.tps[p].testCases[t]);
												}
											}
											$scope.loading = false;
											delay.resolve(true);
										}, function(error) {
											$scope.loading = false;
											$scope.error = error.data;
											delay.reject(false);

										});
					};

					$scope.selectEvent = function(e) {
						waitingDialog.show('Opening event...', {
							dialogSize : 'xs',
							progressType : 'info'
						});
						$timeout(function() {
							// Selection
							var ch = $scope.selectedTC.changed;
							$scope.selectedEvent = e;
							$scope.selectedForecast = null;
							$scope.selectedType = "evt";
							// Clean
							$scope.removeTMP(e[e.type].evaluations);
							$rootScope.$broadcast('initDate');
							// View
							$scope.subview = "EditEventData.html";
							waitingDialog.hide();
							if(!ch)
								$scope.selectedTC.changed = false;
						}, 0);
					};

					$scope.selectForecast = function(f) {
						waitingDialog.show('Opening forecast...', {
							dialogSize : 'xs',
							progressType : 'info'
						});
						$timeout(function() {
							// Selection
							var ch = $scope.selectedTC.changed;
							$scope.selectedForecast = f;
							$scope.selectedEvent = null;
							$scope.selectedType = "fc";
							// View
							$scope.subview = "EditForecastData.html";
							waitingDialog.hide();
							if(!ch)
								$scope.selectedTC.changed = false;
						}, 0);
					};

					$scope.selectTP = function(tp) {
						waitingDialog.show('Opening Test Plan...', {
							dialogSize : 'xs',
							progressType : 'info'
						});
						$timeout(function() {
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
							$scope.selectedTP.changed = false;
						}, 0);
					};

					$scope.selectTC = function(tc) {
						waitingDialog.show('Opening Test Case...', {
							dialogSize : 'xs',
							progressType : 'info'
						});
						console.log("DEBUG");
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

							if ((has(dt, "type") && dt.type === "fixed")
									|| (!has(dt, "type") && has(dt, "fixed"))) {
								errors.errorMessages.push.apply(
										errors.errorMessages, $scope
												.validateDTFX(dt.fixed));
							} else if ((has(dt, "type") && dt.type === "relative")
									|| (!has(dt, "type") && has(dt, "relative"))) {
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

								if (!has(vaccination, "type"))
									errors.errorMessages
											.push("Event must have a type");

								if (!has(vaccination, "doseNumber"))
									errors.errorMessages
											.push("Event must have a dose number");

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
							if (!has(vc, "name")) {
								errors.errorMessages.push("Invalid vaccine");
								return errors;
							} else {
								errors.id = vc.name;
							}

							if (!has(vc, "id")) {
								errors.errorMessages.push("Invalid vaccine");
								return errors;
							}

							if (!has(vc, "cvx")) {
								errors.errorMessages.push("Invalid vaccine");
								return errors;
							}

							if (!has(vc, "details")) {
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
							if (!has(fc, "forecastReason"))
								errors.errorMessages
										.push("Forecast must have a reason");
							
							if (!has(fc, "serieStatus"))
								errors.errorMessages
										.push("Forecast must have a status");
							else {
								
								if(fc.serieStatus !== 'C'){
									if (!has(fc, "earliest"))
										errors.errorMessages
												.push("Forecast must have an earliest date");
									else {
										$scope.mergeErrors(errors.within, $scope
												.validateDT(fc.earliest, "Earliest"));
									}

									if (!has(fc, "recommended"))
										errors.errorMessages
												.push("Forecast must have a recommended date");
									else {
										$scope.mergeErrors(errors.within, $scope
												.validateDT(fc.recommended,
														"Recommended"));
									}

									if (!has(fc, "pastDue"))
										errors.errorMessages
												.push("Forecast must have a pastDue date");
									else {
										$scope.mergeErrors(errors.within, $scope
												.validateDT(fc.pastDue, "Past Due"));
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

					$scope.removeTMP = function(list) {

						for (e in list) {
							if (list[e].hasOwnProperty("tmp")) {
								if(list[e].tmp){
									list.splice(e, 1);
									$scope.removeTMP(list);
									break;
								}
								else {
									delete list[e].tmp;
								}
							}
						}
					};

					$scope.addEvent = function() {
						var ev = {
								type : "vaccination",
								vaccination : {
									administred : null,
									evaluations : [],
									type : "VACCINATION",
									date : {
										fixed : {
											date : null,
											obj : null
										}
									},
									doseNumber : $scope.selectedTC.events.length + 1
								}
							};
						$scope.selectedTC.events.push(ev);
						$scope.selectEvent(ev);
					};

					$scope.addForecast = function() {
						var fc = {
								doseNumber : 0,
								forecastReason : "",
								earliest : {
									fixed : {
										date : null,
										obj : null
									}
								},
								recommended : {
									fixed : {
										date : null,
										obj : null
									}
								},
								pastDue : {
									fixed : {
										date : null,
										obj : null
									}
								},
								target : null
							};
						$scope.selectedTC.forecast.push(fc);
						$scope.selectForecast(fc);
					};

					$scope.sanitizeDate = function(date) {
						if (date.hasOwnProperty("fixed")) {
							date.fixed.obj = new Date(date.fixed.date);
							if(!date.hasOwnProperty("relative")){
								date.type = "fixed";
							}
						}
						else if(date.hasOwnProperty("relative")){
							date.type = "relative";
						}
					};

					$scope.cleanDate = function(date) {
						if (date.hasOwnProperty("fixed")) {
							if (date.fixed.hasOwnProperty("obj")) {
								delete date.fixed.obj;
							}
						}
						if(date.hasOwnProperty("type")){
							if(date.type === "fixed"){
								delete date.relative;
							}
							else if(date.type === "relative"){
								delete date.fixed;
							}
							delete date.type;
						}
					};

					$scope.sanitizeTestCase = function(tc) {
						$scope.sanitizeDate(tc.patient.dob);
						$scope.sanitizeDate(tc.evalDate);
						$scope.sanitizeDate(tc.metaData.dateCreated);
						$scope.sanitizeDate(tc.metaData.dateLastUpdated);
						for (e in tc.events) {
							var keys = [];
							for ( var k in tc.events[e])
								keys.push(k);
							tc.events[e].type = keys[0];
							$scope.sanitizeDate(tc.events[e][keys[0]].date);
						}
						for (f in tc.forecast) {
							$scope.sanitizeDate(tc.forecast[f].earliest);
							$scope.sanitizeDate(tc.forecast[f].recommended);
							$scope.sanitizeDate(tc.forecast[f].pastDue);
						}
					};

					$scope.prepareTestCase = function(tc) {
						console.log((typeof tc.id) === "string");
						if((typeof tc.id) === "string" && tc.id.startsWith("cl_")){
							delete tc.id;
						}
						if(tc.hasOwnProperty("changed")){
							delete tc.changed;
						}
						if(tc.hasOwnProperty("position")){
							delete tc.position;
						}
						$scope.cleanDate(tc.patient.dob);
						$scope.cleanDate(tc.evalDate);
						$scope.cleanDate(tc.metaData.dateCreated);
						$scope.cleanDate(tc.metaData.dateLastUpdated);
						for (var e in tc.events) {
							delete tc.events[e].type;
							var keys = [];
							for ( var k in tc.events[e])
								keys.push(k);
							$scope.removeTMP(tc.events[e][keys[0]].evaluations);
							$scope.cleanDate(tc.events[e][keys[0]].date);
						}
						for (var f in tc.forecast) {
	
							$scope.cleanDate(tc.forecast[f].earliest);
							$scope.cleanDate(tc.forecast[f].recommended);
							$scope.cleanDate(tc.forecast[f].pastDue);
							
						}
					};

					$scope.noID = function(elm) {
						var has = $scope.has;
						if (elm && has(elm, "id")) {
							delete elm.id;
						}
					};

					$scope.noIDD = function(date) {
						var has = $scope.has;
						if (date && has(date, "fixed")) {
							delete date.fixed.id;
						}
						if (date && has(date, "relative")) {
							delete date.relative.id;
						}
					};

					$scope.anonymizeTestCase = function(tc) {
						var noID = $scope.noID;
						var noIDD = $scope.noIDD;
						noID(tc);
						noIDD(tc.evalDate);
						noID(tc.patient);
						noIDD(tc.patient.dob);
						noID(tc.metaData);
						noIDD(tc.metaData.dateCreated);
						noIDD(tc.metaData.dateLastUpdated);
						for (e in tc.events) {
							var keys = [];
							for ( var k in tc.events[e])
								keys.push(k);

							noID(tc.events[e][keys[0]]);
							noIDD(tc.events[e][keys[0]].date);
							for ( var ev in tc.events[e][keys[0]].evaluations) {
								noID(tc.events[e][keys[0]].evaluations[ev]);
							}
						}
						for (f in tc.forecast) {
							noID(tc.forecast[f]);
							noIDD(tc.forecast[f].earliest);
							noIDD(tc.forecast[f].recommended);
							noIDD(tc.forecast[f].pastDue);
						}
					};

					$rootScope.dateChange = function(dateObj) {
						console.log("change");
						dateObj.date = dateObj.obj.getTime();
					};

					$scope.has = function(a, b) {
						return a.hasOwnProperty(b) && a[b];
					}

					$scope.newEvaluation = function(list) {
						var eval = {
							relatedTo : null,
							status : "",
							tmp : true
						};
						list.push(eval);
					};

					$scope.addEvaluation = function(eval) {
						eval.tmp = false;
					};

					$scope.deleteEvaluation = function(list, index) {
						list.splice(index, 1);
					};

					$scope.eventCM = [ [ 'Delete Event', function(modelValue) {
						$scope.selectedTC.events.splice(modelValue.$index, 1);
						$scope.selectTC($scope.selectedTC);
						$scope.tcChanged();
					} ] ];
					
					$scope.importButton = function(){
						$scope.selectTP($scope.selectedTP);
						$scope.selectedTabTP = 1;
					};
					
					$scope.newTC = function(){
						var dt = new Date();
						return {
								id : "cl_"+$scope.generateUUID(),
								name : "New TC",
								changed : true,
								description : "",
								patient : {
									dob : {
										fixed : {
											date : null,
											obj : null
										}
									},
									gender : "",
								},
								metaData : {
									version : 1,
									imported : false,
									dateCreated : {
										fixed : {
											date : dt.getTime(),
											obj : new Date()
										}
									},
									dateLastUpdated : {
										fixed : {
											date : dt.getTime(),
											obj : new Date()
										}
									}
								},
								evalDate : {
									fixed : {
										date : null,
										obj : null
									}
								},
								events : [],
								forecast : []
						};
					};
					$scope.forecastCM = [ [
							'Delete Forecast',
							function(modelValue) {
								$scope.selectedTC.forecast.splice(
										modelValue.$index, 1);
								$scope.selectTC($scope.selectedTC);
								$scope.tcChanged();
							} ] ];

					$scope.tpCM = [ [ 'Add Test Case', function(modelValue) {
						var tc = $scope.newTC();
						$scope.selectedTP.testCases.push(tc);
						$scope.selectTC(tc);
					} ], [ 'Import Test Case', function(modelValue) {
						$scope.selectTP($scope.selectedTP);
						$scope.selectedTabTP = 1;
					} ] ];

					$scope.fileChange = function(files) {
						console.log("change");
						if (files[0].type === "text/xml") {
							console.log("in selected xml");
							$scope.$apply(function() {
								$scope.sfile = files[0].name;
								$scope.fileErr = false;
								$scope.sfileO = files[0];
							});

						} else {
							console.log("in selected not xml");
							$scope.$apply(function() {
								$scope.sfile = "File should be XML";
								$scope.fileErr = true;
							});
						}
					};
					
					$scope.upload = function() {
						if ($scope.sfileO != null && !$scope.fileErr) {
							var fd = new FormData();
							fd.append("file", $scope.sfileO);
							$http.post("api/testcase/"+$scope.selectedTP.id+"/import", fd, {
								transformRequest : angular.identity,
								headers : {
									'Content-Type' : undefined
								}
							}).success(function(data) {
								console.log(data);
								if(data.status){
									$scope.sanitizeTestCase(data.imported);
									$scope.selectedTP.testCases.push(data.imported);
								}
								else {
									Notification.error({
										message : "Error While Importing",
										delay : 1000
									});
								}
								
								$scope.sfile = "browse";
								$scope.sfileO = null;
							}).error(function(data) {
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
			            	return (n.indexOf(lowercaseQuery) === 0 || d.indexOf(lowercaseQuery) === 0 || c.indexOf(lowercaseQuery) === 0);
			            };
			        };
			        
			        $scope.searchV = function(query) {
			              return query ? $scope.AllVaccines.filter( $scope.vacFilter(query) ) : $scope.AllVaccines; 
			        };
			        
					$scope.tcCM = [

							[
									'Clone Test Case',
									function(modelValue) {
										var obj = $scope.selectedTP.testCases[modelValue.$index];
										var clone = JSON.parse(JSON
												.stringify(obj));
										clone.name = "[CLONE] " + clone.name;
										$scope.sanitizeTestCase(clone);
										$scope.anonymizeTestCase(clone);
										clone.id = "cl_"+$scope.generateUUID();
										$scope.selectedTP.testCases.push(clone);
										$scope.selectTC(clone);
									} ],
							[
									'Delete Test Case',
									function(modelValue) {
										var tc = $scope.selectedTP.testCases[modelValue.$index];
										if((typeof tc.id) === "string" && tc.id.startsWith("cl_")){
											$scope.selectedTP.testCases.splice(modelValue.$index, 1);
											$scope.selectTP($scope.selectedTP);
										}
										else {
											$http.post('api/testcase/'+tc.id+'/delete')
											.then(function(r){
												$scope.selectedTP.testCases.splice(modelValue.$index, 1);
												$scope.selectTP($scope.selectedTP);
												Notification.success({
													message : "Test Case Deleted",
													delay : 1000
												});
											},
											function(r){
												Notification.error({
													message : "Error Deleting",
													delay : 1000
												});
											});
										}
										
									} ] ];

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
						console.log("TP CHANGED");
						$scope.selectedTP.changed = true;
					};
					
					$scope.tcChanged = function() {
						console.log("TC CHANGED");
						$scope.selectedTC.changed = true;
					};
					
					$scope.unsaved = function() {
						return ($scope.aTPisSelected() && $scope.selectedTP.changed) || ($scope.aTCisSelected() && $scope.selectedTC.changed);
					};
					
					// --------------------------------------------------------------------------------------------------------

					$scope.exportTestPackageHTML = function() {
						var changes = angular.toJson([]);
						var data = angular.fromJson({
							"changes" : changes,
							"tp" : $rootScope.selectedTestPlan
						});
						$http
								.post('api/testplans/save', data)
								.then(
										function(response) {
											var saveResponse = angular
													.fromJson(response.data);
											$rootScope.selectedTestPlan.lastUpdateDate = saveResponse.date;
											$rootScope.saved = true;

											var form = document
													.createElement("form");
											form.action = $rootScope
													.api('api/testplans/'
															+ $rootScope.selectedTestPlan.id
															+ '/exportTestPackageHTML/');
											form.method = "POST";
											form.target = "_target";
											var csrfInput = document
													.createElement("input");
											csrfInput.name = "X-XSRF-TOKEN";
											csrfInput.value = $cookies['XSRF-TOKEN'];
											form.appendChild(csrfInput);
											form.style.display = 'none';
											document.body.appendChild(form);
											form.submit();

										}, function(error) {
											$rootScope.saved = false;
										});
					};

					$scope.exportResourceBundleZip = function() {
						var changes = angular.toJson([]);
						var data = angular.fromJson({
							"changes" : changes,
							"tp" : $rootScope.selectedTestPlan
						});
						$http
								.post('api/testplans/save', data)
								.then(
										function(response) {
											var saveResponse = angular
													.fromJson(response.data);
											$rootScope.selectedTestPlan.lastUpdateDate = saveResponse.date;
											$rootScope.saved = true;

											var form = document
													.createElement("form");
											form.action = $rootScope
													.api('api/testplans/'
															+ $rootScope.selectedTestPlan.id
															+ '/exportRBZip/');
											form.method = "POST";
											form.target = "_target";
											var csrfInput = document
													.createElement("input");
											csrfInput.name = "X-XSRF-TOKEN";
											csrfInput.value = $cookies['XSRF-TOKEN'];
											form.appendChild(csrfInput);
											form.style.display = 'none';
											document.body.appendChild(form);
											form.submit();

										}, function(error) {
											$rootScope.saved = false;
										});
					};

					$scope.exportCoverHTML = function() {
						var changes = angular.toJson([]);
						var data = angular.fromJson({
							"changes" : changes,
							"tp" : $rootScope.selectedTestPlan
						});
						$http
								.post('api/testplans/save', data)
								.then(
										function(response) {
											var saveResponse = angular
													.fromJson(response.data);
											$rootScope.selectedTestPlan.lastUpdateDate = saveResponse.date;
											$rootScope.saved = true;
										}, function(error) {
											$rootScope.saved = false;
										});

						var form = document.createElement("form");
						form.action = $rootScope.api('api/testplans/'
								+ $rootScope.selectedTestPlan.id
								+ '/exportCover/');
						form.method = "POST";
						form.target = "_target";
						var csrfInput = document.createElement("input");
						csrfInput.name = "X-XSRF-TOKEN";
						csrfInput.value = $cookies['XSRF-TOKEN'];
						form.appendChild(csrfInput);
						form.style.display = 'none';
						document.body.appendChild(form);
						form.submit();

					};

					$scope.loadTestPlans = function() {
						var delay = $q.defer();
						$scope.error = null;
						$rootScope.tps = [];

						if (userInfoService.isAuthenticated()
								&& !userInfoService.isPending()) {
							waitingDialog.show('Loading TestPlans...', {
								dialogSize : 'xs',
								progressType : 'info'
							});
							$scope.loading = true;
							$http.get('api/testplans').then(function(response) {
								waitingDialog.hide();
								$scope.tps = angular.fromJson(response.data);
								$scope.loading = false;
								delay.resolve(true);
							}, function(error) {
								$scope.loading = false;
								$scope.error = error.data;
								waitingDialog.hide();
								delay.reject(false);
							});
						} else {
							delay.reject(false);
						}
						return delay.promise;
					};

					$scope.exportProfileXMLs = function() {

						var listOfIGID = [];
						$rootScope.selectedTestPlan.children
								.forEach(function(child) {
									if (child.type == "testcasegroup") {
										child.testcases
												.forEach(function(testcase) {
													var testCaseName = testcase.name;
													testcase.teststeps
															.forEach(function(
																	teststep) {
																listOfIGID
																		.push(teststep.integrationProfileId);
															});
												});
									} else if (child.type == "testcase") {
										child.teststeps
												.forEach(function(teststep) {
													var testCaseName = testcase.name;
													listOfIGID
															.push(teststep.integrationProfileId);
												});
									}
								});

						var form = document.createElement("form");
						form.action = $rootScope.api('api/testplans/'
								+ listOfIGID + '/exportProfileXMLs/');
						form.method = "POST";
						form.target = "_target";
						var csrfInput = document.createElement("input");
						csrfInput.name = "X-XSRF-TOKEN";
						csrfInput.value = $cookies['XSRF-TOKEN'];
						form.appendChild(csrfInput);
						form.style.display = 'none';
						document.body.appendChild(form);
						form.submit();
					};

					$scope.loadIGDocuments = function() {
						var delay = $q.defer();
						$scope.error = null;
						$rootScope.igs = [];
						$scope.loading = true;

						$http.get('api/igdocuments').then(function(response) {
							$rootScope.igs = angular.fromJson(response.data);
							$scope.loading = false;
							delay.resolve(true);
						}, function(error) {
							$scope.loading = false;
							$scope.error = error.data;
							delay.reject(false);

						});
					};

					$scope.loadTemplate = function() {
						var delay = $q.defer();
						$scope.error = null;
						$rootScope.templatesToc = [];
						$rootScope.template = {};
						$scope.loading = true;

						$http.get('api/template').then(
								function(response) {
									$rootScope.template = angular
											.fromJson(response.data);
									$rootScope.templatesToc
											.push($rootScope.template);
									$scope.loading = false;
									delay.resolve(true);
								}, function(error) {
									$scope.loading = false;
									$scope.error = error.data;
									delay.reject(false);

								});
					};

					$scope.applyConformanceProfile = function(igid, mid) {
						$rootScope.selectedTestStep.integrationProfileId = igid;
						$rootScope.selectedTestStep.conformanceProfileId = mid;
						$scope.loadIntegrationProfile();
					};

					$scope.initTestCases = function() {
						$scope.loadTestCases();
						$scope.loadVaccines();
					};

					$scope.loadVaccines = function() {
						var delay = $q.defer();
						$scope.error = null;
						$scope.AllVaccines = [];
						$scope.loading = true;

						$http.get('api/vaccines').then(
								function(response) {
									$scope.AllVaccines = angular
											.fromJson(response.data);
									$scope.loading = false;
									delay.resolve(true);
								}, function(error) {
									$scope.loading = false;
									$scope.error = error.data;
									delay.reject(false);
								});
					};

					$scope.deleteProfile = function() {
						$rootScope.selectedIntegrationProfile = null;
						$rootScope.selectedConformanceProfile = null;
						$rootScope.selectedTestStep.integrationProfileId = null;
						$rootScope.selectedTestStep.conformanceProfileId = null;
					};

					$scope.isNotManualTestStep = function() {
						if ($rootScope.selectedTestStep == null
								|| $rootScope.selectedTestStep.integrationProfileId == null)
							return false;
						return true;
					};

					$rootScope.processMessageTree = function(element, parent) {
						try {
							if (element != undefined && element != null) {
								if (element.type === "message") {
									var m = {};
									m.children = [];
									$rootScope.messageTree = m;

									angular.forEach(element.children, function(
											segmentRefOrGroup) {
										$rootScope.processMessageTree(
												segmentRefOrGroup, m);
									});

								} else if (element.type === "group"
										&& element.children) {
									var g = {};
									g.path = element.position + "[1]";
									g.obj = element;
									g.children = [];
									if (parent.path) {
										g.path = parent.path + "."
												+ element.position + "[1]";
									}
									parent.children.push(g);
									angular.forEach(element.children, function(
											segmentRefOrGroup) {
										$rootScope.processMessageTree(
												segmentRefOrGroup, g);
									});
								} else if (element.type === "segmentRef") {
									var s = {};
									s.path = element.position + "[1]";
									s.obj = element;
									s.children = [];
									if (parent.path) {
										s.path = parent.path + "."
												+ element.position + "[1]";
									}
									s.obj.ref.ext = s.obj.ref.ext;
									// s.obj.ref.label=$rootScope.getLabel(s.obj.ref.name,s.obj.ref.ext);
									parent.children.push(s);

									// $rootScope.processMessageTree(ref, s);

								} else if (element.type === "segment") {
									if (!parent) {
										var s = {};
										s.obj = element;
										s.path = element.name;
										s.children = [];
										parent = s;
									}

									angular.forEach(element.fields, function(
											field) {
										$rootScope.processMessageTree(field,
												parent);
									});
								}
							}
						} catch (e) {
							throw e;
						}
					};

					$scope.loadIntegrationProfile = function() {
						if ($rootScope.selectedTestStep.integrationProfileId != undefined
								&& $rootScope.selectedTestStep.integrationProfileId !== null) {
							$http
									.get(
											'api/igdocuments/'
													+ $rootScope.selectedTestStep.integrationProfileId
													+ '/tcamtProfile')
									.then(
											function(response) {
												$rootScope.selectedIntegrationProfile = angular
														.fromJson(response.data);
												$scope.loadConformanceProfile();
											},
											function(error) {
												$rootScope.selectedIntegrationProfile = null;
												$rootScope.selectedTestStep.integrationProfileId = null;
												$rootScope.selectedTestStep.conformanceProfileId = null;
											});
						} else {
							$rootScope.selectedIntegrationProfile = null;
							$rootScope.selectedTestStep.integrationProfileId = null;
							$rootScope.selectedTestStep.conformanceProfileId = null;
						}
					};

					$scope.loadConformanceProfile = function() {
						if ($rootScope.selectedTestStep.conformanceProfileId != undefined
								&& $rootScope.selectedTestStep.conformanceProfileId !== '') {
							$rootScope.selectedConformanceProfile = _
									.find(
											$rootScope.selectedIntegrationProfile.messages.children,
											function(m) {
												return m.id == $rootScope.selectedTestStep.conformanceProfileId;
											});
							if ($rootScope.selectedTestStep.er7Message == null
									|| $rootScope.selectedTestStep.er7Message == '')
								$scope.generateDefaultSegmentsList();

							$scope.updateMessage();
						} else {
							$rootScope.selectedConformanceProfile = null;
						}
					};

					$scope.confirmDeleteTestPlan = function(testplan) {
						var modalInstance = $modal.open({
							templateUrl : 'ConfirmTestPlanDeleteCtrl.html',
							controller : 'ConfirmTestPlanDeleteCtrl',
							resolve : {
								testplanToDelete : function() {
									return testplan;
								}
							}
						});
						modalInstance.result.then(function(testplan) {
							$scope.testplanToDelete = testplan;
							var idxP = _.findIndex($rootScope.tps, function(
									child) {
								return child.id === testplan.id;
							});
							$rootScope.tps.splice(idxP, 1);
						});
					};

					$scope.openCreateMessageTemplateModal = function() {
						var modalInstance = $modal.open({
							templateUrl : 'MessageTemplateCreationModal.html',
							controller : 'MessageTemplateCreationModalCtrl',
							size : 'md',
							resolve : {}
						});
						modalInstance.result.then(function() {
							$scope.recordChanged();
						});
					};

					$scope.openCreateSegmentTemplateModal = function() {
						var modalInstance = $modal.open({
							templateUrl : 'SegmentTemplateCreationModal.html',
							controller : 'SegmentTemplateCreationModalCtrl',
							size : 'md',
							resolve : {}
						});
						modalInstance.result.then(function() {
							$scope.recordChanged();
						});
					};

					$scope.openCreateEr7TemplateModal = function() {
						var modalInstance = $modal.open({
							templateUrl : 'Er7TemplateCreationModal.html',
							controller : 'Er7TemplateCreationModalCtrl',
							size : 'md',
							resolve : {}
						});
						modalInstance.result.then(function() {
							$scope.recordChanged();
						});
					};

					$scope.createNewTestPlan = function() {
						var newTestPlan = {
							id : new ObjectId().toString(),
							name : 'New TestPlan',
							accountId : userInfoService.getAccountID()
						};
						var changes = angular.toJson([]);
						var data = angular.fromJson({
							"changes" : changes,
							"tp" : newTestPlan
						});
						$http
								.post('api/testplans/save', data)
								.then(
										function(response) {
											var saveResponse = angular
													.fromJson(response.data);
											newTestPlan.lastUpdateDate = saveResponse.date;
											$rootScope.saved = true;
										}, function(error) {
											$rootScope.saved = false;
										});
						$rootScope.tps.push(newTestPlan);
						$scope.selectTestPlan(newTestPlan);
					};

					$scope.initCodemirror = function() {
						if ($scope.editor == null) {
							$scope.editor = CodeMirror.fromTextArea(document
									.getElementById("er7-textarea"), {
								lineNumbers : true,
								fixedGutter : true,
								theme : "elegant",
								readOnly : false,
								showCursorWhenSelecting : true
							});
							$scope.editor.setSize("100%", 345);
							$scope.editor.refresh();

							$scope.editor
									.on(
											"change",
											function() {
												$rootScope.selectedTestStep.er7Message = $scope.editor
														.getValue();
											});
						}
					};

					$scope.initCodemirrorOnline = function() {
						if ($scope.editorValidation == null) {
							$scope.editorValidation = CodeMirror
									.fromTextArea(
											document
													.getElementById("er7-textarea-validation"),
											{
												lineNumbers : true,
												fixedGutter : true,
												theme : "elegant",
												readOnly : false,
												showCursorWhenSelecting : true
											});
							$scope.editorValidation.setSize("100%", 345);
							$scope.editorValidation.refresh();

							$scope.editorValidation
									.on(
											"change",
											function() {
												$scope.er7MessageOnlineValidation = $scope.editorValidation
														.getValue();
											});
						}
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

					$scope.selectTest = function(testplan) {
						console.log("In Select");
						if (testplan != null) {
							waitingDialog.show('Opening Test Case ...', {
								dialogSize : 'xs',
								progressType : 'info'
							});

							$rootScope.testplans = [];
							$rootScope.testplans.push(testplan);

							console.log("Before TimeOut");
							$timeout(function() {
								$rootScope.selectedTestPlan = testplan;
								$scope.subview = "EditTestPlanMetadata.html";
								console.log("subview changed");
								waitingDialog.hide();
							}, 0);
						}
					};

					$scope.selectTestPlan1 = function(testplan) {
						console.log("In Select");
						if (testplan != null) {
							waitingDialog.show('Opening Test Plan ...', {
								dialogSize : 'xs',
								progressType : 'info'
							});
							$scope.selectTPTab(1);

							console.log("Before TimeOut");
							$timeout(function() {
								$rootScope.selectedTestPlan1 = testplan;
								$rootScope.selectedTestPlan1.obj = new Date(
										$rootScope.selectedTestPlan1.date);
								$scope.subview = "EditTestPlanData.html";
								console.log("subview changed");
								waitingDialog.hide();
							}, 0);
						}
					};

					$scope.OpenIgMetadata = function(ig) {
						$rootScope.selectedTemplate = null;
						$rootScope.selectedSegmentNode = null;
						$rootScope.selectedTestStep = null;
						$rootScope.igDocument = ig;
						$scope.subview = "EditDocumentMetadata.html";

					};

					$scope.OpenMessageMetadata = function(msg) {
						$rootScope.selectedTemplate = null;
						$rootScope.selectedSegmentNode = null;
						$rootScope.selectedTestStep = null;
						$rootScope.message = msg;
						$scope.subview = "MessageMetadata.html";

					};

					$scope.selectTestCaseGroup = function(testCaseGroup) {
						if (testCaseGroup != null) {
							waitingDialog.show('Opening Test Case Group...', {
								dialogSize : 'xs',
								progressType : 'info'
							});
							$timeout(
									function() {
										$rootScope.selectedTestCaseGroup = testCaseGroup;
										$scope.subview = "EditTestCaseGroupMetadata.html";
									}, 0);
							$timeout(function() {
								$rootScope.selectedTestStep = null;
								$rootScope.selectedTestCase = null;
								$rootScope.selectedTemplate = null;
								$rootScope.selectedSegmentNode = null;
								waitingDialog.hide();
							}, 100);
						}
					};

					$scope.selectTestCase = function(testCase) {
						if (testCase != null) {
							waitingDialog.show('Opening Test Case ...', {
								dialogSize : 'xs',
								progressType : 'info'
							});
							$timeout(function() {
								$rootScope.selectedTestCase = testCase;
								$scope.subview = "EditTestCaseMetadata.html";
							}, 0);
							$timeout(function() {
								$rootScope.selectedTestStep = null;
								$rootScope.selectedTestCaseGroup = null;
								$rootScope.selectedTemplate = null;
								$rootScope.selectedSegmentNode = null;
								waitingDialog.hide();
							}, 100);
						}
					};

					$scope.selectTestStep = function(testStep) {
						if (testStep != null) {
							waitingDialog.show('Opening Test Step ...', {
								dialogSize : 'xs',
								progressType : 'info'
							});
							$timeout(
									function() {
										$rootScope.segmentList = [];
										$rootScope.selectedIntegrationProfile = null;
										$rootScope.selectedTestStep = testStep;
										if ($rootScope.selectedTestStep.testDataCategorizationMap == undefined
												|| $rootScope.selectedTestStep == null) {
											$rootScope.selectedTestStep.testDataCategorizationMap = {};
										}
										$scope.selectedTestStepTab = 1;
										$scope.loadIntegrationProfile();
										$scope.MessageForMirror = $rootScope.selectedTestStep.er7Message;
										$scope.subview = "EditTestStepMetadata.html";
									}, 0);

							$timeout(function() {
								$rootScope.selectedTestCaseGroup = null;
								$rootScope.selectedTestCase = null;
								$rootScope.selectedTemplate = null;
								$rootScope.selectedSegmentNode = null;
								$scope.initCodemirror();
								$scope.initCodemirrorOnline();
								waitingDialog.hide();
							}, 100);
						}
					};

					$scope.changeTestStepTab = function(tabNum) {
						$scope.selectedTestStepTab = tabNum;
					};

					$scope.isSelectedTestStepTab = function(tabNum) {
						return tabNum == $scope.selectedTestStepTab;
					};

					$scope.selectTPTab = function(value) {
						if (value === 1) {
							$scope.accordi.tpList = false;
							$scope.accordi.tpDetails = true;
						} else {
							$scope.accordi.tpList = true;
							$scope.accordi.tpDetails = false;
						}
					};

					$scope.recordChanged = function() {
						$rootScope.isChanged = true;
						$rootScope.selectedTestPlan.isChanged = true;
					};

					$scope.updateTransport = function() {
						if ($rootScope.selectedTestPlan.type == 'DataInstance') {
							$rootScope.selectedTestPlan.transport = false;
						} else {
							$rootScope.selectedTestPlan.transport = true;
						}
					};

//					$scope.flattenError = function(errors,messages,loc) {
//						var has = $scope.has;
//						var messages = [];
//						if (has(errors, "errorMessages") && errors.errorMessages.length > 0 || has(errors, "within") && errors.within.length > 0) {
//							messages.push({location : loc +"/"+errors.type+" "+errors.id })
//						}
//					};

					$scope.saveableTC = function(tc){
						var obj = $scope.validateTC(tc);
						if (obj.errorMessages.length > 0 || obj.within.length > 0) {
							console.log(tc);
							console.log(obj);
							$scope.control.error.isSet = true;
							$scope.control.error.obj.push(obj);
							$scope.control.error.tc = tc;
							return null;
						}
						else {
							var _tc = JSON.parse(JSON.stringify(tc));
							$scope.prepareTestCase(_tc);
							return _tc;
						}
					};
					
					$scope.saveTC = function(tp,tc,id) {
						var deferred = $q.defer();
						if (tc === null) {
							deferred.resolve(false);
						}
						else {
							$http.post('api/testcase/'+tp.id+'/save', tc).then(
							
									function(response) {
										console.log("Saving");
										console.log(tc);
										
										var newTC = response.data;
										console.log("Saved");
										console.log(newTC);
										var i = $scope.getIndex(tp.testCases,id);
										if(~i){
											$scope.sanitizeTestCase(newTC);
											console.log("Sanitized");
											console.log(newTC);
											tp.testCases[i] = newTC;
											tc = tp.testCases[i];
											deferred.resolve({status : true, id : i});
										}
										deferred.resolve({status : false});
									}, 
									function(error) {
										console.log("Save Error");
										deferred.resolve({status : false});
									}
							);		
						}
						return deferred.promise;
					};
					
					$scope.saveTP = function(tp) {
						var deferred = $q.defer();
						var ready = true;
						var _tp = JSON.parse(JSON.stringify(tp));
						for(var tc in tp.testCases){
							var _tc = $scope.saveableTC(_tp.testCases[tc]);
							if(_tc === null){
								console.log("NOT S");
								deferred.resolve({ status : false });
								ready = false;
								break;
							}
							else {
								_tp.testCases[tc] = _tc;
							}
						}
						
						if(ready){
							$scope.cleanDate(_tp.metaData.dateCreated);
							$scope.cleanDate(_tp.metaData.dateLastUpdated);
							if(_tp.hasOwnProperty("changed")){
								delete _tp.changed;
							}
							$http.post('api/testplan/save', _tp).then(
									
									function(response) {
										tp.changed = false;
										deferred.resolve({ status : true });
									}, 
									function(error) {
										deferred.resolve({ status : false });
									}
							);	
						}
						return deferred.promise;
					};
					
					$scope.saveAllChangedTestPlans = function() {
						$scope.control.error.isSet = false;
						$scope.control.error.obj = [];
						
						if($scope.aTPisSelected() && !$scope.aTCisSelected()){
							$scope.saveTP($scope.selectedTP).then(
									function(response){
										if(response.status){
											Notification.success({
												message : "Test Plan Saved",
												delay : 1000
											});
										}
										else {
											Notification.error({
												message : "Error Saving",
												delay : 1000
											});
										}
									},
									function(error){
										Notification.error({
											message : "Error Saving",
											delay : 1000
										});
									}
							);
						}
						else if($scope.aTCisSelected()){
							var tc = $scope.saveableTC($scope.selectedTC);
							if(tc !== null){
								$scope.saveTC($scope.selectedTP,tc,$scope.selectedTC.id).then(
										function(response){
											console.log(response);
											if(response.status){
												Notification.success({
													message : "Test Case Saved",
													delay : 1000
												});
												$scope.selectTC($scope.selectedTP.testCases[response.id]);
											}
											else {
												Notification.error({
													message : "Error Saving",
													delay : 1000
												});
											}
										},
										function(error){
											Notification.error({
												message : "Error Saving",
												delay : 1000
											});
										}
								);
							}
						}
//						var obj = $scope.validateTC($scope.selectedTC);
//						if (obj.errorMessages.length > 0
//								|| obj.within.length > 0) {
//							$scope.control.error.isSet = true;
//							$scope.control.error.obj = obj;
//							$scope.control.error.tc = $scope.selectedTC;
//						} else {
//							var tc = JSON.parse(JSON.stringify($scope.selectedTC));
//							console.log(tc);
//							$scope.prepareTestCase(tc);
//							$http.post('api/testcase/'+$scope.selectedTP.id+'/save', tc).then(
//									function(response) {
//										var i = $scope.getIndex($scope.selectedTP.testCases,$scope.selectedTC.id);
//										if(~i){
//											$scope.selectedTP.testCases[i] = response.data;
//											$scope.selectedTC = $scope.selectedTP.testCases[i];
//										}
//										Notification.success({
//											message : "Test Plan Saved",
//											delay : 1000
//										});
//
//									}, function(error) {
//										$rootScope.saved = false;
//										Notification.error({
//											message : "Error Saving",
//											delay : 1000
//										});
//
//									});
//						}

						//		
						// $http.post('api/testcase/save', tc).then(function
						// (response) {
						// Notification.success({message:"Test Plan Saved",
						// delay: 1000});
						//
						//
						// }, function (error) {
						// $rootScope.saved = false;
						// Notification.error({message:"Error Saving",
						// delay:1000});
						//
						// });
						// console.log("SAVE");
						// console.log($rootScope.selectedTestPlan);
						// $rootScope.tps.forEach(function(testplan) {
						// if(testplan.isChanged){
						// var changes = angular.toJson([]);
						// var data = angular.fromJson({"changes": changes,
						// "tp": testplan});
						//
						// $http.post('api/testplans/save', data).then(function
						// (response) {
						// var saveResponse = angular.fromJson(response.data);
						// testplan.lastUpdateDate = saveResponse.date;
						// $rootScope.saved = true;
						// testplan.isChanged = false;
						// Notification.success({message:"Test Plan Saved",
						// delay: 1000});
						//
						//
						// }, function (error) {
						// $rootScope.saved = false;
						// Notification.error({message:"Error Saving",
						// delay:1000});
						//
						// });
						// }
						// });
						//
						// $http.post('api/template/save',
						// $rootScope.template).then(function (response) {
						// }, function (error) {
						// $rootScope.saved = false;
						// });
						//
						// $rootScope.isChanged = false;
					};

					$scope.updateMessage = function() {
						var conformanceProfile = _
								.find(
										$rootScope.selectedIntegrationProfile.messages.children,
										function(m) {
											return m.id == $rootScope.selectedTestStep.conformanceProfileId
										});

						var listLineOfMessage = $rootScope.selectedTestStep.er7Message
								.split("\n");

						var nodeList = [];
						$scope.travelConformanceProfile(conformanceProfile, "",
								"", "", "", "", nodeList, 10,
								$rootScope.selectedIntegrationProfile);

						$rootScope.segmentList = [];
						var currentPosition = 0;

						for ( var i in listLineOfMessage) {
							currentPosition = $scope.getSegment(
									$rootScope.segmentList, nodeList,
									currentPosition, listLineOfMessage[i]);
						}
						;

						var testcaseName = $scope.findTestCaseNameOfTestStep();

						$rootScope.selectedTestStep.nistXMLCode = $scope
								.formatXml($scope.generateXML(
										$rootScope.segmentList,
										$rootScope.selectedIntegrationProfile,
										$rootScope.selectedConformanceProfile,
										testcaseName, false));
						$rootScope.selectedTestStep.stdXMLCode = $scope
								.formatXml($scope.generateXML(
										$rootScope.segmentList,
										$rootScope.selectedIntegrationProfile,
										$rootScope.selectedConformanceProfile,
										testcaseName, true));
						$rootScope.selectedTestStep.constraintsXML = $scope
								.generateConstraintsXML($rootScope.segmentList,
										$rootScope.selectedTestStep,
										$rootScope.selectedConformanceProfile,
										$rootScope.selectedIntegrationProfile);
						$rootScope.selectedTestStep.messageContentsXMLCode = $scope
								.generateMessageContentXML(
										$rootScope.segmentList,
										$rootScope.selectedTestStep,
										$rootScope.selectedConformanceProfile,
										$rootScope.selectedIntegrationProfile);
					};

					$scope.generateDefaultSegmentsList = function() {
						var defaultEr7Message = '';
						defaultEr7Message = $scope
								.travelConformanceProfileToGenerateDefaultEr7Message(
										$rootScope.selectedConformanceProfile.children,
										defaultEr7Message);
						$rootScope.selectedTestStep.er7Message = defaultEr7Message;
					};

					$scope.travelConformanceProfileToGenerateDefaultEr7Message = function(
							children, defaultEr7Message) {

						for ( var i in children) {
							var segmentRefOrGroup = children[i];

							if (segmentRefOrGroup.type == 'segmentRef') {
								if (segmentRefOrGroup.usage == 'R'
										|| segmentRefOrGroup.usage == 'RE'
										|| segmentRefOrGroup.usage == 'C') {
									var segment = $scope
											.findSegment(
													segmentRefOrGroup.ref,
													$rootScope.selectedIntegrationProfile);
									if (segment.name == 'MSH') {
										defaultEr7Message = defaultEr7Message
												+ 'MSH|^~\&|';
										for ( var j in segment.fields) {
											if (j > 1)
												defaultEr7Message = defaultEr7Message
														+ '|';
										}
									} else {
										defaultEr7Message = defaultEr7Message
												+ segment.name;
										for ( var j in segment.fields) {
											defaultEr7Message = defaultEr7Message
													+ '|';
										}
									}

									defaultEr7Message = defaultEr7Message
											+ '\n';
								}
							} else if (segmentRefOrGroup.type == 'group') {
								if (segmentRefOrGroup.usage == 'R'
										|| segmentRefOrGroup.usage == 'RE'
										|| segmentRefOrGroup.usage == 'C') {
									defaultEr7Message = $scope
											.travelConformanceProfileToGenerateDefaultEr7Message(
													segmentRefOrGroup.children,
													defaultEr7Message);
								}
							}
						}

						return defaultEr7Message;
					};

					$scope.getSegment = function(segmentList, nodeList,
							currentPosition, segmentStr) {
						var segmentName = segmentStr.substring(0, 3);

						for (var index = currentPosition; index < nodeList.length; index++) {
							if (nodeList[index].obj.name === segmentName) {
								nodeList[index].segmentStr = segmentStr;
								segmentList.push(nodeList[index]);
								return index + 1;
							}
						}
						return currentPosition;
					};

					$scope.getInstanceValue = function(str) {
						return str.substring(str.indexOf('[') + 1, str
								.indexOf(']'));
					};

					$scope.initHL7EncodedMessageTab = function() {
						if ($rootScope.selectedTestStep.er7Message == null) {
							$scope.editor.setValue("");
						} else {
							$scope.editor
									.setValue($rootScope.selectedTestStep.er7Message);
						}

						setTimeout(function() {
							$scope.editor.refresh();
						}, 100);
					};

					$scope.initHL7EncodedMessageForOnlineValidationTab = function() {
						$rootScope.selectedTestStep.constraintsXML = $scope
								.generateConstraintsXML($rootScope.segmentList,
										$rootScope.selectedTestStep,
										$rootScope.selectedConformanceProfile,
										$rootScope.selectedIntegrationProfile);

						if ($rootScope.selectedTestStep.er7Message == null) {
							$scope.editorValidation.setValue("");
							$scope.er7MessageOnlineValidation = '';
						} else {
							$scope.er7MessageOnlineValidation = $rootScope.selectedTestStep.er7Message;
							$scope.editorValidation
									.setValue($scope.er7MessageOnlineValidation);
						}
						setTimeout(function() {
							$scope.editorValidation.refresh();
						}, 100);
					};

					$scope.initTestData = function() {
						$scope.testDataAccordi = {};
						$scope.testDataAccordi.segmentList = true;
						$scope.testDataAccordi.selectedSegment = false;
						$scope.testDataAccordi.constraintList = false;
						$scope.updateMessage();
						$rootScope.selectedSegmentNode = null;
					};

					$scope.selectSegment = function(segment) {
						$scope.testDataAccordi.segmentList = false;
						$scope.testDataAccordi.selectedSegment = true;
						$scope.testDataAccordi.constraintList = false;

						$rootScope.selectedSegmentNode = {};
						$rootScope.selectedSegmentNode.segment = segment;
						$rootScope.selectedSegmentNode.children = [];
						var splittedSegment = segment.segmentStr.split("|");

						var fieldValues = [];

						if (splittedSegment[0] === 'MSH') {
							fieldValues.push('|');
							fieldValues.push('^~\\&');
							for (var index = 2; index < splittedSegment.length; index++) {
								fieldValues.push(splittedSegment[index]);
							}
						} else {
							for (var index = 1; index < splittedSegment.length; index++) {
								fieldValues.push(splittedSegment[index]);
							}
						}

						for (var i = 0; i < segment.obj.fields.length; i++) {
							var fieldInstanceValues = [];
							if (splittedSegment[0] === 'MSH' && i == 1) {
								fieldInstanceValues.push('^~\\&');
							} else {
								if (fieldValues[i] != undefined) {
									fieldInstanceValues = fieldValues[i]
											.split("~");
								} else {
									fieldInstanceValues.push('');
								}
							}

							for (var h = 0; h < fieldInstanceValues.length; h++) {
								var fieldNode = {
									type : 'field',
									path : segment.path + "." + (i + 1),
									iPath : segment.iPath + "." + (i + 1) + "["
											+ (h + 1) + "]",
									positionPath : segment.positionPath + "."
											+ (i + 1),
									positioniPath : segment.positioniPath + "."
											+ (i + 1) + "[" + (h + 1) + "]",
									usagePath : segment.usagePath + "-"
											+ segment.obj.fields[i].usage,
									field : segment.obj.fields[i],
									dt : $scope
											.findDatatype(
													segment.obj.fields[i].datatype,
													$rootScope.selectedIntegrationProfile),
									value : fieldInstanceValues[h],
									children : []
								};

								if (segment.obj.dynamicMapping.mappings.length > 0) {
									for (var z = 0; z < segment.obj.dynamicMapping.mappings.length; z++) {
										var mapping = segment.obj.dynamicMapping.mappings[z];

										if (mapping.position) {
											if (mapping.position === i + 1) {
												var referenceValue = null;
												var secondReferenceValue = null;

												if (mapping.reference) {
													referenceValue = fieldValues[mapping.reference - 1];
													if (mapping.secondReference) {
														secondReferenceValue = fieldValues[mapping.secondReference - 1];
													}

													if (secondReferenceValue == null) {
														var caseFound = _
																.find(
																		mapping.cases,
																		function(
																				c) {
																			return referenceValue
																					.split("^")[0] == c.value;
																		});
														if (caseFound) {
															fieldNode.dt = $scope
																	.findDatatypeById(
																			caseFound.datatype,
																			$rootScope.selectedIntegrationProfile);
														}

													} else {
														var caseFound = _
																.find(
																		mapping.cases,
																		function(
																				c) {
																			return referenceValue
																					.split("^")[0] == c.value
																					&& secondReferenceValue
																							.split("^")[0] == c.secondValue;
																		});

														if (!caseFound) {
															caseFound = _
																	.find(
																			mapping.cases,
																			function(
																					c) {
																				return referenceValue
																						.split("^")[0] == c.value
																						&& (c.secondValue == '' || c.secondValue == undefined);
																			});
														}
														if (caseFound) {
															fieldNode.dt = $scope
																	.findDatatypeById(
																			caseFound.datatype,
																			$rootScope.selectedIntegrationProfile);
														}
													}

												}
											}
										}
									}
								}

								var fieldTestDataCategorizationObj = $rootScope.selectedTestStep.testDataCategorizationMap[$scope
										.replaceDot2Dash(fieldNode.iPath)];

								if (fieldTestDataCategorizationObj != undefined
										&& fieldTestDataCategorizationObj != null) {
									fieldNode.testDataCategorization = fieldTestDataCategorizationObj.testDataCategorization;
									fieldNode.testDataCategorizationListData = fieldTestDataCategorizationObj.listData;
								}

								fieldNode.conformanceStatments = $scope
										.findConformanceStatements(
												segment.obj.conformanceStatements,
												i + 1);
								fieldNode.predicate = $scope.findPredicate(
										segment.obj.predicates, i + 1);

								if (fieldNode.conformanceStatments.length > 0) {
									for (index in fieldNode.conformanceStatments) {
										var cs = fieldNode.conformanceStatments[index];
										var assertionObj = $
												.parseXML(cs.assertion);
										if (assertionObj
												&& assertionObj.childNodes.length > 0) {
											var assertionElm = assertionObj.childNodes[0];
											if (assertionElm.childNodes.length > 1) {
												if (assertionElm.childNodes[1].nodeName === 'PlainText') {
													fieldNode.testDataCategorization = 'Value-Profile Fixed';
													fieldNode.testDataCategorizationListData = null;
												} else if (assertionElm.childNodes[1].nodeName === 'StringList') {
													fieldNode.testDataCategorization = 'Value-Profile Fixed List';
													fieldNode.testDataCategorizationListData = null;
												}
											}
										}
									}
								}

								var componentValues = [];
								if (fieldInstanceValues[h] != undefined)
									componentValues = fieldInstanceValues[h]
											.split("^");

								for (var j = 0; j < fieldNode.dt.components.length; j++) {

									var componentNode = {
										type : 'component',
										path : fieldNode.path + "." + (j + 1),
										iPath : fieldNode.iPath + "." + (j + 1)
												+ "[1]",
										positionPath : fieldNode.positionPath
												+ "." + (j + 1),
										positioniPath : fieldNode.positioniPath
												+ "." + (j + 1) + "[1]",
										usagePath : fieldNode.usagePath
												+ "-"
												+ fieldNode.dt.components[j].usage,
										component : fieldNode.dt.components[j],
										dt : $scope
												.findDatatype(
														fieldNode.dt.components[j].datatype,
														$rootScope.selectedIntegrationProfile),
										value : componentValues[j],
										children : []
									};
									var componentTestDataCategorizationObj = $rootScope.selectedTestStep.testDataCategorizationMap[$scope
											.replaceDot2Dash(componentNode.iPath)];

									if (componentTestDataCategorizationObj != undefined
											&& componentTestDataCategorizationObj != null) {
										componentNode.testDataCategorization = componentTestDataCategorizationObj.testDataCategorization;
										componentNode.testDataCategorizationListData = componentTestDataCategorizationObj.listData;
									}

									componentNode.conformanceStatments = $scope
											.findConformanceStatements(
													fieldNode.dt.conformanceStatements,
													j + 1);
									componentNode.predicate = $scope
											.findPredicate(
													fieldNode.dt.predicates,
													j + 1);

									if (componentNode.conformanceStatments.length > 0) {
										for (index in componentNode.conformanceStatments) {
											var cs = componentNode.conformanceStatments[index];
											var assertionObj = $
													.parseXML(cs.assertion);
											if (assertionObj
													&& assertionObj.childNodes.length > 0) {
												var assertionElm = assertionObj.childNodes[0];
												if (assertionElm.childNodes.length > 1) {
													if (assertionElm.childNodes[1].nodeName === 'PlainText') {
														componentNode.testDataCategorization = 'Value-Profile Fixed';
														componentNode.testDataCategorizationListData = null;
													} else if (assertionElm.childNodes[1].nodeName === 'StringList') {
														componentNode.testDataCategorization = 'Value-Profile Fixed List';
														componentNode.testDataCategorizationListData = null;
													}
												}
											}
										}
									}

									var subComponentValues = [];
									if (componentValues[j] != undefined)
										subComponentValues = componentValues[j]
												.split("&");
									for (var k = 0; k < componentNode.dt.components.length; k++) {
										var subComponentNode = {
											type : 'subcomponent',
											path : componentNode.path + "."
													+ (k + 1),
											iPath : componentNode.iPath + "."
													+ (k + 1) + "[1]",
											positionPath : componentNode.positionPath
													+ "." + (k + 1),
											positioniPath : componentNode.positioniPath
													+ "." + (k + 1) + "[1]",
											usagePath : componentNode.usagePath
													+ "-"
													+ componentNode.dt.components[k].usage,
											component : componentNode.dt.components[k],
											dt : $scope
													.findDatatype(
															componentNode.dt.components[k].datatype,
															$rootScope.selectedIntegrationProfile),
											value : subComponentValues[k],
											children : []
										};

										var subComponentTestDataCategorizationObj = $rootScope.selectedTestStep.testDataCategorizationMap[$scope
												.replaceDot2Dash(subComponentNode.iPath)];

										if (subComponentTestDataCategorizationObj != undefined
												&& subComponentTestDataCategorizationObj != null) {
											subComponentNode.testDataCategorization = subComponentTestDataCategorizationObj.testDataCategorization;
											subComponentNode.testDataCategorizationListData = subComponentTestDataCategorizationObj.listData;
										}

										subComponentNode.conformanceStatments = $scope
												.findConformanceStatements(
														componentNode.dt.conformanceStatements,
														k + 1);
										subComponentNode.predicate = $scope
												.findPredicate(
														componentNode.dt.predicates,
														k + 1);

										if (subComponentNode.conformanceStatments.length > 0) {
											for (index in subComponentNode.conformanceStatments) {
												var cs = subComponentNode.conformanceStatments[index];
												var assertionObj = $
														.parseXML(cs.assertion);
												if (assertionObj
														&& assertionObj.childNodes.length > 0) {
													var assertionElm = assertionObj.childNodes[0];
													if (assertionElm.childNodes.length > 1) {
														if (assertionElm.childNodes[1].nodeName === 'PlainText') {
															subComponentNode.testDataCategorization = 'Value-Profile Fixed';
															subComponentNode.testDataCategorizationListData = null;
														} else if (assertionElm.childNodes[1].nodeName === 'StringList') {
															subComponentNode.testDataCategorization = 'Value-Profile Fixed List';
															subComponentNode.testDataCategorizationListData = null;
														}
													}
												}
											}
										}

										componentNode.children
												.push(subComponentNode);
									}

									fieldNode.children.push(componentNode);

								}

								$rootScope.selectedSegmentNode.children
										.push(fieldNode);
							}

						}
						$scope.refreshTree();
					};

					$scope.removeValueForTestDataCategorization = function(
							node, index) {
						$scope.errortext = "";
						node.testDataCategorizationListData.splice(index, 1);
						$rootScope.selectedTestStep.testDataCategorizationMap[$scope
								.replaceDot2Dash(node.iPath)].listData = node.testDataCategorizationListData;
						$rootScope.selectedTestStep.constraintsXML = $scope
								.generateConstraintsXML($rootScope.segmentList,
										$rootScope.selectedTestStep,
										$rootScope.selectedConformanceProfile,
										$rootScope.selectedIntegrationProfile);
						$scope.recordChanged();
					};

					$scope.addValueForTestDataCategorization = function(node,
							addMe) {
						if (node.testDataCategorizationListData == null)
							node.testDataCategorizationListData = [];
						$scope.errortext = "";
						if (!addMe || addMe == '') {
							return;
						}
						if (node.testDataCategorizationListData.indexOf(addMe) == -1) {
							node.testDataCategorizationListData.push(addMe);
							$rootScope.selectedTestStep.testDataCategorizationMap[$scope
									.replaceDot2Dash(node.iPath)].listData = node.testDataCategorizationListData;
						} else {
							$scope.errortext = "The value is already in your list.";
						}
						$rootScope.selectedTestStep.constraintsXML = $scope
								.generateConstraintsXML($rootScope.segmentList,
										$rootScope.selectedTestStep,
										$rootScope.selectedConformanceProfile,
										$rootScope.selectedIntegrationProfile);
						$scope.recordChanged();
					};

					$scope.findTestCaseNameOfTestStep = function() {
						var result = "NoName";
						$rootScope.selectedTestPlan.children
								.forEach(function(child) {

									if (child.type == "testcasegroup") {
										child.testcases
												.forEach(function(testcase) {
													testcase.teststeps
															.forEach(function(
																	teststep) {
																if (teststep.id == $rootScope.selectedTestStep.id) {
																	result = testcase.name;
																}
															});
												});
									} else if (child.type == "testcase") {
										child.teststeps
												.forEach(function(teststep) {
													if (teststep.id == $rootScope.selectedTestStep.id) {
														result = testcase.name;
													}
												});
									}
								});

						return result;
					};

					$scope.generateSupplementDocuments = function() {
						$scope.initTestData();
						$scope.generateTestDataSpecificationHTML();
						$scope.generateJurorDocumentHTML();
						$scope.generateMessageContentHTML();
					};

					$scope.generateTestDataSpecificationHTML = function() {
						if ($rootScope.selectedTestStep.tdsXSL
								&& $rootScope.selectedTestStep.tdsXSL !== "") {
							var data = {};
							data.type = $rootScope.selectedTestStep.tdsXSL;
							data.xml = $scope
									.formatXml($scope
											.generateXML(
													$rootScope.segmentList,
													$rootScope.selectedIntegrationProfile,
													$rootScope.selectedConformanceProfile,
													$scope
															.findTestCaseNameOfTestStep(),
													false));

							$http
									.post(
											'api/testplans/supplementsGeneration',
											data)
									.then(
											function(response) {
												$rootScope.testDataSpecificationHTML = $sce
														.trustAsHtml(angular
																.fromJson(response.data).xml);
											}, function(error) {
											});
						} else {
							$rootScope.testDataSpecificationHTML = "No TestData Specification";
						}
					};

					$scope.generateJurorDocumentHTML = function() {
						if ($rootScope.selectedTestStep.jdXSL
								&& $rootScope.selectedTestStep.jdXSL !== "") {
							var data = {};
							data.type = $rootScope.selectedTestStep.jdXSL;
							data.xml = $scope
									.formatXml($scope
											.generateXML(
													$rootScope.segmentList,
													$rootScope.selectedIntegrationProfile,
													$rootScope.selectedConformanceProfile,
													$scope
															.findTestCaseNameOfTestStep(),
													false));

							$http
									.post(
											'api/testplans/supplementsGeneration',
											data)
									.then(
											function(response) {
												$rootScope.jurorDocumentsHTML = $sce
														.trustAsHtml(angular
																.fromJson(response.data).xml);
											}, function(error) {
											});
						} else {
							$rootScope.jurorDocumentsHTML = "No Juror Document";
						}
					};

					$scope.generateMessageContentHTML = function() {
						var data = {};
						data.type = 'MessageContents';
						data.xml = $scope.generateMessageContentXML(
								$rootScope.segmentList,
								$rootScope.selectedTestStep,
								$rootScope.selectedConformanceProfile,
								$rootScope.selectedIntegrationProfile);

						$http
								.post('api/testplans/supplementsGeneration',
										data)
								.then(
										function(response) {
											$scope.messageContentsHTML = angular
													.fromJson(response.data).xml;
											$scope.messageContentsHTML.html = (angular
													.fromJson(response.data).xml)
													.replace("accordion",
															"uib-accordion");
										}, function(error) {
										});
					};

					$rootScope.getNodesForMessage = function(parent, root) {
						if (!parent || parent == null) {
							return root.children;
						} else {
							return parent.children;
						}
					};

					$rootScope.getTemplatesForMessage = function(node, root) {
						console.log("node+++++++++");
						console.log(node);

						if (node.obj.type === 'segmentRef') {
							return 'MessageSegmentRefReadTree.html';
						} else if (node.obj.type === 'group') {
							return 'MessageGroupReadTree.html';
						} else {
							return 'MessageReadTree.html';
						}

					};
					$scope.getSegLabel = function(name, ext) {
						if (ext === null) {
							return name;
						} else {
							return name + '_' + ext;
						}
					};
					$rootScope.getMessageParams = function() {
						return new ngTreetableParams({
							getNodes : function(parent) {
								return $rootScope.getNodesForMessage(parent,
										$rootScope.messageTree);
							},
							getTemplate : function(node) {
								return $rootScope.getTemplatesForMessage(node,
										$rootScope.messageTree);
							}
						});
					};

					$scope.OpenMessageMetadata = function(msg) {
						$rootScope.selectedTemplate = null;
						$rootScope.selectedSegmentNode = null;
						$rootScope.selectedTestStep = null;

						if ($rootScope.messageTree && $rootScope.messageParams) {
							$rootScope.message = msg;
							$rootScope.processMessageTree($rootScope.message);
							$rootScope.messageParams.refresh();

						} else {

							$rootScope.message = msg;
							$rootScope.processMessageTree($rootScope.message);

							$rootScope.messageParams = $scope
									.getMessageParams();

						}

						$scope.subview = "EditMessages.html";

					};

					$scope.generateConstraintsXML = function(segmentList,
							testStep, selectedConformanceProfile,
							selectedIntegrationProfile) {
						var rootName = "ConformanceContext";
						var xmlString = '<' + rootName + '>' + '</' + rootName
								+ '>';
						var parser = new DOMParser();
						var xmlDoc = parser.parseFromString(xmlString,
								"text/xml");
						var rootElement = xmlDoc.getElementsByTagName(rootName)[0];
						rootElement.setAttribute("UUID", new ObjectId()
								.toString());

						// TODO METADATA need to update
						var elmMetaData = xmlDoc.createElement("MetaData");
						elmMetaData.setAttribute("Name", 'No Name');
						elmMetaData.setAttribute("OrgName", 'NIST');
						elmMetaData.setAttribute("Version", 'No Version Info');
						elmMetaData.setAttribute("Date", 'No date');
						elmMetaData.setAttribute("Status", 'Draft');

						rootElement.appendChild(elmMetaData);

						var constraintsElement = xmlDoc
								.createElement("Constraints");
						var messageElement = xmlDoc.createElement("Message");
						var byIDElement = xmlDoc.createElement("ByID");
						byIDElement.setAttribute("ID",
								selectedConformanceProfile.id);

						rootElement.appendChild(constraintsElement);
						constraintsElement.appendChild(messageElement);
						messageElement.appendChild(byIDElement);

						segmentList
								.forEach(function(instanceSegment) {
									var segment = instanceSegment.obj;
									var segName = segment.name;
									var segmentiPath = instanceSegment.iPath;
									var segmentiPositionPath = instanceSegment.positioniPath;
									var segUsagePath = instanceSegment.usagePath;
									for (var i = 0; i < segment.fields.length; i++) {
										var field = segment.fields[i];
										var wholeFieldStr = $scope
												.getFieldStrFromSegment(
														segName,
														instanceSegment,
														field.position);
										var fieldRepeatIndex = 0;

										var fieldUsagePath = segUsagePath + '-'
												+ field.usage;
										for (var j = 0; j < wholeFieldStr
												.split("~").length; j++) {
											var fieldStr = wholeFieldStr
													.split("~")[j];
											var fieldDT = $scope.findDatatype(
													field.datatype,
													selectedIntegrationProfile);
											if (segName == "MSH"
													&& field.position == 1) {
												fieldStr = "|";
											}
											if (segName == "MSH"
													&& field.position == 2) {
												fieldStr = "^~\\&";
											}
											fieldRepeatIndex = fieldRepeatIndex + 1;
											var fieldiPath = "."
													+ field.position + "["
													+ fieldRepeatIndex + "]";

											if (segment.dynamicMapping.mappings.length > 0) {
												for (var z = 0; z < segment.dynamicMapping.mappings.length; z++) {
													var mapping = segment.dynamicMapping.mappings[z];

													if (mapping.position) {
														if (mapping.position === field.position) {
															var referenceValue = null;
															var secondReferenceValue = null;

															if (mapping.reference) {
																referenceValue = $scope
																		.getFieldStrFromSegment(
																				segName,
																				instanceSegment,
																				mapping.reference);
																if (mapping.secondReference) {
																	secondReferenceValue = $scope
																			.getFieldStrFromSegment(
																					segName,
																					instanceSegment,
																					mapping.secondReference);
																}

																if (secondReferenceValue == null) {
																	var caseFound = _
																			.find(
																					mapping.cases,
																					function(
																							c) {
																						return referenceValue
																								.split("^")[0] == c.value;
																					});
																	if (caseFound) {
																		fieldDT = $scope
																				.findDatatypeById(
																						caseFound.datatype,
																						selectedIntegrationProfile);
																	}

																} else {
																	var caseFound = _
																			.find(
																					mapping.cases,
																					function(
																							c) {
																						return referenceValue
																								.split("^")[0] == c.value
																								&& secondReferenceValue
																										.split("^")[0] == c.secondValue;
																					});

																	if (!caseFound) {
																		caseFound = _
																				.find(
																						mapping.cases,
																						function(
																								c) {
																							return referenceValue
																									.split("^")[0] == c.value
																									&& (c.secondValue == '' || c.secondValue == undefined);
																						});
																	}
																	if (caseFound) {
																		fieldDT = $scope
																				.findDatatypeById(
																						caseFound.datatype,
																						selectedIntegrationProfile);
																	}
																}

															}
														}
													}
												}
											}

											if (fieldDT == null
													|| fieldDT.components == null
													|| fieldDT.components.length == 0) {
												var cateOfField = testStep.testDataCategorizationMap[$scope
														.replaceDot2Dash(segmentiPath
																+ fieldiPath)];
												$scope
														.createConstraint(
																segmentiPositionPath
																		+ fieldiPath,
																cateOfField,
																fieldUsagePath,
																xmlDoc,
																selectedConformanceProfile,
																selectedIntegrationProfile,
																fieldStr);
											} else {
												for (var k = 0; k < fieldDT.components.length; k++) {
													var c = fieldDT.components[k];
													var componentUsagePath = fieldUsagePath
															+ '-' + c.usage;
													var componentiPath = "."
															+ c.position
															+ "[1]";

													var componentStr = $scope
															.getComponentStrFromField(
																	fieldStr,
																	c.position);
													if ($scope
															.findDatatype(
																	c.datatype,
																	selectedIntegrationProfile).components == null
															|| $scope
																	.findDatatype(
																			c.datatype,
																			selectedIntegrationProfile).components.length == 0) {
														var cateOfComponent = testStep.testDataCategorizationMap[$scope
																.replaceDot2Dash(segmentiPath
																		+ fieldiPath
																		+ componentiPath)];
														$scope
																.createConstraint(
																		segmentiPositionPath
																				+ fieldiPath
																				+ componentiPath,
																		cateOfComponent,
																		componentUsagePath,
																		xmlDoc,
																		selectedConformanceProfile,
																		selectedIntegrationProfile,
																		componentStr);
													} else {
														for (var l = 0; l < $scope
																.findDatatype(
																		c.datatype,
																		selectedIntegrationProfile).components.length; l++) {
															var sc = $scope
																	.findDatatype(
																			c.datatype,
																			selectedIntegrationProfile).components[l];
															var subComponentUsagePath = componentUsagePath
																	+ '-'
																	+ sc.usage;
															var subcomponentiPath = "."
																	+ sc.position
																	+ "[1]";
															var subcomponentStr = $scope
																	.getSubComponentStrFromField(
																			componentStr,
																			sc.position);
															var cateOfSubComponent = testStep.testDataCategorizationMap[$scope
																	.replaceDot2Dash(segmentiPath
																			+ fieldiPath
																			+ componentiPath
																			+ subcomponentiPath)];
															$scope
																	.createConstraint(
																			segmentiPositionPath
																					+ fieldiPath
																					+ componentiPath
																					+ subcomponentiPath,
																			cateOfSubComponent,
																			subComponentUsagePath,
																			xmlDoc,
																			selectedConformanceProfile,
																			selectedIntegrationProfile,
																			subcomponentStr);
														}
													}
												}
											}
										}
									}

								});

						var serializer = new XMLSerializer();
						var xmlString = serializer.serializeToString(xmlDoc);
						return xmlString;
					};

					$scope.createConstraint = function(iPositionPath, cate,
							usagePath, xmlDoc, selectedConformanceProfile,
							selectedIntegrationProfile, value) {
						if (cate) {
							var byIDElm = xmlDoc.getElementsByTagName('ByID')[0];
							if (cate.testDataCategorization == 'Indifferent') {

							} else if (cate.testDataCategorization == 'NonPresence') {
								$scope.createNonPresenceCheck(iPositionPath,
										cate, usagePath, xmlDoc,
										selectedConformanceProfile,
										selectedIntegrationProfile, byIDElm);
							} else if (cate.testDataCategorization == 'Presence-Content Indifferent'
									|| cate.testDataCategorization == 'Presence-Configuration'
									|| cate.testDataCategorization == 'Presence-System Generated'
									|| cate.testDataCategorization == 'Presence-Test Case Proper') {
								$scope.createPresenceCheck(iPositionPath, cate,
										usagePath, xmlDoc,
										selectedConformanceProfile,
										selectedIntegrationProfile, byIDElm);
							} else if (cate.testDataCategorization == 'Presence Length-Content Indifferent'
									|| cate.testDataCategorization == 'Presence Length-Configuration'
									|| cate.testDataCategorization == 'Presence Length-System Generated'
									|| cate.testDataCategorization == 'Presence Length-Test Case Proper') {
								$scope.createPresenceCheck(iPositionPath, cate,
										usagePath, xmlDoc,
										selectedConformanceProfile,
										selectedIntegrationProfile, byIDElm);
								$scope.createLengthCheck(iPositionPath, cate,
										usagePath, xmlDoc,
										selectedConformanceProfile,
										selectedIntegrationProfile, value,
										byIDElm);
							} else if (cate.testDataCategorization == 'Value-Test Case Fixed') {
								$scope.createPresenceCheck(iPositionPath, cate,
										usagePath, xmlDoc,
										selectedConformanceProfile,
										selectedIntegrationProfile, byIDElm);
								$scope.createPlainTextCheck(iPositionPath,
										cate, usagePath, xmlDoc,
										selectedConformanceProfile,
										selectedIntegrationProfile, value,
										byIDElm);
							} else if (cate.testDataCategorization == 'Value-Test Case Fixed List') {
								$scope.createPresenceCheck(iPositionPath, cate,
										usagePath, xmlDoc,
										selectedConformanceProfile,
										selectedIntegrationProfile, byIDElm);
								$scope.createStringListCheck(iPositionPath,
										cate, usagePath, xmlDoc,
										selectedConformanceProfile,
										selectedIntegrationProfile, value,
										byIDElm);
							}
						}
					};

					$scope.createStringListCheck = function(iPositionPath,
							cate, usagePath, xmlDoc,
							selectedConformanceProfile,
							selectedIntegrationProfile, value, byIDElm) {
						var values = cate.listData.toString();
						var elmConstraint = xmlDoc.createElement("Constraint");
						var elmReference = xmlDoc.createElement("Reference");
						elmReference.setAttribute("Source", "testcase");
						elmReference.setAttribute("GeneratedBy",
								"Test Case Authoring & Management Tool(TCAMT)");
						elmReference.setAttribute("ReferencePath", cate.iPath);
						elmReference.setAttribute("TestDataCategorization",
								cate.testDataCategorization);
						elmConstraint.appendChild(elmReference);

						elmConstraint.setAttribute("ID", "Content");
						elmConstraint.setAttribute("Target", iPositionPath);
						var elmDescription = xmlDoc
								.createElement("Description");
						elmDescription
								.appendChild(xmlDoc
										.createTextNode("Invalid content (based on test case fixed data). The value at "
												+ $scope
														.modifyFormIPath(cate.iPath)
												+ " ("
												+ $scope
														.findNodeNameByIPath(
																selectedIntegrationProfile,
																selectedConformanceProfile,
																iPositionPath)
												+ ") does not match one of the expected values: "
												+ values));
						var elmAssertion = xmlDoc.createElement("Assertion");
						var elmStringList = xmlDoc.createElement("StringList");
						elmStringList.setAttribute("Path", iPositionPath);

						elmStringList.setAttribute("CSV", values);
						elmStringList.setAttribute("IgnoreCase", "false");
						elmAssertion.appendChild(elmStringList);
						elmConstraint.appendChild(elmDescription);
						elmConstraint.appendChild(elmAssertion);
						byIDElm.appendChild(elmConstraint);

					};

					$scope.createPlainTextCheck = function(iPositionPath, cate,
							usagePath, xmlDoc, selectedConformanceProfile,
							selectedIntegrationProfile, value, byIDElm) {
						var elmConstraint = xmlDoc.createElement("Constraint");
						var elmReference = xmlDoc.createElement("Reference");
						elmReference.setAttribute("Source", "testcase");
						elmReference.setAttribute("GeneratedBy",
								"Test Case Authoring & Management Tool(TCAMT)");
						elmReference.setAttribute("ReferencePath", cate.iPath);
						elmReference.setAttribute("TestDataCategorization",
								cate.testDataCategorization);
						elmConstraint.appendChild(elmReference);

						elmConstraint.setAttribute("ID", "Content");
						elmConstraint.setAttribute("Target", iPositionPath);
						var elmDescription = xmlDoc
								.createElement("Description");
						elmDescription
								.appendChild(xmlDoc
										.createTextNode("Invalid content (based on test case fixed data). The value at "
												+ $scope
														.modifyFormIPath(cate.iPath)
												+ " ("
												+ $scope
														.findNodeNameByIPath(
																selectedIntegrationProfile,
																selectedConformanceProfile,
																iPositionPath)
												+ ") does not match the expected value: '"
												+ value + "'."));
						var elmAssertion = xmlDoc.createElement("Assertion");
						var elmPlainText = xmlDoc.createElement("PlainText");
						elmPlainText.setAttribute("Path", iPositionPath);
						elmPlainText.setAttribute("Text", value);
						elmPlainText.setAttribute("IgnoreCase", "true");
						elmAssertion.appendChild(elmPlainText);
						elmConstraint.appendChild(elmDescription);
						elmConstraint.appendChild(elmAssertion);
						byIDElm.appendChild(elmConstraint);
					};

					$scope.createLengthCheck = function(iPositionPath, cate,
							usagePath, xmlDoc, selectedConformanceProfile,
							selectedIntegrationProfile, value, byIDElm) {
						var elmConstraint = xmlDoc.createElement("Constraint");
						var elmReference = xmlDoc.createElement("Reference");
						elmReference.setAttribute("Source", "testcase");
						elmReference.setAttribute("GeneratedBy",
								"Test Case Authoring & Management Tool(TCAMT)");
						elmReference.setAttribute("ReferencePath", cate.iPath);
						elmReference.setAttribute("TestDataCategorization",
								cate.testDataCategorization);
						elmConstraint.appendChild(elmReference);

						elmConstraint.setAttribute("ID", "Content");
						elmConstraint.setAttribute("Target", iPositionPath);
						var elmDescription = xmlDoc
								.createElement("Description");
						elmDescription
								.appendChild(xmlDoc
										.createTextNode("Content does not meet the minimum length requirement. The value at "
												+ $scope
														.modifyFormIPath(cate.iPath)
												+ " ("
												+ $scope
														.findNodeNameByIPath(
																selectedIntegrationProfile,
																selectedConformanceProfile,
																iPositionPath)
												+ ") is expected to be at minimum '"
												+ value.length
												+ "' characters."));
						var elmAssertion = xmlDoc.createElement("Assertion");
						var elmFormat = xmlDoc.createElement("Format");
						elmFormat.setAttribute("Path", iPositionPath);
						elmFormat.setAttribute("Regex", "^.{" + value.length
								+ ",}$");
						elmAssertion.appendChild(elmFormat);
						elmConstraint.appendChild(elmDescription);
						elmConstraint.appendChild(elmAssertion);
						byIDElm.appendChild(elmConstraint);
					}

					$scope.createNonPresenceCheck = function(iPositionPath,
							cate, usagePath, xmlDoc,
							selectedConformanceProfile,
							selectedIntegrationProfile, byIDElm) {
						var elmConstraint = xmlDoc.createElement("Constraint");
						var elmReference = xmlDoc.createElement("Reference");
						elmReference.setAttribute("Source", "testcase");
						elmReference.setAttribute("GeneratedBy",
								"Test Case Authoring & Management Tool(TCAMT)");
						elmReference.setAttribute("ReferencePath", cate.iPath);
						elmReference.setAttribute("TestDataCategorization",
								cate.testDataCategorization);
						elmConstraint.appendChild(elmReference);

						elmConstraint.setAttribute("ID", "Content");
						elmConstraint.setAttribute("Target", iPositionPath);
						var elmDescription = xmlDoc
								.createElement("Description");
						elmDescription
								.appendChild(xmlDoc
										.createTextNode("Unexpected content found. The value at "
												+ $scope
														.modifyFormIPath(cate.iPath)
												+ " ("
												+ $scope
														.findNodeNameByIPath(
																selectedIntegrationProfile,
																selectedConformanceProfile,
																iPositionPath)
												+ ") is not expected to be valued for test case."));
						var elmAssertion = xmlDoc.createElement("Assertion");
						var elmPresence = xmlDoc.createElement("Presence");
						var elmNOT = xmlDoc.createElement("NOT");
						elmPresence.setAttribute("Path", iPositionPath);
						elmNOT.appendChild(elmPresence);
						elmAssertion.appendChild(elmNOT);
						elmConstraint.appendChild(elmDescription);
						elmConstraint.appendChild(elmAssertion);
						byIDElm.appendChild(elmConstraint);
					};

					$scope.createPresenceCheck = function(iPositionPath, cate,
							usagePath, xmlDoc, selectedConformanceProfile,
							selectedIntegrationProfile, byIDElm) {
						var usageCheck = true;
						var usage = usagePath.split("-");
						for (var i = 0; i < usage.length; i++) {
							var u = usage[i];
							if (u !== "R") {
								usageCheck = false;
							}
						}

						if (!usageCheck) {
							var elmConstraint = xmlDoc
									.createElement("Constraint");
							var elmReference = xmlDoc
									.createElement("Reference");
							elmReference.setAttribute("Source", "testcase");
							elmReference
									.setAttribute("GeneratedBy",
											"Test Case Authoring & Management Tool(TCAMT)");
							elmReference.setAttribute("ReferencePath",
									cate.iPath);
							elmReference.setAttribute("TestDataCategorization",
									cate.testDataCategorization);
							elmConstraint.appendChild(elmReference);

							elmConstraint.setAttribute("ID", "Content");
							elmConstraint.setAttribute("Target", iPositionPath);
							var elmDescription = xmlDoc
									.createElement("Description");
							elmDescription
									.appendChild(xmlDoc
											.createTextNode("Expected content is missing. The empty value at "
													+ $scope
															.modifyFormIPath(cate.iPath)
													+ " ("
													+ $scope
															.findNodeNameByIPath(
																	selectedIntegrationProfile,
																	selectedConformanceProfile,
																	iPositionPath)
													+ ") is expected to be present."));
							var elmAssertion = xmlDoc
									.createElement("Assertion");
							var elmPresence = xmlDoc.createElement("Presence");
							elmPresence.setAttribute("Path", iPositionPath);
							elmAssertion.appendChild(elmPresence);
							elmConstraint.appendChild(elmDescription);
							elmConstraint.appendChild(elmAssertion);
							byIDElm.appendChild(elmConstraint);
						}
					};

					$scope.findNodeNameByIPath = function(ip, m, iPositionPath) {
						var currentChildren = m.children;
						var currentObject = null;
						var pathList = iPositionPath.split(".");
						for (var i = 0; i < pathList.length; i++) {
							var p = pathList[i];
							var position = parseInt(p.substring(0, p
									.indexOf("[")));
							var o = $scope.findChildByPosition(position,
									currentChildren, m, ip);

							if (o.type == 'group') {
								var group = o;
								currentObject = group;
								currentChildren = group.children;
							} else if (o.type == 'segment') {
								var s = o;
								currentObject = s;
								currentChildren = s.fields;
							} else if (o.type == 'field') {
								var f = o;
								currentObject = f;
								currentChildren = $scope.findDatatype(
										f.datatype, ip).components;
							} else if (o.type == 'component') {
								var c = o;
								currentObject = c;
								currentChildren = $scope.findDatatype(
										c.datatype, ip).components;
							}
						}

						if (currentObject == null) {
							return null;
						} else {
							return currentObject.name;
						}

						return null;
					};

					$scope.findChildByPosition = function(position, children,
							m, ip) {
						for (var i = 0; i < children.length; i++) {
							var o = children[i];
							if (o.type == 'group') {
								if (o.position == position)
									return o;
							} else if (o.type == 'segmentRef') {
								if (o.position == position)
									return $scope.findSegment(o.ref, ip);
							} else if (o.type == 'field') {
								if (o.position == position)
									return o;
							} else if (o.type == 'component') {
								if (o.position == position)
									return o;
							}
						}

						return null;

					}

					$scope.modifyFormIPath = function(iPath) {
						var result = "";
						if (iPath == null || iPath == "")
							return result;
						var pathList = iPath.split(".");
						var currentType = "GroupOrSegment";
						var previousType = "GroupOrSegment";

						for (var i = 0; i < pathList.length; i++) {
							var p = pathList[i];
							var path = p.substring(0, p.indexOf("["));
							var instanceNum = parseInt(p.substring(p
									.indexOf("[") + 1, p.indexOf("]")));

							if ($scope.isNumeric(path)) {
								currentType = "FieldOrComponent";
							} else {
								currentType = "GroupOrSegment";
							}

							if (instanceNum == 1) {
								if (currentType == "FieldOrComponent"
										&& previousType == "GroupOrSegment") {
									result = result + "-" + path;
								} else {
									result = result + "." + path;
								}
							} else {
								if (currentType == "FieldOrComponent"
										&& previousType == "GroupOrSegment") {
									result = result + "-" + path + "["
											+ instanceNum + "]";
								} else {
									result = result + "." + path + "["
											+ instanceNum + "]";
								}
							}
							previousType = currentType;
						}
						return result.substring(1);
					};

					$scope.isNumeric = function(n) {
						return !isNaN(parseFloat(n)) && isFinite(n);
					}

					$scope.generateMessageContentXML = function(segmentList,
							testStep, selectedConformanceProfile,
							selectedIntegrationProfile) {
						var rootName = "MessageContent";
						var xmlString = '<' + rootName + '>' + '</' + rootName
								+ '>';
						var parser = new DOMParser();
						var xmlDoc = parser.parseFromString(xmlString,
								"text/xml");
						var rootElement = xmlDoc.getElementsByTagName(rootName)[0];

						segmentList
								.forEach(function(instanceSegment) {
									var segment = instanceSegment.obj;
									var segName = segment.name;
									var segDesc = segment.description;
									var segmentiPath = instanceSegment.iPath;

									var segmentElement = xmlDoc
											.createElement("Segment");
									segmentElement
											.setAttribute("Name", segName);
									segmentElement.setAttribute("Description",
											segDesc);
									segmentElement.setAttribute("InstancePath",
											instanceSegment.iPath);
									rootElement.appendChild(segmentElement);

									for (var i = 0; i < segment.fields.length; i++) {
										var field = segment.fields[i];
										if (!$scope
												.isHideForMessageContentByUsage(
														segment,
														field,
														instanceSegment.path
																+ "."
																+ field.position,
														instanceSegment.positioniPath
																+ "."
																+ field.position
																+ "[1]",
														selectedConformanceProfile)) {
											var wholeFieldStr = $scope
													.getFieldStrFromSegment(
															segName,
															instanceSegment,
															field.position);
											var fieldRepeatIndex = 0;

											for (var j = 0; j < wholeFieldStr
													.split("~").length; j++) {
												var fieldStr = wholeFieldStr
														.split("~")[j];
												var fieldDT = $scope
														.findDatatype(
																field.datatype,
																selectedIntegrationProfile);
												if (segName == "MSH"
														&& field.position == 1) {
													fieldStr = "|";
												}
												if (segName == "MSH"
														&& field.position == 2) {
													fieldStr = "^~\\&";
												}
												fieldRepeatIndex = fieldRepeatIndex + 1;
												var fieldiPath = "."
														+ field.position + "["
														+ fieldRepeatIndex
														+ "]";

												if (segment.dynamicMapping.mappings.length > 0) {
													for (var z = 0; z < segment.dynamicMapping.mappings.length; z++) {
														var mapping = segment.dynamicMapping.mappings[z];

														if (mapping.position) {
															if (mapping.position === field.position) {
																var referenceValue = null;
																var secondReferenceValue = null;

																if (mapping.reference) {
																	referenceValue = $scope
																			.getFieldStrFromSegment(
																					segName,
																					instanceSegment,
																					mapping.reference);
																	if (mapping.secondReference) {
																		secondReferenceValue = $scope
																				.getFieldStrFromSegment(
																						segName,
																						instanceSegment,
																						mapping.secondReference);
																	}

																	if (secondReferenceValue == null) {
																		var caseFound = _
																				.find(
																						mapping.cases,
																						function(
																								c) {
																							return referenceValue
																									.split("^")[0] == c.value;
																						});
																		if (caseFound) {
																			fieldDT = $scope
																					.findDatatypeById(
																							caseFound.datatype,
																							selectedIntegrationProfile);
																		}

																	} else {
																		var caseFound = _
																				.find(
																						mapping.cases,
																						function(
																								c) {
																							return referenceValue
																									.split("^")[0] == c.value
																									&& secondReferenceValue
																											.split("^")[0] == c.secondValue;
																						});

																		if (!caseFound) {
																			caseFound = _
																					.find(
																							mapping.cases,
																							function(
																									c) {
																								return referenceValue
																										.split("^")[0] == c.value
																										&& (c.secondValue == '' || c.secondValue == undefined);
																							});
																		}
																		if (caseFound) {
																			fieldDT = $scope
																					.findDatatypeById(
																							caseFound.datatype,
																							selectedIntegrationProfile);
																		}
																	}

																}
															}
														}
													}
												}
												if (fieldDT == null
														|| fieldDT.components == null
														|| fieldDT.components.length == 0) {
													var tdcstrOfField = "";
													var cateOfField = testStep.testDataCategorizationMap[$scope
															.replaceDot2Dash(
																	segmentiPath
																			+ fieldiPath,
																	fieldStr)];
													if (cateOfField)
														tdcstrOfField = cateOfField.testDataCategorization;

													var fieldElement = xmlDoc
															.createElement("Field");
													fieldElement
															.setAttribute(
																	"Location",
																	segName
																			+ "."
																			+ field.position);
													fieldElement.setAttribute(
															"DataElement",
															field.name);
													fieldElement.setAttribute(
															"Data", fieldStr);
													fieldElement.setAttribute(
															"Categrization",
															tdcstrOfField);
													segmentElement
															.appendChild(fieldElement);
												} else {
													var fieldElement = xmlDoc
															.createElement("Field");
													fieldElement
															.setAttribute(
																	"Location",
																	segName
																			+ "."
																			+ field.position);
													fieldElement.setAttribute(
															"DataElement",
															field.name);
													segmentElement
															.appendChild(fieldElement);

													for (var k = 0; k < fieldDT.components.length; k++) {
														var c = fieldDT.components[k];
														var componentiPath = "."
																+ c.position
																+ "[1]";
														if (!$scope
																.isHideForMessageContentByUsage(
																		fieldDT,
																		c,
																		instanceSegment.path
																				+ "."
																				+ field.position
																				+ "."
																				+ c.position,
																		instanceSegment.positioniPath
																				+ "."
																				+ field.position
																				+ "[1]."
																				+ c.position
																				+ "[1]",
																		selectedConformanceProfile)) {
															var componentStr = $scope
																	.getComponentStrFromField(
																			fieldStr,
																			c.position);
															if ($scope
																	.findDatatype(
																			c.datatype,
																			selectedIntegrationProfile).components == null
																	|| $scope
																			.findDatatype(
																					c.datatype,
																					selectedIntegrationProfile).components.length == 0) {
																var tdcstrOfComponent = "";
																var cateOfComponent = testStep.testDataCategorizationMap[$scope
																		.replaceDot2Dash(segmentiPath
																				+ fieldiPath
																				+ componentiPath)];
																if (cateOfComponent)
																	tdcstrOfComponent = cateOfComponent.testDataCategorization;

																var componentElement = xmlDoc
																		.createElement("Component");
																componentElement
																		.setAttribute(
																				"Location",
																				segName
																						+ "."
																						+ field.position
																						+ "."
																						+ c.position);
																componentElement
																		.setAttribute(
																				"DataElement",
																				c.name);
																componentElement
																		.setAttribute(
																				"Data",
																				componentStr);
																componentElement
																		.setAttribute(
																				"Categrization",
																				tdcstrOfComponent);
																fieldElement
																		.appendChild(componentElement);
															} else {
																var componentElement = xmlDoc
																		.createElement("Component");
																componentElement
																		.setAttribute(
																				"Location",
																				segName
																						+ "."
																						+ field.position
																						+ "."
																						+ c.position);
																componentElement
																		.setAttribute(
																				"DataElement",
																				c.name);
																fieldElement
																		.appendChild(componentElement);

																for (var l = 0; l < $scope
																		.findDatatype(
																				c.datatype,
																				selectedIntegrationProfile).components.length; l++) {
																	var sc = $scope
																			.findDatatype(
																					c.datatype,
																					selectedIntegrationProfile).components[l];
																	if (!$scope
																			.isHideForMessageContentByUsage(
																					$scope
																							.findDatatype(
																									c.datatype,
																									selectedIntegrationProfile),
																					sc,
																					instanceSegment.path
																							+ "."
																							+ field.position
																							+ "."
																							+ c.position
																							+ "."
																							+ sc.position,
																					instanceSegment.positioniPath
																							+ "."
																							+ field.position
																							+ "[1]."
																							+ c.position
																							+ "[1]."
																							+ sc.position
																							+ "[1]",
																					selectedConformanceProfile)) {
																		var subcomponentiPath = "."
																				+ sc.position
																				+ "[1]";
																		var subcomponentStr = $scope
																				.getSubComponentStrFromField(
																						componentStr,
																						sc.position);
																		var tdcstrOfSubComponent = "";
																		var cateOfSubComponent = testStep.testDataCategorizationMap[$scope
																				.replaceDot2Dash(segmentiPath
																						+ fieldiPath
																						+ componentiPath
																						+ subcomponentiPath)];
																		if (cateOfSubComponent)
																			tdcstrOfSubComponent = cateOfSubComponent.testDataCategorization;
																		var subComponentElement = xmlDoc
																				.createElement("SubComponent");
																		subComponentElement
																				.setAttribute(
																						"Location",
																						segName
																								+ "."
																								+ field.position
																								+ "."
																								+ c.position
																								+ "."
																								+ sc.position);
																		subComponentElement
																				.setAttribute(
																						"DataElement",
																						sc.name);
																		subComponentElement
																				.setAttribute(
																						"Data",
																						subcomponentStr);
																		subComponentElement
																				.setAttribute(
																						"Categrization",
																						tdcstrOfSubComponent);
																		componentElement
																				.appendChild(subComponentElement);
																	}
																}
															}
														}
													}
												}
											}
										}
									}
								});

						var serializer = new XMLSerializer();
						var xmlString = serializer.serializeToString(xmlDoc);
						return xmlString;
					};

					$scope.isHideForMessageContentByUsage = function(segment,
							field, path, iPositionPath,
							selectedConformanceProfile) {
						if (field.hide)
							return true;

						if (field.usage == 'R')
							return false;
						if (field.usage == 'RE')
							return false;

						if (field.usage == 'C') {
							var p = $scope.findPreficate(segment.predicates,
									field.position + "[1]");

							if (p == null) {
								p = this.findPreficateForMessageAndGroup(path,
										iPositionPath,
										selectedConformanceProfile);
							}

							if (p != null) {
								if (p.trueUsage == 'R')
									return false;
								if (p.trueUsage == 'RE')
									return false;
								if (p.falseUsage == 'R')
									return false;
								if (p.falseUsage == 'RE')
									return false;
							}
						}
						return true;
					};

					$scope.findPreficate = function(predicates, path) {
						for (var i = 0; i < predicates.length; i++) {
							var p = predicates[i];
							if (p.constraintTarget == path)
								return p;
						}
						return null;
					};

					$scope.findPreficateForMessageAndGroup = function(path,
							iPositionPath, selectedConformanceProfile) {
						var groupPath = selectedConformanceProfile.structID;
						var paths = path.split(".");

						for (var index = 0; index < paths.length; index++) {
							var pathData = paths[index];
							groupPath = groupPath + "." + pathData;
							var group = $scope.findGroup(
									selectedConformanceProfile.children,
									groupPath);
							var depth = groupPath.split(".").length - 1;
							var partIPositionPath = "";
							for (var i = depth; i < paths.length; i++) {
								var s = iPositionPath.split(".")[i];
								s = s.substring(0, s.indexOf("[")) + "[1]";
								partIPositionPath = partIPositionPath + "." + s;
							}
							if (group != null) {
								for (var i = 0; i < group.predicates.length; i++) {
									var p = group.predicates[i];
									if (p.constraintTarget == partIPositionPath
											.substring(1))
										return p;
								}
							}
						}

						for (var i = 0; i < selectedConformanceProfile.length; i++) {
							var p = selectedConformanceProfile.predicates[i];
							var partIPositionPath = "";
							for (var i = 0; i < paths.length; i++) {
								var s = iPositionPath.split(".")[i];
								s = s.substring(0, s.indexOf("[")) + "[1]";
								partIPositionPath = partIPositionPath + "." + s;
							}
							if (p.constraintTarget == partIPositionPath
									.substring(1))
								return p;
						}

						return null;
					};

					$scope.findGroup = function(children, groupPath) {
						for (var i = 0; i < children.length; i++) {
							if (children[i].type == 'group') {
								var group = children[i];

								if (group.name == groupPath)
									return group;

								if (groupPath.startsWith(group.name)) {
									return this.findGroup(group.children,
											groupPath);
								}
							}
						}
						return null;
					};

					$scope.getFieldStrFromSegment = function(segmentName, is,
							position) {
						// &lt; (<), &amp; (&), &gt; (>), &quot; ("), and &apos;
						// (').
						var segmentStr = is.segmentStr;
						if (segmentName == "MSH") {
							segmentStr = "MSH|FieldSeperator|Encoding|"
									+ segmentStr.substring(9);
						}
						var wholeFieldStr = segmentStr.split("|");

						if (position > wholeFieldStr.length - 1)
							return "";
						else
							return wholeFieldStr[position];
					};

					$scope.getComponentStrFromField = function(fieldStr,
							position) {
						var componentStr = fieldStr.split("^");

						if (position > componentStr.length)
							return "";
						else
							return componentStr[position - 1];

					};

					$scope.getSubComponentStrFromField = function(componentStr,
							position) {
						var subComponentStr = componentStr.split("&");

						if (position > subComponentStr.length)
							return "";
						else
							return subComponentStr[position - 1];
					};

					$scope.genSTDNISTXML = function(testcaseName) {
						$scope.initTestData();
						$rootScope.selectedTestStep.nistXMLCode = $scope
								.formatXml($scope.generateXML(
										$rootScope.segmentList,
										$rootScope.selectedIntegrationProfile,
										$rootScope.selectedConformanceProfile,
										testcaseName, false));
						$rootScope.selectedTestStep.stdXMLCode = $scope
								.formatXml($scope.generateXML(
										$rootScope.segmentList,
										$rootScope.selectedIntegrationProfile,
										$rootScope.selectedConformanceProfile,
										testcaseName, true));
					};

					$scope.formatXml = function(xml) {
						var reg = /(>)\s*(<)(\/*)/g; // updated Mar 30, 2015
						var wsexp = / *(.*) +\n/g;
						var contexp = /(<.+>)(.+\n)/g;
						xml = xml.replace(reg, '$1\n$2$3').replace(wsexp,
								'$1\n').replace(contexp, '$1\n$2');
						var pad = 0;
						var formatted = '';
						var lines = xml.split('\n');
						var indent = 0;
						var lastType = 'other';
						// 4 types of tags - single, closing, opening, other
						// (text, doctype, comment) - 4*4 = 16 transitions
						var transitions = {
							'single->single' : 0,
							'single->closing' : -1,
							'single->opening' : 0,
							'single->other' : 0,
							'closing->single' : 0,
							'closing->closing' : -1,
							'closing->opening' : 0,
							'closing->other' : 0,
							'opening->single' : 1,
							'opening->closing' : 0,
							'opening->opening' : 1,
							'opening->other' : 1,
							'other->single' : 0,
							'other->closing' : -1,
							'other->opening' : 0,
							'other->other' : 0
						};

						for (var i = 0; i < lines.length; i++) {
							var ln = lines[i];
							var single = Boolean(ln.match(/<.+\/>/)); // is
																		// this
																		// line
																		// a
																		// single
																		// tag?
																		// ex.
																		// <br
																		// />
							var closing = Boolean(ln.match(/<\/.+>/)); // is
																		// this
																		// a
																		// closing
																		// tag?
																		// ex.
																		// </a>
							var opening = Boolean(ln.match(/<[^!].*>/)); // is
																			// this
																			// even
																			// a
																			// tag
																			// (that's
																			// not
																			// <!something>)
							var type = single ? 'single' : closing ? 'closing'
									: opening ? 'opening' : 'other';
							var fromTo = lastType + '->' + type;
							lastType = type;
							var padding = '';

							indent += transitions[fromTo];
							for (var j = 0; j < indent; j++) {
								padding += '\t';
							}
							if (fromTo == 'opening->closing')
								formatted = formatted.substr(0,
										formatted.length - 1)
										+ ln + '\n'; // substr removes line
														// break (\n) from prev
														// loop
							else
								formatted += padding + ln + '\n';
						}

						return formatted;
					};

					$scope.generateXML = function(segmentList,
							selectedIntegrationProfile,
							selectedConformanceProfile, testcaseName, isSTD) {
						var rootName = selectedConformanceProfile.structID;
						var xmlString = '<' + rootName + ' testcaseName=\"'
								+ testcaseName + '\">' + '</' + rootName + '>';
						var parser = new DOMParser();
						var xmlDoc = parser.parseFromString(xmlString,
								"text/xml");

						var rootElm = xmlDoc.getElementsByTagName(rootName)[0];

						segmentList
								.forEach(function(segment) {
									var iPathList = segment.iPath.split(".");
									if (iPathList.length == 1) {
										var segmentElm = xmlDoc
												.createElement(iPathList[0]
														.substring(
																0,
																iPathList[0]
																		.lastIndexOf("[")));

										if (isSTD) {
											$scope.generateSegment(segmentElm,
													segment, xmlDoc,
													selectedIntegrationProfile);
										}

										else {
											$scope.generateNISTSegment(
													segmentElm, segment,
													xmlDoc,
													selectedIntegrationProfile);
										}

										rootElm.appendChild(segmentElm);
									} else {
										var parentElm = rootElm;

										for (var i = 0; i < iPathList.length; i++) {
											var iPath = iPathList[i];
											if (i == iPathList.length - 1) {
												var segmentElm = xmlDoc
														.createElement(iPath
																.substring(
																		0,
																		iPath
																				.lastIndexOf("[")));
												if (isSTD) {
													$scope
															.generateSegment(
																	segmentElm,
																	segment,
																	xmlDoc,
																	selectedIntegrationProfile);
												}

												else {
													$scope
															.generateNISTSegment(
																	segmentElm,
																	segment,
																	xmlDoc,
																	selectedIntegrationProfile);
												}
												parentElm
														.appendChild(segmentElm);
											} else {
												var groupName = iPath
														.substring(
																0,
																iPath
																		.lastIndexOf("["));
												var groupIndex = parseInt(iPath
														.substring(
																iPath
																		.lastIndexOf("[") + 1,
																iPath
																		.lastIndexOf("]")));

												var groups = parentElm
														.getElementsByTagName(rootName
																+ "."
																+ groupName);
												if (groups == null
														|| groups.length < groupIndex) {
													var group = xmlDoc
															.createElement(rootName
																	+ "."
																	+ groupName);
													parentElm
															.appendChild(group);
													parentElm = group;

												} else {
													parentElm = groups[groupIndex - 1];
												}
											}
										}
									}
								});

						var serializer = new XMLSerializer();
						var xmlString = serializer.serializeToString(xmlDoc);

						return xmlString;
					};

					$scope.generateSegment = function(segmentElm,
							instanceSegment, xmlDoc, selectedIntegrationProfile) {
						var lineStr = instanceSegment.segmentStr;
						var segmentName = lineStr.substring(0, 3);
						var segment = instanceSegment.obj;
						var variesDT = "";

						if (lineStr.startsWith("MSH")) {
							lineStr = "MSH|%SEGMENTDVIDER%|%ENCODINGDVIDER%"
									+ lineStr.substring(8);
						}

						var fieldStrs = lineStr.substring(4).split("|");

						for (var i = 0; i < fieldStrs.length; i++) {
							var fieldStrRepeats = fieldStrs[i].split("~");
							for (var g = 0; g < fieldStrRepeats.length; g++) {
								var fieldStr = fieldStrRepeats[g];
								if (fieldStr === "%SEGMENTDVIDER%") {
									var fieldElm = xmlDoc
											.createElement("MSH.1");
									var value = xmlDoc.createTextNode("|");
									fieldElm.appendChild(value);
									segmentElm.appendChild(fieldElm);
								} else if (fieldStr == "%ENCODINGDVIDER%") {
									var fieldElm = xmlDoc
											.createElement("MSH.2");
									var value = xmlDoc.createTextNode("^~\\&");
									fieldElm.appendChild(value);
									segmentElm.appendChild(fieldElm);
								} else {
									if (fieldStr != null && fieldStr !== "") {
										if (i < segment.fields.length) {
											var field = segment.fields[i];
											var fieldElm = xmlDoc
													.createElement(segmentName
															+ "."
															+ field.position);
											if ($scope.findDatatype(
													field.datatype,
													selectedIntegrationProfile).components == null
													|| $scope
															.findDatatype(
																	field.datatype,
																	selectedIntegrationProfile).components.length == 0) {
												if (lineStr.startsWith("OBX")) {
													if (field.position == 2) {
														variesDT = fieldStr;
														var value = xmlDoc
																.createTextNode(fieldStr);
														fieldElm
																.appendChild(value);
													} else if (field.position == 5) {
														var componentStrs = fieldStr
																.split("^");

														for (var index = 0; index < componentStrs.length; index++) {
															var componentStr = componentStrs[index];
															var componentElm = xmlDoc
																	.createElement(variesDT
																			+ "."
																			+ (index + 1));
															var value = xmlDoc
																	.createTextNode(componentStr);
															componentElm
																	.appendChild(value);
															fieldElm
																	.appendChild(componentElm);
														}
													} else {
														var value = xmlDoc
																.createTextNode(fieldStr);
														fieldElm
																.appendChild(value);
													}
												} else {
													var value = xmlDoc
															.createTextNode(fieldStr);
													fieldElm.appendChild(value);
												}
											} else {
												var componentStrs = fieldStr
														.split("^");
												var componentDataTypeName = $scope
														.findDatatype(
																field.datatype,
																selectedIntegrationProfile).name;
												for (var j = 0; j < componentStrs.length; j++) {
													if (j < $scope
															.findDatatype(
																	field.datatype,
																	selectedIntegrationProfile).components.length) {
														var component = $scope
																.findDatatype(
																		field.datatype,
																		selectedIntegrationProfile).components[j];
														var componentStr = componentStrs[j];
														if (componentStr != null
																&& componentStr !== "") {
															var componentElm = xmlDoc
																	.createElement(componentDataTypeName
																			+ "."
																			+ (j + 1));
															if ($scope
																	.findDatatype(
																			component.datatype,
																			selectedIntegrationProfile).components == null
																	|| $scope
																			.findDatatype(
																					component.datatype,
																					selectedIntegrationProfile).components.length == 0) {
																var value = xmlDoc
																		.createTextNode(componentStr);
																componentElm
																		.appendChild(value);
															} else {
																var subComponentStrs = componentStr
																		.split("&");
																var subComponentDataTypeName = $scope
																		.findDatatype(
																				component.datatype,
																				selectedIntegrationProfile).name;

																for (var k = 0; k < subComponentStrs.length; k++) {
																	var subComponentStr = subComponentStrs[k];
																	if (subComponentStr != null
																			&& subComponentStr !== "") {
																		var subComponentElm = xmlDoc
																				.createElement(subComponentDataTypeName
																						+ "."
																						+ (k + 1));
																		var value = xmlDoc
																				.createTextNode(subComponentStr);
																		subComponentElm
																				.appendChild(value);
																		componentElm
																				.appendChild(subComponentElm);
																	}
																}

															}
															fieldElm
																	.appendChild(componentElm);
														}
													}
												}

											}
											segmentElm.appendChild(fieldElm);
										}
									}
								}
							}
						}
					};

					$scope.generateNISTSegment = function(segmentElm,
							instanceSegment, xmlDoc, selectedIntegrationProfile) {
						var lineStr = instanceSegment.segmentStr;
						var segmentName = lineStr.substring(0, 3);
						var segment = instanceSegment.obj;

						if (lineStr.startsWith("MSH")) {
							lineStr = "MSH|%SEGMENTDVIDER%|%ENCODINGDVIDER%"
									+ lineStr.substring(8);
						}

						var fieldStrs = lineStr.substring(4).split("|");

						for (var i = 0; i < fieldStrs.length; i++) {
							var fieldStrRepeats = fieldStrs[i].split("~");
							for (var g = 0; g < fieldStrRepeats.length; g++) {
								var fieldStr = fieldStrRepeats[g];

								if (fieldStr == "%SEGMENTDVIDER%") {
									var fieldElm = xmlDoc
											.createElement("MSH.1");
									var value = xmlDoc.createTextNode("|");
									fieldElm.appendChild(value);
									segmentElm.appendChild(fieldElm);
								} else if (fieldStr == "%ENCODINGDVIDER%") {
									var fieldElm = xmlDoc
											.createElement("MSH.2");
									var value = xmlDoc.createTextNode("^~\\&");
									fieldElm.appendChild(value);
									segmentElm.appendChild(fieldElm);
								} else {
									if (fieldStr != null && fieldStr !== "") {
										if (i < segment.fields.length) {
											var field = segment.fields[i];
											var fieldElm = xmlDoc
													.createElement(segmentName
															+ "."
															+ field.position);
											if ($scope.findDatatype(
													field.datatype,
													selectedIntegrationProfile).components == null
													|| $scope
															.findDatatype(
																	field.datatype,
																	selectedIntegrationProfile).components.length == 0) {
												if (lineStr.startsWith("OBX")) {
													if (field.position == 2) {
														var value = xmlDoc
																.createTextNode(fieldStr);
														fieldElm
																.appendChild(value);
													} else if (field.position == 5) {
														var componentStrs = fieldStr
																.split("^");
														for (var index = 0; index < componentStrs.length; index++) {
															var componentStr = componentStrs[index];
															var componentElm = xmlDoc
																	.createElement(segmentName
																			+ "."
																			+ field.position
																			+ "."
																			+ (index + 1));
															var value = xmlDoc
																	.createTextNode(componentStr);
															componentElm
																	.appendChild(value);
															fieldElm
																	.appendChild(componentElm);
														}
													} else {
														var value = xmlDoc
																.createTextNode(fieldStr);
														fieldElm
																.appendChild(value);
													}
												} else {
													var value = xmlDoc
															.createTextNode(fieldStr);
													fieldElm.appendChild(value);
												}
											} else {
												var componentStrs = fieldStr
														.split("^");
												for (var j = 0; j < componentStrs.length; j++) {
													if (j < $scope
															.findDatatype(
																	field.datatype,
																	selectedIntegrationProfile).components.length) {
														var component = $scope
																.findDatatype(
																		field.datatype,
																		selectedIntegrationProfile).components[j];
														var componentStr = componentStrs[j];
														if (componentStr != null
																&& componentStr !== "") {
															var componentElm = xmlDoc
																	.createElement(segmentName
																			+ "."
																			+ (i + 1)
																			+ "."
																			+ (j + 1));
															if ($scope
																	.findDatatype(
																			component.datatype,
																			selectedIntegrationProfile).components == null
																	|| $scope
																			.findDatatype(
																					component.datatype,
																					selectedIntegrationProfile).components.length == 0) {
																var value = xmlDoc
																		.createTextNode(componentStr);
																componentElm
																		.appendChild(value);
															} else {
																var subComponentStrs = componentStr
																		.split("&");
																for (var k = 0; k < subComponentStrs.length; k++) {
																	var subComponentStr = subComponentStrs[k];
																	if (subComponentStr != null
																			&& subComponentStr !== "") {
																		var subComponentElm = xmlDoc
																				.createElement(segmentName
																						+ "."
																						+ (i + 1)
																						+ "."
																						+ (j + 1)
																						+ "."
																						+ (k + 1));
																		var value = xmlDoc
																				.createTextNode(subComponentStr);
																		subComponentElm
																				.appendChild(value);
																		componentElm
																				.appendChild(subComponentElm);
																	}
																}

															}
															fieldElm
																	.appendChild(componentElm);
														}
													}
												}

											}
											segmentElm.appendChild(fieldElm);
										}
									}
								}
							}
						}
					};

					$scope.segmentListAccordionClicked = function() {
						if ($scope.testDataAccordi.segmentList === false) {
							$scope.testDataAccordi = {};
							$scope.testDataAccordi.selectedSegment = false;
							$scope.testDataAccordi.constraintList = false;
						}
					};

					$scope.segmentAccordionClicked = function() {
						if ($scope.testDataAccordi.selectedSegment === false) {
							$scope.testDataAccordi = {};
							$scope.testDataAccordi.segmentList = false;
							$scope.testDataAccordi.constraintList = false;
						}
					};
					// $scope.documentAccordionClicked= function () {

					// }
					$scope.constraintAccordionClicked = function() {
						if ($scope.testDataAccordi.constraintList === false) {
							$scope.testDataAccordi = {};
							$scope.testDataAccordi.segmentList = false;
							$scope.testDataAccordi.selectedSegment = false;

							if ($rootScope.selectedTestStep
									&& $rootScope.selectedTestStep.testDataCategorizationMap) {

								var keys = $
										.map(
												$rootScope.selectedTestStep.testDataCategorizationMap,
												function(v, i) {
													return i;
												});

								$scope.listOfTDC = [];

								keys
										.forEach(function(key) {
											var testDataCategorizationObj = $rootScope.selectedTestStep.testDataCategorizationMap[key];

											if (testDataCategorizationObj != undefined
													&& testDataCategorizationObj != null) {
												if (testDataCategorizationObj.testDataCategorization
														&& testDataCategorizationObj.testDataCategorization !== '') {
													var cate = {};
													cate.iPath = testDataCategorizationObj.iPath;
													cate.name = testDataCategorizationObj.name;
													cate.testDataCategorization = testDataCategorizationObj.testDataCategorization;
													cate.listData = testDataCategorizationObj.listData;
													$scope.listOfTDC.push(cate);
												}
											}
										});
							}
						}
					};

					$scope.findConformanceStatements = function(
							conformanceStatements, i) {
						return _.filter(conformanceStatements, function(cs) {
							return cs.constraintTarget == i + '[1]';
						});
					};

					$scope.findPredicate = function(predicates, i) {
						return _.find(predicates, function(cp) {
							return cp.constraintTarget == i + '[1]';
						});
					};

					$scope.travelConformanceProfile = function(parent, path,
							ipath, positionPath, positioniPath, usagePath,
							nodeList, maxSize, selectedIntegrationProfile) {
						for ( var i in parent.children) {
							var child = parent.children[i];
							if (child.type === 'segmentRef') {
								var obj = $scope.findSegment(child.ref,
										selectedIntegrationProfile);

								if (child.max === '1') {
									var segmentPath = null;
									var segmentiPath = null;
									var segmentPositionPath = null;
									var segmentiPositionPath = null;
									var segmentUsagePath = null;

									if (path === "") {
										segmentPath = obj.name;
										segmentiPath = obj.name + "[1]";
										segmentPositionPath = child.position;
										segmentiPositionPath = child.position
												+ "[1]";
										segmentUsagePath = child.usage;
									} else {
										segmentPath = path + "." + obj.name;
										segmentiPath = ipath + "." + obj.name
												+ "[1]";
										segmentPositionPath = positionPath
												+ "." + child.position;
										segmentiPositionPath = positioniPath
												+ "." + child.position + "[1]";
										segmentUsagePath = usagePath + "-"
												+ child.usage;
									}
									var node = {
										type : 'segment',
										path : segmentPath,
										iPath : segmentiPath,
										positionPath : segmentPositionPath,
										positioniPath : segmentiPositionPath,
										usagePath : segmentUsagePath,
										obj : obj
									};
									nodeList.push(node);
								} else {
									for (var index = 1; index < maxSize + 1; index++) {
										var segmentPath = null;
										var segmentiPath = null;
										var segmentPositionPath = null;
										var segmentiPositionPath = null;
										var segmentUsagePath = null;

										if (path === "") {
											segmentPath = obj.name;
											segmentiPath = obj.name + "["
													+ index + "]";
											segmentPositionPath = child.position;
											segmentiPositionPath = child.position
													+ "[" + index + "]";
											segmentUsagePath = child.usage;
										} else {
											segmentPath = path + "." + obj.name;
											segmentiPath = ipath + "."
													+ obj.name + "[" + index
													+ "]";
											segmentPositionPath = positionPath
													+ "." + child.position;
											segmentiPositionPath = positioniPath
													+ "."
													+ child.position
													+ "[" + index + "]";
											segmentUsagePath = usagePath + "-"
													+ child.usage;
										}

										var node = {
											type : 'segment',
											path : segmentPath,
											iPath : segmentiPath,
											positionPath : segmentPositionPath,
											positioniPath : segmentiPositionPath,
											usagePath : segmentUsagePath,
											obj : obj
										};
										nodeList.push(node);
									}
								}

							} else if (child.type === 'group') {
								var groupName = child.name;
								if (groupName.indexOf(".") >= 0) {
									groupName = groupName.substr(groupName
											.lastIndexOf(".") + 1);
								}

								if (child.max === '1') {
									var groupPath = null;
									var groupiPath = null;
									var groupPositionPath = null;
									var groupiPositionPath = null;
									var groupUsagePath = null;

									if (path === "") {
										groupPath = groupName;
										groupiPath = groupName + "[1]";
										groupPositionPath = child.position;
										groupiPositionPath = child.position
												+ "[1]";
										groupUsagePath = child.usage;
									} else {
										groupPath = path + "." + groupName;
										groupiPath = ipath + "." + groupName
												+ "[1]";
										groupPositionPath = positionPath + "."
												+ child.position;
										groupiPositionPath = positioniPath
												+ "." + child.position + "[1]";
										groupUsagePath = usagePath + "-"
												+ child.usage;
									}

									$scope.travelConformanceProfile(child,
											groupPath, groupiPath,
											groupPositionPath,
											groupiPositionPath, groupUsagePath,
											nodeList, maxSize,
											selectedIntegrationProfile);
								} else {
									for (var index = 1; index < maxSize + 1; index++) {
										var groupPath = null;
										var groupiPath = null;
										var groupPositionPath = null;
										var groupiPositionPath = null;
										var groupUsagePath = null;

										if (path === "") {
											groupPath = groupName;
											groupiPath = groupName + "["
													+ index + "]";
											groupPositionPath = child.position;
											groupiPositionPath = child.position
													+ "[" + index + "]";
											groupUsagePath = child.usage;
										} else {
											groupPath = path + "." + groupName;
											groupiPath = ipath + "."
													+ groupName + "[" + index
													+ "]";
											groupPositionPath = positionPath
													+ "." + child.position;
											groupiPositionPath = positioniPath
													+ "." + child.position
													+ "[" + index + "]";
											groupUsagePath = usagePath + "-"
													+ child.usage;
										}

										$scope.travelConformanceProfile(child,
												groupPath, groupiPath,
												groupPositionPath,
												groupiPositionPath,
												groupUsagePath, nodeList,
												maxSize,
												selectedIntegrationProfile);
									}
								}
							}
						}
						;
					};

					$scope.findTable = function(ref) {
						if (ref === undefined || ref === null)
							return null;
						if ($rootScope.selectedIntegrationProfile == undefined
								|| $rootScope.selectedIntegrationProfile == null)
							return null;
						return _
								.find(
										$rootScope.selectedIntegrationProfile.tables.children,
										function(t) {
											return t.id == ref.id;
										});
					};

					$scope.findDatatype = function(ref,
							selectedIntegrationProfile) {
						if (ref === undefined || ref === null)
							return null;
						if (selectedIntegrationProfile == undefined
								|| selectedIntegrationProfile == null)
							return null;
						return _.find(
								selectedIntegrationProfile.datatypes.children,
								function(d) {
									return d.id == ref.id;
								});
					};

					$scope.findDatatypeById = function(id,
							selectedIntegrationProfile) {
						if (id === undefined || id === null)
							return null;
						if (selectedIntegrationProfile == undefined
								|| selectedIntegrationProfile == null)
							return null;
						return _.find(
								selectedIntegrationProfile.datatypes.children,
								function(d) {
									return d.id == id;
								});
					};

					$scope.findSegment = function(ref,
							selectedIntegrationProfile) {
						if (ref === undefined || ref === null)
							return null;
						if (selectedIntegrationProfile == undefined
								|| selectedIntegrationProfile == null)
							return null;
						return _.find(
								selectedIntegrationProfile.segments.children,
								function(s) {
									return s.id == ref.id;
								});
					};

					$scope.editorOptions = {
						lineWrapping : false,
						lineNumbers : true,
						mode : 'xml'
					};

					$scope.refreshTree = function() {
						if ($scope.segmentParams)
							$scope.segmentParams.refresh();
					};

					$scope.minimizePath = function(iPath) {

						if ($rootScope.selectedSegmentNode) {
							return $scope
									.replaceAll(
											iPath
													.replace(
															$rootScope.selectedSegmentNode.segment.iPath
																	+ ".", ""),
											"[1]", "");
						}

						return '';
					};

					$scope.replaceAll = function(str, search, replacement) {
						return str.split(search).join(replacement);
					};

					$scope.usageFilter = function(node) {
						if (node.type == 'field') {
							if (node.field.usage === 'R')
								return true;
							if (node.field.usage === 'RE')
								return true;
							if (node.field.usage === 'C')
								return true;
						} else {
							if (node.component.usage === 'R')
								return true;
							if (node.component.usage === 'RE')
								return true;
							if (node.component.usage === 'C')
								return true;
						}

						return false;
					};

					$scope.changeUsageFilter = function() {
						if ($rootScope.usageViewFilter === 'All')
							$rootScope.usageViewFilter = 'RREC';
						else
							$rootScope.usageViewFilter = 'All';
					};

					$scope.segmentParams = new ngTreetableParams(
							{
								getNodes : function(parent) {
									if (parent && parent != null) {
										if ($rootScope.usageViewFilter != 'All') {
											return parent.children
													.filter($scope.usageFilter);

										} else {
											return parent.children;
										}
									} else {
										if ($rootScope.usageViewFilter != 'All') {
											if ($rootScope.selectedSegmentNode)
												return $rootScope.selectedSegmentNode.children
														.filter($scope.usageFilter);
										} else {
											if ($rootScope.selectedSegmentNode)
												return $rootScope.selectedSegmentNode.children;
										}
									}
									return [];
								},
								getTemplate : function(node) {
									if (node.type == 'field')
										return 'FieldTree.html';
									else if (node.type == 'component')
										return 'ComponentTree.html';
									else if (node.type == 'subcomponent')
										return 'SubComponentTree.html';
									else
										return 'FieldTree.html';
								}
							});

					$scope.hasChildren = function(node) {
						if (!node || !node.children
								|| node.children.length === 0)
							return false;
						return true;
					};

					$scope.filterForSegmentList = function(segment) {
						if (segment.usagePath.indexOf('O') > -1
								|| segment.usagePath.indexOf('X') > -1) {
							return false;
						}
						return true;
					};

					$scope.selectedCols = [];
					$scope.colsData = [ {
						id : 1,
						label : "DT"
					}, {
						id : 2,
						label : "Usage"
					}, {
						id : 3,
						label : "Cardi."
					}, {
						id : 4,
						label : "Length"
					}, {
						id : 5,
						label : "ValueSet"
					}, {
						id : 6,
						label : "Predicate"
					}, {
						id : 7,
						label : "Conf.Statement"
					} ];

					$scope.smartButtonSettings = {
						smartButtonMaxItems : 8,
						smartButtonTextConverter : function(itemText,
								originalItem) {
							return itemText;
						}
					};

					$scope.isShow = function(columnId) {
						return _.find($scope.selectedCols, function(col) {
							return col.id == columnId;
						});
					};

					$scope.updateTestDataCategorization = function(node) {
						if ($rootScope.selectedTestStep.testDataCategorizationMap == undefined
								|| $rootScope.selectedTestStep == null) {
							$rootScope.selectedTestStep.testDataCategorizationMap = {};
						}

						var name = '';
						if (node.type == 'field')
							name = node.field.name;
						else if (node.type == 'component')
							name = node.component.name;
						else if (node.type == 'subcomponent')
							name = node.component.name;

						if (node.testDataCategorization == null
								|| node.testDataCategorization == '') {
							$rootScope.selectedTestStep.testDataCategorizationMap[$scope
									.replaceDot2Dash(node.iPath)] = null;
						} else {
							var testDataCategorizationObj = {
								iPath : node.iPath,
								testDataCategorization : node.testDataCategorization,
								name : name,
								listData : []
							};

							if (node.testDataCategorization == 'Value-Test Case Fixed List') {
								node.testDataCategorizationListData = [];
								node.testDataCategorizationListData
										.push(node.value);
								testDataCategorizationObj.listData
										.push(node.value);
							}
							$rootScope.selectedTestStep.testDataCategorizationMap[$scope
									.replaceDot2Dash(node.iPath)] = testDataCategorizationObj;
						}

						$rootScope.selectedTestStep.constraintsXML = $scope
								.generateConstraintsXML($rootScope.segmentList,
										$rootScope.selectedTestStep,
										$rootScope.selectedConformanceProfile,
										$rootScope.selectedIntegrationProfile);
					};

					$scope.replaceDot2Dash = function(path) {
						return path.split('.').join('-');
					};

					$scope.deleteSegmentTemplate = function(template) {
						var index = $rootScope.template.segmentTemplates
								.indexOf(template);
						if (index > -1) {
							$rootScope.template.segmentTemplates.splice(index,
									1);
						}
						$scope.recordChanged();
					};

					$scope.deleteMessageTemplate = function(template) {
						var index = $rootScope.template.messageTemplates
								.indexOf(template);
						if (index > -1) {
							$rootScope.template.messageTemplates.splice(index,
									1);
						}
						$scope.recordChanged();
					};

					$scope.deleteER7Template = function(template) {
						var index = $rootScope.template.er7Templates
								.indexOf(template);
						if (index > -1) {
							$rootScope.template.er7Templates.splice(index, 1);
						}
						$scope.recordChanged();
					};

					$scope.applySegmentTemplate = function(template) {
						if ($rootScope.selectedTestStep
								&& $rootScope.selectedSegmentNode) {
							for ( var i in template.categorizations) {
								var cate = template.categorizations[i];
								if (cate.testDataCategorization
										&& cate.testDataCategorization !== '') {
									$rootScope.selectedTestStep.testDataCategorizationMap[$scope
											.replaceDot2Dash($rootScope.selectedSegmentNode.segment.iPath
													+ cate.iPath)] = cate;
								}
							}

							$scope.initTestData();

							if ($rootScope.selectedSegmentNode
									&& $rootScope.selectedSegmentNode.segment) {
								$scope
										.selectSegment($rootScope.selectedSegmentNode.segment);
								$scope.refreshTree();
							}

							$rootScope.selectedTestStep.messageContentsXMLCode = $scope
									.generateMessageContentXML(
											$rootScope.segmentList,
											$rootScope.selectedTestStep,
											$rootScope.selectedConformanceProfile,
											$rootScope.selectedIntegrationProfile);
							$rootScope.selectedTestStep.constraintsXML = $scope
									.generateConstraintsXML(
											$rootScope.segmentList,
											$rootScope.selectedTestStep,
											$rootScope.selectedConformanceProfile,
											$rootScope.selectedIntegrationProfile);

						}
						$scope.recordChanged();
					};

					$scope.applyMessageTemplate = function(template) {
						if ($rootScope.selectedTestStep) {
							for ( var i in template.categorizations) {
								var cate = template.categorizations[i];
								if (cate.testDataCategorization
										&& cate.testDataCategorization !== '') {
									$rootScope.selectedTestStep.testDataCategorizationMap[$scope
											.replaceDot2Dash(cate.iPath)] = cate;
								}
							}

							$scope.initTestData();

							if ($rootScope.selectedSegmentNode
									&& $rootScope.selectedSegmentNode.segment) {
								$scope
										.selectSegment($rootScope.selectedSegmentNode.segment);
								$scope.refreshTree();
							}

							$rootScope.selectedTestStep.messageContentsXMLCode = $scope
									.generateMessageContentXML(
											$rootScope.segmentList,
											$rootScope.selectedTestStep,
											$rootScope.selectedConformanceProfile,
											$rootScope.selectedIntegrationProfile);
							$rootScope.selectedTestStep.constraintsXML = $scope
									.generateConstraintsXML(
											$rootScope.segmentList,
											$rootScope.selectedTestStep,
											$rootScope.selectedConformanceProfile,
											$rootScope.selectedIntegrationProfile);
						}
						$scope.recordChanged();
					};

					$scope.overwriteMessageTemplate = function(template) {
						if ($rootScope.selectedTestStep) {
							$rootScope.selectedTestStep.testDataCategorizationMap = {};
							$scope.applyMessageTemplate(template);
						}
						$scope.recordChanged();
					};

					$scope.overwriteSegmentTemplate = function(template) {
						if ($rootScope.selectedTestStep
								&& $rootScope.selectedSegmentNode) {
							var keys = $
									.map(
											$rootScope.selectedTestStep.testDataCategorizationMap,
											function(v, i) {
												if (i
														.includes($rootScope.selectedSegmentNode.segment.iPath
																.split('.')
																.join('-')))
													return i;
											});

							keys
									.forEach(function(key) {
										$rootScope.selectedTestStep.testDataCategorizationMap[key] = null;
									});

							$scope.applySegmentTemplate(template);
						}
						$scope.recordChanged();
					};

					$scope.overwriteER7Template = function(template) {
						if ($rootScope.selectedTestStep) {
							$rootScope.selectedTestStep.er7Message = template.er7Message;

							$scope.updateEr7Message();

							if ($rootScope.selectedSegmentNode
									&& $rootScope.selectedSegmentNode.segment) {
								$scope
										.selectSegment($rootScope.selectedSegmentNode.segment);
								$scope.refreshTree();
							}
						}
						$scope.recordChanged();
					};

					$scope.deleteRepeatedField = function(node) {
						var index = $rootScope.selectedSegmentNode.children
								.indexOf(node);
						if (index > -1) {
							$rootScope.selectedSegmentNode.children.splice(
									index, 1);
						}
						$scope.updateValue(node);
						$scope.refreshTree();
					};

					$scope.addRepeatedField = function(node) {
						var fieldStr = node.value;
						var fieldPosition = node.path.substring(node.path
								.lastIndexOf('.') + 1);
						var splittedSegment = $rootScope.selectedSegmentNode.segment.segmentStr
								.split("|");
						if ($rootScope.selectedSegmentNode.segment.obj.name == 'MSH')
							fieldPosition = fieldPosition - 1;
						splittedSegment[fieldPosition] = splittedSegment[fieldPosition]
								+ '~' + fieldStr;
						var updatedStr = '';
						for ( var i in splittedSegment) {
							updatedStr = updatedStr + splittedSegment[i];
							if (i < splittedSegment.length - 1)
								updatedStr = updatedStr + "|"
						}
						$rootScope.selectedSegmentNode.segment.segmentStr = updatedStr;
						var updatedER7Message = '';
						for ( var i in $rootScope.segmentList) {
							updatedER7Message = updatedER7Message
									+ $rootScope.segmentList[i].segmentStr
									+ '\n';
						}
						$rootScope.selectedTestStep.er7Message = updatedER7Message;
						$scope
								.selectSegment($rootScope.selectedSegmentNode.segment);
						$scope.recordChanged();
					};

					$scope.updateValue = function(node) {
						var segmentStr = $rootScope.selectedSegmentNode.segment.obj.name;
						var previousFieldPath = '';
						for ( var i in $rootScope.selectedSegmentNode.children) {
							var fieldNode = $rootScope.selectedSegmentNode.children[i];
							if (previousFieldPath === fieldNode.positionPath) {
								segmentStr = segmentStr + "~"
							} else {
								segmentStr = segmentStr + "|"
							}

							previousFieldPath = fieldNode.positionPath;

							if (fieldNode.children.length === 0) {
								if (fieldNode.value != undefined
										|| fieldNode.value != null)
									segmentStr = segmentStr + fieldNode.value;
							} else {
								for ( var j in fieldNode.children) {
									var componentNode = fieldNode.children[j];
									if (componentNode.children.length === 0) {
										if (componentNode.value != undefined
												|| componentNode.value != null)
											segmentStr = segmentStr
													+ componentNode.value;
										segmentStr = segmentStr + "^";
									} else {
										for ( var k in componentNode.children) {
											var subComponentNode = componentNode.children[k];
											if (subComponentNode.value != undefined
													|| subComponentNode.value != null)
												segmentStr = segmentStr
														+ subComponentNode.value;
											segmentStr = segmentStr + "&";
											if (k == componentNode.children.length - 1) {
												segmentStr = $scope.reviseStr(
														segmentStr, '&');
											}
										}
										segmentStr = segmentStr + "^";
									}

									if (j == fieldNode.children.length - 1) {
										segmentStr = $scope.reviseStr(
												segmentStr, '^');
									}
								}
							}

							if (i == $rootScope.selectedSegmentNode.children.length - 1) {
								segmentStr = $scope.reviseStr(segmentStr, '|');
							}

						}
						if (segmentStr.substring(0, 11) == "MSH|||^~\\&|")
							segmentStr = 'MSH|^~\\&|'
									+ segmentStr.substring(11);

						$rootScope.selectedSegmentNode.segment.segmentStr = segmentStr;

						var updatedER7Message = '';

						for ( var i in $rootScope.segmentList) {
							updatedER7Message = updatedER7Message
									+ $rootScope.segmentList[i].segmentStr
									+ '\n';
						}

						$rootScope.selectedTestStep.er7Message = updatedER7Message;

						if (node.testDataCategorization == 'Value-Test Case Fixed List') {
							if (node.testDataCategorizationListData
									.indexOf(node.value) == -1) {
								node.testDataCategorizationListData
										.push(node.value);
							}
							var testDataCategorizationObj = $rootScope.selectedTestStep.testDataCategorizationMap[$scope
									.replaceDot2Dash(node.iPath)];
							if (testDataCategorizationObj.listData
									.indexOf(node.value) == -1) {
								testDataCategorizationObj.listData
										.push(node.value);
							}
						}

						$rootScope.selectedTestStep.messageContentsXMLCode = $scope
								.generateMessageContentXML(
										$rootScope.segmentList,
										$rootScope.selectedTestStep,
										$rootScope.selectedConformanceProfile,
										$rootScope.selectedIntegrationProfile);
						$rootScope.selectedTestStep.nistXMLCode = $scope
								.generateXML($rootScope.segmentList,
										$rootScope.selectedIntegrationProfile,
										$rootScope.selectedConformanceProfile,
										$scope.findTestCaseNameOfTestStep(),
										false);
						$rootScope.selectedTestStep.stdXMLCode = $scope
								.generateXML($rootScope.segmentList,
										$rootScope.selectedIntegrationProfile,
										$rootScope.selectedConformanceProfile,
										$scope.findTestCaseNameOfTestStep(),
										true);
						$rootScope.selectedTestStep.constraintsXML = $scope
								.generateConstraintsXML($rootScope.segmentList,
										$rootScope.selectedTestStep,
										$rootScope.selectedConformanceProfile,
										$rootScope.selectedIntegrationProfile);
						$scope.recordChanged();
					};

					$scope.updateEr7Message = function() {
						$scope.initTestData();
						$rootScope.selectedTestStep.messageContentsXMLCode = $scope
								.generateMessageContentXML(
										$rootScope.segmentList,
										$rootScope.selectedTestStep,
										$rootScope.selectedConformanceProfile,
										$rootScope.selectedIntegrationProfile);
						$rootScope.selectedTestStep.nistXMLCode = $scope
								.generateXML($rootScope.segmentList,
										$rootScope.selectedIntegrationProfile,
										$rootScope.selectedConformanceProfile,
										$scope.findTestCaseNameOfTestStep(),
										false);
						$rootScope.selectedTestStep.stdXMLCode = $scope
								.generateXML($rootScope.segmentList,
										$rootScope.selectedIntegrationProfile,
										$rootScope.selectedConformanceProfile,
										$scope.findTestCaseNameOfTestStep(),
										true);
						$rootScope.selectedTestStep.constraintsXML = $scope
								.generateConstraintsXML($rootScope.segmentList,
										$rootScope.selectedTestStep,
										$rootScope.selectedConformanceProfile,
										$rootScope.selectedIntegrationProfile);
						$scope.recordChanged();
					};

					$scope.reviseStr = function(str, seperator) {
						var lastChar = str.substring(str.length - 1);
						if (seperator !== lastChar)
							return str;
						else {
							str = str.substring(0, str.length - 1);
							return $scope.reviseStr(str, seperator);
						}

					};

					$scope.result = "";
					// validation
					$scope.validate = function(mode) {
						$scope.result = "";
						var message = $rootScope.selectedTestStep.er7Message;
						var igDocumentId = $rootScope.selectedTestStep.integrationProfileId;
						var conformanceProfileId = $rootScope.selectedTestStep.conformanceProfileId;
						var cbConstraints = $rootScope.selectedTestStep.constraintsXML;

						console.log(cbConstraints);
						var context = mode;

						var req = {
							method : 'POST',
							url : 'api/validation',
							params : {
								message : message,
								igDocumentId : igDocumentId,
								conformanceProfileId : conformanceProfileId,
								context : context
							},
							data : {
								constraint : cbConstraints
							}
						}

						var promise = $http(req)
								.success(
										function(data, status, headers, config) {
											$scope.result = $sce
													.trustAsHtml(data.html);
											return data;
										})
								.error(
										function(data, status, headers, config) {
											if (status === 404)
												console
														.log("Could not reach the server");
											else if (status === 403) {
												console.log("limited access");
											}
										});

						return promise;
					};

					// Tree Functions
					$scope.activeModel = {};

					$scope.treeOptions = {

						accept : function(sourceNodeScope, destNodesScope,
								destIndex) {
							// destNodesScope.expand();
							var dataTypeSource = sourceNodeScope.$element
									.attr('data-type');
							var dataTypeDest = destNodesScope.$element
									.attr('data-type');
							console.log("source" + dataTypeSource);
							console.log("destination " + dataTypeDest);
							if (dataTypeSource === "childrens") {
								return false;
							}
							if (dataTypeSource === "child") {
								if (dataTypeDest === "childrens") {
									return true;
								} else if (!sourceNodeScope.$modelValue.testcases
										&& dataTypeDest === 'group') {

									return true;
								} else {
									return false;
								}
							} else if (dataTypeSource === "group") {
								if (dataTypeDest === "childrens") {

									return true;
								} else {

									return false;
								}
							}

							else if (dataTypeSource === "case") {
								if (dataTypeDest === "group"
										|| dataTypeDest === "childrens") {
									return true;
								} else {
									return false;
								}
							}

							else if (dataTypeSource === "step") {
								if (dataTypeDest === "case") {
									return true;
								} else {
									return false;
								}
							} else {
								return false;
							}

						},
						dropped : function(event) {

							var sourceNode = event.source.nodeScope;
							var destNodes = event.dest.nodesScope;
							var sortBefore = event.source.index;
							var sortAfter = event.dest.index;

							var dataType = destNodes.$element.attr('data-type');
							event.source.nodeScope.$modelValue.position = sortAfter + 1;
							$scope
									.updatePositions(event.dest.nodesScope.$modelValue);
							$scope
									.updatePositions(event.source.nodesScope.$modelValue);
							// $scope.recordChanged();

						}
					};

					$scope.updatePositions = function(arr) {

						for (var i = arr.length - 1; i >= 0; i--) {
							arr[i].position = i + 1;
						}
					};

					$scope.Activate = function(itemScope) {
						$scope.activeModel = itemScope.$modelValue;
						// $scope.activeId=itemScope.$id;
					};

					$scope.isCase = function(children) {

						if (!children.teststeps) {
							return false;
						} else {
							return true;
						}
					}

					$scope.cloneteststep = function(teststep) {
						var model = {};
						model.name = teststep.name + "clone";
					}

					$scope.isGroupe = function(children) {

						if (!children.testcases) {
							return false;
						} else {
							return true;
						}
					}
					// Context menu

					$scope.testPlanOptions = [
							[
									'add new testgroup',
									function($itemScope) {
										if (!$itemScope.$nodeScope.$modelValue.children) {
											$itemScope.$nodeScope.$modelValue.children = [];
										}
										$itemScope.$nodeScope.$modelValue.children
												.push({
													id : new ObjectId()
															.toString(),
													type : "testcasegroup",
													name : "newTestGroup",
													testcases : [],
													position : $itemScope.$nodeScope.$modelValue.children.length + 1
												});

										$scope.activeModel = $itemScope.$nodeScope.$modelValue.children[$itemScope.$nodeScope.$modelValue.children.length - 1];
										Notification.success({
											message : "New Test Group Added",
											delay : 1000
										});

										$scope.recordChanged();

									} ],

							[
									'Add new testcase',
									function($itemScope) {
										if (!$itemScope.$nodeScope.$modelValue.children) {
											$itemScope.$nodeScope.$modelValue.children = [];
										}
										$itemScope.$nodeScope.$modelValue.children
												.push({
													id : new ObjectId()
															.toString(),
													type : "testcase",
													name : "newTestCase",
													teststeps : [],
													position : $itemScope.$nodeScope.$modelValue.children.length + 1
												});
										Notification
												.success("New Test Case Added");

										$scope.activeModel = $itemScope.$nodeScope.$modelValue.children[$itemScope.$nodeScope.$modelValue.children.length - 1];
										$scope.recordChanged();
									} ] ];

					$scope.testGroupOptions = [
							[
									'add new testCase',
									function($itemScope) {

										$itemScope.$nodeScope.$modelValue.testcases
												.push({
													id : new ObjectId()
															.toString(),
													type : "testcase",
													name : "testCaseAdded",
													position : $itemScope.$nodeScope.$modelValue.testcases.length + 1,
													teststeps : []

												});
										$scope.activeModel = $itemScope.$nodeScope.$modelValue.testcases[$itemScope.$nodeScope.$modelValue.testcases.length - 1];
										Notification
												.success("New Test Case Added");
										$scope.recordChanged();
									} ],
							null,
							[
									'clone',
									function($itemScope) {
										var clone = $scope
												.cloneTestCaseGroup($itemScope.$nodeScope.$modelValue);

										var name = $itemScope.$nodeScope.$modelValue.name;
										var model = $itemScope.$nodeScope.$modelValue;
										clone.position = $itemScope.$nodeScope.$parent.$modelValue.length + 1;
										$itemScope.$nodeScope.$parent.$modelValue
												.push(clone);
										$scope.activeModel = clone;

									} ],
							null,
							[
									'delete',
									function($itemScope) {
										$itemScope.$nodeScope.remove();
										Notification.success("Test Group "
												+ $itemScope.$modelValue.name
												+ " Deleted");
										$scope
												.updatePositions($itemScope.$nodeScope.$parentNodesScope.$modelValue)
									} ]

					];

					$scope.testCaseOptions = [
							[
									'add new teststep',
									function($itemScope) {

										if (!$itemScope.$nodeScope.$modelValue.teststeps) {
											$itemScope.$nodeScope.$modelValue.teststeps = [];
										}

										var newTestStep = {
											id : new ObjectId().toString(),
											type : "teststep",
											name : "newteststep",
											position : $itemScope.$nodeScope.$modelValue.teststeps.length + 1,
											testStepStory : {}
										};
										console.log(newTestStep);

										newTestStep.testStepStory.comments = "No Comments";
										newTestStep.testStepStory.evaluationCriteria = "No evaluation criteria";
										newTestStep.testStepStory.notes = "No Note";
										newTestStep.testStepStory.postCondition = "No PostCondition";
										newTestStep.testStepStory.preCondition = "No PreCondition";
										newTestStep.testStepStory.testObjectives = "No Objectives";
										newTestStep.testStepStory.teststorydesc = "No Description";
										console
												.log($itemScope.$nodeScope.$modelValue.teststeps);
										newTestStep.conformanceProfileId = null;
										newTestStep.integrationProfileId = null;
										$rootScope.selectedTestStep = newTestStep;
										$scope.selectTestStep(newTestStep);
										$scope.activeModel = newTestStep;
										$itemScope.$nodeScope.$modelValue.teststeps
												.push(newTestStep);
										console
												.log($itemScope.$nodeScope.$modelValue.teststeps);
										Notification
												.success("New Test Step Added");

										$scope.recordChanged();

									} ],
							null,
							[
									'clone',
									function($itemScope) {

										var clone = $scope
												.cloneTestCase($itemScope.$nodeScope.$modelValue);
										clone.position = $itemScope.$nodeScope.$parent.$modelValue.length + 1;
										$itemScope.$nodeScope.$parent.$modelValue
												.push(clone);
										$scope.activeModel = clone;
										Notification.success("Test Case "
												+ $itemScope.$modelValue.name
												+ " Cloned");

									} ],
							null,
							[
									'delete',
									function($itemScope) {
										$itemScope.$nodeScope.remove();
										$scope
												.updatePositions($itemScope.$nodeScope.$parentNodesScope.$modelValue)
										Notification.success("Test Case "
												+ $itemScope.$modelValue.name
												+ " Deleted");

									} ]

					];

					$scope.testStepOptions = [

							[
									'clone',
									function($itemScope) {
										// var cloneModel= {};
										// var name =
										// $itemScope.$nodeScope.$modelValue.name;
										// name=name+"(copy)";
										// cloneModel.name=name;
										var clone = $scope
												.cloneTestStep($itemScope.$nodeScope.$modelValue);
										clone.position = $itemScope.$nodeScope.$parentNodesScope.$modelValue.length + 1
										$scope.activeModel = clone;
										// cloneModel.position=$itemScope.$nodeScope.$parentNodesScope.$modelValue.length+1
										$itemScope.$nodeScope.$parentNodesScope.$modelValue
												.push(clone);
										Notification.success("Test Step "
												+ $itemScope.$modelValue.name
												+ " Cloned");

										// $scope.activeModel=$itemScope.$nodeScope.$parentNodesScope.$modelValue[$itemScope.$nodeScope.$parentNodesScope.$modelValue.length-1];

									} ],
							null,
							[
									'delete',
									function($itemScope) {
										$itemScope.$nodeScope.remove();
										$scope
												.updatePositions($itemScope.$nodeScope.$parentNodesScope.$modelValue);
										Notification.success("Test Step "
												+ $itemScope.$modelValue.name
												+ " Deleted");

									} ]

					];

					$scope.MessageOptions = [

							[
									'Delete Template',
									function($itemScope) {
										$scope.subview = null;
										$scope
												.deleteMessageTemplate($itemScope.msgTmp);
										Notification.success("Template "
												+ $itemScope.$modelValue.name
												+ " Deleted");

									} ],
							null,
							[
									'Apply',
									function($itemScope) {
										$scope
												.applyMessageTemplate($itemScope.msgTmp);
										Notification.success("Template "
												+ $itemScope.$modelValue.name
												+ " Applied");

									} ],
							null,
							[
									'Overwrite',
									function($itemScope) {
										$scope
												.overwriteMessageTemplate($itemScope.msgTmp);
										Notification.success("Template "
												+ $itemScope.$modelValue.name
												+ " Applied");

									} ]

					];

					$scope.SegmentOptions = [

							[
									'Delete Template',
									function($itemScope) {

										$scope.subview = null;
										$scope
												.deleteSegmentTemplate($itemScope.segTmp);
										Notification.success("Template "
												+ $itemScope.$modelValue.name
												+ " Deleted");

									} ],
							null,
							[
									'Apply Template',
									function($itemScope) {

										$scope
												.applySegmentTemplate($itemScope.segTmp);
										Notification.success("Template"
												+ $itemScope.$modelValue.name
												+ " Applied");

									} ],
							null,
							[
									'Overwrite Template',
									function($itemScope) {

										$scope
												.overwriteSegmentTemplate($itemScope.segTmp);
										Notification.success("Template "
												+ $itemScope.$modelValue.name
												+ "Applied");

									} ]

					];

					$scope.Er7Options = [

							[
									'Delete Template',
									function($itemScope) {
										$scope.subview = null;
										$scope
												.deleteER7Template($itemScope.er7Tmp);
										Notification.success("Template "
												+ $itemScope.$modelValue.name
												+ "Deleted");

									} ],
							null,
							[
									'Overwrite Template',
									function($itemScope) {
										$scope
												.overwriteER7Template($itemScope.er7Tmp);
										Notification.success("Template "
												+ $itemScope.$modelValue.name
												+ "Applied");

									} ]

					];

					$scope.ApplyProfile = [

					[
							'Apply Profile',
							function($itemScope) {
								$scope.applyConformanceProfile(
										$itemScope.ig.id, $itemScope.msg.id);
							} ]

					];

					$scope.messagetempCollapsed = false;
					$scope.segmenttempCollapsed = false;
					$scope.Er7Collapsed = false;

					$scope.switchermsg = function(bool) {
						$scope.messagetempCollapsed = !$scope.messagetempCollapsed;
					};

					$scope.switcherseg = function(bool) {
						$scope.segmenttempCollapsed = !$scope.segmenttempCollapsed;
					};

					$scope.switcherIg = function(bool) {
						$scope.segmenttempCollapsed = !$scope.segmenttempCollapsed;
					};
					$scope.switcherEr7 = function(bool) {
						$scope.Er7Collapsed = !$scope.Er7Collapsed;
					};
					$scope.ChildVisible = function(ig) {
						if ($rootScope.selectedTestStep === null
								|| ig.id === $rootScope.selectedTestStep.integrationProfileId) {
							return true;
						} else if ($rootScope.selectedTestStep === null) {
							return true;
						}

					}
					$scope.OpenMsgTemplateMetadata = function(msgtemp) {
						$rootScope.selectedTemplate = msgtemp;
						$rootScope.selectedSegmentNode = null;

						$scope.msgTemplate = msgtemp;

						$scope.subview = "MessageTemplateMetadata.html";
					}
					$scope.OpenTemplateMetadata = function(temp) {
						$rootScope.selectedTemplate = null;
						$rootScope.selectedSegmentNode = null;

						$scope.rootTemplate = temp;
						$scope.subview = "TemplateMetadata.html";
					}
					$scope.OpenSegmentTemplateMetadata = function(segTemp) {
						$rootScope.selectedTemplate = segTemp; // never used
						$rootScope.selectedSegmentNode = null;
						$scope.segmentTemplateObject = segTemp;
						$scope.subview = "SegmentTemplateMetadata.html";
					}

					$scope.OpenEr7TemplatesMetadata = function(er7temp) {
						$rootScope.selectedTemplate = er7temp;
						$rootScope.selectedSegmentNode = null;
						$scope.er7Template = er7temp;
						$scope.subview = "Er7TemplateMetadata.html";
					}

					$scope.cloneTestStep = function(testStep) {
						var clone = angular.copy(testStep);
						clone.name = testStep.name + "_copy";
						clone.id = new ObjectId().toString();
						console.log(clone);
						return clone;
					}
					$scope.cloneTestCase = function(testCase) {
						var clone = angular.copy(testCase);
						clone.name = testCase.name + "_copy";
						clone.id = new ObjectId().toString();
						clone.teststeps = [];
						if (testCase.teststeps.length > 0) {
							angular.forEach(testCase.teststeps, function(
									teststep) {
								clone.teststeps.push($scope
										.cloneTestStep(teststep));

							});

						}
						return clone;
					};

					$scope.cloneTestCaseGroup = function(testCaseGroup) {
						var clone = angular.copy(testCaseGroup);
						clone.name = testCaseGroup.name + "_copy";
						clone.id = new ObjectId().toString();
						clone.testcases = [];
						if (testCaseGroup.testcases.length > 0) {
							angular.forEach(testCaseGroup.testcases, function(
									testcase) {
								clone.testcases.push($scope
										.cloneTestCase(testcase));

							});
						}
						Notification.success("Test Group " + testCaseGroup.name
								+ " Clonned");
						return clone;
					};

				});

angular.module('tcl').controller(
		'ConfirmTestPlanDeleteCtrl',
		function($scope, $modalInstance, testplanToDelete, $rootScope, $http) {
			$scope.testplanToDelete = testplanToDelete;
			$scope.loading = false;
			$scope.deleteTestPlan = function() {
				$scope.loading = true;
				$http.post(
						$rootScope.api('api/testplans/'
								+ $scope.testplanToDelete.id + '/delete'))
						.then(function(response) {
							$rootScope.msg().text = "testplanDeleteSuccess";
							$rootScope.msg().type = "success";
							$rootScope.msg().show = true;
							$rootScope.manualHandle = true;
							$scope.loading = false;
							$modalInstance.close($scope.testplanToDelete);
						}, function(error) {
							$scope.error = error;
							$scope.loading = false;
							$modalInstance.dismiss('cancel');
							$rootScope.msg().text = "testplanDeleteFailed";
							$rootScope.msg().type = "danger";
							$rootScope.msg().show = true;
						});
			};

			$scope.cancel = function() {
				$modalInstance.dismiss('cancel');
			};
		});

angular
		.module('tcl')
		.controller(
				'MessageTemplateCreationModalCtrl',
				function($scope, $modalInstance, $rootScope) {

					var keys = $
							.map(
									$rootScope.selectedTestStep.testDataCategorizationMap,
									function(v, i) {
										return i;
									});
					$scope.newMessageTemplate = {};
					$scope.newMessageTemplate.id = new ObjectId().toString();
					$scope.newMessageTemplate.name = 'new Template for '
							+ $rootScope.selectedConformanceProfile.name;
					$scope.newMessageTemplate.descrption = 'No Desc';
					$scope.newMessageTemplate.date = new Date();
					$scope.newMessageTemplate.integrationProfileId = $rootScope.selectedIntegrationProfile.id;
					$scope.newMessageTemplate.conformanceProfileId = $rootScope.selectedConformanceProfile.id;

					$scope.newMessageTemplate.categorizations = [];
					keys
							.forEach(function(key) {
								var testDataCategorizationObj = $rootScope.selectedTestStep.testDataCategorizationMap[key];

								if (testDataCategorizationObj != undefined
										&& testDataCategorizationObj != null) {
									if (testDataCategorizationObj.testDataCategorization
											&& testDataCategorizationObj.testDataCategorization !== '') {
										var cate = {};
										cate.iPath = testDataCategorizationObj.iPath;
										cate.name = testDataCategorizationObj.name;
										cate.testDataCategorization = testDataCategorizationObj.testDataCategorization;
										cate.listData = testDataCategorizationObj.listData;
										$scope.newMessageTemplate.categorizations
												.push(cate);
									}
								}
							});

					$scope.createMessageTemplate = function() {
						$rootScope.template.messageTemplates
								.push($scope.newMessageTemplate);
						$modalInstance.close();

					};

					$scope.cancel = function() {
						$modalInstance.dismiss('cancel');
					};
				});

angular
		.module('tcl')
		.controller(
				'SegmentTemplateCreationModalCtrl',
				function($scope, $modalInstance, $rootScope) {

					var keys = $
							.map(
									$rootScope.selectedTestStep.testDataCategorizationMap,
									function(v, i) {
										if (i
												.includes($rootScope.selectedSegmentNode.segment.iPath
														.split('.').join('-')))
											return i;
									});
					$scope.newSegmentTemplate = {};
					$scope.newSegmentTemplate.id = new ObjectId().toString();
					$scope.newSegmentTemplate.name = 'new Template for '
							+ $rootScope.selectedSegmentNode.segment.obj.name;
					$scope.newSegmentTemplate.descrption = 'No Desc';
					$scope.newSegmentTemplate.segmentName = $rootScope.selectedSegmentNode.segment.obj.name;
					$scope.newSegmentTemplate.date = new Date();
					$scope.newSegmentTemplate.categorizations = [];
					keys
							.forEach(function(key) {
								var testDataCategorizationObj = $rootScope.selectedTestStep.testDataCategorizationMap[key];

								if (testDataCategorizationObj != undefined
										&& testDataCategorizationObj != null) {
									var cate = {};
									cate.iPath = testDataCategorizationObj.iPath
											.replace(
													$rootScope.selectedSegmentNode.segment.iPath,
													'');
									cate.name = testDataCategorizationObj.name;
									cate.testDataCategorization = testDataCategorizationObj.testDataCategorization;
									cate.listData = testDataCategorizationObj.listData;
									$scope.newSegmentTemplate.categorizations
											.push(cate);
								}
							});

					$scope.createSegmentTemplate = function() {
						$rootScope.template.segmentTemplates
								.push($scope.newSegmentTemplate);
						$modalInstance.close();

					};

					$scope.cancel = function() {
						$modalInstance.dismiss('cancel');
					};
				});

angular
		.module('tcl')
		.controller(
				'Er7TemplateCreationModalCtrl',
				function($scope, $modalInstance, $rootScope) {
					$scope.newEr7Template = {};
					$scope.newEr7Template.id = new ObjectId().toString();
					$scope.newEr7Template.name = 'new Er7 Template for '
							+ $rootScope.selectedConformanceProfile.name;
					$scope.newEr7Template.descrption = 'No Desc';
					$scope.newEr7Template.date = new Date();
					$scope.newEr7Template.integrationProfileId = $rootScope.selectedIntegrationProfile.id;
					$scope.newEr7Template.conformanceProfileId = $rootScope.selectedConformanceProfile.id;
					$scope.newEr7Template.er7Message = $rootScope.selectedTestStep.er7Message;

					$scope.createEr7Template = function() {
						$rootScope.template.er7Templates
								.push($scope.newEr7Template);
						$modalInstance.close();

					};

					$scope.cancel = function() {
						$modalInstance.dismiss('cancel');
					};
				});

angular.module('tcl').controller(
		'MessageViewCtrl',
		function($scope, $rootScope) {
			$scope.loading = false;
			$scope.msg = null;
			$scope.messageData = [];
			$scope.setData = function(node) {
				if (node) {
					if (node.type === 'message') {
						angular.forEach(node.children, function(
								segmentRefOrGroup) {
							$scope.setData(segmentRefOrGroup);
						});
					} else if (node.type === 'group') {
						$scope.messageData.push({
							name : "-- " + node.name + " begin"
						});
						if (node.children) {
							angular.forEach(node.children, function(
									segmentRefOrGroup) {
								$scope.setData(segmentRefOrGroup);
							});
						}
						$scope.messageData.push({
							name : "-- " + node.name + " end"
						});
					} else if (node.type === 'segment') {
						$scope.messageData.push + (node);
					}
				}
			};

			$scope.init = function(message) {
				$scope.loading = true;
				$scope.msg = message;
				console.log(message.id);
				$scope.setData($scope.msg);
				$scope.loading = false;
			};

		});
