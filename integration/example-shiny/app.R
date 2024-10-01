library(shiny)
library(push)
library(arrow)
library(htmlwidgets)
library(pushwidgets)

# Define UI for app that draws a histogram ----
ui <- fluidPage(

  # App title ----
  titlePanel("Hello Shiny!"),

  # Sidebar layout with input and output definitions ----
  sidebarLayout(

    # Sidebar panel for inputs ----
    sidebarPanel(

      # Input: Slider for the number of bins ----
      sliderInput(inputId = "bins",
                  label = "Number of bins:",
                  min = 1,
                  max = 50,
                  value = 30)

    ),

    # Main panel for displaying outputs ----
    mainPanel(

      # Output: Histogram ----
      plotOutput(outputId = "distPlot"),
	  textOutput(outputId = "sampleText"),
	  textOutput(outputId = "arrowText"),
	  textOutput(outputId = "sysInfo"),
	  pushSummaryOutput("push")
    )
  )
)

# Define server logic required to draw a histogram ----
server <- function(input, output) {

  # Histogram of the Old Faithful Geyser Data ----
  # with requested number of bins
  # This expression that generates a histogram is wrapped in a call
  # to renderPlot to indicate that:
  #
  # 1. It is "reactive" and therefore should be automatically
  #    re-executed when inputs (input$bins) change
  # 2. Its output type is a plot
  output$distPlot <- renderPlot({

    x    <- faithful$waiting
    bins <- seq(min(x), max(x), length.out = input$bins + 1)

    hist(x, breaks = bins, col = "#75AADB", border = "white",
         xlab = "Waiting time to next eruption (in mins)",
         main = "Histogram of waiting times")

    })

	output$sampleText <- renderText({
		PercentageFormat(input$bins)
	})
	
	
	output$arrowText <- renderText({
		capture.output(arrow_info())
	})
	
	output$sysInfo <- renderText({
		capture.output(Sys.info())
	})
	
	output$push <- renderPushSummary({
		df = data.frame(
			date = c("2024-07-01", "2024-07-01", "2024-04-01", "2024-04-01", "2024-01-01", "2024-01-01"),
			group = c("Group A", "Group B", "Group A", "Group B", "Group A", "Group B"),
			value = c(500, 700, 200, 300, 100, 700)
		);

		pushwidgets::push_summary(df, 
						   groupColumns = c('group', 'date'),
						   rollup = list(value = 'op.sum(d.value)'), width = 400, height = 200)
	})
}

# Create Shiny app ----
shinyApp(ui = ui, server = server)