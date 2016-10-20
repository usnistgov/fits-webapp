package gov.nist.healthcare.cds.tcamt.config;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Arrays;
import java.util.Date;

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
import gov.nist.healthcare.cds.domain.VaccinationEvent;
import gov.nist.healthcare.cds.domain.Vaccine;
import gov.nist.healthcare.cds.enumeration.EvaluationStatus;
import gov.nist.healthcare.cds.enumeration.EventType;
import gov.nist.healthcare.cds.enumeration.Gender;
import gov.nist.healthcare.cds.enumeration.SerieStatus;
import gov.nist.healthcare.cds.repositories.TestCaseRepository;
import gov.nist.healthcare.cds.repositories.VaccineRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class Bootstrap {

	@Autowired
	private AccountService accountService;
	
	@Autowired
	private PrivilegeRepository privilegeRepository;
	
	@Autowired
	private TestCaseRepository testCaseRepository;
	
	@Autowired
	private VaccineRepository vaccineRepository;

	@PostConstruct
	public void init() throws ParseException {
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
		a.setUsername("hossam");
		a.setPassword("qwerty");
		accountService.createAdmin(a);
		a = new Account();
		a.setUsername("tester");
		a.setPassword("qwerty");
		accountService.createTester(a);
		
		//Vaccine
		Vaccine v = new Vaccine();
		v.setCVX("107");
		v.setName("DTaP");
		v.setDetails("diphtheria, tetanus, pertussis");
		
		vaccineRepository.save(v);
		
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
		
		vcEvent1.setEvaluations(Arrays.asList(ee1));
		
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
		vcEvent2.setEvaluations(Arrays.asList(ee2));
		
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
		
		tc.setForecast(Arrays.asList(ef));
		
		//MetaData
		MetaData md = new MetaData();
		md.setDateCreated(new FixedDate(new Date()));
		md.setDateLastUpdated(new FixedDate(new Date()));
		md.setImported(false);
		md.setVersion(1);
		
		tc.setMetaData(md);
		
		testCaseRepository.save(tc);
		
		
		
	}
}
