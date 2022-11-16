package gov.nist.healthcare.cds.tcamt.config;

import java.io.IOException;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.*;

import javax.annotation.PostConstruct;
import javax.xml.bind.JAXBException;

import gov.nist.fhir.client.ir.TestRunnerServiceFhirImpl;
import gov.nist.healthcare.cds.auth.domain.Account;
import gov.nist.healthcare.cds.auth.domain.Privilege;
import gov.nist.healthcare.cds.auth.repo.PrivilegeRepository;
import gov.nist.healthcare.cds.auth.service.AccountService;
import gov.nist.healthcare.cds.domain.VaccineMapping;
import gov.nist.healthcare.cds.domain.wrapper.AppInfo;
import gov.nist.healthcare.cds.domain.wrapper.Document;
import gov.nist.healthcare.cds.domain.wrapper.Documents;
import gov.nist.healthcare.cds.domain.wrapper.Resources;
import gov.nist.healthcare.cds.domain.wrapper.SimulatedResult;
import gov.nist.healthcare.cds.domain.wrapper.SimulationMap;
import gov.nist.healthcare.cds.repositories.SoftwareConfigRepository;
import gov.nist.healthcare.cds.repositories.TestCaseRepository;
import gov.nist.healthcare.cds.repositories.VaccineMappingRepository;
import gov.nist.healthcare.cds.service.TestCaseExecutionService;
import gov.nist.healthcare.cds.service.TestRunnerService;
import gov.nist.healthcare.cds.service.VaccineImportService;
import gov.nist.healthcare.cds.service.VaccineMatcherService;
import gov.nist.healthcare.cds.service.impl.data.SimpleCodeRemapService;
import gov.nist.healthcare.cds.service.impl.validation.ConfigurableVaccineMatcher;
import gov.nist.healthcare.cds.service.impl.validation.ExecutionService;
import gov.nist.healthcare.cds.service.vaccine.VaccineMatcherConfiguration;

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
import com.fasterxml.jackson.core.JsonParseException;
import com.fasterxml.jackson.databind.JsonMappingException;
import com.fasterxml.jackson.databind.ObjectMapper;

@Service
@PropertySource("classpath:filtered/app-info.properties")
public class Bootstrap {

	@Autowired
	private Environment env;
	
	@Autowired
	private VaccineImportService vaccineService;
	
	@Autowired
	private PrivilegeRepository privilegeRepository;
	
	@Autowired
	private SoftwareConfigRepository softwareConfRepository;
	
	@Autowired
	private VaccineMappingRepository vaccineRepository;
	
	@Autowired
	private TestCaseRepository testCaseRepository;
	
	@Autowired
	private AccountService accService;

	@Autowired
	private SimpleCodeRemapService simpleCodeRemapService;
	
	private String ENV_ADMIN_USERNAME = "fits.admin.username";
	private String ENV_ADMIN_PASSWORD = "fits.admin.password";
	private String ENV_ADMIN_EMAIL = "fits.admin.email";
	private String ENV_WEB_ADMIN_EMAIL = "fits.admin.web.email";
	private String ENV_EMAIL_HOST = "fits.email.host";
	private String ENV_EMAIL_PORT = "fits.email.port";
	private String ENV_EMAIL_PROTOCOL = "fits.email.protocol";
	private String ENV_EMAIL_SMTP_AUTH = "fits.email.smtp.auth";
	private String ENV_EMAIL_FROM = "fits.email.from";
	private String ENV_EMAIL_SUBJECT = "fits.email.subject";
	private String ENV_ADAPTER_URL = "fits.adapter.url";


	@Bean
	public PasswordEncoder passEncode(){
		return new BCryptPasswordEncoder();
	}
	
	@Bean
	public String adminEmail() {
		return env.getProperty(ENV_ADMIN_EMAIL);
	}
	
	@Bean 
	public AppInfo appInfo() throws ParseException{
		AppInfo app = new AppInfo();
		SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd HH:mm");
		app.setAdminEmail(env.getProperty(ENV_WEB_ADMIN_EMAIL));
		app.setDate(new java.util.Date(Long.parseLong(env.getProperty("date"))));
		app.setVersion(env.getProperty("version"));
		return app;
	}
	
