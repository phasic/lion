import '@lion/checkbox/lion-checkbox.js';
import { localizeTearDown } from '@lion/localize/test-helpers.js';
import { Required } from '@lion/validate';
import { expect, fixture, html, nextFrame } from '@open-wc/testing';
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
        <lion-checkbox .choiceValue=${'other'}></lion-checkbox>
      </lion-checkbox-group>
    `);
    await nextFrame();
    expect(el.modelValue).to.equal(['female']);
    el.formElementsArray[0].checked = true;
    expect(el.modelValue).to.equal(['male', 'female']);
    el.formElementsArray[2].checked = true;
    expect(el.modelValue).to.equal(['male', 'female', 'other']);
  });

  it('throws if a child element without a modelValue like { value: "foo", checked: false } tries to register', async () => {
    const el = await fixture(html`
      <lion-checkbox-group name="gender[]">
        <lion-checkbox .choiceValue=${'male'}></lion-checkbox>
        <lion-checkbox .choiceValue=${'female'} checked></lion-checkbox>
        <lion-checkbox .choiceValue=${'other'}></lion-checkbox>
      </lion-checkbox-group>
    `);
    await nextFrame();
    const invalidChild = await fixture(html`
      <lion-checkbox name="first-name" .modelValue=${'Lara'}></lion-checkbox>
    `);
    const anotherInvalidChild = await fixture(html`
      <input name="first-name" .modelValue=${'Lara'}></input>
    `);

    expect(() => {
      el.appendChild(invalidChild);
    }).to.throw(
      'The lion-checkbox-group name="gender[]" does not allow to register element with .modelValue="Lara" - The modelValue should represent a type checkbox with { value: "foo", checked: false }',
    );

    expect(() => {
      el.appendChild(anotherInvalidChild);
    }).to.throw(
      'The lion-checkbox-group name="gender[]" does not allow to register element with .modelValue="Lara" - The modelValue should represent a type checkbox with { value: "foo", checked: false }',
    );
  });

  it('automatically sets the name attribute of child checkboxes to its own name', async () => {
    const el = await fixture(html`
      <lion-checkbox-group name="gender[]">
        <lion-checkbox .choiceValue=${'female'} checked></lion-checkbox>
        <lion-checkbox .choiceValue=${'other'}></lion-checkbox>
      </lion-checkbox-group>
    `);
    await nextFrame();

    expect(el.formElementsArray[0].name).to.equal('gender[]');
    expect(el.formElementsArray[1].name).to.equal('gender[]');

    const validChild = await fixture(html`
      <lion-checkbox .choiceValue=${'male'}></lion-checkbox>
    `);
    el.appendChild(validChild);

    expect(el.formElementsArray[2].name).to.equal('gender[]');
  });

  it('throws if a child element with a different name than the group tries to register', async () => {
    const el = await fixture(html`
      <lion-checkbox-group name="gender[]">
        <lion-checkbox .choiceValue=${'female'} checked></lion-checkbox>
        <lion-checkbox .choiceValue=${'other'}></lion-checkbox>
      </lion-checkbox-group>
    `);
    await nextFrame();
    const invalidChild = await fixture(html`
      <lion-checkbox name="foo" .choiceValue=${'male'}></lion-checkbox>
    `);

    expect(() => {
      el.appendChild(invalidChild);
    }).to.throw(
      'The lion-checkbox-group name="gender[]" does not allow to register element with custom names (name="foo" given)',
    );
  });

  it('can set initial modelValue on creation', async () => {
    const el = await fixture(html`
      <lion-checkbox-group name="gender[]" .modelValue=${'other'}>
        <lion-checkbox .choiceValue=${'male'}></lion-checkbox>
        <lion-checkbox .choiceValue=${'female'}></lion-checkbox>
        <lion-checkbox .choiceValue=${'other'}></lion-checkbox>
      </lion-checkbox-group>
    `);

    await nextFrame();
    await el.registrationReady;
    await el.updateComplete;

    expect(el.modelValue).to.equal('other');
    expect(el.formElementsArray[2].checked).to.be.true;
  });

  it('can be required', async () => {
    const el = await fixture(html`
      <lion-checkbox-group name="sports[]" .validators=${[new Required()]}>
        <lion-checkbox .choiceValue=${'running'}></lion-checkbox>
        <lion-checkbox .choiceValue=${'swimming'}></lion-checkbox>
      </lion-checkbox-group>
    `);
    await nextFrame();

    expect(el.hasFeedbackFor).to.deep.equal(['error']);
    expect(el.validationStates.error.Required).to.be.true;
    el.formElementsArray[0].checked = true;
    expect(el.hasFeedbackFor).to.deep.equal([]);
  });

  it('is accessible', async () => {
    const el = await fixture(html`
      <lion-checkbox-group name="scientists[]" label="Who are your favorite scientists?">
        <lion-checkbox label="Archimedes" .choiceValue=${'Archimedes'}></lion-checkbox>
        <lion-checkbox label="Francis Bacon" .choiceValue=${'Francis Bacon'}></lion-checkbox>
        <lion-checkbox
          label="Marie Curie"
          .modelValue=${{ value: 'Marie Curie', checked: false }}
        ></lion-checkbox>
      </lion-checkbox-group>
    `);
    await expect(el).to.be.accessible();
  });

  it('is accessible when pre-selected', async () => {
    const el = await fixture(html`
      <lion-checkbox-group name="scientists[]" label="Who are your favorite scientists?">
        <lion-checkbox label="Archimedes" .choiceValue=${'Archimedes'}></lion-checkbox>
        <lion-checkbox
          label="Francis Bacon"
          .choiceValue=${'Francis Bacon'}
          .choiceChecked=${true}
        ></lion-checkbox>
        <lion-checkbox
          label="Marie Curie"
          .modelValue=${{ value: 'Marie Curie', checked: true }}
        ></lion-checkbox>
      </lion-checkbox-group>
    `);
    await expect(el).to.be.accessible();
  });

  it('is accessible when disabled', async () => {
    const el = await fixture(html`
      <lion-checkbox-group name="scientists[]" label="Who are your favorite scientists?" disabled>
        <lion-checkbox label="Archimedes" .choiceValue=${'Archimedes'}></lion-checkbox>
        <lion-checkbox label="Francis Bacon" .choiceValue=${'Francis Bacon'}></lion-checkbox>
        <lion-checkbox
          label="Marie Curie"
          .modelValue=${{ value: 'Marie Curie', checked: true }}
        ></lion-checkbox>
      </lion-checkbox-group>
    `);
    await expect(el).to.be.accessible();
  });
});
