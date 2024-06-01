import Component, { tracked, hbs } from "@glimmerx/component";
import { service } from "@glimmerx/service";
import { on, action } from "@glimmer/modifier";
import { table, agg, op } from "arquero";
import { helper } from "@glimmerx/helper";
import { hash } from "@glimmer/runtime";

import PushSummaryComponent from "./push_summary";
import PushTableComponent from "./push_table";
import PushTimeComponent from "./push_time";
import PushDebugComponent from "./push_debug";
import PushHistogramComponent from "./push_histogram";

import NavbarComponent from "./navbar";
import PresetComponent from "./preset_component";

import InputComponent from "./input_component";
import TextareaComponent from "./text_area";

import {
  precompileTemplate,
  setComponentTemplate,
  getOwner,
  templateOnlyComponent,
} from "@glimmer/core";

const formatDisplay = helper(([name], { greeting }) => {
  return `${greeting} ${name}`;
});

class AppComponent extends Component {
  @service data;

  get filter() {
    return this.data.filter;
  }

  get groupColumnsString() {
    return this.data.groupColumns.join(",");
  }

  @action
  updateFilter(input) {
    this.data.filter = input;
  }

  @action
  updateGroupColumns(input) {
    this.data.groupColumns = input.split(",");
  }

  // Edit mode
  @action
  updateRollupSpec(input) {
    try {
      this.data.rollup = JSON.parse(input);
    } catch (error) {
      this.data.rollup = null;
      console.log("parsing failed");
    }
  }

  @action
  updateDeriveSpec(input) {
    try {
      this.data.derive = JSON.parse(input);
    } catch (error) {
      this.data.derive = null;
      console.log("parsing failed");
    }
  }

  get rollupSpec() {
    return JSON.stringify(this.data.rollup, 0, 2);
  }

  get deriveSpec() {
    return JSON.stringify(this.data.derive, 0, 2);
  }
}

setComponentTemplate(
  precompileTemplate(
    `
    	<NavbarComponent/>
<div class="drawer drawer-open">
  <input id="my-drawer" type="checkbox" class="drawer-toggle" />
    	<div class="drawer-content">
    	<div class="py-8 px-8 container mx-auto">
    		<div class="section-title">
    			Summary
    		</div>
			<PushSummaryComponent @title="Impressions" />
    		<div class="section-title">
    			Details
    		</div>
			 <PushTableComponent/>
    		<div class="section-title">
    			Debug
    		</div>
			<PushDebugComponent/>
    		<div class="section-title">
    			Histogram
    		</div>
			 <PushHistogramComponent/>
			 </div>
		</div>
  <div class="drawer-side bg-base-100">
    <label for="my-drawer-2" aria-label="close sidebar" class="drawer-overlay"></label> 
    <div class="py-2 px-4 bg-base-100">
    	<PresetComponent/>
        <InputComponent @title="Filter" @value={{this.filter}} @onInput={{this.updateFilter}}/>
        <InputComponent @title="Group columns" @value={{this.groupColumnsString}} @onInput={{this.updateGroupColumns}}/>
      	<TextareaComponent @title="Rollup" @value={{this.rollupSpec}} @onInput={{this.updateRollupSpec}} />
	    <TextareaComponent @title="Derive" @value={{this.deriveSpec}} @onInput={{this.updateDeriveSpec}}/>
	  </div>
  </div>
</div>
    `,
    {
      strictMode: true,
      scope: {
        on,
        formatDisplay,
        hash,
        PushSummaryComponent,
        PushTableComponent,
        PushTimeComponent,
        PushHistogramComponent,
        PushDebugComponent,
        NavbarComponent,
        InputComponent,
        TextareaComponent,
        PresetComponent,
      },
    },
  ),
  AppComponent,
);

export default AppComponent;
