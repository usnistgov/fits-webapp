angular.module('tcl').factory('TestObjectUtil', function () {
    var testObjectService = {
        hash: function (list) {
            for (var i in list) {
                testObjectService.updateHash(list[i]);
            }
        },
        updateEventId : function (evList,oId,nId) {
          for(var i = 0; i < evList.length; i++){
              var vEvent = evList[i];
              if(vEvent.position+'' === oId+''){
                  vEvent.position = nId;
              }
              if(vEvent.date && vEvent.date.type === 'relative'){
                  this.updateRulesVId(vEvent.date.rules,oId,nId);
              }
          }
        },
        updateRulesVId : function (rulesList,oId,nId) {
            for(var i = 0; i < rulesList.length; i++){
                if(rulesList[i].hasOwnProperty("relativeTo") && rulesList[i].relativeTo.hasOwnProperty("reference") && rulesList[i].relativeTo.reference === 'dynamic'){
                    var relation = rulesList[i].relativeTo;
                    if(relation.id+'' === oId+''){
                        relation.id = nId;
                    }
                }
            }
        },
        tpHash : function (tp) {
          var str = tp.name+tp.metaData.version+tp.description+tp.metaData.changeLog;
          return md5(str);
        },
        tpHashChanged : function (tp) {
           if(!tp._hash){
               return true;
           }
           else {
               return tp._hash !== testObjectService.tpHash(tp);
           }
        },
        tpUpdateHash : function (tp) {
            tp._hash = testObjectService.tpHash(tp);
        },
        toStringObj : function (obj) {
            var cleanedObj =  JSON.parse(angular.toJson(obj));
            var string = JSON.sortify(cleanedObj);
            return string;
        },
        hashChanged: function (tc) {
            var _tc = testObjectService.prepare(tc);
            delete _tc.metaData.dateLastUpdated;
            var str = testObjectService.toStringObj(_tc);
            return md5(str) !== tc._hash;
        },
        updateHash: function (tc) {
            var _tc = testObjectService.prepare(tc);
            delete _tc.metaData.dateLastUpdated;
            var str = testObjectService.toStringObj(_tc);
            tc._hash = md5(str);
        },
        cleanObject: function (obj, exp) {
            if (typeof obj === 'object') {
                if (!Array.isArray(obj)) {
                    for (var prop in obj) {
                        if (exp.test(prop)) {
                            delete obj[prop];
                        }
                        else {
                            testObjectService.cleanObject(obj[prop], exp);
                        }
                    }
                }
                else {
                    for (var i = 0; i < obj.length; i++) {
                        testObjectService.cleanObject(obj[i], exp);
                    }
                }
            }
        },

        sanitizeDate: function (obj) {
            if (obj) {
                if (obj.hasOwnProperty("type")) {
                    if (obj.type === 'fixed') {
                        obj._dateObj = new Date(obj.date);
                    }
                }
            }
        },

        sanitizeDates: function (obj) {
            if (typeof obj === 'object') {
                if (Array.isArray(obj)) {
                    for (var i in obj) {
                        testObjectService.sanitizeDates(obj[i]);
                    }
                }
                else {
                    for (var x in obj) {
                        if (~x.search(/date/i) || ~x.search(/earliest/i) || ~x.search(/recommended/i) || ~x.search(/dob/i) || ~x.search(/pastDue/i)) {
                            if (typeof obj[x] === 'number') {
                                obj["_" + x] = new Date(obj[x]);
                            }
                            else {
                                testObjectService.sanitizeDate(obj[x]);
                            }
                        }
                        else {
                            testObjectService.sanitizeDates(obj[x]);
                        }
                    }
                }
            }
        },

        sanitizeEvents: function (tc) {
            if (tc.events) {
                for (var e = 0; e < tc.events.length; e++) {
                    tc.events[e]._type = "vaccination";
                    tc.events[e].vaccination.id = e;
                }
            }
        },

        cleanDates: function (obj) {
            if (typeof obj === 'object') {
                if (Array.isArray(obj)) {
                    for (var i in obj) {
                        testObjectService.cleanDates(obj[i]);
                    }
                }
                else {
                    for (var x in obj) {
                        if (~x.search(/date/i) || ~x.search(/earliest/i) || ~x.search(/recommended/i) || ~x.search(/dob/i) || ~x.search(/pastDue/i)) {
                            testObjectService.cleanDate(obj[x]);
                        }
                        else {
                            testObjectService.cleanDates(obj[x]);
                        }
                    }
                }
            }
        },

        cleanDate: function (obj) {
            if (obj) {
                if (obj.hasOwnProperty("type")) {
                    if (obj.type === "fixed") {
                        delete obj._dateObj;
                    }
                }
            }
        },

        getList: function (tp, id) {
            var tcg = this.getTCGroup(tp, id);
            if (tcg) {
                return tcg.testCases;
            }
            else {
                var indexOfObj = testObjectService.index(tp.testCases, "id", id);
                if (~indexOfObj) {
                    return tp.testCases;
                }
            }
            return null;
        },

        getTCGroup: function (tp, id) {
            var indexOfObj;
            for (var tcg = 0; tcg < tp.testCaseGroups.length; tcg++) {
                indexOfObj = testObjectService.index(tp.testCaseGroups[tcg].testCases, "id", id);
                if (~indexOfObj) {
                    return tp.testCaseGroups[tcg];
                }
            }
            return null;
        },

        getGroupByID: function (tp, id) {
            for (var tcg = 0; tcg < tp.testCaseGroups.length; tcg++) {
                if (tp.testCaseGroups[tcg].id === id) {
                    return tp.testCaseGroups[tcg];
                }
            }
            return null;
        },

        getGroupByName: function (tp, name) {
            for (var tcg = 0; tcg < tp.testCaseGroups.length; tcg++) {
                if (tp.testCaseGroups[tcg].name === name) {
                    return tp.testCaseGroups[tcg];
                }
            }
            return null;
        },

        clone: function (obj) {
            var c = JSON.parse(angular.toJson(obj));
            testObjectService.cleanObject(c, new RegExp("^id$"));
            return c;
        },

        cloneEntity: function (entity) {
            var e = testObjectService.clone(entity);
            testObjectService.markWithCLID(e);
            return e;
        },

        merge: function (newTP, oldTP) {
            oldTP.testCases = oldTP.testCases.concat(newTP.testCases);
            for(var i = 0; i < newTP.testCaseGroups.length; i++){
                var group = testObjectService.getGroupByID(oldTP,newTP.testCaseGroups[i].id);
                if(group){
                    for(var tc = 0; tc < newTP.testCaseGroups[i].testCases.length; tc++){
                        group.testCases.push(newTP.testCaseGroups[i].testCases[tc]);
                    }
                }
                else {
                    oldTP.testCaseGroups.push(newTP.testCaseGroups[i]);
                }
            }
        },

        synchronize: function (id, container, remoteObj) {
            var indexOfObj = testObjectService.index(container, "id", id);
            Object.assign(container[indexOfObj], remoteObj);
            return container[indexOfObj];
        },

        listTC: function (tp, list) {
            for (var tcg = 0; tcg < tp.testCaseGroups.length; tcg++) {
                for (var tc = 0; tc < tp.testCaseGroups[tcg].testCases.length; tc++) {
                    list.push(tp.testCaseGroups[tcg].testCases[tc]);
                }
            }
            for (var tci = 0; tci < tp.testCases.length; tci++) {
                list.push(tp.testCases[tci]);
            }
        },
        synchronizeTC: function (tp, id, tc) {
            var indexOfObj;
            for (var tcg = 0; tcg < tp.testCaseGroups.length; tcg++) {
                indexOfObj = testObjectService.index(tp.testCaseGroups[tcg].testCases, "id", id);
                if (~indexOfObj) {
                    this.updateHash(tc);
                    tp.testCaseGroups[tcg].testCases[indexOfObj] = tc;
                    return tp.testCaseGroups[tcg].testCases[indexOfObj];
                }
            }
            indexOfObj = testObjectService.index(tp.testCases, "id", id);
            if (~indexOfObj) {
                tp.testCases[indexOfObj] = tc;
                return tp.testCases[indexOfObj];
            }
        },

        lookUp: function (tcId, tp) {
            var indexOfObj;
            for (var tcg = 0; tcg < tp.testCaseGroups.length; tcg++) {
                indexOfObj = testObjectService.index(tp.testCaseGroups[tcg].testCases, "id", id);
                if (~indexOfObj) {
                    return true;
                }
            }
            indexOfObj = testObjectService.index(tp.testCases, "id", id);
            return ~indexOfObj;
        },

        index: function (container, key, value) {
            for (var i = 0; i < container.length; i++) {
                if (typeof container[i] === 'object' && container[i].hasOwnProperty(key) && container[i][key] === value) {
                    return i;
                }
            }
            return -1;
        },

        markWithCLID: function (obj) {
            obj.id = new ObjectId().toString();
        },

        isLocal: function (obj) {
            return obj && obj.hasOwnProperty("_local") && obj._local;
        },

        prepare: function (tc) {
            var _tc = JSON.parse(angular.toJson(tc));
            if (_tc.hasOwnProperty("position")) {
                delete _tc.position;
            }
            if (testObjectService.isLocal(_tc)) {
                delete _tc.id;
            }
            testObjectService.cleanDates(_tc);
            testObjectService.cleanObject(_tc, new RegExp("^_.*"));
            return _tc;
        }
    };
    return testObjectService;
});

