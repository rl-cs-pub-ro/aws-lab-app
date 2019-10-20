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
`;
