import { expect, fixture, nextFrame, html } from '@open-wc/testing';
import { Required } from '@lion/validate';
import '@lion/radio/lion-radio.js';

import '../lion-radio-group.js';

describe('<lion-radio-group>', () => {
  it('has a single modelValue representing the currently checked radio value', async () => {
    const el = await fixture(html`
      <lion-radio-group name="gender">
        <lion-radio .choiceValue=${'male'}></lion-radio>
        <lion-radio .choiceValue=${'female'} checked></lion-radio>
        <lion-radio .choiceValue=${'alien'}></lion-radio>
      </lion-radio-group>
    `);
    await nextFrame();
    expect(el.modelValue).to.equal('female');
    el.formElementsArray[0].checked = true;
    expect(el.modelValue).to.equal('male');
    el.formElementsArray[2].checked = true;
    expect(el.modelValue).to.equal('alien');
  });

  it('will register child elements with the same name', async () => {
    const el = await fixture(html`
      <lion-radio-group name="gender">
        <lion-radio .choiceValue=${'male'}></lion-radio>
        <lion-radio .choiceValue=${'female'} checked></lion-radio>
        <lion-radio .choiceValue=${'alien'}></lion-radio>
      </lion-radio-group>
    `);
    await nextFrame();
    expect(el.formElementsArray[0].name).to.equal('gender');
    expect(el.formElementsArray[1].name).to.equal('gender');
    expect(el.formElementsArray[2].name).to.equal('gender');
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

  it('can handle complex data via choiceValue', async () => {
    const date = new Date(2018, 11, 24, 10, 33, 30, 0);

    const el = await fixture(html`
      <lion-radio-group>
        <lion-radio name="data[]" .choiceValue=${{ some: 'data' }}></lion-radio>
        <lion-radio name="data[]" .choiceValue=${date} checked></lion-radio>
      </lion-radio-group>
    `);
    await nextFrame();

    expect(el.modelValue).to.equal(date);
    el.formElementsArray[0].checked = true;
    expect(el.modelValue).to.deep.equal({ some: 'data' });
  });

  it('can handle 0 and empty string as valid values ', async () => {
    const el = await fixture(html`
      <lion-radio-group>
        <lion-radio name="data[]" .choiceValue=${0} checked></lion-radio>
        <lion-radio name="data[]" .choiceValue=${''}></lion-radio>
      </lion-radio-group>
    `);
    await nextFrame();

    expect(el.modelValue).to.equal(0);
    el.formElementsArray[1].checked = true;
    expect(el.modelValue).to.equal('');
  });

  it('can check a radio by supplying an available modelValue', async () => {
    const el = await fixture(html`
      <lion-radio-group>
        <lion-radio name="gender[]" .modelValue="${{ value: 'male', checked: false }}"></lion-radio>
        <lion-radio
          name="gender[]"
          .modelValue="${{ value: 'female', checked: true }}"
        ></lion-radio>
        <lion-radio
          name="gender[]"
          .modelValue="${{ value: 'alien', checked: false }}"
        ></lion-radio>
      </lion-radio-group>
    `);
    await nextFrame();
    expect(el.modelValue).to.equal('female');
    el.modelValue = 'alien';
    expect(el.formElementsArray[2].checked).to.be.true;
  });

  it('fires model-value-changed event only once per checked change', async () => {
    let counter = 0;
    const el = await fixture(html`
      <lion-radio-group
        @model-value-changed=${() => {
          counter += 1;
        }}
      >
        <lion-radio name="gender[]" .choiceValue=${'male'}></lion-radio>
        <lion-radio name="gender[]" .modelValue=${{ value: 'female', checked: true }}></lion-radio>
        <lion-radio name="gender[]" .choiceValue=${'alien'}></lion-radio>
      </lion-radio-group>
    `);
    await nextFrame();
    expect(counter).to.equal(0);

    el.formElementsArray[0].checked = true;
    expect(counter).to.equal(1);

    // not changed values trigger no event
    el.formElementsArray[0].checked = true;
    expect(counter).to.equal(1);

    el.formElementsArray[2].checked = true;
    expect(counter).to.equal(2);

    // not found values trigger no event
    el.modelValue = 'foo';
    expect(counter).to.equal(2);

    el.modelValue = 'male';
    expect(counter).to.equal(3);
  });

  it('expect child nodes to only fire one model-value-changed event per instance', async () => {
    let counter = 0;
    const el = await fixture(html`
      <lion-radio-group
        @model-value-changed=${() => {
          counter += 1;
        }}
      >
        <lion-radio name="gender[]" .choiceValue=${'male'}></lion-radio>
        <lion-radio name="gender[]" .modelValue=${{ value: 'female', checked: true }}></lion-radio>
        <lion-radio name="gender[]" .choiceValue=${'alien'}></lion-radio>
      </lion-radio-group>
    `);
    await nextFrame();
    counter = 0; // reset after setup which may result in different results

    el.formElementsArray[0].checked = true;
    expect(counter).to.equal(2); // male becomes checked, female becomes unchecked

    // not changed values trigger no event
    el.formElementsArray[0].checked = true;
    expect(counter).to.equal(2);

    el.formElementsArray[2].checked = true;
    expect(counter).to.equal(4); // alien becomes checked, male becomes unchecked

    // not found values trigger no event
    el.modelValue = 'foo';
    expect(counter).to.equal(4);

    el.modelValue = 'male';
    expect(counter).to.equal(6); // male becomes checked, alien becomes unchecked
  });

  it('allows selection of only one radio in a named group', async () => {
    const el = await fixture(html`
      <lion-radio-group>
        <lion-radio name="gender[]" .modelValue="${{ value: 'male', checked: false }}"></lion-radio>
        <lion-radio
          name="gender[]"
          .modelValue="${{ value: 'female', checked: false }}"
        ></lion-radio>
      </lion-radio-group>
    `);
    await nextFrame();
    const male = el.formElements['gender[]'][0];
    const maleInput = male.querySelector('input');
    const female = el.formElements['gender[]'][1];
    const femaleInput = female.querySelector('input');

    expect(male.checked).to.equal(false);
    expect(female.checked).to.equal(false);

    maleInput.focus();
    maleInput.click();
    expect(male.checked).to.equal(true);
    expect(female.checked).to.equal(false);

    femaleInput.focus();
    femaleInput.click();
    expect(male.checked).to.equal(false);
    expect(female.checked).to.equal(true);
  });

  it('should have role = radiogroup', async () => {
    const el = await fixture(html`
      <lion-radio-group>
        <label slot="label">My group</label>
        <lion-radio name="gender[]" value="male">
          <label slot="label">male</label>
        </lion-radio>
        <lion-radio name="gender[]" value="female">
          <label slot="label">female</label>
        </lion-radio>
      </lion-radio-group>
    `);
    await nextFrame();
    expect(el.getAttribute('role')).to.equal('radiogroup');
  });

  it('can be required', async () => {
    const el = await fixture(html`
      <lion-radio-group .validators=${[new Required()]}>
        <lion-radio name="gender[]" .choiceValue=${'male'}></lion-radio>
        <lion-radio
          name="gender[]"
          .choiceValue=${{ subObject: 'satisfies required' }}
        ></lion-radio>
      </lion-radio-group>
    `);
    expect(el.hasFeedbackFor).to.include('error');
    expect(el.validationStates).to.have.a.property('error');
    expect(el.validationStates.error).to.have.a.property('Required');

    el.formElements['gender[]'][0].checked = true;
    expect(el.hasFeedbackFor).not.to.include('error');
    expect(el.validationStates).to.have.a.property('error');
    expect(el.validationStates.error).not.to.have.a.property('Required');

    el.formElements['gender[]'][1].checked = true;
    expect(el.hasFeedbackFor).not.to.include('error');
    expect(el.validationStates).to.have.a.property('error');
    expect(el.validationStates.error).not.to.have.a.property('Required');
  });

  it('returns serialized value', async () => {
    const el = await fixture(html`
      <lion-radio-group>
        <lion-radio name="gender[]" .choiceValue=${'male'}></lion-radio>
        <lion-radio name="gender[]" .choiceValue=${'female'}></lion-radio>
      </lion-radio-group>
    `);
    el.formElements['gender[]'][0].checked = true;
    expect(el.serializedValue).to.deep.equal({ checked: true, value: 'male' });
  });

  it('returns serialized value on unchecked state', async () => {
    const el = await fixture(html`
      <lion-radio-group>
        <lion-radio name="gender[]" .choiceValue=${'male'}></lion-radio>
        <lion-radio name="gender[]" .choiceValue=${'female'}></lion-radio>
      </lion-radio-group>
    `);
    await nextFrame();

    expect(el.serializedValue).to.deep.equal('');
  });

  it(`becomes "touched" once a single element of the group changes`, async () => {
    const el = await fixture(html`
      <lion-radio-group>
        <lion-radio name="myGroup[]"></lion-radio>
        <lion-radio name="myGroup[]"></lion-radio>
      </lion-radio-group>
    `);
    await nextFrame();

    el.children[1].focus();
    expect(el.touched).to.equal(false, 'initially, touched state is false');
    el.children[1].checked = true;
    expect(el.touched, `focused via a mouse click, group should be touched`).to.be.true;
  });

  it('is accessible', async () => {
    const el = await fixture(html`
      <lion-radio-group>
        <label slot="label">My group</label>
        <lion-radio name="gender[]" value="male">
          <label slot="label">male</label>
        </lion-radio>
        <lion-radio name="gender[]" value="female" checked>
          <label slot="label">female</label>
        </lion-radio>
      </lion-radio-group>
    `);
    await nextFrame();
    await expect(el).to.be.accessible();
  });

  it('is accessible when the group is disabled', async () => {
    const el = await fixture(html`
      <lion-radio-group disabled>
        <label slot="label">My group</label>
        <lion-radio name="gender[]" value="male">
          <label slot="label">male</label>
        </lion-radio>
        <lion-radio name="gender[]" value="female">
          <label slot="label">female</label>
        </lion-radio>
      </lion-radio-group>
    `);
    await nextFrame();
    await expect(el).to.be.accessible();
  });

  it('is accessible when an option is disabled', async () => {
    const el = await fixture(html`
      <lion-radio-group>
        <label slot="label">My group</label>
        <lion-radio name="gender[]" value="male" disabled>
          <label slot="label">male</label>
        </lion-radio>
        <lion-radio name="gender[]" value="female">
          <label slot="label">female</label>
        </lion-radio>
      </lion-radio-group>
    `);
    await nextFrame();
    await expect(el).to.be.accessible();
  });
});
