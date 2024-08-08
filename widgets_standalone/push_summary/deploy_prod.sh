#!/bin/bash

DIRNAME="$(realpath $(dirname $0))"
SRCHOME="$DIRNAME/../../../"


echo "Deploying production"
Rscript -e 'rsconnect::deployApp("dist/",
    appPrimaryDoc = "index.html",
    server = "production",
    appName = "analytics_components",
    appTitle = "BT-IE/MKT Data Analytics - Components",
    forceUpdate = TRUE)'
