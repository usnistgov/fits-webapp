'use strict';


angular.module('tcl').filter('evFilter', function () {
    return function (input, f, active) {
        if (!input || !input.length) {
            return;
        }
        if (!active) {
            return input;
        }
        return input.filter(function (elm) {
            var complete = (!f.eCm || (elm._events.cmp === 100)) && (!f.enCm || (elm._events.cmp < 100));
            var correctness = (!f.eCs || (elm._events.crt === 100)) && (!f.eCe || elm._events.f > 0) && (!f.eCw || elm._events.w > 0);
            return complete && correctness;
        })
    }
});

angular.module('tcl').filter('fcFilter', function () {
    return function (input, f, active) {
        if (!input || !input.length) {
            return;
        }
        if (!active) {
            return input;
        }
        return input.filter(function (elm) {
            var complete = (!f.fCm || (elm._fc.cmp === 100)) && (!f.fnCm || (elm._fc.cmp < 100));
            var correctness = (!f.fCs || (elm._fc.crt === 100)) && (!f.fCe || elm._fc.f > 0) && (!f.fCw || elm._fc.w > 0);
            var detections = (!f.fCr.e || elm._failures.EarliestDate) && (!f.fCr.r || elm._failures.RecommendedDate) && (!f.fCr.d || elm._failures.PastDueDate) && (!f.fCr.l || elm._failures.CompleteDate);
            return complete && correctness && detections;
        })
    }
});

angular.module('tcl').filter('execSuccess', function () {
    return function (input, exec, active) {
        if (!input || !input.length) {
            return;
        }
        if (!active || !exec) {
            return input;
        }
        return input.filter(function (elm) {
            if (elm._s)
                return true;
            return false;
        })
    }
});

/**
 * @ngdoc function
 * @name clientApp.controller:ExecutionCtrl
 * @description
 * # ExecutionCtrl
 * Controller of the clientApp
 */
