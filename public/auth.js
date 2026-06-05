const messageEl = document.querySelector("#loginMessage, #registerMessage, #resetMessage");

const showMessage = (text, isError = false) => {
  if (!messageEl) return;
  messageEl.textContent = text;
  messageEl.className = isError
    ? "mt-4 text-sm font-semibold text-red-500"
    : "mt-4 text-sm font-semibold text-mint-600";
};

const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const validatePassword = (password) => /^(?=.*[A-Z])(?=.*\d).{8,}$/.test(password);

const getPasswordStrength = (password) => {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  return score;
};

const updateStrengthUI = (bar, text, password) => {
  if (!bar || !text) return;
  const score = getPasswordStrength(password);
  const labels = ["Muy débil", "Débil", "Aceptable", "Fuerte", "Excelente"];
  const colors = ["bg-red-400", "bg-orange-400", "bg-yellow-400", "bg-mint-400", "bg-mint-600"];
  const widths = ["w-1/5", "w-2/5", "w-3/5", "w-4/5", "w-full"];
  const idx = Math.min(score, 4);
  bar.className = `h-2 rounded-full transition-all ${colors[idx]} ${widths[idx]}`;
  text.textContent = `Fuerza: ${labels[idx]}`;
};

const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
const resetForm = document.getElementById("resetForm");
const registerStrengthBar = document.getElementById("registerStrengthBar");
const registerStrengthText = document.getElementById("registerStrengthText");
const resetStrengthBar = document.getElementById("resetStrengthBar");
const resetStrengthText = document.getElementById("resetStrengthText");

if (loginForm) {
  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(loginForm);
    const email = String(formData.get("email") || "").trim();
    const password = String(formData.get("password") || "");

    if (!validateEmail(email)) {
      return showMessage("Ingresa un email válido.", true);
    }

    if (!validatePassword(password)) {
      return showMessage("La contraseña debe tener 8 caracteres, una mayúscula y un número.", true);
    }

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();

      if (!response.ok) {
        return showMessage(data.message || "No fue posible iniciar sesión.", true);
      }

      localStorage.setItem("token", data.token);
      showMessage("Sesión iniciada. Redirigiendo...");
      setTimeout(() => (window.location.href = "/dashboard"), 1200);
    } catch (error) {
      showMessage("Error de conexión. Intenta nuevamente.", true);
    }
  });
}

if (registerForm) {
  const registerPasswordInput = registerForm.querySelector("input[name='password']");
  registerPasswordInput?.addEventListener("input", (event) => {
    updateStrengthUI(registerStrengthBar, registerStrengthText, event.target.value);
  });

  registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(registerForm);
    const email = String(formData.get("email") || "").trim();
    const password = String(formData.get("password") || "");
    const confirmPassword = String(formData.get("confirmPassword") || "");

    if (!validateEmail(email)) {
      return showMessage("Ingresa un email válido.", true);
    }

    if (!validatePassword(password)) {
      return showMessage("La contraseña debe tener 8 caracteres, una mayúscula y un número.", true);
    }

    if (password !== confirmPassword) {
      return showMessage("Las contraseñas no coinciden.", true);
    }

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();

      if (!response.ok) {
        return showMessage(data.message || "No fue posible registrarse.", true);
      }

      showMessage("Cuenta creada. Inicia sesión para continuar.");
      setTimeout(() => (window.location.href = "/login"), 1200);
    } catch (error) {
      showMessage("Error de conexión. Intenta nuevamente.", true);
    }
  });
}

if (resetForm) {
  const resetPasswordInput = resetForm.querySelector("input[name='password']");
  resetPasswordInput?.addEventListener("input", (event) => {
    updateStrengthUI(resetStrengthBar, resetStrengthText, event.target.value);
  });

  resetForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(resetForm);
    const email = String(formData.get("email") || "").trim();
    const password = String(formData.get("password") || "");
    const confirmPassword = String(formData.get("confirmPassword") || "");

    if (!validateEmail(email)) {
      return showMessage("Ingresa un email válido.", true);
    }

    if (!validatePassword(password)) {
      return showMessage("La contraseña debe tener 8 caracteres, una mayúscula y un número.", true);
    }

    if (password !== confirmPassword) {
      return showMessage("Las contraseñas no coinciden.", true);
    }

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();

      if (!response.ok) {
        return showMessage(data.message || "No fue posible restablecer la contraseña.", true);
      }

      showMessage("Contraseña actualizada correctamente. Inicia sesión para continuar.");
      setTimeout(() => (window.location.href = "/login"), 1500);
    } catch (error) {
      showMessage("Error de conexión. Intenta nuevamente.", true);
    }
  });
}
