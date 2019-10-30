import { html, css } from 'lit-element';
import { connect } from 'pwa-helpers/connect-mixin.js';
import { PageViewElement } from '../page-view-element.js';
import '@polymer/iron-icon/iron-icon.js';
import '@polymer/iron-icons/iron-icons.js';

// This element is connected to the Redux store.
import { store } from '../../store.js';
import { loadStudentUsers, changeLabPassword } from '../../actions/admin.js';

import { SharedStyles } from '../styles/shared-styles.js';


export class RLAwsAdminDashboard extends connect(store)(PageViewElement) {
  static get properties() {
    return {
      active: { type: Boolean },
      _stats: { type: Object },
      _labPassword: { type: String },
      _labPasswordError: { type: String },
    };
  }

  static get styles() {
    return [
      SharedStyles,
      css`
        button {
          cursor: pointer;
          padding: 5px 10px;
          border: 1px solid #AAA;
          background: #EFEFEF;
          border-radius: 4px;
          vertical-align: middle;
        }
        button:hover {
          cursor: pointer;
          background: #FFFFFF;
          border-color: #888;
        }
        input {
          padding: 5px 10px;
          line-height: 22px;
          border: 1px solid #AAA;
          vertical-align: middle;
        }
        input.labPassword {
          width: 9em;
          margin-left: 10px;
          background: white;
          color: #DDDDDD;
        }
        input.labPassword:focus {
          color: #444;
        }
      `
    ];
  }

  render() {
    return html`<section>
      <h3>AWS Dashboard</h3>
      <p><b>Stats</b></p>
      <div class="stats">
        Users Allocated: TODO <br />
        Resources: TODO <br />
      </div>
      <p><b>Actions:</b></p>
      <div>
        <form class="labSettings" action="" @submit="${this._submitLabPassword}">
          Lab password: <input class="labPassword" type="text" name="labPassword"
              value="${this._labPassword}" />
          <button type="submit"><iron-icon icon="create"></iron-icon> Change</button>
          <div class="error errorMessage" ?visible="${this._labPasswordError}">
            ${this._labPasswordError}
          </div>
        </form>
        <p>
          AWS Resources: <button title="Clean up and unassign all users">
            <iron-icon icon="delete-forever"></iron-icon> Clean all users</button>
        </p>
      </div>
    </section>`;
  }

  _submitLabPassword(event) {
    event.preventDefault();
    let labPassword = event.target.elements.labPassword.value;
    setTimeout(() => {
      store.dispatch(changeLabPassword(labPassword));
    }, 50);
  }

  updated(changedProps) {
    if (changedProps.has('active')) {
      if (this.active) {
        this._labPasswordError = '';
        store.dispatch(loadLabSettings());
      } else {
        // store.dispatch(stopUsersRefresh());
      }
    }
  }

  // This is called every time something is updated in the store.
  stateChanged(state) {
    this._labPassword = state.admin.lab ? state.admin.lab.password : "";
    let changeLabPasswordStatus = state.admin.actionStatus.changeLabPassword;
    if (changeLabPasswordStatus && changeLabPasswordStatus.error) {
      this._labPasswordError = changeLabPasswordStatus.error;
    } else {
      this._labPasswordError = '';
    }
    // this._users = state.admin.users;
  }
}

window.customElements.define('rl-admin-dashboard', RLAwsAdminDashboard);

