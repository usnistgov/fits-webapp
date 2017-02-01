package gov.nist.healthcare.cds.tcamt.config;

import java.io.IOException;
import java.text.ParseException;
import java.util.ArrayList;
import java.util.Set;

import javax.annotation.PostConstruct;
import javax.transaction.Transactional;

import gov.nist.healthcare.cds.auth.domain.Account;
import gov.nist.healthcare.cds.auth.domain.Privilege;
import gov.nist.healthcare.cds.auth.repo.PrivilegeRepository;
import gov.nist.healthcare.cds.auth.service.AccountService;
import gov.nist.healthcare.cds.domain.VaccineMapping;
import gov.nist.healthcare.cds.domain.exception.VaccineNotFoundException;
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

		
	}
}
