package gov.nist.healthcare.cds.tcamt.controller;

import java.util.List;

import gov.nist.healthcare.cds.domain.Vaccine;
import gov.nist.healthcare.cds.repositories.VaccineRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class VaccineController {

	@Autowired
	private VaccineRepository vaccineRepository;
	
	@RequestMapping(value = "/vaccines", method = RequestMethod.GET)
	@ResponseBody
	public List<Vaccine> test(){
		return vaccineRepository.findAll();
	}
}
