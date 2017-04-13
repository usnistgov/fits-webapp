/**
 * Created by Hossam Tamri on 4/9/17.
 */

angular.module('tcl').factory('NavigatorService', function ($q, ResponseService, EntityService, EntityUtilsService) {

    function Navigator() {
        var ctrl = this;
        var screen = null;
        this.onGoing = null;
        this.SELECTION_CASCADE = [];

        this.tabs = {
            TEST_PLAN_INFO: 'TEST_PLAN_INFO',
            TEST_PLAN_IMPORT: 'TEST_PLAN_IMPORT',
            TEST_CASE_GEN_INFO: 'TEST_CASE_GEN_INFO',
            TEST_CASE_SUMMARY: 'TEST_CASE_SUMMARY',
            EVENT_INFO: 'EVENT_INFO',
            EVAL_INFO: 'EVAL_INFO'
        };

        this.vID = {
            TEST_PLAN : 'TEST_PLAN',
            TEST_CASE_GROUP : 'TEST_CASE_GROUP',
            TEST_CASE : 'TEST_CASE',
            EVENT : 'EVENT',
            PATIENT_A : 'PATIENT_A',
            FORECAST : 'FORECAST'
        };

        this.exceptions = {
            CANT_RESOLVE_PARENT : 'Was not able to resolve parent from current cascade'
        };

        this.setScreen = function(s){
            screen = s;
        };

        function ViewObject(hlwlo, id, tpl, t, type) {

            var vo = this;
            vo.VIEW_ID = id;
            vo.tpl = tpl;
            vo.activeTab = 0;
            vo.tabs = t;
            vo.model = null;
            vo.entity = type;
            vo.before = [];
            vo.after = [];
            vo.highlightWhenleafOnly = hlwlo;

            vo.goToTab = function (i) {
                if (i >= 0 && i < ctrl.tabs.length)
                    ctrl.activeTab = i;
            };

            vo.resetTab = function () {
                ctrl.goToTab(0);
            };

            vo.active = function () {
                return ctrl.tabs[ctrl.activeTab];
            };

            vo.setModel = function (m) {
                vo.model = m;
            };

            vo.between = function (b,a) {
                vo.before = b;
                vo.after = a;
            };

        }


        this.views = {
            TEST_PLAN: new ViewObject(true,ctrl.vID.TEST_PLAN, "EditTestPlanData.html", [ctrl.tabs.TEST_PLAN_INFO, ctrl.TEST_PLAN_IMPORT], EntityService.type.TEST_PLAN),
            TEST_CASE_GROUP: new ViewObject(true,ctrl.vID.TEST_CASE_GROUP, "EditTestGroupMetadata.html", null, EntityService.type.TEST_CASE_GROUP),
            TEST_CASE: new ViewObject(false,ctrl.vID.TEST_CASE, "EditTestPlanMetadata.html", [ctrl.tabs.TEST_CASE_GEN_INFO, ctrl.TEST_CASE_SUMMARY], EntityService.type.TEST_CASE),
            EVENT: new ViewObject(true,ctrl.vID.EVENT, "EditEventData.html", [ctrl.tabs.EVENT_INFO, ctrl.EVAL_INFO]),
            PATIENT_A: new ViewObject(true,ctrl.vID.PATIENT_A, "EditPatientInformation.html"),
            FORECAST: new ViewObject(true,ctrl.vID.FORECAST, "EditForecastData.html")
        };
        // this.views.EVENT.between([this.vID.TEST_CASE],[]);
        // this.views.PATIENT_A.between([this.vID.TEST_CASE],[]);
        // this.views.FORECAST.between([this.vID.TEST_CASE],[]);

        this.showMe = function (type, model) {
            var v = ctrl.viewByID(type);
            v.setModel(model);
            if(v.parent() === null){
                this.SELECTION_CASCADE.splice(0,this.SELECTION_CASCADE.length);
                this.SELECTION_CASCADE.push(v);
            }
            else if(v.parent() === ctrl.onGoing.VIEW_ID){

            }
        };

        this.fct = function (type, model, options) {
            if(type === ctrl.vID.TEST_PLAN){
                ctrl.views.TEST_CASE_GROUP.model = null;
                ctrl.views.TEST_CASE.model = null;
                ctrl.views.TEST_CASE.model = null;
            }
            else if(type === ctrl.vID.TEST_CASE_GROUP){
                ctrl.views.TEST_CASE_GROUP.setModel(model);
                ctrl.SELECTION_CASCADE.splice(1,ctrl.SELECTION_CASCADE.length);
                ctrl.SELECTION_CASCADE.push(ctrl.views.TEST_CASE_GROUP);
            }
            else if(type === ctrl.vID.TEST_CASE){
                var id = 1;
                if(options && options.hasGroup){
                    ctrl.fct(ctrl.vID.TEST_CASE_GROUP, options.parent);
                    id++;
                }
                ctrl.views.TEST_CASE.setModel(model);
                ctrl.SELECTION_CASCADE.splice(id,ctrl.SELECTION_CASCADE.length);
                ctrl.SELECTION_CASCADE.push(ctrl.views.TEST_CASE);
            }
            else if(type === ctrl.vID.EVENT){
                ctrl.views.EVENT.setModel(model);
                if(ctrl.SELECTION_CASCADE[ctrl.SELECTION_CASCADE.length - 1].VIEW_ID !== ctrl.vID.TEST_CASE){
                    ctrl.SELECTION_CASCADE.splice(ctrl.SELECTION_CASCADE.length-1,1);
                }
                ctrl.SELECTION_CASCADE.push(ctrl.views.EVENT);

                this.SELECTION_CASCADE.push(ctrl.views.EVENT);
                ctrl.views.PATIENT_A.setModel(model);
                ctrl.views.FORECAST.setModel(model);
            }
            else if(type === ctrl.vID.PATIENT_A){
                ctrl.views.PATIENT_A.setModel(model);
                if(ctrl.SELECTION_CASCADE[ctrl.SELECTION_CASCADE.length - 1].VIEW_ID !== ctrl.vID.TEST_CASE){
                    ctrl.SELECTION_CASCADE.splice(ctrl.SELECTION_CASCADE.length-1,1);
                }
                this.SELECTION_CASCADE.push(ctrl.views.PATIENT_A);
            }
            else if(type === ctrl.vID.FORECAST){
                ctrl.views.FORECAST.setModel(model);
                if(ctrl.SELECTION_CASCADE[ctrl.SELECTION_CASCADE.length - 1].VIEW_ID !== ctrl.vID.TEST_CASE){
                    ctrl.SELECTION_CASCADE.splice(ctrl.SELECTION_CASCADE.length-1,1);
                }
                this.SELECTION_CASCADE.push(ctrl.views.FORECAST);
            }
        };

        this.isBefore = function (a,b) {
          var v = this.viewByID(a);
          if(v.after.length == 0){
              return false;
          }
          else if(~v.after.indexOf(b)){
              return true;
          }
          else {
              for(var i = 0; i < v.after.length; i++){
                  if(ctrl.isBefore(v.after[i],b)){
                      return true;
                  }
              }
              return false;
          }
        };

        this.getModelForType = function (type) {
            for(var c = 0; c < ctrl.SELECTION_CASCADE.length; c++){
                if(ctrl.SELECTION_CASCADE[c].VIEW_ID === type){
                    return ctrl.SELECTION_CASCADE[c].model;
                }
            }
        };

        this.view = function (viewObject) {
            screen = viewObject.tpl;
            ctrl.onGoing = viewObject;
        };

        this.viewByID = function (id) {
            if(ctrl.views.hasOwnProperty(id)){
                return ctrl.views[id];
            }
            else {
                throw "FITS : Unknown view "+id;
            }
        };


        this.step = function (vo) {
            this.SELECTION_CASCADE
        }
    }

    return new Navigator();
});
