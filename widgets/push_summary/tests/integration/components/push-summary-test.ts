import { module, test } from 'qunit';
import { setupRenderingTest } from 'dummy/tests/helpers';
import { render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';

module('Integration | Component | push-summary', function (hooks) {
  setupRenderingTest(hooks);

  test('it renders', async function (assert) {
    // Set any properties with this.set('myProperty', 'value');
    // Handle any actions with this.set('myAction', function(val) { ... });

    await render(hbs`<PushSummary />`);

    assert.dom().hasText('');

    // Template block usage:
    await render(hbs`
      <PushSummary>
        template block text
      </PushSummary>
    `);

    assert.dom().hasText('template block text');
  });
});
