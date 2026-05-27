/* ══════════════════════════════════════
   MUNDOSUBS — auth.js
   ══════════════════════════════════════ */

// ── TAB SWITCH ────────────────────────────────────────────────────
function switchTab(tab) {
  const isLogin = tab === 'login';

  document.getElementById('tabLogin').classList.toggle('active', isLogin);
  document.getElementById('tabRegister').classList.toggle('active', !isLogin);
  document.getElementById('formLogin').classList.toggle('active', isLogin);
  document.getElementById('formRegister').classList.toggle('active', !isLogin);

  // Clear all errors on switch
  document.querySelectorAll('.field-error').forEach(el => el.textContent = '');
  document.querySelectorAll('input').forEach(el => {
    el.classList.remove('error', 'ok');
  });
}

// ── SHOW / HIDE PASSWORD ──────────────────────────────────────────
function togglePw(inputId, btn) {
  const input = document.getElementById(inputId);
  const isText = input.type === 'text';
  input.type = isText ? 'password' : 'text';

  // swap icon
  btn.innerHTML = isText
    ? `<svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`
    : `<svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`;
}

// ── PASSWORD STRENGTH ─────────────────────────────────────────────
function checkStrength(value) {
  const fill  = document.getElementById('strengthFill');
  const label = document.getElementById('strengthLabel');
  if (!value) { fill.style.width = '0%'; label.textContent = ''; return; }

  let score = 0;
  if (value.length >= 8)  score++;
  if (value.length >= 12) score++;
  if (/[A-Z]/.test(value)) score++;
  if (/[0-9]/.test(value)) score++;
  if (/[^A-Za-z0-9]/.test(value)) score++;

  const levels = [
    { pct: '20%', color: '#c0392b', text: 'Muy débil',  css: '#c0392b' },
    { pct: '40%', color: '#d4671a', text: 'Débil',      css: '#d4671a' },
    { pct: '60%', color: '#b8a118', text: 'Regular',    css: '#b8a118' },
    { pct: '80%', color: '#1e8c56', text: 'Fuerte',     css: '#1e8c56' },
    { pct: '100%',color: '#1a6e42', text: 'Muy fuerte', css: '#1a6e42' },
  ];
  const lvl = levels[Math.min(score - 1, 4)];
  if (!lvl) { fill.style.width = '0%'; label.textContent = ''; return; }

  fill.style.width      = lvl.pct;
  fill.style.background = lvl.color;
  label.textContent     = lvl.text;
  label.style.color     = lvl.css;
}

// ── LIVE EMAIL CHECK ──────────────────────────────────────────────
function checkEmailLive(input) {
  const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value);
  input.classList.toggle('ok',    ok && input.value.length > 0);
  input.classList.toggle('error', !ok && input.value.length > 0);
}

// ── VALIDATION HELPERS ────────────────────────────────────────────
function setErr(id, msg) {
  const el = document.getElementById(id);
  if (el) el.textContent = msg;
}
function clearErr(id) { setErr(id, ''); }

function markField(inputId, isOk) {
  const el = document.getElementById(inputId);
  if (!el) return;
  el.classList.toggle('error', !isOk);
  el.classList.toggle('ok',    isOk);
}

function validateEmail(val) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());
}

// ── LOGIN HANDLER ─────────────────────────────────────────────────
function handleLogin(e) {
  e.preventDefault();
  let valid = true;

  const email = document.getElementById('loginEmail').value.trim();
  const pass  = document.getElementById('loginPass').value;

  clearErr('loginEmailErr'); clearErr('loginPassErr');

  if (!email) {
    setErr('loginEmailErr', 'El correo es obligatorio.');
    markField('loginEmail', false); valid = false;
  } else if (!validateEmail(email)) {
    setErr('loginEmailErr', 'Ingresa un correo válido.');
    markField('loginEmail', false); valid = false;
  } else {
    markField('loginEmail', true);
  }

  if (!pass) {
    setErr('loginPassErr', 'La contraseña es obligatoria.');
    markField('loginPass', false); valid = false;
  } else if (pass.length < 6) {
    setErr('loginPassErr', 'Mínimo 6 caracteres.');
    markField('loginPass', false); valid = false;
  } else {
    markField('loginPass', true);
  }

  if (!valid) return;

  // Simulate request
  setLoading('btnLogin', true);
  setTimeout(() => {
    setLoading('btnLogin', false);
    // Demo: always succeed
    toast('✅ Sesión iniciada correctamente', 'success');
    setTimeout(() => { window.location.href = 'index.html'; }, 1200);
  }, 1600);
}

