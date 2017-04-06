package gov.nist.healthcare.cds.tcamt.controller;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.security.Principal;
import java.text.ParseException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Calendar;
import java.util.Date;
import java.util.List;
import java.util.Set;

import javassist.NotFoundException;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.validation.ConstraintViolation;
import javax.validation.Valid;
import javax.validation.Validation;
import javax.validation.Validator;

import gov.nist.healthcare.cds.domain.TestCase;
import gov.nist.healthcare.cds.domain.TestCaseGroup;
import gov.nist.healthcare.cds.domain.TestPlan;
import gov.nist.healthcare.cds.domain.exception.UnresolvableDate;
import gov.nist.healthcare.cds.domain.exception.VaccineNotFoundException;
import gov.nist.healthcare.cds.domain.wrapper.AppInfo;
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
import gov.nist.healthcare.cds.service.ValidateTestCase;
import gov.nist.healthcare.cds.tcamt.domain.ImportResult;

import org.apache.http.HttpResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.propertyeditors.StringTrimmerEditor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.util.FileCopyUtils;
import org.springframework.validation.BindingResult;
import org.springframework.validation.FieldError;
import org.springframework.validation.ObjectError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.WebDataBinder;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.InitBinder;
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
	
	@Autowired
	private ValidateTestCase validator;
	
	@Autowired
	private AppInfo appInfo;
	
	@RequestMapping(value = "/testplans", method = RequestMethod.GET)
	@ResponseBody
	public List<TestPlan> test(Principal p){
		return testPlanRepository.findByUser(p.getName());
	}
	
	@InitBinder
	public void initBinder(WebDataBinder binder) {
	    binder.registerCustomEditor(String.class, new StringTrimmerEditor(true));
	}
	
	@RequestMapping(value = "/appInfo", method = RequestMethod.GET)
	@ResponseBody
	public AppInfo appInfo(){
		return appInfo;
	}
	
	
	@RequestMapping(value = "/testcase/tp/{id}/save", method = RequestMethod.POST)
	@ResponseBody
	public TestCase save(@RequestBody @Valid TestCase tc,@PathVariable String id, Principal p) throws NotFoundException {
		TestPlan tp = ledger.tpBelongsTo(id, p.getName());
		//validator.validate(tc);

		if(tp != null){
			boolean newt = tc.getId() == null || tc.getId().isEmpty();
			tc.setTestPlan(tp.getId());
			mdService.update(tp.getMetaData());
			mdService.update(tc.getMetaData());
			if(newt){
				tp.addTestCase(tc);
			}
			else {
				TestCase _tc = testCaseRepository.findOne(tc.getId());
				if(_tc.getGroupTag() != null && !_tc.getGroupTag().isEmpty()){
					TestCaseGroup tcg = tp.getGroup(_tc.getGroupTag());
					tcg.getTestCases().remove(_tc);
					tp.getTestCases().add(tc);
				}
			}
			
			testCaseRepository.save(tc);
			testPlanRepository.save(tp);		
			return tc;
		}
		else {
			throw new NotFoundException("TestPlan ("+id+")");
		}
	}
	
	
	@RequestMapping(value = "/testcase/tg/{id}/save", method = RequestMethod.POST)
	@ResponseBody
	public TestCase saveTG(@RequestBody @Valid TestCase tc,@PathVariable String id, Principal p) throws NotFoundException {
		TestPlan tp = ledger.tgBelongsTo(id, p.getName());
		//validator.validate(tc);

		boolean newt = tc.getId() == null || tc.getId().isEmpty();
		if(tp != null){
			TestCaseGroup tcg = tp.getGroup(id);
			tc.setTestPlan(tp.getId());
			tc.setGroupTag(id);
			mdService.update(tp.getMetaData());
			mdService.update(tc.getMetaData());
			if(newt){
				tcg.getTestCases().add(tc);
			}
			else {
				TestCase _tc = testCaseRepository.findOne(tc.getId());
				if(_tc.getGroupTag() == null || _tc.getGroupTag().isEmpty()){
					//No Group To Group
					TestCaseGroup tcgN = tp.getGroup(tc.getGroupTag());
					tp.getTestCases().remove(_tc);
					tcgN.getTestCases().add(tc);
				}
				else if(!_tc.getGroupTag().equals(id)){
					// Group To Group
					TestCaseGroup tcgO = tp.getGroup(_tc.getGroupTag());
					TestCaseGroup tcgN = tp.getGroup(tc.getGroupTag());
					tcgO.getTestCases().remove(_tc);
					tcgN.getTestCases().add(tc);
				}
			}
			
			testCaseRepository.save(tc);
			testPlanRepository.save(tp);
			return tc;
		}
		else {
			throw new NotFoundException("TestCaseGroup ("+id+")");
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
	
	@RequestMapping(value = "/testCaseGroup/partial/save", method = RequestMethod.POST)
	@ResponseBody
	public TestCaseGroup saveG(@RequestBody TestCaseGroup tg,Principal p) throws NotFoundException {
		if(tg.getTestPlan() != null && !tg.getTestPlan().isEmpty()){
			if(tg.getId() != null){
				TestPlan _tp = ledger.tgBelongsTo(tg.getId(), p.getName());
				if(_tp != null){
					TestCaseGroup tcg = _tp.getGroup(tg.getId());
					if(tcg != null){
						tcg.setName(tg.getName());
						mdService.update(_tp.getMetaData());
						testPlanRepository.save(_tp);
						return tcg;
					}
					else {
						throw new NotFoundException("TestCaseGroup ("+tg.getId()+")");
					}
				}
				else {
					throw new NotFoundException("TestCaseGroup ("+tg.getId()+")");
				}
			}
			else {
				TestPlan _tp = ledger.tpBelongsTo(tg.getTestPlan(), p.getName());
				if(_tp != null){
					TestCaseGroup tcg = _tp.createGroup(tg.getName());
					mdService.update(_tp.getMetaData());
					testPlanRepository.save(_tp);
					return tcg;
				}
				else {
					throw new NotFoundException("TestPlan ("+tg.getTestPlan()+")");
				}
			}
		}
		else {
			throw new NotFoundException("TestCaseGroup Must Belong to a TestPlan");
		}
	}
	
	
	@RequestMapping(value = "/testplan/partial/save", method = RequestMethod.POST)
	@ResponseBody
	public TestPlan saveP(@RequestBody TestPlan tp,Principal p) throws NotFoundException {
		if(tp.getId() != null){
			TestPlan _tp = ledger.tpBelongsTo(tp.getId(), p.getName());
			if(_tp != null){
				tp.setTestCases(_tp.getTestCases());
				tp.setTestCaseGroups(_tp.getTestCaseGroups());
			}
			else {
				throw new NotFoundException("TestPlan ("+tp.getId()+")");
			}
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
	
	@RequestMapping(value = "/testcasegroup/{id}/delete", method = RequestMethod.POST)
	@ResponseBody
	public String deleteTCG(@PathVariable String id, Principal p) throws NotFoundException{
		TestPlan tp = ledger.tgBelongsTo(id, p.getName());
		if(tp != null){
			trash.deleteTestCaseGroup(tp,id);
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
			if(tc.getGroupTag() != null && !tc.getGroupTag().isEmpty()){
				TestPlan tp = ledger.tpBelongsTo(tc.getTestPlan(), p.getName());
				if(tp != null){
					TestCaseGroup grp = tp.getGroup(tc.getGroupTag());
					if(grp != null){
						tc.setGroupTag(grp.getName());
					}
				}
			}
			
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
						ir.setMessage("Test plan not found");
						return ir;
					}
					
					TestCase tc = nistFormatService._import(fileContent);
					if(tc == null){
						ImportResult ir = new ImportResult();
						ir.setStatus(false);
						ir.setErrors(null);
						ir.setMessage("Error while parsing the file");
						return ir;
					}

					tc.setTestPlan(tps.getId());
					if(tc.getGroupTag() != null && !tc.getGroupTag().isEmpty()){
						TestCaseGroup tpcg = tps.getByNameOrCreateGroup(tc.getGroupTag());
						tc.setGroupTag(tpcg.getId());
						tpcg.setTestPlan(tps.getId());
						tpcg.getTestCases().add(tc);
					}
					else {
						tps.addTestCase(tc);
					}
					mdService.update(tc.getMetaData());
					testCaseRepository.save(tc);
					mdService.update(tps.getMetaData());
					testPlanRepository.save(tps);
					ImportResult ir = new ImportResult();
					ir.setStatus(true);
					ir.setErrors(null);
					ir.setMessage("");
					ir.setImported(tc);
					ir.setTestPlan(tps);
					return ir;
				}
				else {
					ImportResult ir = new ImportResult();
					ir.setStatus(false);
					ir.setErrors(errors);
					ir.setMessage("Unable to import file due to XML errors, please review XML format XSD in documentation Tab");
					return ir;
				}
			} catch (IOException e) {
				ImportResult ir = new ImportResult();
				ir.setStatus(false);
				ir.setErrors(null);
				ir.setMessage("Error while reading file");
				return ir;
			} catch (VaccineNotFoundException e) {
				ImportResult ir = new ImportResult();
				ir.setStatus(false);
				ir.setErrors(null);
				ir.setMessage("Vaccine with CVX = "+e.getCvx()+" not found");
				return ir;
			}
		} else {
			ImportResult ir = new ImportResult();
			ir.setStatus(false);
			ir.setErrors(null);
			ir.setMessage("Imported file should not be empty");
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
				if(config.getTo() < config.getFrom()){
					ImportResult ir = new ImportResult();
					ir.setStatus(false);
					ir.setMessage("Invalid import config start line must lower than or equal to end line");
					return ir;
				}
				CDCImport importRes = cdcFormatService._import(bis,config);
				List<ErrorModel> errors = importRes.getExceptions();
				if(importRes.getTestcases().size() > 0){
					
					TestPlan tps = ledger.tpBelongsTo(id, p.getName());
					if(tps == null){
						ImportResult ir = new ImportResult();
						ir.setStatus(false);
						ir.setErrors(errors);
						ir.setMessage("Test plan not found");
						return ir;
					}
					TestPlan container = new TestPlan();
					List<TestCase> testCases = new ArrayList<>();
					for(TestCaseGroup tcg : importRes.getTestcases()){
						for(TestCase tc : tcg.getTestCases()){
							TestCaseGroup tpcg = tps.getByNameOrCreateGroup(tcg.getName());
							
							TestCaseGroup tpcgContainer = container.getByNameOrCreateGroup(tcg.getName());
							tpcgContainer.setId(tpcg.getId());
							
							tc.setGroupTag(tpcg.getId());
							tc.setTestPlan(tps.getId());
							tpcg.setTestPlan(tps.getId());
							tpcg.getTestCases().add(tc);
							tpcgContainer.getTestCases().add(tc);
							mdService.update(tc.getMetaData());
							testCases.add(tc);
						}
					}
					
					testCaseRepository.save(testCases);
					mdService.update(tps.getMetaData());
					testPlanRepository.save(tps);
					ImportResult ir = new ImportResult();
					ir.setStatus(true);
					ir.setErrors(errors);
					ir.setTestPlan(container);
					ir.setMessage("Import Success");
					return ir;
				}
				else {
					ImportResult ir = new ImportResult();
					ir.setStatus(false);
					ir.setErrors(errors);
					ir.setMessage("No TestCase Imported due to Invalid Format");
					return ir;
				}
			} catch (IOException e) {
				ImportResult ir = new ImportResult();
				ir.setStatus(false);
				ir.setErrors(null);
				ir.setMessage("Error while reading file (Invalid Format)");
				return ir;
			} 
		} else {
			ImportResult ir = new ImportResult();
			ir.setStatus(false);
			ir.setErrors(null);
			ir.setMessage("Imported file should not be empty");
			return ir;
		}
	}
	
}