angular.module('tcl').factory('TestObjectFactory', function (EntityService, TestObjectUtil, $rootScope) {
    var testObjectService = {
        createFD: function () {
            var dt = new Date();
            return {
                type: 'fixed',
                dateString : new Date().toLocaleDateString('en-US')
            }
        },
        createRD: function () {
            return {
                type: 'relative',
                rules: [{
                    position : 'AFTER',
                    year : 0,
                    month : 0,
                    week : 0,
                    day : 0,
                    relativeTo : null
                }]
            }
        },
        createDate : function (type) {
            if(type === 'RELATIVE'){
                return testObjectService.createRD();
            }
            else {
                return testObjectService.createFD();
            }
        },
        createGRP: function (id) {
            return {
                _local : true,
                _type : EntityService.type.TEST_CASE_GROUP,
                id: new ObjectId().toString(),
                description : "",
                name: 'New Group',
                testPlan: id,
                testCases: []
            }
        },
        createREVD: function () {
            return {
                type: 'relative',
                rules: [
                    {
                        position: 'BEFORE',
                        year: 0,
                        month: 0,
                        day: 0,
                        relativeTo: {
                            reference: 'static',
                            id: 'EVALDATE'
                        }
                    }
                ]
            }
        },
        createRDOB: function () {
            return {
                type: 'relative',
                rules: [
                    {
                        position: 'BEFORE',
                        year: 0,
                        month: 0,
                        week : 0,
                        day: 0,
                        relativeTo: {
                            reference: 'static',
                            id: 'EVALDATE'
                        }
                    }
                ]
            }
        },
        createTC: function (tp,grp,version) {
            var dt = new Date();
            var tc = {
                id: new ObjectId().toString(),
                _local : true,
                _type : EntityService.type.TEST_CASE,
                name: "New TC",
                uid : '',
                _changed: true,
                evaluationType : "",
                forecastType : "",
                description: "",
                dateType: 'FIXED',
                _dateType: 'FIXED',
                runnable : true,
                errors : [],
                testPlan: tp,
                group : grp,
                patient: {
                    dob: testObjectService.createFD(),
                    gender: 'F'
                },
                metaData: {
                    version: version,
                    imported: false,
                    dateCreated: $rootScope.toUTC(dt),
                    dateLastUpdated: $rootScope.toUTC(dt),
                    changeLog : ""
                },
                evalDate: testObjectService.createFD(),
                events: [],
                forecast: []
            };
            TestObjectUtil.markWithCLID(tc);
            return tc;
        },

        createTP: function () {
            var dt = new Date();
            var tp = {
                id: new ObjectId().toString(),
                _local : true,
                _type : EntityService.type.TEST_PLAN,
                name: "New Test Plan",
                description: "",
                metaData: {
                    version: "1",
                    imported: false,
                    dateCreated: $rootScope.toUTC(dt),
                    dateLastUpdated: $rootScope.toUTC(dt),
                    changeLog : ""
                },
                testCases: [],
                testCaseGroups: []
            };
            TestObjectUtil.markWithCLID(tp);
            return tp;
        },

        createEvent: function (pos, t) {
            var dt;
            if (t === 'FIXED') {
                dt = testObjectService.createFD();
            }
            else {
                dt = testObjectService.createRD();
            }
            return {
                    administred: null,
                    evaluations: [],
                    type: "vaccination",
                    date: dt,
                    doseNumber: 1,
                    position: pos
            };
        },

        createForecast: function (t) {
            var earliest;
            var recomm;
            if (t === 'FIXED') {
                earliest = testObjectService.createFD();
                recomm = testObjectService.createFD();
            }
            else {
                earliest = testObjectService.createRD();
                recomm = testObjectService.createRD();
            }
            var fc = {
                doseNumber: '-',
                forecastReason: "",
                earliest: earliest,
                recommended: recomm,
                pastDue: null,
                target: null
            };
            return fc;
        },

        createEvaluation: function () {
            return {
                relatedTo: null,
                status: null
            };
        }

    };
    return testObjectService;
});

