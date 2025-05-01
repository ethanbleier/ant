import { setCurrentScene } from '../core/engine.js';
import { MenuScene }       from './menuScene.js';
import { api }             from '../core/api.js';

export class AuthScene {
  initialize(canvas, ctx) {
    this.canvas = canvas;
    this.ctx    = ctx;

    /* ---------- DOM overlay ---------- */
    this.root = document.createElement('div');
    this.root.className = 'auth-overlay';
    this.root.innerHTML = `
      <div class="auth-card">
        <h2>SIGN UP</h2>
        <form id="signupForm">
          <input required name="email" type="email"    placeholder="Email" />
          <input required name="pw"    type="password" placeholder="Password" />
          <button type="submit">CREATE</button>
        </form>

        <hr />

        <h2>LOG IN</h2>
        <form id="loginForm">
          <input required name="email" type="email"    placeholder="Email" />
          <input required name="pw"    type="password" placeholder="Password" />
          <button type="submit">ENTER</button>
        </form>

        <button id="googleBtn">GOOGLE LOGIN</button>
        <p><a href="#" id="backBtn">⟵ BACK</a></p>
      </div>
    `;
    document.body.appendChild(this.root);

    /* ---------- handlers ---------- */
    /* SIGN-UP */
    this.root.querySelector('#signupForm').addEventListener('submit', async e => {
      e.preventDefault();
      const { email, pw } = Object.fromEntries(new FormData(e.target));
      try {
        await api('/api/signup', {
          method: 'POST',
          body  : JSON.stringify({ email, password: pw })
        });
        alert('Account created! You are now logged in.');
        this.back();
      } catch (err) {
        alert(err.message);
      }
    });

    /* LOG-IN */
    this.root.querySelector('#loginForm').addEventListener('submit', async e => {
      e.preventDefault();
      const { email, pw } = Object.fromEntries(new FormData(e.target));
      try {
        await api('/api/login', {
          method: 'POST',
          body  : JSON.stringify({ email, password: pw })
        });
        alert('Logged in!');
        this.back();
      } catch (err) {
        alert(err.message);
      }
    });

    /* Google OAuth still stubbed */
    this.root.querySelector('#googleBtn').addEventListener('click', () => {
      // later: window.location.href = '/api/auth/google';
      alert('Google OAuth not wired yet.');
    });

    this.root.querySelector('#backBtn').addEventListener('click', e => {
      e.preventDefault();
      this.back();
    });
  }

  /* -------- helpers -------- */
  back() {
    this.destroy();
    const menu = new MenuScene();
    menu.initialize(this.canvas, this.ctx);
    setCurrentScene(menu);
  }

  destroy() { this.root.remove(); }
  update()  {}
  render()  {}
}
