import { expect, html, fixture, nextFrame } from '@open-wc/testing';

import { localizeTearDown } from '@lion/localize/test-helpers.js';
import { Required } from '@lion/validate';

import '@lion/checkbox/lion-checkbox.js';
import '../lion-checkbox-group.js';

beforeEach(() => {
  localizeTearDown();
});

describe('<lion-checkbox-group>', () => {
  it('has a single modelValue representing all currently checked values', async () => {
    const el = await fixture(html`
      <lion-checkbox-group name="gender[]">
        <lion-checkbox .choiceValue=${'male'}></lion-checkbox>
        <lion-checkbox .choiceValue=${'female'} checked></lion-checkbox>
        <lion-checkbox .choiceValue=${'alien'}></lion-checkbox>
      </lion-checkbox-group>
    `);
    await nextFrame();
    expect(el.modelValue).to.equal(['female']);
    el.formElementsArray[0].checked = true;
    expect(el.modelValue).to.equal(['male', 'female']);
    el.formElementsArray[2].checked = true;
    expect(el.modelValue).to.equal(['male', 'female', 'alien']);
  });

  it('throws if a child element without a modelValue like { value: "foo", checked: false } tries to register', async () => {
    const el = await fixture(html`
      <lion-radio-group name="gender">
        <lion-radio .choiceValue=${'male'}></lion-radio>
        <lion-radio .choiceValue=${'female'} checked></lion-radio>
        <lion-radio .choiceValue=${'alien'}></lion-radio>
      </lion-radio-group>
    `);
    await nextFrame();
    const invalidChild = await fixture(html`
      <lion-input name="first-name" .modelValue=${'Lara'}></lion-input>
    `);

    expect(() => {
      el.appendChild(invalidChild);
    }).to.throw(
      'The lion-radio-group name="gender" does not allow to register lion-input with .modelValue="Lara" - The modelValue should represent a type radio with { value: "foo", checked: false }',
    );
  });

  it('throws if a child element with a different name then the group tries to register', async () => {
    const el = await fixture(html`
      <lion-radio-group name="gender">
        <lion-radio .choiceValue=${'female'} checked></lion-radio>
        <lion-radio .choiceValue=${'alien'}></lion-radio>
      </lion-radio-group>
    `);
    await nextFrame();
    const invalidChild = await fixture(html`
      <lion-radio name="foo" .choiceValue=${'male'}></lion-radio>
    `);

    expect(() => {
      el.appendChild(invalidChild);
    }).to.throw(
      'The lion-radio-group name="gender" does not allow to register lion-input with custom names (name="foo" given)',
    );
  });

  it('can set initial modelValue on creation', async () => {
    const el = await fixture(html`
      <lion-radio-group .modelValue=${'alien'}>
        <lion-radio name="gender[]" .choiceValue=${'male'}></lion-radio>
        <lion-radio name="gender[]" .choiceValue=${'female'}></lion-radio>
        <lion-radio name="gender[]" .choiceValue=${'alien'}></lion-radio>
      </lion-radio-group>
    `);

    await nextFrame();
    await el.registrationReady;
    await el.updateComplete;

    expect(el.modelValue).to.equal('alien');
    expect(el.formElementsArray[2].checked).to.be.true;
  });

  it('can be required', async () => {
    const el = await fixture(html`
      <lion-checkbox-group .validators=${[new Required()]}>
        <lion-checkbox name="sports[]" .choiceValue=${'running'}></lion-checkbox>
        <lion-checkbox name="sports[]" .choiceValue=${'swimming'}></lion-checkbox>
      </lion-checkbox-group>
    `);
    await nextFrame();

    expect(el.hasFeedbackFor).to.deep.equal(['error']);
    expect(el.validationStates.error.Required).to.be.true;
    el.formElements['sports[]'][0].checked = true;
    expect(el.hasFeedbackFor).to.deep.equal([]);
  });

  it('is accessible', async () => {
    const el = await fixture(html`
      <lion-checkbox-group name="scientistsGroup" label="Who are your favorite scientists?">
        <lion-checkbox
          name="scientists[]"
          label="Archimedes"
          .choiceValue=${'Archimedes'}
        ></lion-checkbox>
        <lion-checkbox
          name="scientists[]"
          label="Francis Bacon"
          .choiceValue=${'Francis Bacon'}
        ></lion-checkbox>
        <lion-checkbox
          name="scientists[]"
          label="Marie Curie"
          .modelValue=${{ value: 'Marie Curie', checked: false }}
        ></lion-checkbox>
      </lion-checkbox-group>
    `);
    await expect(el).to.be.accessible();
  });

  it('is accessible when pre-selected', async () => {
    const el = await fixture(html`
      <lion-checkbox-group name="scientistsGroup" label="Who are your favorite scientists?">
        <lion-checkbox
          name="scientists[]"
          label="Archimedes"
          .choiceValue=${'Archimedes'}
        ></lion-checkbox>
        <lion-checkbox
          name="scientists[]"
          label="Francis Bacon"
          .choiceValue=${'Francis Bacon'}
          .choiceChecked=${true}
        ></lion-checkbox>
        <lion-checkbox
          name="scientists[]"
          label="Marie Curie"
          .modelValue=${{ value: 'Marie Curie', checked: true }}
        ></lion-checkbox>
      </lion-checkbox-group>
    `);
    await expect(el).to.be.accessible();
  });

  it('is accessible when disabled', async () => {
    const el = await fixture(html`
      <lion-checkbox-group
        name="scientistsGroup"
        label="Who are your favorite scientists?"
        disabled
      >
        <lion-checkbox
          name="scientists[]"
          label="Archimedes"
          .choiceValue=${'Archimedes'}
        ></lion-checkbox>
        <lion-checkbox
          name="scientists[]"
          label="Francis Bacon"
          .choiceValue=${'Francis Bacon'}
        ></lion-checkbox>
        <lion-checkbox
          name="scientists[]"
          label="Marie Curie"
          .modelValue=${{ value: 'Marie Curie', checked: true }}
        ></lion-checkbox>
      </lion-checkbox-group>
    `);
    await expect(el).to.be.accessible();
  });
});
