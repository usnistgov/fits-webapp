package gov.nist.healthcare.cds.tcamt.domain;

import gov.nist.healthcare.cds.domain.xml.XMLError;

import java.util.List;

public class ImportResult {
	private List<XMLError> errors;
	private boolean status;
	private List<String> messages;
	
	public List<XMLError> getErrors() {
		return errors;
	}
	public void setErrors(List<XMLError> errors) {
		this.errors = errors;
	}
	public boolean isStatus() {
		return status;
	}
	public void setStatus(boolean status) {
		this.status = status;
	}
	public List<String> getMessages() {
		return messages;
	}
	public void setMessages(List<String> messages) {
		this.messages = messages;
	}
	
	
	
}
