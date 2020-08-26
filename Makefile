build: plugin.info

clean:
	rm -f plugin.info

plugin.info:
	echo '{}' | jq \
	    --arg plugin_title "$$PLUGIN_TITLE" \
	    --arg plugin_name "$$PLUGIN_NAME" \
	    --arg plugin_description "$$PLUGIN_DESCRIPTION" \
	    --arg plugin_author "$$PLUGIN_AUTHOR" \
	    --arg plugin_version "$$PLUGIN_VERSION" \
	    --arg plugin_core_version "$$PLUGIN_CORE_VERSION" \
	    --arg plugin_source "$$PLUGIN_SOURCE" \
	    '{title:("$$:/plugins/" + $$plugin_title),name:$$plugin_name,description:$$plugin_description,author:$$plugin_author,version:$$plugin_version,"core-version":$$plugin_core_version,source:$$plugin_source,"plugin-type":"plugin","list":"readme license history"}' > $@
