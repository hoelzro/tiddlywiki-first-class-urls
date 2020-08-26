.PHONY: build clean

meta_files := $(patsubst %,%.meta,$(wildcard *.js *.tid))

build: plugin.info tiddlywiki.files license.tid license.tid.meta $(meta_files)

clean:
	rm -f plugin.info tiddlywiki.files license.tid *.meta

plugin.info: FORCE
	echo '{}' | jq \
	    --arg plugin_title "$$PLUGIN_TITLE" \
	    --arg plugin_name "$$PLUGIN_NAME" \
	    --arg plugin_description "$$PLUGIN_DESCRIPTION" \
	    --arg plugin_author "$$PLUGIN_AUTHOR" \
	    --arg plugin_version "$(shell git describe --always --tags)" \
	    --arg plugin_core_version "$$PLUGIN_CORE_VERSION" \
	    --arg plugin_source "$$PLUGIN_SOURCE" \
	    '{title:("$$:/plugins/" + $$plugin_title),name:$$plugin_name,description:$$plugin_description,author:$$plugin_author,version:$$plugin_version,"core-version":$$plugin_core_version,source:$$plugin_source,"plugin-type":"plugin","list":"readme license history"}' > $@

tiddlywiki.files: license.tid
	echo '{}' | jq '{tiddlers: ($$ARGS.positional | map({file: .}))}' --args *.js *.tid > $@

license.tid: COPYING
	cp $^ $@

FORCE:

%.js.meta: %.js
	echo "title: \$$:/plugins/$$PLUGIN_TITLE/$^" >> $@
	echo "type: application/javascript" >> $@
	echo "created: $$((TZ=utc git log --format=%ad --date=format:%Y%m%d%H%M%S000 --reverse -- $^ ; date --reference $^ --utc +'%Y%m%d%H%M%S000') | head -n 1)000" >> $@
	echo "modified: $$((TZ=utc git log --format=%ad --date=format:%Y%m%d%H%M%S000 -- $^ ; date --reference $^ --utc +'%Y%m%d%H%M%S000') | head -n 1)000" >> $@

license.tid.meta: license.tid
	echo "title: \$$:/plugins/$$PLUGIN_TITLE/license" >> $@
	echo "type: text/plain" >> $@
	echo "created: $$((TZ=utc git log --format=%ad --date=format:%Y%m%d%H%M%S000 --reverse -- COPYING ; date --reference COPYING --utc +'%Y%m%d%H%M%S000') | head -n 1)000" >> $@
	echo "modified: $$((TZ=utc git log --format=%ad --date=format:%Y%m%d%H%M%S000 -- COPYING ; date --reference COPYING --utc +'%Y%m%d%H%M%S000') | head -n 1)000" >> $@

%.tid.meta: %.tid
	echo "title: \$$:/plugins/$$PLUGIN_TITLE/$(shell basename "$^" .tid)" >> $@
	echo "type: text/vnd.tiddlywiki" >> $@
	echo "created: $$((TZ=utc git log --format=%ad --date=format:%Y%m%d%H%M%S000 --reverse -- $^ ; date --reference $^ --utc +'%Y%m%d%H%M%S000') | head -n 1)000" >> $@
	echo "modified: $$((TZ=utc git log --format=%ad --date=format:%Y%m%d%H%M%S000 -- $^ ; date --reference $^ --utc +'%Y%m%d%H%M%S000') | head -n 1)000" >> $@
