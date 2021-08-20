./node_modules/.bin/tiddlywiki ++/home/rob/projects/tw-first-class-urls test-wiki --listen port=9091 >&2 &
tw_pid=$!
sleep 1

params=$(node -e 'console.log("%s", new URLSearchParams({url: require("process").argv[1]}))' "$1")

curl -v -H 'X-Requested-With: TiddlyWiki' http://localhost:9091/plugins/hoelzro/first-class-urls/fetch?$params

kill $tw_pid
wait $tw_pid
