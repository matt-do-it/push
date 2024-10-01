#!/usr/bin/env Rscript

shiny::devmode(TRUE)

shiny::runApp(
  appDir = getwd(),
  port = 8090,
  launch.browser = getOption("shiny.launch.browser", interactive())
)