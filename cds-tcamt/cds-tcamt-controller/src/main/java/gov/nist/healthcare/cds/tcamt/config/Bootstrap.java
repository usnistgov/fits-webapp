package gov.nist.healthcare.cds.tcamt.config;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Arrays;
import java.util.Date;
import java.util.HashSet;

import javax.annotation.PostConstruct;

import gov.nist.healthcare.cds.auth.domain.Account;
import gov.nist.healthcare.cds.auth.domain.Privilege;
import gov.nist.healthcare.cds.auth.repo.PrivilegeRepository;
import gov.nist.healthcare.cds.auth.service.AccountService;
import gov.nist.healthcare.cds.domain.ExpectedEvaluation;
import gov.nist.healthcare.cds.domain.ExpectedForecast;
import gov.nist.healthcare.cds.domain.FixedDate;
import gov.nist.healthcare.cds.domain.MetaData;
import gov.nist.healthcare.cds.domain.Patient;
import gov.nist.healthcare.cds.domain.TestCase;
import gov.nist.healthcare.cds.domain.TestPlan;
import gov.nist.healthcare.cds.domain.VaccinationEvent;
import gov.nist.healthcare.cds.domain.Vaccine;
import gov.nist.healthcare.cds.domain.exception.VaccineNotFoundException;
import gov.nist.healthcare.cds.enumeration.EvaluationStatus;
import gov.nist.healthcare.cds.enumeration.EventType;
import gov.nist.healthcare.cds.enumeration.Gender;
import gov.nist.healthcare.cds.enumeration.SerieStatus;
import gov.nist.healthcare.cds.repositories.TestCaseRepository;
import gov.nist.healthcare.cds.repositories.TestPlanRepository;
import gov.nist.healthcare.cds.repositories.VaccineRepository;
import gov.nist.healthcare.cds.service.VaccineImportService;
import gov.nist.healthcare.cds.service.impl.NISTFormatServiceImpl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.oxm.Marshaller;
import org.springframework.oxm.Unmarshaller;
import org.springframework.oxm.castor.CastorMarshaller;
import org.springframework.stereotype.Service;

@Service
public class Bootstrap {

	@Autowired
	private AccountService accountService;
	
	@Autowired
	private VaccineImportService vaccineService;
	
	@Autowired
	private PrivilegeRepository privilegeRepository;
	
	@Autowired
	private TestCaseRepository testCaseRepository;
	
	@Autowired
	private TestPlanRepository testPlanRepository;
	
	@Autowired
	private VaccineRepository vaccineRepository;

	@Autowired
	private NISTFormatServiceImpl importService;
	
	@Bean
	public Marshaller castorM(){
		return new CastorMarshaller();
	}
	
