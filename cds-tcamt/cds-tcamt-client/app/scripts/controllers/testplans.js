/**
 * Created by Jungyub on 5/12/16
 */

angular.module('tcl').filter('vaccine', function () {
    return function (items, str) {
        if (!items || !items.length) {
            return;
        }
        return items.filter(function (item) {
            if (!str || str === "") return true;
            var s = str.toLowerCase();
            return item.vx.name.toLowerCase().includes(s) || item.vx.cvx.includes(s);
        });
    };
});

angular.module('tcl').filter('groupEvents', function () {
    return _.memoize(function (items) {
            if (!items || !items.length) {
                return;
            }
            return _.groupBy(items, function (item) {
                return item.vaccination.administred ? item.vaccination.administred.name : "new";
            });
        },
        function (items) {
            if (!items || !items.length) {
                return "x";
            }
            return angular.toJson(items);
        }
    )
});

angular.module('tcl').filter('groupBy', function ($parse) {
    return _.memoize(function (items, field) {
        if (!items || !items.length) {
            return;
        }
        var getter = $parse(field);
        return _.groupBy(items, function (item) {
            var g = getter(item);
            return g ? g !== '' ? g : 'Ungrouped' : 'Ungrouped';
        });
    }, function (items, field) {
        if (!items || !items.length) {
            return "x";
        }
        return items.reduce(function (acc, item) {
            return acc + item.id + item.group + '-';
        });
    });
});

