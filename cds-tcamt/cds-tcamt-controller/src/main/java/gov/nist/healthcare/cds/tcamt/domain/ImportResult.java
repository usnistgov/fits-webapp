package gov.nist.healthcare.cds.tcamt.domain;

import gov.nist.healthcare.cds.domain.TestCase;
import gov.nist.healthcare.cds.domain.TestCaseGroup;
import gov.nist.healthcare.cds.domain.TestPlan;
import gov.nist.healthcare.cds.domain.xml.ErrorModel;

import java.util.List;

public class ImportResult {
	private List<ErrorModel> errors;
	private boolean status;
	private List<String> messages;
	private TestCase imported;
	private List<TestCase> testCases;
	private List<TestCaseGroup> testCaseGroups;
	private TestPlan testPlan;
	
	public List<ErrorModel> getErrors() {
		return errors;
	}
	
	public TestPlan getTestPlan() {
		return testPlan;
	}

	public void setTestPlan(TestPlan testPlan) {
		this.testPlan = testPlan;
	}

	public void setErrors(List<ErrorModel> errors) {
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
	public TestCase getImported() {
		return imported;
	}
	public void setImported(TestCase imported) {
		this.imported = imported;
	}
	public List<TestCase> getTestCases() {
		return testCases;
	}
	public void setTestCases(List<TestCase> testCases) {
		this.testCases = testCases;
	}
	public List<TestCaseGroup> getTestCaseGroups() {
		return testCaseGroups;
	}
	public void setTestCaseGroups(List<TestCaseGroup> testCaseGroups) {
		this.testCaseGroups = testCaseGroups;
	}
	
	
	
	
}
