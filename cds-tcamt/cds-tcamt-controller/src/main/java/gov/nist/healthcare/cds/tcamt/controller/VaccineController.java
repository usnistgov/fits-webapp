package gov.nist.healthcare.cds.tcamt.controller;

import java.util.List;

import gov.nist.healthcare.cds.domain.Product;
import gov.nist.healthcare.cds.domain.Vaccine;
import gov.nist.healthcare.cds.domain.VaccineGroup;
import gov.nist.healthcare.cds.domain.VaccineMapping;
import gov.nist.healthcare.cds.repositories.ProductRepository;
import gov.nist.healthcare.cds.repositories.VaccineGroupRepository;
import gov.nist.healthcare.cds.repositories.VaccineMappingRepository;
import gov.nist.healthcare.cds.repositories.VaccineRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class VaccineController {

	@Autowired
	private VaccineMappingRepository vxMRepository;
	
	@Autowired
	private VaccineRepository vaccineRepository;
	
	@Autowired
	private ProductRepository productRepository;
	
	@Autowired
	private VaccineGroupRepository vxgRepository;
	
	@RequestMapping(value = "/vaccines", method = RequestMethod.GET)
	@ResponseBody
	public List<Vaccine> v(){
		return vaccineRepository.findAll();
	}
	
	@RequestMapping(value = "/products", method = RequestMethod.GET)
	@ResponseBody
	public List<Product> p(){
		return productRepository.findAll();
	}
	
	@RequestMapping(value = "/vxm", method = RequestMethod.GET)
	@ResponseBody
	public List<VaccineMapping> vm(){
		return vxMRepository.findAll();
	}
	
	@RequestMapping(value = "/vx", method = RequestMethod.POST)
	@ResponseBody
	public String vm(@RequestBody Vaccine v){
		System.out.println(v);
		return "";
	}
	
	@RequestMapping(value = "/vxg", method = RequestMethod.GET)
	@ResponseBody
	public List<VaccineGroup> vg(){
		return vxgRepository.findAll();
	}
}
