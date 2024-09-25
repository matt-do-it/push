import { tracked } from '@glimmerx/component'
import { table, op, loadArrow, from } from 'arquero'

const UNIQUE_COLS_PCTG = 0.1
const UNIQUE_COLS_PCTG_NMB = 0.01

export default class PresetService {
    @tracked presets

    constructor() {}

    async load(dataService, preset) {
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
