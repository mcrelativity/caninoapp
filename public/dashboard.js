const token = localStorage.getItem("token");

const profileForm = document.getElementById("profileForm");
const logForm = document.getElementById("logForm");
const logsList = document.getElementById("logsList");
const profileMessage = document.getElementById("profileMessage");
const refreshLogs = document.getElementById("refreshLogs");
const logoutButton = document.getElementById("logoutButton");

const showMessage = (element, message, isError = false) => {
  element.textContent = message;
  element.className = isError
    ? "mt-4 text-sm font-semibold text-red-500"
    : "mt-4 text-sm font-semibold text-mint-600";
};

const ensureAuth = () => {
  if (!token) {
    window.location.href = "/login";
  }
};

const apiFetch = async (url, options = {}) => {
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
    ...(options.headers || {})
  };

  const response = await fetch(url, { ...options, headers });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data.message || "Operación no completada";
    throw new Error(message);
  }
  return data;
};

const renderLogs = (logs) => {
  logsList.innerHTML = "";
  if (!logs.length) {
    logsList.innerHTML = "<p class=\"text-sm text-slate-500\">No hay registros aún.</p>";
    return;
  }

  logs.forEach((log) => {
    const card = document.createElement("article");
    card.className = "rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm";
    
    
    card.innerHTML = `
      <div class="flex items-start justify-between">
        <p class="text-xs font-semibold uppercase text-puppy-500">${log.CATEGORIA}</p>
        <div class="flex gap-3">
          <button class="btn-edit text-slate-400 transition hover:text-mint-500" title="Editar registro">✏️</button>
          <button class="btn-delete text-slate-400 transition hover:text-red-500" title="Eliminar registro">🗑️</button>
        </div>
      </div>
      <p class="mt-2 text-slate-700">${log.OBSERVACIONES || "Sin observaciones"}</p>
      <div class="mt-3 flex items-center justify-between text-xs text-slate-400">
        <span>${new Date(log.FECHA_REGISTRO).toLocaleDateString()}</span>
        <span>${log.GRAMOS_ALIMENTO_DIARIO ? log.GRAMOS_ALIMENTO_DIARIO + " g" : ""}</span>
      </div>
    `;

    
    const btnEdit = card.querySelector(".btn-edit");
    btnEdit.addEventListener("click", () => {
      
      logForm.categoria.value = log.CATEGORIA;
      logForm.gramos_alimento_diario.value = log.GRAMOS_ALIMENTO_DIARIO || "";
      logForm.observaciones.value = log.OBSERVACIONES || "";
      logForm.dataset.logId = log.ID; 
      
      
      const submitBtn = logForm.querySelector('button[type="submit"]');
      submitBtn.textContent = "Actualizar registro";
      submitBtn.classList.replace("bg-puppy-500", "bg-mint-500");
      submitBtn.classList.replace("hover:bg-puppy-600", "hover:bg-mint-600");
      
      window.scrollTo({ top: 0, behavior: 'smooth' }); 
    });

    
    const btnDelete = card.querySelector(".btn-delete");
    btnDelete.addEventListener("click", async () => {
      if (confirm("¿Estás seguro de que deseas eliminar esta bitácora?")) {
        try {
          await apiFetch(`/api/bitacoras/${log.ID}`, { method: "DELETE" });
          loadLogs(); 
        } catch (error) {
          alert("Error al eliminar: " + error.message);
        }
      }
    });

    logsList.appendChild(card);
  });
};

const loadLogs = async () => {
  try {
    const logs = await apiFetch("/api/bitacoras");
    renderLogs(logs);
  } catch (error) {
    logsList.innerHTML = `<p class="text-sm text-red-500">${error.message}</p>`;
  }
};

const loadProfile = async () => {
  try {
    const profiles = await apiFetch("/api/perfiles");
    if (profiles.length > 0) {
      const profile = profiles[0];
      profileForm.nombre.value = profile.NOMBRE;
      profileForm.raza.value = profile.RAZA || "";
      profileForm.fecha_nacimiento.value = profile.FECHA_NACIMIENTO
        ? new Date(profile.FECHA_NACIMIENTO).toISOString().slice(0, 10)
        : "";
      profileForm.peso_actual_kg.value = profile.PESO_ACTUAL_KG || "";
      profileForm.dataset.profileId = profile.ID;
    }
  } catch (error) {
    showMessage(profileMessage, error.message, true);
  }
};

profileForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const payload = {
    nombre: profileForm.nombre.value.trim(),
    raza: profileForm.raza.value.trim(),
    fecha_nacimiento: profileForm.fecha_nacimiento.value,
    peso_actual_kg: profileForm.peso_actual_kg.value
  };

  try {
    if (profileForm.dataset.profileId) {
      await apiFetch(`/api/perfiles/${profileForm.dataset.profileId}`, {
        method: "PUT",
        body: JSON.stringify(payload)
      });
      showMessage(profileMessage, "Perfil actualizado correctamente.");
    } else {
      const created = await apiFetch("/api/perfiles", {
        method: "POST",
        body: JSON.stringify(payload)
      });
      profileForm.dataset.profileId = created.id;
      showMessage(profileMessage, "Perfil creado correctamente.");
    }
  } catch (error) {
    showMessage(profileMessage, error.message, true);
  }
});

logForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const profileId = profileForm.dataset.profileId;
  if (!profileId) {
    return showMessage(profileMessage, "Primero guarda un perfil.", true);
  }

  const payload = {
    perfil_id: Number(profileId),
    categoria: logForm.categoria.value.trim(),
    gramos_alimento_diario: logForm.gramos_alimento_diario.value,
    observaciones: logForm.observaciones.value.trim()
  };

  const logId = logForm.dataset.logId; 

  try {
    if (logId) {
      
      await apiFetch(`/api/bitacoras/${logId}`, {
        method: "PUT",
        body: JSON.stringify(payload)
      });
      delete logForm.dataset.logId; 
      
      
      const submitBtn = logForm.querySelector('button[type="submit"]');
      submitBtn.textContent = "Crear registro";
      submitBtn.classList.replace("bg-mint-500", "bg-puppy-500");
      submitBtn.classList.replace("hover:bg-mint-600", "hover:bg-puppy-600");
    } else {
      
      await apiFetch("/api/bitacoras", {
        method: "POST",
        body: JSON.stringify(payload)
      });
    }
    
    logForm.reset();
    loadLogs();
  } catch (error) {
    logsList.innerHTML = `<p class="text-sm text-red-500">${error.message}</p>`;
  }
});

refreshLogs?.addEventListener("click", () => {
  loadLogs();
});

logoutButton?.addEventListener("click", () => {
  localStorage.removeItem("token");
  window.location.href = "/login";
});

ensureAuth();
loadProfile();
loadLogs();