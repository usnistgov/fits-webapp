package gov.nist.healthcare.cds.tcamt.controller;

import java.io.BufferedOutputStream;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.security.Principal;
import java.util.ArrayList;
import java.util.List;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

import javax.xml.bind.JAXBException;
import javax.xml.datatype.DatatypeConfigurationException;

import gov.nist.healthcare.cds.domain.TestCase;
import gov.nist.healthcare.cds.domain.wrapper.Report;
import gov.nist.healthcare.cds.domain.wrapper.SimulatedResult;
import gov.nist.healthcare.cds.repositories.ReportRepository;
import gov.nist.healthcare.cds.repositories.TestCaseRepository;
import gov.nist.healthcare.cds.repositories.TestPlanRepository;
import gov.nist.healthcare.cds.service.PropertyService;
import gov.nist.healthcare.cds.service.ReportExportService;
import javassist.NotFoundException;

import org.apache.commons.io.IOUtils;
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
	private TestCaseRepository testCaseRepository;
	
	@Autowired
	private ReportExportService reportExport;
	
	@Autowired
	private PropertyService ledger;
	
	@RequestMapping(value = "/report/save", method = RequestMethod.POST)
	public void save(@RequestBody List<Report> reports) {
		reportRepository.save(reports);
	}
	
	@RequestMapping(value = "/report/json", method = RequestMethod.POST)
	public List<SimulatedResult> json(@RequestBody List<Report> reports) {
		List<SimulatedResult> result = new ArrayList<SimulatedResult>();
		for(Report r : reports){
			SimulatedResult sr = new SimulatedResult();
			sr.setId(r.getTcInfo().getUID());
			sr.setXml(r.getResponse());
			result.add(sr);
		}
		return result;
	}
	
	@RequestMapping(value = "/report/zip", method = RequestMethod.POST)
	public byte[] zip(@RequestBody List<Report> reports) throws IOException, JAXBException, DatatypeConfigurationException {
		//creating byteArray stream, make it bufforable and passing this buffor to ZipOutputStream
        ByteArrayOutputStream byteArrayOutputStream = new ByteArrayOutputStream();
        BufferedOutputStream bufferedOutputStream = new BufferedOutputStream(byteArrayOutputStream);
        ZipOutputStream zipOutputStream = new ZipOutputStream(bufferedOutputStream);

        //simple file list, just for tests
        ArrayList<File> files = new ArrayList<>(2);
        files.add(new File("README.md"));

        //packing files
        for (Report report : reports) {
        	
        	TestCase tc = testCaseRepository.findOne(report.getTc());
			String str = reportExport.exportXML(report,tc);
			String file_name = "";
			if(tc.getUid() != null && !tc.getUid().isEmpty()){
				file_name += "#"+tc.getUid()+"-"+tc.getName().replaceAll(" ", "_");
			}
            zipOutputStream.putNextEntry(new ZipEntry(file_name));
            ByteArrayInputStream fileInputStream = new ByteArrayInputStream(str.getBytes(StandardCharsets.UTF_8));
            IOUtils.copy(fileInputStream, zipOutputStream);

            fileInputStream.close();
            zipOutputStream.closeEntry();
        }

        if (zipOutputStream != null) {
            zipOutputStream.finish();
            zipOutputStream.flush();
            IOUtils.closeQuietly(zipOutputStream);
        }
        IOUtils.closeQuietly(bufferedOutputStream);
        IOUtils.closeQuietly(byteArrayOutputStream);
        return byteArrayOutputStream.toByteArray();
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
