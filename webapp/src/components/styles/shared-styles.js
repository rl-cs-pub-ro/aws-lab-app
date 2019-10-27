import { css } from 'lit-element';

export const SharedStyles = css`
  :host {
    display: block;
    box-sizing: border-box;
  }

  form.bordered input,
  form.bordered button {
    border: 2px solid #333;
    padding: 8px;
    background: white;
  }
  form.bordered button {
    font-weight: bold;
  }
  form.bordered button:hover {
    background: #AAA;
  }

  .error {
    color: #A00;
    font-weight: bold;
  }
  .success {
    color: #5A5;
  }
  .errorMessage {
    visibility: hidden; opacity: 0;
    padding: 0;
    height: 0; overflow: hidden;
    transition: visibility 0s, opacity 0.5s linear;
  }
  .errorMessage[visible] {
    visibility: visible; opacity: 1;
    padding: 10px 0;
    height: auto; overflow: initial;
    display: block;
  }
`;
