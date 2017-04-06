package gov.nist.healthcare.cds.tcamt.controller;

import java.io.IOException;
import java.io.InputStream;
import java.net.URL;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Date;
import java.util.List;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.util.FileCopyUtils;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;

import gov.nist.healthcare.cds.domain.wrapper.Document;
import gov.nist.healthcare.cds.domain.wrapper.Documents;
import gov.nist.healthcare.cds.domain.wrapper.Resources;

@RestController
@RequestMapping("/documentation")
public class DocumentationController {

	@Autowired
	private Documents documents;
	
	@Autowired
	private Resources resources;
	
	@RequestMapping(value = "/downloadDocument", method = RequestMethod.POST)
	public void downloadDocumentByPath(
		@RequestParam("path") String path,
		HttpServletRequest request, HttpServletResponse response) throws Exception {
		try {
			if (path != null) {
				String fileName = null;
				path = !path.startsWith("/") ? "/" + path : path;
				InputStream content = DocumentationController.class.getResourceAsStream(path);
				if (content != null) {
					fileName = path.substring(path.lastIndexOf("/") + 1);
					response.setContentType(getContentType(path));
					fileName = fileName.replaceAll(" ", "-");
					response.setHeader("Content-disposition", "attachment;filename=" + fileName);
					FileCopyUtils.copy(content, response.getOutputStream());
				}
			}
		} catch (IOException e) {
			throw new Exception("Cannot download the document");
		}
	}
	
	@RequestMapping(value = "/docs", method = RequestMethod.GET)
	@ResponseBody
	public List<Document> documents(HttpServletRequest request, HttpServletResponse response) throws Exception {
		return documents.getDocs();
	}
	
	@RequestMapping(value = "/res", method = RequestMethod.GET)
	@ResponseBody
	public List<Document> resources(HttpServletRequest request, HttpServletResponse response) throws Exception {
		return resources.getResources();
	}

	private InputStream getContent(String path) {
		InputStream content = null;
		if (!path.startsWith("/")) {
			content = DocumentationController.class.getResourceAsStream("/" + path);
		} else {
			content = DocumentationController.class.getResourceAsStream(path);
		}
		return content;
	}

	private String getContentType(String fileName) {
		String contentType = "application/octet-stream";
		String fileExtension = getExtension(fileName);
		if (fileExtension != null) {
			fileExtension = fileExtension.toLowerCase();
		}
		if (fileExtension.equals("pdf")) {
			contentType = "application/pdf";
		} else if (fileExtension.equals("doc")) {
			contentType = "application/msword";
		} else if (fileExtension.equals("docx")) {
			contentType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
		} else if (fileExtension.equals("xls")) {
			contentType = "application/vnd.ms-excel";
		} else if (fileExtension.equals("xlsx")) {
			contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
		} else if (fileExtension.equals("jpeg")) {
			contentType = "image/jpeg";
		} else if (fileExtension.equals("xml")) {
			contentType = "text/xml";
		} else if (fileExtension.equals("war") || fileExtension.equals("zip")) {
			contentType = "application/x-zip";
		} else if (fileExtension.equals("pptx")) {
			contentType = "application/vnd.openxmlformats-officedocument.presentationml.presentation";
		} else if (fileExtension.equals("ppt")) {
			contentType = "application/vnd.ms-powerpoint";
		}
		return contentType;
	}

	private String getExtension(String fileName) {
		String ext = "";
		int i = fileName.lastIndexOf('.');
		if (i != -1) {
			ext = fileName.substring(i + 1);
		}
		return ext;
	}
}
