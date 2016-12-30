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
		controller : function($modal,VaccineService) {
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
			
			this.getVx = function(p){
				var mp = VaccineService.getMapping(ctrl.vxm,p);
				return VaccineService.getVx(ctrl.vxm,mp.vx.cvx);
			};
		},
		controllerAs: 'ctrl',
		bindToController: true
	};
});