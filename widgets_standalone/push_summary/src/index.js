import { LIFETIME } from "@starbeam/timeline";
import { DEBUG_RENDERER } from "@starbeam/universal";
import { Stopwatch } from "./stopwatch";
import { renderComponent } from '@glimmerx/core';
import SummaryComponent from './component';
import DataService from './data_service';

import './style.css';

const button = document.querySelector(
  "#finalize"
);
const output = document.querySelector(
  "#output"
);

// Instantiate the Stopwatch with an owner. We will
// later finalize the owner to clean up the resource.
// In this case, that will clear the interval and
// stop the watch from ticking.
const owner = {};
const stopwatch = Stopwatch.create(owner);

// Render the stopwatch into the DOM. The `render`
// callback will be called whenever the stopwatch's
// value changes.
//
// In this case, that will happen whenever the `time`
// cell in the resource is set.
DEBUG_RENDERER.render({
  render: () => stopwatch.current,
  debug: (now) => {
    output.innerHTML = `The current time is: ${now}`;
  },
});

button.addEventListener("click", () => {
  LIFETIME.finalize(owner);
});


const containerElement = document.getElementById('app');

renderComponent(SummaryComponent, {
  element: document.getElementById('app'),
  args: {
    title: 'Impressions',
    column: "impressions",
    date: "2024-04-01",
    display: "isoweek"
  },
  services: {
  	data: new DataService()
  }
});

