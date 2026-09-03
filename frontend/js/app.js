(function () {
  const API = EDUPATH_API_BASE.replace(/\/$/, "");

  const goalSelect = document.getElementById("goal");
  const standardSelect = document.getElementById("standard");
  const stateInput = document.getElementById("state");
  const form = document.getElementById("planner-form");
  const formError = document.getElementById("form-error");
  const useLocationBtn = document.getElementById("use-location");
  const locationStatus = document.getElementById("location-status");
  const loadingSection = document.getElementById("loading");
  const resultsSection = document.getElementById("results");

  let coords = null;

  // ---------- load dropdown data ----------

  async function loadOptions() {
    try {
      const [goalsRes, standardsRes] = await Promise.all([
        fetch(`${API}/api/goals/`),
        fetch(`${API}/api/standards/`),
      ]);
      if (!goalsRes.ok || !standardsRes.ok) throw new Error("bad response");
      const goals = await goalsRes.json();
      const standards = await standardsRes.json();

      goals.forEach((g) => {
        const opt = document.createElement("option");
        opt.value = g.category;
        opt.textContent = `${g.icon}  ${g.title}`;
        goalSelect.appendChild(opt);
      });

      standards.forEach((s) => {
        const opt = document.createElement("option");
        opt.value = s.code;
        opt.textContent = s.label;
        standardSelect.appendChild(opt);
      });
    } catch (err) {
      formError.textContent =
        "Couldn't reach the EDUPath server. Check that the backend is running and reachable, then reload.";
    }
  }

  // ---------- geolocation ----------

  useLocationBtn.addEventListener("click", () => {
    if (!("geolocation" in navigator)) {
      locationStatus.textContent = "Location isn't available in this browser.";
      return;
    }
    locationStatus.textContent = "Locating…";
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        locationStatus.textContent = "Location added — nearby colleges will be included.";
      },
      () => {
        coords = null;
        locationStatus.textContent = "Couldn't get your location. You can still search without it.";
      },
      { timeout: 8000 }
    );
  });

  // ---------- submit ----------

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    formError.textContent = "";

    const goal = goalSelect.value;
    const standard = standardSelect.value;

    if (!goal || !standard) {
      formError.textContent = "Choose both a goal and your current standard to continue.";
      return;
    }

    const payload = { goal, standard, state: stateInput.value.trim() };
    if (coords) {
      payload.lat = coords.lat;
      payload.lng = coords.lng;
    }

    resultsSection.hidden = true;
    loadingSection.hidden = false;

    try {
      const res = await fetch(`${API}/api/recommend/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.error || "Something went wrong. Please try again.");
      }
      const data = await res.json();
      renderResults(data);
    } catch (err) {
      formError.textContent = err.message || "Something went wrong. Please try again.";
    } finally {
      loadingSection.hidden = true;
    }
  });

  // ---------- render ----------

  const STANDARD_LABELS = {
    CLASS_8: "Class 8",
    CLASS_10: "Class 10",
    CLASS_12: "Class 12",
    UNDERGRAD: "Undergraduate",
    POSTGRAD: "Postgraduate / Working professional",
  };

  function renderResults(data) {
    document.getElementById("results-icon").textContent = data.goal.icon || "🎯";
    document.getElementById("results-title").textContent = `Your path to ${data.goal.title}`;
    document.getElementById("results-sub").textContent =
      `Starting point: ${STANDARD_LABELS[data.standard] || data.standard}`;

    renderRoadmap(data.roadmap);
    renderScholarships(data.scholarships);
    renderColleges("college-list", data.colleges, false);

    const nearbyPanel = document.getElementById("nearby-panel");
    if (data.nearby_colleges && data.nearby_colleges.length) {
      nearbyPanel.hidden = false;
      renderColleges("nearby-list", data.nearby_colleges, true);
    } else {
      nearbyPanel.hidden = true;
    }

    resultsSection.hidden = false;
    resultsSection.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function renderRoadmap(steps) {
    const list = document.getElementById("roadmap-list");
    list.innerHTML = "";
    if (!steps.length) {
      list.innerHTML = '<p class="empty-note">No roadmap steps found for this combination yet.</p>';
      return;
    }
    steps.forEach((step) => {
      const li = document.createElement("li");
      li.innerHTML = `
        <span class="step-standard">${STANDARD_LABELS[step.standard] || step.standard}</span>
        <p class="step-title">${escapeHTML(step.title)}</p>
        <p class="step-desc">${escapeHTML(step.description)}</p>
        ${step.duration ? `<p class="step-duration">Typical duration: ${escapeHTML(step.duration)}</p>` : ""}
      `;
      list.appendChild(li);
    });
  }

  function renderScholarships(items) {
    const wrap = document.getElementById("scholarship-list");
    wrap.innerHTML = "";
    if (!items.length) {
      wrap.innerHTML = '<p class="empty-note">No matching scholarships found — try a different standard.</p>';
      return;
    }
    items.forEach((s) => {
      const div = document.createElement("div");
      div.className = "card-item";
      div.innerHTML = `
        <h4>${escapeHTML(s.name)}</h4>
        ${s.description ? `<p>${escapeHTML(s.description)}</p>` : ""}
        <div class="meta">
          ${s.provider ? `<span>${escapeHTML(s.provider)}</span>` : ""}
          ${s.amount ? `<span class="badge moss">${escapeHTML(s.amount)}</span>` : ""}
        </div>
        ${s.official_link ? `<p><a href="${escapeAttr(s.official_link)}" target="_blank" rel="noopener noreferrer">Official page ↗</a></p>` : ""}
      `;
      wrap.appendChild(div);
    });
  }

  function renderColleges(containerId, items, showDistance) {
    const wrap = document.getElementById(containerId);
    wrap.innerHTML = "";
    if (!items.length) {
      wrap.innerHTML = '<p class="empty-note">No colleges found for this field yet.</p>';
      return;
    }
    items.forEach((c) => {
      const div = document.createElement("div");
      div.className = "card-item";
      div.innerHTML = `
        <h4>${escapeHTML(c.name)}</h4>
        <p>${escapeHTML(c.city)}, ${escapeHTML(c.state)}</p>
        <div class="meta">
          <span class="badge clay">${escapeHTML(c.college_type)}</span>
          <span>★ ${c.rating}</span>
          ${showDistance && c.distance_km != null ? `<span>${c.distance_km} km away</span>` : ""}
        </div>
        ${c.website ? `<p><a href="${escapeAttr(c.website)}" target="_blank" rel="noopener noreferrer">Visit website ↗</a></p>` : ""}
      `;
      wrap.appendChild(div);
    });
  }

  function escapeHTML(str) {
    const div = document.createElement("div");
    div.textContent = str == null ? "" : String(str);
    return div.innerHTML;
  }

  function escapeAttr(str) {
    return escapeHTML(str).replace(/"/g, "&quot;");
  }

  loadOptions();
})();
