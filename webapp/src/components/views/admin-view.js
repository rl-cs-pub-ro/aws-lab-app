import { html, css } from 'lit-element';
import { connect } from 'pwa-helpers/connect-mixin.js';
import { PageViewElement } from '../page-view-element.js';

// This element is connected to the Redux store.
import { store } from '../../store.js';
import { adminLogin, adminLogout } from '../../actions/admin.js';
import adminReducer from '../../reducers/admin.js';
store.addReducers({
  admin: adminReducer
});

// These are the shared styles needed by this element.
import { SharedStyles } from '../styles/shared-styles.js';

class RLAwsAdminView extends connect(store)(PageViewElement) {
  static get properties() {
    return {
      _authenticated: { type: Boolean },
      _authFailed: { type: String },
    };
  }

  static get styles() {
    return [
      SharedStyles
    ];
  }

  render() {
    return html`
      <section>
        <h2>Administrator Panel</h2>
        <div></div>
        <br>
      </section>
    `;
  }

  // This is called every time something is updated in the store.
  stateChanged(state) {
    this._authenticated = !!state.admin.authToken;
    this._authFailed = state.admin.authFailed;
  }
}

window.customElements.define('rl-admin-view', RLAwsAdminView);

