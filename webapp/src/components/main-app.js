import { LitElement, html, css } from 'lit-element';
import { connect } from 'pwa-helpers/connect-mixin.js';
import { installMediaQueryWatcher } from 'pwa-helpers/media-query.js';
import { installOfflineWatcher } from 'pwa-helpers/network.js';
import { installRouter } from 'pwa-helpers/router.js';
import { updateMetadata } from 'pwa-helpers/metadata.js';

// This element is connected to the Redux store.
import { store } from '../store.js';

// These are the actions needed by this element.
import {
  navigate,
  updateOffline,
  updateLayout
} from '../actions/app.js';
import { logoutAdmin } from '../actions/admin.js';

import { RLAwsStudentView } from "./views/student-view.js";
import { RLAwsAdminView } from "./views/admin-view.js";
import { Error404View } from "./views/error-404.js";

export class RLAwsApp extends connect(store)(LitElement) {
  static get properties() {
    return {
      _appTitle: { type: String },
      _page: { type: String },
      _adminAuth: { type: Boolean },
      _showAdminMenu: { type: Boolean },
      _offline: { type: Boolean }
    };
  }

  static get styles() {
    return [
      css`
        :host {
          display: block;
          padding: 0;
        }

        header {
          display: block;
          flex-direction: row;
          text-align: left;
          max-width: 600px;
          margin: 0 auto;
          padding: 0 20px;
        }

        h1 {
          line-height: 50px;
          vertical-align: top;
        }
        .logo {
          height: 50px;
          vertical-align: top;
        }

        .sponsor {
          display: inline-block;
          float: right;
          margin-left: 55px;
          margin-top: 10px;
          font-size: 11px;
        }
        .sponsor img {
          height: 40px;
        }

        nav {
          border-top: 2px solid #EEE;
          border-bottom: 2px solid #EEE;
        }
        nav .container {
          max-width: 600px;
          margin: 0 auto;
          display: flex;
          flex-direction: row;
          align-items: center;
          justify-content: space-between;
          flex-wrap: nowrap;
        }
        nav .toolbar[disabled] {
          display: none;
        }
        nav .toolbar a {
          display: inline-block;
          outline: none;
          color: black;
          text-decoration: none;
          margin: 8px 0;
          margin-bottom: 12px;
          margin-right: 12px;
          padding: 8px 4px;
          padding-bottom: 0px;
          border-bottom: 2px solid white;
        }
        nav .toolbar a[selected] {
          border-bottom: 2px solid #222;
        }
        nav .toolbar a:hover {
          background: #EEEEEE;
        }
        nav .toolbar-right {
        }
        nav .toolbar-right > a.admin {
          color: #911;
        }

        /* Workaround for IE11 displaying <main> as inline */
        main {
          display: block;
          max-width: 600px;
          margin: 0 auto;
          padding: 0 20px;
        }

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

        footer {
          border-top: 1px solid #ccc;
          text-align: center;
        }

        /* Wide layout */
        @media (min-width: 460px) {
          header {
            flex-direction: row;
          }
        }
      `
    ];
  }

  constructor() {
    super();
    this.appTitle = 'RL AWS Lab';
  }

  render() {
    return html`
      <header>
        <h1>
          <span class="sponsor">
            sponsored by
            <a href="https://www.bitdefender.ro/" target="_blank">
              <img src="images/bitdefender_logo.png" alt="Bitdefender">
            </a>
          </span>
          <img src="images/rl_icon.png" class="logo" alt="" />
          RL
          <img src="images/aws_logo.png" style="margin-top: 8px;" class="logo" alt="" />
          Lab
        </h1>
        <nav><div class="container">
          ${ !this._showAdminMenu ? html`
            <div class="toolbar toolbar-left">
              <a ?selected="${this._page.name === 'student'}" href="/">Student</a>
            </div>
            <div class="toolbar toolbar-right">
              <a ?selected="${this._page.name === 'admin'}" class="admin" href="/admin">Admin</a>
            </div>
          ` : html`
            <div class="toolbar toolbar-left">
              <a ?selected="${this._page.subpage.name === 'index'}" href="/admin/">Dashboard</a>
              <a ?selected="${this._page.subpage.name === 'users'}" href="/admin/users">Users</a>
            </div>
            <div class="toolbar toolbar-right">
              <a class="admin" href="#" @click="${this._adminLogout}">Logout</a>
            </div>
          `}
        </div></nav>
      </header>

      <!-- Main content -->
      <main role="main" class="main-content">
        <rl-student-view class="page" title="Account Picker"
          ?active="${this._page.name === 'student'}"></rl-student-view>
        <rl-admin-view class="page" title="Administrator"
          ?active="${this._page.name === 'admin'}"></rl-admin-view>
        <login-view class="page" title="Login"
          ?active="${this._page.name === 'login'}"></login-view>
        <error404-view class="page" title="Error 404"
          ?active="${this._page.name === 'error404'}"></error404-view>
      </main>
    `;
  }

  firstUpdated() {
    installRouter((location) => store.dispatch(navigate(decodeURIComponent(location.pathname))));
    installOfflineWatcher((offline) => store.dispatch(updateOffline(offline)));
    installMediaQueryWatcher(`(min-width: 460px)`,
        (matches) => store.dispatch(updateLayout(matches)));
  }

  updated(changedProps) {
    if (changedProps.has('_page')) {
      const pageTitle = this.appTitle + ' - ' + this._page.title;
      updateMetadata({
        title: pageTitle,
        description: pageTitle
      });
    }
  }

  _adminLogout() {
    store.dispatch(logoutAdmin());
  }

  stateChanged(state) {
    this._page = state.app.page;
    this._adminAuth = state.admin.authStatus;
    this._showAdminMenu = (this._page.name == 'admin' && this._adminAuth);
    // this._pageTitle = state.app.page.title;
    this._offline = state.app.offline;
  }
}

window.customElements.define('rl-aws-app', RLAwsApp);

