import { tracked } from '@glimmerx/component'
import { table, op, loadArrow, from } from 'arquero'

const UNIQUE_COLS_PCTG = 0.1
const UNIQUE_COLS_PCTG_NMB = 0.01

export default class DataService {
    @tracked dataTable

    @tracked filter
    @tracked filterParams

    @tracked groupColumns

    @tracked rollup
    @tracked derive

    @tracked windowFilter
    @tracked windowFilterParams

    constructor() {
        this.dataTable = table()

        this.groupColumns = []
    }

  async fromArrow(arrowTable) {
  	console.log(arrowTable);
  	var d = fromArrow(arrowTable);
  	alert("hey");
  	console.log(d);
  	this.dataTable = d; 
  }

    async loadArrow(url) {
        this.dataTable = await loadArrow(url)
    }

    async loadFrom(objects) {
        this.dataTable = from(objects)
    }

    get dataTable() {
        return this.dataTable
    }

    get filteredTable() {
        let filteredTable
        if (this.filter) {
            filteredTable = this.dataTable.filter(this.filter)
        } else {
            filteredTable = this.dataTable
        }
        return filteredTable
    }

    get groupNames() {
        try {
            if (this.groupColumns.length > 0) {
                const uniqueColumnValues: string[][] = this.groupColumns.map(
                    (col) =>
                        (
                            this.filteredTable
                                .rollup({ col: op.array_agg_distinct(col) })
                                .object() as any
                        ).col
                )
                console.log(uniqueColumnValues)
                // If just one column, don't do cartesian product and make it a 2D array.
                if (uniqueColumnValues.length === 1) {
                    return uniqueColumnValues[0].map((group) => [group])
                }
                return this.cartesian(...uniqueColumnValues)
            } else {
                return []
            }
        } catch (error) {
            return []
        }
    }

    get groupedTables() {
        try {
            if (
                this.groupColumns !== undefined &&
                this.filteredTable !== undefined &&
                this.groupColumns.length > 0
            ) {
                let groupedTable = this.filteredTable.groupby(...groupColumns)
                let partitions = this.groupedTable.partitions()

                let groupedTables: ColumnTable[] = partitions.map((partition) =>
                    filteredTable.reify(partition)
                )
                return groupedTables
            } else {
                return []
            }
        } catch (error) {
            console.log('group columns invalid: ' + error)
            return []
        }
    }

    cartesian(...a: string[][]): string[] {
        let c = a.reduce((a, b) =>
            a.flatMap((d) =>
                b.map((e: any) =>
                    [d, e].reduce((acc, val) => acc.concat(val), [])
                )
            )
        )
        return c
    }

    getColumnType(columnName: string): string | undefined {
        const col = this.dataTable.column(columnName)
        if (col === undefined) {
            return undefined
        }
        const firstValue = col.get(0)
        if (firstValue.constructor.name === 'SignedBigNum') {
            return 'number'
        }
        if (typeof firstValue === 'object') {
            const objectClass: string = firstValue.constructor.name
            if (objectClass.includes('Array')) {
                return 'array'
            }
        }
        return typeof firstValue
    }

    getCategoryColumns(): string[] {
        const colNames = this.summarizedTable.columnNames()
        const binnnableStringColumns: string[] = []
        for (const colName of colNames) {
            const columnType = this.getColumnType(colName)
            if (columnType === 'string') {
                if (this.isStringColumnBinnable(colName)) {
                    binnnableStringColumns.push(colName)
                }
            }
        }
        return binnnableStringColumns
    }

    getNumberColumns(): string[] {
        const colNames = this.summarizedTable.columnNames()
        const numberColumns: string[] = []
        for (const colName of colNames) {
            const columnType = this.getColumnType(colName)

            if (columnType === 'number') {
                if (this.isNumberColumnBinnable(colName)) {
                    numberColumns.push(colName)
                }
            }
        }
        return numberColumns
    }

    isStringColumnBinnable(columnName: string): boolean {
        /** If more than UNIQUE_COLS_PCTG percent of the column are unique strings, likely an ID, don't bin. */
        const unique = this.dataTable.groupby(columnName).count().numRows()
        return true
        if (
            unique < UNIQUE_COLS_PCTG * this.dataTable.numRows() &&
            unique < 20
        ) {
            return true
        }
        return false
    }

    isNumberColumnBinnable(columnName: string): boolean {
        /** If more than UNIQUE_COLS_PCTG percent of the column are unique strings, likely an ID, don't bin. */
        const unique = this.dataTable.groupby(columnName).count().numRows()

        if (unique > UNIQUE_COLS_PCTG_NMB * this.dataTable.numRows()) {
            return true
        }
        return false
    }

    get summarizedTable() {
        try {
            if (
                this.groupColumns == undefined ||
                this.groupColumns.length == 0
            ) {
                return this.filteredTable
            }
            return this.filteredTable
                .groupby(this.groupColumns)
                .rollup(this.rollup)
                .derive(this.derive)
        } catch (error) {
            console.log(
                'group columns invalid: ' +
                    error +
                    this.groupColumns +
                    this.rollup +
                    this.derive
            )
            return null
        }
    }
}
