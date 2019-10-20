import { LitElement, html, css } from 'lit-element';

import { SharedStyles } from '../styles/shared-styles.js';
import { LoadingSpinner } from "../ui/spinner.js";


class LoginForm extends LitElement {
  static get properties() {
    return {
      loading: { type: Boolean, attribute: "loading" },
      authError: { type: String, attribute: 'auth-error' }
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

        .errorMessage {
          visibility: hidden; opacity: 0;
          padding: 10px 0;
          height: 0; overflow: hidden;
          transition: visibility 0s, opacity 0.5s linear;
        }
        .errorMessage[visible] {
          visibility: visible; opacity: 1;
          height: auto; overflow: initial;
          display: block;
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
          <loading-spinner ?visible="${this.loading}"></loading-spinner>
        </div>
        <div class="error errorMessage" ?visible="${this.authError}">
          Authentication failed: ${this.authError}
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

