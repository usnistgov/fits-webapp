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

angular.module('tcl').filter('workflow', function () {
    return function (items, tag) {
        if (!items || !items.length) {
            return;
        }
        if (tag === 'ALL') return items;
        return items.filter(function (item) {
            return item.workflowTag === tag || (!item.workflowTag && (tag === ''));
        });
    };
});

angular.module('tcl').filter('tags', function () {
    return function (items, tags) {
        if (!items || !items.length) {
            return;
        }
        if (!tags || tags.length === 0) return items;
        return items.filter(function (item) {
            if(!item.tags || item.tags.length === 0) return false;
            for(var i = 0; i < tags.length; i++){
                if(!item.tags.find(function (tag) {
                    return tag.text === tags[i].text;
                })){
                    return false;
                }
            }
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
                  $interval, ViewSettings, StorageService, $q, QueryService,
                  notifications, IgDocumentService, ElementUtils, ExecutionService,
                  AutoSaveService, $sce, Notification, TestObjectUtil, TestObjectFactory, VaccineService, TestObjectSynchronize, TestDataService, FITSBackEnd, EntityService, EntityUtilsService) {
            $scope.vxm = [];
            $scope.keywords = [
                { text: 'just' },
                { text: 'some' },
                { text: 'cool' },
                { text: 'tags' }
            ];
            $scope.eService = EntityService;
            $scope.tagFilter = '';
            $scope.loading = false;
            $scope.validationReport = {};
            $scope.entityUtils = EntityUtilsService;
            $scope.selectedTabTP = 0;
            $scope.sfile = "BROWSE";
            $scope.sfileO = null;
            $scope.fileErr = false;
            $rootScope.blockTree = false;
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
            $scope.viewArchived = false;
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
            $scope.software = [];
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
                obj[key] = $rootScope.toUTC(obj["_" + key]);
            };


            $scope.dateChangeX = function (dateObj) {
                dateObj.date = $rootScope.toUTC(dateObj._dateObj);
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
            $scope.wholeTP = null;
            $scope.selectedTC = null;
            $scope.selectedTCB = null;
            $scope.selectedTG = null;
            $scope.tps = [];
            $scope.vTps = [];
            $scope.archivedTps = [];
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
            $scope.viewOnly = false;

            $scope.print = function (x) {
                console.log(x);
            };

            $scope.goToExportButton = function () {
              if(!$scope.aTCisSelected()){
                  $scope.mainView = 'export';
              }
            };

            $scope.valueForEnum = function (code, enumList) {
                for (var i in enumList) {
                    if (enumList[i].code === code) {
                        return enumList[i].details;
                    }
                }
                return "";
            };

            $scope.tpTags = [];
            $scope.updateTags = function (tp) {
                $scope.tpTags = [];
                $scope.digestListTags($scope.tpTags, tp.testCases);
                for(var tg in tp.testCaseGroups){
                    $scope.digestListTags($scope.tpTags, tp.testCaseGroups[tg].testCases);
                }
            };

            $scope.loadTags = function (query) {
                return new Promise(function (resolve, reject) {
                    //scope.updateTags($scope.selectedTP);
                    var res = $scope.tpTags.filter(function (tag) {
                        return tag.text.includes(query);
                    });
                    console.log(query);
                    console.log(res);
                    resolve(res);
                });
            };

            $scope.digestListTags = function (container, list) {
                for(var tc in list){
                    if(!list[tc].tags || list[tc].tags.length === 0) continue;

                    for(var tag in list[tc].tags){
                        if(!container.find(function(t) {
                                return t.text === list[tc].tags[tag].text;
                        })){
                            container.push(list[tc].tags[tag]);
                        }
                    }
                }
            };

            $scope.getUsername = function () {
                return userInfoService.getUsername();
            };

            $scope.toggleViewArchived = function () {
                $scope.viewArchived = !$scope.viewArchived;
            }
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
            // console.log($rootScope.timezone);
            $scope.eventLabel = function (event) {
                if (event.date) {
                    if (event.date.type && event.date.type === "fixed") {
                        if (event.date.dateString) {
                            return event.date.dateString;
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
                                    return "Relative to vaccination # " + (rule.relativeTo.id + 1);
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
                $scope.entityChangeLog[tp.id] = true;
                $scope.tcFilter.wft = 'ALL';
                $scope.tpTags = [];
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

            $scope.initSoftware = function () {
                var d = $q.defer();
                TestDataService.loadSoftware().then(function (data) {
                        $scope.software = data;
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

            $scope.quickV = {
                running : false,
                validationReport : {},
                error : false
            };

            $scope.exec = function (sw, tc) {
                var config = { software : sw.id, date : new Date().toLocaleDateString('en-US')};
                $scope.quickV.running = true;
                $scope.quickV.validationReport = {};
                $scope.quickV.error = false;
                $scope.mainView = 'report';

                ExecutionService.runTc(tc, config).then(function (result) {
                    if(result.status){
                        $scope.quickV.validationReport = result.report;
                    }
                    else {
                        $scope.quickV.error = true;
                    }
                    $scope.quickV.running = false;
                });
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
                $scope.FITS_SERVER.loadTPSByAccess(EntityService.access.WRITE).then(function (data) {
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

            $scope.loadViewTestCases = function () {
                var d = $q.defer();
                $scope.FITS_SERVER.loadTPSByAccess(EntityService.access.READ_ONLY).then(function (data) {
                    if(data.status){
                        $scope.vTps = data.obj;
                        d.resolve(true);
                    }
                    else {
                        d.resolve(false);
                    }
                });
                return d.promise;
            };

            $scope.loadArchived = function () {
                var d = $q.defer();
                $scope.FITS_SERVER.loadTPSByAccess(EntityService.access.ARCHIVED).then(function (data) {
                    if(data.status){
                        $scope.archivedTps = data.obj;
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
                    $scope.mainView = 'dashboard';
                    $scope.selectedEvent = ev;
                    $scope.selectedForecast = null;
                    $scope.patientSelected = false;
                    $scope.selectedType = "evt";

                    // View
                    $scope.subview = $scope.vOnly() ? "" :"EditEventData.html";
                    $rootScope.$emit('vp_clear', true);
                    waitingDialog.hide();
                }, 0);
            };

            $scope.selectForecast = function (f) {
                $timeout(function () {
                    // Selection
                    $scope.mainView = 'dashboard';
                    $scope.selectedForecast = f;
                    $scope.selectedEvent = null;
                    $scope.selectedType = "fc";
                    $scope.patientSelected = false;
                    // View
                    $scope.subview = $scope.vOnly() ? "" :"EditForecastData.html";
                    waitingDialog.hide();
                }, 0);
            };

            $scope.filterWF = function (wft) {

            };

            $scope.openTP = function (tp, vOnly) {
                PopUp.start("Opening Test Plan...");
                $scope.tcFilter.wft = 'ALL';
                $scope.FITS_SERVER.loadTestPlan(tp.id).then(function (data) {
                    if(data.status){
                        var tpObj = JSON.parse(JSON.stringify(data.obj));
                        $scope.entityUtils.sanitizeTP(tpObj);
                        $timeout(function () {
                            $scope.wholeTP = tpObj;
                            $scope.viewOnly = vOnly;
                            $scope.selectTP(tpObj);
                            $scope.updateTags(tpObj);
                            $timeout(function () {
                                PopUp.stop();
                            },100);
                        },500);
                    } else {
                        $timeout(function () {
                            PopUp.stop();
                        },100);
                    }
                });
            };

            $scope.selectTP = function (tp,skip) {
                $scope.warning(skip).then(function () {
                    $timeout(function () {
                        $scope.mainView = 'dashboard';
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
                        $scope.subview = $scope.vOnly() ? "viewTP.html" :"EditTestPlanData.html";
                        waitingDialog.hide();
                    }, 0);
                });
            };

            $scope.hasBackUp = function (tc) {
                return tc && $scope.tcBackups.hasOwnProperty(tc.id);
            };

            $scope.vOnly = function () {
               return $scope.viewOnly;
            };

            $scope.selectTC = function (tc,skip,goToSummary) {
                if($rootScope.blockTree)
                    return;

                $scope.warning(skip || tc === $scope.selectedTC).then(function () {
                    $timeout(function () {
                        $scope.mainView = 'dashboard';
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
                        $scope.subview = $scope.vOnly() ? "viewTC.html" : "EditTestPlanMetadata.html";
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
                    $scope.mainView = 'dashboard';
                    $scope.selectedEvent = null;
                    $scope.selectedForecast = null;
                    $scope.patientSelected = true;
                    $scope.subview = $scope.vOnly() ? "" : "EditPatientInformation.html";
                    waitingDialog.hide();
                }, 0);
            };


            $scope.selectTG = function (tg,skip) {
                if($rootScope.blockTree)
                    return;

                $scope.warning(skip).then(function () {
                    $timeout(function () {
                        $scope.mainView = 'dashboard';
                        DataSynchService.register(tg,null,$scope.entityUtils.transformTG);
                        // Selection
                        $scope.selectedEvent = null;
                        $scope.selectedForecast = null;
                        $scope.selectedTG = tg;
                        $scope.selectedTC = null;
                        $scope.selectedType = "tg";
                        $scope.patientSelected = false;

                        // View
                        $scope.subview = $scope.vOnly() ? "viewTG.html" : "EditTestGroupMetadata.html";
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

            $scope.switchWorkflow = function (x) {
                $scope.tcFilter.wft = x;
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
                wft : 'FINAL',
                tags : [],
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

            $scope.filterList = function (list) {
                if(list && Array.isArray(list) && list.length > 0){
                    var wf = $filter('workflow') (list, $scope.tcFilter.wft);
                    var tg = $filter('tags') (wf, $scope.tcFilter.tags);
                    return $scope.filterActive($scope.tcFilter) ? $filter('tcFilter')(wf, $scope.tcFilter) : tg;
                }
                else {
                    return [];
                }
            };

            $scope.filterEntity = function (obj,type) {
                if(type === $scope.eService.type.TEST_PLAN) {
                    console.log("TP");
                    var acc = [];
                    _.forEach(obj.testCaseGroups, function (group) {
                        var gtc = $scope.filterEntity(group, $scope.eService.type.TEST_CASE_GROUP);
                        if(gtc){
                            acc = acc.concat(gtc);
                        }
                    });
                    var tcl = $scope.filterEntity(obj.testCases);
                    return acc.concat(tcl);
                }
                else if(type === $scope.eService.type.TEST_CASE_GROUP) {
                    console.log("TG");
                    return $scope.filterEntity(obj.testCases);
                }
                else {
                    console.log("L");
                    return $scope.filterList(obj);
                }
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

            $scope.isSelectedEvv = function () {
                return $scope.subview === "EditEventData.html";
            };

            $scope.isSelectedFcv = function () {
                return $scope.subview === "EditForecastData.html";
            };

            $scope.isSelectedPtv = function () {
                return $scope.subview === "EditPatientInformation.html";
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

            $scope.lastOpen = null;

            $scope.cleanUpWorkSpace = function () {
                DataSynchService.clear();
                $scope.entityChangeLog = {};
                $scope.selectedEvent = null;
                $scope.selectedForecast = null;
                $scope.lastOpen = $scope.selectedTP;
                $scope.selectedTP = null;
                $scope.selectedTC = null;
                $scope.selectedTG = null;
                $scope.selectedType = "";
                $scope.selectTPTab(0);
            };

            $scope.closeTestPlanEdit = function () {

                if($scope.workSpaceChanges()){
                    var modal = $modal.open({
                        templateUrl: 'ExitTab.html',
                        controller: 'ExitTabCtrl',
                        backdrop : 'static',
                        keyboard : false
                    });

                    modal.result.then(function (){

                    }, function () {
                        $scope.closeTP();
                    });
                }
                else {
                    $scope.closeTP();
                }

            };

            $scope.closeTP = function () {
                $scope.loading = true;
                DataSynchService.clear();
                $scope.loadTestCases().then(function (a) {
                    $scope.loadViewTestCases().then(function (a) {
                        $scope.loadArchived().then(function (a) {
                            $scope.loading = false;
                            $scope.error = null;
                            $scope.cleanUpWorkSpace();
                        });
                    });
                });
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
                $scope.mainView = 'import';
            };

            $scope.goToDash = function () {
                $scope.mainView = 'dashboard';
            };

            $scope.$watch('mainView',function () {
                if($scope.mainView === 'export')
                    $rootScope.blockTree = true;
                else
                    $rootScope.blockTree = false;
            });

            $scope.goToExportView = function () {
                $scope.mainView = 'export';
            };

            openMenu = function($mdMenu, ev) {
                originatorEv = ev;
                $mdMenu.open(ev);
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
                    }, function(){
                    return !$scope.vOnly();
                }]];

            $scope.forecastCM = [
                ['Delete Forecast',
                    function ($itemScope) {
                        var id = $itemScope.$index;
                        $scope.selectedTC.forecast.splice(id, 1);
                        $scope.selectTC($scope.selectedTC,true);
                    }, function(){
                    return !$scope.vOnly();
                }]];

            $scope.tpCM = [

                ['Add Test Case Group',
                    function ($itemScope) {
                        var tp = $itemScope.tp;
                        var tcg = TestObjectFactory.createGRP(tp.id);
                        $scope.entityChangeLog[tcg.id] = true;
                        tp.testCaseGroups.push(tcg);
                        //$scope.saveTG(tcg);
                    },function(){
                    return !$scope.vOnly();
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
                    }, function(){
                    return !$scope.vOnly();
                }],
                ['Import Test Case',
                    function () {
                        $scope.importButton();
                    }, function(){
                    return !$scope.vOnly();
                }]
            ];

            $scope.tags = function () {
                var tags = [];
                _.forEach($scope.wfTag, function (tag) {
                    tags.push([tag.details, function ($itemScope) {
                        console.log(tag);
                        var grp = $itemScope.group;
                        console.log(grp);
                        _.forEach(grp.testCases, function (tc) {
                            tc.workspaceTag = tag.code;
                        });
                    }]);
                });
                return tags;
            };


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
                    }, function(){
                    return !$scope.vOnly();
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

                    },
                    function(){
                        return !$scope.vOnly();
                    }
                ]
            ];




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
                    }, function(){
                    return !$scope.vOnly();
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
                    }, function(){
                    return !$scope.vOnly();
                }]];


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
                // TestObjectUtil.sanitizeDates(tc);
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

            $scope.testForm = function () {
              var form = document.createElement("form");

              form.action = $rootScope.api('api/xxx');
              form.method = "POST";
              form.target = "_target";
              form.style.display = 'none';


              var input = document.createElement('input');
              input.type = 'hidden';
              input.name = 'clazz';
              input.value = 'gov.nist.healthcare.cds.tcamt.controller.Stub';
              form.appendChild(input);

              var input2 = document.createElement('input');
              input2.type = 'hidden';
              input2.name = 'json';
              input2.value = JSON.stringify({ 'x' : 'xVal'});
              form.appendChild(input2);

              document.body.appendChild(form);
              form.submit();

            };

            $scope.export = function (format) {
                if ($scope.entityUtils.inSynch($scope.selectedTC)) {
                    var form = document.createElement("form");

                    form.action = $rootScope.api('api/testcase/export/tc/'+format+'/'+$scope.selectedTC.id);
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

            $scope.sharePanel = function (tp) {
                $scope.exit = $modal.open({
                    templateUrl: 'SharePanel.html',
                    controller: 'SharePanelCtrl',
                    resolve: {
                        tp : function () {
                            return tp;
                        }
                    }
                });
            };

            // --------------------------------------------------------------------------------------------------------

            $scope.cloneTestPlan = function (tp) {
                $http.post("api/testplan/"+tp.id+"/clone").success(function (response) {
                    var data = response;
                    $scope.entityUtils.sanitizeTP(data);
                    var notification = {
                        severity :  EntityService.severity.SUCCESS,
                        message : "Test Plan Cloned"
                    };

                    $scope.tps.push(data);
                    $scope.notify(notification);

                }).error(function () {
                    var notification = {
                        severity :  EntityService.severity.ERROR,
                        message : "Failed to clone test plan"
                    };

                    $scope.notify(notification);
                });
            };

            $scope.initTestCases = function () {
                if (userInfoService.isAuthenticated()) {
                    $scope.loading = true;
                    DataSynchService.clear();
                    $scope.loadTestCases().then(function (a) {
                        $scope.loadViewTestCases().then(function (a) {
                            $scope.loadArchived().then(function (a) {
                                $scope.initEnums().then(function (b) {
                                    $scope.initSoftware().then(function (b) {
                                        $scope.loadVaccines().then(function (c) {
                                            $scope.loading = false;
                                            $scope.error = null;
                                        });
                                    });
                                });
                            });
                        });
                    });
                }
            };

            $scope.archiveTestPlan = function (tp) {
                $http.post("api/testplan/"+tp.id+"/archive").success(function (response) {
                    var data = response;
                    var notification = {
                        severity :  EntityService.severity.SUCCESS,
                        message : "Test Plan Archived"
                    };

                    var idx = $scope.tps.findIndex(function (elm) {
                        return elm.id === data.id;
                    });
                    if(idx !== -1) {
                        $scope.tps.splice(idx, 1);
                    }
                    $scope.archivedTps.push(data);
                    $scope.notify(notification);

                }).error(function () {
                    var notification = {
                        severity :  EntityService.severity.ERROR,
                        message : "Failed to archive test plan"
                    };

                    $scope.notify(notification);
                });
            };

            $scope.unArchiveTestPlan = function (tp) {
                $http.post("api/testplan/"+tp.id+"/unarchive").success(function (response) {
                    var data = response;
                    var notification = {
                        severity :  EntityService.severity.SUCCESS,
                        message : "Test Plan Restored"
                    };

                    var idx = $scope.archivedTps.findIndex(function (elm) {
                        return elm.id === data.id;
                    });

                    if(idx !== -1) {
                        $scope.archivedTps.splice(idx, 1);
                    }
                    $scope.tps.push(data);
                    $scope.notify(notification);
                }).error(function () {
                    var notification = {
                        severity :  EntityService.severity.ERROR,
                        message : "Failed to restore test plan"
                    };

                    $scope.notify(notification);
                });
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
                PopUp.stop();
                var tp = result.testPlan;
                if(tp){
                    $scope.entityUtils.sanitizeTP(tp);
                    $scope.selectTP(tp);
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
                PopUp.stop();

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

            $rootScope.$on('start_import',function (event) {
                console.log("START IMPORT");

            });

            $rootScope.$on('end_import',function (event) {
                console.log("END IMPORT");
                PopUp.stop();
            });

            $scope.mainView = 'dashboard';

            $rootScope.$on('entity_saved', function (event, entity, transform, type) {
                DataSynchService.save(transform);
                var treeEntity = QueryService.get($scope.selectedTP, type, entity.id);
                console.log("SAVED *");
                console.log("T : "+type);
                console.log(treeEntity);
                console.log(entity);
                console.log("--");

                if(entity){
                    entity._changed = false;
                    delete entity._local;
                    $scope.hasIncomplete = entity.hasOwnProperty("runnable") ? !entity.runnable : false;
                    $scope.entityChangeLog[entity.id] = false;
                    $scope.tcBackups[entity.id] = angular.copy(entity);
                }
                if(treeEntity){
                    treeEntity._changed = false;
                    delete treeEntity._local;
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

angular.module('tcl').controller('SharePanelCtrl',
    function ($scope, $uibModalInstance, tp, FITSBackEnd, EntityUtilsService) {
        $scope.viewers = tp.viewers;
        $scope.visibility = tp.public;
        $scope.share = function () {
            FITSBackEnd.shareTestPlan(tp.id, $scope.userId).then(function (result) {
                EntityUtilsService.notify(result);
                if(result.status){
                    tp.viewers.push($scope.userId);
                }
            });
        };

        $scope.unshare = function (index) {
            FITSBackEnd.unshareTestPlan(tp.id, tp.viewers[index]).then(function (result) {
                EntityUtilsService.notify(result);
                if(result.status){
                    tp.viewers.splice(index,1);
                }
            });
        };
        
        $scope.changeVisibility = function (bool) {
            FITSBackEnd.makePublic(tp.id, bool).then(function (result) {
                EntityUtilsService.notify(result);
                if(result.status){
                    tp.public = bool;
                }
            });
        }
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
