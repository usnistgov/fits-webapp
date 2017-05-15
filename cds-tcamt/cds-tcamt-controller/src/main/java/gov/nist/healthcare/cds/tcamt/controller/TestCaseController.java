package gov.nist.healthcare.cds.tcamt.controller;

import java.io.IOException;
import java.io.InputStream;
import java.security.Principal;
import java.util.ArrayList;
import java.util.List;

import springfox.documentation.annotations.ApiIgnore;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import gov.nist.healthcare.cds.domain.TestCase;
import gov.nist.healthcare.cds.domain.TestCaseGroup;
import gov.nist.healthcare.cds.domain.TestPlan;
import gov.nist.healthcare.cds.domain.exception.ConfigurationException;
import gov.nist.healthcare.cds.domain.exception.IllegalDelete;
import gov.nist.healthcare.cds.domain.exception.IllegalSave;
import gov.nist.healthcare.cds.domain.exception.UnsupportedFormat;
import gov.nist.healthcare.cds.domain.wrapper.AppInfo;
import gov.nist.healthcare.cds.domain.wrapper.EntityResult;
import gov.nist.healthcare.cds.domain.wrapper.ZipExportSummary;
import gov.nist.healthcare.cds.domain.wrapper.ImportConfig;
import gov.nist.healthcare.cds.domain.wrapper.ImportSummary;
import gov.nist.healthcare.cds.domain.xml.ErrorModel;
import gov.nist.healthcare.cds.repositories.TestPlanRepository;
import gov.nist.healthcare.cds.service.DeleteTestObjectService;
import gov.nist.healthcare.cds.service.PropertyService;
import gov.nist.healthcare.cds.service.SaveService;
import gov.nist.healthcare.cds.service.ValidateTestCase;
import gov.nist.healthcare.cds.service.impl.transformation.NISTFormatServiceImpl;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import io.swagger.annotations.ApiParam;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.propertyeditors.StringTrimmerEditor;
import org.springframework.security.web.bind.annotation.AuthenticationPrincipal;
import org.springframework.util.FileCopyUtils;
import org.springframework.web.bind.WebDataBinder;
import org.springframework.web.bind.annotation.InitBinder;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;


@Api
@RestController
public class TestCaseController {


	@Autowired
	private TestPlanRepository testPlanRepository;

	@Autowired
	private NISTFormatServiceImpl nistFormatService;
	
	@Autowired
	private gov.nist.healthcare.cds.service.impl.persist.ImportService importService;
	@Autowired
	private gov.nist.healthcare.cds.service.impl.persist.ExportService exportService;

	@Autowired
	private PropertyService ledger;

	@Autowired
	private DeleteTestObjectService trash;
	
	@Autowired
	private ValidateTestCase validator;

	@Autowired
	private SaveService saveButton;

	@Autowired
	private AppInfo appInfo;

	@InitBinder
	public void initBinder(WebDataBinder binder) {
		binder.registerCustomEditor(String.class, new StringTrimmerEditor(true));
	}

	@ApiOperation(value = "List of all test plans belonging to authenticated user")
	@RequestMapping(value = "/testplans", method = RequestMethod.GET)
	@ResponseBody
	public List<TestPlan> test(@AuthenticationPrincipal Principal p) {
		return testPlanRepository.findByUser(p.getName());
	}

	@ApiOperation(value = "WebApp Build Information")
	@RequestMapping(value = "/appInfo", method = RequestMethod.GET)
	@ResponseBody
	public AppInfo appInfo() {
		return appInfo;
	}

	//---------------------- SAVE OPERATIONS -------------------------
	
	@ApiOperation(value = "Save test case to authenticated user account")
	@RequestMapping(value = "/testcase/save", method = RequestMethod.POST)
	@ResponseBody
	public TestCase saveTestCase(
			@ApiParam(value = "TestCase Object to persist") @RequestBody TestCase tc,
			@AuthenticationPrincipal Principal p) throws IllegalSave {

		validator.validate(tc);
		return saveButton.saveTC(tc, p.getName());
	}

	@ApiOperation(value = "Save test plan (just test plan level information excluding groups and test cases)"
			+ " to authenticated user account")
	@RequestMapping(value = "/testplan/save", method = RequestMethod.POST)
	@ResponseBody
	public TestPlan saveTestPlan(
			@ApiParam(value = "TestPlan Object to persist") @RequestBody TestPlan tp,
			@AuthenticationPrincipal Principal p) throws IllegalSave {

		return saveButton.saveTP(tp, p.getName());
	}

