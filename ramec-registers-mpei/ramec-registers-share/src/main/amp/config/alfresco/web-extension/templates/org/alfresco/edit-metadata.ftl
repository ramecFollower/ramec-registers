<#include "include/alfresco-template.ftl" />
<@templateHeader />

<@templateBody>
   <@markup id="alf-hd">
   <div id="alf-hd">
      <@region scope="global" id="share-header" chromeless="true"/>
   </div>
   </@>
   <@markup id="bd">
   <div id="bd">
      <div class="share-form">
		<@region id="edit-metadata-mgr" scope="template" />
		<#if page.url.args.withPreview??>
			<div class="yui-gc">
				<div class="yui-u first">
					<@region id="web-preview" scope="template"/>
				</div>
				<div class="yui-u">
					<@region id="edit-metadata" scope="template" />
				</div>
			</div>
		<#else>
			<@region id="edit-metadata" scope="template" />
		</#if>

      </div>
   </div>
   </@>
</@>

<@templateFooter>
   <@markup id="alf-ft">
   <div id="alf-ft">
      <@region id="footer" scope="global" />
   </div>
   </@>
</@>
