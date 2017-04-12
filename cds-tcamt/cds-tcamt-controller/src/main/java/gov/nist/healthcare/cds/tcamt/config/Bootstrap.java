package gov.nist.healthcare.cds.tcamt.config;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.net.URISyntaxException;
import java.net.URL;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Date;
import java.util.HashSet;
import java.util.List;
import java.util.Properties;
import java.util.Set;

import javax.annotation.PostConstruct;

import gov.nist.fhir.client.ir.TestRunnerServiceFhirImpl;
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
import gov.nist.healthcare.cds.domain.TestCaseGroup;
import gov.nist.healthcare.cds.domain.TestPlan;
import gov.nist.healthcare.cds.domain.VaccinationEvent;
import gov.nist.healthcare.cds.domain.Vaccine;
import gov.nist.healthcare.cds.domain.VaccineDateReference;
import gov.nist.healthcare.cds.domain.VaccineMapping;
import gov.nist.healthcare.cds.domain.exception.VaccineNotFoundException;
import gov.nist.healthcare.cds.domain.wrapper.ActualEvaluation;
import gov.nist.healthcare.cds.domain.wrapper.ActualForecast;
import gov.nist.healthcare.cds.domain.wrapper.AppInfo;
import gov.nist.healthcare.cds.domain.wrapper.Document;
import gov.nist.healthcare.cds.domain.wrapper.Documents;
import gov.nist.healthcare.cds.domain.wrapper.EngineResponse;
import gov.nist.healthcare.cds.domain.wrapper.MetaData;
import gov.nist.healthcare.cds.domain.wrapper.Resources;
import gov.nist.healthcare.cds.domain.wrapper.ResponseVaccinationEvent;
import gov.nist.healthcare.cds.domain.wrapper.SimulatedResult;
import gov.nist.healthcare.cds.domain.wrapper.SimulationMap;
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
import gov.nist.healthcare.cds.repositories.ProductRepository;
import gov.nist.healthcare.cds.repositories.SoftwareConfigRepository;
import gov.nist.healthcare.cds.repositories.TestCaseRepository;
import gov.nist.healthcare.cds.repositories.TestPlanRepository;
import gov.nist.healthcare.cds.repositories.VaccineGroupRepository;
import gov.nist.healthcare.cds.repositories.VaccineMappingRepository;
import gov.nist.healthcare.cds.repositories.VaccineRepository;
import gov.nist.healthcare.cds.service.MetaDataService;
import gov.nist.healthcare.cds.service.NISTFormatService;
import gov.nist.healthcare.cds.service.TestCaseExecutionService;
import gov.nist.healthcare.cds.service.TestRunnerService;
import gov.nist.healthcare.cds.service.VaccineImportService;
import gov.nist.healthcare.cds.service.impl.validation.ExecutionService;
import gov.nist.healthcare.cds.service.impl.validation.simulation.MockTestRunner;
import gov.nist.healthcare.cds.service.impl.validation.simulation.TestExecutionSimulation;

import org.apache.commons.io.IOUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.PropertySource;
import org.springframework.core.env.Environment;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.oxm.Marshaller;
import org.springframework.oxm.castor.CastorMarshaller;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import com.fasterxml.jackson.core.JsonParseException;
import com.fasterxml.jackson.databind.JsonMappingException;
import com.fasterxml.jackson.databind.ObjectMapper;

@Service
@PropertySource("classpath:app-info.properties" )
@PropertySource("classpath:admin.properties" )
public class Bootstrap {

	@Autowired
	private Environment env;
	
	@Autowired
	private MetaDataService mdService;
	
	@Autowired
	private AccountService accountService;
	
	@Autowired
	private VaccineImportService vaccineService;
	
	@Autowired
	private PrivilegeRepository privilegeRepository;
	
	@Autowired
	private TestPlanRepository testPlanRepository;
	
	@Autowired
	private TestCaseRepository testCaseRepository;
	
	@Autowired
	private SoftwareConfigRepository softwareConfRepository;
	
	@Autowired
	private VaccineMappingRepository vaccineRepository;
	
	@Autowired
	private NISTFormatService nistService;
	
	@Bean
	public PasswordEncoder passEncode(){
		return new BCryptPasswordEncoder();
	}
	
	@Bean 
	public AppInfo appInfo() throws ParseException{
		AppInfo app = new AppInfo();
		SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd HH:mm");
		app.setAdminEmail(env.getProperty("webadmin.email"));
		app.setDate(sdf.parse(env.getProperty("build.date")));
		app.setVersion(env.getProperty("version"));
		return app;
	}
	
