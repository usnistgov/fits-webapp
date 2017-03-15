/**
 * Created by Jungyub on 5/12/16
 */

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

angular.module('tcl').filter('groupEvents', function() {
    return _.memoize(function(items) {
        if (!items || !items.length) {
            return;
        }
        return _.groupBy(items, function (item) {
            return item.vaccination.administred ? item.vaccination.administred.name : "new";
        });
    },
        function(items){
            if (!items || !items.length) { return "x"; }
            return angular.toJson(items);
        }
	)
});

angular.module('tcl').filter('groupBy', function($parse) {
    return _.memoize(function(items, field) {
        if (!items || !items.length) { return; }
        var getter = $parse(field);
        return _.groupBy(items, function(item) {
            var g = getter(item);
            return g ? g !== '' ? g : 'Ungrouped' : 'Ungrouped';
        });
    }, function(items,field){
        if (!items || !items.length) { return "x"; }
        return items.reduce(function(acc,item){
            return acc+item.id+item.group+'-';
        });
    });
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
            return item.name.toLowerCase().includes(s) || item.uid && item.uid.toLowerCase().includes(s) || item.group && item.group.toLowerCase().includes(s);
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
				function($parse,$document, $scope, $rootScope, $templateCache,
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
					$scope.message = "";
					$scope.loadSpin = false;
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
					$scope.tpview = true;
                    $scope.groups = false;

                    $scope.dateChange = function(obj,key){
        				obj[key] = obj["_"+key].getTime();
        			};
        			
					// ------------------------------------------------------------------------------------------
					// CDSI TCAMT
					$scope.importing = false;
                    $scope.impDiag = null;
					$scope.selectedEvent = null;
					$scope.selectedForecast = null;
					$scope.selectedTP = null;
					$scope.selectedTC = null;
                    $scope.selectedTCB = null;
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
							list : [],
						}
					};
					$scope.tcBackups = {};
                    $scope.grouping = false;
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

					$scope.print = function (x) {
						console.log(x);
                    };

					$scope.valueForEnum = function(code,enumList){
						for(var i in enumList){
							if(enumList[i].code === code){
								return enumList[i].details;
							}
						}
						return "";
					};

					$scope.groupBy = _.memoize(function(items, field) {
                        if (!items || !items.length) { return; }
                        var getter = $parse(field);
                        return _.groupBy(items, function(item) {
                            var g = getter(item);
                            return g ? g !== '' ? g : 'Ungrouped' : 'Ungrouped';
                        });
                    }, function(items,field){
                        if (!items || !items.length) { return "x"; }
                        return angular.toJson(items);
                        // return items.reduce(function(acc,item){
                        //     return acc+item.id+item.group+'-';
                        // });
                    });

                    $scope.dateTypeChange = function (tc) {
                        $scope.exit = $modal.open({
                            templateUrl : 'DTChange.html',
                            controller : 'DateCtrl'
                        });

                        $scope.exit.result.then(function (response) {

                        	tc.dateType = tc._dateType;
                        	if(tc.dateType === 'FIXED'){
                        		tc.evalDate = TestObjectFactory.createFD();
                                tc.patient.dob = TestObjectFactory.createFD();
                        		for(var i = 0; i < $scope.selectedTC.events.length; i ++){
                        			var ev = $scope.selectedTC.events[i];
                        			if(ev[ev._type].date){
                                        ev[ev._type].date = TestObjectFactory.createFD();
									}
								}
                                for(var j = 0; j < $scope.selectedTC.forecast.length; j++){
                                    var fc = $scope.selectedTC.forecast[i];
                                    if(fc.earliest){
                                        fc.earliest = TestObjectFactory.createFD();
                                    }
                                    if(fc.recommended){
                                        fc.recommended = TestObjectFactory.createFD();
                                    }
                                    if(fc.pastDue){
                                        fc.pastDue = TestObjectFactory.createFD();
                                    }
                                    if(fc.complete){
                                        fc.complete = TestObjectFactory.createFD();
                                    }
                                }
							}
							else if(tc.dateType === 'RELATIVE'){
                                tc.evalDate = TestObjectFactory.createREVD();
                                tc.patient.dob = TestObjectFactory.createRDOB();
                                for(var i = 0; i < $scope.selectedTC.events.length; i ++){
                                    var ev = $scope.selectedTC.events[i];
                                    if(ev[ev._type].date){
                                        ev[ev._type].date = TestObjectFactory.createRD();
                                    }
                                }
                                for(var j = 0; j < $scope.selectedTC.forecast.length; j++){
                                    var fc = $scope.selectedTC.forecast[i];
                                    if(fc.earliest){
                                        fc.earliest = TestObjectFactory.createRD();
                                    }
                                    if(fc.recommended){
                                        fc.recommended = TestObjectFactory.createRD();
                                    }
                                    if(fc.pastDue){
                                        fc.pastDue = TestObjectFactory.createRD();
                                    }
                                    if(fc.complete){
                                        fc.complete = TestObjectFactory.createRD();
                                    }
                                }
							}

                        }, function () {

							tc._dateType = tc.dateType;

                        });
                    };

					$scope.eventLabel = function(event){
						if(event.vaccination.date){
							if(event.vaccination.date.type && event.vaccination.date.type === "fixed"){
								if(event.vaccination.date.date){
                                    return $filter('date')(event.vaccination.date.date, "MM/dd/yyyy");
								}
								else {
									return 'Fixed Date';
								}

							}
							else {
								if(event.vaccination.date.type && event.vaccination.date.rules && event.vaccination.date.rules.length > 0){
									var rule = event.vaccination.date.rules[0];
									if(rule.relativeTo){
										if(rule.relativeTo.reference && rule.relativeTo.reference === "static" && rule.relativeTo.hasOwnProperty('id')){
											return "Relative to "+(rule.relativeTo.type === 'DOB' ? 'Birth' : 'Assessment Date');
										}
										else if(rule.relativeTo.reference && rule.relativeTo.reference === "dynamic" && rule.relativeTo.hasOwnProperty('id')){
                                            return "Relative to vaccination # "+ rule.relativeTo.id;
										}
									}
								}
							}
								return "Relative Date";
						}
					};

                    $scope.eventID = function(list,event){
                        return list.indexOf(event);
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
							for(var k in data){
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

                            $scope.grouping = true;
							$scope.selectedTP = tp;
							$scope.selectedType = "tp";

							// View
							$scope.selectTPTab(1);
							$scope.subview = "EditTestPlanData.html";
							waitingDialog.hide();
						}, 0);
					};

                    $scope.hasChanges = function(tc)  {
                    	if(tc)
							return TestObjectUtil.hashChanged(tc);
                    	else
                    		return false;
					};

                    $scope.changes = function(tp)  {
                    	if(!tp || !tp.testCases)
                    		return false;

                        for(var tc in tp.testCases){
                        	if(tp.testCases[tc]._changed){
                        		return true;
							}
						}
						return false;
                    };

                    $scope.$watch('selectedTC',function (newValue, oldValue) {
                    	console.log("W");
                        if(newValue && newValue._jsave){
                            console.log("Just Saved");
                            var i = TestObjectUtil.index($scope.selectedTP.testCases,"id",newValue.id);
                            if(~i){
                                console.log(i);
                                var tc = $scope.selectedTP.testCases[i];
                                delete tc._jsave;
                                TestObjectUtil.updateHash(tc);
                            }
						}
						else {
                        	if(!newValue && TestObjectUtil.index($scope.selectedTP.testCases,"id",oldValue.id) === -1){

							}
                            else if(oldValue !== null && (!newValue || oldValue.id !== newValue.id)){
                                var i = TestObjectUtil.index($scope.selectedTP.testCases,"id",oldValue.id);
                                console.log("Changing TC");
                                if(~i){
                                    console.log(i);
                                    var tc = $scope.selectedTP.testCases[i];

                                    if(TestObjectUtil.hashChanged(tc)){
                                        console.log("UNSAVED CHANGED");
                                        tc._changed = true;

                                        $scope.exit = $modal.open({
                                            templateUrl : 'ExitTC.html',
                                            controller : 'ExitCtrl'
                                        });

                                        $scope.exit.result.then(function (response) {
                                            if(response){
                                                var id = tc.id;
                                                if(response.action === "save"){
                                                    console.log("Should Save");
                                                    $scope.saveAllChangedTestPlans(tc,$scope.selectedTP)
                                                }
                                                else if(response.action === "discard"){
                                                    console.log("Discarding");
                                                    $scope.selectedTP.testCases.splice(i,1,$scope.tcBackups[id]);
                                                    $scope.groupBy.cache = new _.memoize.Cache;
                                                }
                                            }
                                        }, function () {
                                            console.log("Save Later");
                                        });
                                    }
                                    else {
                                        tc._changed = false;
                                    }
                                }

                            }
						}
                    });

					$scope.selectTC = function(tc) {
						waitingDialog.show('Opening Test Case', {
							dialogSize : 'xs',
							progressType : 'info'
						});
						if(!tc._changed){
							$scope.tcBackups[tc.id] = angular.copy(tc);
						}
						$timeout(function() {
							// Selection
							$scope.selectedEvent = null;
							$scope.selectedForecast = null;
							$scope.selectedTC = tc;
                            $scope.selectedTCB = TestObjectUtil.clone(tc);
							$scope.selectedTG = null;
							$scope.selectedType = "tc";

							// View
							$scope.subview = "EditTestPlanMetadata.html";
							waitingDialog.hide();
						}, 0);
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

					$scope.isSelectedTC = function(t) {
						return $scope.selectedTC && t.id === $scope.selectedTC.id;
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
						var event = TestObjectFactory.createEvent($scope.selectedTC.events.length,$scope.selectedTC.dateType);
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
						list.push(TestObjectFactory.createEvaluation());
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
					       function($itemScope) {
                               	var ev = $itemScope.ev;
                               	var index = ev[ev._type].id;

                               	if($scope.selectedTC.dateType === 'RELATIVE'){
                                    for(var evt in $scope.selectedTC.events){
										var v = $scope.selectedTC.events[evt];
										if(v && v.vaccination && v.vaccination.date){
											console.log("HERE");
											for(var r = 0; r < v.vaccination.date.rules.length; r++){
                                                console.log("r");
												var rule = 	v.vaccination.date.rules[r];
                                                console.log(rule);
                                                console.log(index);
                                                console.log(rule.relativeTo.id === index);
												if(rule && rule.relativeTo && rule.relativeTo.reference && rule.relativeTo.reference === 'dynamic' && rule.relativeTo.id+'' === index+'' ){
													console.log("ENTER");
                                                    v.vaccination.date.rules.splice(r,1);
												}
											}
										}
                                    }
								}
							   	$scope.selectedTC.events.splice(index, 1);
					    		$scope.selectTC($scope.selectedTC);
					    } ] ];

					$scope.forecastCM = [
					        [ 'Delete Forecast',
					          function(modelValue) {
								$scope.selectedTC.forecast.splice(modelValue.$index, 1);
								$scope.selectTC($scope.selectedTC);
								$scope.groupBy.cache = new _.memoize.Cache;
							} ] ];

					$scope.tpCM = [
					        [ 'Add Test Case',
					          function(modelValue) {
					        	var tc = TestObjectFactory.createTC();
					        	$scope.selectedTP.testCases.push(tc);
//					        	$scope.selectedTPg.testCases.push(tc);
					        	$scope.selectTC(tc);
					        	$scope.groupBy.cache = new _.memoize.Cache;
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
					            function($itemScope, $event, modelValue, text, $li) {
					        	 console.log("ST");
					        	 var tc = $itemScope.$nodeScope.$modelValue;
					        	 var index = $scope.selectedTP.testCases.indexOf($itemScope.$nodeScope.$modelValue);
					        	 if(TestObjectUtil.isLocal(tc)){
					        		 $scope.selectedTP.testCases.splice(index, 1);
					        		 $scope.selectTP($scope.selectedTP);
                                     $scope.groupBy.cache = new _.memoize.Cache;
					        	 }
					        	 else {
					        		 $http.post('api/testcase/'+ tc.id +'/delete')
					        		 .then(function(r) {
					        			 $scope.selectedTP.testCases.splice(index,1);
					        			 $scope.selectTP($scope.selectedTP);
					        			 $scope.groupBy.cache = new _.memoize.Cache;
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


                    $scope.$watch('importing', function (newValue) {
                        if(newValue === false){
                        	if($scope.impDiag)
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
                                                        TestObjectUtil.updateHash(data.testCases[i]);
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

					// --------------------------------------------------------------------------------------------------------

					$scope.initTestCases = function() {
						if(userInfoService.isAuthenticated()){
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
						}
					};

                    $rootScope.$on('event:loginConfirmed', function () {
                        $scope.initTestCases();
                    });


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

					$scope.selectTPTab = function(value) {
						if (value === 1) {
							$scope.accordi.tpList = false;
							$scope.accordi.tpDetails = true;
						} else {
							$scope.accordi.tpList = true;
							$scope.accordi.tpDetails = false;
						}
					};

					$scope.dismissError = function (i) {
                        $scope.control.error.list.splice(i,1);
                    };

					$scope.saveAllChangedTestPlans = function(stc,stp) {
						$scope.message = "Saving ...";
						console.log(stc);
                        console.log(stp);
						$scope.loading = true;
						$scope.control.error.isSet = false;
						$scope.control.error.obj = [];

						if (!stc && stp) {
                            TestObjectSynchronize.syncTP(stp).then(
                                function (result) {
                                    result.tp.testCases = stp.testCases;
                                    angular.copy(result.tp,stp);
                                    Notification.success({
                                        message : result.message,
                                        delay : 1000
                                    });
            						$scope.loading = false;
            						$scope.groupBy.cache = new _.memoize.Cache;
                                },
                                function (result) {
                                    if(result.response.hasOwnProperty("errors")){
                                        $scope.control.error.isSet = true;
                                        $scope.control.error.tc = stp;
                                        $scope.control.error.list = result.response.errors;
                                    }
                                    Notification.error({
                                        message : result.message,
                                        delay : 1000
                                    });
                                    $scope.loading = false;
                                }
                            );

						}
						else if (stc) {
							console.log("Saving");
                            TestObjectSynchronize.syncTC(stp.id, stc).then(
                            	function (result) {
									TestObjectUtil.synchronize(stc.id,stp.testCases,result.tc);
                                    result.tc._jsave = true;
									stc = result.tc;
                                    TestObjectUtil.updateHash(stc);
                                    $scope.groupBy.cache = new _.memoize.Cache;
									Notification.success({
										message : result.message,
										delay : 1000
									});
									$scope.loading = false;
                                },
                                function (result) {
                            		if(result.response && result.response.hasOwnProperty("errors")){
                                        $scope.control.error.isSet = true;
                                        $scope.control.error.tc = stc;
                                        $scope.control.error.list = result.response.errors;
									}
                                    Notification.error({
                                        message : result.message,
                                        delay : 1000
                                    });
                                    $scope.loading = false;
                                }
							);
						}
					};
				}
		);

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


angular.module('tcl').controller('ExitCtrl',
    function($scope, $uibModalInstance) {
        $scope.discardChanges = function () {
            $uibModalInstance.close({action : 'discard'});
        };

        $scope.saveChanges = function () {
            $uibModalInstance.close({action : 'save'});
        };

        $scope.dismiss = function() {
            $uibModalInstance.dismiss('cancel');
        };
    });

angular.module('tcl').controller('DateCtrl',
    function($scope, $uibModalInstance) {
        $scope.continue = function () {
            $uibModalInstance.close({action : 'continue'});
        };

        $scope.abort = function () {
            $uibModalInstance.dismiss('cancel');
        };

        $scope.dismiss = function() {
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
