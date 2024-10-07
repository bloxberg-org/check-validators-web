#!/bin/bash

function env_to_json {
	env \
		| grep "^$1" \
		| tr "\n" "," \
 		| sed -e "s/$1/\"/g; s/=/\":\"/g; s/,/\",/g; s/^/{/; s/,$/}/"
}

if [ "$#" == 1 ]; then
	env_to_json REACT_APP_ > $1
else
	env_to_json REACT_APP_ > ./build/env.json
fi

