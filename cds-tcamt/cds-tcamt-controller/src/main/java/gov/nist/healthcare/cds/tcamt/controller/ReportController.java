package gov.nist.healthcare.cds.tcamt.controller;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.Charset;
import java.nio.charset.StandardCharsets;
import java.security.Principal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.xml.bind.JAXBException;
import javax.xml.datatype.DatatypeConfigurationException;

import gov.nist.healthcare.cds.domain.TestCase;
import gov.nist.healthcare.cds.domain.wrapper.Report;
import gov.nist.healthcare.cds.enumeration.EntityAccess;
import gov.nist.healthcare.cds.repositories.ReportRepository;
import gov.nist.healthcare.cds.repositories.TestCaseRepository;
import gov.nist.healthcare.cds.repositories.TestPlanRepository;
import gov.nist.healthcare.cds.service.PropertyService;
import gov.nist.healthcare.cds.service.ReportExportService;
import javassist.NotFoundException;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.util.FileCopyUtils;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;

import com.fasterxml.jackson.annotation.JsonInclude.Include;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;

@RestController
@RequestMapping(value = "/report")
public class ReportController {
	
	@Autowired
	private ReportRepository reportRepository;
	
	@Autowired
	private TestPlanRepository testPlanRepository;
	
	@Autowired
	private TestCaseRepository testCaseRepository;
	
	@Autowired
	private ReportExportService reportExport;
	
	@Autowired
	private PropertyService ledger;
	
	//-------------------------- EXPORT REPORT -------------------------------

	@RequestMapping(value = "/{id}/export/{format}", method = RequestMethod.POST)
	@ResponseBody
	public void export(@PathVariable String id,@PathVariable String format,HttpServletRequest request, HttpServletResponse response, Principal p) throws IOException, JAXBException, DatatypeConfigurationException{
		Report report = ledger.reportBelongsTo(id, p.getName());
		if(format.equals("xml") && report != null){
			response.setContentType("text/xml");
			response.setHeader("Content-disposition", "attachment;filename="+report.getTcInfo().getName().replace(" ", "_")+"_ValidationReport.xml" );
			TestCase tc = testCaseRepository.findOne(report.getTc());
			String str = reportExport.exportXML(report,tc);
			InputStream stream = new ByteArrayInputStream(str.getBytes(StandardCharsets.UTF_8));
			FileCopyUtils.copy(stream, response.getOutputStream());
		}
	}
	
	@RequestMapping(value = "/export/{format}", method = RequestMethod.POST)
	@ResponseBody
	public String exportT(@RequestBody Report report,@PathVariable String format,HttpServletRequest request, HttpServletResponse response, Principal p) throws IOException, JAXBException, DatatypeConfigurationException{
		if(format.equals("xml") && report != null){
			TestCase tc = testCaseRepository.findOne(report.getTc());
			String str = reportExport.exportXML(report,tc);
			return str;
		}
		return "";
	}
	
	//--------------------------- DOWNLOAD ALL -----------------------------------
	
	@RequestMapping(value = "/export/all/{format}", method = RequestMethod.POST, consumes = MediaType.APPLICATION_FORM_URLENCODED_VALUE)
	@ResponseBody
	public void exportL(FormData form,@PathVariable String format,HttpServletRequest request, HttpServletResponse response, Principal p) throws IOException, JAXBException, DatatypeConfigurationException, ClassNotFoundException{
		List<String> names = new ArrayList<String>();
		ObjectMapper mapper = new ObjectMapper();
		mapper.disable(SerializationFeature.INDENT_OUTPUT);
		mapper.disable(SerializationFeature.FAIL_ON_EMPTY_BEANS);
		mapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
		mapper.setSerializationInclusion(Include.NON_NULL);
		
		List<Report> reports = mapper.readValue(form.getJson(), mapper.getTypeFactory().constructCollectionType(List.class,Class.forName(form.getClazz())));

		List<String> tcs = new ArrayList<>();
		HashMap<String, TestCase> tcMap = new HashMap<>();
		
		for(Report r : reports){
			tcs.add(r.getTc());
		}
		
		Iterable<TestCase> tcL = testCaseRepository.findAll(tcs);
		for(TestCase tc : tcL){
			tcMap.put(tc.getId(), tc);
		}
		
		if(format.equals("xml")){
			ByteArrayOutputStream baos = new ByteArrayOutputStream();
			ZipOutputStream zos = new ZipOutputStream(baos);
	
			for(Report r : reports){
				String str = reportExport.exportXML(r,tcMap.get(r.getId()));
				ZipEntry ze= new ZipEntry(this.availableFilename(names, r.getTcInfo().getName())+".xml");

	        	zos.putNextEntry(ze);
	        	zos.write(str.getBytes(Charset.forName("UTF-8")));
	        	zos.closeEntry();
			}
			zos.close();
			baos.close();
			response.setContentType("application/zip");
			response.setHeader("Content-disposition", "attachment;filename=fits_testCases_export.zip");
			response.getOutputStream().write(baos.toByteArray());
		}
	}
	
	private String availableFilename(List<String> names,String name){
		String avName = name.replaceAll(" ", "_");
		
		while(names.contains(avName)){
			avName += "*";
		}
		
		names.add(avName);
		return avName;
	}

	//---------------------- SAVE, READ, DELETE ----------------------------------
	
	@RequestMapping(value = "/tc/{id}", method = RequestMethod.GET)
	@ResponseBody
	public List<Report> reports(@PathVariable String id,Principal user) throws NotFoundException {
		return reportRepository.reportsForTestCase(id, user.getName());
	}
	
	@RequestMapping(value = "/save", method = RequestMethod.POST)
	public void save(@RequestBody List<Report> reports, Principal user) {
		for(Report r : reports){
			r.setUser(user.getName());
		}
		reportRepository.save(reports);
	}
	
	@RequestMapping(value = "/delete/{id}", method = RequestMethod.GET)
	public void delete(@PathVariable String id,Principal user) throws NotFoundException {
		Report report = reportRepository.findOne(id);
		if(report == null){
			throw new NotFoundException("Report Not Found");
		}
		else {
			if(report.getUser() != null && report.getUser().equals(user.getName())){
				reportRepository.delete(id);
			}
			else {
				throw new NotFoundException("Report Not Found");
			}
		}
	}

}
