import { html, css } from 'lit-element';
import { connect } from 'pwa-helpers/connect-mixin.js';
import { PageViewElement } from '../page-view-element.js';

// This element is connected to the Redux store.
import { store } from '../../store.js';
import { loadStudentCredentials, loginStudent } from '../../actions/student.js';
import studentReducer from '../../reducers/student.js';
store.addReducers({
  student: studentReducer
});

import { SharedStyles } from '../styles/shared-styles.js';
import { LoadingSpinner } from "../ui/spinner.js";

export class RLAwsStudentView extends connect(store)(PageViewElement) {
  static get properties() {
    return {
      _authFailed: { type: String },
      _loadingApp: { type: Boolean },
      _loadingAction: { type: Boolean },
      _creds: { type: Object },
    };
  }

  static get styles() {
    return [
      SharedStyles,
      css`
        .credentials {
          display: inline-block;
          padding: 3px 10px;
          margin: 5px;
          border: 1px dashed #CCC;
          font-family: monospace;
          font-size: 14pt;
          color: #444;
        }
        .credentials.password {
          color: #EDD;
        }
      `
    ];
  }

  render() {
    if (this._loadingApp) {
      return html`
          <h3><i>Loading, please wait...</i></h3>
        `;
    }
    if (!this._creds) {
      return html`<section>
        <h2>AWS Student Account</h2>
        <p>This page will allocate a unique AWS username and password for use
        with the RL AWS Lab.</p>
        <p>Please enter the lab's password to continue:</p>
        <form class="bordered" @submit="${this._loginSubmit}">
          <input name="labPassword" type="text" />
          <button type="submit">Proceed</button>
          <loading-spinner ?visible="${this._loadingAction}"></loading-spinner>
          <div class="error message" ?visible="${this._authFailed}">
            ${'Authentication failed: ' + this._authFailed}
          </div>
        </form>
      </section>`;
    }
    return html`<section>
      <h2>AWS Student Account</h2>
      <h3 class="success">Authentication successful!</h3>
      <p>Here's your AWS credentials:</p>
      <p>
        <b>AWS Management Console</b>:
        <a href="${this._creds.url}" target="_blank">click to open</a><br />
        <b>Username</b>: <span class="credentials">${this._creds.username}</span><br />
        <b>Password</b>: <span class="credentials password">${this._creds.password}</span>
      </p>
    </section>`;
  }

  firstUpdated() {
    this._loadingApp = true;
    store.dispatch(loadStudentCredentials());
  }

  _loginSubmit(event) {
    event.preventDefault();
    this._authFailed = '';
    this._loadingAction = true;
    let labPassword = event.target.elements.labPassword.value;
    setTimeout(() => {
      store.dispatch(loginStudent(labPassword));
    }, 50);
  }

  stateChanged(state) {
    this._creds = state.student.credentials;
    this._authFailed = state.student.authFailed;
    this._loadingApp = state.student.loading;
    this._loadingAction = false;
  }
}

window.customElements.define('rl-student-view', RLAwsStudentView);

