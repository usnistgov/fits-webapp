package gov.nist.healthcare.cds.tcamt.config;

import java.io.IOException;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.*;

import javax.annotation.PostConstruct;
import javax.xml.bind.JAXBException;

import com.google.common.base.Strings;
import gov.nist.fhir.client.ir.TestRunnerServiceFhirImpl;
import gov.nist.healthcare.cds.auth.domain.Account;
import gov.nist.healthcare.cds.auth.domain.Privilege;
import gov.nist.healthcare.cds.auth.repo.PrivilegeRepository;
import gov.nist.healthcare.cds.auth.service.AccountService;
import gov.nist.healthcare.cds.domain.wrapper.AppInfo;
import gov.nist.healthcare.cds.domain.wrapper.Document;
import gov.nist.healthcare.cds.domain.wrapper.Documents;
import gov.nist.healthcare.cds.domain.wrapper.Resources;
import gov.nist.healthcare.cds.service.TestRunnerService;
import gov.nist.healthcare.cds.service.VaccineMatcherService;
import gov.nist.healthcare.cds.service.impl.data.SimpleCodeRemapService;
import gov.nist.healthcare.cds.service.impl.validation.ConfigurableVaccineMatcher;
import gov.nist.healthcare.cds.service.vaccine.VaccineMatcherConfiguration;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.PropertySource;
import org.springframework.core.env.Environment;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.oxm.Marshaller;
import org.springframework.oxm.castor.CastorMarshaller;
import org.springframework.stereotype.Service;
import com.fasterxml.jackson.databind.ObjectMapper;

@Service
@PropertySource("classpath:application.properties")
public class Bootstrap {

	@Autowired
	private Environment env;
	
	@Autowired
	private PrivilegeRepository privilegeRepository;
	
	@Autowired
	private AccountService accService;

	@Autowired
	private SimpleCodeRemapService simpleCodeRemapService;

	private String ENV_ADMIN_CREATE = "fits.admin.create-if-not-exists";
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
	public String adminEmail() {
		return env.getProperty(ENV_ADMIN_EMAIL);
	}

