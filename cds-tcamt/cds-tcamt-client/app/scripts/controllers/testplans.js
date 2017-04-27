/**
 * Created by Jungyub on 5/12/16
 */

angular.module('tcl').filter('vaccine', function () {
    return function (items, str) {
        if (!items || !items.length) {
            return;
        }
        if (!str || str === "") return items;
        return items.filter(function (item) {
            var s = str.toLowerCase();
            return item.vx.name.toLowerCase().includes(s) || item.vx.cvx.includes(s);
        });
    };
});

angular.module('tcl').filter('tcFilter', function ($filter) {
    return function (items, flt) {
        if (!items || !items.length) {
            return;
        }

        var filterActive = function (f) {
            return   f.incomplete !== false || f.changed !== false || f.example.name !== '' || f.example.uid !== '' || f.example.metaData.version !== '' || f.dates.created.date !== null || f.dates.updated.date !== null;
        };
        if (!filterActive(flt)) return items;
        return $filter('dateMD')($filter('dateMD')($filter('incomplete')($filter('changed')($filter('filter')(items,flt.example),flt.changed),flt.incomplete),flt.dates.created,'dateCreated'),flt.dates.updated,'dateLastUpdated');
    };
});

angular.module('tcl').filter('incomplete', function () {
    return function (items, bool) {
        if (!items || !items.length) {
            return;
        }
        if (!bool) return items;
        return items.filter(function (item) {
            if(!item.runnable)
                return true;
        });
    };
});

angular.module('tcl').filter('changed', function () {
    return function (items, bool) {
        if (!items || !items.length) {
            return;
        }
        if (!bool) return items;
        return items.filter(function (item) {
            if(item._changed)
                return true;
        });
    };
});

angular.module('tcl').filter('dateMD', function () {
    return function (items, dateF, criterion) {
        Date.prototype.withoutTime = function () {
            var d = new Date(this);
            d.setHours(0, 0, 0, 0);
            return d;
        };

        if (!items || !items.length ) {
            return;
        }
        if(dateF.date === null || !(dateF.position === 'O' || dateF.position === 'A' || dateF.position === 'B')){
            return items;
        }
        //console.log(dateF);
        var dtTM = dateF.date.withoutTime().getTime();
        return items.filter(function (item) {
            // console.log((dateF.position === 'O' && item.metaData[criterion].getTime() === dateF.date.getTime())
            //     || (dateF.position === 'A' && item.metaData[criterion].getTime() > dateF.date.getTime())
            //     || (dateF.position === 'B' && item.metaData[criterion].getTime() < dateF.date.getTime()));
            //console.log(item.metaData[criterion]);
            var tcTM = item.metaData["_"+criterion].withoutTime().getTime();

            return (dateF.position === 'O' && tcTM === dtTM)
            || (dateF.position === 'A' && tcTM > dtTM)
                || (dateF.position === 'B' && tcTM < dtTM);
        });
    };
});


angular.module('tcl').filter('vaccineEpt', function () {
    return function (items, str) {
        if (!items || !items.length) {
            return;
        }
        if (!str || str === "") return [];
        return items.filter(function (item) {
            var s = str.toLowerCase();
            return item.vx.name.toLowerCase().includes(s) || item.vx.cvx.includes(s);
        });
    };
});

angular.module('tcl').filter('product', function () {
    return function (items, str) {
        if (!items || !items.length) {
            return;
        }
        if (!str || str === "") return items;
        return items.filter(function (item) {
            var s = str.toLowerCase();
            return item.name.toLowerCase().includes(s) || item.mx.mvx.toLowerCase().includes(s) || item.mx.name.toLowerCase().includes(s);
        });
    };
});

angular.module('tcl').filter('productEpt', function () {
    return function (items, str) {
        if (!items || !items.length) {
            return;
        }
        if (!str || str === "") return [];
        return items.filter(function (item) {
            var s = str.toLowerCase();
            return item.name.toLowerCase().includes(s) || item.mx.mvx.toLowerCase().includes(s);
        });
    };
});

angular.module('tcl').filter('unspecified', function () {
    return function (items, usp) {
        if (!items || !items.length) {
            return;
        }
        if (!usp) return items;
        return items.filter(function (item) {
            return item.group;
        });
    };
});

angular.module('tcl').filter('testcase', function () {
    return function (items, str) {
        if (!items || !items.length) {
            return;
        }
        if (!str || str === "") return items;
        return items.filter(function (item) {
            var s = str.toLowerCase();
            return item.name.toLowerCase().includes(s) || item.uid && item.uid.toLowerCase().includes(s) || item.group && item.group.toLowerCase().includes(s);
        });
    };
});