angular.module('tcl').factory('TestObjectSynchronize', function ($q, $http, TestObjectUtil) {
    var TestObjectSynchronize = {
        updateTestGroupId: function (tg) {
            for (var tc = 0; tc < tg.testCases.length; tc++) {
                tg.testCases[tc].group = tg.id;
            }
        },
        updateTestPlanId: function (tp) {
            for (var tcg = 0; tcg < tp.testCaseGroups.length; tcg++) {
                for (var tc = 0; tc < tp.testCaseGroups[tcg].testCases.length; tc++) {
                    tp.testCaseGroups[tcg].testCases[tc].testPlan = tp.id;
                }
                tp.testCaseGroups[tcg].testPlan = tp.id;
            }
            for (var tci = 0; tci < tp.testCases.length; tci++) {
                tp.testCases[tci].testPlan = tp.id;
            }
        },
        syncTC: function (where, obj, tc) {
            var deferred = $q.defer();
            if (TestObjectUtil.isLocal(obj)) {
                deferred.reject({
                    message: "TestPlan must be saved first",
                    status: false,
                    code: "LOCAL"
                });
            }
            else {
                var _tc = TestObjectSynchronize.prepare(tc);
                $http.post('api/testcase/save', _tc).then(
                    function (response) {
                        var newTC = response.data;
                        // TestObjectUtil.sanitizeDates(newTC);
                        //TestObjectUtil.sanitizeEvents(newTC);
                        newTC._dateType = newTC.dateType;
                        deferred.resolve({
                            status: true,
                            message: "TestCase Saved",
                            tc: newTC
                        });
                    },
                    function (response) {
                        deferred.reject({
                            status: false,
                            message: "Error While Saving TestCase",
                            response: response.data
                        });
                    }
                );
            }
            return deferred.promise;
        },
        syncTP: function (tp) {
            var deferred = $q.defer();
            var _tp = JSON.parse(angular.toJson(tp));
            delete _tp.testCases;
            delete _tp.testCaseGroups;
            _tp = TestObjectSynchronize.prepare(_tp);

            $http.post('api/testplan/save', _tp).then(
                function (response) {
                    var newTP = response.data;

                    deferred.resolve({
                        status: true,
                        tp: newTP,
                        message: "TestPlan Saved"
                    });
                },
                function (response) {
                    deferred.reject({
                        status: false,
                        message: "Error While Saving TestPlan",
                        response: response.data
                    });
                }
            );

            return deferred.promise;
        },
        syncTG: function (tg,tp) {
            var deferred = $q.defer();
            if (TestObjectUtil.isLocal(tp)) {
                deferred.reject({
                    message: "TestGroup must be saved first",
                    status: false,
                    code: "LOCAL"
                });
            }
            else {

                var _tg = JSON.parse(angular.toJson(tg));
                delete _tg.testCases;
                _tg = TestObjectSynchronize.prepare(_tg);

                $http.post('api/testcasegroup/save', _tg).then(
                    function (response) {
                        var newTCG = response.data;
                        deferred.resolve({
                            status: true,
                            tg: newTCG,
                            message: "TestCaseGroup Saved"
                        });
                    },
                    function (response) {
                        deferred.reject({
                            status: false,
                            message: "Error While Saving TestCaseGroup",
                            response: response.data
                        });
                    }
                );
            }
            return deferred.promise;
        },
        prepare: function (tc) {
            var _tc = JSON.parse(angular.toJson(tc));
            // if (_tc.hasOwnProperty("position")) {
            //     delete _tc.position;
            // }
            // if (TestObjectUtil.isLocal(_tc)) {
            //     delete _tc.id;
            // }
            // TestObjectUtil.cleanDates(_tc);
            TestObjectUtil.cleanObject(_tc, new RegExp("^_.*"));
            return _tc;
        }
    };
    return TestObjectSynchronize;
});

