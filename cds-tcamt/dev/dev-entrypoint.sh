#!/bin/bash
set -e

if [ -f /usr/local/tomcat/.env.dev ]; then
  set -a
  source /usr/local/tomcat/.env.dev
  set +a
fi

exec catalina.sh run