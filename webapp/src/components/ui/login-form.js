import { LitElement, html, css } from 'lit-element';

import { SharedStyles } from '../styles/shared-styles.js';
import { ActionResultsElem } from "../ui/actionResults.js";


export class LoginForm extends LitElement {
  static get properties() {
    return {
      loading: { type: Boolean, attribute: "loading" },
      results: { type: Object }
    };
  }

  static get styles() {
    return [
      SharedStyles,
      css`
        :host {
          display: block;
        }

        form .line {
          display: flex;
          flex-direction: row;
          flex-wrap: wrap;
          align-items: center;
          margin: 4px;
        }
        form .line .label {
          display: block;
          width: 7em;
        }
        form .line input {
          width: 10em;
        }
        form .line button {
          padding: 3px 10px;
        }

        form .line action-results[visible] {
          width: 100%;
          flex-grow: 1;
        }
      `
    ];
  }

  render() {
    return html`
      <form class="bordered" action="" @submit="${this._formSubmitted}">
        <slot></slot>
        <div class="line">
          <span class="label">Username:</span>
          <input name="username" type="text" />
        </div>
        <div class="line">
          <span class="label">Password:</span>
          <input name="password" type="password" />
        </div>
        <div class="line">
          <span class="label"></span>
          <button type="submit">Login</button>
          <action-results .results="${this.results}"></action-results>
        </div>
      </form>
    `;
  }

  _formSubmitted(event) {
    event.preventDefault();
    let form = event.target;
    let toFire = new CustomEvent('form-submitted', { 
      detail: {
        username: form.elements["username"].value,
        password: form.elements["password"].value
      },
      composed: false
    });
    this.dispatchEvent(toFire);
  }
}

window.customElements.define('login-form', LoginForm);

export default LoginForm;

