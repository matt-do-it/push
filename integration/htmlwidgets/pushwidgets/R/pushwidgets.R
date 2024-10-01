#' @import htmlwidgets
#' @import htmltools
#' @import tidyverse
#' @import arrow
#' @export

push_summary <- function(df, 
						 componentArgs = list(),
						 groupColumns = c(), 
						 rollup = list(),
                  		 width = NULL, height = NULL) {


	arrowTable <- arrow_table(df)

	sink <- BufferOutputStream$create()

	writer <- RecordBatchStreamWriter$create(sink, arrowTable$schema)
	writer$write_table(arrowTable)
	writer$close()

	buffer <- sink$finish()
	data <- buffer$data()

  	# pass the data and settings using 'x'
  	x <- list(
    	data = data,
    	componentArgs = componentArgs,
    	groupColumns = groupColumns,
    	rollup = rollup
  	)

  	# create the widget
  	e <- htmlwidgets::createWidget("pushwidgets", x, width = width, height = height)
  	return(e)
}

#' @export
pushSummaryOutput <- function(outputId, width = "100%", height = "400px") {
  	e <- shinyWidgetOutput(outputId, "pushwidgets", width, height)
  	return(e)
}

#' @export
renderPushSummary <- function(expr, env = parent.frame(), quoted = FALSE) {
	warning("This is what a warning looks like")
  if (!quoted) { expr <- substitute(expr) } # force quoted
  eval(expr)
  shinyRenderWidget(expr, pushSummaryOutput, env, quoted = TRUE)
}
# 
# pushwidgets_html <- function(id, style, class, ...) {
# 	htmltools::tags$div(
# 		htmltools::HTML("<script src='http://localhost:8080/standalone-bundled.js'></script>"),
# 		htmltools::tags$div(id = id, style = style, class = class)
# 	)
# }