	@Bean
	public JavaMailSenderImpl mailSender() {
		JavaMailSenderImpl mailSender = new JavaMailSenderImpl();
		mailSender.setHost("smtp.nist.gov");
		mailSender.setPort(25);
		mailSender.setProtocol("smtp");
		Properties javaMailProperties = new Properties();
		javaMailProperties.setProperty("mail.smtp.auth","false");
		javaMailProperties.setProperty("mail.debug","true");

		mailSender.setJavaMailProperties(javaMailProperties);
		return mailSender;
	}


	@Bean
	public org.springframework.mail.SimpleMailMessage templateMessage() {
		org.springframework.mail.SimpleMailMessage templateMessage = new org.springframework.mail.SimpleMailMessage();
		templateMessage.setFrom("fits@nist.gov");
		templateMessage.setSubject("NIST FITS Notification");
		return templateMessage;
	}
	
	@Bean
	public Marshaller castorM(){
		return new CastorMarshaller();
	}
	
	@Bean
	public TestRunnerService testRunner(){
//		return new MockTestRunner();
//		return new TestRunnerServiceFhirImpl("https://p860556.campus.nist.gov:8443/forecast/ImmunizationRecommendations");
		return new TestRunnerServiceFhirImpl("https://hit-dev.nist.gov:15001/forecast/ImmunizationRecommendations");
	}
	
	@Bean
	public SimulationMap simulationMap() throws JsonParseException, JsonMappingException, IOException{
		ObjectMapper mapper = new ObjectMapper();
		SimulationMap sm = new SimulationMap();
		List<SimulatedResult> myObjects = mapper.readValue(Bootstrap.class.getResourceAsStream("/simulation.json"), mapper.getTypeFactory().constructCollectionType(List.class, SimulatedResult.class));
		for(SimulatedResult sr : myObjects){
			sm.put(sr.getId(),sr.getXml());
		}
		return sm;
	}
	
	@Bean
	public Documents documents() throws JsonParseException, JsonMappingException, IOException{
		Documents docs = new Documents();
		ObjectMapper mapper = new ObjectMapper();
		List<Document> myObjects = mapper.readValue(Bootstrap.class.getResourceAsStream("/docs/documents.json"), mapper.getTypeFactory().constructCollectionType(List.class, Document.class));
		docs.setDocs(myObjects);
		return docs;
	}
	
	@Bean
	public Resources resources() throws JsonParseException, JsonMappingException, IOException{
		Resources docs = new Resources();
		ObjectMapper mapper = new ObjectMapper();
		List<Document> myObjects = mapper.readValue(Bootstrap.class.getResourceAsStream("/doc_resources/documents.json"), mapper.getTypeFactory().constructCollectionType(List.class, Document.class));
		docs.setResources(myObjects);
		return docs;
	}
	
	@Bean
	public TestCaseExecutionService testExecution(){
		return new ExecutionService();
//		return new TestExecutionSimulation();
	}
	
	public void createVaccine() throws IOException{
		long all = vaccineRepository.count();
		int i = 0;
		if(all ==  0){
			Set<VaccineMapping> set = vaccineService._import(Bootstrap.class.getResourceAsStream("/web_cvx.xlsx"),Bootstrap.class.getResourceAsStream("/web_vax2vg.xlsx"),Bootstrap.class.getResourceAsStream("/web_mvx.xlsx"),Bootstrap.class.getResourceAsStream("/web_tradename.xlsx"));
			for(VaccineMapping mp : set){
				if(!vaccineRepository.exists(mp.getId())){
					i++;
					vaccineRepository.save(mp);
				}
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
	
	private List<TestCase> loadTestCases(String folder, String tp) throws IOException, VaccineNotFoundException{
		List<TestCase> tcs = new ArrayList<TestCase>();
		final URL url = Bootstrap.class.getResource("/" + folder);
		if (url != null) {
	        try {
	            final File apps = new File(url.toURI());
	            for (File app : apps.listFiles()) {
	            	FileInputStream fisTargetFile = new FileInputStream(app);
	            	String targetFileStr = IOUtils.toString(fisTargetFile, "UTF-8");
	            	TestCase tc = nistService._import(targetFileStr);
	            	tc.setTestPlan(tp);
	            	tcs.add(tc);
					
	            }
	        } catch (URISyntaxException ex) {
	            // never happens
	        }
	    }
		return tcs;
	}
	
	@PostConstruct
	public void init() throws ParseException, IOException, VaccineNotFoundException {
		
		//Vaccine
		this.createVaccine();
		
		//Privileges
		this.createPrivileges();
		
		//Software
		this.createSoftware();
		
		
	}
}