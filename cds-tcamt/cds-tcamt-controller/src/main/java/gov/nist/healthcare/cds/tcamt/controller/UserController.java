package gov.nist.healthcare.cds.tcamt.controller;

import gov.nist.healthcare.cds.auth.domain.Account;
import gov.nist.healthcare.cds.auth.domain.AccountPasswordReset;
import gov.nist.healthcare.cds.auth.domain.CurrentUser;
import gov.nist.healthcare.cds.auth.domain.PasswordChange;
import gov.nist.healthcare.cds.auth.domain.PasswordChangeException;
import gov.nist.healthcare.cds.auth.domain.Privilege;
import gov.nist.healthcare.cds.auth.domain.ResponseMessage;
import gov.nist.healthcare.cds.auth.repo.AccountPasswordResetRepository;
import gov.nist.healthcare.cds.auth.repo.AccountRepository;
import gov.nist.healthcare.cds.auth.service.AccountService;

import java.io.IOException;
import java.security.Principal;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import gov.nist.healthcare.cds.domain.UserMetadata;
import gov.nist.healthcare.cds.repositories.UserMetadataRepository;
import gov.nist.healthcare.cds.service.UserMetadataService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.PropertySource;
import org.springframework.mail.MailException;
import org.springframework.mail.MailSender;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.util.UriUtils;

@RestController
public class UserController {

	@Autowired
	private AccountService userService;

	@Autowired
	private AccountRepository accountRepository;
	
	@Autowired
	private AccountPasswordResetRepository accountResetPasswordRepository;
	
	@Autowired
	private SimpleMailMessage templateMessage;
	
	@Autowired
	private MailSender mailSender;

	@Value("#{adminEmail}")
	private String ADMIN_EMAIL;

	@Autowired
	private UserMetadataRepository userMetadataRepository;

	
	@RequestMapping(value = "/accounts/login", method = RequestMethod.GET)
	public ResponseMessage doNothing() {
		Account u = userService.getCurrentUser();
		return new ResponseMessage(ResponseMessage.Type.success,
				"loginSuccess", "succes");
	}
	
	@RequestMapping(value = "/shortaccounts", method = RequestMethod.GET)
	@ResponseBody
	public List<Account> accounts() {
		Account u = userService.getCurrentUser();
		if(u != null && u.isEnabled() && isAdmin(u)){
			List<Account> users = new ArrayList<Account>();
			List<Account> acc = accountRepository.findAll();
			for(Account a : acc){
				if(!isAdmin(a)){
					users.add(a);
				}
			}
			return users;
		}
		return null;
	}
	
	@RequestMapping(value = "/accounts/{accountId}/approveaccount", method = RequestMethod.POST)
	@ResponseBody
	public Account accountsEnable(@PathVariable String accountId) {
		Account u = userService.getCurrentUser();
		if(u != null && u.isEnabled() && isAdmin(u)){
			Account a = accountRepository.findOne(accountId);
			a.setPending(false);
			accountRepository.save(a);
			this.sendAccountApproveNotification(a);
			return a;
		}
		return null;
	}
	
	@RequestMapping(value = "/accounts/{accountId}", method = RequestMethod.GET)
	@ResponseBody
	public Account accountId(@PathVariable String accountId,Principal p) {
		Account a = accountRepository.findByUsername(p.getName());
		if(a.getId().equals(accountId)){
			return a;
		}
		return null;
	}
	
	@RequestMapping(value = "/accounts/{accountId}", method = RequestMethod.POST)
	@ResponseBody
	public Account accountSave(@RequestBody Account acc, @PathVariable String accountId,Principal p) {
		if(acc.getId().equals(accountId) && acc.getUsername().equals(p.getName())){
			return accountRepository.save(acc);
		}
		return null;
	}

	@RequestMapping(value = "/accounts/list/metadata", method = RequestMethod.GET)
	@ResponseBody
	public List<UserMetadata> usermetadata() {
		return this.userMetadataRepository.findAll();
	}
	
