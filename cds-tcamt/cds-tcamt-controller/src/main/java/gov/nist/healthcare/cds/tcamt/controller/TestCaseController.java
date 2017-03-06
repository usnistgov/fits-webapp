package gov.nist.healthcare.cds.tcamt.controller;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.security.Principal;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Calendar;
import java.util.Date;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import javassist.NotFoundException;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import gov.nist.healthcare.cds.domain.FixedDate;
import gov.nist.healthcare.cds.domain.TestCase;
import gov.nist.healthcare.cds.domain.TestPlan;
import gov.nist.healthcare.cds.domain.exception.UnresolvableDate;
import gov.nist.healthcare.cds.domain.exception.VaccineNotFoundException;
import gov.nist.healthcare.cds.domain.wrapper.ActualEvaluation;
import gov.nist.healthcare.cds.domain.wrapper.ActualForecast;
import gov.nist.healthcare.cds.domain.wrapper.CDCImport;
import gov.nist.healthcare.cds.domain.wrapper.CDCImportConfig;
import gov.nist.healthcare.cds.domain.wrapper.EngineResponse;
import gov.nist.healthcare.cds.domain.wrapper.Report;
import gov.nist.healthcare.cds.domain.wrapper.ResponseVaccinationEvent;
import gov.nist.healthcare.cds.domain.wrapper.VaccineRef;
import gov.nist.healthcare.cds.domain.xml.ErrorModel;
import gov.nist.healthcare.cds.enumeration.EvaluationStatus;
import gov.nist.healthcare.cds.enumeration.SerieStatus;
import gov.nist.healthcare.cds.repositories.TestCaseRepository;
import gov.nist.healthcare.cds.repositories.TestPlanRepository;
import gov.nist.healthcare.cds.service.CDCSpreadSheetFormatService;
import gov.nist.healthcare.cds.service.NISTFormatService;
import gov.nist.healthcare.cds.service.TestCaseExecutionService;
import gov.nist.healthcare.cds.service.ValidationService;
import gov.nist.healthcare.cds.tcamt.domain.ImportResult;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.util.FileCopyUtils;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
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
	
	@Autowired
	private CDCSpreadSheetFormatService cdcFormatService;
	
	@Autowired
	private TestCaseExecutionService execService;

	@RequestMapping(value = "/testplans", method = RequestMethod.GET)
	@ResponseBody
	public List<TestPlan> test(Principal p){
		return testPlanRepository.findByUser(p.getName());
	}
	
	
	@RequestMapping(value = "/validate/{id}", method = RequestMethod.GET)
	@ResponseBody
	public Report validate(@PathVariable Long id) throws ParseException, UnresolvableDate{
		TestCase tc = testCaseRepository.findOne(id);
		return execService.execute(null, tc, Calendar.getInstance().getTime());
	}
	
	@RequestMapping(value = "/testcase/{id}/save", method = RequestMethod.POST)
	@ResponseBody
	public TestCase save(@RequestBody TestCase tc,@PathVariable Long id) throws NotFoundException{
		TestPlan tp = testPlanRepository.findOne(id);
		if(tp != null){
			tc.setTestPlan(tp);
		}
		else {
			throw new NotFoundException("TestPlan ("+id+")");
		}
		return testCaseRepository.save(tc);
	}
	
	@RequestMapping(value = "/testplan/save", method = RequestMethod.POST)
	@ResponseBody
	public TestPlan save(@RequestBody TestPlan tp,Principal p) throws NotFoundException {
		tp.setUser(p.getName());
		return testPlanRepository.save(tp);
	}
	
	@RequestMapping(value = "/testplan/partial/save", method = RequestMethod.POST)
	@ResponseBody
	public TestPlan saveP(@RequestBody TestPlan tp,Principal p) throws NotFoundException {
		if(tp.getId() != null){
			TestPlan _tp = testPlanRepository.findOne(tp.getId());
			tp.setTestCases(_tp.getTestCases());
		}
		tp.setUser(p.getName());
		return testPlanRepository.save(tp);
	}
	
	@RequestMapping(value = "/testcase/{id}/delete", method = RequestMethod.POST)
	@ResponseBody
	public String delete(@PathVariable Long id) throws NotFoundException{
		
		TestCase tc = testCaseRepository.findOne(id);
		if(tc == null)
			throw new NotFoundException("TC not found");
		else {
			TestPlan tp = testPlanRepository.findOne(tc.getTestPlan().getId());
			if(tp == null)
				throw new NotFoundException("TC not found");
			tp.getTestCases().remove(tc);
			testPlanRepository.saveAndFlush(tp);
		}
		return "";
	}
	
	@RequestMapping(value = "/testplan/{id}/delete", method = RequestMethod.POST)
	@ResponseBody
	public String deleteTP(@PathVariable Long id) throws NotFoundException{
		testPlanRepository.delete(id);
		return "";
	}
	
	@RequestMapping(value = "/testcase/{id}/export/{format}", method = RequestMethod.POST)
	@ResponseBody
	public void export(@PathVariable Long id,@PathVariable String format,HttpServletRequest request, HttpServletResponse response) throws IOException{
		TestCase tc = testCaseRepository.findOne(id);
		if(format.equals("nist") && tc != null){
			response.setContentType("text/xml");
			response.setHeader("Content-disposition", "attachment;filename="+tc.getName().replace(" ", "_")+".xml" );
			String str = nistFormatService._export(tc);
			InputStream stream = new ByteArrayInputStream(str.getBytes(StandardCharsets.UTF_8));
			FileCopyUtils.copy(stream, response.getOutputStream());
		}
	}
	
	@RequestMapping(value = "/testcase/{id}/import/nist", method = RequestMethod.POST)
	@ResponseBody
	public ImportResult uploadFileHandler(@RequestParam("file") MultipartFile file,@PathVariable Long id) {
		if (!file.isEmpty()) {
			try {
				byte[] bytes = file.getBytes();
				String fileContent = new String(bytes, "UTF-8");
				List<ErrorModel> errors = nistFormatService._validate(fileContent);
				if(errors.isEmpty()){
					TestCase tc = nistFormatService._import(fileContent);
					TestPlan tps = testPlanRepository.findOne(id);
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

					tc.setTestPlan(tps);
					testCaseRepository.saveAndFlush(tc);
					ImportResult ir = new ImportResult();
					ir.setStatus(true);
					ir.setErrors(null);
					ir.setMessages(null);
					ir.setImported(tc);
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
	
    @CacheEvict(value={"testplans-user","testplans"}, allEntries=true)
	@RequestMapping(value = "/testcase/{id}/import/cdc", method = RequestMethod.POST)
	@ResponseBody
	public ImportResult uploadFileHandlerCDC(@RequestPart("file") MultipartFile file,@RequestPart("config") CDCImportConfig config, @PathVariable Long id) {
		if (!file.isEmpty()) {
			try {
				byte[] bytes = file.getBytes();
//				String fileContent = new String(bytes, "UTF-8");
				ByteArrayInputStream bis = new ByteArrayInputStream(bytes);
				CDCImport importRes = cdcFormatService._import(bis,config);
				List<ErrorModel> errors = importRes.getExceptions();
				if(importRes.getTestcases().size() > 0){
					TestPlan tps = testPlanRepository.findOne(id);
					if(tps == null){
						ImportResult ir = new ImportResult();
						ir.setStatus(false);
						ir.setErrors(errors);
						ir.setMessages(Arrays.asList("Test plan not found"));
						return ir;
					}
					
					for(TestCase tc : importRes.getTestcases()){
						tc.setTestPlan(tps);
					}
					
					testCaseRepository.save(importRes.getTestcases());
					ImportResult ir = new ImportResult();
					ir.setStatus(true);
					ir.setErrors(errors);
					ir.setTestCases(importRes.getTestcases());
					ir.setMessages(null);
					return ir;
				}
				else {
					ImportResult ir = new ImportResult();
					ir.setStatus(false);
					ir.setErrors(errors);
					ir.setMessages(Arrays.asList("No TestCase Imported"));
					return ir;
				}
			} catch (IOException e) {
				ImportResult ir = new ImportResult();
				ir.setStatus(false);
				ir.setErrors(null);
				ir.setMessages(Arrays.asList("Error while reading file"));
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
