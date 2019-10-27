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
      active: { type: Boolean },
      _stats: { type: Object },
      _actionError: { type: Object },
      _showActionError: { type: Object },
    };
  }

  static get styles() {
    return [
      SharedStyles,
      css`
        .users-table {
          display: flex;
          flex-direction: row;
          align-items: stretch;
          align-content: stretch;
          flex-wrap: wrap;
          border-bottom: 0;
        }
        .users-table .item {
          display: flex;
          justify-content: stretch;
          width: 200px;
          flex-grow: 1;
          flex-direction: column;
          position: relative;
          padding: 10px 10px;
          border: 1px solid #CCC;
          margin-right: 20px;
          margin-bottom: 10px;
        }
        .users-table .item:hover {
          background: #EEE;
        }
        .users-table .username {
          font-weight: bold;
          font-weight: 500;
          margin-bottom: 5px;
          margin-right: 30px;
        }
        .users-table .username.alloc {
          color: #099;
        }
        .users-table .lastdate {
          display: inline-block;
          white-space: nowrap;
          color: #555;
        }
        .users-table .lastdate.never { color: #B77; }
        .users-table .lastdate.recent { color: #7B7; }

        input.labPassword {
          width: 5em;
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
        <form class="bordered" action="" @submit="${this._submitLabPassword}">
          Lab password: <input class="labPassword" type="text" name="lab_password" />
          <button>Change</button>
        </form>
      </div>
    </section>`;
  }

  _submitLabPassword(event) {
    event.preventDefault();
  }

  // This is called every time something is updated in the store.
  stateChanged(state) {
    // this._actionStatus = state.admin.actionResults.index;
    // this._users = state.admin.users;
  }
}

window.customElements.define('rl-admin-dashboard', RLAwsAdminDashboard);

