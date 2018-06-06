package gov.nist.healthcare.cds.tcamt.controller;

import java.io.IOException;
import java.security.Principal;
import java.util.ArrayList;
import java.util.List;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;

import gov.nist.healthcare.cds.domain.SoftwareConfig;
import gov.nist.healthcare.cds.domain.TestCase;
import gov.nist.healthcare.cds.domain.TestCaseGroup;
import gov.nist.healthcare.cds.domain.TestPlan;
import gov.nist.healthcare.cds.domain.TransientExecRequest;
import gov.nist.healthcare.cds.domain.exception.ConnectionException;
import gov.nist.healthcare.cds.domain.exception.UnresolvableDate;
import gov.nist.healthcare.cds.domain.wrapper.AggregateReport;
import gov.nist.healthcare.cds.domain.wrapper.ExecutionConfig;
import gov.nist.healthcare.cds.domain.wrapper.Report;
import gov.nist.healthcare.cds.domain.wrapper.TestPlanDetails;
import gov.nist.healthcare.cds.enumeration.EntityAccess;
import gov.nist.healthcare.cds.repositories.SoftwareConfigRepository;
import gov.nist.healthcare.cds.repositories.TestPlanRepository;
import gov.nist.healthcare.cds.service.AggregateReportService;
import gov.nist.healthcare.cds.service.PropertyService;
import gov.nist.healthcare.cds.service.TestCaseExecutionService;
import gov.nist.healthcare.cds.service.impl.data.RWTestPlanFilter;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class TestExecutionController {
	
	@Autowired
	private SoftwareConfigRepository softwareConfigRepository;

	@Autowired
	private TestCaseExecutionService execService;
	
	@Autowired
	private TestPlanRepository testPlanRepository;
	
	@Autowired
	private AggregateReportService aggregateService;
	
	@Autowired
	private PropertyService ledger;
	
	@Autowired
	private RWTestPlanFilter filter; 

	//------------------------ SOFTWARE CONFIGURATION -----------------------------
	
	@RequestMapping(value = "/exec/configs", method = RequestMethod.GET)
	@ResponseBody
	public List<SoftwareConfig> configs(Principal p){
		return softwareConfigRepository.findByUser(p.getName());
	}
	
	@RequestMapping(value = "/exec/configs/save", method = RequestMethod.POST)
	@ResponseBody
	public SoftwareConfig save(@RequestBody SoftwareConfig sc,Principal user) {
		sc.setUser(user.getName());
		return softwareConfigRepository.save(sc);
	}
	
	@RequestMapping(value = "/exec/configs/delete/{id}", method = RequestMethod.POST)
	public void defaultConfig(HttpSession session, @PathVariable String id, Principal user) {
		SoftwareConfig config = softwareConfigRepository.findOne(id);
		if(config != null && config.getUser().equals(user.getName())){
			SoftwareConfig defaultC = (SoftwareConfig) session.getAttribute("defaultConfig");
			if(defaultC != null && config.getId().equals(defaultC.getId())){
				session.setAttribute("defaultConfig",null);
			}
			softwareConfigRepository.delete(id);
		}
	}
	
	//------------------------ TESTCASE LIST ---------------------------------
	@RequestMapping(value = "/exec/tps", method = RequestMethod.GET)
	@ResponseBody
	public List<TestPlan> tps(Principal p, HttpServletResponse response) throws UnresolvableDate, IOException {
		List<TestPlan> tps = testPlanRepository.findByUser(p.getName());
		for(TestPlan tp : testPlanRepository.sharedWithUser(p.getName())){
			filter.filterTestPlan(tp);
			tps.add(tp);
		}
		return tps;
	}
	
	@RequestMapping(value = "/exec/short/tps", method = RequestMethod.GET)
	@ResponseBody
	public List<TestPlanDetails> tpshort(Principal p, HttpServletResponse response) throws UnresolvableDate, IOException {
		List<TestPlan> tps = testPlanRepository.findByUser(p.getName());
		for(TestPlan tp : testPlanRepository.sharedWithUser(p.getName())){
			filter.filterTestPlan(tp);
			tps.add(tp);
		}
		List<TestPlanDetails> details = new ArrayList<>();
		for(TestPlan tp : tps){
			int nbTc = tp.getTestCases().size();
			for(TestCaseGroup tcg : tp.getTestCaseGroups()){
				nbTc += tcg.getTestCases().size();
			}
			details.add(new TestPlanDetails(tp.getName(), tp.getId(), nbTc));
		}
		return details;
	}
	
	//------------------------ EXECUTE TEST CASE -----------------------------
	
	@RequestMapping(value = "/exec/tc/{id}", method = RequestMethod.POST)
	@ResponseBody
	public Report add(@RequestBody ExecutionConfig sc, @PathVariable String id,Principal user, HttpServletResponse response) throws UnresolvableDate, IOException {
		TestCase tc = ledger.tcBelongsTo(id, user.getName(), EntityAccess.R);
		SoftwareConfig config = ledger.configBelongsTo(sc.getSoftware(), user.getName());
		if(tc == null || config == null){
			System.out.println("TC "+tc);
			System.out.println("CONF "+config);
			response.sendError(403,"TestCase or Configuration does not belong to user");
			return null;
		}
		else if(!tc.isRunnable()){
			response.sendError(500,"TestCase is not complete and therefore can't be executed");
			return null;
		}
		else {
			try {
				return execService.execute(config, tc, sc.getDate());
			}
			catch(ConnectionException ex){
				System.out.println(ex);
				ex.printStackTrace();
				response.sendError(this.code(ex.getStatusCode()),ex.getStatusText());
				return null;
			}
		}
	}
	
	@RequestMapping(value = "/exec/tcs", method = RequestMethod.POST)
	@ResponseBody
	public List<Report> execAll(@RequestBody TransientExecRequest execRequest,Principal user, HttpServletResponse response) throws UnresolvableDate, IOException {
		List<Report> reports = new ArrayList<Report>();
		for(String id : execRequest.getTestCases()){
			TestCase tc = ledger.tcBelongsTo(id, user.getName(), EntityAccess.R);
			SoftwareConfig config = execRequest.getSoftware();
			if(tc == null || config == null){
				response.sendError(403,"TestCase does not belong to user or Configuration is not set");
				return null;
			}
			else if(!tc.isRunnable()){
				response.sendError(500,"TestCase is not complete and therefore can't be executed");
				return null;
			}
			else {
				try {
					reports.add(execService.execute(config, tc, execRequest.getDate()));
				}
				catch(ConnectionException ex){
					response.sendError(this.code(ex.getStatusCode()),ex.getStatusText());
					return null;
				}
			}
		}
		return reports;
	}
	
	@RequestMapping(value = "/exec/agg", method = RequestMethod.POST)
	@ResponseBody
	public AggregateReport aggregate(@RequestBody List<Report> reports, Principal user) {
		return aggregateService.aggregate(reports);
	}
	
	private int code(String s){
		if(s == null)
			return 500;
		else {
			try{
				int i = Integer.parseInt(s);
				return i;
			}
			catch(Exception ex){
				return 500;
			}
		}
	}
	
}