angular.module('tcl').factory('TestDataService', function (DataSynchService,$http, $q, TestObjectUtil) {
    return {
        loadTestPlans: function () {
            var deferred = $q.defer();
            var tps = [];
            $http.get('api/testplans').then(
                function (response) {
                    tps = angular.fromJson(response.data);
                    for (var tp = 0; tp < tps.length; tp++) {
                        //TestObjectUtil.tpUpdateHash(tps[tp]);
                        for (var tc = 0; tc < tps[tp].testCases.length; tc++) {
                            tps[tp].testCases[tc]._dateType = tps[tp].testCases[tc].dateType;
                            //TestObjectUtil.sanitizeEvents(tps[tp].testCases[tc]);
                        }
                        for (var tg = 0; tg < tps[tp].testCaseGroups.length; tg++) {
                            for (var tci = 0; tci < tps[tp].testCaseGroups[tg].testCases.length; tci++) {
                                tps[tp].testCaseGroups[tg].testCases[tci]._dateType = tps[tp].testCaseGroups[tg].testCases[tci].dateType;
                                //TestObjectUtil.sanitizeEvents(tps[tp].testCaseGroups[tg].testCases[tci]);
                            }
                            //TestObjectUtil.hash(tps[tp].testCaseGroups[tg].testCases);
                        }
                        //TestObjectUtil.hash(tps[tp].testCases);
                    }
                    deferred.resolve(tps);
                },
                function (error) {
                    deferred.reject("Failed to load TestPlans");
                });
            return deferred.promise;
        },

        loadTestPlan: function (id) {
            var deferred = $q.defer();
            var tp = {};
            $http.get('api/testplan/'+id).then(
                function (response) {
                    tp = angular.fromJson(response.data);
                    
                    for (var tc = 0; tc < tp.testCases.length; tc++) {
                        tp.testCases[tc]._dateType = tp.testCases[tc].dateType;
                        //TestObjectUtil.sanitizeEvents(tp.testCases[tc]);
                    }
                    for (var tg = 0; tg < tp.testCaseGroups.length; tg++) {
                        for (var tci = 0; tci < tp.testCaseGroups[tg].testCases.length; tci++) {
                            tp.testCaseGroups[tg].testCases[tci]._dateType = tp.testCaseGroups[tg].testCases[tci].dateType;
                            //TestObjectUtil.sanitizeEvents(tp.testCaseGroups[tg].testCases[tci]);
                        }
                        TestObjectUtil.hash(tp.testCaseGroups[tg].testCases);
                    }
                    TestObjectUtil.hash(tp.testCases);

                    deferred.resolve(tp);
                },
                function (error) {
                    deferred.reject("Failed to load TestPlans");
                });
            return deferred.promise;
        },
        
        loadEnums: function () {
            var deferred = $q.defer();
            var enums = {};
            $http.get('api/enum/evaluationStatus').then(
                function (response) {
                    enums.evalStatus = response.data;
                    $http.get('api/enum/evaluationReason').then(
                        function (response) {
                            enums.evalReason = response.data;
                            $http.get('api/enum/serieStatus').then(
                                function (response) {
                                    enums.serieStatus = response.data;
                                    $http.get('api/enum/gender').then(
                                        function (response) {
                                            enums.gender = response.data;
                                            $http.get('api/enum/wft').then(
                                                function (response) {
                                                    enums.wfTag = response.data;
                                                    deferred.resolve(enums);
                                                },
                                                function (error) {
                                                    deferred.reject("Failed To Load WFT");
                                                }
                                            );
                                        },
                                        function (error) {
                                            deferred.reject("Failed To Load Genders");
                                        }
                                    );
                                },
                                function (error) {
                                    deferred.reject("Failed To Load Serie Status");
                                }
                            );
                        },
                        function (error) {
                            deferred.reject("Failed To Load Evaluation Reason");
                        }
                    );
                },
                function (error) {
                    deferred.reject("Failed To Load Evaluation Status");
                }
            );
            return deferred.promise;
        },

        loadSoftware : function () {
            var deferred = $q.defer();
            $http.get("api/exec/configs").then(function (result) {
                deferred.resolve(angular.fromJson(result.data));
            }, function (error) {
                deferred.reject("Failed To Load Software");
            });
            return deferred.promise;
        }
    }
});

