'use strict';

angular.module('tcl').filter('reportF', function () {
    return function (input, f) {
        if (!input || !input.length) {
            return;
        }
        return input.filter(function (elm) {
            return elm._events.crt >= f.ev.crt && elm._events.cmp >= f.ev.cmp && elm._fc.crt >= f.fc.crt && elm._fc.cmp >= f.fc.cmp;
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
angular.module('tcl').controller('ExecutionCtrl', function (StatsService, ExecutionService, $modal, $filter, Notification, TestObjectUtil, $rootScope, $scope, VaccineService, $http, TestDataService, $timeout, ngTreetableParams, $parse, $q) {
    $scope.tps = [];
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
        reportTab : 0
    };
    $scope.viewTc = [];
    $scope.filter = {
        queueSearch : "",
        eCm : false,
        fCm : false,
        eCs : false,
        fCs : false,
        eCe : false,
        fCe : false,
        eCw : false,
        fCw : false
    };
    $scope.multipleSel = false;
    $scope.selected = [];
    $scope.filter = {
        ev: {
            cmp: 0,
            crt: 0
        },
        fc: {
            cmp: 0,
            crt: 0
        }
    };
    $scope.view = {
        tab: 0
    };
    $scope.savedReports = {};
    $scope.configStub = {
        name: "",
        endPoint: "",
        connector: ""
    };
    $scope.today = new Date();

    $scope.assessmentDate = {
        type : 'fixed',
        _dateObj : $scope.today,
        date : $scope.today.getTime()
    };
    $scope.selectedConfig = null;
    $scope.heigth = {
        'heigth': '100%'
    };
    $scope.tabStyle = $scope.heigth;
    $scope.completion = StatsService.completion;
    $scope.correctness = StatsService.correctness;
    $scope.x = {
        runningId : 0,
        rp : 0
    };
    $scope.dstartf = false;
    $scope.controls = {
        running : false,
        runningId : 0,
        total : 0,
        progress : 0,
        paused : false,
        top : 0
    };
    $scope.showResults = false;
    $scope.report = {};
    $scope.aggregate = {};

//--------------------------------- UTILS ----------------------

    $scope.resetFilter = function () {
        $scope.filter = {
            queueSearch : "",
            eCm : false,
            fCm : false,
            eCs : false,
            fCs : false,
            eCe : false,
            fCe : false,
            eCw : false,
            fCw : false
        };
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

    $scope.has = function (x,prop) {
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
        if (!event.vaccination.date)
            return "";
        if (event.vaccination.date._type) {
            if (event.vaccination.date._type === 'fixed')
                return $filter('date')(event.vaccination.date.fixed.date, "MM/dd/yyyy");
            else if (event.vaccination.date._type === 'relative')
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
            $scope.defaultConfig();
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
                console.log("VX");
                console.log($scope.vxm);
            },
            function (err) {
                console.log(err);
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
                console.log(err);
                d.resolve(false);
            });
        return d.promise;
    };

    $scope.loadTestCases = function () {
        TestDataService.loadTestPlans().then(function (data) {
                $scope.tps = data;
            },
            function (err) {
                console.log(err);
            });
    };

    $scope.init = function () {
        $scope.loadConfig();
        $scope.loadTestCases();
        $scope.loadVaccines();
        $scope.loadEnums();
    };

    $rootScope.$on('event:loginConfirmed', function () {
        $scope.init();
    });



//------------------------------- CONFIG CONTROL ----------------

    $scope.saveConfig = function () {
        $http.post("api/exec/configs/save", $scope.configStub).then(function (result) {
            var conf = angular.fromJson(result.data);
            $scope.configs.push(conf);
            $scope.selectedConfig = conf;
        });
    };

    $scope.deleteConfig = function (id,index) {
        $http.post("api/exec/configs/delete/"+id).then(function () {
            if($scope.selectedConfig.id === id){
                $scope.selectedConfig = null;
            }
            $scope.configs.splice(index,1);
        });
    };

    $scope.defaultConfig = function () {
        $http.get('api/exec/configs/default').then(function (response) {
            if (response.data && response.data !== '') {
                for(var c = 0; c < $scope.configs.length; c++){
                    if($scope.configs[c].id === response.data){
                        $scope.selectedConfig = $scope.configs[c];
                        break;
                    }
                }
            }
        });
    };

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
        if ($scope.multipleSel) {
            var toAdd = [];
            console.log(items);
            for (var i in items) {
                if (!$scope.inQueue(items[i])) {
                    items[i].running = false;
                    toAdd.push(items[i]);
                }
            }

            $scope.tcQueue = $scope.tcQueue.slice(0, index)
                .concat(toAdd)
                .concat($scope.tcQueue.slice(index));
        } else {
            console.log(items);
            if(items.hasOwnProperty('testCases') || items.hasOwnProperty('testCaseGroups')){
                $scope.multipleSel = true;
                var listItems = [];
                if (items.hasOwnProperty('testCases')) {
                    listItems = listItems.concat(items.testCases);
                }
                if(items.hasOwnProperty('testCaseGroups')){
                    for(var g = 0; g < items.testCaseGroups.length; g++){
                        listItems = listItems.concat(items.testCaseGroups[g].testCases);
                    }
                    console.log(listItems);
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
                console.log("ID " + id);
                if (id > -1) {
                    $scope.tcQueue.splice(id, 1);
                    if (index > id)
                        index = index - 1;
                }
                items.running = false;
                $scope.tcQueue.splice(index, 0, items);
            }
        }
        $scope.multipleSel = false;
        return true;
    };

    $scope.onMoved = function (list) {
        $scope.selected = [];
    };

    $scope.dragMoved = function (index) {
        console.log(index);
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
        $scope.controls = {
            running : false,
            runningId : 0,
            total : 0,
            progress : 0,
            paused : false,
            top : 0
        };
        $scope.resetFilter();
        $scope.exec = false;
        $scope.showResults = false;
        $scope.report = {};
        $scope.aggregate = {};
        $scope.x.rp = 0;
        TestObjectUtil.cleanObject($scope.tcQueue, new RegExp("^_.*"));
        $scope.tcQueue = [];
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

    $scope.canRun = function () {
        return $scope.selectedConfig && $scope.tcQueue.length;
    };

    $scope.deleteTCL = function (id) {
        $scope.tcQueue.splice(id, 1);
        if ($scope.report && $scope.report.reports && $scope.report.reports.length > 0) {
            if (id === $scope.report.reports.length - 1) {
                $scope.x.rp --;
            }
            $scope.report.reports.splice(id, 1);
            console.log($scope.report.reports.length);
        }
    };

    $scope.clear = function () {
        $scope.tcQueue = [];
    };

    $scope.addQueue = function (tc) {
        tc.running = false;
        $scope.tcQueue.push(tc);
    };

//--------------------------- REPORT --------------------------------

    $scope.reportsFor = function (id) {
        if ($scope.savedReports.hasOwnProperty(id)) {
            return $scope.savedReports[id];
        }
        return [];
    };

    $scope.changedTC = function (tc, rep) {
        return tc.metaData.dateLastUpdated !== rep.tcLastUpdated;
    };

    $scope.deleteSavedReport = function (item, tc, id) {
        $http.get('api/report/delete/' + item.id).then(function (response) {
            if ($scope.savedReports[tc]) {
                $scope.savedReports[tc].splice(id, 1);
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
    $scope.goToReport = function (i) {
        var tc = $scope.viewTc[i];
        $scope.x.rp = i;
        for(var r = 0; r <  $scope.report.reports.length; r++){
            var report = $scope.report.reports[r];
            if(tc.id === report.tc){
                $scope.reportId = r;
                return;
            }
        }
        $scope.reportId = -1;
        $scope.tabs.reportTab = 1;
    };

    $scope.deleteReport = function (i) {
        $scope.report.reports.splice(i, 0);
    };

    $scope.saveReports = function () {
        $http.post('api/report/save', $scope.report.reports).then(
            function (response) {
                Notification
                    .success({
                        message: "Reports Saved",
                        delay: 1000
                    });
            },
            function (response) {
                Notification
                    .error({
                        message: "Test Case Deleted",
                        delay: 1000
                    });
            }
        );
    };

//---------------------------- WATCHERS -----------------------


    $scope.$watch('view.tab', function (newValue) {
        if (newValue == 3) {
            var tc = $scope.selectedTC.id;
            $http.get('api/report/tc/' + tc).then(function (response) {
                if (response.data && response.data.length > 0) {
                    console.log(response.data.length + " Reports found");
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
        $scope.goToReport($scope.x.rp)
    },true);

//----------------------- EXECUTION -----------------------------

    $scope.exe = function () {

        $scope.exec = true;
        ExecutionService.execute($scope.tcQueue,$scope.selectedConfig.id,$scope.assessmentDate._dateObj.getTime(),$scope.controls).then(function (response) {
            console.log(response);
            $scope.resultsHandle(response);
        },
        function (error) {
            console.log(error);
        });
    };

    $scope.resultsHandle = function (response) {
        if(response.signal === 'FINISH'){
            if(response.status){
                $scope.showResults = true;
                $scope.report = response.result.report;
                if(response.aggregate){
                    $scope.aggregate = response.result.aggregate;
                }
                else {
                    $scope.aggregate = {};
                }
            }
        }
    };


    $scope.pause = function () {
        console.log("PAUSE");
        $scope.controls.paused = true;
        $scope.controls.running = false;
    };

    $scope.resume = function () {
        console.log("RESUME");
        $scope.controls.paused = true;
        ExecutionService.resume($scope.tcQueue,$scope.controls).then(function (response) {
            console.log(response);
            $scope.resultsHandle(response);
        },
        function (error) {
            console.log(error);
        });
    };

    $scope.stop = function () {
        ExecutionService.stop($scope.tcQueue,$scope.controls).then(function (response) {
            console.log(response);
                $scope.controls.progress = 100;
                $scope.resultsHandle(response);
        },
        function (error) {
            console.log(error);
        });
    };


});

angular.module('tcl').controller('ReportViewerCtrl',
    function ($scope, $uibModalInstance, report, vxm) {
        $scope.report = report;
        $scope.vxm = vxm;
    });
