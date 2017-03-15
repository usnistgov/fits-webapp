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

import gov.nist.healthcare.cds.auth.domain.Account;
import gov.nist.healthcare.cds.auth.domain.Privilege;
import gov.nist.healthcare.cds.auth.repo.PrivilegeRepository;
import gov.nist.healthcare.cds.auth.service.AccountService;
import gov.nist.healthcare.cds.domain.DateReference;
import gov.nist.healthcare.cds.domain.ExpectedEvaluation;
import gov.nist.healthcare.cds.domain.ExpectedForecast;
import gov.nist.healthcare.cds.domain.FixedDate;
import gov.nist.healthcare.cds.domain.Patient;
import gov.nist.healthcare.cds.domain.RelativeDate;
import gov.nist.healthcare.cds.domain.RelativeDateRule;
import gov.nist.healthcare.cds.domain.SoftwareConfig;
import gov.nist.healthcare.cds.domain.StaticDateReference;
import gov.nist.healthcare.cds.domain.TestCase;
import gov.nist.healthcare.cds.domain.TestPlan;
import gov.nist.healthcare.cds.domain.VaccinationEvent;
import gov.nist.healthcare.cds.domain.Vaccine;
import gov.nist.healthcare.cds.domain.VaccineDateReference;
import gov.nist.healthcare.cds.domain.VaccineMapping;
import gov.nist.healthcare.cds.domain.exception.VaccineNotFoundException;
import gov.nist.healthcare.cds.domain.wrapper.ActualEvaluation;
import gov.nist.healthcare.cds.domain.wrapper.ActualForecast;
import gov.nist.healthcare.cds.domain.wrapper.EngineResponse;
import gov.nist.healthcare.cds.domain.wrapper.MetaData;
import gov.nist.healthcare.cds.domain.wrapper.ResponseVaccinationEvent;
import gov.nist.healthcare.cds.domain.wrapper.VaccineRef;
import gov.nist.healthcare.cds.enumeration.DatePosition;
import gov.nist.healthcare.cds.enumeration.DateType;
import gov.nist.healthcare.cds.enumeration.EvaluationStatus;
import gov.nist.healthcare.cds.enumeration.EventType;
import gov.nist.healthcare.cds.enumeration.FHIRAdapter;
import gov.nist.healthcare.cds.enumeration.Gender;
import gov.nist.healthcare.cds.enumeration.RelativeTo;
import gov.nist.healthcare.cds.enumeration.SerieStatus;
import gov.nist.healthcare.cds.repositories.ManufacturerRepository;
import gov.nist.healthcare.cds.repositories.SoftwareConfigRepository;
import gov.nist.healthcare.cds.repositories.TestCaseRepository;
import gov.nist.healthcare.cds.repositories.TestPlanRepository;
import gov.nist.healthcare.cds.repositories.VaccineMappingRepository;
import gov.nist.healthcare.cds.service.TestRunnerService;
import gov.nist.healthcare.cds.service.VaccineImportService;
import gov.nist.healthcare.cds.service.impl.MockTestRunner;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.oxm.Marshaller;
import org.springframework.oxm.castor.CastorMarshaller;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

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
	private TestCaseRepository testCaseRepository;
	
	@Autowired
	private SoftwareConfigRepository softwareConfRepository;
	
	@Bean
	public Marshaller castorM(){
		return new CastorMarshaller();
	}
	
	@Bean
	public TestRunnerService testRunner(){
		return new MockTestRunner();
//		return new TestRunnerServiceFhirImpl("http://129.6.59.199:8080/forecast/ImmunizationRecommendations");
//		return new TestRunnerServiceFhirImpl("https://129.6.59.199:8443/forecast/ImmunizationRecommendations");

	}
	
	public void createVaccine() throws IOException{
		Set<VaccineMapping> set = vaccineService._import(Bootstrap.class.getResourceAsStream("/web_cvx.xlsx"),Bootstrap.class.getResourceAsStream("/web_vax2vg.xlsx"),Bootstrap.class.getResourceAsStream("/web_mvx.xlsx"),Bootstrap.class.getResourceAsStream("/web_tradename.xlsx"));
		long all = vaccineRepository.count();
		int i = 0;
		for(VaccineMapping mp : set){
			if(!vaccineRepository.exists(mp.getId())){
				i++;
				vaccineRepository.save(mp);
			}
		}
		System.out.println("[VACCINE SERVICE IMPORT] IMPORTED "+i+" EXISTING "+all);
	}
	
	public void createPrivileges(){
		Privilege p;
		String pr = "";
		if(privilegeRepository.findByRole("ADMIN") == null){
			p = new Privilege();
			p.setId("1");
			p.setRole("ADMIN");
			privilegeRepository.save(p);
			pr = " ADMIN ";
		}
		if(privilegeRepository.findByRole("TESTER") == null){
			p = new Privilege();
			p.setId("2");
			p.setRole("TESTER");
			privilegeRepository.save(p);
			pr += " TESTER ";
		}
		System.out.println("[PRIVILEGE CREATED]"+(pr.isEmpty() ? " NONE " : pr ));
	}
	
	public void createSoftware(){
		if(!softwareConfRepository.exists("prime")){
			SoftwareConfig sfC = new SoftwareConfig();
			sfC.setId("prime");
			sfC.setConnector(FHIRAdapter.TCH);
			sfC.setEndPoint("http://tchforecasttester.org/fv/forecast");
			sfC.setName("Remote TCH");
			sfC.setUser("hossam");
			softwareConfRepository.save(sfC);
			System.out.println("[PRIME SOFTWARE CONFIG] created");
		}
		System.out.println("[PRIME SOFTWARE CONFIG] existing");
	}
	
	@PostConstruct
	public void init() throws ParseException, IOException, VaccineNotFoundException {
		
		//Vaccine
		this.createVaccine();
		
		//Privileges
		this.createPrivileges();
		
		//Software
		this.createSoftware();
		
		accountService.deleteAll();
		
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
	
		
		TestCase tc = new TestCase();
		tc.setName("DTap Age Below Absolute Minimum");
		tc.setDescription("DTaP #2 at age 10 weeks-5 days");
		tc.setDateType(DateType.RELATIVE);
		
		//Eval
		RelativeDate evalDate = new RelativeDate();
		evalDate.add(new RelativeDateRule(DatePosition.AFTER, 0, 0, 0, new StaticDateReference(RelativeTo.EVALDATE)));
		tc.setEvalDate(evalDate);
		
		//Patient
		Patient pt = new Patient();
		RelativeDate birth = new RelativeDate();
		birth.add(new RelativeDateRule(DatePosition.BEFORE, 18, 0, 0, new StaticDateReference(RelativeTo.EVALDATE)));
		pt.setDob(birth);
		pt.setGender(Gender.F);		
		tc.setPatient(pt);
		
		Vaccine vx = vaccineRepository.findMapping("107").getVx();
		Vaccine vx1 = vaccineRepository.findMapping("100").getVx();
		
//		//Events
		VaccinationEvent vcEvent1 = new VaccinationEvent();
		vcEvent1.setId(0);
		RelativeDate vced1 = new RelativeDate();
		vced1.add(new RelativeDateRule(DatePosition.AFTER, 0, 10, 0, new StaticDateReference(RelativeTo.DOB)));
		vcEvent1.setDate(vced1);
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
		vcEvent2.setId(1);
		RelativeDate vced2 = new RelativeDate();
		vced2.add(new RelativeDateRule(DatePosition.AFTER, 0, 10, 0, new VaccineDateReference(0)));
		vcEvent2.setDate(vced2);
		vcEvent2.setAdministred(vx);
		vcEvent2.setDoseNumber(2);
		vcEvent2.setType(EventType.VACCINATION);
		
		ExpectedEvaluation ee2 = new ExpectedEvaluation();
		ee2.setRelatedTo(vx);
		ee2.setStatus(EvaluationStatus.INVALID);
		ee2.setEvaluationReason("Age too young");
		vcEvent2.setEvaluations(new HashSet<>(Arrays.asList(ee2)));
		
		
		tc.addEvent(vcEvent1);
		tc.addEvent(vcEvent2);
		
//		//Expected Forecast
//		ExpectedForecast ef = new ExpectedForecast();
//		ef.setDoseNumber("2");
//		ef.setTarget(vx);
//		ef.setSerieStatus(SerieStatus.O);
//		ef.setForecastReason("Second dose was administed too early");
//		Date earliest = dateformat.parse("30/05/2011");
//		Date recommended = dateformat.parse("26/06/2011");
//		Date pastDue = dateformat.parse("22/08/2011");
//		ef.setEarliest(new FixedDate(earliest));
//		ef.setRecommended(new FixedDate(recommended));
//		ef.setPastDue(new FixedDate(pastDue));
//
//		
//		ExpectedForecast eff = new ExpectedForecast();
//		eff.setDoseNumber("2");
//		eff.setTarget(vx1);
//		eff.setSerieStatus(SerieStatus.O);
//		eff.setForecastReason("Second dose was administed too early");
//		Date earliest1 = dateformat.parse("30/05/2011");
//		Date recommended1 = dateformat.parse("26/06/2011");
//		Date pastDue1 = dateformat.parse("22/08/2011");
//		eff.setEarliest(new FixedDate(earliest1));
//		eff.setRecommended(new FixedDate(recommended1));
//		eff.setPastDue(new FixedDate(pastDue1));
//		tc.setForecast(new HashSet<>(Arrays.asList(ef,eff)));
		
		MetaData md = new MetaData();
		md.setDateCreated(new Date());
		md.setDateLastUpdated(new Date());
		md.setImported(false);
		md.setVersion("1");
		tc.setMetaData(md);
		
		TestPlan tp = new TestPlan();
		tp.setId("xxxxx");
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
		tc.setTestPlan("xxxxx");
		tc.setId("1");
		testCaseRepository.save(tc);
		testPlanRepository.save(tp);
		
	}
}