// ── REGISTER HANDLER ──────────────────────────────────────────────
function handleRegister(e) {
  e.preventDefault();
  let valid = true;

  const nombre  = document.getElementById('regNombre').value.trim();
  const apellido= document.getElementById('regApellido').value.trim();
  const email   = document.getElementById('regEmail').value.trim();
  const pass    = document.getElementById('regPass').value;
  const conf    = document.getElementById('regPassConf').value;
  const terms   = document.getElementById('regTerms').checked;

  // Clear
  ['regNombreErr','regApellidoErr','regEmailErr','regPassErr','regPassConfErr','regTermsErr']
    .forEach(clearErr);

  if (!nombre) {
    setErr('regNombreErr', 'El nombre es obligatorio.');
    markField('regNombre', false); valid = false;
  } else { markField('regNombre', true); }

  if (!apellido) {
    setErr('regApellidoErr', 'El apellido es obligatorio.');
    markField('regApellido', false); valid = false;
  } else { markField('regApellido', true); }

  if (!email) {
    setErr('regEmailErr', 'El correo es obligatorio.');
    markField('regEmail', false); valid = false;
  } else if (!validateEmail(email)) {
    setErr('regEmailErr', 'Ingresa un correo válido.');
    markField('regEmail', false); valid = false;
  } else { markField('regEmail', true); }

  if (!pass) {
    setErr('regPassErr', 'La contraseña es obligatoria.');
    markField('regPass', false); valid = false;
  } else if (pass.length < 8) {
    setErr('regPassErr', 'Mínimo 8 caracteres.');
    markField('regPass', false); valid = false;
  } else { markField('regPass', true); }

  if (!conf) {
    setErr('regPassConfErr', 'Confirma tu contraseña.');
    markField('regPassConf', false); valid = false;
  } else if (conf !== pass) {
    setErr('regPassConfErr', 'Las contraseñas no coinciden.');
    markField('regPassConf', false); valid = false;
  } else { markField('regPassConf', true); }

  if (!terms) {
    setErr('regTermsErr', 'Debes aceptar los términos para continuar.');
    valid = false;
  }

  if (!valid) return;

  setLoading('btnRegister', true);
  setTimeout(() => {
    setLoading('btnRegister', false);
    toast('🎉 ¡Cuenta creada! Bienvenido a MundoSubs', 'success');
    setTimeout(() => { window.location.href = 'index.html'; }, 1400);
  }, 1800);
}

// ── GOOGLE HANDLER ────────────────────────────────────────────────
function handleGoogle() {
  toast('🔗 Redirigiendo a Google...', '');
  // Here you would initiate the real OAuth flow
  setTimeout(() => {
    toast('✅ Conectado con Google', 'success');
  }, 1500);
}

// ── LOADING STATE ─────────────────────────────────────────────────
function setLoading(btnId, on) {
  const btn    = document.getElementById(btnId);
  if (!btn) return;
  const text   = btn.querySelector('.btn-text');
  const loader = btn.querySelector('.btn-loader');
  btn.disabled       = on;
  text.style.display  = on ? 'none' : '';
  loader.style.display = on ? 'flex' : 'none';
}

// ── TOAST ─────────────────────────────────────────────────────────
let toastTimer;
function toast(msg, type = '') {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className   = `toast${type ? ' ' + type : ''} show`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 3000);
}

// ── FORGOT PASSWORD ───────────────────────────────────────────────
function showForgot(e) {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value.trim();
  if (email) document.getElementById('forgotEmail').value = email;
  document.getElementById('forgotOverlay').classList.add('open');
}

function closeForgot(e) {
  if (!e || e.target === document.getElementById('forgotOverlay'))
    document.getElementById('forgotOverlay').classList.remove('open');
}

function sendReset() {
  const email = document.getElementById('forgotEmail').value.trim();
  if (!validateEmail(email)) {
    toast('Ingresa un correo válido', 'error'); return;
  }
  closeForgot();
  toast(`📧 Enlace enviado a ${email}`, 'success');
}

// ── KEYBOARD ──────────────────────────────────────────────────────
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeForgot();
});