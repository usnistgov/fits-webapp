angular.module('tcl').factory('VaccineService', function ($http,$q) {
	var VaccineService = {
			getMapping : function(vxm,x){
				if(!x)
					return null;
				
				if(x.hasOwnProperty("discriminator") && x.discriminator !== ""){
					if(x.discriminator === "generic"){
						for(var mp in vxm){
							if(vxm[mp].vx.cvx === x.cvx)
								return vxm[mp];
						}
					}
					else if(x.discriminator === "specific") {
						for(var mp in vxm){
							for(var p in vxm[mp].products){
								if(vxm[mp].products[p].id === x.id)
									return vxm[mp];
							}
						}
					}
					
				}
				return null;
			},
			
			getGroups : function(vxm,x){
				var mp = VaccineService.getMapping(vxm,x);
				if(mp){
					return mp.groups;
				}
				else {
					return [];
				}
			},
			
			getVx : function(vxm,cvx){
				for(var mp in vxm){
					if(vxm[mp].vx.cvx === cvx)
						return vxm[mp].vx;
				}
				return null;
			},

			load : function () {
                var deferred = $q.defer();
                var v = {};
                $http.get('api/vxg').then(
					function(response) {
						v.vxgs = response.data;
                        $http.get('api/vxm').then(
							function(response) {
								v.vxm = response.data;
								deferred.resolve(v);
							},
							function(error) {
								deferred.reject("Could not load Vaccine Mappings");
							}
						);
					},
					function(error) {
                        deferred.reject("Could not load Vaccine Groups");
					}
				);
                return deferred.promise;
            }
	};
	return VaccineService;
});