angular.module('tcl').filter('vaccineEpt', function () {
    return function (items, str) {
        if (!items || !items.length) {
            return;
        }
        return items.filter(function (item) {
            if (!str || str === "") return false;
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
        return items.filter(function (item) {
            if (!str || str === "") return true;
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
        return items.filter(function (item) {
            if (!str || str === "") return false;
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
        return items.filter(function (item) {
            if (!usp) return true;
            return item.group;
        });
    };
});

angular.module('tcl').filter('testcase', function () {
    return function (items, str) {
        if (!items || !items.length) {
            return;
        }
        return items.filter(function (item) {
            if (!str || str === "") return true;
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

            if (!groups || groups.length === 0) return true;
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
                metaData: false,
                definition: true,
                tpList: true,
                tpDetails: false
            };
            $scope.testCases = [];
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
                    list: [],
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

            $scope.dateTypeChange = function (tc) {
                $scope.exit = $modal.open({
                    templateUrl: 'DTChange.html',
                    controller: 'DateCtrl'
                });

                $scope.exit.result.then(function () {
                    tc.dateType = tc._dateType;
                    if (tc.dateType === 'FIXED') {
                        tc.evalDate = TestObjectFactory.createFD();
                        tc.patient.dob = TestObjectFactory.createFD();
                        for (var i = 0; i < $scope.selectedTC.events.length; i++) {
                            var ev = $scope.selectedTC.events[i];
                            if (ev[ev._type].date) {
                                ev[ev._type].date = TestObjectFactory.createFD();
                            }
                        }
                        for (var j = 0; j < $scope.selectedTC.forecast.length; j++) {
                            var fc = $scope.selectedTC.forecast[i];
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
                    }
                    else if (tc.dateType === 'RELATIVE') {
                        tc.evalDate = TestObjectFactory.createREVD();
                        tc.patient.dob = TestObjectFactory.createRDOB();
                        for (var i = 0; i < $scope.selectedTC.events.length; i++) {
                            var ev = $scope.selectedTC.events[i];
                            if (ev[ev._type].date) {
                                ev[ev._type].date = TestObjectFactory.createRD();
                            }
                        }
                        for (var j = 0; j < $scope.selectedTC.forecast.length; j++) {
                            var fc = $scope.selectedTC.forecast[i];
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
                    }

                }, function () {

                    tc._dateType = tc.dateType;

                });
            };

            $scope.eventLabel = function (event) {
                if (event.vaccination.date) {
                    if (event.vaccination.date.type && event.vaccination.date.type === "fixed") {
                        if (event.vaccination.date.date) {
                            return $filter('date')(event.vaccination.date.date, "MM/dd/yyyy");
                        }
                        else {
                            return 'Fixed Date';
                        }

                    }
                    else {
                        if (event.vaccination.date.type && event.vaccination.date.rules && event.vaccination.date.rules.length > 0) {
                            var rule = event.vaccination.date.rules[0];
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
                $scope.selectTP(tp);
            };

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
                        console.log(err);
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
                        console.log(err);
                        d.resolve(false);
                    });
                return d.promise;
            };

            $scope.loadTestCases = function () {
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

            $scope.selectEvent = function (e) {
                // waitingDialog.show('Opening Event', {
                // 	dialogSize : 'xs',
                // 	progressType : 'info'
                // });
                $timeout(function () {
                    // Selection
                    $scope.selectedEvent = e;
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
                // waitingDialog.show('Opening Forecast', {
                // 	dialogSize : 'xs',
                // 	progressType : 'info'
                // });
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

            $scope.discardChanges = function (tc) {
                if($scope.tcBackups.hasOwnProperty(tc.id)){
                    $scope.tcBackups[tc.id]._changed = false;

                    if(tc.group !== $scope.tcBackups[tc.id].group){
                        tc.group = $scope.tcBackups[tc.id].group;
                        $scope.switchGroup($scope.selectedTP, tc);
                    }
                    TestObjectUtil.synchronize(tc.id,$scope.testCases,$scope.tcBackups[tc.id]);
                }
            };

            $scope.treeOptions = {
                accept: function (sourceNodeScope, destNodesScope) {
                    return destNodesScope.$parent && destNodesScope.$parent.$modelValue && destNodesScope.$parent.$modelValue.hasOwnProperty("testCases");
                },
                beforeDrop: function (e) {
                    var index = TestObjectUtil.index($scope.testCases, "id", e.source.nodeScope.$modelValue.id);
                    $scope.testCases[index].group = e.dest.nodesScope.$parent.$modelValue.id;

                    $scope.switchGroup($scope.selectedTP, $scope.testCases[index]);
                    $scope.selectTC($scope.testCases[index]);
                    return false;
                }
            };

            $scope.selectTP = function (tp) {
                // waitingDialog.show('Opening Test Plan', {
                // 	dialogSize : 'xs',
                // 	progressType : 'info'
                // });
                $timeout(function () {
                    console.log("SelectTP");
                    // Selection
                    $scope.selectedEvent = null;
                    $scope.selectedForecast = null;
                    $scope.selectedTC = null;
                    $scope.tpTree = [];
                    $scope.patientSelected = false;
                    $scope.grouping = true;
                    $scope.selectedTP = tp;
                    $scope.tpTree.push($scope.selectedTP);
                    $scope.testCases = [];
                    TestObjectUtil.listTC(tp, $scope.testCases);
                    $scope.selectedType = "tp";

                    // View
                    $scope.selectTPTab(1);
                    $scope.subview = "EditTestPlanData.html";
                    waitingDialog.hide();
                }, 0);
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

            $scope.groupName = function (id) {
                if(id && id !== ""){
                    var grp = TestObjectUtil.getGroupByID($scope.selectedTP,id);
                    if(grp) {
                        return grp.name;
                    }
                }
                return "";
            };

            $scope.$watch('selectedTC', function (newValue, oldValue) {
                console.log("W");

                if (!newValue && !TestObjectUtil.index($scope.testCases, "id", oldValue.id)) {
                    console.log("Deleted");
                }
                else if (oldValue !== null && (!newValue || oldValue.id !== newValue.id)) {
                    console.log("Selected TC Changed");
                    console.log("Old Value : ");
                    console.log(oldValue);
                    console.log($scope.testCases);
                    var i = TestObjectUtil.index($scope.testCases, "id", oldValue.id);
                    console.log("Index Of Selected is : " + i);
                    if (~i) {
                        var tc = $scope.testCases[i];
                        if (TestObjectUtil.hashChanged(tc)) {
                            console.log("UNSAVED CHANGED");
                            tc._changed = true;
                            if ($scope.remember.bool) {
                                if ($scope.remember.choice === "save") {
                                    console.log("Should Save");
                                    $scope.saveAllChangedTestPlans(tc, $scope.selectedTP)
                                }
                                else if ($scope.remember.choice === "discard") {
                                    console.log("Discarding");
                                    $scope.discardChanges(tc);
                                }
                            }
                            else {
                                $scope.exit = $modal.open({
                                    templateUrl: 'ExitTC.html',
                                    controller: 'ExitCtrl',
                                    resolve: {
                                        discard: function () {
                                            return TestObjectUtil.isLocal(tc);
                                        }
                                    }
                                });

                                $scope.exit.result.then(function (response) {
                                    if (response) {
                                        $scope.remember.bool = response.remember;
                                        $scope.remember.choice = response.action;
                                        if (response.action === "save") {
                                            console.log("Should Save");
                                            $scope.saveAllChangedTestPlans(tc, $scope.selectedTP)
                                        }
                                        else if (response.action === "discard") {
                                            console.log("Discarding");
                                            $scope.discardChanges(tc);
                                        }
                                    }
                                }, function () {
                                    console.log("Save Later");
                                });
                            }

                        }
                        else {
                            tc._changed = false;
                        }
                    }
                }
            });

            $scope.getScope = function (id) {
                // var obj = { $$a : "b", $$b : 1, $$c : new Date(), d : "a"};
                // var obj2 =  angular.copy(obj);
                // console.log(obj2);
                console.log("SCOPE");
                console.log(id);
                console.log(angular.element(document.getElementById(id)).scope());
                return angular.element(document.getElementById(id)).scope();
            };

            $scope.selectTC = function (tc) {
                // waitingDialog.show('Opening Test Case', {
                // 	dialogSize : 'xs',
                // 	progressType : 'info'
                // });


                $timeout(function () {
                    if (!tc._changed) {
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
                    waitingDialog.hide();
                }, 0);
            };

            $scope.selectPatient = function () {
                waitingDialog.show('Opening Patient Information', {
                    dialogSize: 'xs',
                    progressType: 'info'
                });
                $timeout(function () {
                    // View
                    $scope.selectedEvent = null;
                    $scope.selectedForecast = null;
                    $scope.patientSelected = true;
                    $scope.subview = "EditPatientInformation.html";
                    waitingDialog.hide();
                }, 0);
            };

            $scope.evalStatusChange = function (evaluation) {
                if (evaluation.status !== 'INVALID') {
                    if (evaluation.hasOwnProperty("reason")) {
                        delete evaluation.reason;
                    }
                }
            };

            $scope.cloneTP = function (tp) {
                var x = TestObjectUtil.cloneEntity(tp);
                x.name = "[CLONE] " + x.name;
                for (var t in x.testCases) {
                    TestObjectUtil.markWithCLID(x.testCases[t]);
                    TestObjectUtil.sanitizeEvents(x);
                }
                TestObjectUtil.sanitizeDates(x);
                $scope.tps.push(x);
                $scope.selectTP(x);
            };

            $scope.isSelectedTC = function (t) {
                return $scope.selectedTC && t && t.id === $scope.selectedTC.id;
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
                $scope.selectTC($scope.selectedTC);
                $scope.tabs.selectedTabTC = 1;
            };

            $scope.eventCM = [
                ['Delete Event',
                    function ($itemScope) {
                        var ev = $itemScope.ev;
                        var index = ev[ev._type].position;
                        var i = $itemScope.$index;

                        $scope.selectedTC.events.splice(i, 1);
                        if ($scope.selectedTC.dateType === 'RELATIVE') {
                            for (var evt = 0; evt < $scope.selectedTC.events.length; evt++) {
                                var v = $scope.selectedTC.events[evt];
                                if (v && v.vaccination && v.vaccination.date) {
                                    for (var r = 0; r < v.vaccination.date.rules.length; r++) {
                                        console.log("r");
                                        var rule = v.vaccination.date.rules[r];
                                        console.log(rule);
                                        console.log(index);
                                        console.log(rule.relativeTo.id === index);
                                        if (rule && rule.relativeTo && rule.relativeTo.reference && rule.relativeTo.reference === 'dynamic' && rule.relativeTo.id + '' === index + '') {
                                            console.log("ENTER");
                                            v.vaccination.date.rules.splice(r, 1);
                                        }
                                    }
                                }
                            }
                        }
                        for (var e = 0; e < $scope.selectedTC.events.length; e++) {
                            TestObjectUtil.updateEventId($scope.selectedTC.events,$scope.selectedTC.events[e].vaccination.position,e);
                        }
                        $scope.selectTC($scope.selectedTC);
                    }]];

            $scope.forecastCM = [
                ['Delete Forecast',
                    function ($itemScope) {
                        var id = $itemScope.$index;
                        $scope.selectedTC.forecast.splice(id, 1);
                        $scope.selectTC($scope.selectedTC);
                    }]];

            $scope.tpCM = [
                ['Add Test Case',
                    function ($itemScope) {
                        var tp = $itemScope.tp;
                        var tc = TestObjectFactory.createTC(tp.id,"");
                        tp.testCases.push(tc);
                        $scope.testCases.push(tc);
                        $scope.selectTC(tc);
                    }],
                ['Import Test Case',
                    function ($itemScope) {
                        var tp = $itemScope.tp;
                        $scope.selectTP(tp);
                        $scope.selectedTabTP = 1;
                    },
                    function () {
                        return !$scope.isLocal($scope.selectedTP);
                    }],
                ['Add Test Case Group',
                    function ($itemScope) {
                        var tp = $itemScope.tp;
                        var tcg = TestObjectFactory.createGRP(tp.id);
                        tp.testCaseGroups.push(tcg);
                    }]
            ];

            $scope.tgCM = [
                ['Add Test Case',
                    function ($itemScope) {
                        var grp = $itemScope.group;
                        var tc = TestObjectFactory.createTC(grp.testPlan, grp.id);
                        tc.group = grp.id;
                        grp.testCases.splice(0, 0, tc);
                        $scope.testCases.push(tc);
                        $scope.selectTC(tc);
                    }],
                ['Rename Test Case Group',
                    function ($itemScope) {
                        var grp = $itemScope.group;
                        $scope.rename = $modal.open({
                            templateUrl: 'GrpName.html',
                            controller: 'GrpNameCtrl',
                            resolve: {
                                name: function () {
                                    return grp.name;
                                }
                            }
                        });

                        $scope.rename.result.then(function (response) {
                            if (response && response.name && response.name !== "") {
                                grp.name = response.name;
                                $scope.saveTG(grp).then(function () {
                                    Notification
                                        .success({
                                            message: "Test Case Group Renamed",
                                            delay: 3000
                                        });
                                },
                                function () {
                                    Notification
                                        .error({
                                            message: "Unable to save renamed group",
                                            delay: 3000
                                        });
                                });
                            }
                        });

                    }],
                ['Delete Test Case Group',
                    function ($itemScope) {
                        var grp = $itemScope.group;
                        var index = TestObjectUtil.index($scope.selectedTP.testCaseGroups, "id", grp.id);
                        $scope.selectedTP.testCaseGroups.splice(index, 1);
                        //TODO Delete TCG BackEnd
                    }]];

            $scope.tcCM = [
                ['Clone Test Case',
                    function ($itemScope) {

                        var obj = $itemScope.tc;
                        var clone = TestObjectUtil.cloneEntity(obj);
                        clone.name = "[CLONE] " + clone.name;
                        TestObjectUtil.sanitizeDates(clone);
                        TestObjectUtil.sanitizeEvents(clone);
                        var list = TestObjectUtil.getList($scope.selectedTP, obj.id);
                        if (list) {
                            var index = list.indexOf(obj);
                            list.splice(index + 1, 0, clone);
                            $scope.testCases.push(clone);
                            $scope.selectTC(clone);
                            console.log(clone);
                        }
                    }],
                ['Delete Test Case',
                    function ($itemScope, $event, modelValue, text, $li) {
                        var tc = $itemScope.tc;
                        var list = TestObjectUtil.getList($scope.selectedTP, tc.id);
                        if (list) {
                            var index = list.indexOf(tc);
                            if (TestObjectUtil.isLocal(tc)) {
                                list.splice(index, 1);
                                $scope.selectTP($scope.selectedTP);
                                var indexTCL = TestObjectUtil.index($scope.testCases,"id",tc.id);
                                $scope.testCases.splice(indexTCL, 1);
                            }
                            else {
                                $http.post('api/testcase/' + tc.id + '/delete').then(function (r) {
                                        list.splice(index, 1);
                                        $scope.selectTP($scope.selectedTP);
                                        var indexTCL = TestObjectUtil.index($scope.testCases,"id",tc.id);
                                        $scope.testCases.splice(indexTCL, 1);

                                        Notification
                                            .success({
                                                message: "Test Case Deleted",
                                                delay: 3000
                                            });
                                    },
                                    function (r) {
                                        Notification
                                            .error({
                                                message: "Error Deleting",
                                                delay: 3000
                                            });
                                    });
                            }
                        }
                    }]];

            $scope.fileChange = function (files) {

                console.log("change");
                console.log(files[0].type);
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
                            $scope.sfile = "File should be Excel Spreadsheet";
                            $scope.fileErr = true;
                        });
                    }
                }

            };

            $scope.sanitizeTestCase = function (tc) {
                TestObjectUtil.sanitizeDates(tc);
                TestObjectUtil.sanitizeEvents(tc);
                tc._dateType = tc.dateType;
            };

            $scope.uploadNIST = function () {
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
                                transformRequest: angular.identity,
                                headers: {
                                    'Content-Type': undefined
                                }
                            })
                        .success(
                            function (data) {
                                console.log(data);
                                if (data.status) {
                                    $scope.sanitizeTestCase(data.imported);
                                    $scope.selectedTP.testCases.push(data.imported);
                                    $scope.importing = false;
                                    Notification
                                        .success({
                                            message: "TestCase Imported",
                                            delay: 3000
                                        });
                                } else {
                                    $scope.importing = false;
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
                                    $scope.control.error.list.push(erObj);
                                    Notification
                                        .error({
                                            message: "Error While Importing",
                                            delay: 3000
                                        });
                                }

                                $scope.sfile = "browse";
                                $scope.sfileO = null;

                            }).error(function (data) {
                        $scope.importing = false;
                        Notification.error({
                            message: "Error While Importing",
                            delay: 3000
                        });
                        $scope.sfile = "browse";
                        $scope.sfileO = null;
                    });
                }
            };


            $scope.$watch('importing', function (newValue) {
                if (newValue === false) {
                    if ($scope.impDiag)
                        $scope.impDiag.close({});
                }
                else if (newValue === true) {
                    $scope.impDiag = $modal.open({
                        templateUrl: 'ImportLoading.html',
                        controller: 'ConfirmTestPlanDeleteCtrl',
                        resolve: {
                            testplanToDelete: function () {
                                return null;
                            },
                            tps: function () {
                                return $scope.tps;
                            }
                        }
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
                                    TestObjectUtil.sanitizeDates(tp);
                                    for (var tc = 0; tc < tp.testCases.length; tc++) {
                                        tp.testCases[tc]._dateType = tp.testCases[tc].dateType;
                                        TestObjectUtil.sanitizeEvents(tp.testCases[tc]);
                                        TestObjectUtil.hash(tp.testCases[tc]);
                                    }
                                    for (var tg = 0; tg < tp.testCaseGroups.length; tg++) {
                                        for (var tci = 0; tci < tp.testCaseGroups[tg].testCases.length; tci++) {
                                            tp.testCaseGroups[tg].testCases[tci]._dateType = tp.testCaseGroups[tg].testCases[tci].dateType;
                                            TestObjectUtil.sanitizeEvents(tp.testCaseGroups[tg].testCases[tci]);
                                        }
                                        TestObjectUtil.hash(tp.testCaseGroups[tg].testCases);
                                    }

                                    Object.assign($scope.selectedTP,tp);
                                    $scope.selectTP($scope.selectedTP);

                                    Notification
                                        .success({
                                            message: "TestCases Imported",
                                            delay: 3000
                                        });
                                } else {
                                    Notification
                                        .error({
                                            message: "Error While Importing",
                                            delay: 3000
                                        });
                                }
                                $scope.sfile = "browse";
                                $scope.sfileO = null;
                                $scope.importing = false;
                            }).error(function (data) {
                        $scope.importing = false;
                        Notification.error({
                            message: "Error While Importing",
                            delay: 3000
                        });
                        $scope.sfile = "browse";
                        $scope.sfileO = null;
                    });
                }
            };


            $scope.exportNIST = function () {
                if (!TestObjectUtil.isLocal($scope.selectedTC) && !TestObjectUtil.hashChanged($scope.selectedTC)) {
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
                        message: "Your TestCase has unsaved changes please save before exporting",
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
                return TestObjectUtil.isLocal(tp);
            };

            $scope.prefill = function (list, x) {
                var groups = $scope.getGroups(x);
                if (groups.length === 0) {
                    var eval = TestObjectFactory.createEvaluation();
                    var mp = $scope.getMapping(x);
                    console.log(x);
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
                var index = TestObjectUtil.index(list, "id", tc.id);
                if (tc.group !== "") {
                    var group = TestObjectUtil.getGroupByID(tp, tc.group);
                    if (group) {
                        list.splice(index, 1);
                        group.testCases.push(tc);
                        var scope = $scope.getScope('gr-' + group.id);
                        console.log(scope);
                        scope.expand();
                        $timeout(function () {
                            $scope.scrollTo('tc-' + tc.id);
                        }, 1000);

                    }
                }
                else {
                    console.log("ELSE");
                    list.splice(index, 1);
                    tp.testCases.push(tc);
                }

                $timeout(function () {
                    $scope.scrollTo('tc-' + tc.id);
                }, 1000);
            };

            $scope.scrollTo = function (id) {
                var old = $location.hash();
                $location.hash(id);
                $anchorScroll();
                $location.hash(old);
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


            $scope.saveTG = function (tg) {
                var deferred = $q.defer();
                TestObjectSynchronize.syncTG(tg).then(
                    function (result) {
                        delete result.tg.testCases;
                        //TestObjectUtil.sanitizeDates(result.tg);
                        Object.assign(tg, result.tg);
                        TestObjectSynchronize.updateTestGroupId(tg);
                        Notification.success({
                            message: result.message,
                            delay: 3000
                        });
                        $scope.loading = false;
                        deferred.resolve({
                            status: true,
                            message: "TestCase Saved",
                            obj: tg
                        });
                    },
                    function (result) {
                        if (result.hasOwnProperty("code") && result.code === 'LOCAL') {
                            var index = TestObjectUtil.index($scope.tps, "id", tg.testPlan);
                            var tp = $scope.tps[index];
                            $scope.saveTP(tp,false).then(
                                function () {
                                    $scope.saveTG(tg).then(function (result) {
                                            deferred.resolve(result);
                                        },
                                        function (result) {
                                            deferred.reject(result);
                                        });
                                },
                                function (result) {
                                    deferred.reject(result);
                                }
                            );
                        }
                        else if (result.response && result.response.hasOwnProperty("errors")) {
                            $scope.control.error.isSet = true;
                            var erObj = {
                                action: 'SAVE_TG',
                                obj: tg,
                                errors: []
                            };
                            erObj.errors = result.response.errors;
                            $scope.control.error.list.push(erObj);
                            Notification.error({
                                message: result.message,
                                delay: 3000
                            });
                            deferred.reject({
                                status: false
                            });
                        }
                        $scope.loading = false;
                    }
                );
                return deferred.promise;
            };

            $scope.saveTP = function (tp,deep) {
                var deferred = $q.defer();
                TestObjectSynchronize.syncTP(tp).then(
                    function (result) {
                        delete result.tp.testCases;
                        delete result.tp.testCaseGroups;

                        TestObjectUtil.sanitizeDates(result.tp);
                        Object.assign(tp, result.tp);
                        TestObjectSynchronize.updateTestPlanId(tp);
                        if(deep){
                            var tcs = [];
                            TestObjectUtil.listTC(tp,tcs);
                            for(var tc = 0; tc < tcs.length; tc++){
                                if(tcs[tc]._changed){
                                    $scope.saveTC(tcs[tc]);
                                }
                            }
                        }
                        Notification.success({
                            message: result.message,
                            delay: 3000
                        });
                        $scope.loading = false;
                        deferred.resolve({
                            status: true,
                            message: "TestCase Saved",
                            obj: tp
                        });
                    },
                    function (result) {
                        if (result.response && result.response.hasOwnProperty("errors")) {
                            $scope.control.error.isSet = true;
                            var erObj = {
                                action: 'SAVE_TP',
                                obj: tp,
                                errors: []
                            };
                            erObj.errors = result.response.errors;
                            $scope.control.error.list.push(erObj);

                        }
                        Notification.error({
                            message: result.message,
                            delay: 3000
                        });
                        $scope.loading = false;
                        deferred.reject({
                            status: false
                        });
                    }
                );
                return deferred.promise;
            };

            $scope.saveTC = function (tc) {
                var deferred = $q.defer();
                var where;
                var id;
                if (tc.group && tc.group !== "") {
                    where = 'tg';
                    id = tc.group;
                }
                else {
                    where = 'tp';
                    id = tc.testPlan;
                }
                TestObjectSynchronize.syncTC(where, id, tc).then(
                    function (result) {
                        TestObjectUtil.updateHash(result.tc);
                        tc._changed = false;
                        var actual = TestObjectUtil.synchronize(tc.id, $scope.testCases, result.tc);
                        tc = actual;
                        Notification.success({
                            message: result.message,
                            delay: 3000
                        });
                        $scope.loading = false;
                        deferred.resolve({
                            status: true,
                            message: "TestCase Saved",
                            obj: actual
                        });
                    },
                    function (result) {

                        if (result.hasOwnProperty("code") && result.code === 'LOCAL') {
                            console.log("LOCAL - WHERE : " + where);
                            console.log("LOCAL - ID : " + id);
                            var index = TestObjectUtil.index($scope.tps, "id", tc.testPlan);
                            var tp = $scope.tps[index];
                            console.log(tp);
                            console.log("TP ID " + tp.id);
                            console.log("TCP ID " + tc.testPlan);
                            if (where === 'tp') {
                                $scope.saveTP(tp,false).then(
                                    function () {
                                        $scope.saveTC(tc).then(function (result) {
                                                deferred.resolve(result);
                                            },
                                            function (result) {
                                                deferred.reject(result);
                                            });
                                    },
                                    function (result) {
                                        deferred.reject(result);
                                    }
                                );
                            }
                            else if (where === 'tg') {
                                var group = TestObjectUtil.getTCGroup(tp, tc.id);
                                if (group) {
                                    $scope.saveTG(group).then(
                                        function () {
                                            $scope.saveTC(tc).then(function (result) {
                                                    deferred.resolve(result);
                                                },
                                                function (result) {
                                                    deferred.reject(result);
                                                });
                                        },
                                        function (result) {
                                            deferred.reject(result);
                                        }
                                    );
                                }
                            }
                        }
                        else if (result.response.hasOwnProperty("errors")) {
                            $scope.control.error.isSet = true;
                            var erObj = {
                                action: 'SAVE_TC',
                                obj: tc,
                                errors: []
                            };
                            for (var i = 0; i < result.response.errors.length; i++) {
                                erObj.errors.push({
                                    path: $scope.sanitizeErrorPath(result.response.errors[i].path),
                                    message: result.response.errors[i].message
                                });
                            }
                            //$scope.control.error.list = [];
                            $scope.control.error.list.push(erObj);
                            Notification.error({
                                message: result.message,
                                delay: 3000
                            });
                            deferred.reject({
                                status: false
                            });
                            $scope.loading = false;
                        }
                    }
                );
                return deferred.promise;
            };

            $scope.saveAllChangedTestPlans = function (stc, stp) {
                $scope.loading = true;
                $scope.control.error.isSet = false;
                $scope.control.error.obj = [];

                if (!stc && stp) {
                    $scope.saveTP(stp,true);
                }
                else if (stc) {
                    $scope.saveTC(stc);
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
        }
    );

angular.module('tcl').controller('ConfirmTestPlanDeleteCtrl',
    function ($scope, $uibModalInstance, testplanToDelete, tps, $http) {
        $scope.testplanToDelete = testplanToDelete;
        $scope.loading = false;
        $scope.deleteTestPlan = function () {
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
                $http.post('api/testplan/' + $scope.testplanToDelete.id + '/delete')
                    .then(function (response) {
                            var id = $scope.getIndex(tps, testplanToDelete.id);
                            if (~id) {
                                tps.splice(id, 1);
                            }

                            $scope.loading = false;
                            $uibModalInstance.dismiss('cancel');
                            $rootScope.msg().text = "testplanDeleteSuccess";
                            $rootScope.msg().type = "success";
                            $rootScope.msg().show = true;
                        },
                        function (error) {
                            $scope.error = error;
                            $scope.loading = false;
                            $uibModalInstance.dismiss('cancel');
                            $rootScope.msg().text = "testplanDeleteFailed";
                            $rootScope.msg().type = "danger";
                            $rootScope.msg().show = true;
                        });
            }
        };

        $scope.getIndex = function (l, id) {
            for (var i = 0; i < l.length; i++) {
                if (l[i].id === id) {
                    return i;
                }
            }
            return -1;
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
            console.log(num);
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