	private void sendChangeAccountPasswordNotification(Account acc) {
		SimpleMailMessage msg = new SimpleMailMessage(this.templateMessage);

		msg.setTo(acc.getEmail());
		msg.setSubject("FITS Password Change Notification");
		msg.setText("Dear " + acc.getUsername() + " \n\n"
				+ "Your password has been successfully changed." + " \n\n"
				+ "Sincerely,\n\n" + "The FITS Team");

		try {
			this.mailSender.send(msg);
		} catch (MailException ex) {
			ex.printStackTrace();
		}
	}
	
	private void sendChangeAccountPasswordNotification(Account acc,
			String newPassword) {
		SimpleMailMessage msg = new SimpleMailMessage(this.templateMessage);
		msg.setTo(acc.getEmail());
		msg.setSubject("FITS Password Change Notification");
		msg.setText("Dear " + acc.getUsername() + " \n\n"
				+ "Your password has been successfully changed." + " \n\n"
				+ "Your new temporary password is ." + newPassword + " \n\n"
				+ "Please update your password once logged in. \n\n"
				+ "Sincerely,\n\n" + "The FITS Team");

		try {
			this.mailSender.send(msg);
		} catch (MailException ex) {
			ex.printStackTrace();
		}
	}
	

	private void sendResetAccountPasswordNotification(Account acc) {
		SimpleMailMessage msg = new SimpleMailMessage(this.templateMessage);

		msg.setTo(acc.getEmail());
		msg.setSubject("FITS Password Rest Notification");
		msg.setText("Dear " + acc.getUsername() + " \n\n"
				+ "Your password has been successfully reset." + " \n"
				+ "Your username is: " + acc.getUsername() + " \n\n"
				+ "Sincerely,\n\n" + "The FITS Team");

		try {
			this.mailSender.send(msg);
		} catch (MailException ex) {
			ex.printStackTrace();
		}
	}
	
	@RequestMapping(value = "/accounts/{accountId}/passwordchange", method = RequestMethod.POST)
	public ResponseMessage changeAccountPassword(
			@RequestBody PasswordChange acc,
			@PathVariable String accountId, HttpServletResponse response, Principal p) throws IOException {
		Account a = accountRepository.findByUsername(p.getName());
		if(!p.getName().equals(acc.getUsername()) || !a.getId().equals(a.getId())){
			response.sendError(403);
		}
		
		// check there is a username in the request
		if (acc.getUsername() == null || acc.getUsername().isEmpty()) {
			return new ResponseMessage(ResponseMessage.Type.danger,
					"Missing Username", null);
		}

		if (acc.getNewPassword() == null || acc.getNewPassword().length() < 4) {
			return new ResponseMessage(ResponseMessage.Type.danger,
					"Invalid Password", null);
		}

		Account onRecordAccount = accountRepository.findOne(accountId);
		if (!onRecordAccount.getUsername().equals(acc.getUsername())) {
			return new ResponseMessage(ResponseMessage.Type.danger,
					"Invalid Username", null);
		}

		try {
			userService.changePassword(onRecordAccount,acc);
		} catch (PasswordChangeException e) {
			return new ResponseMessage(ResponseMessage.Type.danger,
					e.getMessage(), null);
		}

		// send email notification
		this.sendChangeAccountPasswordNotification(onRecordAccount);

		return new ResponseMessage(ResponseMessage.Type.success,
				"Password Changed Successfully", onRecordAccount.getId().toString(),
				true);
	}
	