	@PostConstruct
	public void init() throws ParseException, IOException, VaccineNotFoundException {
		System.out.println("[HT] Start");
		// Accounts
		privilegeRepository.deleteAll();
		accountService.deleteAll();
		Privilege p = new Privilege();
		p.setId(1L);
		p.setRole("ADMIN");
		privilegeRepository.save(p);
		p = new Privilege();
		p.setId(2L);
		p.setRole("TESTER");
		privilegeRepository.save(p);
		System.out.println("[HT] Privileges created");
		System.out.println("[HT] Size "+privilegeRepository.count());
		System.out.println("[HT] Content : "+privilegeRepository.findAll());
		Account a = new Account();
		a.setUsername("admin");
		a.setPassword("qwerty");
		accountService.createAdmin(a);
		Account m = new Account();
		m.setUsername("michael");
		m.setPassword("qwerty");
		accountService.createAdmin(m);
		Account r = new Account();
		r.setUsername("robert");
		r.setPassword("qwerty");
		accountService.createAdmin(r);
		Account h = new Account();
		h.setUsername("hossam");
		h.setPassword("qwerty");
		accountService.createAdmin(h);
		
		//Vaccine
		vaccineService._import(Bootstrap.class.getResourceAsStream("/web_cvx.xlsx"));
		

		//TestCase
		TestCase tc = new TestCase();
		tc.setName("DTap Age Below Absolute Minimum");
		tc.setDescription("DTaP #2 at age 10 weeks-5 days");
		
		SimpleDateFormat dateformat = new SimpleDateFormat("dd/MM/yyyy");
		Date birth    = dateformat.parse("26/02/2011");
		Date evalDate = dateformat.parse("01/02/2012");
		FixedDate eval = new FixedDate();
		eval.setDate(evalDate);
		tc.setEvalDate(eval);
		FixedDate dob = new FixedDate();
		dob.setDate(birth);
		
		//Patient
		Patient pt = new Patient();
		pt.setDob(dob);
		pt.setGender(Gender.F);
		
		tc.setPatient(pt);
		
		//Events
		VaccinationEvent vcEvent1 = new VaccinationEvent();
		Date e1d = dateformat.parse("06/04/2011");
		FixedDate e1do = new FixedDate();
		e1do.setDate(e1d);
		vcEvent1.setDate(e1do);
		vcEvent1.setAdministred(vaccineRepository.findByName("DTaP"));
		vcEvent1.setDoseNumber(1);
		vcEvent1.setType(EventType.VACCINATION);
		
		ExpectedEvaluation ee1 = new ExpectedEvaluation();
		ee1.setRelatedTo(vaccineRepository.findByName("DTaP"));
		ee1.setStatus(EvaluationStatus.VALID);
		
		vcEvent1.setEvaluations(new HashSet<>(Arrays.asList(ee1)));
		
		VaccinationEvent vcEvent2 = new VaccinationEvent();
		Date e2d = dateformat.parse("02/05/2011");
		FixedDate e2do = new FixedDate();
		e2do.setDate(e2d);
		vcEvent2.setDate(e2do);
		vcEvent2.setAdministred(vaccineRepository.findByName("DTaP"));
		vcEvent2.setDoseNumber(2);
		vcEvent2.setType(EventType.VACCINATION);
		
		ExpectedEvaluation ee2 = new ExpectedEvaluation();
		ee2.setRelatedTo(vaccineRepository.findByName("DTaP"));
		ee2.setStatus(EvaluationStatus.INVALID);
		ee2.setEvaluationReason("Age too young");
		vcEvent2.setEvaluations(new HashSet<>(Arrays.asList(ee2)));
		
		tc.addEvent(vcEvent1);
		tc.addEvent(vcEvent2);
		
		ExpectedForecast ef = new ExpectedForecast();
		ef.setDoseNumber(2);
		ef.setTarget(vaccineRepository.findByName("DTaP"));
		ef.setSerieStatus(SerieStatus.O);
		ef.setForecastReason("Second dose was administed too early");
		Date earliest = dateformat.parse("30/05/2011");
		Date recommended = dateformat.parse("26/06/2011");
		Date pastDue = dateformat.parse("22/08/2011");
		ef.setEarliest(new FixedDate(earliest));
		ef.setRecommended(new FixedDate(recommended));
		ef.setPastDue(new FixedDate(pastDue));
		
		tc.setForecast(new HashSet<>(Arrays.asList(ef)));
		//--------------------
		//MetaData
		MetaData md = new MetaData();
		md.setDateCreated(new FixedDate(new Date()));
		md.setDateLastUpdated(new FixedDate(new Date()));
		md.setImported(false);
		md.setVersion(1);
		
		tc.setMetaData(md);
		
		String file = getStringFromInputStream(Bootstrap.class.getResourceAsStream("/test.xml"));
		TestCase t1 = this.importService._import(file);
		TestCase t2 = this.importService._import(file);
		TestCase t3 = this.importService._import(file);
		
		TestPlan tp = new TestPlan();
		md = new MetaData();
		md.setDateCreated(new FixedDate(new Date()));
		md.setDateLastUpdated(new FixedDate(new Date()));
		md.setImported(false);
		md.setVersion(1);
		tp.setMetaData(md);
		tp.setDescription("CDS TestCases for CDSi Specification v2");
		tp.setName("CDC");
		tp.setUser("hossam");
		tp.addTestCase(t3);
		t3.setTestPlan(tp);
		testPlanRepository.saveAndFlush(tp);
		tp = new TestPlan();
		md = new MetaData();
		md.setDateCreated(new FixedDate(new Date()));
		md.setDateLastUpdated(new FixedDate(new Date()));
		md.setImported(false);
		md.setVersion(1);
		tp.setMetaData(md);
		tp.setDescription("CDS TestCases for CDSi Specification v2");
		tp.setName("CDC");
		tp.setUser("michael");
		tp.addTestCase(t1);
		t1.setTestPlan(tp);
		testPlanRepository.saveAndFlush(tp);
		tp = new TestPlan();
		md = new MetaData();
		md.setDateCreated(new FixedDate(new Date()));
		md.setDateLastUpdated(new FixedDate(new Date()));
		md.setImported(false);
		md.setVersion(1);
		tp.setMetaData(md);
		tp.setDescription("CDS TestCases for CDSi Specification v2");
		tp.setName("CDC");
		tp.setUser("robert");
		tp.addTestCase(t2);
		t2.setTestPlan(tp);
		testPlanRepository.saveAndFlush(tp);
		tp = new TestPlan();
		md = new MetaData();
		md.setDateCreated(new FixedDate(new Date()));
		md.setDateLastUpdated(new FixedDate(new Date()));
		md.setImported(false);
		md.setVersion(1);
		tp.setMetaData(md);
		tp.setDescription("CDS TestCases for CDSi Specification v2");
		tp.setName("CDC");
		tp.addTestCase(tc);
		tc.setTestPlan(tp);
		tp.setUser("admin");
		testPlanRepository.saveAndFlush(tp);
		
		
//		List<TestCase> res = importService.importCDC();
//		tp.getTestCases().addAll(res);

//		System.out.println("[HTC] "+res);
//		System.out.println("[HTC]");
//		System.out.println(exportService.exportNIST(tc));
		
		
	}
	
	private String getStringFromInputStream(InputStream is) {

		BufferedReader br = null;
		StringBuilder sb = new StringBuilder();

		String line;
		try {

			br = new BufferedReader(new InputStreamReader(is));
			while ((line = br.readLine()) != null) {
				sb.append(line);
			}

		} catch (IOException e) {
			e.printStackTrace();
		} finally {
			if (br != null) {
				try {
					br.close();
				} catch (IOException e) {
					e.printStackTrace();
				}
			}
		}

		return sb.toString();

	}
}
