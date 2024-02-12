package gov.nist.healthcare.cds.tcamt.controller;

import gov.nist.healthcare.cds.auth.domain.*;
import gov.nist.healthcare.cds.auth.repo.AccountPasswordResetRepository;
import gov.nist.healthcare.cds.auth.repo.AccountRepository;
import gov.nist.healthcare.cds.auth.service.AccountService;

import java.io.IOException;
import java.security.Principal;
import java.util.ArrayList;
import java.util.List;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import gov.nist.healthcare.cds.domain.UserMetadata;
import gov.nist.healthcare.cds.repositories.UserMetadataRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.MailSender;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.security.access.prepost.PreAuthorize;
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
		return new ResponseMessage(ResponseMessage.Type.success,
				"loginSuccess", "succes");
	}
	
	@RequestMapping(value = "/shortaccounts", method = RequestMethod.GET)
	@ResponseBody
	@PreAuthorize("hasAuthority('ADMIN')")
	public List<ShortAccount> accounts() {
		Account u = userService.getCurrentUser();
		if(u != null && u.isEnabled() && isAdmin(u)){
			List<ShortAccount> users = new ArrayList<>();
			List<Account> acc = accountRepository.findAll();
			for(Account a : acc){
				if(!isAdmin(a)){
					users.add(new ShortAccount(a));
				}
			}
			return users;
		}
		return null;
	}
	
	@RequestMapping(value = "/accounts/{accountId}/approveaccount", method = RequestMethod.POST)
	@ResponseBody
	@PreAuthorize("hasAuthority('ADMIN')")
	public ShortAccount accountsEnable(@PathVariable String accountId) {
		Account u = userService.getCurrentUser();
		if(u != null && u.isEnabled() && isAdmin(u)){
			Account a = accountRepository.findOne(accountId);
			a.setPending(false);
			accountRepository.save(a);
			this.sendAccountApproveNotification(a);
			return new ShortAccount(a);
		}
		return null;
	}
	
	@RequestMapping(value = "/accounts/{accountId}", method = RequestMethod.GET)
	@ResponseBody
	public ShortAccount getAccount(@PathVariable String accountId,Principal p) {
		Account a = accountRepository.findByUsername(p.getName());
		if(a.getId().equals(accountId)){
			return new ShortAccount(a);
		}
		return null;
	}
	
	@RequestMapping(value = "/accounts/{accountId}", method = RequestMethod.POST)
	@ResponseBody
	public ResponseMessage updateAccount(@RequestBody Account acc, @PathVariable String accountId) throws Exception {
		if(acc.getId().equals(accountId)){
			Account current = userService.getCurrentUser();
			Account referenced = accountRepository.findOne(accountId);
			if(current.getUsername().equals(referenced.getUsername()) && current.getId().equals(referenced.getId())) {
				List<String> issues = userService.checkAccountInfo(acc);
				if(issues == null || issues.isEmpty()) {
					referenced.setFullName(acc.getFullName());
					referenced.setOrganization(acc.getOrganization());
					if(!referenced.getEmail().equalsIgnoreCase(acc.getEmail())) {
						Account byEmail = accountRepository.findByEmailIgnoreCase(acc.getEmail());
						if(byEmail == null) {
							referenced.setEmail(acc.getEmail());
						} else {
							return new ResponseMessage(ResponseMessage.Type.danger,
									"Email already used.", null);
						}
					}
					accountRepository.save(referenced);
					return new ResponseMessage(ResponseMessage.Type.success,
							"Account Updated Successfully", null);
				} else {
					return new ResponseMessage(ResponseMessage.Type.danger,
							String.join(", ", issues), null);
				}
			}
		}
		return new ResponseMessage(ResponseMessage.Type.danger,
				"Invalid request", null);
	}

	@RequestMapping(value = "/accounts/list/metadata", method = RequestMethod.GET)
	@ResponseBody
	@PreAuthorize("hasAuthority('ADMIN')")
	public List<UserMetadata> getUsersMetadata() {
		Account u = userService.getCurrentUser();
		if(u != null && u.isEnabled() && isAdmin(u)){
			return this.userMetadataRepository.findAll();
		}
		return null;
	}

	
	@RequestMapping(value = "/accounts/{accountId}/passwordchange", method = RequestMethod.POST)
	public ResponseMessage changeAccountPassword(
			@RequestBody PasswordChange pChange, HttpServletResponse response) throws IOException {
		Account current = userService.getCurrentUser();

		if(!current.getUsername().equals(pChange.getUsername()) || !current.getId().equals(pChange.getId())){
			response.sendError(403);
			return new ResponseMessage(ResponseMessage.Type.danger,
					"Invalid Request", null);
		}

		Account userAccount = accountRepository.findOne(current.getId());
		try {
			userService.changePassword(userAccount, pChange);
		} catch (PasswordChangeException e) {
			return new ResponseMessage(ResponseMessage.Type.danger, e.getMessage(), null);
		}

		// send email notification
		this.sendChangeAccountPasswordNotification(userAccount);
		return new ResponseMessage(ResponseMessage.Type.success, "Password Changed Successfully", "", true);
	}
	
	@RequestMapping(value = "/sooa/accounts/{userId}/passwordreset", method = RequestMethod.POST, params = "token")
	public ResponseMessage resetAccountPassword(@RequestBody PasswordResetRequest passwordResetRequest,
			@RequestParam(required = true) String token) {

		// check there is a username in the request
		if (passwordResetRequest.getUsername() == null || passwordResetRequest.getUsername().isEmpty()) {
			return new ResponseMessage(ResponseMessage.Type.danger, "Username Missing", null);
		}

		AccountPasswordReset apr = accountResetPasswordRepository.findByUsername(passwordResetRequest.getUsername());

		// check there is a reset request on record
		if (apr == null) {
			return new ResponseMessage(ResponseMessage.Type.danger,
					"No reset request found", null);
		}

		Account onRecordAccount = accountRepository.findOne(passwordResetRequest.getUserId());
		// Check that id and username match
		if(!onRecordAccount.getUsername().equals(passwordResetRequest.getUsername())) {
			return new ResponseMessage(ResponseMessage.Type.danger,
					"Invalid request", null);
		}

		try {
			userService.changePasswordWithoutOldCheck(apr, token, onRecordAccount, passwordResetRequest.getPassword());
			accountResetPasswordRepository.delete(apr.getId());
		} catch (PasswordChangeException e) {
			return new ResponseMessage(ResponseMessage.Type.danger,
					e.getMessage(), null);
		}

		this.sendResetAccountPasswordNotification(onRecordAccount);
		return new ResponseMessage(ResponseMessage.Type.success,
				"accountPasswordReset", onRecordAccount.getId());
	}
	
	@RequestMapping(value = "/sooa/accounts/passwordreset", method = RequestMethod.POST)
	public ResponseMessage requestAccountPasswordReset(
			@RequestParam(required = false) String username,
			HttpServletRequest request) throws Exception {

		Account acc = null;

		if (username != null) {
			acc = accountRepository.findByUsername(username);
			if (acc == null) {
				acc = accountRepository.findByEmailIgnoreCase(username);
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
		AccountPasswordReset arp = accountResetPasswordRepository.findByUsername(acc.getUsername());
		if (arp == null) {
			arp = new AccountPasswordReset();
			arp.setUsername(acc.getUsername());
		}

		arp.setCurrentToken(AccountPasswordReset.getNewToken());
		arp.setTimestamp(new java.util.Date());
		arp.setNumberOfReset(arp.getNumberOfReset() + 1);

		accountResetPasswordRepository.save(arp);
		// Generate url and email
		String url = getUrl(request) + "/#/resetPassword?userId="
				+ user.getId() + "&username=" + acc.getUsername()
				+ "&token="
				+ UriUtils.encodeQueryParam(arp.getCurrentToken(), "UTF-8");

		// generate and send email
		this.sendAccountPasswordResetRequestNotification(acc, url);

		return new ResponseMessage(ResponseMessage.Type.success,
				"resetRequestProcessed", acc.getId(), true);
	}
	
	@RequestMapping(value = "/accounts/{accountId}/userpasswordchange", method = RequestMethod.POST)
	@PreAuthorize("hasAuthority('ADMIN')")
	public ResponseMessage adminChangeAccountPassword(
			@RequestBody PasswordChange pChange) {

		Account u = userService.getCurrentUser();
		if(u == null || !u.isEnabled() || !isAdmin(u)){
			return null;
		}
		
		// check there is a username in the request
		if (pChange.getUsername() == null || pChange.getUsername().isEmpty()) {
			return new ResponseMessage(ResponseMessage.Type.danger,
					"Username Missing", null);
		}

		Account onRecordAccount = accountRepository.findOne(pChange.getId());
		if (!onRecordAccount.getUsername().equals(pChange.getUsername())) {
			return new ResponseMessage(ResponseMessage.Type.danger,
					"Invalid Username", null);
		}

		try {
			userService.changePasswordForUser(onRecordAccount, pChange);
		} catch (PasswordChangeException e) {
			return new ResponseMessage(ResponseMessage.Type.danger,
					e.getMessage(), null);
		}

		// send email notification
		this.sendChangeAccountPasswordNotification(onRecordAccount, pChange.getNewPassword());

		return new ResponseMessage(ResponseMessage.Type.success,
				"accountPasswordReset", onRecordAccount.getId(),
				true);
	}
	
	
	@RequestMapping(value = "/accounts/{accountId}/suspendaccount", method = RequestMethod.POST)
	@PreAuthorize("hasAuthority('ADMIN')")
	public ShortAccount accountsDisable(@PathVariable String accountId) {
		Account u = userService.getCurrentUser();
		if(u != null && u.isEnabled() && isAdmin(u)){
			Account a = accountRepository.findOne(accountId);
			a.setPending(true);
			accountRepository.save(a);
			return new ShortAccount(a);
		}
		return null;
	}
	
	public boolean isAdmin(User u){
		for(GrantedAuthority ga : u.getAuthorities()){
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

		if (accountRepository.findByEmailIgnoreCase(email) != null) {
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

		// Check Account Info
		List<String> accountInfoIssues = userService.checkAccountInfo(account);
		if(accountInfoIssues != null && !accountInfoIssues.isEmpty()) {
			return new ResponseMessage(ResponseMessage.Type.danger,
					String.join(", ", accountInfoIssues), null);
		}

		// Check Account Uniqueness
		List<String> accountUniquenessIssues = userService.checkAccountUniqueness(account);
		if(accountUniquenessIssues != null && !accountUniquenessIssues.isEmpty()) {
			return new ResponseMessage(ResponseMessage.Type.danger,
					String.join(", ", accountUniquenessIssues), null);
		}

		// Check Password Policy
		List<String> accountPasswordIssues = userService.checkPasswordPolicy(account.getPassword());
		if(accountPasswordIssues != null && !accountPasswordIssues.isEmpty()) {
			return new ResponseMessage(ResponseMessage.Type.danger,
					String.join(", ", accountPasswordIssues), null);
		}

		Account userAccount = new Account();
		userAccount.setUsername(account.getUsername());
		userAccount.setEmail(account.getEmail());
		userAccount.setPassword(account.getPassword());
		userAccount.setPending(true);
		userAccount.setFullName(account.getFullName());
		userAccount.setOrganization(account.getOrganization());
		userAccount.setSignedConfidentialityAgreement(account.getSignedConfidentialityAgreement());

		// create new user with tester role
		try {
			userService.createTester(userAccount);
		} catch (Exception e) {
			return new ResponseMessage(ResponseMessage.Type.danger,
					"errorWithUser", null);
		}

		// generate and send email
		this.sendRegistrationNotificationToAdmin(userAccount);
		this.sendApplicationConfirmationNotification(userAccount);

		return new ResponseMessage(ResponseMessage.Type.success, "userAdded", "", "true");
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
		List<Account> admins = this.userService.getAdminUsers();
		for(Account admin: admins) {
			if(admin.getEmail() != null && !admin.getEmail().isEmpty()) {
				String email = admin.getEmail().trim();
				SimpleMailMessage msg = new SimpleMailMessage(this.templateMessage);
				msg.setSubject("New Registration Application on FITS");
				msg.setTo(email);
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

	
	private String getUrl(HttpServletRequest request) {
		String scheme = request.getScheme();
		String host = request.getHeader("Host");
		return scheme + "://" + host + "/fits";
	}
	
	
}
