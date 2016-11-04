package gov.nist.healthcare.cds.tcamt.controller;

import java.io.BufferedOutputStream;
import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.List;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import gov.nist.healthcare.cds.domain.TestCase;
import gov.nist.healthcare.cds.domain.TestPlan;
import gov.nist.healthcare.cds.domain.exception.VaccineNotFoundException;
import gov.nist.healthcare.cds.domain.xml.XMLError;
import gov.nist.healthcare.cds.repositories.TestCaseRepository;
import gov.nist.healthcare.cds.repositories.TestPlanRepository;
import gov.nist.healthcare.cds.service.NISTFormatService;
import gov.nist.healthcare.cds.tcamt.domain.ImportResult;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.util.FileCopyUtils;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
public class TestCaseController {

	@Autowired
	private TestCaseRepository testCaseRepository;
	
	@Autowired
	private TestPlanRepository testPlanRepository;
	
	@Autowired
	private NISTFormatService nistFormatService;
	
	@RequestMapping(value = "/testcases", method = RequestMethod.GET)
	@ResponseBody
	public List<TestCase> testCases(){
		return testCaseRepository.findAll();
	}
	
	@RequestMapping(value = "/testplans", method = RequestMethod.GET)
	@ResponseBody
	public List<TestPlan> test(){
		return testPlanRepository.findAll();
	}
	
	@RequestMapping(value = "/testcase/save", method = RequestMethod.POST)
	@ResponseBody
	public String save(@RequestBody TestCase tc){
		testCaseRepository.save(tc);
		return "";
	}
	
	@RequestMapping(value = "/testcase/{id}/export/{format}", method = RequestMethod.POST)
	@ResponseBody
	public void export(@PathVariable Long id,@PathVariable String format,HttpServletRequest request, HttpServletResponse response) throws IOException{
		TestCase tc = testCaseRepository.findOne(id);
		if(format.equals("nist")){
			response.setContentType("text/xml");
			response.setHeader("Content-disposition", "attachment;filename="+tc.getName().replace(" ", "_")+".xml" );
			String str = nistFormatService._export(tc);
			InputStream stream = new ByteArrayInputStream(str.getBytes(StandardCharsets.UTF_8));
			FileCopyUtils.copy(stream, response.getOutputStream());
		}
	}
	
	@RequestMapping(value = "/testcase/import", method = RequestMethod.POST)
	@ResponseBody
	public ImportResult uploadFileHandler(@RequestParam("file") MultipartFile file) {
		Long tp = 1L;
		if (!file.isEmpty()) {
			try {
				byte[] bytes = file.getBytes();
				String fileContent = new String(bytes, "UTF-8");
				List<XMLError> errors = nistFormatService._validate(fileContent);
				if(errors.isEmpty()){
					TestCase tc = nistFormatService._import(fileContent);
					TestPlan tps = testPlanRepository.findOne(tp);
					if(tps == null){
						ImportResult ir = new ImportResult();
						ir.setStatus(false);
						ir.setErrors(null);
						ir.setMessages(Arrays.asList("Test plan not found"));
						return ir;
					}
					if(tc == null){
						ImportResult ir = new ImportResult();
						ir.setStatus(false);
						ir.setErrors(null);
						ir.setMessages(Arrays.asList("Error while parsing the file"));
						return ir;
					}
					
//					System.out.println("[HTC] "+tc.getId());
//					tc.setTestPlan(tps);
//					testCaseRepository.saveAndFlush(tc);
					tps.addTestCase(tc);
					tc.setTestPlan(tps);
					testPlanRepository.save(tps);
					ImportResult ir = new ImportResult();
					ir.setStatus(true);
					ir.setErrors(null);
					ir.setMessages(null);
					return ir;
				}
				else {
					ImportResult ir = new ImportResult();
					ir.setStatus(false);
					ir.setErrors(errors);
					ir.setMessages(null);
					return ir;
				}
			} catch (IOException e) {
				ImportResult ir = new ImportResult();
				ir.setStatus(false);
				ir.setErrors(null);
				ir.setMessages(Arrays.asList("Error while reading file"));
				return ir;
			} catch (VaccineNotFoundException e) {
				ImportResult ir = new ImportResult();
				ir.setStatus(false);
				ir.setErrors(null);
				ir.setMessages(Arrays.asList("Vaccine with CVX = "+e.getCvx()+" not found"));
				return ir;
			}
		} else {
			ImportResult ir = new ImportResult();
			ir.setStatus(false);
			ir.setErrors(null);
			ir.setMessages(Arrays.asList("Imported file should not be empty"));
			return ir;
		}
	}
	
}
