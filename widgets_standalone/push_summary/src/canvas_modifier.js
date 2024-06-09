import { setModifierManager } from "@glimmer/core";

export default setModifierManager(
  (owner) => ({
    createModifier(factory, args) {
      return new factory();
    },

    installModifier(instance, element, args) {
      instance.element = element;

      instance.install(args);
    },

    updateModifier(instance, args) {
      instance.modify(args);
    },

    destroyModifier(instance, args) {
      instance.destroy(args);
    },

    capabilities() {
      return { disableAutoTracking: true };
    },
  }),

  class CanvasModifier {
    install(args) {
      this.resizeObserver = new ResizeObserver(
        function (entries) {
          for (const entry of entries) {
            if (entry.contentRect) {
              this.element.width = entry.contentRect.width;
              const canvas = this.element;
              let action = args.positional[0];
              action(canvas);
            }
          }
        }.bind(this),
      );
      this.resizeObserver.observe(this.element.parentElement);

      const canvas = this.element;
      let action = args.positional[0];
      action(canvas);
    }
    modify(args) {
      const canvas = this.element;
      let action = args.positional[0];
      action(canvas);
    }
    destroy(args) {
      this.resizeObserver.unobserve(this.element);
    }
  },
);
