#!/bin/bash

set -e

for (( i=0; i<20; i++ )) ; do
  curl -s -o /dev/null http://$TIDDLYWIKI_HOST:9091 && break
  sleep 1
done

if [[ $i -eq 20 ]] ; then
    echo "failed to connect to test server after 20 tries" >&2
    exit 1
fi

CYPRESS_TIDDLYWIKI_HOST=$TIDDLYWIKI_HOST cypress run --browser=chrome --headless