angular.module('tcl').controller('ExecutionCtrl', function (DataSynchService, EntityService, EntityUtilsService, StatsService, ExecutionService, $modal, $filter, Notification, TestObjectUtil, EntityLoadService, $rootScope, $scope, VaccineService, $http, TestDataService, $timeout, ngTreetableParams, $parse, $q) {
    $scope.tps = [];
    $scope.tpList = [];
    $scope.selectedTC = null;
    $scope.selectedTP = null;
    $scope.tcQueue = [];
    $scope.exec = false;
    $scope.addConfig = false;
    $scope.configs = [];
    $scope.qview = true;
    $scope.hideTcName = true;
    $scope.paused = false;
    $scope.tabs = {
        reportTab: 0
    };
    $scope.vxgs = [];
    $scope.vxm = [];
    $scope.tpLoad = false;
    $scope.eService = EntityService;
    $scope.filterView = false;
    $scope.viewTc = [];
    $scope.filter = {
        queueSearch: "",
        eCm: false,
        fCm: false,
        eCs: false,
        fCs: false,
        eCe: false,
        fCe: false,
        eCw: false,
        fCw: false,
        enCm: false,
        fnCm: false,
        exec: false,
        fCr: {
            e: false,
            r: false,
            d: false,
            l: false
        }
    };
    $scope.main = $rootScope;
    $scope.saved = false;
    $scope.multipleSel = false;
    $scope.selected = [];
    $scope.view = {
        tab: 0
    };
    $scope.savedReports = {};
    $scope.configStub = null;
    $scope.today = new Date();
    $scope.selectedReport = {};
    $scope.assessmentDate = {
        type: 'fixed',
        dateString: new  Date().toLocaleDateString('en-US')
    };
    console.log("DATE STRING "+$scope.assessmentDate.dateString);
    $scope.heigth = {
        'heigth': '100%'
    };
    $scope.tabStyle = $scope.heigth;
    $scope.completion = StatsService.completion;
    $scope.correctness = StatsService.correctness;
    $scope.x = {
        runningId: 0,
        rp: 0
    };
    $scope.dstartf = false;
    $scope.controls = {
        running: false,
        runningId: 0,
        total: 0,
        progress: 0,
        paused: false,
        top: 0,
        abort: false
    };
    $scope.showResults = false;
    $scope.report = {};
    $scope.aggregate = {};
    $scope.nbRelativeTC = 0;
//--------------------------------- FILTER ---------------------
    $scope.tcFilterView = false;
    $scope.tcFilter = {
        example: {
            name: '',
            uid: '',
            runnable: true,
            metaData: {
                version: ''
            }
        },
        changed: false,
        dates: {
            created: {
                position: 'O',
                date: null
            },
            updated: {
                position: 'O',
                date: null
            }
        }
    };

    // VaccineService.load().then(function (data) {
    //         for (var k in data) {
    //             if (data.hasOwnProperty(k))
    //                 $scope[k] = data[k];
    //         }
    //
    //     },
    //     function (err) {
    //
    // });

    $scope.getMapping = function (x) {
        return VaccineService.getMapping($scope.vxm, x);
    };

    $scope.filterList = function (list) {
        if(list && Array.isArray(list) && list.length > 0){
            return $scope.filterActive($scope.tcFilter) ? $filter('tcFilter')(list, $scope.tcFilter) : list;
        }
        else {
            return [];
        }
    };

    $scope.filterEntity = function (obj,type) {
        if(type === $scope.eService.type.TEST_PLAN) {
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
            return $scope.filterEntity(obj.testCases);
        }
        else {
            return $scope.filterList(obj);
        }
    };

    $scope.resetTcFilter = function (f) {
        Object.assign(f, {
            example: {
                name: '',
                uid: '',
                runnable: true,
                metaData: {
                    version: ''
                }
            },
            changed: false,
            dates: {
                created: {
                    position: 'O',
                    date: null
                },
                updated: {
                    position: 'O',
                    date: null
                }
            }
        });
    };
    $scope.filterActive = function (f) {
        return f.changed !== false || f.example.name !== '' || f.example.uid !== '' || f.example.metaData.version !== '' || f.dates.created.date !== null || f.dates.updated.date !== null;
    };

    $scope.resetFilter = function () {
        $scope.filter = {
            queueSearch: "",
            eCm: false,
            fCm: false,
            enCm: false,
            fnCm: false,
            eCs: false,
            fCs: false,
            eCe: false,
            fCe: false,
            eCw: false,
            fCw: false,
            exec: false,
            fCr: {
                e: false,
                r: false,
                d: false,
                l: false
            }
        };
    };

    $scope.csuccess = function (t, b) {
        if (b === true) {
            $scope.filter[t + 'Ce'] = false;
            $scope.filter[t + 'Cw'] = false;
        }
    };

    $scope.compC = function (t, cpm, b) {
        if (b === true) {
            if (cpm) {
                $scope.filter[t + 'nCm'] = false;
            }
            else {
                $scope.filter[t + 'Cm'] = false;
            }
        }
    };

    $scope.cdetection = function (t, b) {
        if (b === true) {
            $scope.filter[t + 'Cs'] = false;
        }
    };

    $scope.filterEngaged = function (filter) {
        return filter.queueSearch !== '' || filter.eCm || filter.fCm || filter.eCs || filter.fCs || filter.eCe || filter.fCe || filter.eCw || filter.fCw ||
            filter.fCr.e || filter.fCr.r || filter.fCr.d || filter.fCr.l || filter.exec || filter.enCm || filter.fnCm;
    };
//--------------------------------- UTILS ----------------------

    $scope.switchTP = function (tpd) {
        $scope.tpLoad = true;
        $http.get('api/testplan/'+tpd.id).then(function (success) {
            $scope.tps = [];
            $scope.tps.push(success.data);
            $scope.tpLoad = false;
            $scope.selectTP(success.data);
        },
        function (error) {

        });
    };

    $scope.asDate = function(str){
        return moment(str, "MM/DD/YYYY", true).format("dddd, MMMM Do YYYY");
    };

    $scope.groupName = function (id) {
        if (id && id !== "") {
            var grp = TestObjectUtil.getGroupByID($scope.selectedTP, id);
            if (grp) {
                return grp.name;
            }
        }
        return "";
    };

    $scope.has = function (x, prop) {
        return x && x.hasOwnProperty(prop);
    };

    $scope.valueForEnum = function (code, enumList) {
        for (var i in enumList) {
            if (enumList[i].code === code) {
                return enumList[i].details;
            }
        }
        return "";
    };

    $scope.eventLabel = function (event) {
        if (!event.date)
            return "";
        if (event.date._type) {
            if (event.date._type === 'fixed')
                return $filter('date')(event.date.fixed.date, "MM/dd/yyyy", 'UTC');
            else if (event.date._type === 'relative')
                return "Relative";
            else
                return "Invalid Date";
        }
        else
            return "";
    };


//--------------------------------- DATA LOADING ---------------------------------
    $scope.loadConfig = function () {
        $http.get("api/exec/configs").then(function (result) {
            $scope.configs = angular.fromJson(result.data);
            // $scope.defaultConfig();
        });
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

    $scope.loadEnums = function () {
        var d = $q.defer();
        TestDataService.loadEnums().then(function (data) {
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

    $scope.loadTestCases = function () {
        EntityLoadService.loadTPSByAccess(EntityService.access.EXEC).then(function (data) {
                if(data.status) {
                    $scope.tpList = data.obj;
                }
            },
            function (err) {

            });
    };

    $scope.loadTPDetails = function () {
        console.log("DDD");
        $http.get('api/exec/short/tps').then(function (result) {
            console.log(result);
            $scope.tpList = result.data;
        },
        function (error) {
            console.log(error);
        });
    };

    $scope.init = function () {
        $scope.loadConfig();
        $scope.loadTPDetails();
        $scope.loadVaccines();
        $scope.loadEnums();
    };


    $rootScope.$on('event:loginConfirmed', function () {
        $scope.init();
    });

//-------------------------------- DRAG AND DROP -------------------------

    $scope.dstart = function (a) {
        $scope.dstartf = a;
    };

    $scope.multiToggle = function () {
        $scope.multipleSel = !$scope.multipleSel;
        $scope.selected = [];
    };
    $scope.select = function (tc) {
        var x = $scope.selected.find(function (item) {
            return item.id === tc.id;
        });
        if (x) {
            $scope.selected = $scope.selected.filter(function (item) {
                return item.id != x.id;
            })
        } else {
            $scope.selected.push(tc);
        }
    };

    $scope.find = function (list, o) {
        return list.find(function (item) {
            return item.id === o.id;
        });
    };

    $scope.drop = function (list, items, index) {
        // if ($scope.multipleSel) {
            if (Array.isArray(items)) {
                var toAdd = [];
                for (var i = 0; i < items.length; i++) {
                    if (!$scope.inQueue(items[i]) && items[i].runnable) {
                        items[i].running = false;
                        toAdd.push(items[i]);
                        if (items[i].dateType === 'RELATIVE') {
                            $scope.nbRelativeTC++;
                        }
                    }
                }

                $scope.tcQueue = $scope.tcQueue.slice(0, index)
                    .concat(toAdd)
                    .concat($scope.tcQueue.slice(index));
            // }
        } else {

            if (items.hasOwnProperty('testCases') || items.hasOwnProperty('testCaseGroups')) {
                $scope.multipleSel = true;
                var listItems = [];
                if (items.hasOwnProperty('testCases')) {
                    listItems = listItems.concat(items.testCases);
                }
                if (items.hasOwnProperty('testCaseGroups')) {
                    for (var g = 0; g < items.testCaseGroups.length; g++) {
                        listItems = listItems.concat(items.testCaseGroups[g].testCases);
                    }

                }
                return $scope.drop($scope.tcQueue, listItems, index);
            }
            else {
                var id = -1;
                for (var j in $scope.tcQueue) {
                    if ($scope.tcQueue[j].id === items.id) {
                        id = j;
                    }
                }

                if (id > -1) {
                    $scope.tcQueue.splice(id, 1);
                    if (index > id)
                        index = index - 1;
                }
                items.running = false;
                $scope.tcQueue.splice(index, 0, items);
                if (items.dateType === 'RELATIVE') {
                    $scope.nbRelativeTC++;
                }
            }
        }
        $scope.multipleSel = false;
        return true;
    };

    $scope.onMoved = function (list) {
        $scope.selected = [];
    };

    $scope.dragMoved = function (index) {

    };

    $scope.inQueue = function (tc) {
        return $scope.tcQueue.find(function (item) {
            return item.id === tc.id;
        });
    };

//------------------------------- NAVIGATION -------------------------

    $scope.isSelectedTC = function (t) {
        return $scope.selectedTC && t && t.id === $scope.selectedTC.id;
    };

    $scope.isSelectedTP = function (tp) {
        return $scope.selectedTP === tp;
    };

    $scope.back = function () {
        if($scope.controls.running){
            $scope.stop();
        }
        $scope.controls.abort = true;
        $scope.controls.running = false;
        $scope.nbRelativeTC = 0;
        $scope.saved = false;
        $scope.resetFilter();
        $scope.tabs.reportTab = 0;
        $scope.exec = false;
        $scope.showResults = false;
        $scope.report = {};
        $scope.container = {
            reports: {},
            asList: []
        };
        $scope.selectedReport = null;
        $scope.aggregate = {};
        $scope.x.rp = 0;
        TestObjectUtil.cleanObject($scope.tcQueue, new RegExp("^_.*"));
        $scope.tcQueue = [];
        $scope.view.tab = 0;
    };

    $scope.selectTC = function (tc) {
        $scope.selectedTC = tc;
        var id = TestObjectUtil.index($scope.tps, "id", tc.testPlan);
        $scope.selectedTP = $scope.tps[id];
        $scope.view.tab = 0;
    };

    $scope.selectTP = function (tp) {
        $scope.selectedTP = tp;
        $scope.selectedTC = null;
    };

//------------------------- QUEUE CONTROL -----------------------
    $scope.openTp = null;

    $scope.rootConfig = function () {

    };
    $scope.canRun = function () {
        return $scope.selectedConfig && $scope.tcQueue.length;
    };

    $scope.deleteTCL = function (id) {
        var tc = $scope.viewTc[id];
        var i = TestObjectUtil.index($scope.tcQueue, 'id', tc.id);
        $scope.tcQueue.splice(i, 1);

        if (tc.dateType === 'RELATIVE') {
            $scope.nbRelativeTC--;
        }

        if ($scope.container.reports.hasOwnProperty(tc.id)) {
            if (id === $scope.viewTc.length - 1) {
                $scope.x.rp--;
                $scope.goToReport($scope.x.rp, true);
            }
            delete $scope.container.reports[tc.id];
        }

    };

    $scope.clear = function () {
        $scope.tcQueue = [];
        $scope.nbRelativeTC = 0;
    };

    $scope.addQueue = function (tc) {
        if(tc) {
            tc.running = false;
            $scope.tcQueue.push(tc);
            if (tc.dateType === 'RELATIVE') {
                $scope.nbRelativeTC++;
            }
        }
    };

//--------------------------- REPORT --------------------------------

    $scope.exportReport = function (id) {

        var form = document.createElement("form");
        form.action = 'api/report/' + id + '/export/xml';
        form.method = "POST";
        form.target = "_target";
        form.style.display = 'none';
        document.body.appendChild(form);
        form.submit();

    };


    $scope.exportExecReports = function () {

        var list = [];
        for(var k in $scope.container.reports){
            list.push($scope.container.reports[k]);
        }

        var form = EntityUtilsService.formData('api/report/export/all/xml', "POST", 'gov.nist.healthcare.cds.domain.wrapper.Report', list);
        document.body.appendChild(form);
        form.submit();
    };

    $scope.viewReport = function () {
        if ($scope.viewTc && $scope.viewTc.length > 0) {
            for (var i = 0; i < $scope.viewTc.length; i++) {
                if ($scope.container.reports.hasOwnProperty($scope.viewTc[i].id)) {
                    return true;
                }
            }
            return false;
        }
        return false;
    };

    $scope.reportsFor = function (id) {
        if ($scope.savedReports.hasOwnProperty(id)) {
            return $scope.savedReports[id];
        }
        return [];
    };

    $scope.changedTC = function (tc, rep) {
        return tc.metaData.dateLastUpdated !== rep.tcInfo.metaData.dateLastUpdated;
    };

    $scope.deleteSavedReport = function (item, tc, id) {
        $http.get('api/report/delete/' + item.id).then(function (response) {
            if ($scope.savedReports[tc]) {
                var i = _.findIndex($scope.savedReports[tc], function (o) {
                    return o.id === item.id;
                });
                if (~i) {
                    $scope.savedReports[tc].splice(i, 1);
                }
                Notification.success({
                    message: 'Report Deleted',
                    delay: 3000
                })
            }
        });
    };

    $scope.showReport = function (item) {
        $modal.open({
            templateUrl: 'ReportView.html',
            controller: 'ReportViewerCtrl',
            windowClass: 'app-modal-window',
            resolve: {
                report: function () {
                    return item;
                },
                vxm: function () {
                    return $scope.vxm;
                }
            }
        });
    };

    $scope.reset = function (n) {
        n.cmp = 0;
        n.crt = 0;
    };

    $scope.reportId = 0;
    $scope.goToReport = function (i, noSlide) {
        var tc = $scope.viewTc[i];
        $scope.x.rp = i;

        if (!tc._s || !$scope.container.reports.hasOwnProperty(tc.id)) {
            $scope.selectedReport = null;
        }
        else {
            $scope.selectedReport = $scope.container.reports[tc.id];
        }
        if (!noSlide) {
            $scope.tabs.reportTab = 1;
        }

    };

    $scope.deleteReport = function (i) {
        var tc = $scope.viewTc[i];
        delete $scope.container.reports[tc.id];
    };

    $scope.addSavedReports = function (list) {
        _.forEach(list, function (report) {
            if ($scope.savedReports.hasOwnProperty(report.tc)) {
                $scope.savedReports[report.tc].push(report);
            }
            else {
                $scope.savedReports[report.tc] = [report];
            }
        });
    };

    $scope.saveReports = function () {
        $http.post('api/report/save', $scope.container.asList).then(
            function (response) {
                $scope.saved = true;
                $scope.addSavedReports($scope.container.asList);
                Notification
                    .success({
                        message: "Reports Saved",
                        delay: 1000
                    });
            },
            function (response) {
                Notification
                    .error({
                        message: "Error while saving reports",
                        delay: 1000
                    });
            }
        );
    };

    $scope.getSimulationList = function (report) {

        // $http.post('api/report/json',$scope.container.asList).then(function (response) {
        //     var anchor = angular.element('<a/>');
        //     anchor.css({display: 'none'}); // Make sure it's not visible
        //     angular.element(document.body).append(anchor); // Attach to document
        //     anchor.attr({
        //         href: 'data:attachment/json;charset=utf-8,' + encodeURI(JSON.stringify(response.data)),
        //         target: '_blank',
        //         download: 'simulation.json'
        //     })[0].click();
        //     anchor.remove();
        // });
        // $http.post('api/report/zip',$scope.container.asList).then(function (response) {
        //     var anchor = angular.element('<a/>');
        //     anchor.css({display: 'none'}); // Make sure it's not visible
        //     angular.element(document.body).append(anchor); // Attach to document
        //     anchor.attr({
        //         href: 'data:attachment/zip;charset=utf-8,' + encodeURI(JSON.stringify(response.data)),
        //         target: '_blank',
        //         download: 'simulation.zip'
        //     })[0].click();
        //     anchor.remove();
        // });

    };

//---------------------------- WATCHERS -----------------------


    $scope.$watch('view.tab', function (newValue) {
        if (newValue == 1) {
            var tc = $scope.selectedTC.id;
            $http.get('api/report/tc/' + tc).then(function (response) {
                if (response.data && response.data.length > 0) {
                    $scope.savedReports[tc] = response.data;
                }
            });
        }
    });

    $scope.$watch('x.rp', function (newValue) {
        if ($scope.showResults) {
            $scope.controls.top = $scope.x.rp;
        }
    });

    $scope.$watch('viewTc', function (newValue) {
        $scope.x.rp = 0;
        if ($scope.viewTc && $scope.viewTc.length > 0 && $scope.container && $scope.container.asList.length > 0) {
            $scope.goToReport($scope.x.rp, true);
        }

    }, true);

//----------------------- EXECUTION -----------------------------
    $scope.container = {
        reports: {},
        asList: []
    };

    $scope.execHistory = {
        queue : [],
        configuration : {
            software : null,
            date : null
        }
    };

    $scope.archive = function (queueList, soft, date) {
        $scope.execHistory.queue = [];
        $scope.execHistory.configuration.software = soft;
        $scope.execHistory.configuration.date = date;
        _.forEach(queueList, function (e) {
            $scope.execHistory.queue.push(e.id);
        });
    };

    $scope.reloadFromHistory = function () {
        $scope.back();
        _.forEach($scope.execHistory.queue, function (e) {
            var tc =  EntityUtilsService.findTC($scope.tps, e);
            $scope.addQueue(tc);
        });
        console.log($scope.execHistory.queue);
        console.log($scope.tcQueue);
        // $scope.onConfig($scope.execHistory.configuration.software);
        // $scope.assessmentDate.date = $scope.execHistory.configuration.date;
        $scope.exe();
    };

    $scope.hasHistory = function () {
      return $scope.execHistory.queue.length > 0;
    };

    $scope.exe = function () {
        $scope.exec = true;
        $scope.archive($scope.tcQueue, $scope.selectedConfig, $scope.assessmentDate.dateString);
        ExecutionService.play($scope.tcQueue, $scope.selectedConfig.id, $scope.assessmentDate.dateString, $scope.controls, $scope.container).then(function (response) {
                $scope.resultsHandle(response);
            },
            function (error) {
            });
    };

    $scope.resultsHandle = function (response) {
        if (response.signal === 'FINISH' && $scope.exec) {
            if (response.data && response.data.reports) {
                var list = $scope.objToList(response.data.reports);
                response.data.asList = list;
                if (list.length > 0) {
                    ExecutionService.aggregate(list).then(function (aggResponse) {
                        if (aggResponse.status) {
                            $scope.aggregate = aggResponse.result;
                        }
                    });
                    $scope.tabs.reportTab = 0;
                }
                $scope.showResults = true;
            }
        }
    };

    $scope.objToList = function (obj) {
        var list = [];
        for (var k in obj) {
            if (obj.hasOwnProperty(k)) {
                list.push(obj[k]);
            }
        }
        return list;
    };


    $scope.pause = function () {
        $scope.controls.paused = true;
        $scope.controls.running = false;
    };

    $scope.resume = function () {
        $scope.controls.paused = true;
        ExecutionService.resume($scope.tcQueue, $scope.selectedConfig.id, $scope.assessmentDate.dateString, $scope.controls, $scope.container).then(function (response) {
                $scope.resultsHandle(response);
            },
            function (error) {
            });
    };

    $scope.stop = function () {
        ExecutionService.stop($scope.tcQueue, $scope.controls, $scope.container).then(function (response) {
                $scope.resultsHandle(response);
            },
            function (error) {
            });
    };


});

angular.module('tcl').controller('ReportViewerCtrl',
    function ($scope, $uibModalInstance, report, vxm) {
        $scope.report = report;
        $scope.vxm = vxm;
        $scope.dismiss = function () {
            $uibModalInstance.dismiss('cancel');
        };
    });
