import Component, { tracked, hbs } from '@glimmerx/component'
import { service } from '@glimmerx/service'
import { on, action } from '@glimmer/modifier'
import { table, agg, op } from 'arquero'
import { helper } from '@glimmerx/helper'
import { hash } from '@glimmer/runtime'

import PushSummaryComponent from './push_summary'
import PushTableComponent from './push_table'
import PushTimeComponent from './push_time'
import PushDebugComponent from './push_debug'
import PushHistogramComponent from './push_histogram'
import PushHierarchyComponent from './push_hierarchy'
import PushPartitionComponent from './push_partition'
import PushHistoryComponent from './push_history'
import PushValuesComponent from './push_values'
import PushDeviationComponent from './push_deviation'
import PushScatterComponent from './push_scatter'
import PushPackComponent from './push_pack'
import PushSunburstComponent from './push_sunburst'

import NavbarComponent from './navbar'
import PresetComponent from './preset_component'

import InputComponent from './input_component'
import TextareaComponent from './text_area'

import {
    precompileTemplate,
    setComponentTemplate,
    getOwner,
    templateOnlyComponent,
} from '@glimmer/core'

const formatDisplay = helper(([name], { greeting }) => {
    return `${greeting} ${name}`
})

class AppComponent extends Component {
    @service data

    get filter() {
        return this.data.filter
    }

    get groupColumnsString() {
        return this.data.groupColumns.join(',')
    }

    @action
    updateFilter(input) {
        this.data.filter = input
    }

    @action
    updateGroupColumns(input) {
        this.data.groupColumns = input.split(',')
    }

    // Edit mode
    @action
    updateRollupSpec(input) {
        try {
            this.data.rollup = JSON.parse(input)
        } catch (error) {
            this.data.rollup = null
            console.log('parsing failed')
        }
    }

    @action
    updateDeriveSpec(input) {
        try {
            this.data.derive = JSON.parse(input)
        } catch (error) {
            this.data.derive = null
            console.log('parsing failed')
        }
    }

    get rollupSpec() {
        return JSON.stringify(this.data.rollup, 0, 2)
    }

    get deriveSpec() {
        return JSON.stringify(this.data.derive, 0, 2)
    }
}

let colorMapping = {
    COKE: 'red',
    PEPSI: 'blue',
}

setComponentTemplate(
    precompileTemplate(
        `
    	<NavbarComponent/>
<div class="drawer drawer-open">
  <input id="my-drawer" type="checkbox" class="drawer-toggle" />
    	<div class="drawer-content">
    	<div class="py-8 px-8 container mx-auto">
    		<div class="text-2xl font-bold">
    			Summary
    		</div>
			<PushSummaryComponent @title="Impressions" />
    		<div class="text-2xl font-bold mt-8">
    			Table
    		</div>
			<PushTableComponent/>
    		<div class="text-2xl font-bold mt-8">
    			Debug
    		</div>
			<PushDebugComponent/>
    		<div class="text-2xl font-bold mt-8">
    			Histogram
    		</div>
			 <PushHistogramComponent />
    		<div class="text-2xl font-bold mt-8">
    			Partition
    		</div>
			 <PushSunburstComponent @colorColumn="color"/>
    		<div class="text-2xl font-bold mt-8">
    			Partition
    		</div>
			 <PushPartitionComponent @colorColumn="color"/>
    		<div class="text-2xl font-bold mt-8">
    			Pack
    		</div>
			 <PushPackComponent @colorColumn="color"/>
    		<div class="text-2xl font-bold mt-8">
    			Hierarchy
    		</div>
			 <PushHierarchyComponent @colorColumn="color"/>
    		<div class="text-2xl font-bold mt-8">
    			History
    		</div>
			 <PushHistoryComponent @colorColumn="color" @mark="line"/>
   			<div class="text-2xl font-bold mt-8">
    			Values
    		</div>
			 <PushValuesComponent/>
   			<div class="text-2xl font-bold mt-8">
    			Standardabweichung
    		</div>
			 <PushDeviationComponent/>
   			<div class="text-2xl font-bold mt-8">
    			Scatter
    		</div>
			 <PushScatterComponent/>
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
                PushHierarchyComponent,
                PushPartitionComponent,
                PushHistoryComponent,
                PushValuesComponent,
                PushDeviationComponent,
                PushDebugComponent,
                PushScatterComponent,
                PushPackComponent,
                PushSunburstComponent,
                NavbarComponent,
                InputComponent,
                TextareaComponent,
                PresetComponent,
                colorMapping,
            },
        }
    ),
    AppComponent
)

export default AppComponent
