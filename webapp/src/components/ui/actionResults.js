import { LitElement, html, css } from 'lit-element';

import { LoadingSpinner } from "../ui/spinner.js";

export class ActionResultsElem extends LitElement {
  static get properties() {
    return {
      successMessage: { type: String, attribute: 'success-msg' },
      results: { type: Object },
      loading: { type: Boolean, reflect: true },
      visible: { type: Boolean, reflect: true },
    };
  }

  static get styles() {
    return [
      css`
        :host {
          display: none;
        }
        :host([visible]) { display: block; }
        :host([loading]) {
          display: inline-block;
          vertical-align: middle;
          margin-left: 10px;
        }

        .error { color: #A00; }
        .success { color: #5A5; }
        .message {
          visibility: hidden; opacity: 0;
          font-weight: bold;
          padding: 0;
          height: 0; overflow: hidden;
          transition: visibility 0s, opacity 0.5s linear;
        }
        .message[visible] {
          display: block;
          visibility: visible; opacity: 1;
          padding: 10px 0;
          height: auto; overflow: initial;
        }
        .error.message {
          max-height: 10em;
          overflow: hidden;
        }
      `
    ];
  }

  constructor() {
    super();
    this.results = {};
  }

  updated(changedProps) {
    if (changedProps.has('results')) {
      this.loading = !!this.results && !!this.results.loading;
      this.visible = !!this.results && (!!this.results.error || !!this.results.success);
    }
  }

  render() {
    let errorHtml = () => {
      if (!this.results || !this.results.error) return '';
      let errors = this.results.error.split("\n");
      return errors.map((err) => html`<div>${err}</div>`);
    };
    return html`
      <loading-spinner ?visible="${this.results && this.results.loading}"></loading-spinner>
      <div class="error message" ?visible="${this.results && this.results.error}">
        ${errorHtml()}
      </div>
      <div class="success message" ?visible="${this.results &&
          this.results.success && this.successMessage}">
        ${this.successMessage}
      </div>
    `;
  }
}

window.customElements.define('action-results', ActionResultsElem);

export default ActionResultsElem;

