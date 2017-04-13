package gov.nist.healthcare.cds.tcamt.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.Configuration;

import io.swagger.annotations.Api;
import springfox.documentation.builders.PathSelectors;
import springfox.documentation.builders.RequestHandlerSelectors;
import springfox.documentation.service.ApiInfo;
import springfox.documentation.spi.DocumentationType;
import springfox.documentation.spring.web.plugins.Docket;
import springfox.documentation.swagger2.annotations.EnableSwagger2;

@Configuration
@EnableSwagger2
@ComponentScan({ "gov.nist.healthcare.cds.tcamt" })
public class SwaggerConfig {
	@Bean
	public Docket api() {
		return new Docket(DocumentationType.SWAGGER_2).select()
				.apis(RequestHandlerSelectors.withClassAnnotation(Api.class)).paths(PathSelectors.any()).build()
				.pathMapping("/api/");
	}

	private ApiInfo apiInfo() {

		ApiInfo apiInfo = new ApiInfo("My Apps API Title", "My Apps API Description", "My Apps API Version",
				"My Apps API terms of service", "My Apps API Contact Email", "My Apps API Licence Type",
				"My Apps API License URL");
		return apiInfo;
	}

}