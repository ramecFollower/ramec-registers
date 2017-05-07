package ru.ramec.action.executer;

import java.util.List;

import org.alfresco.model.ContentModel;
import org.alfresco.repo.action.ParameterDefinitionImpl;
import org.alfresco.repo.action.executer.ActionExecuterAbstractBase;
import org.alfresco.repo.content.transform.ContentTransformer;
import org.alfresco.repo.content.transform.magick.ImageTransformationOptions;
import org.alfresco.service.cmr.action.Action;
import org.alfresco.service.cmr.action.ParameterDefinition;
import org.alfresco.service.cmr.dictionary.DataTypeDefinition;
import org.alfresco.service.cmr.repository.ContentReader;
import org.alfresco.service.cmr.repository.ContentService;
import org.alfresco.service.cmr.repository.ContentWriter;
import org.alfresco.service.cmr.repository.NodeRef;
import org.alfresco.service.cmr.repository.NodeService;


public class RotateDocumentActionExecuter extends ActionExecuterAbstractBase {
	public static final String PARAM_ANGLE = "angle";
	
	private NodeService nodeService;
	private ContentService contentService;
	

	public void setContentService(ContentService contentService) {
		this.contentService = contentService;
	}

	public void setNodeService(NodeService nodeService) {
        this.nodeService = nodeService;
    }
    
	@Override
	protected void addParameterDefinitions(List<ParameterDefinition> paramList) {
		paramList.add(new ParameterDefinitionImpl(PARAM_ANGLE, DataTypeDefinition.TEXT, true, getParamDisplayLabel(PARAM_ANGLE)));
		
	}
	
	@Override
	protected void executeImpl(Action ruleAction, NodeRef actionedUponNodeRef) {
		String angle = (String)ruleAction.getParameterValue(PARAM_ANGLE);
		ContentReader contentReader = contentService.getReader(actionedUponNodeRef, ContentModel.PROP_CONTENT);
		ContentWriter contentWriter = contentService.getWriter(actionedUponNodeRef, ContentModel.PROP_CONTENT, true);
		
//		ContentData contentData = (ContentData) nodeService.getProperty(actionedUponNodeRef, ContentModel.PROP_CONTENT);
//		Long contentSize = contentData.getSize();
//	    String originalMimeType = contentData.getMimetype();
		
		ContentTransformer transformer = contentService.getImageTransformer();
		
		ImageTransformationOptions ito = new ImageTransformationOptions();
		ito.setCommandOptions("-rotate " + angle);
		try {
			transformer.transform(contentReader, contentWriter, ito);
		} catch (Exception e) {
			throw e;
		}
	}

}
