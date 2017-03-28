angular.module('tcl').factory('ExecutionService', function (StatsService,$q,$http) {
    var execService = {
        runTc : function (tc) {
            var deferred = $q.defer();
            tc._running = true;
            $http.get('api/exec/tc/' + tc.id).then(function (response) {
                    if (response.data) {
                        execService.decorateTc(tc,response.data,true);
                        deferred.resolve({status : true});
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
                tc._s = true;
                tc._events = result.events;
                tc._events.cmp = StatsService.completion(tc._events.f, tc._events.p, tc._events.u, tc._events.w);
                tc._events.crt = StatsService.correctness(tc._events.f, tc._events.p, tc._events.u, tc._events.w);
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
        collectResults : function () {
            var deferred = $q.defer();
            var result = {};
            $http.get('api/exec/collect').then(function (response) {
                result.report = response.data;
                $http.get('api/exec/agg').then(function (response) {
                    result.aggregate = response.data;
                    deferred.resolve({status : true, result : result, aggregate : true});
                },
                function (error) {
                    deferred.resolve({status : true, error : error, result : result, aggregate : false});
                });
            },
            function (error) {
                deferred.reject({status : false, error : error});
            });
            return deferred.promise;
        },
        execute : function (queue,config,date,controls) {
            var deferred = $q.defer();
            $http.post('api/exec/start',{ software :config, date : date }).then(function (response) {
                controls.running = true;
                controls.runningId = 0;
                controls.top = 0;
                controls.total = queue.length;
                controls.progress = StatsService.percent(controls.runningId,controls.total);
                controls.paused = false;
                execService.runThrough(queue,controls).then(function (result) {
                    if(result.signal === 'FINISH'){
                        execService.collectResults().then(function (collection) {
                            collection.signal = result.signal;
                            deferred.resolve(collection);
                        },
                        function (rejection) {
                            deferred.reject(rejection);
                        });
                    }
                    else if(result.signal === 'PAUSE'){
                        deferred.resolve(result);
                    }
                })
            },function (error) {
                deferred.reject(error);
            });
            return deferred.promise;
        },
        runThrough : function (queue,controls) {
            var deferred = $q.defer();
            if(controls.runningId < queue.length && !controls.paused){
                controls.top = controls.runningId < 3 ? 0 : controls.runningId - 3;
                execService.runTc(queue[controls.runningId]).then(function () {
                    controls.runningId++;
                    controls.progress = StatsService.percent(controls.runningId,controls.total);
                    execService.runThrough(queue,controls).then(function (result) {
                        deferred.resolve(result);
                    });
                })
            }
            else if (controls.runningId >= queue.length){
                controls.running = false;
                deferred.resolve({signal : "FINISH"});
            }
            else if(controls.paused){
                controls.running = false;
                deferred.resolve({signal : "PAUSE"});
            }
            return deferred.promise;
        },
        resume : function (queue,controls) {
            var deferred = $q.defer();
            controls.running = true;
            controls.paused = false;
            execService.runThrough(queue,controls).then(function (result) {
                if(result.signal === 'FINISH'){
                    execService.collectResults().then(function (collection) {
                            collection.signal = result.signal;
                            deferred.resolve(collection);
                        },
                        function (rejection) {
                            deferred.reject(rejection);
                        })
                }
                else if(result.signal === 'PAUSE'){
                    deferred.resolve(result);
                }
            });
            return deferred.promise;
        },
        stop : function (queue,controls) {
            controls.running = false;
            controls.paused = true;
            queue.splice(controls.runningId,queue.length - controls.runningId + 1);
            var deferred = $q.defer();
            execService.collectResults().then(function (collection) {
                    collection.signal = result.signal;
                    deferred.resolve(collection);
            },
            function (rejection) {
                deferred.reject(rejection);
            });
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