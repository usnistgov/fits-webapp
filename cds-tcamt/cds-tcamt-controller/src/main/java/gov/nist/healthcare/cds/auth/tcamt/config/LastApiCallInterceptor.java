package gov.nist.healthcare.cds.auth.tcamt.config;

import gov.nist.healthcare.cds.auth.domain.Account;
import gov.nist.healthcare.cds.auth.service.AccountService;
import gov.nist.healthcare.cds.service.UserMetadataService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.User;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.handler.HandlerInterceptorAdapter;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

@Component
public class LastApiCallInterceptor extends HandlerInterceptorAdapter {

    @Autowired
    private AccountService accountService;
    @Autowired
    private UserMetadataService userMetadataService;

    @Override
    public boolean preHandle(
            HttpServletRequest request,
            HttpServletResponse response,
            Object handler) throws Exception {

        Account u = this.accountService.getCurrentUser();
        if(u != null) {
            this.userMetadataService.updateLastApiCall(u.getUsername());
        }
        return true;
    }
}
