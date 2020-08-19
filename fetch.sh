./node_modules/.bin/tiddlywiki ++/home/rob/projects/tw-first-class-urls test-wiki --listen port=9091 >&2 &
tw_pid=$!
sleep 1

encoded_url=$(perl -MURL::Encode=url_encode -le 'print url_encode($ARGV[0])' "$1")

curl -v -H 'X-Requested-With: TiddlyWiki' -X POST http://localhost:9091/plugins/hoelzro/first-class-urls/fetch?url=$encoded_url

kill $tw_pid
wait $tw_pid
