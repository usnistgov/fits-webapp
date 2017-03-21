package gov.nist.healthcare.cds.tcamt.controller;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.security.Principal;
import java.text.ParseException;
import java.util.Arrays;
import java.util.Calendar;
import java.util.List;

import javassist.NotFoundException;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.validation.Valid;

import gov.nist.healthcare.cds.domain.TestCase;
import gov.nist.healthcare.cds.domain.TestPlan;
import gov.nist.healthcare.cds.domain.exception.UnresolvableDate;
import gov.nist.healthcare.cds.domain.exception.VaccineNotFoundException;
import gov.nist.healthcare.cds.domain.wrapper.CDCImport;
import gov.nist.healthcare.cds.domain.wrapper.CDCImportConfig;
import gov.nist.healthcare.cds.domain.wrapper.ModelError;
import gov.nist.healthcare.cds.domain.wrapper.ModelValidationFailed;
import gov.nist.healthcare.cds.domain.wrapper.Report;
import gov.nist.healthcare.cds.domain.xml.ErrorModel;
import gov.nist.healthcare.cds.repositories.ReportRepository;
import gov.nist.healthcare.cds.repositories.TestCaseRepository;
import gov.nist.healthcare.cds.repositories.TestPlanRepository;
import gov.nist.healthcare.cds.service.CDCSpreadSheetFormatService;
import gov.nist.healthcare.cds.service.DeleteTestObjectService;
import gov.nist.healthcare.cds.service.MetaDataService;
import gov.nist.healthcare.cds.service.NISTFormatService;
import gov.nist.healthcare.cds.service.PropertyService;
import gov.nist.healthcare.cds.service.TestCaseExecutionService;
import gov.nist.healthcare.cds.tcamt.domain.ImportResult;

import org.apache.http.HttpResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.util.FileCopyUtils;
import org.springframework.validation.BindingResult;
import org.springframework.validation.FieldError;
import org.springframework.validation.ObjectError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.fasterxml.jackson.databind.exc.InvalidFormatException;

@RestController
public class TestCaseController {

	@Autowired
	private TestCaseRepository testCaseRepository;
	
	@Autowired
	private TestPlanRepository testPlanRepository;
	
	@Autowired
	private ReportRepository reportRepository;
	
	@Autowired
	private NISTFormatService nistFormatService;
	
	@Autowired
	private CDCSpreadSheetFormatService cdcFormatService;
	
	@Autowired
	private MetaDataService mdService;
	
	@Autowired
	private PropertyService ledger;
	
	@Autowired
	private DeleteTestObjectService trash;

	@RequestMapping(value = "/testplans", method = RequestMethod.GET)
	@ResponseBody
	public List<TestPlan> test(Principal p){
		return testPlanRepository.findByUser(p.getName());
	}
	
	
	@RequestMapping(value = "/testcase/{id}/save", method = RequestMethod.POST)
	@ResponseBody
	public TestCase save(@RequestBody @Valid TestCase tc,@PathVariable String id, Principal p) throws NotFoundException {
		TestPlan tp = ledger.tpBelongsTo(id, p.getName());
		if(tp != null){
			boolean newt = tc.getId() == null || tc.getId().isEmpty();
			tc.setTestPlan(tp.getId());
			mdService.update(tp.getMetaData());
			mdService.update(tc.getMetaData());
			TestCase stc = testCaseRepository.save(tc);
			if(newt){
				tp.addTestCase(stc);
				testPlanRepository.save(tp);
			}
			return stc;
		}
		else {
			throw new NotFoundException("TestPlan ("+id+")");
		}
	}
	
	@RequestMapping(value = "/testplan/save", method = RequestMethod.POST)
	@ResponseBody
	public TestPlan save(@RequestBody TestPlan tp,Principal p) throws NotFoundException {
		boolean newt = tp.getId() == null || tp.getId().isEmpty();
		if(newt){
			tp.setUser(p.getName());
		}
		mdService.update(tp.getMetaData());
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
		mdService.update(tp.getMetaData());
		return testPlanRepository.save(tp);
	}
	
	@RequestMapping(value = "/testcase/{id}/delete", method = RequestMethod.POST)
	@ResponseBody
	public String delete(@PathVariable String id, Principal p) throws NotFoundException{
		TestCase tc = ledger.tcBelongsTo(id, p.getName());
		if(tc != null){
			trash.deleteTestCase(tc);
			return "";
		}
		else {
			throw new NotFoundException("TC not found");
		}
	}
	
	@RequestMapping(value = "/testplan/{id}/delete", method = RequestMethod.POST)
	@ResponseBody
	public String deleteTP(@PathVariable String id, Principal p) throws NotFoundException{
		TestPlan tp = ledger.tpBelongsTo(id, p.getName());
		if(tp != null){
			trash.deleteTestPlan(tp);
		}
		else {
			throw new NotFoundException("TP not found");
		}
		return "";
	}
	
	@RequestMapping(value = "/testcase/{id}/export/{format}", method = RequestMethod.POST)
	@ResponseBody
	public void export(@PathVariable String id,@PathVariable String format,HttpServletRequest request, HttpServletResponse response, Principal p) throws IOException{
		TestCase tc = ledger.tcBelongsTo(id, p.getName());
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
	public ImportResult uploadFileHandler(@RequestParam("file") MultipartFile file,@PathVariable String id, Principal p) {
		if (!file.isEmpty()) {
			try {
				byte[] bytes = file.getBytes();
				String fileContent = new String(bytes, "UTF-8");
				List<ErrorModel> errors = nistFormatService._validate(fileContent);
				if(errors.isEmpty()){
					
					TestPlan tps = ledger.tpBelongsTo(id, p.getName());
					if(tps == null){
						ImportResult ir = new ImportResult();
						ir.setStatus(false);
						ir.setErrors(null);
						ir.setMessages(Arrays.asList("Test plan not found"));
						return ir;
					}
					
					TestCase tc = nistFormatService._import(fileContent);
					if(tc == null){
						ImportResult ir = new ImportResult();
						ir.setStatus(false);
						ir.setErrors(null);
						ir.setMessages(Arrays.asList("Error while parsing the file"));
						return ir;
					}

					tc.setTestPlan(tps.getId());
					testCaseRepository.save(tc);
					tps.addTestCase(tc);
					mdService.update(tps.getMetaData());
					testPlanRepository.save(tps);
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
	
	@RequestMapping(value = "/testcase/{id}/import/cdc", method = RequestMethod.POST)
	@ResponseBody
	public ImportResult uploadFileHandlerCDC(@RequestPart("file") MultipartFile file,@RequestPart("config") CDCImportConfig config, @PathVariable String id, Principal p) {
		if (!file.isEmpty()) {
			try {
				byte[] bytes = file.getBytes();
				ByteArrayInputStream bis = new ByteArrayInputStream(bytes);
				CDCImport importRes = cdcFormatService._import(bis,config);
				List<ErrorModel> errors = importRes.getExceptions();
				if(importRes.getTestcases().size() > 0){
					
					TestPlan tps = ledger.tpBelongsTo(id, p.getName());
					if(tps == null){
						ImportResult ir = new ImportResult();
						ir.setStatus(false);
						ir.setErrors(errors);
						ir.setMessages(Arrays.asList("Test plan not found"));
						return ir;
					}
					
					for(TestCase tc : importRes.getTestcases()){
						tc.setTestPlan(tps.getId());
					}
					
					tps.getTestCases().addAll(importRes.getTestcases());
					testCaseRepository.save(importRes.getTestcases());
					mdService.update(tps.getMetaData());
					testPlanRepository.save(tps);
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