angular.module('tcl').filter('vxgroup', function () {

    return function (items, groups) {
        if (!items || !items.length) {
            return;
        }
        if (!groups || groups.length === 0) return items;
        var filter = function (item) {

            var hasGroup = function (mp, gr) {
                if (mp.groups && mp.groups.length !== 0) {
                    var found = false;
                    for (var mG in mp.groups) {
                        if (mp.groups[mG].cvx === gr.cvx) {
                            found = true;
                            break;
                        }
                    }
                    return found;
                }
                return false;
            };
            for (var x in groups) {
                if (!hasGroup(item, groups[x])) {
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
        function ($parse, $document, $scope, $rootScope, $templateCache,
                  Restangular, $http, $filter, $modal, $cookies, $anchorScroll, $location,
                  $timeout, userInfoService, ngTreetableParams,DataSynchService,PopUp,
                  $interval, ViewSettings, StorageService, $q,
                  notifications, IgDocumentService, ElementUtils,
                  AutoSaveService, $sce, Notification, TestObjectUtil, TestObjectFactory, VaccineService, TestObjectSynchronize, TestDataService, FITSBackEnd, EntityService, EntityUtilsService) {
            $scope.vxm = [];
            $scope.loading = false;
            $scope.entityUtils = EntityUtilsService;
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
                metaData: false,
                definition: true,
                tpList: true,
                tpDetails: false
            };
            $scope.FITS_SERVER = FITSBackEnd;
            $scope.testCases = [];
            $scope.filterView = false;
            $scope.patientSelected = false;
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
                ignore: false,
                from: 1,
                to: 1000,
                all: true
            };
            $scope.autoSave = {
                active : true,
                lastSave : new Date(),
                saving : true
            };
            $scope.tpview = true;
            $scope.groups = false;
            $scope.remember = {
                bool: false,
                choice: ""
            };
            $scope.dateChange = function (obj, key) {
                obj[key] = obj["_" + key].getTime();
            };


            $scope.dateChangeX = function (dateObj) {
                dateObj.date = dateObj._dateObj.getTime();
            };

            // ------------------------------------------------------------------------------------------
            // CDSI TCAMT
            DataSynchService.clear();
            $scope.importing = false;
            $scope.excludeTP = new RegExp("(testCases|testCaseGroups)");
            $scope.impDiag = null;
            $scope.errorDiag = null;
            $scope.selectedEvent = null;
            $scope.selectedForecast = null;
            $scope.selectedTP = null;
            $scope.selectedTC = null;
            $scope.selectedTCB = null;
            $scope.selectedTG = null;
            $scope.tps = [];
            $scope.hasIncomplete = false;
            $scope.tpTree = [];
            $scope.evalStatus = [];
            $scope.evalReason = [];
            $scope.serieStatus = [];
            $scope.gender = [];
            $scope.tabs = {
                selectedTabTC: 0,
                selectedTabTP: 0
            };
            $scope.tcSearch = "";
            $scope.export = {
                type: 'NIST'
            };
            $scope.control = {
                error: {
                    isSet: false,
                    tc: null,
                    list: []
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

            $scope.valueForEnum = function (code, enumList) {
                for (var i in enumList) {
                    if (enumList[i].code === code) {
                        return enumList[i].details;
                    }
                }
                return "";
            };
            //
            // $scope.autoSaveFct = function () {
            //     $timeout(function () {
            //         if($scope.selectedTP && $scope.autoSave.active){
            //             console.log("Saving");
            //             $scope.autoSave.saving = true;
            //
            //             $scope.saveTP($scope.selectedTP,true,true).then(function () {
            //                 if($scope.selectedTC && TestObjectUtil.hashChanged($scope.selectedTC)){
            //                     $scope.saveTC($scope.selectedTC,true).then(function () {
            //                         $scope.autoSave.lastSave = new Date();
            //                         $scope.autoSave.saving = false;
            //                     },function () {
            //                         $scope.autoSave.lastSave = new Date();
            //                         $scope.autoSave.saving = false;
            //                     })
            //                 }
            //                 else {
            //                     $scope.autoSave.lastSave = new Date();
            //                     $scope.autoSave.saving = false;
            //                 }
            //             },
            //             function () {
            //                 $scope.autoSave.saving = false;
            //             });
            //         }
            //         $scope.autoSaveFct();
            //     },10000);
            // };

            //---------------------------------------------------------------------------------------------------------------------------------------------------
            //-[DT]--------------------------------------------------------------- WHEN DATES TYPES CHANGE ------------------------------------------------------
            //---------------------------------------------------------------------------------------------------------------------------------------------------

            $scope.changeToFixed = function (tc) {
                tc.evalDate = TestObjectFactory.createFD();
                tc.patient.dob = TestObjectFactory.createFD();
                for (var i = 0; i < tc.events.length; i++) {
                    var ev = tc.events[i];
                    ev.date = TestObjectFactory.createFD();
                }
                for (var j = 0; j < tc.forecast.length; j++) {
                    var fc = tc.forecast[i];
                    if (fc.earliest) {
                        fc.earliest = TestObjectFactory.createFD();
                    }
                    if (fc.recommended) {
                        fc.recommended = TestObjectFactory.createFD();
                    }
                    if (fc.pastDue) {
                        fc.pastDue = TestObjectFactory.createFD();
                    }
                    if (fc.complete) {
                        fc.complete = TestObjectFactory.createFD();
                    }
                }
            };

            $scope.changeToRelative = function (tc) {
                tc.evalDate = TestObjectFactory.createREVD();
                tc.patient.dob = TestObjectFactory.createRDOB();
                for (var i = 0; i < tc.events.length; i++) {
                    var ev = tc.events[i];
                    ev.date = TestObjectFactory.createRD();
                }
                for (var j = 0; j < tc.forecast.length; j++) {
                    var fc = tc.forecast[i];
                    if (fc.earliest) {
                        fc.earliest = TestObjectFactory.createRD();
                    }
                    if (fc.recommended) {
                        fc.recommended = TestObjectFactory.createRD();
                    }
                    if (fc.pastDue) {
                        fc.pastDue = TestObjectFactory.createRD();
                    }
                    if (fc.complete) {
                        fc.complete = TestObjectFactory.createRD();
                    }
                }
            };

            $scope.dateTypeChange = function (tc) {
                $scope.dchange = $modal.open({
                    templateUrl: 'DTChange.html',
                    controller: 'DateCtrl'
                });

                $scope.dchange.result.then(function () {
                    tc.dateType = tc._dateType;
                    if (tc.dateType === 'FIXED') {
                        $scope.changeToFixed(tc);
                    }
                    else if (tc.dateType === 'RELATIVE') {
                        $scope.changeToRelative(tc);
                    }

                }, function () {
                    tc._dateType = tc.dateType;
                });
            };

            //---------------------------------------------------------------------------------------------------------------------------------------------------
            //---------------------------------------------------------------------------------------------------------------------------------------------------
            //---------------------------------------------------------------------------------------------------------------------------------------------------

            $scope.eventLabel = function (event) {
                if (event.date) {
                    if (event.date.type && event.date.type === "fixed") {
                        if (event.date.date) {
                            return $filter('date')(event.date.date, "MM/dd/yyyy");
                        }
                        else {
                            return 'Fixed Date';
                        }

                    }
                    else {
                        if (event.date.type && event.date.rules && event.date.rules.length > 0) {
                            var rule = event.date.rules[0];
                            if (rule.relativeTo) {
                                if (rule.relativeTo.reference && rule.relativeTo.reference === "static" && rule.relativeTo.hasOwnProperty('id')) {
                                    return "Relative to " + (rule.relativeTo.id === 'DOB' ? 'Birth' : 'Assessment Date');
                                }
                                else if (rule.relativeTo.reference && rule.relativeTo.reference === "dynamic" && rule.relativeTo.hasOwnProperty('id')) {
                                    return "Relative to vaccination # " + rule.relativeTo.id;
                                }
                            }
                        }
                    }
                    return "Relative Date";
                }
            };

            $scope.eventID = function (list, event) {
                return list.indexOf(event);
            };

            $scope.newTestPlan = function () {
                var tp = TestObjectFactory.createTP();
                $scope.tps.push(tp);
                $scope.entityChangeLog[tp.id] = true;
                $scope.selectTP(tp,true);
            };

            //---------------------------------------------------------------------------------------------------------------------------------------------------
            //-[LD]--------------------------------------------------------------- LOAD TESTING DATA ------------------------------------------------------------
            //---------------------------------------------------------------------------------------------------------------------------------------------------


            $scope.initEnums = function () {
                var d = $q.defer();
                TestDataService.loadEnums().then(function (data) {
                        for (k in data) {
                            if (data.hasOwnProperty(k))
                                $scope[k] = data[k];
                        }
                        d.resolve(true);
                    },
                    function (err) {

                        d.resolve(false);
                    });
                return d.promise;
            };

            $scope.loadVaccines = function () {
                var d = $q.defer();
                VaccineService.load().then(function (data) {
                        for (var k in data) {
                            if (data.hasOwnProperty(k))
                                $scope[k] = data[k];
                        }
                        d.resolve(true);
                    },
                    function (err) {

                        d.resolve(false);
                    });
                return d.promise;
            };

            $scope.initHasIncomplete = function (tp) {
                $scope.hasIncomplete = false;
                if(tp){
                    _.forEach(tp.testCases,function (tc) {
                        if(tc && tc.hasOwnProperty("runnable") && !tc.runnable){

                            $scope.hasIncomplete = true;
                        }
                    });
                    _.forEach(tp.testCaseGroups,function (tg) {
                        _.forEach(tg.testCases,function (tc) {
                            if(tc && tc.hasOwnProperty("runnable") && !tc.runnable) {

                                $scope.hasIncomplete = true;
                            }
                        });
                    });
                }
            };

            $scope.loadTestCases = function () {
                var d = $q.defer();
                $scope.FITS_SERVER.loadTestPlans().then(function (data) {
                    if(data.status){
                        $scope.tps = data.obj;
                        d.resolve(true);
                    }
                    else {
                        d.resolve(false);
                    }
                });
                return d.promise;
            };

            //---------------------------------------------------------------------------------------------------------------------------------------------------
            //---------------------------------------------------------------------------------------------------------------------------------------------------
            //---------------------------------------------------------------------------------------------------------------------------------------------------

            //---------------------------------------------------------------------------------------------------------------------------------------------------
            //-[SL]--------------------------------------------------------------- VIEW SELECTION ---------------------------------------------------------------
            //---------------------------------------------------------------------------------------------------------------------------------------------------


            $scope.selectEvent = function (ev) {
                $timeout(function () {
                    // Selection
                    // $scope.selectedEvent = $scope.selectedTC.events.find(function (evt) {
                    //     evt.position = id;
                    // });
                    $scope.selectedEvent = ev;
                    $scope.selectedForecast = null;
                    $scope.patientSelected = false;
                    $scope.selectedType = "evt";

                    // View
                    $scope.subview = "EditEventData.html";
                    $rootScope.$emit('vp_clear', true);
                    waitingDialog.hide();
                }, 0);
            };

            $scope.selectForecast = function (f) {
                $timeout(function () {
                    // Selection
                    $scope.selectedForecast = f;
                    $scope.selectedEvent = null;
                    $scope.selectedType = "fc";
                    $scope.patientSelected = false;
                    // View
                    $scope.subview = "EditForecastData.html";
                    waitingDialog.hide();
                }, 0);
            };

            $scope.selectTP = function (tp,skip) {
                $scope.warning(skip).then(function () {
                    $timeout(function () {

                        DataSynchService.register(tp,null,$scope.entityUtils.transformTP);
                        // Selection
                        $scope.initHasIncomplete(tp);
                        $scope.selectedEvent = null;
                        $scope.selectedForecast = null;
                        $scope.selectedTC = null;
                        $scope.tpTree = [];
                        $scope.patientSelected = false;
                        $scope.grouping = true;
                        $scope.selectedTP = tp;
                        $scope.selectedTG = null;
                        $scope.tpTree.push($scope.selectedTP);
                        $scope.testCases = [];
                        TestObjectUtil.listTC(tp, $scope.testCases);
                        $scope.selectedType = "tp";

                        // View
                        $scope.selectTPTab(1);
                        $scope.subview = "EditTestPlanData.html";
                        waitingDialog.hide();
                    }, 0);
                });
            };

            $scope.hasBackUp = function (tc) {
                return tc && $scope.tcBackups.hasOwnProperty(tc.id);
            };

            $scope.selectTC = function (tc,skip,goToSummary) {
                $scope.warning(skip || tc === $scope.selectedTC).then(function () {
                    $timeout(function () {

                        DataSynchService.register(tc);
                        if ($scope.entityUtils.inSynch(tc)) {

                            tc._changed = false;
                            $scope.tcBackups[tc.id] = angular.copy(tc);
                        }

                        // Selection
                        $scope.selectedEvent = null;
                        $scope.selectedForecast = null;
                        $scope.selectedTC = tc;
                        $scope.selectedType = "tc";
                        $scope.patientSelected = false;

                        // View
                        $scope.subview = "EditTestPlanMetadata.html";
                        if(goToSummary)
                            $scope.tabs.selectedTabTC = 1;
                        else {
                            $scope.tabs.selectedTabTC = 0;
                        }
                        waitingDialog.hide();
                    }, 0);
                });
            };

            $scope.selectPatient = function () {
                $timeout(function () {
                    // View
                    $scope.selectedEvent = null;
                    $scope.selectedForecast = null;
                    $scope.patientSelected = true;
                    $scope.subview = "EditPatientInformation.html";
                    waitingDialog.hide();
                }, 0);
            };


            $scope.selectTG = function (tg,skip) {
                $scope.warning(skip).then(function () {
                    $timeout(function () {
                        DataSynchService.register(tg,null,$scope.entityUtils.transformTG);
                        // Selection
                        $scope.selectedEvent = null;
                        $scope.selectedForecast = null;
                        $scope.selectedTG = tg;
                        $scope.selectedTC = null;
                        $scope.selectedType = "tg";
                        $scope.patientSelected = false;

                        // View
                        $scope.subview = "EditTestGroupMetadata.html";
                        waitingDialog.hide();
                    }, 0);
                });
            };


            //---------------------------------------------------------------------------------------------------------------------------------------------------
            //---------------------------------------------------------------------------------------------------------------------------------------------------
            //---------------------------------------------------------------------------------------------------------------------------------------------------

            $scope.discardChanges = function (tc) {
                if($scope.tcBackups.hasOwnProperty(tc.id)){
                    $scope.tcBackups[tc.id]._changed = false;

                    if(tc.group !== $scope.tcBackups[tc.id].group){
                        tc.group = $scope.tcBackups[tc.id].group;
                        $scope.switchGroup($scope.selectedTP, tc);
                    }
                    angular.copy($scope.tcBackups[tc.id],tc);
                    $scope.selectTC(tc);
                }
            };




            $scope.hasChanges = function (tc) {
                if (tc)
                    return TestObjectUtil.hashChanged(tc);
                else
                    return false;
            };

            $scope.changes = function (list) {
                if (!list || list.length === 0)
                    return false;

                for (var tc = 0; tc < list.length; tc++) {
                    if (list[tc]._changed) {
                        return true;
                    }
                }
                return false;
            };

            $scope.errors = function (list) {
                if (!list || list.length === 0)
                    return false;

                for (var tc = 0; tc < list.length; tc++) {
                    if (list[tc]._hasErrors) {
                        return true;
                    }
                }
                return false;
            };

            $scope.groupName = function (id) {
                if(id && id !== ""){
                    var grp = TestObjectUtil.getGroupByID($scope.selectedTP,id);
                    if(grp) {
                        return grp.name;
                    }
                }
                return "";
            };

            $scope.warning = function (skip) {
                var deferred = $q.defer();
                if ($scope.selectedTC && !skip) {
                    if(!$scope.entityUtils.inSynch($scope.selectedTC)) {

                        //------- DEFAULT ACTION --------
                        if ($scope.remember.bool) {
                            if ($scope.remember.choice === "save") {
                                $scope.saveTC($scope.selectedTC).then(function (result) {
                                    $scope.notify(result);
                                    deferred.resolve();
                                });
                            }
                            else if ($scope.remember.choice === "discard") {
                                $scope.discardChanges($scope.selectedTC);
                                deferred.resolve();
                            }
                            else {
                                deferred.resolve();
                            }
                        }
                        //-------------------------------
                        //------------ DIALOG -----------
                        else {

                            $scope.exit = $modal.open({
                                templateUrl: 'ExitTC.html',
                                controller: 'ExitCtrl',
                                resolve: {
                                    discard: function () {
                                        return $scope.entityUtils.isLocal($scope.selectedTC);
                                    }
                                }
                            });

                            $scope.exit.result.then(function (response) {
                                if (response) {
                                    $scope.remember.bool = response.remember;
                                    $scope.remember.choice = response.action;
                                    if (response.action === "save") {
                                        $scope.saveTC($scope.selectedTC).then(function (result) {
                                            $scope.notify(result);
                                            deferred.resolve();
                                        });
                                    }
                                    else if (response.action === "discard") {
                                        $scope.discardChanges($scope.selectedTC);
                                        deferred.resolve();
                                    }
                                    else {
                                        deferred.resolve();
                                    }
                                }
                            }, function () {
                                deferred.resolve();
                            });
                        }

                    }
                    else {
                        deferred.resolve();
                    }
                }
                else {
                    deferred.resolve();
                }
                return deferred.promise;
            };

            $scope.getScope = function (id) {
                return angular.element(document.getElementById(id)).scope();
            };

            $scope.noDatesSS = ['G','F','A','I','S','C','X'];

            $scope.needDates = function (ss) {
                return !~$scope.noDatesSS.indexOf(ss);
            };

            $scope.serieStatusChange = function (ss,fct) {
                if(!$scope.needDates(ss)){
                    fct.earliest = null;
                    fct.recommended = null;
                    fct.complete = null;
                    fct.pastDue = null;
                }
                else {
                    if(!fct.earliest){
                        fct.earliest = TestObjectFactory.createDate($scope.selectedTC.dateType);
                    }
                    if(!fct.recommended){
                        fct.recommended = TestObjectFactory.createDate($scope.selectedTC.dateType);
                    }
                }
            };

            $scope.tcFilter = {
                example : {
                    name : '',
                    uid : '',
                    metaData : {
                        version: ''
                    }
                },
                incomplete : false,
                changed : false,
                dates : {
                    created : {
                        position : 'O',
                        date : null
                    },
                    updated : {
                        position : 'O',
                        date : null
                    }
                }
            };
            $scope.resetTcFilter = function (f) {
                Object.assign(f,{
                    example : {
                        name : '',
                        uid : '',
                        metaData : {
                            version: ''
                        }
                    },
                    incomplete : false,
                    changed : false,
                    dates : {
                        created : {
                            position : 'O',
                            date : null
                        },
                        updated : {
                            position : 'O',
                            date : null
                        }
                    }
                });
            };
            $scope.filterActive = function (f) {
              return   f.incomplete !== false || f.changed !== false || f.example.name !== '' || f.example.uid !== '' || f.example.metaData.version !== '' || f.dates.created.date !== null || f.dates.updated.date !== null;
            };


            $scope.transformTP = function (tp) {
                return {
                    id : tp.id,
                    name : tp.name,
                    version : tp.metaData.version,
                    changeLog : tp.metaData.changeLog,
                    description : tp.description
                };
            };

            $scope.transformTG = function (gp) {
                return {
                    id : gp.id,
                    name : gp.name
                };
            };

            //----CHANGE-WATCH------
            $scope.entityChangeLog = {};

            $scope.$watch("selectedTC",function () {
                $scope.selectedTC._changed = DataSynchService.changed($scope.selectedTC);
                if($scope.selectedTC){
                    $scope.entityChangeLog[$scope.selectedTC.id] = $scope.selectedTC._changed;
                }
            },true);

            $scope.changedTP = function (tp) {
                tp._changed = DataSynchService.changed(tp,null,$scope.entityUtils.transformTP);
                $scope.entityChangeLog[tp.id] = tp._changed;
            };

            $scope.changedTG = function (gp) {
                gp._changed = DataSynchService.changed(gp,null,$scope.entityUtils.transformTG);
                $scope.entityChangeLog[gp.id] = gp._changed;
            };

            $scope.workSpaceChanges = function () {
                for(var id in $scope.entityChangeLog){
                    if($scope.entityChangeLog.hasOwnProperty(id) && $scope.entityChangeLog[id]){
                        return true;
                    }
                }
                return false;
            };
            //----------------------



            $scope.evalStatusChange = function (evaluation) {
                if (evaluation.status !== 'INVALID') {
                    if (evaluation.hasOwnProperty("reason")) {
                        delete evaluation.reason;
                    }
                }
            };

            $scope.isSelectedTC = function (t) {
                return $scope.selectedTC && t && t.id === $scope.selectedTC.id;
            };
            $scope.isSelectedTG = function (t) {
                return $scope.selectedTG && t && t.id === $scope.selectedTG.id;
            };

            $scope.isSelectedEvent = function (e) {
                return e === $scope.selectedEvent;
            };

            $scope.isSelectedForecast = function (f) {
                return f === $scope.selectedForecast;
            };

            $scope.isSelectedTPv = function () {
                return $scope.subview === "EditTestPlanData.html";
            };

            $scope.isSelectedTGv = function () {
                return $scope.subview === "EditTestGroupMetadata.html";
            };

            $scope.isSelectedTCv = function () {
                return $scope.subview === "EditTestPlanMetadata.html";
            };

            $scope.aTCisSelected = function () {
                return $scope.selectedTC && $scope.selectedTC !== {};
            };

            $scope.aTPisSelected = function () {
                return $scope.selectedTP && $scope.selectedTP !== {};
            };

            $scope.anEvisSelected = function () {
                return $scope.selectedEvent
                    && $scope.selectedEvent !== {};
            };

            $scope.aFisSelected = function () {
                return $scope.selectedForecast
                    && $scope.selectedForecast !== {};
            };

            $scope.aPisSelected = function () {
                return $scope.patientSelected;
            };

            $scope.addEvent = function () {
                var event = TestObjectFactory.createEvent($scope.selectedTC.events.length, $scope.selectedTC.dateType);
                $scope.selectedTC.events.push(event);
                $scope.selectEvent(event);
            };

            $scope.addForecast = function () {
                var fc = TestObjectFactory.createForecast($scope.selectedTC.dateType);
                $scope.selectedTC.forecast.push(fc);
                $scope.selectForecast(fc);
            };


            $scope.closeTestPlanEdit = function () {
                $scope.selectedEvent = null;
                $scope.selectedForecast = null;
                $scope.selectedTP = null;
                $scope.selectedTC = null;
                $scope.selectedTG = null;
                $scope.selectedType = "";
                $scope.selectTPTab(0);
            };

            $scope.has = function (a, b) {
                return a.hasOwnProperty(b) && a[b];
            };

            $scope.newEvaluation = function (list) {
                list.push(TestObjectFactory.createEvaluation());
            };

            $scope.deleteEvaluation = function (list, index) {
                list.splice(index, 1);
            };

            $scope.importButton = function () {
                $scope.selectTP($scope.selectedTP);
                $scope.tabs.selectedTabTP = 1;
            };

            $scope.summary = function () {
                $scope.selectTC($scope.selectedTC,true,true);
                $scope.tabs.selectedTabTC = 1;
            };

            $scope.eventCM = [
                ['Delete Event',
                    function ($itemScope) {
                        var ev = $itemScope.ev;
                        var index = ev.position;
                        var i = $itemScope.$index;

                        $scope.selectedTC.events.splice(i, 1);
                        if ($scope.selectedTC.dateType === 'RELATIVE') {
                            for (var evt = 0; evt < $scope.selectedTC.events.length; evt++) {
                                var v = $scope.selectedTC.events[evt];
                                if (v && v.date) {
                                    for (var r = 0; r < v.date.rules.length; r++) {

                                        var rule = v.date.rules[r];

                                        if (rule && rule.relativeTo && rule.relativeTo.reference && rule.relativeTo.reference === 'dynamic' && rule.relativeTo.id + '' === index + '') {
                                            v.date.rules.splice(r, 1);
                                        }
                                    }
                                }
                            }
                        }
                        for (var e = 0; e < $scope.selectedTC.events.length; e++) {
                            TestObjectUtil.updateEventId($scope.selectedTC.events,$scope.selectedTC.events[e].position,e);
                        }
                        $scope.selectTC($scope.selectedTC,true);
                    }]];

            $scope.forecastCM = [
                ['Delete Forecast',
                    function ($itemScope) {
                        var id = $itemScope.$index;
                        $scope.selectedTC.forecast.splice(id, 1);
                        $scope.selectTC($scope.selectedTC,true);
                    }]];

            $scope.tpCM = [

                ['Add Test Case Group',
                    function ($itemScope) {
                        var tp = $itemScope.tp;
                        var tcg = TestObjectFactory.createGRP(tp.id);
                        $scope.entityChangeLog[tcg.id] = true;
                        tp.testCaseGroups.push(tcg);
                        //$scope.saveTG(tcg);
                    }],
                ['Add Test Case',
                    function ($itemScope) {
                        var tp = $itemScope.tp;
                        var tc = TestObjectFactory.createTC(tp.id,"",tp.metaData.version);

                        $scope.entityChangeLog[tc.id] = true;
                        tp.testCases.push(tc);
                        $scope.testCases.push(tc);
                        $scope.selectTC(tc);
                        $scope.scrollTo('tc-' + tc.id,"");
                    }],
                ['Import Test Case',
                    function ($itemScope) {
                        $scope.importButton();
                    }]
            ];

            // $scope.tgCM = [
            //     ['Add Test Case',
            //         function ($itemScope) {
            //             var grp = $itemScope.group;
            //             var tc = TestObjectFactory.createTC(grp.testPlan, grp.id, $scope.selectedTP.metaData.version);
            //             tc.group = grp.id;
            //             grp.testCases.push(tc);
            //             $scope.testCases.push(tc);
            //             $scope.selectTC(tc);
            //             $scope.scrollTo('tc-' + tc.id,tc.group);
            //         }],
            //     ['Delete Test Case Group',
            //         function ($itemScope) {
            //             var grp = $itemScope.group;
            //             var index = TestObjectUtil.index($scope.selectedTP.testCaseGroups, "id", grp.id);
            //             if(TestObjectUtil.isLocal(grp)){
            //                 $scope.selectedTP.testCaseGroups.splice(index, 1);
            //                 $scope.notify(true,"Test Case Group deleted");
            //                 if($scope.selectedTC && grp.id === $scope.selectedTC.group){
            //                     $scope.selectedTC = null;
            //                 }
            //                 $scope.selectTP($scope.selectedTP,true);
            //             }
            //             else {
            //                 $http.post('api/testcasegroup/'+grp.id+'/delete').then(function (success) {
            //                         $scope.selectedTP.testCaseGroups.splice(index, 1);
            //                         $scope.notify(true,"Test Case Group deleted");
            //                         if($scope.selectedTC && grp.id === $scope.selectedTC.group){
            //                             $scope.selectedTC = null;
            //                         }
            //                         $scope.selectTP($scope.selectedTP,true);
            //                     },
            //                     function () {
            //                         $scope.notify(false,"Failed to delete Test Case Group");
            //                     });
            //             }
            //         }]];

            $scope.tgCM = [
                ['Add Test Case',
                    function ($itemScope) {
                        var grp = $itemScope.group;
                        var tc = TestObjectFactory.createTC(grp.testPlan, grp.id, $scope.selectedTP.metaData.version);
                        tc.group = grp.id;
                        grp.testCases.push(tc);
                        $scope.testCases.push(tc);
                        $scope.entityChangeLog[tc.id] = true;
                        $scope.selectTC(tc);
                        $scope.scrollTo('tc-' + tc.id,tc.group);
                    }],
                ['Delete Test Case Group',
                    function ($itemScope) {
                        var grp = $itemScope.group;
                        PopUp.start("Deleting Test Case Group ...");
                        try {
                            $scope.FITS_SERVER.delete([$scope.selectedTP.testCaseGroups], grp, EntityService.type.TEST_CASE_GROUP).then(function (data) {
                                PopUp.stop();
                                if(data.status){
                                    $scope.notify(data);
                                    $scope.selectTP($scope.selectedTP,true);
                                }
                                else {
                                    $scope.notify(data);
                                }
                            });
                        }
                        catch(ex){
                            PopUp.stop();
                        }

                    }]];

            $scope.tcCM = [
                ['Clone Test Case',
                    function ($itemScope) {

                        var obj = $itemScope.tc;
                        var clone = TestObjectUtil.cloneEntity(obj);
                        clone._local = true;
                        clone.name = "[CLONE] " + clone.name;
                        $scope.entityUtils.sanitizeTC(clone);

                        var list = TestObjectUtil.getList($scope.selectedTP, obj.id);
                        if (list) {
                            list.push(clone);
                            $scope.entityChangeLog[clone.id] = true;
                            $scope.testCases.push(clone);
                            $scope.selectTC(clone);
                            $scope.scrollTo('tc-' + clone.id,clone.group);
                        }
                    }],
                ['Delete Test Case',
                    function ($itemScope) {
                        var tc = $itemScope.tc;
                        var list = TestObjectUtil.getList($scope.selectedTP, tc.id);
                        if (list) {
                            PopUp.start("Deleting Test Case ...");
                            try{
                                $scope.FITS_SERVER.delete([list],tc,EntityService.type.TEST_CASE).then(function (data) {
                                    PopUp.stop();
                                    if(data.status){
                                        $scope.notify(data);
                                        $scope.selectTP($scope.selectedTP,true);
                                    }
                                    else {
                                        $scope.notify(data);
                                    }
                                });
                            }
                            catch (ex){
                                PopUp.stop();
                            }
                        }
                    }]];

            // $scope.tcCM = [
            //     ['Clone Test Case',
            //         function ($itemScope) {
            //
            //             var obj = $itemScope.tc;
            //             var clone = TestObjectUtil.cloneEntity(obj);
            //             clone.name = "[CLONE] " + clone.name;
            //             TestObjectUtil.sanitizeDates(clone);
            //             //TestObjectUtil.sanitizeEvents(clone);
            //             var list = TestObjectUtil.getList($scope.selectedTP, obj.id);
            //             if (list) {
            //                 list.push(clone);
            //                 $scope.testCases.push(clone);
            //                 $scope.selectTC(clone);
            //                 $scope.scrollTo('tc-' + clone.id,clone.group);
            //                 //console.log(clone);
            //             }
            //         }],
            //     ['Delete Test Case',
            //         function ($itemScope, $event, modelValue, text, $li) {
            //             var tc = $itemScope.tc;
            //             var list = TestObjectUtil.getList($scope.selectedTP, tc.id);
            //             if (list) {
            //                 var index = list.indexOf(tc);
            //                 if (TestObjectUtil.isLocal(tc)) {
            //                     list.splice(index, 1);
            //                     var indexTCL = TestObjectUtil.index($scope.testCases,"id",tc.id);
            //                     $scope.testCases.splice(indexTCL, 1);
            //                     if($scope.selectedTC && tc.id === $scope.selectedTC.id){
            //                         $scope.selectedTC = null;
            //                     }
            //                     $scope.selectTP($scope.selectedTP,true);
            //                 }
            //                 else {
            //                     $http.post('api/testcase/' + tc.id + '/delete').then(function (r) {
            //                             list.splice(index, 1);
            //                             var indexTCL = TestObjectUtil.index($scope.testCases,"id",tc.id);
            //                             $scope.testCases.splice(indexTCL, 1);
            //                             if($scope.selectedTC && tc.id === $scope.selectedTC.id){
            //                                 $scope.selectedTC = null;
            //                             }
            //                             $scope.selectTP($scope.selectedTP,true);
            //
            //                             Notification
            //                                 .success({
            //                                     message: "Test Case Deleted",
            //                                     delay: 3000
            //                                 });
            //                         },
            //                         function (r) {
            //                             Notification
            //                                 .error({
            //                                     message: "Error Deleting",
            //                                     delay: 3000
            //                                 });
            //                         });
            //                 }
            //             }
            //         }]];

            $scope.fileChange = function (files) {
                $scope.files = files;
                if ($scope.export.type === 'NIST') {
                    if (files[0].type === "text/xml") {
                        $scope.$apply(function () {
                            $scope.sfile = files[0].name;
                            $scope.fileErr = false;
                            $scope.sfileO = files[0];
                        });
                    }
                    else {
                        $scope.$apply(function () {
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
                        $scope.$apply(function () {
                            $scope.sfileO = null;
                            $scope.sfile = "File should be Excel Spreadsheet";
                            $scope.fileErr = true;
                        });
                    }
                }

            };

            $scope.sanitizeTestCase = function (tc) {
                TestObjectUtil.sanitizeDates(tc);
                tc._dateType = tc.dateType;
            };

            $scope.saved = function (list) {
                for(var tc = 0; tc < list.length; tc++){
                    if(!$scope.entityUtils.inSynch(list[tc])){
                        return false;
                    }
                }
                return true;
            };

            $scope.canImport = function (tp) {
                if(!tp){

                    return false;
                }
                if($scope.entityUtils.isLocal(tp)){

                    return false;
                }
                if(!$scope.saved(tp.testCases)){

                    return false;
                }
                if(!$scope.saved(tp.testCaseGroups)){

                    return false;
                }
                for(var tc = 0; tc < tp.testCaseGroups.length; tc++){
                    if(!$scope.saved(tp.testCaseGroups[tc].testCases)){

                        return false;
                    }
                }
                return true;
            };

            $scope.uploadNIST = function () {
                if ($scope.sfileO != null && !$scope.fileErr) {
                    if(!$scope.canImport($scope.selectedTP)){

                        var saveModal = $modal.open({
                            templateUrl: 'ImportSave.html',
                            controller: 'ImportSaveCtrl'
                        });
                        saveModal.result.then(function (result) {
                            if(result.action === 'save'){
                                $scope.saveTP($scope.selectedTP,true).then(function (result) {
                                    $scope.notify(result);
                                })
                            }
                        });
                        return;
                    }
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
                                transformRequest: angular.identity,
                                headers: {
                                    'Content-Type': undefined
                                }
                            })
                        .success(
                            function (data) {

                                if (data.status) {
                                    var tp = angular.fromJson(data.testPlan);
                                    $scope.entityUtils.sanitizeTP(tp);
                                    TestObjectUtil.merge(tp,$scope.selectedTP);
                                    TestObjectUtil.listTC($scope.selectedTP,$scope.testCases);
                                    var obj = $scope.entityUtils.findTcInTp(tp,data.imported);
                                    if(obj){
                                        $scope.selectTC(obj);
                                        $scope.scrollTo('tc-'+obj.id,obj.group);
                                    }
                                    else {
                                        $scope.selectTP($scope.selectedTP);
                                    }

                                    Notification
                                        .success({
                                            message: "TestCase Imported",
                                            delay: 3000
                                        });
                                    $scope.sfile = "browse";
                                    $scope.sfileO = null;
                                } else {
                                    $scope.control.error.isSet = true;
                                    var erObj = {
                                        action: "IMPORT_NIST",
                                        errors: []
                                    };
                                    for (var er in data.errors) {
                                        if (data.errors.hasOwnProperty(er)) {
                                            erObj.errors.push({
                                                path: 'Line : ' + data.errors[er].line + ', Column : ' + data.errors[er].column,
                                                message: data.errors[er].message
                                            });
                                        }
                                    }
                                    erObj.errors.push({
                                        path: 'File',
                                        message: data.message
                                    });
                                    $scope.fileErr = true;
                                    $scope.control.error.list.push(erObj);
                                    Notification
                                        .error({
                                            message: "Error While Importing",
                                            delay: 3000
                                        });
                                }


                                $scope.importing = false;

                            }).error(function (data) {
                        $scope.importing = false;
                        $scope.fileErr = true;
                        Notification.error({
                            message: "Server Error While Importing",
                            delay: 3000
                        });
                    });
                }
            };

            $scope.activeElement = function () {
                if($scope.selectedTC)
                    return 'tc';
                if($scope.selectedTP && !$scope.selectedTG && !$scope.selectedTC)
                    return 'tp';
                if($scope.selectedTP && $scope.selectedTG && !$scope.selectedTC)
                    return 'tg';
                return 'x';
            };

            $scope.$watch('importing', function (newValue) {
                if (newValue === false) {
                    PopUp.stop();
                    // if ($scope.impDiag)
                    //     $scope.impDiag.close({});
                }
                else if (newValue === true) {
                    PopUp.start("Importing Test Cases...");
                    // $scope.impDiag = $modal.open({
                    //     templateUrl: 'ImportLoading.html',
                    //     controller: 'ConfirmTestPlanDeleteCtrl',
                    //     backdrop : 'static',
                    //     keyboard : false,
                    //     resolve: {
                    //         testplanToDelete: function () {
                    //             return null;
                    //         },
                    //         tps: function () {
                    //             return $scope.tps;
                    //         }
                    //     }
                    // });
                }
            });

            $scope.$watch('control.error.isSet', function (newValue) {
                if (newValue === false) {
                    if ($scope.errorDiag)
                        $scope.errorDiag.close({});
                }
                else if (newValue === true) {
                    $scope.errorDiag = $modal.open({
                        templateUrl: 'ErrorPanel.html',
                        controller: 'ErrorPanelCtrl',
                        resolve: {
                            control : function () {
                                return $scope.control;
                            }
                        }
                    });
                    $scope.errorDiag.result.then(function () {

                    },function () {
                        $scope.control.error.isSet = false;
                        $scope.control.error.list = [];
                    });
                }
            });

            $scope.typeChange = function () {
                $scope.sfile = "browse";
                $scope.sfileO = null;
                $scope.fileErr = false;
            };

            $scope.upload = function () {
                if ($scope.export.type === 'NIST') {
                    $scope.uploadNIST();
                }
                else {
                    $scope.uploadCDC();
                }
            };


            $scope.uploadCDC = function () {
                if ($scope.sfileO != null && !$scope.fileErr) {
                    if(!$scope.canImport($scope.selectedTP)){

                        var saveModal = $modal.open({
                            templateUrl: 'ImportSave.html',
                            controller: 'ImportSaveCtrl'
                        });
                        saveModal.result.then(function (result) {
                            if(result.action === 'save'){
                                $scope.saveTP($scope.selectedTP,true).then(function () {
                                    $scope.notify(result);
                                })
                            }
                        });
                        return;
                    }
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
                            transformRequest: angular.identity,
                            headers: {
                                'Content-Type': undefined
                            }
                        })
                        .success(
                            function (data) {
                                if (data.status) {

                                    var tp = angular.fromJson(data.testPlan);
                                    $scope.entityUtils.sanitizeTP(tp);
                                    TestObjectUtil.merge(tp,$scope.selectedTP);
                                    $scope.selectTP($scope.selectedTP);

                                    Notification
                                        .success({
                                            message: "TestCases Imported",
                                            delay: 3000
                                        });

                                } else {
                                    var erObj = {
                                        action: "IMPORT_NIST",
                                        errors: [{ path : 'File', message : data.message}]
                                    };
                                    $scope.control.error.list.push(erObj);
                                    Notification
                                        .error({
                                            message: "Error While Importing",
                                            delay: 3000
                                        });
                                    $scope.fileErr = true;
                                    $scope.control.error.isSet = true;
                                }
                                $scope.importing = false;
                            }).error(function (data) {
                        $scope.importing = false;
                        $scope.fileErr = true;
                        Notification.error({
                            message: "Server Error While Importing",
                            delay: 3000
                        });

                    });
                }
            };


            $scope.exportNIST = function () {
                if ($scope.entityUtils.inSynch($scope.selectedTC)) {
                    var form = document.createElement("form");
                    form.action = $rootScope.api('api/testcase/'
                        + $scope.selectedTC.id + '/export/nist');
                    form.method = "POST";
                    form.target = "_target";
                    form.style.display = 'none';
                    document.body.appendChild(form);
                    form.submit();
                }
                else {
                    Notification.error({
                        message: "Your Test Case has unsaved changes please save before exporting",
                        delay: 3000
                    });
                }
            };

            // --------------------------------------------------------------------------------------------------------

            $scope.initTestCases = function () {
                if (userInfoService.isAuthenticated()) {
                    $scope.loading = true;
                    $scope.loadTestCases().then(function (a) {
                        $scope.initEnums().then(function (b) {
                            $scope.loadVaccines().then(function (c) {

                                $scope.loading = false;
                                $scope.error = null;
                                //$scope.autoSaveFct();
                            });
                        });
                    });
                }
            };

            $rootScope.$on('event:loginConfirmed', function () {
                $scope.initTestCases();
            });


            $scope.confirmDeleteTestPlan = function (testplan) {
                var modalInstance = $modal.open({
                    templateUrl: 'ConfirmTestPlanDeleteCtrl.html',
                    controller: 'ConfirmTestPlanDeleteCtrl',
                    resolve: {
                        testplanToDelete: function () {
                            return testplan;
                        },
                        tps: function () {
                            return $scope.tps;
                        }
                    }
                });
                modalInstance.result.then(function () {

                });
            };

            $scope.isLocal = function (tp) {
                return $scope.entityUtils.isLocal(tp);
            };

            $scope.prefill = function (list, x) {
                var groups = $scope.getGroups(x);
                if (groups.length === 0) {
                    var eval = TestObjectFactory.createEvaluation();
                    var mp = $scope.getMapping(x);

                    eval.relatedTo = $scope.getVx(mp.vx.cvx);
                    list.push(eval);
                }
                else {
                    for (var i in groups) {
                        var eval = TestObjectFactory.createEvaluation();
                        eval.relatedTo = $scope.getVx(groups[i].cvx);
                        list.push(eval);
                    }
                }
            };

            $scope.getVx = function (x) {
                return VaccineService.getVx($scope.vxm, x);
            };

            $scope.getV = function (x) {
                var mp = VaccineService.getMapping($scope.vxm, x);
                if (mp)
                    return VaccineService.getVx($scope.vxm, mp.vx.cvx);
                else
                    return null;
            };

            $scope.getMapping = function (x) {
                return VaccineService.getMapping($scope.vxm, x);
            };
            $scope.getGroups = function (x) {
                return VaccineService.getGroups($scope.vxm, x);
            };

            $scope.switchGroup = function (tp, tc) {
                var list = TestObjectUtil.getList(tp, tc.id);
                if(list){
                    var index = TestObjectUtil.index(list, "id", tc.id);
                    if (tc.group !== "") {
                        var group = TestObjectUtil.getGroupByID(tp, tc.group);
                        if (group) {
                            list.splice(index, 1);
                            group.testCases.push(tc);
                        }
                    }
                    else {
                        list.splice(index, 1);
                        tp.testCases.push(tc);
                    }
                }
                else {
                    var group = TestObjectUtil.getGroupByID(tp, tc.group);
                    if (group) {
                        group.testCases.push(tc);
                    }
                }


                $scope.scrollTo('tc-' + tc.id,tc.group);

            };

            $scope.scrollTo = function (id,grp) {
                $timeout(function () {
                    if(grp && grp !== ''){
                        var scope = $scope.getScope('gr-' + grp);
                        scope.expand();
                    }
                    $timeout(function () {
                        var old = $location.hash();
                        $location.hash(id);
                        $anchorScroll();
                        $location.hash(old);
                    }, 500);
                }, 500);
            };

            $scope.selectTPTab = function (value) {
                if (value === 1) {
                    $scope.accordi.tpList = false;
                    $scope.accordi.tpDetails = true;
                } else {
                    $scope.accordi.tpList = true;
                    $scope.accordi.tpDetails = false;
                }
            };

            $scope.dismissError = function () {
                $scope.control.error.isSet = false;
                $scope.control.error.list = []
            };


            $scope.saveTG = function (tg,deep) {
                var deferred = $q.defer();

                $scope.FITS_SERVER.save($rootScope,EntityService.type.TEST_CASE_GROUP,tg,$scope.selectedTP).then(function (result) {
                    if(result.status){
                        if(deep){
                            $scope.saveTCList(tg.testCases);
                        }
                    }
                    $scope.loading = false;
                    deferred.resolve(result);
                });
                return deferred.promise;
            };

            $scope.saveSeqTC = function (i,list) {
                if(i < list.length) {
                    $scope.saveTC(list[i]).then(function (result) {
                       $scope.notify(result);
                       $scope.saveSeqTC(i+1,list);
                    });
                }
            };

            $scope.saveTCList = function (list) {
                var tcs = list.filter(function (item) {
                    return item._local || item._changed;
                });
                $scope.saveSeqTC(0,tcs);
            };

            $scope.saveTP = function (tp,deep) {
                var deferred = $q.defer();
                $scope.FITS_SERVER.save($rootScope,EntityService.type.TEST_PLAN,tp,null).then(function (result) {
                    if(result.status){
                        if(deep){
                            var tcs = [];
                            TestObjectUtil.listTC(tp,tcs);
                            $scope.saveTCList(tcs);
                        }
                    }
                    deferred.resolve(result);
                    $scope.loading = false;
                });
                return deferred.promise;
            };

            $scope.saveTC = function (tc) {
                var deferred = $q.defer();

                $scope.FITS_SERVER.save($rootScope,EntityService.type.TEST_CASE,tc,$scope.selectedTP).then(function (result) {
                    deferred.resolve(result);
                    $scope.loading = false;
                });

                return deferred.promise;
            };


            $scope.saveAllChangedTestPlans = function () {
                var deferred = $q.defer();
                $scope.loading = true;
                $scope.control.error.isSet = false;
                $scope.control.error.obj = [];
                var elm = $scope.activeElement();

                try {
                    if(elm !== 'x'){
                        if (elm === 'tp') {
                            PopUp.start("Saving Test Plan ...");
                            $scope.saveTP($scope.selectedTP,true).then(function (result) {
                                PopUp.stop();
                                $scope.notify(result);
                                deferred.resolve(result);
                            });
                        }
                        else if (elm === 'tc') {
                            PopUp.start("Saving Test Case ...");
                            $scope.saveTC($scope.selectedTC).then(function (result) {
                                PopUp.stop();
                                $scope.notify(result);
                                deferred.resolve(result);
                            });
                        }
                        else if (elm === 'tg') {
                            PopUp.start("Saving Test Case Group ...");
                            $scope.saveTG($scope.selectedTG,true).then(function (result) {
                                PopUp.stop();
                                $scope.notify(result);
                                deferred.resolve(result);
                            });
                        }
                        else {
                            deferred.resolve();
                        }
                    }
                    else {
                        deferred.resolve();
                    }
                }
                catch(ex){
                    PopUp.stop();
                }
                return deferred.promise;
            };

            $scope.calculateTC = function (tp) {
                var nb = 0;
                nb += tp.testCases.length;
                _.forEach(tp.testCaseGroups, function (gr) {
                    nb += gr.testCases.length;
                });
                return nb;
            };

            $scope.notify = function (response) {
                if(response.severity === EntityService.severity.ERROR){
                    Notification.error({
                        message: response.message,
                        delay: 3000
                    });
                }
                else if(response.severity === EntityService.severity.WARNING) {
                    Notification.warning({
                        message: response.message,
                        delay: 3000
                    });
                }
                else if(response.severity === EntityService.severity.SUCCESS){
                    Notification.success({
                        message: response.message,
                        delay: 3000
                    });
                }
            };

            $scope.sanitizeErrorPath = function (path) {
                var result;
                var elements = path.split(".");
                for (var i = 0; i < elements.length; i++) {
                    elements[i] = $scope.capitalize(elements[i]);
                }
                path = elements.join(" ");
                result = path.replace('\\.', ' ');
                if (result.indexOf('Events[') !== -1) {
                    result = result.replace('Events[', 'Vaccination Event ID # ');
                    result = result.replace(']', ' ');
                }

                result = result.replace('Forecast', 'Forecast');
                result = result.replace('EvalDate Date', 'Assessment Date');
                result = result.replace('EvalDate', 'Assessment Date');
                result = result.replace('Dob Date', 'Date Of Birth');
                result = result.replace('Dob', 'Date Of Birth');
                result = result.replace('Dob Date', 'Date Of Birth');
                result = result.replace('Date Date', 'Date');
                return result;
            };

            $scope.capitalize = function (string) {
                return string.charAt(0).toUpperCase() + string.slice(1);
            };

            $rootScope.$on('$locationChangeStart', function (event, next, current) {
                if($scope.workSpaceChanges()){
                    event.preventDefault();
                    var modal = $modal.open({
                        templateUrl: 'ExitTab.html',
                        controller: 'ExitTabCtrl',
                        backdrop : 'static',
                        keyboard : false
                    });

                    modal.result.then(function (){

                    }, function () {
                        $scope.entityChangeLog = {};
                        var go = next.substring(next.indexOf("#")+1,next.length);
                        $location.path(go);
                    });
                }
            });

            $rootScope.$on('tp_import_success',function (event,result) {
                console.log("IMPORT SUCCESS");
                console.log(result.testPlan);
                console.log($scope.tps);
                var tp = result.testPlan;
                if(tp){
                    var id = _.findIndex($scope.tps,function (tpF) {
                        return tpF.id === tp.id;
                    });
                    console.log("ID "+id);
                    if(~id){
                        $scope.entityUtils.sanitizeTP(tp);
                        $scope.tps.splice(id,1,tp);
                        $scope.selectTP(tp);
                    }
                }

                $scope.sum = $modal.open({
                    templateUrl: 'ImportSummary.html',
                    controller: 'ImportSummaryCtrl',
                    resolve: {
                        sum: function () {
                            return result;
                        }
                    }
                });
            });

            $rootScope.$on('tp_import_failure',function (event,result) {
                console.log("IMPORT FAILURE");
                $scope.sum = $modal.open({
                    templateUrl: 'ImportSummary.html',
                    controller: 'ImportSummaryCtrl',
                    resolve: {
                        sum: function () {
                            return result;
                        }
                    }
                });
                PopUp.stop();
            });

            $rootScope.$on('start_import',function (event) {
                console.log("START IMPORT");
                PopUp.start("Importing Test Cases...");
            });

            $rootScope.$on('end_import',function (event) {
                console.log("END IMPORT");
                PopUp.stop();
            });


            $rootScope.$on('entity_saved', function (event, entity, transform) {
                DataSynchService.save(transform);
                if(entity){
                    entity._changed = false;
                    delete entity._local;
                    $scope.hasIncomplete = entity.hasOwnProperty("runnable") ? !entity.runnable : false;
                    $scope.entityChangeLog[entity.id] = false;
                    $scope.tcBackups[entity.id] = angular.copy(entity);
                }
            });

            $scope.deleted = function (obj) {
                var ids = $scope.entityUtils.extractIDs(obj);
                _.forEach(ids,function (id) {
                    DataSynchService.unregister(id);
                    delete $scope.entityChangeLog[id];
                    delete $scope.tcBackups[id];
                });
                $scope.initHasIncomplete($scope.selectedTP);
            };

            $rootScope.$on('entity_deleted', function (event, obj) {
                $scope.deleted(obj);
            });
        }
    );

angular.module('tcl').controller('ConfirmTestPlanDeleteCtrl',
    function ($scope, $uibModalInstance, testplanToDelete, tps, $http, $rootScope, FITSBackEnd, EntityService) {
        $scope.testplanToDelete = testplanToDelete;
        $scope.loading = false;
        $scope.deleteTestPlan = function () {
            $scope.loading = true;
            var lists = [];
            lists.push(tps);
            FITSBackEnd.delete([tps], $scope.testplanToDelete, EntityService.type.TEST_PLAN).then(function (result) {
                if (result.status) {

                    $scope.loading = false;
                    $rootScope.msg().text = "testplanDeleteSuccess";
                    $rootScope.msg().type = "success";
                    $rootScope.msg().show = true;
                }
                else {
                    $scope.loading = false;
                    $uibModalInstance.dismiss('cancel');
                    $rootScope.msg().text = "testplanDeleteFailed";
                    $rootScope.msg().type = "danger";
                    $rootScope.msg().show = true;
                }
                $uibModalInstance.dismiss('cancel');
            });
        };

        $scope.cancel = function () {
            $uibModalInstance.dismiss('cancel');
        };
    });


angular.module('tcl').controller('ExitCtrl',
    function ($scope, $uibModalInstance, discard) {

        $scope.canDiscard = discard;
        $scope.remember = false;
        $scope.discardChanges = function () {
            $uibModalInstance.close({action: 'discard', remember: $scope.remember});
        };

        $scope.saveChanges = function () {
            $uibModalInstance.close({action: 'save', remember: $scope.remember});
        };

        $scope.saveLater = function () {
            $uibModalInstance.close({action: 'later', remember: $scope.remember});
        };

        $scope.dismiss = function () {
            $uibModalInstance.dismiss('cancel');
        };
    });

angular.module('tcl').controller('ExitTabCtrl',
    function ($scope, $uibModalInstance) {

        $scope.stay = function () {
            $uibModalInstance.close(true);
        };

        $scope.cancel = function () {
            $uibModalInstance.dismiss(false);
        };

});

angular.module('tcl').controller('ImportSaveCtrl',
    function ($scope, $uibModalInstance) {

        $scope.save = function () {
            $uibModalInstance.close({action: 'save'});
        };

        $scope.saveLater = function () {
            $uibModalInstance.close({action: 'later'});
        };

        $scope.dismiss = function () {
            $uibModalInstance.dismiss('cancel');
        };
    });

angular.module('tcl').controller('DateCtrl',
    function ($scope, $uibModalInstance) {
        $scope.continue = function () {
            $uibModalInstance.close({action: 'continue'});
        };

        $scope.abort = function () {
            $uibModalInstance.dismiss('cancel');
        };

        $scope.dismiss = function () {
            $uibModalInstance.dismiss('cancel');
        };
    });

angular.module('tcl').controller('ImportSummaryCtrl',
    function ($scope, $uibModalInstance, sum) {
        $scope.summary = sum;

        $scope.dismiss = function () {
            $uibModalInstance.dismiss('cancel');
        };
    });


angular.module('tcl').controller('GrpNameCtrl',
    function ($scope, $uibModalInstance, name) {

        $scope.name = name;
        $scope.ok = function () {
            $uibModalInstance.close({name: $scope.name});
        };
        $scope.dismiss = function () {
            $uibModalInstance.dismiss('cancel');
        };

    });

angular.module('tcl').controller('ErrorPanelCtrl',
    function ($scope, $uibModalInstance, control) {
        $scope.control = control;
        $scope.ok = function () {
            $uibModalInstance.dismiss('cancel');
        };
    });

angular.module('tcl').controller('VaccineBrowseCtrl',
    function ($scope, $uibModalInstance, mappings, allowMvx, groups, $http, $filter) {
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
        $scope.nbPagesG = Math.ceil($scope.vxm.length / $scope.pageSize);
        $scope.nbPagesS = 0;
        $scope.pcG = 1;
        $scope.pcS = 1;

        $scope.pages = function (list) {
            var nb = $scope.nbPages(list);
            if (nb === 0) {
                return [];
            }
            else
                return new Array(nb);
        };

        $scope.nbPages = function (list) {
            if (!list || list.length === 0) {
                return 0;
            }
            else {
                var nb = list.length / $scope.pageSize;
                return Math.ceil(nb);
            }
        };

        $scope.zoom = function (mp) {
            $scope.generic = false;
            $scope.searchtxt = "";
            $scope.selectedMapping = mp;
        };

        $scope.unzoom = function () {
            $scope.generic = true;
            $scope.searchtxt = "";
            $scope.selectedMapping = {};
        };

        $scope.getNumber = function (num) {
            if (num == 0 || num < 0)
                return [];

            return new Array(num);
        };

        $scope.filterList = function (list, search) {
            if (!list || list.length === 0) {
                return [];
            }
            else if (!search || search === "") {
                return list;
            }
            else {
                var str = search.toLowerCase();
                l = list.filter(function (item) {
                    return item.vx.name.toLowerCase().includes(str) || item.vx.cvx.includes(str);
                });
                $scope.nbT = Math.floor(l.length / 6);
                $scope.cbT = 1;
                return l;
            }
        };

        $scope.goToPageG = function (num) {
            $scope.pcG = num;
        };

        $scope.goToPageS = function (num, v) {
            $scope.pcS = num;
        };

        $scope.forward = function () {
            var nb = ($scope.cbT + 1) % $scope.nbT;
            if (nb == 0)
                $scope.cbT = 1;
            else
                $scope.cbT = nb;
        };

        $scope.backward = function () {
            var nb = ($scope.cbT - 1 ) % $scope.nbT;
            if (nb == -1)
                $scope.cbT = 1;
            else
                $scope.cbT = nb;
        };

        $scope.ceil = function (x) {
            if (x === 0)
                return 0;
            return Math.ceil(x);
        };

        $scope.cancel = function () {
            $uibModalInstance.dismiss('cancel');
        };

        $scope.hasGroup = function (mp, gr) {
            if (mp.groups && mp.groups.length !== 0) {
                var found = false;
                for (var mG in mp.groups) {
                    if (mp.groups[mG].cvx === gr.cvx) {
                        found = true;
                        break;
                    }
                }
                return found;
            }
            return false;
        };
        $scope.tileCoords = function (index) {
            var x = index % 2;
            var y = Math.floor(index / 2);
            return {'x': x, 'y': y % 2};
        };

        $scope.isW = function (index) {
            var coords = $scope.tileCoords(index);
            if ((coords.x - coords.y) === 0)
                return true;
            else
                return false;
        };

        $scope.select = function (x) {
            var v = JSON.parse(JSON.stringify(x));
            $uibModalInstance.close(v);
        };

        $scope.vxdataChange = function () {
            $scope.pcG = 1;
            $scope.pcS = 1;
        };
    });
