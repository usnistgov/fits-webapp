package gov.nist.healthcare.cds.tcamt.controller;

import javax.servlet.http.HttpServletRequest;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/session")
public class SessionController {
	@RequestMapping(method = RequestMethod.GET, value = "/keepAlive")
	public boolean keepAlive(HttpServletRequest request) {
		return true;
	}
}