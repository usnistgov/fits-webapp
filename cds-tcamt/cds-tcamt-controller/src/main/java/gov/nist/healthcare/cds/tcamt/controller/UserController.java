package gov.nist.healthcare.cds.tcamt.controller;

import gov.nist.healthcare.cds.auth.domain.Account;
import gov.nist.healthcare.cds.auth.domain.CurrentUser;
import gov.nist.healthcare.cds.auth.domain.ResponseMessage;
import gov.nist.healthcare.cds.auth.repo.AccountRepository;
import gov.nist.healthcare.cds.auth.service.AccountService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.User;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class UserController {

	@Autowired
	private AccountService userService;

	@Autowired
	private AccountRepository accountRepository;

	@RequestMapping(value = "/accounts/login", method = RequestMethod.GET)
	public ResponseMessage doNothing() {
		return new ResponseMessage(ResponseMessage.Type.success,
				"loginSuccess", "succes");
	}

	/**
	 * 
	 * */
	@RequestMapping(value = "/accounts/cuser", method = RequestMethod.GET)
	public CurrentUser getCUser() {
		User u = userService.getCurrentUser();
		CurrentUser cu = null;
		if (u != null && u.isEnabled()) {
			Account a = accountRepository.findByUsername(u.getUsername());

			cu = new CurrentUser();
			cu.setUsername(u.getUsername());
			cu.setAccountId(a.getId());
			cu.setAuthenticated(true);
			cu.setAuthorities(u.getAuthorities());
		}
		return cu;
	}

	@RequestMapping(value = "/logout", method = RequestMethod.GET)
	public boolean logout() {
		return true;
	}
}
