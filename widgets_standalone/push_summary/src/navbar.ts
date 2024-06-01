import Component, { tracked, hbs } from "@glimmerx/component";
import { service } from "@glimmerx/service";
import { on, action } from "@glimmer/modifier";
import { table, agg, op } from "arquero";
import { helper } from "@glimmerx/helper";

import valueFormatHelper from "./value_format_helper";
import displayFormatHelper from "./display_format_helper";
import canvasModifier from "./canvas_modifier";
import trendColorHelper from "./trend_color_helper";
import trendFormatHelper from "./trend_format_helper";
import dateFormatHelper from "./date_format_helper";

import {
  precompileTemplate,
  setComponentTemplate,
  getOwner,
  templateOnlyComponent,
} from "@glimmer/core";

import * as d3 from "d3";

class NavbarComponent extends Component {}

setComponentTemplate(
  precompileTemplate(
    `
      <div class="navbar bg-base-100">
  <div class="flex-none">
    <button class="btn btn-square btn-ghost">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="inline-block w-5 h-5 stroke-current"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
    </button>
  </div>
  <div class="flex-1">
    <a class="btn btn-ghost text-xl">Push Components</a>
  </div>
  <div class="flex-none">
    <button class="btn btn-square btn-ghost">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="inline-block w-5 h-5 stroke-current"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z"></path></svg>
    </button>
  </div>
</div>
    `,
    {
      strictMode: true,
      scope: {
        on,
        canvasModifier,
        valueFormatHelper,
        displayFormatHelper,
        dateFormatHelper,
        trendFormatHelper,
        trendColorHelper,
        dateFormatHelper,
      },
    },
  ),
  NavbarComponent,
);

export default NavbarComponent;
