package gov.nist.healthcare.cds.tcamt.controller;

import java.util.ArrayList;
import java.util.List;

import gov.nist.healthcare.cds.domain.EnumContainer;
import gov.nist.healthcare.cds.enumeration.EvaluationReason;
import gov.nist.healthcare.cds.enumeration.EvaluationStatus;
import gov.nist.healthcare.cds.enumeration.Gender;
import gov.nist.healthcare.cds.enumeration.RelativeTo;
import gov.nist.healthcare.cds.enumeration.SerieStatus;
import javassist.NotFoundException;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class EnumController {

	@RequestMapping(value = "/enum/evaluationStatus", method = RequestMethod.GET)
	@ResponseBody
	public List<EnumContainer> enumes() throws NotFoundException{
		List<EnumContainer> ls = new ArrayList<EnumContainer>();
		for(EvaluationStatus es : EvaluationStatus.values()){
			ls.add(new EnumContainer(es.name(),es.getDetails()));
		}
		return ls;
	}
	
	@RequestMapping(value = "/enum/evaluationReason", method = RequestMethod.GET)
	@ResponseBody
	public List<EnumContainer> enumer() throws NotFoundException{
		List<EnumContainer> ls = new ArrayList<EnumContainer>();
		for(EvaluationReason es : EvaluationReason.values()){
			ls.add(new EnumContainer(es.name(),es.getDetails()));
		}
		return ls;
	}
	
	@RequestMapping(value = "/enum/gender", method = RequestMethod.GET)
	@ResponseBody
	public List<EnumContainer> enumg() throws NotFoundException{
		List<EnumContainer> ls = new ArrayList<EnumContainer>();
		for(Gender es : Gender.values()){
			ls.add(new EnumContainer(es.name(),es.getDetails()));
		}
		return ls;
	}
	
	@RequestMapping(value = "/enum/serieStatus", method = RequestMethod.GET)
	@ResponseBody
	public List<EnumContainer> enumss() throws NotFoundException{
		List<EnumContainer> ls = new ArrayList<EnumContainer>();
		for(SerieStatus es : SerieStatus.values()){
			ls.add(new EnumContainer(es.name(),es.getDetails()));
		}
		return ls;
	}
	
	@RequestMapping(value = "/enum/relativeTo", method = RequestMethod.GET)
	@ResponseBody
	public List<EnumContainer> enumrt() throws NotFoundException{
		List<EnumContainer> ls = new ArrayList<EnumContainer>();
		for(RelativeTo es : RelativeTo.values()){
			ls.add(new EnumContainer(es.name(),es.getDetails()));
		}
		return ls;
	}
}
