import { setModifierManager } from '@glimmer/core'

export default setModifierManager(
    (owner) => ({
        createModifier(factory, args) {
            return new factory()
        },

        installModifier(instance, element, args) {
            instance.element = element

            instance.install(args)
        },

        updateModifier(instance, args) {
            instance.modify(args)
        },

        destroyModifier(instance, args) {
            instance.destroy(args)
        },

        capabilities() {
            return { disableAutoTracking: true }
        },
    }),

    class CanvasModifier {
        install(args) {
            this.resizeObserver = new ResizeObserver(
                function (entries) {
                    console.log('triggerd')
                    for (const entry of entries) {
                        console.log('triggerd elm')
                        if (entry.contentRect) {
                            if (
                                entry.contentRect.width > 0 &&
                                entry.contentRect.height > 0
                            ) {
                                const canvas = this.element

                                canvas.style.width =
                                    entry.contentRect.width + 'px'
                                canvas.style.height =
                                    entry.contentRect.height + 'px'

                                let scale = 2

                                canvas.width = entry.contentRect.width * scale
                                canvas.height = entry.contentRect.height * scale

                                let component = args.positional[0]
                                component.width =
                                    entry.contentRect.width * scale
                                component.height =
                                    entry.contentRect.height * scale
                                component.drawCanvas(canvas)
                            }
                        }
                    }
                }.bind(this)
            )

            this.resizeObserver.observe(this.element.parentElement)

            const canvas = this.element
            let component = args.positional[0]

            component.drawCanvas(canvas)
        }

        modify(args) {
            const canvas = this.element.parentElement
            let component = args.positional[0]
            component.drawCanvas(canvas)
        }

        destroy(args) {
            this.resizeObserver.unobserve(this.element.parentElement)
        }
    }
)
