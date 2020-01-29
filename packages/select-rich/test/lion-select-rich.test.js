import { LitElement } from '@lion/core';
import '@lion/option/lion-option.js';
import { OverlayController } from '@lion/overlays';
import {
  aTimeout,
  defineCE,
  expect,
  fixture,
  html,
  nextFrame,
  unsafeStatic,
} from '@open-wc/testing';
import { LionSelectRich } from '../index.js';
import '../lion-options.js';
import '../lion-select-rich.js';
import './keyboardEventShimIE.js';

describe('lion-select-rich', () => {
  it('has a single modelValue representing the currently checked option', async () => {
    const el = await fixture(html`
      <lion-select-rich name="foo">
        <lion-options slot="input">
          <lion-option .choiceValue=${10} checked>Item 1</lion-option>
          <lion-option .choiceValue=${20}>Item 2</lion-option>
        </lion-options>
      </lion-select-rich>
    `);

    expect(el.modelValue).to.equal(10);
  });

  it('throws if a child element without a modelValue like { value: "foo", checked: false } tries to register', async () => {
    const el = await fixture(html`
      <lion-select-rich name="foo">
        <lion-options slot="input">
          <lion-option .choiceValue=${10} checked>Item 1</lion-option>
          <lion-option .choiceValue=${20}>Item 2</lion-option>
        </lion-options>
      </lion-select-rich>
    `);
    await nextFrame();

    const invalidChild = await fixture(html`
      <lion-option .modelValue=${'Lara'}></lion-option>
    `);

    expect(() => {
      el._listboxNode.appendChild(invalidChild);
    }).to.throw(
      'The lion-select-rich name="foo" does not allow to register lion-option with .modelValue="Lara" - The modelValue should represent a type option with { value: "foo", checked: false }',
    );
  });

  it('throws if a child element with a different name than the group tries to register', async () => {
    const el = await fixture(html`
      <lion-select-rich name="gender">
        <lion-options slot="input">
          <lion-option .choiceValue=${'female'} checked></lion-option>
          <lion-option .choiceValue=${'other'}></lion-option>
        </lion-options>
      </lion-select-rich>
    `);
    await nextFrame();

    const invalidChild = await fixture(html`
      <lion-option name="foo" .choiceValue=${'male'}></lion-option>
    `);

    expect(() => {
      el._listboxNode.appendChild(invalidChild);
    }).to.throw(
      'The lion-select-rich name="gender" does not allow to register lion-option with custom names (name="foo" given)',
    );
  });

  it('can set initial modelValue on creation', async () => {
    const el = await fixture(html`
      <lion-select-rich name="gender" .modelValue=${'other'}>
        <lion-options slot="input">
          <lion-option .choiceValue=${'male'}></lion-option>
          <lion-option .choiceValue=${'female'}></lion-option>
          <lion-option .choiceValue=${'other'}></lion-option>
        </lion-options>
      </lion-select-rich>
    `);

    await nextFrame();

    expect(el.modelValue).to.equal('other');
    expect(el.formElementsArray[2].checked).to.be.true;
  });

  it(`has a fieldName based on the label`, async () => {
    const el1 = await fixture(
      html`
        <lion-select-rich label="foo"><lion-options slot="input"></lion-options></lion-select-rich>
      `,
    );
    expect(el1.fieldName).to.equal(el1._labelNode.textContent);

    const el2 = await fixture(
      html`
        <lion-select-rich
          ><label slot="label">bar</label><lion-options slot="input"></lion-options
        ></lion-select-rich>
      `,
    );
    expect(el2.fieldName).to.equal(el2._labelNode.textContent);
  });

  it(`has a fieldName based on the name if no label exists`, async () => {
    const el = await fixture(
      html`
        <lion-select-rich name="foo"><lion-options slot="input"></lion-options></lion-select-rich>
      `,
    );
    expect(el.fieldName).to.equal(el.name);
  });

  it(`can override fieldName`, async () => {
    const el = await fixture(
      html`
        <lion-select-rich label="foo" .fieldName="${'bar'}"
          ><lion-options slot="input"></lion-options
        ></lion-select-rich>
      `,
    );
    expect(el.__fieldName).to.equal(el.fieldName);
  });

  it('does not have a tabindex', async () => {
    const el = await fixture(html`
      <lion-select-rich>
        <lion-options slot="input"></lion-options>
      </lion-select-rich>
    `);
    expect(el.hasAttribute('tabindex')).to.be.false;
  });

  it('delegates the name attribute to its children options', async () => {
    const el = await fixture(html`
      <lion-select-rich name="foo">
        <lion-options slot="input">
          <lion-option .choiceValue=${10}>Item 1</lion-option>
          <lion-option .choiceValue=${20}>Item 2</lion-option>
        </lion-options>
      </lion-select-rich>
    `);

    const optOne = el.querySelectorAll('lion-option')[0];
    const optTwo = el.querySelectorAll('lion-option')[1];

    expect(optOne.name).to.equal('foo');
    expect(optTwo.name).to.equal('foo');
  });

  describe('Invoker', () => {
    it('generates an lion-select-invoker if no invoker is provided', async () => {
      const el = await fixture(html`
        <lion-select-rich>
          <lion-options slot="input"></lion-options>
        </lion-select-rich>
      `);

      expect(el._invokerNode).to.exist;
      expect(el._invokerNode.tagName).to.equal('LION-SELECT-INVOKER');
    });

    it('syncs the selected element to the invoker', async () => {
      const el = await fixture(html`
        <lion-select-rich>
          <lion-options slot="input">
            <lion-option .choiceValue=${10}>Item 1</lion-option>
            <lion-option .choiceValue=${20}>Item 2</lion-option>
          </lion-options>
        </lion-select-rich>
      `);
      const options = Array.from(el.querySelectorAll('lion-option'));
      expect(el._invokerNode.selectedElement).to.equal(options[0]);

      el.checkedIndex = 1;
      expect(el._invokerNode.selectedElement).to.equal(el.querySelectorAll('lion-option')[1]);
    });

    it('delegates readonly to the invoker', async () => {
      const el = await fixture(html`
        <lion-select-rich readonly>
          <lion-options slot="input">
            <lion-option .choiceValue=${10}>Item 1</lion-option>
            <lion-option .choiceValue=${20}>Item 2</lion-option>
          </lion-options>
        </lion-select-rich>
      `);

      expect(el.hasAttribute('readonly')).to.be.true;
      expect(el._invokerNode.hasAttribute('readonly')).to.be.true;
    });
  });

  describe('overlay', () => {
    it('should be closed by default', async () => {
      const el = await fixture(html`
        <lion-select-rich>
          <lion-options slot="input"></lion-options>
        </lion-select-rich>
      `);
      expect(el.opened).to.be.false;
    });

    it('shows/hides the listbox via opened attribute', async () => {
      const el = await fixture(html`
        <lion-select-rich>
          <lion-options slot="input"></lion-options>
        </lion-select-rich>
      `);
      el.opened = true;
      await el.updateComplete;
      expect(el._overlayCtrl.isShown).to.be.true;

      el.opened = false;
      await el.updateComplete;
      expect(el._overlayCtrl.isShown).to.be.false;
    });

    it('syncs opened state with overlay shown', async () => {
      const el = await fixture(html`
        <lion-select-rich .opened=${true}>
          <lion-options slot="input"></lion-options>
        </lion-select-rich>
      `);
      const outerEl = await fixture('<button>somewhere</button>');

      expect(el.opened).to.be.true;
      // a click on the button will trigger hide on outside click
      // which we then need to sync back to "opened"
      outerEl.click();
      await aTimeout();
      expect(el.opened).to.be.false;
    });

    it('will focus the listbox on open and invoker on close', async () => {
      const el = await fixture(html`
        <lion-select-rich>
          <lion-options slot="input"></lion-options>
        </lion-select-rich>
      `);
      await el._overlayCtrl.show();
      await el.updateComplete;
      expect(document.activeElement === el._listboxNode).to.be.true;
      expect(document.activeElement === el._invokerNode).to.be.false;

      el.opened = false;
      await el.updateComplete;
      expect(document.activeElement === el._listboxNode).to.be.false;
      expect(document.activeElement === el._invokerNode).to.be.true;
    });

    it('opens the listbox with checked option as active', async () => {
      const el = await fixture(html`
        <lion-select-rich>
          <lion-options slot="input">
            <lion-option .choiceValue=${10}>Item 1</lion-option>
            <lion-option .choiceValue=${20} checked>Item 2</lion-option>
          </lion-options>
        </lion-select-rich>
      `);
      await el._overlayCtrl.show();
      await el.updateComplete;
      const options = Array.from(el.querySelectorAll('lion-option'));

      expect(options[1].active).to.be.true;
      expect(options[1].checked).to.be.true;
    });

    it('stays closed on click if it disabled or readonly', async () => {
      const elReadOnly = await fixture(html`
        <lion-select-rich readonly>
          <lion-options slot="input">
            <lion-option .choiceValue=${10}>Item 1</lion-option>
            <lion-option .choiceValue=${20} checked>Item 2</lion-option>
          </lion-options>
        </lion-select-rich>
      `);

      const elDisabled = await fixture(html`
        <lion-select-rich disabled>
          <lion-options slot="input">
            <lion-option .choiceValue=${10}>Item 1</lion-option>
            <lion-option .choiceValue=${20} checked>Item 2</lion-option>
          </lion-options>
        </lion-select-rich>
      `);

      elReadOnly._invokerNode.click();
      await elReadOnly.updateComplete;
      expect(elReadOnly.opened).to.be.false;

      elDisabled._invokerNode.click();
      await elDisabled.updateComplete;
      expect(elDisabled.opened).to.be.false;
    });
  });

  describe('interaction-mode', () => {
    it('allows to specify an interaction-mode which determines other behaviors', async () => {
      const el = await fixture(html`
        <lion-select-rich interaction-mode="mac">
          <lion-options slot="input"></lion-options>
        </lion-select-rich>
      `);
      expect(el.interactionMode).to.equal('mac');
    });
  });

  describe('Keyboard navigation', () => {
    it('opens the listbox with [Enter] key via click handler', async () => {
      const el = await fixture(html`
        <lion-select-rich>
          <lion-options slot="input"></lion-options>
        </lion-select-rich>
      `);
      el._invokerNode.click();
      await aTimeout();
      expect(el.opened).to.be.true;
    });

    it('opens the listbox with [ ](Space) key via click handler', async () => {
      const el = await fixture(html`
        <lion-select-rich>
          <lion-options slot="input"></lion-options>
        </lion-select-rich>
      `);
      el._invokerNode.click();
      await aTimeout();
      expect(el.opened).to.be.true;
    });

    it('closes the listbox with [Escape] key once opened', async () => {
      const el = await fixture(html`
        <lion-select-rich opened>
          <lion-options slot="input"></lion-options>
        </lion-select-rich>
      `);
      el._listboxNode.dispatchEvent(new KeyboardEvent('keyup', { key: 'Escape' }));
      await el.updateComplete;
      expect(el.opened).to.be.false;
    });

    it('closes the listbox with [Tab] key once opened', async () => {
      const el = await fixture(html`
        <lion-select-rich opened>
          <lion-options slot="input"></lion-options>
        </lion-select-rich>
      `);
      // tab can only be caught via keydown
      el._listboxNode.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab' }));
      await el.updateComplete;
      expect(el.opened).to.be.false;
    });
  });

  describe('Mouse navigation', () => {
    it('opens the listbox via click on invoker', async () => {
      const el = await fixture(html`
        <lion-select-rich>
          <lion-options slot="input"></lion-options>
        </lion-select-rich>
      `);
      expect(el.opened).to.be.false;
      el._invokerNode.click();
      await nextFrame();
      expect(el.opened).to.be.true;
    });

    it('closes the listbox when an option gets clicked', async () => {
      const el = await fixture(html`
        <lion-select-rich opened>
          <lion-options slot="input">
            <lion-option .choiceValue=${10}>Item 1</lion-option>
          </lion-options>
        </lion-select-rich>
      `);
      expect(el.opened).to.be.true;
      el.querySelector('lion-option').click();
      expect(el.opened).to.be.false;
    });
  });

  describe('Keyboard navigation Windows', () => {
    it('closes the listbox with [Enter] key once opened', async () => {
      const el = await fixture(html`
        <lion-select-rich opened>
          <lion-options slot="input"></lion-options>
        </lion-select-rich>
      `);
      el._listboxNode.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter' }));
      await el.updateComplete;
      expect(el.opened).to.be.false;
    });
  });

  describe('Keyboard navigation Mac', () => {
    it('checks active item and closes the listbox with [Enter] key via click handler once opened', async () => {
      const el = await fixture(html`
        <lion-select-rich opened interaction-mode="mac">
          <lion-options slot="input">
            <lion-option .choiceValue=${10}>Item 1</lion-option>
            <lion-option .choiceValue=${20}>Item 2</lion-option>
          </lion-options>
        </lion-select-rich>
      `);

      // changes active but not checked
      el.activeIndex = 1;
      expect(el.checkedIndex).to.equal(0);

      el._listboxNode.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter' }));
      expect(el.opened).to.be.false;
      expect(el.checkedIndex).to.equal(1);
    });

    it('opens the listbox with [ArrowUp] key', async () => {
      const el = await fixture(html`
        <lion-select-rich interaction-mode="mac">
          <lion-options slot="input"></lion-options>
        </lion-select-rich>
      `);
      el.dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowUp' }));
      await el.updateComplete;
      expect(el.opened).to.be.true;
    });

    it('opens the listbox with [ArrowDown] key', async () => {
      const el = await fixture(html`
        <lion-select-rich interaction-mode="mac">
          <lion-options slot="input"></lion-options>
        </lion-select-rich>
      `);
      el.dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowDown' }));
      await el.updateComplete;
      expect(el.opened).to.be.true;
    });
  });

  describe('Accessibility', () => {
    it('has the right references to its inner elements', async () => {
      const el = await fixture(html`
        <lion-select-rich label="age">
          <lion-options slot="input">
            <lion-option .choiceValue=${10}>Item 1</lion-option>
            <lion-option .choiceValue=${20}>Item 2</lion-option>
          </lion-options>
        </lion-select-rich>
      `);
      expect(el._invokerNode.getAttribute('aria-labelledby')).to.contain(el._labelNode.id);
      expect(el._invokerNode.getAttribute('aria-labelledby')).to.contain(el._invokerNode.id);
      expect(el._invokerNode.getAttribute('aria-describedby')).to.contain(el._helpTextNode.id);
      expect(el._invokerNode.getAttribute('aria-describedby')).to.contain(el._feedbackNode.id);
      expect(el._invokerNode.getAttribute('aria-haspopup')).to.equal('listbox');
    });

    it('notifies when the listbox is expanded or not', async () => {
      // smoke test for overlay functionality
      const el = await fixture(html`
        <lion-select-rich>
          <lion-options slot="input"></lion-options>
        </lion-select-rich>
      `);
      expect(el._invokerNode.getAttribute('aria-expanded')).to.equal('false');
      el.opened = true;
      await el.updateComplete;
      await el.updateComplete; // need 2 awaits as overlay.show is an async function

      expect(el._invokerNode.getAttribute('aria-expanded')).to.equal('true');
    });

    it('is accessible when closed', async () => {
      const el = await fixture(html`
        <lion-select-rich label="age">
          <lion-options slot="input">
            <lion-option .choiceValue=${10}>Item 1</lion-option>
            <lion-option .choiceValue=${20}>Item 2</lion-option>
          </lion-options>
        </lion-select-rich>
      `);
      await expect(el).to.be.accessible();
    });

    it('is accessible when opened', async () => {
      const el = await fixture(html`
        <lion-select-rich label="age">
          <lion-options slot="input">
            <lion-option .choiceValue=${10}>Item 1</lion-option>
            <lion-option .choiceValue=${20}>Item 2</lion-option>
          </lion-options>
        </lion-select-rich>
      `);
      el.opened = true;
      await el.updateComplete;
      await el.updateComplete; // need 2 awaits as overlay.show is an async function

      await expect(el).to.be.accessible();
    });
  });

  describe('Use cases', () => {
    it('works for complex array data', async () => {
      const objs = [
        { type: 'mastercard', label: 'Master Card', amount: 12000, active: true },
        { type: 'visacard', label: 'Visa Card', amount: 0, active: false },
      ];
      const el = await fixture(html`
        <lion-select-rich label="Favorite color" name="color">
          <lion-options slot="input">
            ${objs.map(
              obj => html`
                <lion-option .modelValue=${{ value: obj, checked: false }}
                  >${obj.label}</lion-option
                >
              `,
            )}
          </lion-options>
        </lion-select-rich>
      `);
      expect(el.modelValue).to.deep.equal({
        type: 'mastercard',
        label: 'Master Card',
        amount: 12000,
        active: true,
      });

      el.checkedIndex = 1;
      expect(el.modelValue).to.deep.equal({
        type: 'visacard',
        label: 'Visa Card',
        amount: 0,
        active: false,
      });
    });

    it('keeps showing the selected item after a new item has been added in the selectedIndex position', async () => {
      const mySelectContainerTagString = defineCE(
        class extends LitElement {
          static get properties() {
            return {
              colorList: Array,
            };
          }

          constructor() {
            super();
            this.colorList = [];
          }

          render() {
            return html`
              <lion-select-rich label="Favorite color" name="color">
                <lion-options slot="input">
                  ${this.colorList.map(
                    colorObj => html`
                      <lion-option
                        .modelValue=${{ value: colorObj.value, checked: colorObj.checked }}
                        >${colorObj.label}</lion-option
                      >
                    `,
                  )}
                </lion-options>
              </lion-select-rich>
            `;
          }
        },
      );
      const mySelectContainerTag = unsafeStatic(mySelectContainerTagString);
      const el = await fixture(html`
        <${mySelectContainerTag}></${mySelectContainerTag}>
      `);

      const colorList = [
        {
          label: 'Red',
          value: 'red',
          checked: false,
        },
        {
          label: 'Hotpink',
          value: 'hotpink',
          checked: true,
        },
        {
          label: 'Teal',
          value: 'teal',
          checked: false,
        },
      ];

      el.colorList = colorList;
      el.requestUpdate();
      await el.updateComplete;

      const selectRich = el.shadowRoot.querySelector('lion-select-rich');
      const invoker = selectRich._invokerNode;

      // needed to properly set the checkedIndex and modelValue
      selectRich.requestUpdate();
      await selectRich.updateComplete;

      expect(selectRich.checkedIndex).to.equal(1);
      expect(selectRich.modelValue).to.equal('hotpink');
      expect(invoker.selectedElement.value).to.equal('hotpink');

      colorList.splice(1, 0, {
        label: 'Blue',
        value: 'blue',
        checked: false,
      });

      el.requestUpdate();
      await el.updateComplete;

      expect(selectRich.checkedIndex).to.equal(2);
      expect(selectRich.modelValue).to.equal('hotpink');
      expect(invoker.selectedElement.value).to.equal('hotpink');
    });
  });

  describe('Subclassers', () => {
    it('allows to override the type of overlay', async () => {
      const mySelectTagString = defineCE(
        class MySelect extends LionSelectRich {
          _defineOverlay({ invokerNode, contentNode }) {
            const ctrl = new OverlayController({
              placementMode: 'global',
              contentNode,
              invokerNode,
            });

            this.addEventListener('switch', () => {
              ctrl.updateConfig({ placementMode: 'local' });
            });
            return ctrl;
          }
        },
      );

      const mySelectTag = unsafeStatic(mySelectTagString);

      const el = await fixture(html`
        <${mySelectTag} label="Favorite color" name="color">
          <lion-options slot="input">
            ${Array(2).map(
              (_, i) => html`
                <lion-option .modelValue="${{ value: i, checked: false }}">value ${i}</lion-option>
              `,
            )}
          </lion-options>
        </${mySelectTag}>
      `);

      expect(el._overlayCtrl.placementMode).to.equal('global');
      el.dispatchEvent(new Event('switch'));
      expect(el._overlayCtrl.placementMode).to.equal('local');
    });
  });
});
