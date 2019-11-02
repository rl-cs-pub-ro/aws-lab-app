import { html, css, repeat } from 'lit-element';
import { connect } from 'pwa-helpers/connect-mixin.js';
import { PageViewElement } from '../page-view-element.js';

import { format, render, cancel, register } from 'timeago.js';
import '@polymer/iron-icon/iron-icon.js';
import '@polymer/iron-icons/iron-icons.js';

// This element is connected to the Redux store.
import { store } from '../../store.js';
import {
  setActionResults, startRefresh, stopRefresh, cleanAwsResources,
  deallocateUser,
} from '../../actions/admin.js';

import { SharedStyles } from '../styles/shared-styles.js';
import { ActionResultsElem } from '../ui/actionResults.js';


export class RLAwsAdminUsers extends connect(store)(PageViewElement) {
  static get properties() {
    return {
      active: { type: Boolean },
      _users: { type: Object },
      _userStats: { type: Object },
      _openUser: { type: String },
      _loadAwsRes: { type: Object },
      _userCleanupRes: { type: Object },
      _userDeallocRes: { type: Object },
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
          justify-content: flex-start;
          align-items: center;
          align-content: stretch;
          width: 200px;
          flex-grow: 1;
          flex-direction: row;
          flex-wrap: wrap;
          position: relative;
          padding: 10px 10px;
          border: 1px solid #CCC;
          margin-right: 20px;
          margin-bottom: 10px;
          transition: all 0.4s;
        }
        .users-table .item:hover {
          background: #EEE;
        }
        .users-table .item.open {
          cursor: default;
          width: 100%;
          border: 1px solid #888;
          background: #EBF9FF;
        }
        .users-table .item .openable {
          cursor: pointer;
        }
        .users-table .username {
          width: 80px;
          display: block;
          font-weight: bold;
          font-weight: 500;
        }
        .users-table .item.alloc .username {
          color: #099;
        }
        .users-table .item.open .username {
          font-weight: bold;
        }
        .users-table .item .allocated {
          flex-grow: 0;
          width: 24px;
          color: #009;
        }
        .users-table .item .details {
          display: none;
          flex-grow: 1;
          width: 100%;
        }
        .users-table .item.open .details {
          margin-top: 10px;
          display: block;
        }
        .users-table .item .details .buttons {
          width: 100%;
          flex-grow: 1;
          margin-top: 10px;
        }
        .users-table .item .details .buttons button {
          cursor: pointer;
          padding: 5px 10px;
          border: 1px solid #AAA;
          background: #EFEFEF;
          border-radius: 4px;
        }
        .users-table .item .details .buttons button:hover {
          cursor: pointer;
          background: #FFFFFF;
          border-color: #888;
        }

        .users-table .item .password {
          display: none;
        }
        .users-table .item .password[visible] {
          display: block;
        }
        .users-table .item .password span {
          display: inline-block;
          font-family: monospace;
          color: #999;
          padding: 3px 6px;
          margin-left: 6px;
          border: 1px dashed #999;
        }

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

        .users-table .lastdate {
          flex-grow: 1;
          width: 130px;
          display: block;
          white-space: nowrap;
          color: #555;
        }
        .users-table .lastdate.never { color: #B77; }
        .users-table .lastdate.recent { color: #7B7; }
      `
    ];
  }

  render() {
    return html`<section>
      <h3>AWS Users</h3>
      <action-results .results="${this._loadAwsRes}"></action-results>
      <div class="users-table">
        ${this._sortUsers().map((username) => {
          const item = this._users[username];
          return html`
            <div class="item ${this._formatItem(item)}"
                 title="${this._itemTitle(item)}"
                 @click="${(event) => this._userClick(username, event)}">
              <span class="username openable">${item.username}</span>
              <span class="lastdate openable ${this._colorLastUsed(item.awsStats.last_used)}">
                ${this._formatDate(item.awsStats.last_used)}
              </span>
              ${item.allocatedToken ?  html`<iron-icon class="allocated openable"
                  icon="account-box"></iron-icon>` : ''}
              <div class="details">
                <div class="stats">
                  ${Object.keys(this._userStats[username] ? this._userStats[username] : [] )
                      .map((key) => html`
                        <div class="statsItem">
                          <span class="caption">${key}: </span>
                          <span class="value">${this._userStats[username][key]}</span>
                        </div>
                      `)}
                </div>
                <p class="password" ?visible="${!!item.password}">
                  <i>Password: <span>${item.password}</span></i>
                </p>
                <div class="buttons">
                  <button @click="${(event) => this._resetAwsUserClick(username, event)}"
                      title="Clean up all user's resources">
                    <iron-icon icon="delete-forever"></iron-icon> Clean Resources</button>
                  <button title="Deallocate the user"
                      @click="${(event) => this._deallocateUserClick(username, event)}">
                    <iron-icon icon="cancel"></iron-icon> Unassign</button>
                  <action-results success-msg="Cleanup completed successfully!"
                    .results="${this._userCleanupRes}"></action-results>
                  <action-results success-msg="User login profile deleted successfully!"
                    .results="${this._userDeallocRes}"></action-results>
                </div>
              </div>
            </div>
          `;
        })}
      </div>
    </section>`;
  }

  constructor() {
    super();
    this._collator = new Intl.Collator(undefined, {
      numeric: true, sensitivity: 'base'
    });
  }

  _sortUsers() {
    if (!this._users)
      return [];
    return Object.keys(this._users).sort(this._collator.compare);
  }

  _itemTitle(item) {
    let s = item.username;
    let ss = '';
    if (item.allocatedToken) {
      ss = 'allocated';
    }
    ss += (ss ? ', ' : '') + this._formatDate(item.awsStats.last_used);
    return s + (ss ? ' (' + ss + ')' : '');
  }
  _formatItem(item) {
    let cls = [];
    if (item.allocatedToken) {
      cls.push('alloc');
    }
    if (item.username == this._openUser) {
      cls.push('open');
    }
    return cls.join(' ');
  }

  _colorLastUsed(date) {
    if (!date) return 'never';
    if (date > (new Date().getTime() / 1000.0 + 3600 * 2))
      return 'recent';
    return ''; // default
  }

  _formatDate(date) {
    if (!date) return 'never used';
    return 'logged ' + format(new Date(date * 1000));
  }

  _userClick(username, event) {
    // check if the target is openable
    let elem = event.target;
    let openable = false;
    while (elem && elem != this.shadowRoot) {
      if (elem.classList.contains("openable")) {
        openable = true;
        break;
      }
      elem = elem.parentNode;
    }
    
    if (!openable) return;
    event.preventDefault();
    store.dispatch(setActionResults("deallocateUser", null));
    store.dispatch(setActionResults("cleanAwsResources", null));
    if (this._openUser == username) {
      this._openUser = ''; // close it
      return;
    }
    this._openUser = username;
  }

  _resetAwsUserClick(username, event) {
    event.preventDefault();
    if (confirm("WARNING: the AWS resources will be DELETED for '" + username +
        "'! Are you sure?"))
      store.dispatch(cleanAwsResources(username, false));
  }

  _deallocateUserClick(username, event) {
    event.preventDefault();
    if (confirm("WARNING: the user '" + username +
        "' will be deallocated (but resources need to be cleaned up separately)! Are you sure?"))
      store.dispatch(deallocateUser(username, false));
  }

  updated(changedProps) {
    if (changedProps.has('active')) {
      if (this.active) {
        this._openUser = '';
        store.dispatch(startRefresh());
      } else {
        store.dispatch(stopRefresh());
        store.dispatch(setActionResults("deallocateUser", null));
        store.dispatch(setActionResults("cleanAwsResources", null));
      }
    }
  }

  // This is called every time something is updated in the store.
  stateChanged(state) {
    this._users = state.admin.users;
    this._userStats = state.admin.stats.users;
    this._loadAwsRes = state.admin.actionResults.fetchAwsData;
    this._userCleanupRes = state.admin.actionResults.cleanAwsResources;
    this._userDeallocRes = state.admin.actionResults.deallocateUser;
  }
}

window.customElements.define('rl-admin-users', RLAwsAdminUsers);