	@RequestMapping(value = "/sooa/accounts/{userId}/passwordreset", method = RequestMethod.POST, params = "token")
	public ResponseMessage resetAccountPassword(@RequestBody Account acc,
			@PathVariable String userId,
			@RequestParam(required = true) String token) {

		// logger.debug("^^^^^^^^^^^^^^^^^^^^^ -5 ^^^^^^^^^^^^^^^^^^");

		// check there is a username in the request
		if (acc.getUsername() == null || acc.getUsername().isEmpty()) {
			return new ResponseMessage(ResponseMessage.Type.danger,
					"Username Missing", null);
		}

		// logger.debug("^^^^^^^^^^^^^^^^^^^^^ -4 ^^^^^^^^^^^^^^^^^^");

		AccountPasswordReset apr = accountResetPasswordRepository.findByUsername(acc.getUsername());

		// logger.debug("^^^^^^^^^^^^^^^^^^^^^ -3 ^^^^^^^^^^^^^^^^^^");

		// check there is a reset request on record
		if (apr == null) {
			return new ResponseMessage(ResponseMessage.Type.danger,
					"No reset request found", null);
		}

		// logger.debug("^^^^^^^^^^^^^^^^^^^^^ -2 ^^^^^^^^^^^^^^^^^^");

		// check that for username, the token in record is the token passed in
		// request
		if (!apr.getCurrentToken().equals(token)) {
			return new ResponseMessage(ResponseMessage.Type.danger,
					"Invalid request", null);
		}

		// logger.debug("^^^^^^^^^^^^^^^^^^^^^ -1 ^^^^^^^^^^^^^^^^^^");

		// check token is not expired
		if (apr.isTokenExpired()) {
			return new ResponseMessage(ResponseMessage.Type.danger,
					"Request has expired", null);
		}

		// logger.debug("^^^^^^^^^^^^^^^^^^^^^ 0 ^^^^^^^^^^^^^^^^^^");

		Account onRecordAccount = accountRepository.findOne(userId);

		// logger.debug("^^^^^^^^^^^^^^^^^^^^^ "+onRecordUser.getPassword()+" ^^^^^^^^^^^^^^^^^^");

		// logger.debug("^^^^^^^^^^^^^^^^^^^^^ 1 ^^^^^^^^^^^^^^^^^^");


		// logger.debug("^^^^^^^^^^^^^^^^^^^^^ 2 ^^^^^^^^^^^^^^^^^^");

		try {
			userService.changePassword(acc.getPassword(), userId);
		} catch (PasswordChangeException e) {
			return new ResponseMessage(ResponseMessage.Type.danger,
					e.getMessage(), null);
		}
		
		// logger.debug("^^^^^^^^^^^^^^^^^^^^^ 3 ^^^^^^^^^^^^^^^^^^");

		// send email notification
		this.sendResetAccountPasswordNotification(onRecordAccount);

		return new ResponseMessage(ResponseMessage.Type.success,
				"accountPasswordReset", onRecordAccount.getId().toString());
	}
	
	@RequestMapping(value = "/sooa/accounts/passwordreset", method = RequestMethod.POST)
	public ResponseMessage requestAccountPasswordReset(
			@RequestParam(required = false) String username,
			HttpServletRequest request) throws Exception {

		Account acc = null;

		if (username != null) {
			acc = accountRepository.findByUsername(username);
			if (acc == null) {
				acc = accountRepository.findByEmail(username);
			}
		} else {
			return new ResponseMessage(ResponseMessage.Type.danger,
					"noUsernameOrEmail", null);
		}

		if (acc == null) {
			return new ResponseMessage(ResponseMessage.Type.danger,
					"wrongUsernameOrEmail", null);
		}

		Account user = acc;
		// start password reset process (for reset)
		// Create reset token. First get accountPasswordReset element from the
		// repository. If null create it.
		AccountPasswordReset arp = accountResetPasswordRepository.findByUsername(acc.getUsername());
		if (arp == null) {
			arp = new AccountPasswordReset();
			arp.setUsername(acc.getUsername());
		}

		arp.setCurrentToken(arp.getNewToken());
		arp.setTimestamp(new java.util.Date());
		arp.setNumberOfReset(arp.getNumberOfReset() + 1);

		accountResetPasswordRepository.save(arp);
		// Generate url and email
		String url = getUrl(request) + "/#/resetPassword?userId="
				+ user.getId() + "&username=" + acc.getUsername()
				+ "&token="
				+ UriUtils.encodeQueryParam(arp.getCurrentToken(), "UTF-8");

		// System.out.println("****************** "+url+" *******************");

		// generate and send email
		this.sendAccountPasswordResetRequestNotification(acc, url);

		return new ResponseMessage(ResponseMessage.Type.success,
				"resetRequestProcessed", acc.getId().toString(), true);
	}
	
