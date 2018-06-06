package gov.nist.healthcare.cds.tcamt.data.app;

import java.io.IOException;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Properties;
import java.util.Set;

import javax.annotation.PostConstruct;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.xml.bind.JAXBException;

import org.joda.time.LocalDate;
import org.joda.time.Period;
import org.joda.time.PeriodType;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.Primary;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.oxm.Marshaller;
import org.springframework.oxm.castor.CastorMarshaller;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.AuthenticationEntryPoint;

import com.fasterxml.jackson.core.JsonParseException;
import com.fasterxml.jackson.databind.JsonMappingException;
import com.fasterxml.jackson.databind.ObjectMapper;

import gov.nist.fhir.client.ir.TestRunnerServiceFhirImpl;
import gov.nist.healthcare.cds.domain.Date;
import gov.nist.healthcare.cds.domain.FixedDate;
import gov.nist.healthcare.cds.domain.RelativeDate;
import gov.nist.healthcare.cds.domain.RelativeDateRule;
import gov.nist.healthcare.cds.domain.SoftwareConfig;
import gov.nist.healthcare.cds.domain.Tag;
import gov.nist.healthcare.cds.domain.TestCase;
import gov.nist.healthcare.cds.domain.TestCaseGroup;
import gov.nist.healthcare.cds.domain.TestPlan;
import gov.nist.healthcare.cds.domain.VaccineMapping;
import gov.nist.healthcare.cds.domain.exception.ProductNotFoundException;
import gov.nist.healthcare.cds.domain.exception.VaccineNotFoundException;
import gov.nist.healthcare.cds.domain.wrapper.AppInfo;
import gov.nist.healthcare.cds.domain.wrapper.Document;
import gov.nist.healthcare.cds.domain.wrapper.Documents;
import gov.nist.healthcare.cds.domain.wrapper.Resources;
import gov.nist.healthcare.cds.domain.wrapper.SimulatedResult;
import gov.nist.healthcare.cds.domain.wrapper.SimulationMap;
import gov.nist.healthcare.cds.enumeration.DateType;
import gov.nist.healthcare.cds.enumeration.FHIRAdapter;
import gov.nist.healthcare.cds.repositories.TestCaseRepository;
import gov.nist.healthcare.cds.repositories.TestPlanRepository;
import gov.nist.healthcare.cds.repositories.VaccineMappingRepository;
import gov.nist.healthcare.cds.service.TPShareService;
import gov.nist.healthcare.cds.service.TestCaseExecutionService;
import gov.nist.healthcare.cds.service.TestRunnerService;
import gov.nist.healthcare.cds.service.VaccineImportService;
import gov.nist.healthcare.cds.service.VaccineMatcherService;
import gov.nist.healthcare.cds.service.impl.data.SharingService;
import gov.nist.healthcare.cds.service.impl.validation.ConfigurableVaccineMatcher;
import gov.nist.healthcare.cds.service.impl.validation.ExecutionService;
import gov.nist.healthcare.cds.service.vaccine.VaccineMatcherConfiguration;
import junit.framework.Test;

@SpringBootApplication
@ComponentScan({ "gov.nist.healthcare.cds" })
public class SpringBootConsoleApplication implements CommandLineRunner {

	public static class Age {
		private int year;
		private boolean more;
		
		public Age(int year, boolean more) {
			super();
			this.year = year;
			this.more = more;
		}
		public int getYear() {
			return year;
		}
		public void setYear(int year) {
			this.year = year;
		}
		public boolean isMore() {
			return more;
		}
		public void setMore(boolean more) {
			this.more = more;
		}
	}
	

	
	@Bean
	public PasswordEncoder passEncode(){
		return new BCryptPasswordEncoder();
	}
	
	@Autowired
	private VaccineImportService vaccineService;
	
	@Autowired
	private VaccineMappingRepository vaccineRepository;

	@Autowired
	private TestPlanRepository tpRepo;
	@Autowired
	private TestCaseRepository tcRepo;
	

    public static void main(String[] args) throws Exception {

    	new SpringApplicationBuilder(SpringBootConsoleApplication.class).web(false).run(args);

    }

