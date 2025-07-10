import Component, { tracked, hbs } from '@glimmerx/component'
import { service } from '@glimmerx/service'
import { on, action } from '@glimmer/modifier'
import { table, agg, op } from 'arquero'
import { helper } from '@glimmerx/helper'
import { cached } from '@glimmer/tracking'

import vegaModifier from './vega_modifier'
import dateFormatHelper from './date_format_helper'
import rootUrlHelper from './root_url_helper'

import InputComponent from './input_component'
import TextareaComponent from './text_area'

import Slide from './slide'
import PushSummary from './push_summary'
import PushHistory from './push_history'
import PushHistogram from './push_histogram'
import PushBenchmark from './push_benchmark'
import PushFunnel from './push_funnel'
import PushTable from './push_table'
import SlideTable from './slide_table'

import {
    precompileTemplate,
    setComponentTemplate,
    getOwner,
    templateOnlyComponent,
} from '@glimmer/core'

class ReportPage extends Component {
    @service data

	@tracked pageNr = 0;
	
    get currentYear() {
        return 2025
    }

    get display() {
        return this.args.display
    }

	@action increasePageNr() {
		this.pageNr = this.pageNr + 1; 
	}

    get currentCampaignTitle() {
        if (!this.args.entryCampaign) {
            return 'Totals'
        } else {
            let campaign = this.args.allCampaigns.filter(
                function (c) {
                    return c.id == this.args.entryCampaign
                }.bind(this)
            )
            if (campaign.length > 0) {
                return campaign[0].title
            }
        }
    }


    get channelTableColumns() {
        return [
            {
                name: `Kanal`,
                valuePath: 'entryChannel.title',
                isSimpleValue: true,
            },
            {
                name: `Reichweite`,
                valuePath: `impressions`,
                isTrendValue: true,
                format: 'number',
            },
            {
                name: `Aktive Nutzer`,
                valuePath: `activeUsers`,
                isTrendValue: true,
                format: 'number',
            },
            {
                name: `Website: Engagement`,
                valuePath: `engagementRate`,
                isTrendValue: true,
                format: 'rate',
            },
            {
                name: `Leads`,
                valuePath: `allConversions`,
                isTrendValue: true,
                format: 'number',
            },
            {
                name: `Kosten pro Lead`,
                valuePath: `costPerContact`,
                isTrendValue: true,
                format: 'currency',
            },
        ]
    }

    get pageTableColumns() {
        return [
            {
                name: `Seitenpfad 1`,
                valuePath: 'content.pageTitle1',
                isSimpleValue: true,
            },
            {
                name: `Seitenpfad 2`,
                valuePath: `content.pageTitle2`,
                isSimpleValue: true,
            },
            {
                name: `Seitenpfad 3`,
                valuePath: `content.pageTitle3`,
                isSimpleValue: true,
            },
            {
                name: `Screen Pageviews`,
                valuePath: `screenPageViews`,
                isTrendValue: true,
                format: 'number',
            },
            {
                name: `Engagement`,
                valuePath: `engagement`,
                isTrendValue: true,
                format: 'rate',
            },
            {
                name: `Seitenverweildauer`,
                valuePath: `userEngagementDuration`,
                isTrendValue: true,
                format: 'duration',
            },
            {
                name: `Aktionen`,
                valuePath: `action`,
                isTrendValue: true,
                format: 'rate',
            },
        ]
    }
}

setComponentTemplate(
    precompileTemplate(
        `
	<Slide 
		@title1="BT-IE Marketing Analytics"
		@title2="{{this.currentCampaignTitle}}: Übersicht nach Kanälen"
		@pageNr=1>
		
		<div class="grid grid-cols-4 gap-4 mb-4">
			<PushSummary
				@service="dataTotal"
				@title="Reichweite"
        		@valueColumn="impressions"
        		@benchmarkTitle="Kampagnen"
        		@display={{@display}}
        		@format="number"/>
			<PushSummary
				@service="dataTotal"
				@title="Aktive Nutzer"
        		@valueColumn="activeUsers"
        		@display={{@display}}
        		@benchmarkTitle="Kampagnen"
        		@format="number"/>
			<PushSummary
				@service="dataTotal"
				@title="Website: Engagementrate"
        		@valueColumn="engagementRate"
        		@display={{@display}}
        		@benchmarkTitle="Kampagnen"
        		@format="rate"/>
			<PushSummary
				@service="dataTotal"
				@title="Leads"
        		@valueColumn="allConversions"
        		@benchmarkTitle="Kampagnen"
        		@display={{@display}}
        		@format="number"/>
		</div>
	    <div class="grid grid-cols-2 gap-4">
	    	 <PushFunnel
        		@title="Acquisition-Funnel"
        		@colorColumn="entryChannel.color"
        		@valueColumns="impressions,activeUsers,allConversions"
        		@phaseTitles="Impressions,Active Users,Leads"
        		@display={{@display}}/>

			<PushTable 
        		@title="Top 6-Kanäle"
        		@columns={{this.channelTableColumns}}
        		@display={{@display}}
				@limit=6/>
	    </div>
	</Slide>
	<Slide 
		@title1="BT-IE Marketing Analytics"
		@title2="{{this.currentCampaignTitle}}: Historie nach Kanälen"
		@pageNr=2>
		<div class="grid grid-cols-3 gap-4 grow shrink">
      		<PushHistory
        		@title="Einblendungen"
        		@valueColumn="impressions"
        		@display={{@display}}/>
	      	<PushHistory
        		@title="Aktive Nutzer"
        		@valueColumn="activeUsers"
        		@display={{@display}}/>
      		<PushHistory
        		@title="Leads"
        		@valueColumn="allConversions"
        		@display={{@display}}/>
      		<PushHistory
        		@title="Website: Engagementrate"
        		@valueColumn="engagementRate"
        		@display={{@display}}
				@format="rate"
		    	@mark="line"/>
      		<PushHistory
        		@title="Lead-Rate"
        		@valueColumn="allConversionRate"
        		@display={{@display}}
       			 @format="rate"
            	@mark="line"/>
      		<PushHistory
        		@title="Kosten pro Lead"
        		@valueColumn="costPerContact"
        		@display={{@display}}
				@format="currency"
		    	@mark="line"/>
	    </div>
	</Slide>

	<SlideTable 
		@pageOffset={{2}}
		@title1="BT-IE Marketing Analytics"
    	@title2="{{this.currentCampaignTitle}}: Alle Kanäle"
        @title="{{this.currentCampaignTitle}}: Marketing channels"
        @columns={{this.channelTableColumns}}
        @display={{@display}}
        @pageCount={{3}}
        @sortColumn="impressions"/>	
        
	<SlideTable 
		@service="dataPage"
		@pageOffset={{5}}
		@title1="BT-IE Marketing Analytics"
    	@title2="{{this.currentCampaignTitle}}: Details zu Inhaltsseiten"
        @title="{{this.currentCampaignTitle}}: Page Details"
        @columns={{this.pageTableColumns}}
        @display={{@display}}
        @maxPages={{7}}
        @sortColumn="screenPageViews"/> `,
        {
            strictMode: true,
            scope: {
                on,
                formatDisplay,
                dateFormatHelper,
                vegaModifier,
                InputComponent,
                Slide,
                SlideTable,
                PushSummary,
                PushHistory,
                PushFunnel,
                PushTable,
                PushBenchmark,
                PushHistogram,
                rootUrlHelper,
            },
        }
    ),
    ReportPage
)

export default ReportPage
