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
                    for (const entry of entries) {
                        if (entry.contentRect) {
                            if (
                                entry.contentRect.width > 0 &&
                                entry.contentRect.height > 0
                            ) {
                                this.element.width = entry.contentRect.width
                                this.element.height = entry.contentRect.height

                                const canvasContainer = this.element

                                const canvasList =
                                    canvasContainer.querySelectorAll('canvas')

                                canvasList.forEach(function (canvas) {
                                    canvas.width = entry.contentRect.width
                                    canvas.height = entry.contentRect.height
                                })

                                let component = args.positional[0]
                                component.drawCanvas(canvasContainer)

                                component.width = entry.contentRect.width
                                component.height = entry.contentRect.height
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
            const canvas = this.element
            let component = args.positional[0]
            component.drawCanvas(canvas)
        }

        destroy(args) {
            this.resizeObserver.unobserve(this.element)
        }
    }
)
