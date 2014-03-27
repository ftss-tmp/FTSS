#!/bin/bash

clear

git --no-pager log --stat --color | aha --black > Collaboration\ Docs/Mockups\ \&\ UX/content/FTSS\ Git\ Log.html 
echo Git log created
echo

git log --pretty=tformat: --numstat | gawk '{ add += $1 ; subs += $2 ; loc += $1 + $2 } END { printf "added lines: %s removed lines : %s total lines: %s\n",add,subs,loc }' -
echo

cloc --exclude-dir=node_modules,_public --quiet Code
echo
 

cd Code/app

find . -type f -execdir cat {} \; | wc -l
echo App Lines


echo
find . -type f | wc -l
echo App Files


