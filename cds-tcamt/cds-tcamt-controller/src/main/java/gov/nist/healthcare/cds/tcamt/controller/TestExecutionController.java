package gov.nist.healthcare.cds.tcamt.controller;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.security.Principal;
import java.util.Calendar;
import java.util.List;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;
import javax.xml.bind.JAXBException;
import javax.xml.datatype.DatatypeConfigurationException;

import gov.nist.healthcare.cds.domain.SoftwareConfig;
import gov.nist.healthcare.cds.domain.TestCase;
import gov.nist.healthcare.cds.domain.TestCaseGroup;
import gov.nist.healthcare.cds.domain.TestExecution;
import gov.nist.healthcare.cds.domain.TestPlan;
import gov.nist.healthcare.cds.domain.exception.ConnectionException;
import gov.nist.healthcare.cds.domain.exception.UnresolvableDate;
import gov.nist.healthcare.cds.domain.wrapper.AggregateReport;
import gov.nist.healthcare.cds.domain.wrapper.Counts;
import gov.nist.healthcare.cds.domain.wrapper.ExecutionConfig;
import gov.nist.healthcare.cds.domain.wrapper.Report;
import gov.nist.healthcare.cds.repositories.SoftwareConfigRepository;
import gov.nist.healthcare.cds.repositories.TestCaseRepository;
import gov.nist.healthcare.cds.repositories.TestPlanRepository;
import gov.nist.healthcare.cds.service.AggregateReportService;
import gov.nist.healthcare.cds.service.PropertyService;
import gov.nist.healthcare.cds.service.ReportExportService;
import gov.nist.healthcare.cds.service.TestCaseExecutionService;

import org.apache.http.HttpResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.util.FileCopyUtils;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class TestExecutionController {
	
	@Autowired
	private SoftwareConfigRepository softwareConfigRepository;

	@Autowired
	private TestCaseExecutionService execService;
	
	@Autowired
	private TestCaseRepository testCaseRepository;
	
	@Autowired
	private TestPlanRepository testPlanRepository;
	
	@Autowired
	private ReportExportService reportExport;
	
	@Autowired
	private AggregateReportService aggregateService;
	
	@Autowired
	private PropertyService ledger;

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
	
//	@RequestMapping(value = "/exec/start", method = RequestMethod.POST)
//	public boolean start(@RequestBody ExecutionConfig sc, HttpSession session, Principal user) {
//		SoftwareConfig config = softwareConfigRepository.findOne(sc.getSoftware());
//		if(config.getUser().equals(user.getName())){
//			TestExecution exec = new TestExecution();
//			exec.setSoftware(config);
//			if(sc.getDate() != null){
//				exec.setExecutionDate(sc.getDate());
//			}
//			else {
//				exec.setExecutionDate(Calendar.getInstance().getTime());
//			}		
//			session.setAttribute("exec", exec);
//			session.setAttribute("defaultConfig", config);
//			session.setAttribute("set", true);
//			return true;
//		}
//		else{
//			return false;
//		}
//	}
	
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
	
	@RequestMapping(value = "/report/{id}/export/{format}", method = RequestMethod.POST)
	@ResponseBody
	public void export(@PathVariable String id,@PathVariable String format,HttpServletRequest request, HttpServletResponse response, Principal p) throws IOException, JAXBException, DatatypeConfigurationException{
		Report report = ledger.reportBelongsTo(id, p.getName());
		if(format.equals("xml") && report != null){
			response.setContentType("text/xml");
			response.setHeader("Content-disposition", "attachment;filename="+report.getTcInfo().getName().replace(" ", "_")+"_ValidationReport.xml" );
			TestCase tc = testCaseRepository.findOne(report.getTc());
			String str = reportExport.exportXML(report,tc);
			System.out.println("[HTREPORT]");
			System.out.println(str);
			InputStream stream = new ByteArrayInputStream(str.getBytes(StandardCharsets.UTF_8));
			FileCopyUtils.copy(stream, response.getOutputStream());
		}
	}
	
	@RequestMapping(value = "/report/export/{format}", method = RequestMethod.POST)
	@ResponseBody
	public String exportT(@RequestBody Report report,@PathVariable String format,HttpServletRequest request, HttpServletResponse response, Principal p) throws IOException, JAXBException, DatatypeConfigurationException{
		if(format.equals("xml") && report != null){
			//response.setContentType("text/xml");
			//response.setHeader("Content-disposition", "attachment;filename="+report.getTcInfo().getName().replace(" ", "_")+"_ValidationReport.xml" );
			TestCase tc = testCaseRepository.findOne(report.getTc());
			String str = reportExport.exportXML(report,tc);
			return str;
		}
		return "";
	}


	
	@RequestMapping(value = "/exec/tc/{id}", method = RequestMethod.POST)
	@ResponseBody
	public Report add(@RequestBody ExecutionConfig sc, @PathVariable String id,Principal user, HttpServletResponse response) throws UnresolvableDate, IOException {
		TestCase tc = ledger.tcBelongsTo(id, user.getName());
		SoftwareConfig config = ledger.configBelongsTo(sc.getSoftware(), user.getName());
		if(tc == null || config == null){
			response.sendError(403,"TestCase or Configuration does not belong to user");
			return null;
		}
		else {
			try {
				return execService.execute(config, tc, sc.getDate());
			}
			catch(ConnectionException ex){
				response.sendError(this.code(ex.getStatusCode()),ex.getStatusText());
				return null;
			}
		}
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
	
	@RequestMapping(value = "/exec/collect", method = RequestMethod.GET)
	public TestExecution collect(HttpSession session, Principal user) {
		TestExecution exec = (TestExecution) session.getAttribute("exec");
		return exec;
	}
	
	@RequestMapping(value = "/exec/agg", method = RequestMethod.POST)
	@ResponseBody
	public AggregateReport aggregate(@RequestBody List<Report> reports, HttpSession session, Principal user) {
		return aggregateService.aggregate(reports);
	}
	
	
}
