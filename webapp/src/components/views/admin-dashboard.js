import { html, css } from 'lit-element';
import { connect } from 'pwa-helpers/connect-mixin.js';
import { PageViewElement } from '../page-view-element.js';

// This element is connected to the Redux store.
import { store } from '../../store.js';
import { loadStudentUsers } from '../../actions/admin.js';

import { SharedStyles } from '../styles/shared-styles.js';


export class RLAwsAdminDashboard extends connect(store)(PageViewElement) {
  static get properties() {
    return {
      _users: { type: Object },
    };
  }

  static get styles() {
    return [
      SharedStyles
    ];
  }

  render() {
    return html`<section>
      <h3>AWS Dashboard</h3>
      <p></p>
    </section>`;
  }

  firstUpdated() {
    store.dispatch(loadStudentUsers());
  }

  _formSubmitted(event) {
    store.dispatch(loginAdmin(event.detail.username, event.detail.password));
  }

  // This is called every time something is updated in the store.
  stateChanged(state) {
    this._authenticated = !!state.admin.authToken;
    this._authFailed = state.admin.authFailed;
  }
}

window.customElements.define('rl-admin-dashboard', RLAwsAdminDashboard);

