package gov.nist.healthcare.cds.tcamt.config;

import gov.nist.healthcare.cds.auth.config.WebSecurityConfig;

import javax.servlet.Filter;

import org.springframework.web.servlet.support.AbstractAnnotationConfigDispatcherServletInitializer;

public class WebAppInitializer extends
		AbstractAnnotationConfigDispatcherServletInitializer {

	@Override
	protected Class<?>[] getRootConfigClasses() {
		return new Class[]{WebSecurityConfig.class,WebAppConfig.class};
	}

	@Override
	protected Class<?>[] getServletConfigClasses() {
		return new Class[]{};
//				{WebAppConfig.class};
	}

	@Override
	protected String[] getServletMappings() {
		return new String[]{
	            "/api/*"
	        };
	}
	

	@Override
	protected Filter[] getServletFilters() {
		return new Filter[]{};
	}

}
