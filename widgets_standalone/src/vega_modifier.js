import { setModifierManager } from '@glimmer/core'
import embed from 'vega-embed'

export default setModifierManager(
    (owner) => ({
        createModifier(factory, args) {
            return new factory()
        },

        installModifier(instance, element, args) {
            instance.element = element

            instance.modify(args)
        },

        updateModifier(instance, args) {
            instance.modify(args)
        },

        destroyModifier(instance, args) {
            console.log('destroy')
        },

        capabilities() {
            return { disableAutoTracking: true }
        },
    }),

    class VegaModifier {
        modify(args) {
            let component = args.positional[0]

            const result = embed(this.element, component)
        }
    }
)
