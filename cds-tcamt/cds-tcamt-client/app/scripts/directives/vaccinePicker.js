angular.module('tcl').directive('vaccinePicker', function() {
	return {
		templateUrl : 'vaccinePicker.html',
		restrict : 'E',
		scope	 : {
			vxm      : "=",
			vxg		 : "=",
			model    : "=",
			allowMvx : "="
		},
		controller : function($rootScope,$modal,VaccineService) {
			var ctrl = this;
			this.searchVx = function() {
				var modalInstance = $modal.open({
					templateUrl : 'VaccineBrowse.html',
					controller : 'VaccineBrowseCtrl',
					windowClass: 'app-modal-window',
					resolve : {
						groups : function() {
							return ctrl.vxg;
						},
						mappings : function() {
							return ctrl.vxm;
						},
						allowMvx : function() {
							return ctrl.allowMvx;
						}
					}
				});
				modalInstance.result.then(function(vx) {
					ctrl.model = vx;
				});
			};
			
			this.clearVx = function() {
				ctrl.model = null;
			};

			this.select = function () {
				if(ctrl.qMx){
                    ctrl.model = JSON.parse(JSON.stringify(ctrl.qMx));
				}
				else if(ctrl.qMp){
                    ctrl.model = JSON.parse(JSON.stringify(ctrl.qMp.vx));
				}
                ctrl.clearqMp();
                ctrl.clearqMx();
            };

            $rootScope.$on('vp_clear', function (event, data) {
            	console.log("vp_clear");
                if(data){
                    ctrl.clearqMp();
                    ctrl.clearqMx();
				}
            });

			this.getVx = function(p){
				var mp = VaccineService.getMapping(ctrl.vxm,p);
				if(mp)
					return VaccineService.getVx(ctrl.vxm,mp.vx.cvx);
				else
					return null;
			};

			this.setqMp = function(mp){
				ctrl.qMp = mp;
			};
			this.qMp = null;
			this.clearqMp = function () {
				ctrl.qMp = null;
                ctrl.qsearch = "";
            };
			this.qsearchL = [];

            this.setqMx = function(mp){
                ctrl.qMx = mp;
            };
            this.qMx = null;
            this.clearqMx = function () {
                ctrl.qMx = null;
                ctrl.qsearchMX = "";
            };
            this.qsearchLX = [];
		},
		controllerAs: 'ctrl',
		bindToController: true
	};
});