    @Override
    public void run(String... args) throws Exception {
    	System.out.println("[UPDATE DATA]");
    	System.out.println("[VACCINES]");
    	long all = vaccineRepository.count();
		int i = 0;
		Set<VaccineMapping> set = vaccineService._import(SpringBootConsoleApplication.class.getResourceAsStream("/web_cvx.xlsx"),SpringBootConsoleApplication.class.getResourceAsStream("/web_vax2vg.xlsx"),SpringBootConsoleApplication.class.getResourceAsStream("/web_mvx.xlsx"),SpringBootConsoleApplication.class.getResourceAsStream("/web_tradename.xlsx"));
		for(VaccineMapping mp : set){
			i++;
			vaccineRepository.save(mp);
		}
		System.out.println("[VACCINE SERVICE IMPORT] IMPORTED "+i+" EXISTING "+all);
		System.out.println("[TAG]");
		String username = "CDC_CDSi";
		System.out.println("Username : "+username);
		List<TestPlan> tps = tpRepo.findByUser(username);
		List<TestCase> tcs = tcs(tps);
		List<TestCase> toSave = new ArrayList<>();
		
		for(TestCase tc : tcs){
			try {
				Age a = age(tc);
				Tag tag = tag(a);
				if(tc.getTags() != null && tc.getTags().contains(tag)) continue;
				else {
					if(tc.getTags() == null){
						tc.setTags(Arrays.asList(tag));
					}
					else {
						tc.getTags().add(tag);
					}
					toSave.add(tc);
				}
			}
			catch(Exception e){
				System.out.println("[ISSUE] "+e.getMessage());
			}
		}
		System.out.println("[UPDATED TCS] "+toSave.size()+" / "+tcs.size());
		this.tcRepo.save(toSave);
    }
    
    
    private Tag tag(Age a){
    	if(a.getYear() < 7) return new Tag("0-6");
    	else if(a.getYear() >= 7 && a.getYear() < 19) return new Tag("7-18");
    	else if(a.getYear() >= 19) return new Tag("19+");
    	return null;
    };
    
    
    private List<TestCase> tcs(List<TestPlan> tps) {
		List<TestCase> tc = new ArrayList<>();
		for(TestPlan tp : tps){
			if(tp.getTestCases() != null){
				tc.addAll(tp.getTestCases());
			}
			for(TestCaseGroup tcg : tp.getTestCaseGroups()){
				if(tcg.getTestCases() != null){
					tc.addAll(tcg.getTestCases());
				}
			}
		}
		return tc;
	}
    
    private Age age(TestCase tc){
    	if(tc.getDateType().equals(DateType.FIXED)){
    		LocalDate from = new LocalDate(((FixedDate) tc.getPatient().getDob()).getDate());
    		LocalDate to = new LocalDate(((FixedDate) tc.getEvalDate()).getDate());
    		Period period = new Period(from, to, PeriodType.yearMonthDay());
    		return new Age(period.getYears(), period.getDays() > 0 || period.getMonths() > 0);
    	}
    	else {
    		RelativeDate date = (RelativeDate) tc.getPatient().getDob();
    		RelativeDateRule rule = date.getRules().get(0);
    		return new Age(rule.getYear(), rule.getDay() > 0 || rule.getWeek() > 0 || rule.getMonth() > 0);
   
    	}
    }
    
    
	
//	@Bean 
//	public AppInfo appInfo() throws ParseException{
//		AppInfo app = new AppInfo();
//		SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd HH:mm");
//		app.setAdminEmail(env.getProperty("webadmin.email"));
//		app.setDate(new Date(Integer.parseInt(env.getProperty("date"))));
//		app.setVersion(env.getProperty("version"));
//		return app;
//	}
//	
//	@Bean
//	public JavaMailSenderImpl mailSender() {
//		JavaMailSenderImpl mailSender = new JavaMailSenderImpl();
//		mailSender.setHost("smtp.nist.gov");
//		mailSender.setPort(25);
//		mailSender.setProtocol("smtp");
//		Properties javaMailProperties = new Properties();
//		javaMailProperties.setProperty("mail.smtp.auth","false");
//		javaMailProperties.setProperty("mail.debug","true");
//
//		mailSender.setJavaMailProperties(javaMailProperties);
//		return mailSender;
//	}
//
//
//	@Bean
//	public org.springframework.mail.SimpleMailMessage templateMessage() {
//		org.springframework.mail.SimpleMailMessage templateMessage = new org.springframework.mail.SimpleMailMessage();
//		templateMessage.setFrom("fits@nist.gov");
//		templateMessage.setSubject("NIST FITS Notification");
//		return templateMessage;
//	}
//	
	@Bean
	public VaccineMatcherService matcher(){
		return new ConfigurableVaccineMatcher();
	}
	
	@Bean
	public VaccineMatcherConfiguration matcherConfig() throws JAXBException{
		return new VaccineMatcherConfiguration();
	}
	
	@Bean
	public Marshaller castorM(){
		
		return new CastorMarshaller();
	}
	
	@Bean
	public TestRunnerService testRunner(){
		return new TestRunnerServiceFhirImpl("https://hit-dev.nist.gov:15000/fhirAdapter/fhir/Parameters/$cds-forecast");
	}
	
//	@Bean
//	public SimulationMap simulationMap() throws JsonParseException, JsonMappingException, IOException{
//		ObjectMapper mapper = new ObjectMapper();
//		SimulationMap sm = new SimulationMap();
//		List<SimulatedResult> myObjects = mapper.readValue(Bootstrap.class.getResourceAsStream("/simulation.json"), mapper.getTypeFactory().constructCollectionType(List.class, SimulatedResult.class));
//		for(SimulatedResult sr : myObjects){
//			sm.put(sr.getId(),sr.getXml());
//		}
//		return sm;
//	}
	
	
	@Bean
	public TestCaseExecutionService testExecution(){
		return new ExecutionService();
	}
	

@Bean
public AuthenticationEntryPoint entryPoint(){
	return new AuthenticationEntryPoint() {
		
		@Override
		public void commence(HttpServletRequest arg0, HttpServletResponse arg1, AuthenticationException arg2)
				throws IOException, ServletException {
			// TODO Auto-generated method stub
			
		}
	};
}

	
	
    
    
}