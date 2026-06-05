const messageEl = document.querySelector("#loginMessage, #registerMessage");

const showMessage = (text, isError = false) => {
  if (!messageEl) return;
  messageEl.textContent = text;
  messageEl.className = isError
    ? "mt-4 text-sm font-semibold text-red-500"
    : "mt-4 text-sm font-semibold text-mint-600";
};

const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const validatePassword = (password) => /^(?=.*[A-Z])(?=.*\d).{8,}$/.test(password);

const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");

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
      setTimeout(() => (window.location.href = "/"), 1200);
    } catch (error) {
      showMessage("Error de conexión. Intenta nuevamente.", true);
    }
  });
}

if (registerForm) {
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