	@Bean
	public JavaMailSenderImpl mailSender() {
		JavaMailSenderImpl mailSender = new JavaMailSenderImpl();
		mailSender.setHost(env.getProperty(ENV_EMAIL_HOST));
		mailSender.setPort(Integer.parseInt(env.getProperty(ENV_EMAIL_PORT)));
		mailSender.setProtocol(env.getProperty(ENV_EMAIL_PROTOCOL));
		Properties javaMailProperties = new Properties();
		javaMailProperties.setProperty("mail.smtp.auth",env.getProperty(ENV_EMAIL_SMTP_AUTH));
		javaMailProperties.setProperty("mail.debug","true");

		mailSender.setJavaMailProperties(javaMailProperties);
		return mailSender;
	}


	@Bean
	public org.springframework.mail.SimpleMailMessage templateMessage() {
		org.springframework.mail.SimpleMailMessage templateMessage = new org.springframework.mail.SimpleMailMessage();
		templateMessage.setFrom(env.getProperty(ENV_EMAIL_FROM));
		templateMessage.setSubject(env.getProperty(ENV_EMAIL_SUBJECT));
		return templateMessage;
	}
	
	@Bean
	public VaccineMatcherService matcher(){
		return new ConfigurableVaccineMatcher();
	}
	
	@Bean
	public VaccineMatcherConfiguration matcherConfig() throws JAXBException{
		return new VaccineMatcherConfiguration(Bootstrap.class.getResourceAsStream("/cdc/groups-mapping.xml"));
	}
	
	@Bean
	public Marshaller castorM(){
		return new CastorMarshaller();
	}
	
	@Bean
	public TestRunnerService testRunner(){
		return new TestRunnerServiceFhirImpl(env.getProperty(ENV_ADAPTER_URL));
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
	}
	
	public void createVaccine() throws IOException{
		long all = vaccineRepository.count();
		int i = 0;
		Set<VaccineMapping> set = vaccineService._import(Bootstrap.class.getResourceAsStream("/codeset/web_cvx.xlsx"),Bootstrap.class.getResourceAsStream("/codeset/web_vax2vg.xlsx"),Bootstrap.class.getResourceAsStream("/codeset/web_mvx.xlsx"),Bootstrap.class.getResourceAsStream("/codeset/web_tradename.xlsx"));
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
	

	@PostConstruct
	public void init() throws Exception {
		
		// Create Privileges
		this.createPrivileges();

		//Create Vaccines
		Map<String, String> cvxMapping = new HashMap<>();

		Map<String, String> productMapping = new HashMap<>();

		// Original : "AstraZeneca COVID-19 Vaccine (Non-US tradenames include VAXZEVRIA, COVISHIELD)"
		productMapping.put("210:ASZ:AstraZeneca COVID-19 Vaccine (includes non-US tradenames VAXZEVRIA, COVISHIELD)", "210:ASZ:AstraZeneca COVID-19 Vaccine (Non-US tradenames include VAXZEVRIA, COVISHIELD)");

		// Original : "Moderna COVID-19 Vaccine (non-US Spikevax)"
		productMapping.put("207:MOD:Moderna COVID-19 Vaccine (includes non-US tradename Spikevax)", "207:MOD:Moderna COVID-19 Vaccine (non-US Spikevax)");

		productMapping.put("208:PFR:Pfizer-BioNTech COVID-19 Vaccine", "208:PFR:Pfizer-BioNTech COVID-19 Vaccine (EUA labeled)  COMIRNATY (BLA labeled)");

		this.simpleCodeRemapService.reloadCodeSetsAndRemapTestCases(
				Bootstrap.class.getResourceAsStream("/codeset/web_cvx.xlsx"),
				Bootstrap.class.getResourceAsStream("/codeset/web_vax2vg.xlsx"),
				Bootstrap.class.getResourceAsStream("/codeset/web_mvx.xlsx"),
				Bootstrap.class.getResourceAsStream("/codeset/web_tradename.xlsx"),
				cvxMapping,
				productMapping
		);
	}
	
}