angular.module('tcl').factory('TestObjectSchema', function () {
    return {
        config: {
            ids: {
                active: true,
                separator: "-"
            }
        },
        types: {
            idType: {
                choice: [
                    {
                        id: "N",
                        options: {
                            min: 0
                        },
                        discriminator: function (doc, parent) {
                            return typeof parent.id === "number"
                        }
                    },
                    {
                        id: "S",
                        discriminator: function (doc, parent) {
                            return typeof parent.id !== "number"
                        }
                    }
                ]
            },
            date: {
                id: "O",
                model: [
                    {
                        choice: [
                            {
                                key: "fixed",
                                name: "Fixed",
                                id: "fx",
                                typeRef: "fixedDate",
                                usage: "R",
                                discriminator: function (parent, obj) {
                                    return !parent.hasOwnProperty("relative");
                                }
                            },
                            {
                                key: "relative",
                                name: "Relative",
                                id: "rl",
                                typeRef: "relativeDate",
                                usage: "R",
                                discriminator: function (parent, obj) {
                                    return !parent.hasOwnProperty("fixed");
                                }
                            },
                        ]
                    }
                ]
            },

            fixedDate: {
                id: "O",
                model: [
                    {
                        key: "id",
                        id: "id",
                        name: "ID",
                        typeRef: "idType",
                        usage: "O"
                    },
                    {
                        key: "date",
                        id: "dt",
                        name: "DateObj",
                        type: {
                            id: "N",
                            options: {
                                min: 0
                            }
                        },
                        usage: "R"
                    }
                ]
            },

            relativeDate: {
                id: "O",
                model: [
                    {
                        key: "id",
                        id: "id",
                        name: "ID",
                        typeRef: "idType",
                        usage: "O"
                    },
                    {
                        key: "relativeTo",
                        id: "rlt",
                        name: "Relative To",
                        type: {
                            id: "S",
                            options: {
                                min: 5
                            }
                        },
                        usage: "R"
                    },
                    {
                        key: "years",
                        id: "y",
                        name: "Years",
                        type: {
                            id: "N"
                        },
                        usage: "R"
                    },
                    {
                        key: "months",
                        id: "m",
                        name: "Months",
                        type: {
                            id: "N"
                        },
                        usage: "R"
                    },
                    {
                        key: "days",
                        id: "d",
                        name: "days",
                        type: {
                            id: "N"
                        },
                        usage: "R"
                    }
                ]
            }

        }
    };
});
