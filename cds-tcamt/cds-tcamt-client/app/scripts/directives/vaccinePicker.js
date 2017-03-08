angular.module('tcl').directive('vaccinePicker', function() {
  return {
    templateUrl: 'vaccinePicker.html',
    restrict: 'E',
    scope: {
      vxm: "=",
      vxg: "=",
      model: "=",
      allowMvx: "="
    },
    controller: function($rootScope, $modal, VaccineService) {
      var ctrl = this;
      this.searchVx = function() {
        var modalInstance = $modal.open({
          templateUrl: 'VaccineBrowse.html',
          controller: 'VaccineBrowseCtrl',
          windowClass: 'app-modal-window',
          resolve: {
            groups: function() {
              return ctrl.vxg;
            },
            mappings: function() {
              return ctrl.vxm;
            },
            allowMvx: function() {
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

      this.select = function() {
        if (ctrl.qMx) {
          ctrl.model = JSON.parse(JSON.stringify(ctrl.qMx));
        } else if (ctrl.qMp) {
          ctrl.model = JSON.parse(JSON.stringify(ctrl.qMp.vx));
        }
        ctrl.clearqMp();
        ctrl.clearqMx();
      };

      $rootScope.$on('vp_clear', function(event, data) {
        console.log("vp_clear");
        if (data) {
          ctrl.clearqMp();
          ctrl.clearqMx();
        }
      });

      this.getVx = function(p) {
        var mp = VaccineService.getMapping(ctrl.vxm, p);
        if (mp)
          return VaccineService.getVx(ctrl.vxm, mp.vx.cvx);
        else
          return null;
      };

      this.setqMp = function(mp) {
        ctrl.qMp = mp;
      };
      this.qMp = null;
      this.clearqMp = function() {
        ctrl.qMp = null;
        ctrl.qsearch = "";
      };
      this.qsearchL = [];

      this.setqMx = function(mp) {
        ctrl.qMx = mp;
      };
      this.qMx = null;
      this.clearqMx = function() {
        ctrl.qMx = null;
        ctrl.qsearchMX = "";
      };
      this.qsearchLX = [];
    },
    controllerAs: 'ctrl',
    bindToController: true
  };
});

angular.module('tcl').directive('report', function() {
  return {
    templateUrl: 'report.html',
    restrict: 'E',
    scope: {
      report: "=",
      general: "=",
      vxm: "="
    },
    controller: function($scope,$filter) {
      $scope.correctness = function(f, p, u, w) {
        var total = f + p + w;
        var correct = p;
        return total === 0 ? 100 : $filter('number')(correct / total,2) * 100;
      };
      $scope.completion = function(f, p, u, w) {
        var total = f + p + w + u;
        var found = f + p + w;
        return total === 0 ? 100 : $filter('number')(found / total,2) * 100;
      };
    }
  };
});

angular.module('tcl').directive('eventReport', function() {
  return {
    templateUrl: 'vereport.html',
    restrict: 'E',
    scope: {
      reportList: "=data",
      vxm: "="
    },
    controller: function($scope, VaccineService) {
      $scope.getVx = function(p) {
        var mp = VaccineService.getMapping($scope.vxm, p);
        if (mp)
          return VaccineService.getVx($scope.vxm, mp.vx.cvx);
        else
          return null;
      };

      $scope.actual = function(node) {
        if (node.status === 'P') {
          return "PASSED";
        } else if (node.status === 'F' || node.status === 'W') {
          return node.value;
        } else if (node.status === 'U') {
          return "NO MATCH";
        }
        return "ERROR";
      };
    }
  };
});

angular.module('tcl').directive('forecastReport', function() {
  return {
    templateUrl: 'fcreport.html',
    restrict: 'E',
    scope: {
      reportList: "=data"
    },
    controller: function($scope, $filter) {
      $scope.actual = function(exp, node) {
        if (node.status === 'P') {
          return "PASSED";
        } else if (node.status === 'F' || node.status === 'W') {
          return $filter('date')(node.value, "MM/dd/yyyy") + " ( " + $scope.diff(exp, node.value) + " )";
        } else if (node.status === 'U') {
          return "NO MATCH";
        }
        return "ERROR";
      };

      $scope.diff = function(expected, actual) {
        var days = (expected - actual) / 86400000;
        var ds = Math.round(days);
        
        return (ds > 0 ? "minus " : "plus ") +  Math.abs(Math.round(days)) + " days";
      };
    }
  };
});

angular.module('tcl').directive('prettyprint', function() {
  return {
    restrict: 'C',
    controller: function($scope, $filter) {
    	$scope.beauty = "";
    	$scope.formatXml = function(xml) {
    	    var formatted = '';
    	    var reg = /(>)(<)(\/*)/g;
    	    xml = xml.replace(reg, '$1\r\n$2$3');
    	    var pad = 0;
    	    jQuery.each(xml.split('\r\n'), function(index, node) {
    	        var indent = 0;
    	        if (node.match( /.+<\/\w[^>]*>$/ )) {
    	            indent = 0;
    	        } else if (node.match( /^<\/\w/ )) {
    	            if (pad != 0) {
    	                pad -= 1;
    	            }
    	        } else if (node.match( /^<\w([^>]*[^\/])?>.*$/ )) {
    	            indent = 1;
    	        } else {
    	            indent = 0;
    	        }

    	        var padding = '';
    	        for (var i = 0; i < pad; i++) {
    	            padding += '  ';
    	        }

    	        formatted += padding + node + '\r\n';
    	        pad += indent;
    	    });

    	    return formatted;
    	};
    	$scope.$watch('report["response"]', function(){
    		$scope.beauty = $scope.formatXml($scope.report.response);
    	});
    }
  };
});