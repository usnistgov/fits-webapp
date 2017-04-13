package gov.nist.healthcare.cds.auth.tcamt.config;

import gov.nist.healthcare.cds.auth.domain.ResponseMessage;

import java.io.IOException;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.springframework.security.authentication.AccountExpiredException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.CredentialsExpiredException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.LockedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import com.fasterxml.jackson.databind.ObjectMapper;

@Component
public class RestAuthenticationEntryPoint implements AuthenticationEntryPoint {

	private final ObjectMapper mapper = new ObjectMapper();

	@Override
	public final void commence(HttpServletRequest request,
			HttpServletResponse response, AuthenticationException authException)
			throws IOException {
		try {
			response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
			
			if (authException instanceof BadCredentialsException) {
				mapper.writeValue(response.getWriter(),
						new ResponseMessage(ResponseMessage.Type.danger,
								authException.getMessage()));
			} else if (authException instanceof DisabledException) {
				mapper.writeValue(response.getWriter(),
						new ResponseMessage(ResponseMessage.Type.danger,
								authException.getMessage()));
			} else if (authException instanceof LockedException) {
				mapper.writeValue(response.getWriter(),
						new ResponseMessage(ResponseMessage.Type.danger,
								authException.getMessage()));
			} else if (authException instanceof CredentialsExpiredException) {
				mapper.writeValue(response.getWriter(), new ResponseMessage(
						ResponseMessage.Type.danger,
						"accountCredentialsExpired"));
			} else if (authException instanceof AccountExpiredException) {
				mapper.writeValue(response.getWriter(),
						new ResponseMessage(ResponseMessage.Type.danger,
								authException.getMessage()));
			} else {
				mapper.writeValue(response.getWriter(), new ResponseMessage(
						ResponseMessage.Type.danger, "accessDenied"));
			}

		} catch (IOException e) {
			e.printStackTrace();
		}
	}

}
