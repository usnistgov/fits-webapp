package gov.nist.healthcare.cds.tcamt.controller;

import java.security.Principal;
import java.util.List;
import gov.nist.healthcare.cds.domain.wrapper.Report;
import gov.nist.healthcare.cds.repositories.ReportRepository;
import gov.nist.healthcare.cds.repositories.TestPlanRepository;
import gov.nist.healthcare.cds.service.PropertyService;
import javassist.NotFoundException;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class ReportController {
	
	@Autowired
	private ReportRepository reportRepository;
	
	@Autowired
	private TestPlanRepository testPlanRepository;
	
	@Autowired
	private PropertyService ledger;
	
	@RequestMapping(value = "/report/save", method = RequestMethod.POST)
	public void save(@RequestBody List<Report> reports) {
		reportRepository.save(reports);
	}
	
	@RequestMapping(value = "/report/tc/{id}", method = RequestMethod.GET)
	@ResponseBody
	public List<Report> reports(@PathVariable String id,Principal user) throws NotFoundException {
		if(ledger.tcBelongsTo(id, user.getName()) == null){
			throw new NotFoundException("TC Not Found");
		}
		else {
			return reportRepository.reportsForTestCase(id);
		}
	}
	
	@RequestMapping(value = "/report/delete/{id}", method = RequestMethod.GET)
	public void delete(@PathVariable String id,Principal user) throws NotFoundException {
		Report report = reportRepository.findOne(id);
		if(report == null){
			throw new NotFoundException("Report Not Found");
		}
		else {
			if(testPlanRepository.tcUser(report.getTc()).getUser().equals(user.getName())){
				reportRepository.delete(id);
			}
			else {
				throw new NotFoundException("Report Not Found");
			}
		}
	}
	

}
