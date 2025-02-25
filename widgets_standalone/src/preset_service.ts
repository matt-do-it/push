import { tracked } from '@glimmerx/component'
import { table, op, loadArrow, from } from 'arquero'

export default class PresetService {
    @tracked presets

    constructor() {
        this.presets = {
            default: {
                values: [
                    {
                        date: '2024-07-01',
                        group: 'Group A',
                        value: 500,
                    },
                    {
                        date: '2024-07-01',
                        group: 'Group B',
                        value: 700,
                    },
                    {
                        date: '2024-04-01',
                        group: 'Group A',
                        value: 200,
                    },
                    {
                        date: '2024-04-01',
                        group: 'Group B',
                        value: 300,
                    },
                    {
                        date: '2024-01-01',
                        group: 'Group A',
                        value: 100,
                    },
                    {
                        date: '2024-01-01',
                        group: 'Group B',
                        value: 700,
                    },
                ],
            },
        }
    }

    async load(dataService, presetName) {
        let preset = this.presets[presetName]

        if (preset.values) {
            dataService.loadFrom(preset.values)
        }
        if (preset.url) {
            dataService.loadArrow(preset.url)
        }
        dataService.filter = preset.filter
        dataService.groupColumns = preset.groupColumns
        dataService.rollup = preset.rollup
        dataService.derive = preset.derive
    }
}
