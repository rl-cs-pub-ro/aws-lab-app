import { html, css } from 'lit-element';
import { connect } from 'pwa-helpers/connect-mixin.js';
import { PageViewElement } from '../page-view-element.js';

import { format, render, cancel, register } from 'timeago.js';

// This element is connected to the Redux store.
import { store } from '../../store.js';
import { startUsersRefresh, stopUsersRefresh } from '../../actions/admin.js';

import { SharedStyles } from '../styles/shared-styles.js';


export class RLAwsAdminUsers extends connect(store)(PageViewElement) {
  static get properties() {
    return {
      _users: { type: Object },
      _usersLoadError: { type: String },
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
        .users-table .item.alloc .username {
          color: #099;
        }
        .users-table .lastdate {
          display: inline-block;
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
      <div class="error errorMessage" ?visible="${this._usersLoadError}">
        ${'Users refresh failed: ' + this._usersLoadError}
      </div>
      <div class="users-table">
        ${this._sortUsers().map((key) => {
          const item = this._users[key];
          return html`
            <div class="item ${this._formatItem(item)}" title="${this._itemTitle(item)}">
              <span class="username">${item.username}</span>
              <span class="lastdate ${this._colorLastUsed(item.awsStats.last_used)}">
                ${this._formatDate(item.awsStats.last_used)}
              </span>
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
    if (item.allocatedToken) {
      return 'alloc';
    }
    return '';
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

  updated(changedProps) {
    if (changedProps.has('active')) {
      if (this.active) {
        store.dispatch(startUsersRefresh());
      } else {
        store.dispatch(stopUsersRefresh());
      }
    }
  }

  // This is called every time something is updated in the store.
  stateChanged(state) {
    this._users = state.admin.users;
    let loadUsersStatus = state.admin.actionStatus.loadStudentUsers;
    if (loadUsersStatus && loadUsersStatus.error) {
      this._usersLoadError = loadUsersStatus.error;
    } else {
      this._usersLoadError = '';
    }
  }
}

window.customElements.define('rl-admin-users', RLAwsAdminUsers);

