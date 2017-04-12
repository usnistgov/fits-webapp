package gov.nist.healthcare.cds.tcamt.controller;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.security.Principal;

import java.util.ArrayList;

import java.util.List;

import springfox.documentation.annotations.ApiIgnore;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.validation.Valid;

import gov.nist.healthcare.cds.domain.TestCase;
import gov.nist.healthcare.cds.domain.TestCaseGroup;
import gov.nist.healthcare.cds.domain.TestPlan;
import gov.nist.healthcare.cds.domain.exception.IllegalDelete;
import gov.nist.healthcare.cds.domain.exception.IllegalSave;
import gov.nist.healthcare.cds.domain.exception.VaccineNotFoundException;
import gov.nist.healthcare.cds.domain.wrapper.AppInfo;
import gov.nist.healthcare.cds.domain.wrapper.CDCImport;
import gov.nist.healthcare.cds.domain.wrapper.CDCImportConfig;
import gov.nist.healthcare.cds.domain.xml.ErrorModel;
import gov.nist.healthcare.cds.repositories.TestCaseRepository;
import gov.nist.healthcare.cds.repositories.TestPlanRepository;
import gov.nist.healthcare.cds.service.CDCSpreadSheetFormatService;
import gov.nist.healthcare.cds.service.DeleteTestObjectService;
import gov.nist.healthcare.cds.service.MetaDataService;
import gov.nist.healthcare.cds.service.NISTFormatService;
import gov.nist.healthcare.cds.service.PropertyService;
import gov.nist.healthcare.cds.service.SaveService;
import gov.nist.healthcare.cds.service.ValidateTestCase;
import gov.nist.healthcare.cds.tcamt.domain.ImportResult;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@Api
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
	private MetaDataService mdService;

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
	@RequestMapping(value = "/testcase/{id}/export/{format}", method = RequestMethod.POST)
	@ResponseBody
	public void exportTestCaseNIST(
			@ApiParam(value = "TestCase ID") @PathVariable String id, 
			@ApiParam(value = "Export Format (nist/cdc)") @PathVariable String format, 
			@ApiIgnore HttpServletRequest request,
			@ApiIgnore HttpServletResponse response, 
			@AuthenticationPrincipal Principal p) throws IOException {
		
		TestCase tc = ledger.tcBelongsTo(id, p.getName());
		if (format.equals("nist") && tc != null) {
			response.setContentType("text/xml");
			response.setHeader("Content-disposition", "attachment;filename=" + tc.getName().replace(" ", "_") + ".xml");
			if (tc.getGroupTag() != null && !tc.getGroupTag().isEmpty()) {
				TestPlan tp = ledger.tpBelongsTo(tc.getTestPlan(), p.getName());
				if (tp != null) {
					TestCaseGroup grp = tp.getGroup(tc.getGroupTag());
					if (grp != null) {
						tc.setGroupTag(grp.getName());
					}
				}
			}

			String str = nistFormatService._export(tc);
			InputStream stream = new ByteArrayInputStream(str.getBytes(StandardCharsets.UTF_8));
			FileCopyUtils.copy(stream, response.getOutputStream());
		}
	}

	@ApiOperation(value = "Import TestCase from NIST XML Format")
	@RequestMapping(value = "/testcase/{id}/import/nist", method = RequestMethod.POST)
	@ResponseBody
	public ImportResult importTestCaseNIST(
			@ApiParam(value = "XML File") @RequestParam("file") MultipartFile file, 
			@ApiParam(value = "TestPlan Container ID") @PathVariable String id,
			@AuthenticationPrincipal Principal p) {
		
		if (!file.isEmpty()) {
			try {
				byte[] bytes = file.getBytes();
				String fileContent = new String(bytes, "UTF-8");
				List<ErrorModel> errors = nistFormatService._validate(fileContent);
				if (errors.isEmpty()) {

					TestPlan tps = ledger.tpBelongsTo(id, p.getName());
					if (tps == null) {
						ImportResult ir = new ImportResult();
						ir.setStatus(false);
						ir.setErrors(null);
						ir.setMessage("Test plan not found");
						return ir;
					}

					TestCase tc = nistFormatService._import(fileContent);
					if (tc == null) {
						ImportResult ir = new ImportResult();
						ir.setStatus(false);
						ir.setErrors(null);
						ir.setMessage("Error while parsing the file");
						return ir;
					}

					TestPlan container = new TestPlan();
					tc.setTestPlan(tps.getId());
					if (tc.getGroupTag() != null && !tc.getGroupTag().isEmpty()) {
						TestCaseGroup tpcg = tps.getByNameOrCreateGroup(tc.getGroupTag());
						if(tpcg.getMetaData() == null){
							tpcg.setMetaData(mdService.create(true));
						}
						TestCaseGroup tpcgContainer = container.getByNameOrCreateGroup(tc.getGroupTag());
						tpcgContainer.setId(tpcg.getId());
						
						tc.setGroupTag(tpcg.getId());
						tpcg.setTestPlan(tps.getId());
						tpcgContainer.setTestPlan(tpcg.getTestPlan());
						tpcgContainer.getTestCases().add(tc);
						tpcg.getTestCases().add(tc);
					} else {
						container.addTestCase(tc);
						tps.addTestCase(tc);
					}
					mdService.update(tc.getMetaData());
					validator.validate(tc);
					testCaseRepository.save(tc);
					mdService.update(tps.getMetaData());
					testPlanRepository.save(tps);
					ImportResult ir = new ImportResult();
					ir.setStatus(true);
					ir.setErrors(null);
					ir.setMessage("");
					ir.setImported(tc);
					ir.setTestPlan(container);
					return ir;
				} else {
					ImportResult ir = new ImportResult();
					ir.setStatus(false);
					ir.setErrors(errors);
					ir.setMessage(
							"Unable to import file due to XML errors, please review XML format XSD in documentation Tab");
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
				ir.setMessage("Vaccine with CVX = " + e.getCvx() + " not found");
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

	@ApiOperation(value = "Import TestCase from CDC Spreadsheet Format")
	@RequestMapping(value = "/testcase/{id}/import/cdc", method = RequestMethod.POST)
	@ResponseBody
	public ImportResult uploadFileHandlerCDC(
			@ApiParam(value = "EXCEL File") @RequestPart("file") MultipartFile file,
			@ApiParam(value = "Import Configuration") @RequestPart("config") CDCImportConfig config, 
			@ApiParam(value = "TestPlan Container ID") @PathVariable String id, 
			@AuthenticationPrincipal Principal p) {
		
		if (!file.isEmpty()) {
			try {
				byte[] bytes = file.getBytes();
				ByteArrayInputStream bis = new ByteArrayInputStream(bytes);
				if (config.getTo() < config.getFrom()) {
					ImportResult ir = new ImportResult();
					ir.setStatus(false);
					ir.setMessage("Invalid import config start line must be lower than or equal to end line");
					return ir;
				}
				CDCImport importRes = cdcFormatService._import(bis, config);
				List<ErrorModel> errors = importRes.getExceptions();
				if (importRes.getTestcases().size() > 0) {

					TestPlan tps = ledger.tpBelongsTo(id, p.getName());
					if (tps == null) {
						ImportResult ir = new ImportResult();
						ir.setStatus(false);
						ir.setErrors(errors);
						ir.setMessage("Test plan not found");
						return ir;
					}
					TestPlan container = new TestPlan();
					List<TestCase> testCases = new ArrayList<>();
					for (TestCaseGroup tcg : importRes.getTestcases()) {
						for (TestCase tc : tcg.getTestCases()) {
							TestCaseGroup tpcg = tps.getByNameOrCreateGroup(tcg.getName());
							if(tpcg.getMetaData() == null){
								tpcg.setMetaData(mdService.create(true));
							}
							TestCaseGroup tpcgContainer = container.getByNameOrCreateGroup(tcg.getName());
							tpcgContainer.setId(tpcg.getId());
							
							tc.setGroupTag(tpcg.getId());
							tc.setTestPlan(tps.getId());
							tpcg.setTestPlan(tps.getId());
							tpcg.getTestCases().add(tc);
							tpcgContainer.getTestCases().add(tc);
							mdService.update(tc.getMetaData());
							validator.validate(tc);
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
				} else {
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
