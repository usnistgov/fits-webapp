package gov.nist.healthcare.cds.tcamt.controller;

import java.util.List;

import gov.nist.healthcare.cds.domain.TestCase;
import gov.nist.healthcare.cds.repositories.TestCaseRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.dataformat.xml.XmlMapper;

@RestController
public class TestCaseController {

	@Autowired
	private TestCaseRepository testCaseRepository;
	
	@RequestMapping(value = "/testCases", method = RequestMethod.GET)
	@ResponseBody
	public List<TestCase> test(){
		return testCaseRepository.findAll();
	}
	
	@RequestMapping(value = "/testCases/edit", method = RequestMethod.POST, consumes="application/json")
	@ResponseBody
	public String edit(@RequestBody TestCase tc){
		System.out.println("[HT] "+tc);
		return "";
	}
	
	@RequestMapping(value = "/testCases/{id}/export", method = RequestMethod.GET, produces = "text/xml")
	@ResponseBody
	public String edit(@PathVariable Long id) throws JsonProcessingException{
		XmlMapper xmlMapper = new XmlMapper();
		String xml = xmlMapper.writeValueAsString(testCaseRepository.findOne(id));
		return xml;
	}
}
