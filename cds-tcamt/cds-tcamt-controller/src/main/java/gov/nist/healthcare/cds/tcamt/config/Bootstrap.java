package gov.nist.healthcare.cds.tcamt.config;

import java.io.IOException;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Date;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import javax.annotation.PostConstruct;
import javax.transaction.Transactional;

import gov.nist.healthcare.cds.auth.domain.Account;
import gov.nist.healthcare.cds.auth.domain.Privilege;
import gov.nist.healthcare.cds.auth.repo.PrivilegeRepository;
import gov.nist.healthcare.cds.auth.service.AccountService;
import gov.nist.healthcare.cds.domain.ExpectedEvaluation;
import gov.nist.healthcare.cds.domain.ExpectedForecast;
import gov.nist.healthcare.cds.domain.FixedDate;
import gov.nist.healthcare.cds.domain.Patient;
import gov.nist.healthcare.cds.domain.SoftwareConfig;
import gov.nist.healthcare.cds.domain.TestCase;
import gov.nist.healthcare.cds.domain.TestPlan;
import gov.nist.healthcare.cds.domain.VaccinationEvent;
import gov.nist.healthcare.cds.domain.Vaccine;
import gov.nist.healthcare.cds.domain.VaccineMapping;
import gov.nist.healthcare.cds.domain.exception.VaccineNotFoundException;
import gov.nist.healthcare.cds.domain.wrapper.ActualEvaluation;
import gov.nist.healthcare.cds.domain.wrapper.ActualForecast;
import gov.nist.healthcare.cds.domain.wrapper.EngineResponse;
import gov.nist.healthcare.cds.domain.wrapper.MetaData;
import gov.nist.healthcare.cds.domain.wrapper.ResponseVaccinationEvent;
import gov.nist.healthcare.cds.domain.wrapper.VaccineRef;
import gov.nist.healthcare.cds.enumeration.EvaluationStatus;
import gov.nist.healthcare.cds.enumeration.EventType;
import gov.nist.healthcare.cds.enumeration.FHIRAdapter;
import gov.nist.healthcare.cds.enumeration.Gender;
import gov.nist.healthcare.cds.enumeration.SerieStatus;
import gov.nist.healthcare.cds.repositories.SoftwareConfigRepository;
import gov.nist.healthcare.cds.repositories.TestPlanRepository;
import gov.nist.healthcare.cds.repositories.VaccineMappingRepository;
import gov.nist.healthcare.cds.service.VaccineImportService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.oxm.Marshaller;
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
	private VaccineMappingRepository vaccineRepository;
	
	@Autowired
	private TestPlanRepository testPlanRepository;
	
	@Autowired
	private SoftwareConfigRepository softwareConfRepository;
	
	@Bean
	public Marshaller castorM(){
		return new CastorMarshaller();
	}
	
	@PostConstruct
	@Transactional
	public void init() throws ParseException, IOException, VaccineNotFoundException {
		//Vaccine
		Set<VaccineMapping> set = vaccineService._import(Bootstrap.class.getResourceAsStream("/web_cvx.xlsx"),Bootstrap.class.getResourceAsStream("/web_vax2vg.xlsx"),Bootstrap.class.getResourceAsStream("/web_mvx.xlsx"),Bootstrap.class.getResourceAsStream("/web_tradename.xlsx"));
		vaccineRepository.save(new ArrayList<VaccineMapping>(set));
		
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
		Account ai = new Account();
		ai.setUsername("aira");
		ai.setPassword("qwerty");
		accountService.createAdmin(ai);
		Account c = new Account();
		c.setUsername("cdc1");
		c.setPassword("qwerty");
		accountService.createAdmin(c);
		
		SoftwareConfig sfC = new SoftwareConfig();
		sfC.setConnector(FHIRAdapter.FHIR);
		sfC.setEndPoint("http://localhost:8080/fc");
		sfC.setName("Local Machine");
		sfC.setUser("hossam");
		softwareConfRepository.save(sfC);
		
		TestCase tc = new TestCase();
		tc.setName("DTap Age Below Absolute Minimum");
		tc.setDescription("DTaP #2 at age 10 weeks-5 days");
//		
		SimpleDateFormat dateformat = new SimpleDateFormat("dd/MM/yyyy");
		Date birth    = dateformat.parse("26/02/2011");
		Date evalDate = dateformat.parse("01/02/2012");
		FixedDate eval = new FixedDate();
		eval.setDate(evalDate);
		tc.setEvalDate(eval);
		FixedDate dob = new FixedDate();
		dob.setDate(birth);
//		
		//Patient
		Patient pt = new Patient();
		pt.setDob(dob);
		pt.setGender(Gender.F);
//		
		tc.setPatient(pt);
		
		Vaccine vx = vaccineRepository.findMapping("107").getVx();
		Vaccine vx1 = vaccineRepository.findMapping("100").getVx();
//		//Events
		VaccinationEvent vcEvent1 = new VaccinationEvent();
		Date e1d = dateformat.parse("06/04/2011");
		FixedDate e1do = new FixedDate();
		e1do.setDate(e1d);
		vcEvent1.setDate(e1do);
		vcEvent1.setAdministred(vx);
		vcEvent1.setDoseNumber(1);
		vcEvent1.setType(EventType.VACCINATION);
		
		ExpectedEvaluation ee1 = new ExpectedEvaluation();
		ee1.setRelatedTo(vx);
		ee1.setStatus(EvaluationStatus.VALID);
		
		ExpectedEvaluation ee11 = new ExpectedEvaluation();
		ee11.setRelatedTo(vx1);
		ee11.setStatus(EvaluationStatus.VALID);
		vcEvent1.setEvaluations(new HashSet<>(Arrays.asList(ee1,ee11)));
		
		VaccinationEvent vcEvent2 = new VaccinationEvent();
		Date e2d = dateformat.parse("02/05/2011");
		FixedDate e2do = new FixedDate();
		e2do.setDate(e2d);
		vcEvent2.setDate(e2do);
		vcEvent2.setAdministred(vx);
		vcEvent2.setDoseNumber(2);
		vcEvent2.setType(EventType.VACCINATION);
		
		ExpectedEvaluation ee2 = new ExpectedEvaluation();
		ee2.setRelatedTo(vx);
		ee2.setStatus(EvaluationStatus.INVALID);
		ee2.setEvaluationReason("Age too young");
		vcEvent2.setEvaluations(new HashSet<>(Arrays.asList(ee2)));
		
		VaccinationEvent vcEvent3 = new VaccinationEvent();
		Date e3d = dateformat.parse("02/06/2011");
		FixedDate e3do = new FixedDate();
		e3do.setDate(e3d);
		vcEvent3.setDate(e3do);
		vcEvent3.setAdministred(vx1);
		vcEvent3.setDoseNumber(1);
		vcEvent3.setType(EventType.VACCINATION);
		
		ExpectedEvaluation ee3 = new ExpectedEvaluation();
		ee3.setRelatedTo(vx1);
		ee3.setStatus(EvaluationStatus.INVALID);
		ee3.setEvaluationReason("Age too young");
		vcEvent3.setEvaluations(new HashSet<>(Arrays.asList(ee3)));
		
		tc.addEvent(vcEvent1);
		tc.addEvent(vcEvent2);
		tc.addEvent(vcEvent3);
		
		//Expected Forecast
		ExpectedForecast ef = new ExpectedForecast();
		ef.setDoseNumber("2");
		ef.setTarget(vx);
		ef.setSerieStatus(SerieStatus.O);
		ef.setForecastReason("Second dose was administed too early");
		Date earliest = dateformat.parse("30/05/2011");
		Date recommended = dateformat.parse("26/06/2011");
		Date pastDue = dateformat.parse("22/08/2011");
		ef.setEarliest(new FixedDate(earliest));
		ef.setRecommended(new FixedDate(recommended));
		ef.setPastDue(new FixedDate(pastDue));

		
		ExpectedForecast eff = new ExpectedForecast();
		eff.setDoseNumber("2");
		eff.setTarget(vx1);
		eff.setSerieStatus(SerieStatus.O);
		eff.setForecastReason("Second dose was administed too early");
		Date earliest1 = dateformat.parse("30/05/2011");
		Date recommended1 = dateformat.parse("26/06/2011");
		Date pastDue1 = dateformat.parse("22/08/2011");
		eff.setEarliest(new FixedDate(earliest1));
		eff.setRecommended(new FixedDate(recommended1));
		eff.setPastDue(new FixedDate(pastDue1));
		tc.setForecast(new HashSet<>(Arrays.asList(ef,eff)));
		
		MetaData md = new MetaData();
		md.setDateCreated(new Date());
		md.setDateLastUpdated(new Date());
		md.setImported(false);
		md.setVersion("1");
		tc.setMetaData(md);
		
		TestPlan tp = new TestPlan();
		MetaData mdp = new MetaData();
		mdp.setDateCreated(new Date());
		mdp.setDateLastUpdated(new Date());
		mdp.setImported(false);
		mdp.setVersion("1");
		tp.setMetaData(mdp);
		tp.setDescription("CDS TestCases for CDSi Specification v2");
		tp.setName("CDC");
		tp.setUser("hossam");
		tp.addTestCase(tc);
		tc.setTestPlan(tp);
		testPlanRepository.saveAndFlush(tp);
		
		
		
	}
}
