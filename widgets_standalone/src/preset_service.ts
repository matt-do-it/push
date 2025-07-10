import { tracked } from '@glimmerx/component'
import { table, op, loadArrow, from } from 'arquero'

export default class PresetService {
    @tracked presets

    constructor() {
        this.presets = {
            default: {
                values: [
                    {
                        date: '2025-07-01',
                        group: 'Group A',
                        group2: 'Subgroup A.I',
                        color: 1, 
                        value: 2000,
                        value2: 400,
                        value3: 400,
                    },
                    {
                        date: '2025-07-01',
                        group: 'Group B',
                        group2: 'Subgroup B.I',
                        color: 6, 
                        value: 700,
                        value2: 500,
                        value3: 500,
                    },
                    {
                        date: '2025-07-01',
                        group: 'Group A',
                        group2: 'Subgroup A.II',
                        color: 1, 
                        value: 900,
                        value2: 900,
                        value3: 400,
                    },
                    {
                        date: '2025-07-01',
                        group: 'Group B',
                        group2: 'Subgroup B.II',
                        color: 6, 
                        value: 800,
                        value2: 500,
                        value3: 500,
                    },
                    {
                        date: '2025-04-01',
                        group: 'Group A',
                        group2: 'Subgroup A.I',
                        color: 1, 
                        value: 200,
                        value2: 700,
                        value3: 20,
                    },
                    {
                        date: '2025-04-01',
                        group: 'Group B',
                        group2: 'Subgroup B.I',
                        color: 6, 
                        value: 300,
                        value2: 800,
                        value3: 90,
                    },
                    {
                        date: '2025-01-01',
                        group: 'Group A',
                        group2: 'Subgroup A.I',
                        color: 1, 
                        value: 100,
                        value2: 200,
                        value3: 250,
                    },
                    {
                        date: '2025-01-01',
                        group: 'Group B',
                        group2: 'Subgroup B.I',
                        color: 6, 
                        value: 700,
                        value2: 400,
                        value3: 130,
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
