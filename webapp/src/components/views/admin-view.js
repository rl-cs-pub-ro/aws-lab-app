import { html, css } from 'lit-element';
import { connect } from 'pwa-helpers/connect-mixin.js';
import { PageViewElement } from '../page-view-element.js';

// This element is connected to the Redux store.
import { store } from '../../store.js';
import { loginAdmin, logoutAdmin } from '../../actions/admin.js';

import { SharedStyles } from '../styles/shared-styles.js';
import { LoginForm } from '../ui/login-form.js';
import { RLAwsAdminDashboard } from './admin-dashboard.js';


export class RLAwsAdminView extends connect(store)(PageViewElement) {
  static get properties() {
    return {
      _authenticated: { type: Boolean },
      _authFailed: { type: String },
      _subpage: { type: String },
      _loading: { type: Boolean },
    };
  }

  static get styles() {
    return [
      SharedStyles,
      css`
        .page {
          visibility: hidden;
          opacity: 0;
          height: 0; overflow: hidden;
          transition: visibility 0s, opacity 0.5s linear;
        }
        .page[active] {
          display: block;
          visibility: visible;
          opacity: 1;
          height: auto;
          overflow: initial;
        }

      `
    ];
  }

  render() {
    if (!this._authenticated) {
      return html`<section>
        <h2>Administrator Panel</h2>
        <login-form @form-submitted="${this._formSubmitted}" auth-error="${this._authFailed}"
            ?loading="${this._loading}">
          <p style="font-weight: bold;">STAHP! Only authorized personnel can proceed!</p>
        </login-form>
        <br>
      </section>`;
    }
    return html`
      <rl-admin-dashboard class="page" ?active="${this._subpage ===
        'dashboard'}"> </rl-admin-dashboard>
    `;
  }

  _formSubmitted(event) {
    this._loading = true;
    this._authFailed = '';
    store.dispatch(loginAdmin(event.detail.username, event.detail.password));
  }

  // This is called every time something is updated in the store.
  stateChanged(state) {
    this._authenticated = !!state.admin.authToken;
    this._authFailed = state.admin.authFailed;
    let subpageObj = state.app.page.subpage;
    this._subpage = subpageObj ? subpageObj.name : "dashboard";
    this._loading = false;
  }
}

window.customElements.define('rl-admin-view', RLAwsAdminView);