	@Bean 
	public AppInfo appInfo() throws ParseException {
		AppInfo app = new AppInfo();
		SimpleDateFormat formatter = new SimpleDateFormat("MM-dd-yyyy");
		app.setAdminEmail(env.getProperty(ENV_WEB_ADMIN_EMAIL));
		app.setDate(formatter.parse(env.getProperty("app.date")));
		app.setVersion(env.getProperty("app.version"));
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
	public VaccineMatcherService matcher() {
		return new ConfigurableVaccineMatcher();
	}
	
	@Bean
	public VaccineMatcherConfiguration matcherConfig() throws JAXBException {
		return new VaccineMatcherConfiguration(Bootstrap.class.getResourceAsStream("/cdc/groups-mapping.xml"));
	}
	
	@Bean
	public Marshaller castorM() {
		return new CastorMarshaller();
	}
	
	@Bean
	public TestRunnerService testRunner() {
		return new TestRunnerServiceFhirImpl(env.getProperty(ENV_ADAPTER_URL));
	}

	@Bean
	public Documents documents() throws IOException {
		Documents docs = new Documents();
		ObjectMapper mapper = new ObjectMapper();
		List<Document> myObjects = mapper.readValue(Bootstrap.class.getResourceAsStream("/docs/documents.json"), mapper.getTypeFactory().constructCollectionType(List.class, Document.class));
		docs.setDocs(myObjects);
		return docs;
	}
	
	@Bean
	public Resources resources() throws IOException {
		Resources docs = new Resources();
		ObjectMapper mapper = new ObjectMapper();
		List<Document> myObjects = mapper.readValue(Bootstrap.class.getResourceAsStream("/doc_resources/documents.json"), mapper.getTypeFactory().constructCollectionType(List.class, Document.class));
		docs.setResources(myObjects);
		return docs;
	}

	public void createAdminUser() {
		Account admin = this.accService.getAccountByUsername("admin");
		String password = env.getProperty(ENV_ADMIN_PASSWORD);
		String email = env.getProperty(ENV_ADMIN_EMAIL);
		if(admin == null && !Strings.isNullOrEmpty(password) && !Strings.isNullOrEmpty(email)) {
			List<String> issues = this.accService.checkPasswordPolicy(password);
			if(issues.size() > 0) {
				System.out.println("[ADMIN USER CREATE] Invalid admin password: " + String.join(", ", issues));
			} else {
				Account account = new Account();
				account.setUsername("admin");
				account.setPassword(password);
				account.setEmail(email);
				account.setPending(false);
				this.accService.createAdmin(account);
				System.out.println("[ADMIN USER CREATED] Username: admin, Email: "+ email);
			}
		} else {
			System.out.println("[ADMIN USER NOT CREATED] admin user already exists, or password and email not provided");
		}
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

		if("true".equals(env.getProperty(ENV_ADMIN_CREATE))) {
			// Create admin user
			this.createAdminUser();
		}

		//Create Vaccines
		Map<String, String> cvxMapping = new HashMap<>();

		Map<String, String> productMapping = new HashMap<>();

		// Original : "AstraZeneca COVID-19 Vaccine (Non-US tradenames include VAXZEVRIA, COVISHIELD)"
		productMapping.put("210:ASZ:AstraZeneca COVID-19 Vaccine (includes non-US tradenames VAXZEVRIA, COVISHIELD)", "210:ASZ:AstraZeneca COVID-19 Vaccine (Non-US tradenames include VAXZEVRIA, COVISHIELD)");

		// Original : "Moderna COVID-19 Vaccine (non-US Spikevax)"
		productMapping.put("207:MOD:Moderna COVID-19 Vaccine (includes non-US tradename Spikevax)", "207:MOD:Moderna COVID-19 Vaccine (non-US Spikevax)");

		productMapping.put("208:PFR:Pfizer-BioNTech COVID-19 Vaccine", "208:PFR:Pfizer-BioNTech COVID-19 Vaccine (EUA labeled)  COMIRNATY (BLA labeled)");

		productMapping.put("211:NVX:Novavax COVID-19 Vaccine", "211:NVX:Novavax COVID-19 Vaccine (Non-US Tradenames NUVAXOVID, COVOVAX)");

		productMapping.put("229:MOD:Moderna COVID-19 Vaccine (non-US Spikevax)", "229:MOD:Moderna COVID-19 Bivalent, Original + BA.4/BA.5 (Non-US Tradename Spikevax Bivalent)");

		productMapping.put("230:MOD:Moderna COVID-19 Vaccine (non-US Spikevax)", "230:MOD:Moderna COVID-19 Bivalent, Original + BA.4/BA.5 (Non-US Tradename Spikevax Bivalent)");

		productMapping.put("300:PFR:Pfizer-BioNTech COVID-19 Vaccine (EUA labeled)  COMIRNATY (BLA labeled)", "300:PFR:Pfizer-BioNTech COVID-19 Bivalent, Original + BA.4/BA.5 (Non-US Tradename COMIRNATY Bivalent)");

		productMapping.put("301:PFR:Pfizer-BioNTech COVID-19 Vaccine (EUA labeled)  COMIRNATY (BLA labeled)", "301:PFR:Pfizer-BioNTech COVID-19 Bivalent, Original + BA.4/BA.5 (Non-US Tradename COMIRNATY Bivalent)");

		productMapping.put("302:PFR:Pfizer-BioNTech COVID-19 Vaccine (EUA labeled)  COMIRNATY (BLA labeled)", "302:PFR:Pfizer-BioNTech COVID-19 Bivalent, Original + BA.4/BA.5 (Non-US Tradename COMIRNATY Bivalent)");

		productMapping.put("158:SEQ:Afluria, quadrivalent", "158:SEQ:Afluria quadrivalent, with preservative");

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