(function(){var $html=Alfresco.util.encodeHTML,$msg=Alfresco.util.message;Alfresco.component.SearchBase=function SearchBase_constructor(name,htmlId){Alfresco.component.SearchBase.superclass.constructor.call(this,name,htmlId);return this};YAHOO.extend(Alfresco.component.SearchBase,Alfresco.component.Base,{getBrowseUrlForRecord:function(record){var name=record.getData("name"),type=record.getData("type"),site=record.getData("site"),path=record.getData("path"),nodeRef=record.getData("nodeRef"),container=record.getData("container"),modifiedOn=record.getData("modifiedOn");return this.getBrowseUrl(name,type,site,path,nodeRef,container,modifiedOn)},getBrowseUrl:function(name,type,site,path,nodeRef,container,modifiedOn){var url=null;switch(type){case"document":url="document-details?nodeRef="+nodeRef;break;case"folder":if(path!==null){if(site){url="documentlibrary?path="+encodeURIComponent(this.buildSpaceNamePath(path.split("/"),name))}else{url="repository?path="+encodeURIComponent(this.buildSpaceNamePath(path.split("/").slice(2),name))}}break;case"blogpost":url="blog-postview?postId="+name;break;case"forumpost":url="discussions-topicview?topicId="+name;break;case"calendarevent":url=container+"?date="+Alfresco.util.formatDate(modifiedOn,"yyyy-mm-dd");break;case"wikipage":url="wiki-page?title="+name;break;case"link":url="links-view?linkId="+name;break;case"datalist":case"datalistitem":url="view-metadata?nodeRef="+nodeRef;break}if(url!==null){if(site){url=Alfresco.constants.URL_PAGECONTEXT+"site/"+site.shortName+"/"+url}else{url=Alfresco.constants.URL_PAGECONTEXT+url}}return(url!==null?url:"#")},getBrowseUrlForFolderPath:function(path,site){var url=null;if(site){url=Alfresco.constants.URL_PAGECONTEXT+"site/"+site.shortName+"/documentlibrary?path="+encodeURIComponent("/"+path)}else{url=Alfresco.constants.URL_PAGECONTEXT+"repository?path="+encodeURIComponent("/"+path.split("/").slice(2).join("/"))}return url},buildSpaceNamePath:function(pathParts,name){return(pathParts.length!==0?("/"+pathParts.join("/")):"")+"/"+name},buildTextForType:function(type){var result="";switch(type){case"document":case"folder":case"blogpost":case"forumpost":case"calendarevent":case"wikipage":case"datalist":case"datalistitem":case"link":result+=$msg("label."+type);break;default:result+=$msg("label.unknown");break}return result},buildPath:function(type,path,site){var result="";if(type==="document"||type==="folder"){if(site){if(!path){path=""}result+='<div class="details">'+$msg("message.infolderpath")+': <a href="'+this.getBrowseUrlForFolderPath(path,site)+'">'+$html("/"+path)+"</a></div>"}else{if(path){result+='<div class="details">'+$msg("message.infolderpath")+': <a href="'+this.getBrowseUrlForFolderPath(path)+'">'+$html(path)+"</a></div>"}}}return result},buildThumbnailUrl:function(type,nodeRef,modifiedOn){var imageUrl="";switch(type){case"document":imageUrl=Alfresco.constants.PROXY_URI_RELATIVE+"api/node/"+nodeRef.replace(":/","");imageUrl+="/content/thumbnails/doclib?c=queue&ph=true&lastModified="+Alfresco.util.encodeHTML(modifiedOn);break;case"folder":imageUrl=Alfresco.constants.URL_RESCONTEXT+"components/search/images/folder.png";break;case"blogpost":imageUrl=Alfresco.constants.URL_RESCONTEXT+"components/search/images/blog-post.png";break;case"forumpost":imageUrl=Alfresco.constants.URL_RESCONTEXT+"components/search/images/topic-post.png";break;case"calendarevent":imageUrl=Alfresco.constants.URL_RESCONTEXT+"components/search/images/calendar-event.png";break;case"wikipage":imageUrl=Alfresco.constants.URL_RESCONTEXT+"components/search/images/wiki-page.png";break;case"link":imageUrl=Alfresco.constants.URL_RESCONTEXT+"components/search/images/link.png";break;case"datalist":imageUrl=Alfresco.constants.URL_RESCONTEXT+"components/search/images/datalist.png";break;case"datalistitem":imageUrl=Alfresco.constants.URL_RESCONTEXT+"components/search/images/datalistitem.png";break;default:imageUrl=Alfresco.constants.URL_RESCONTEXT+"components/search/images/generic-result.png";break}return imageUrl},buildThumbnailHtml:function(record,height,width){var config={displayName:record.getData("displayName"),type:record.getData("type"),name:record.getData("name"),nodeRef:record.getData("nodeRef"),site:record.getData("site"),path:record.getData("path"),container:record.getData("container"),modifiedOn:record.getData("modifiedOn"),mimetype:record.getData("mimetype"),width:width,height:height};var html=this._buildThumbnailHtml(config);if(width&&height){return html}if(config.type==="document"){var viewUrl=Alfresco.constants.PROXY_URI_RELATIVE+"api/node/content/"+config.nodeRef.replace(":/","")+"/"+encodeURIComponent(config.name),isImage=(config.mimetype&&config.mimetype.match("^image/")),actions='<div class="action-overlay">';if(!isImage){actions+='<a href="'+viewUrl+'" target="_blank"><img title="'+$html($msg("label.viewinbrowser"))+'" src="'+Alfresco.constants.URL_RESCONTEXT+'components/search/images/view-in-browser-16.png" width="16" height="16"/></a>'}else{actions+='<a href="'+this.getBrowseUrlForRecord(record)+'"><img title="'+$html($msg("label.viewdetails"))+'" src="'+Alfresco.constants.URL_RESCONTEXT+'components/documentlibrary/actions/document-view-details-16.png" width="16" height="16"/></a>'}actions+='<a href="'+viewUrl+'?a=true" style="padding-left:4px" target="_blank"><img title="'+$html($msg("label.download"))+'" src="'+Alfresco.constants.URL_RESCONTEXT+'components/search/images/download-16.png" width="16" height="16"/></a>';actions+="</div>";html=actions+html}return html},_buildThumbnailHtml:function(config){var url,isImage=(config.mimetype&&config.mimetype.match("^image/"));if(isImage){url=Alfresco.constants.PROXY_URI_RELATIVE+"api/node/content/"+config.nodeRef.replace(":/","")+"/"+encodeURIComponent(config.name)}else{url=this.getBrowseUrl(config.name,config.type,config.site,config.path,config.nodeRef,config.container,config.modifiedOn)}var imageUrl=this.buildThumbnailUrl(config.type,config.nodeRef,config.modifiedOn),htmlName=$html(config.displayName);var html='<span><a href="'+url+'"'+(isImage?' onclick="showLightbox(this);return false;"':"")+'><img src="'+imageUrl+'" alt="'+htmlName+'" title="'+htmlName+'"'+(config.height&&config.width?' width="'+config.width+'" height="'+config.height+'"':"")+"/></a></span>";return html}})})();