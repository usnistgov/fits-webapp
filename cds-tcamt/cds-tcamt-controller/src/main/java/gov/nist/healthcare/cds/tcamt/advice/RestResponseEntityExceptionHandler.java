package gov.nist.healthcare.cds.tcamt.advice;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

import gov.nist.healthcare.cds.domain.wrapper.ModelError;
import gov.nist.healthcare.cds.domain.wrapper.ModelValidationFailed;

@ControllerAdvice
public class RestResponseEntityExceptionHandler extends ResponseEntityExceptionHandler {

    @Override
    protected ResponseEntity<Object> handleMethodArgumentNotValid(MethodArgumentNotValidException e, HttpHeaders headers, HttpStatus status, WebRequest request) {
    	ModelValidationFailed mvf = new ModelValidationFailed();
		for(FieldError oe : e.getBindingResult().getFieldErrors()){
			mvf.add(new ModelError(oe.getField(), oe.getDefaultMessage()));
		}
		return new ResponseEntity<Object>(mvf,HttpStatus.BAD_REQUEST);
    }
	
}
