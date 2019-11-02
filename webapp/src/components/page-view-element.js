import { LitElement } from 'lit-element';

export class PageViewElement extends LitElement {
  // Only render this page if it's actually visible.
  shouldUpdate(changedProperties) {
    if (changedProperties.has('active'))
      return true;
    return this.active;
  }

  static get properties() {
    return {
      title: { type: Boolean },
      active: { type: Boolean }
    };
  }
}