	private void sendAccountPasswordResetRequestNotification(Account acc,
			String url) {
		SimpleMailMessage msg = new SimpleMailMessage(this.templateMessage);

		msg.setTo(acc.getEmail());
		msg.setSubject("FITS Password Reset Request Notification");
		msg.setText("Dear "
				+ acc.getUsername()
				+ " \n\n"
				+ "**** If you have not requested a password reset, please disregard this email **** \n\n\n"
				+ "You password reset request has been processed.\n"
				+ "Copy and paste the following url to your browser to initiate the password change:\n"
				+ url + " \n\n" + "Sincerely, " + "\n\n" + "The FITS Team"
				+ "\n\n" + "P.S: If you need help, contact us at '"
				+ ADMIN_EMAIL + "'");

		try {
			this.mailSender.send(msg);
		} catch (MailException ex) {
			ex.printStackTrace();
		}
	}
	
	@RequestMapping(value = "/accounts/{accountId}/userpasswordchange", method = RequestMethod.POST)
	public ResponseMessage adminChangeAccountPassword(
			@RequestBody PasswordChange acc,
			@PathVariable String accountId) {

		Account u = userService.getCurrentUser();
		if(u == null || !u.isEnabled() || !isAdmin(u)){
			return null;
		}
		
//		String newPassword = acc.getNewPassword();
		
		// check there is a username in the request
		if (acc.getUsername() == null || acc.getUsername().isEmpty()) {
			return new ResponseMessage(ResponseMessage.Type.danger,
					"Username Missing", null);
		}

		if (acc.getNewPassword() == null || acc.getNewPassword().length() < 4) {
			return new ResponseMessage(ResponseMessage.Type.danger,
					"Invalid Password", null);
		}

		Account onRecordAccount = accountRepository.findOne(accountId);
		if (!onRecordAccount.getUsername().equals(acc.getUsername())) {
			return new ResponseMessage(ResponseMessage.Type.danger,
					"Invalid Username", null);
		}

		try {
			userService.changePasswordForUser(onRecordAccount, acc);
		} catch (PasswordChangeException e) {
			return new ResponseMessage(ResponseMessage.Type.danger,
					e.getMessage(), null);
		}

		// send email notification
		this.sendChangeAccountPasswordNotification(onRecordAccount, acc.getNewPassword());

		return new ResponseMessage(ResponseMessage.Type.success,
				"accountPasswordReset", onRecordAccount.getId().toString(),
				true);
	}
	
	
	@RequestMapping(value = "/accounts/{accountId}/suspendaccount", method = RequestMethod.POST)
	public Account accountsDisable(@PathVariable String accountId) {
		Account u = userService.getCurrentUser();
		if(u != null && u.isEnabled() && isAdmin(u)){
			Account a = accountRepository.findOne(accountId);
			a.setPending(true);
			accountRepository.save(a);
			return a;
		}
		return null;
	}
	
	public boolean isAdmin(User u){
		for(GrantedAuthority ga : u.getAuthorities()){
			System.out.println("AUTH "+ga.getAuthority());
			if(ga.getAuthority().equals("ADMIN"))
				return true;
		}
		return false;
	}
	
	public boolean isAdmin(Account a){
		for(Privilege ga : a.getPrivileges()){
			if(ga.getRole().equals("ADMIN"))
				return true;
		}
		return false;
	}