	@ApiOperation(value = "Save test case group (just group level information excluding test cases)"
			+ " to authenticated user account")
	@RequestMapping(value = "/testcasegroup/save", method = RequestMethod.POST)
	@ResponseBody
	public TestCaseGroup saveTestCaseGroup(
			@ApiParam(value = "TestCaseGroup Object to persist") @RequestBody TestCaseGroup tg, 
			@AuthenticationPrincipal Principal p) throws IllegalSave {
		
		return saveButton.saveTG(tg, p.getName());
	}


	//-------------------- DELETE OPERATIONS ---------------------------
	
	@ApiOperation(value = "Delete TestCase with ID")
	@RequestMapping(value = "/testcase/{id}/delete", method = RequestMethod.DELETE)
	public void deleteTestCase(
			@ApiParam(value = "TestCase ID") @PathVariable String id, 
			@AuthenticationPrincipal Principal p) throws IllegalDelete {
		
		trash.deleteTestCase(id, p.getName());
		
	}

	@ApiOperation(value = "Delete TestPlan with ID")
	@RequestMapping(value = "/testplan/{id}/delete", method = RequestMethod.DELETE)
	public void deleteTestPlan(
			@ApiParam(value = "TestPlan ID") @PathVariable String id, 
			@AuthenticationPrincipal Principal p) throws IllegalDelete {
		
		trash.deleteTestPlan(id, p.getName());
		
	}

	@ApiOperation(value = "Delete TestCaseGroup with ID")
	@RequestMapping(value = "/testcasegroup/{id}/delete", method = RequestMethod.DELETE)
	@ResponseBody
	public void deleteTestCaseGroup(
			@ApiParam(value = "TestCaseGroup ID") @PathVariable String id, 
			@AuthenticationPrincipal Principal p) throws IllegalDelete {
		
		trash.deleteTestCaseGroup(id, p.getName());
		
	}

	//--------------------------- IMPORT/EXPORT NIST OPERATION ------------------------------
	
	@ApiOperation(value = "Export TestCase To NIST Format")
	@RequestMapping(value = "/testcase/{ids}/export/{format}", method = RequestMethod.POST)
	@ResponseBody
	public void exportTestCaseNIST(
			@ApiParam(value = "TestCase ID List") @PathVariable String[] ids, 
			@ApiParam(value = "Export Format (nist/cdc)") @PathVariable String format, 
			@ApiIgnore HttpServletRequest request,
			@ApiIgnore HttpServletResponse response, 
			@AuthenticationPrincipal Principal p) throws IOException, UnsupportedFormat, ConfigurationException {
		
		List<TestCase> tcs = new ArrayList<>();
		List<EntityResult> eResult = new ArrayList<>();
		
		for(String id : ids){
			TestCase tc = ledger.tcBelongsTo(id, p.getName());
			if(tc != null){
				if(tc.getGroupTag() != null && !tc.getGroupTag().isEmpty()){
					TestCaseGroup tcg = ledger.tgBelongsTo(tc.getGroupTag(), p.getName());
					tc.setGroupTag(tcg.getName());
				}
				tcs.add(tc);
			}
			else {
				EntityResult entityResult = new EntityResult("TestCase ID "+id);
				entityResult.getErrors().add(new ErrorModel("Permission","TestCase does not belong to user"));
				eResult.add(entityResult);
			}
		}
		
		
		ZipExportSummary exportResult = exportService.exportTestCases(tcs, format, null);
		if(exportResult.getOut() != null){
			response.setContentType("application/zip");
			response.setHeader("Content-disposition", "attachment;filename=fits_testCases_export.zip");
			exportResult.getOut().close();
			response.getOutputStream().write(exportResult.getBaos().toByteArray());
		}

	}

	
	@ApiOperation(value = "Import TestCases")
	@RequestMapping(value = "/testcase/import/{id}/{format}", method = RequestMethod.POST)
	public ImportSummary importRoute(
			@ApiParam(value = "List of files") @RequestPart("files") List<MultipartFile> files, 
			@ApiParam(value = "TestPlan Container ID") @PathVariable String id, 
			@ApiParam(value = "Import format (nist/cdc)") @PathVariable String format, 
			@ApiParam(value = "Import Configuration") @RequestPart(value="config",required=false) ImportConfig config, 
			@AuthenticationPrincipal Principal p) {
		
		try {
			return importService.importTestCases(files, format, id, config);
		}  
		catch (UnsupportedFormat e) {
			return ImportSummary.invalidFormat();
		}
		catch (ConfigurationException e) {
			return ImportSummary.configError();
		}
		catch (Exception e) {
			return ImportSummary.errorInFile();
		}
	}

}
