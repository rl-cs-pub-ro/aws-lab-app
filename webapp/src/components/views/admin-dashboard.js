import { html, css } from 'lit-element';
import { connect } from 'pwa-helpers/connect-mixin.js';
import { PageViewElement } from '../page-view-element.js';
import '@polymer/iron-icon/iron-icon.js';
import '@polymer/iron-icons/iron-icons.js';

// This element is connected to the Redux store.
import { store } from '../../store.js';
import {
  setActionResults, loadStudentUsers, loadLabSettings, changeLabPassword,
  startRefresh, stopRefresh, cleanAwsResources,
} from '../../actions/admin.js';

import { SharedStyles } from '../styles/shared-styles.js';
import { ActionResultsElem } from '../ui/actionResults.js';


export class RLAwsAdminDashboard extends connect(store)(PageViewElement) {
  static get properties() {
    return {
      active: { type: Boolean },
      _stats: { type: Object },
      _labPassword: { type: String },
      _loadAwsRes: { type: Object },
      _changePassRes: { type: Object },
      _cleanupRes: { type: Object },
      _deallocateRes: { type: Object },
    };
  }

  static get styles() {
    return [
      SharedStyles,
      css`
        .stats {
          display: flex;
          flex-direction: row;
          justify-content: flex-start;
          flex-wrap: wrap;
        }
        .statsItem {
          width: 150px;
          display: flex;
          flex-direction: row;
          justify-content: space-between;
          margin: 5px;
          margin-right: 15px;
        }
        .statsItem .caption {
          flex: 1;
          font-style: italic;
          text-align: right;
          color: #333;
        }
        .statsItem .value {
          margin-left: 10px;
          font-weight: bold;
          color: #060;
        }

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

        button.reset {
          margin-left: 10px;
        }
      `
    ];
  }

  render() {
    return html`<section>
      <h3>AWS Dashboard</h3>
      <p>
        <b>Stats</b>
        <action-results .results="${this._loadAwsRes}"></action-results>
      </p>
      <div class="stats">
        ${Object.keys(this._stats ? this._stats : {}).map((key) => html`
          <div class="statsItem">
            <span class="caption">${key}: </span>
            <span class="value">${this._stats[key]}</span>
          </div>
        `)}
      </div>
      <p><b>Actions:</b></p>
      <div>
        <form class="labSettings" action="" @submit="${this._submitLabPassword}">
          Lab password: <input class="labPassword" type="text" name="labPassword"
              value="${this._labPassword}" />
          <button type="submit"><iron-icon icon="create"></iron-icon> Change</button>
          <action-results success-msg="Lab password changed successfully!"
              .results="${this._changePassRes}"></action-results>
        </form>
        <p>
        AWS Users: <button class="reset"
                           title="Deallocate all users (delete their login profiles)"
                           @click="${this._deallocateUserClick}">
          <iron-icon icon="cancel"></iron-icon> Deallocate all</button>
          <action-results success-msg="All users deallocated!"
              .results="${this._deallocateRes}"></action-results>
        </p>
        <p>
        AWS Resources: <button class="reset" title="Clean up all AWS resources"
                                             @click="${this._resetAwsClick}">
          <iron-icon icon="delete-forever"></iron-icon> Clean all users</button>
          <action-results success-msg="All resources cleaned up (hopefully)!"
              .results="${this._cleanupRes}"></action-results>
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

  _resetAwsClick(event) {
    event.preventDefault();
    if (confirm("WARNING: all AWS resources will be DELETED! Are you sure?"))
      store.dispatch(cleanAwsResources(null, true));
  }

  _deallocateUserClick(event) {
    event.preventDefault();
    if (confirm("WARNING: ALL student users will be unable to login until re-allocation! Are you sure?"))
      store.dispatch(cleanAwsResources(null, true));
  }

  updated(changedProps) {
    if (changedProps.has('active')) {
      if (this.active) {
        store.dispatch(loadLabSettings());
        store.dispatch(startRefresh());
      } else {
        store.dispatch(stopRefresh());
        store.dispatch(setActionResults("cleanAwsResources", null));
        store.dispatch(setActionResults("deallocateUser", null));
        store.dispatch(setActionResults("changeLabPassword", null));
      }
    }
  }

  // This is called every time something is updated in the store.
  stateChanged(state) {
    this._labPassword = state.admin.lab ? state.admin.lab.password : "";
    this._stats = state.admin.stats.totals;
    this._loadAwsRes = state.admin.actionResults.fetchAwsData;
    this._cleanupRes = state.admin.actionResults.cleanAwsResources;
    this._deallocateRes = state.admin.actionResults.deallocateUser;
    this._changePassRes = state.admin.actionResults.changeLabPassword;
  }
}

window.customElements.define('rl-admin-dashboard', RLAwsAdminDashboard);