	/**
	 * 
	 * */
	@RequestMapping(value = "/accounts/cuser", method = RequestMethod.GET)
	public CurrentUser getCUser() {
		Account u = userService.getCurrentUser();
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
	
	@RequestMapping(value = "/sooa/emails/{email:.*}", method = RequestMethod.GET)
	public ResponseMessage accountEmailExist(@PathVariable String email,
			@RequestParam(required = false) String email1) {

		if (accountRepository.findByEmail(email) != null) {
			return new ResponseMessage(ResponseMessage.Type.success,
					"emailFound", email);
		} else {
			return new ResponseMessage(ResponseMessage.Type.success,
					"emailNotFound", email);
		}
	}

	
	@RequestMapping(value = "/sooa/usernames/{username}", method = RequestMethod.GET)
	public ResponseMessage accountUsernameExist(@PathVariable String username) {

		if (accountRepository.findByUsername(username) != null) {
			return new ResponseMessage(ResponseMessage.Type.success,
					"usernameFound", username);
		} else {
			return new ResponseMessage(ResponseMessage.Type.success,
					"usernameNotFound", username);
		}
	}
	
	@RequestMapping(value = "/sooa/accounts/register", method = RequestMethod.POST)
	public ResponseMessage registerUserWhenNotAuthenticated(
			@RequestBody Account account) {

		// validate entry
		boolean validEntry = true;
		validEntry = accountRepository.findByUsername(account.getUsername()) != null ? validEntry = false : validEntry;
		validEntry = accountRepository.findByEmail(account.getEmail()) != null ? validEntry = false : validEntry;

		if (!validEntry) {
			return new ResponseMessage(ResponseMessage.Type.danger,
					"duplicateInformation", null);
		}
		
		
		// create new user with tester role
		try {
			account.setPending(true);
			userService.createTester(account);
		} catch (Exception e) {
			e.printStackTrace();
			return new ResponseMessage(ResponseMessage.Type.danger,
					"errorWithUser", null);
		}

		// generate and send email
		this.sendRegistrationNotificationToAdmin(account);
		this.sendApplicationConfirmationNotification(account);

		return new ResponseMessage(ResponseMessage.Type.success, "userAdded",
				account.getId().toString(), "true");
	}
	
	private void sendApplicationConfirmationNotification(Account acc) {
		SimpleMailMessage msg = new SimpleMailMessage(this.templateMessage);
		msg.setSubject("FITS Application Received");
		msg.setTo(acc.getEmail());
		msg.setText("Dear "
				+ acc.getUsername()
				+ " \n\n"
				+ "Thank you for submitting an application for use of the FITS. You will be notified via email (using the email address you provided in your application) as to whether your application is approved or not approved."
				+ "\n\n" + "Sincerely, " + "\n\n" + "The FITS Team"
				+ "\n\n" + "P.S: If you need help, contact us at '"
				+ ADMIN_EMAIL + "'");
		try {
			this.mailSender.send(msg);
		} catch (MailException ex) {
			ex.printStackTrace();
		}
	}
	
	private void sendRegistrationNotificationToAdmin(Account acc) {
		SimpleMailMessage msg = new SimpleMailMessage(this.templateMessage);
		msg.setSubject("New Registration Application on FITS");
		System.out.println(ADMIN_EMAIL);
		msg.setTo(ADMIN_EMAIL);
		msg.setText("Hello Admin,  \n A new application has been submitted and is waiting for approval. The user information are as follow: \n\n"
				+ "Name: "
				+ acc.getFullName()
				+ "\n"
				+ "Email: "
				+ acc.getEmail()
				+ "\n"
				+ "Username: "
				+ acc.getUsername()
				+ "\n"
				+ "Organization: "
				+ acc.getOrganization()
				+ " \n\n"
				+ "Sincerely, " + "\n\n" + "The FITS Team" + "\n\n");
		try {
			this.mailSender.send(msg);
		} catch (MailException ex) {
			ex.printStackTrace();
		}
	}
	
	private void sendAccountApproveNotification(Account acc) {
		SimpleMailMessage msg = new SimpleMailMessage(this.templateMessage);

		msg.setTo(acc.getEmail());
		msg.setSubject("FITS Account Approval Notification ");
		msg.setText("Dear "
				+ acc.getUsername()
				+ " \n\n"
				+ "**** If you have not requested a new account, please disregard this email **** \n\n\n"
				+ "Your account has been approved and you can proceed "
				+ "to login .\n" + "\n\n" + "Sincerely, " + "\n\n"
				+ "The FITS Team" + "\n\n"
				+ "P.S: If you need help, contact us at '" + ADMIN_EMAIL + "'");
		try {
			this.mailSender.send(msg);
		} catch (MailException ex) {
			ex.printStackTrace();
		}
	}

	
	private String getUrl(HttpServletRequest request) {
		String scheme = request.getScheme();
		String host = request.getHeader("Host");
		return scheme + "://" + host + "/fits";
	}
	
	
}
