angular.module('tcl').factory('ExecutionService', function (StatsService,$q,$http) {
    var execService = {
        runTc : function (tc,configuration) {
            var deferred = $q.defer();
            tc._running = true;
            $http.post('api/exec/tc/' + tc.id,configuration).then(function (response) {
                    if (response.data) {
                        execService.decorateTc(tc,response.data,true);
                        deferred.resolve({status : true, report : response.data});
                    } else {
                        execService.decorateTc(tc,response.data,false);
                        deferred.resolve({status : false});
                    }
                },
                function (error) {
                    execService.decorateTc(tc,error,false);
                    deferred.resolve({status : false});
                });
            return deferred.promise;
        },
        decorateTc : function (tc,result,status) {
            tc._running = false;
            if(status){
                tc._s =  result.engineResponseStatus === 'OK' || !result.engineResponseStatus;
                tc._status = result.engineResponseStatus;
                tc._events = result.events;
                tc._events.cmp = StatsService.completion(tc._events.f, tc._events.p, tc._events.u, tc._events.w);
                tc._events.crt = StatsService.correctness(tc._events.f, tc._events.p, tc._events.u, tc._events.w);
                tc._failures = result.failures;
                tc._fc = result.forecasts;
                tc._fc.cmp = StatsService.completion(tc._fc.f, tc._fc.p, tc._fc.u, tc._fc.w);
                tc._fc.crt = StatsService.correctness(tc._fc.f, tc._fc.p, tc._fc.u, tc._fc.w);
            }
            else {
                tc._s = false;
                if(result && result.status && result.statusText){
                    tc._failure = {
                        status : result.status,
                        text : result.statusText
                    };
                }
            }
        },
        aggregate : function (reports) {
            var deferred = $q.defer();
            $http.post('api/exec/agg',reports).then(function (response) {
                deferred.resolve({status : true, result : response.data});
            },
            function (error) {
                deferred.resolve({status : false, error : error });
            });
            return deferred.promise;
        },
        execute : function (queue,config,date,controls,container) {
            var deferred = $q.defer();
            var configuration = { software : config, date : date };
            execService.runThrough(queue,controls,configuration,container).then(function (result) {
                if(result.signal === 'FINISH'){
                    deferred.resolve({ signal : 'FINISH', data : container });
                }
                else if(result.signal === 'PAUSE'){
                    deferred.resolve({ signal : 'PAUSE', data : container });
                }
                else if(result.signal === 'ABORT'){
                    execService.init(queue,controls,container);
                    deferred.resolve({ signal : 'ABORT' });
                }
            });
            return deferred.promise;
        },
        runThrough : function (queue,controls,configuration,container) {
            var deferred = $q.defer();
            if(controls.runningId < queue.length && !controls.paused && !controls.abort){
                controls.top = controls.runningId < 3 ? 0 : controls.runningId - 3;
                var tc = queue[controls.runningId];
                execService.runTc(queue[controls.runningId],configuration).then(function (response) {
                    controls.runningId++;
                    controls.progress = StatsService.percent(controls.runningId,controls.total);
                    if(response.status){
                        container.reports[tc.id] = response.report;
                    }
                    execService.runThrough(queue,controls,configuration,container).then(function (result) {
                        deferred.resolve(result);
                    });
                });
            }
            else if (controls.runningId >= queue.length){
                controls.running = false;
                deferred.resolve({signal : "FINISH"});
            }
            else if(controls.paused){
                controls.running = false;
                deferred.resolve({signal : "PAUSE"});
            }
            else if(controls.abort){
                controls.running = false;
                deferred.resolve({signal : "ABORT"});
            }
            return deferred.promise;
        },
        init : function (queue,controls,container) {
            controls.running = true;
            controls.runningId = 0;
            controls.top = 0;
            controls.total = queue.length;
            controls.progress = StatsService.percent(controls.runningId,controls.total);
            controls.paused = false;
            controls.abort = false;
            container.reports = {};
            container.asList = [];
        },
        play : function (queue,config,date,controls,container) {
            execService.init(queue,controls,container);
            return execService.execute(queue,config,date,controls,container);
        },
        resume : function (queue,config,date,controls,container) {
            controls.running = true;
            controls.paused = false;
            return execService.execute(queue,config,date,controls,container);
        },
        stop : function (queue,controls,container) {
            var deferred = $q.defer();
            controls.running = false;
            controls.paused = true;
            queue.splice(controls.runningId,queue.length - controls.runningId + 1);
            controls.progress = 100;
            deferred.resolve({signal : 'FINISH', data : container });
            return deferred.promise;
        }
    };
    return execService;
});

angular.module('tcl').factory('StatsService', function ($filter) {
    return {
        correctness : function (f, p, u, w) {
            var total = f + p;
            var correct = p;
            return total === 0 ? 100 : $filter('number')(correct / total, 2) * 100;
        },
        completion : function (f, p, u, w) {
            var total = f + p + w + u;
            var found = f + p + w;
            return total === 0 ? 100 : $filter('number')(found / total, 2) * 100;
        },
        percent : function (x,y) {
            return Math.floor((x / y) * 100);
        }
    };
});