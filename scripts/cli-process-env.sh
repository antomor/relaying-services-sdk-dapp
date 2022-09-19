#!/bin/bash

# For a detailed description about how the env files are used by react-scripts
# https://create-react-app.dev/docs/adding-custom-environment-variables/
# and especially the parts where it explains all the files that are used:
# https://create-react-app.dev/docs/adding-custom-environment-variables/#what-other-env-files-can-be-used
# For semplicity, we create the '.env' file only, so be sure you don't have any other file locally with highest priority.

ENV_VALUE="$1" 

# Colors
Red="\033[0;31m"     # Red
Default="\033[1;37m" # White
Green="\033[0;32m"   # Green
Blue="\033[0;34m"    # Blue


if [ -z $ENV_VALUE ]; then
  ENV_VALUE="dev"
fi

FILE=".env.${ENV_VALUE}"
printf "${Default}Using '${FILE}'"


printf "${Blue}\nSearching for .env.${ENV_VALUE}\n\n"
printf "${Default}   File status: "

if [ -e $FILE ]; then
  echo -e "${Green}${FILE} found"
else
  echo -e "${Red}  Not found, please check '.env.sample' to create the file '${FILE}'"
  exit 1
fi

cp $FILE ./.env

echo ""
echo -e "${Green} ✅  Environment configured successfully!"
