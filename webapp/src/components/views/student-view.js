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

// These are the shared styles needed by this element.
import { SharedStyles } from '../styles/shared-styles.js';

import "../ui/spinner.js";

class RLAwsStudentView extends connect(store)(PageViewElement) {
  static get properties() {
    return {
      _authFailed: { type: String },
      _creds: { type: Object },
      _labPassword: { type: String },
    };
  }

  static get styles() {
    return [
      SharedStyles,
      css`
        input, button {
          border: 2px solid #000;
          padding: 8px;
          background: white;
        }
        button {
          font-weight: bold;
        }

        .error {
          color: #A00;
          font-weight: bold;
        }
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
        .success {
          color: #5A5;
        }
      `
    ];
  }

  render() {
    if (!this._creds) {
      return html`<section>
        <h2>AWS Student Accounts</h2>
        <p>This page will allocate a unique AWS username and password for use
        with the RL AWS Lab.</p>
        <p>Please enter the lab's password to continue:</p>
        <p>
        <input type="text" @input="${this._labPasswordChanged}"
          @keyup="${this._loginClick}" />
        <button @click="${this._loginClick}">Proceed</button>
        <loading-spinner></loading-spinner>
        <div class="error">${this._authFailed ? 'Authentication failed: ' +
          this._authFailed : ''}</div>
        </p>
      </section>`;
    }
    return html`<section>
      <h2>AWS Student Accounts</h2>
      <h3 class="success">Authentication successful!</h3>
      <p>Here's your AWS credentials:</p>
      <p>
        <b>AWS Management Console</b>: TODO<br />
        <b>Username</b>: <span class="credentials">${this._creds.name}</span><br />
        <b>Password</b>: <span class="credentials password">${this._creds.password}</span>
      </p>
    </section>`;
  }

  firstUpdated() {
    store.dispatch(loadStudentCredentials());
  }

  _labPasswordChanged(event) {
    this._labPassword = event.target.value;
  }

  _loginClick(event) {
    if (event.type == "keyup") {
      if (event.keyCode !== 13)
        return;
      event.preventDefault();
    }
    store.dispatch(loginStudent(this._labPassword));
  }

  stateChanged(state) {
    this._creds = state.student.credentials;
    this._authFailed = state.student.authFailed;
  }
}

window.customElements.define('rl-student-view', RLAwsStudentView);

