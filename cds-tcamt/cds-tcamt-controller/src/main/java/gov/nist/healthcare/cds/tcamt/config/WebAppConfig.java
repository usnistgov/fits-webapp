package gov.nist.healthcare.cds.tcamt.config;

import java.nio.charset.Charset;
import java.util.Arrays;
import java.util.List;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.MediaType;
import org.springframework.http.converter.HttpMessageConverter;
import org.springframework.http.converter.StringHttpMessageConverter;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.http.converter.xml.Jaxb2RootElementHttpMessageConverter;
import org.springframework.web.multipart.MultipartResolver;
import org.springframework.web.multipart.commons.CommonsMultipartResolver;
import org.springframework.web.servlet.config.annotation.DefaultServletHandlerConfigurer;
import org.springframework.web.servlet.config.annotation.EnableWebMvc;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurerAdapter;

import com.fasterxml.jackson.annotation.JsonInclude.Include;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.hibernate4.Hibernate4Module;

@Configuration
@EnableWebMvc
@ComponentScan({ "gov.nist.healthcare.cds" })
public class WebAppConfig extends WebMvcConfigurerAdapter {

	@Override
	public void configureDefaultServletHandling(
			DefaultServletHandlerConfigurer configurer) {
		configurer.enable();
	}

	public MappingJackson2HttpMessageConverter jacksonMessageConverter() {

		MappingJackson2HttpMessageConverter messageConverter = new MappingJackson2HttpMessageConverter();
		ObjectMapper mapper = new ObjectMapper();
		mapper.disable(SerializationFeature.INDENT_OUTPUT);
		mapper.disable(SerializationFeature.FAIL_ON_EMPTY_BEANS);
		mapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
		mapper.setSerializationInclusion(Include.NON_NULL);

		// Registering Hibernate4Module to support lazy objects
		mapper.registerModule(new Hibernate4Module());

		messageConverter.setObjectMapper(mapper);
		return messageConverter;

	}

	public Jaxb2RootElementHttpMessageConverter xmlConverter(){
		Jaxb2RootElementHttpMessageConverter xml = new Jaxb2RootElementHttpMessageConverter();
		
		return xml;
	}
	
	@Override
	public void configureMessageConverters(
			List<HttpMessageConverter<?>> converters) {
		// Here we add our custom-configured HttpMessageConverter
		converters.add(jacksonMessageConverter());
		converters.add(xmlConverter());
		StringHttpMessageConverter stringConverter = new StringHttpMessageConverter(
				Charset.forName("UTF-8"));
		stringConverter.setSupportedMediaTypes(Arrays.asList(
				//
				MediaType.TEXT_PLAIN, //
				MediaType.TEXT_HTML, //
				MediaType.APPLICATION_JSON, MediaType.TEXT_XML,
				MediaType.APPLICATION_FORM_URLENCODED));
		converters.add(stringConverter);
		super.configureMessageConverters(converters);
	}

	@Override
	public void addResourceHandlers(final ResourceHandlerRegistry registry) {
	    registry.addResourceHandler("/fonts/**/*").addResourceLocations("/fonts/");
		registry.addResourceHandler("/images/**/*").addResourceLocations("/images/");
		registry.addResourceHandler("/lang/**/*").addResourceLocations("/lang/");
		registry.addResourceHandler("/lib/**/*").addResourceLocations("/lib/");
		registry.addResourceHandler("/resources/**/*").addResourceLocations("/resources/");
		registry.addResourceHandler("/scripts/**/*").addResourceLocations("/scripts/");
		registry.addResourceHandler("/styles/**/*").addResourceLocations("/styles/");
		registry.addResourceHandler("/views/**/*").addResourceLocations("/views/");
	}
	
	@Bean
	public MultipartResolver multipartResolver() {
	    CommonsMultipartResolver multipartResolver = new CommonsMultipartResolver();
	    return multipartResolver;
	}
}
