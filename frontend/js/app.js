(function () {

  // =========================================================
  // API CONFIGURATION
  // =========================================================

  const API = EDUPATH_API_BASE.replace(/\/$/, "");

  // =========================================================
  // GET HTML ELEMENTS
  // =========================================================

  const goalSelect = document.getElementById("goal");
  const standardSelect = document.getElementById("standard");
  const stateInput = document.getElementById("state");
  const form = document.getElementById("planner-form");
  const formError = document.getElementById("form-error");
  const loading = document.getElementById("loading");
  const results = document.getElementById("results");

  // =========================================================
  // HELPER FUNCTIONS
  // =========================================================

  function showError(message) {
    if (formError) {
      formError.textContent = message;
      formError.style.display = "block";
    }
  }

  function clearError() {
    if (formError) {
      formError.textContent = "";
      formError.style.display = "none";
    }
  }

  function setLoading(isLoading) {
    if (loading) {
      loading.style.display = isLoading ? "block" : "none";
    }
  }

  function escapeHtml(value) {
    if (value === null || value === undefined) {
      return "";
    }

    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  async function fetchJson(url, options = {}, timeoutMs = 60000) {
    const controller = new AbortController();

    const timeout = setTimeout(function () {
      controller.abort();
    }, timeoutMs);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });

      if (!response.ok) {
        throw new Error(
          "Server returned HTTP " + response.status
        );
      }

      return await response.json();

    } catch (error) {

      if (error.name === "AbortError") {
        throw new Error(
          "The EDUPath server took too long to respond. Make sure Django is running."
        );
      }

      throw error;

    } finally {
      clearTimeout(timeout);
    }
  }

  // =========================================================
  // LOAD GOALS AND STANDARDS
  // =========================================================

  async function loadOptions() {

    if (!goalSelect || !standardSelect) {
      return;
    }

    clearError();

    goalSelect.innerHTML =
      '<option value="" disabled selected>Loading fields...</option>';

    standardSelect.innerHTML =
      '<option value="" disabled selected>Loading standards...</option>';

    try {

      const responses = await Promise.all([
        fetchJson(`${API}/api/goals/`, {}, 60000),
        fetchJson(`${API}/api/standards/`, {}, 60000)
      ]);

      const goals = responses[0];
      const standards = responses[1];

      // -------------------------------------------------------
      // GOALS
      // -------------------------------------------------------

      goalSelect.innerHTML =
        '<option value="" disabled selected>Choose a field</option>';

      if (Array.isArray(goals)) {

        goals.forEach(function (g) {

          const option = document.createElement("option");

          option.value = g.category;
          option.textContent =
            `${g.icon || ""} ${g.title}`;

          goalSelect.appendChild(option);

        });

      }

      // -------------------------------------------------------
      // STANDARDS
      // -------------------------------------------------------

      standardSelect.innerHTML =
        '<option value="" disabled selected>Choose your current standard</option>';

      if (Array.isArray(standards)) {

        standards.forEach(function (s) {

          const option = document.createElement("option");

          option.value = s.code;
          option.textContent = s.label;

          standardSelect.appendChild(option);

        });

      }

    } catch (error) {

      console.error("Failed to load options:", error);

      showError(
        error.message ||
        "Unable to connect to the EDUPath server."
      );

      goalSelect.innerHTML =
        '<option value="" disabled selected>Choose a field</option>';

      standardSelect.innerHTML =
        '<option value="" disabled selected>Choose your current standard</option>';
    }
  }

  // =========================================================
  // LOCATION
  // =========================================================

  function getUserLocation() {

    return new Promise(function (resolve) {

      if (!navigator.geolocation) {
        resolve(null);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        function (position) {

          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });

        },
        function () {

          resolve(null);

        },
        {
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 300000
        }
      );

    });

  }

  // =========================================================
  // RENDER ROADMAP
  // =========================================================

  function renderRoadmap(roadmap) {

    if (!roadmap) {
      return "";
    }

    let items = [];

    if (Array.isArray(roadmap)) {
      items = roadmap;
    } else if (Array.isArray(roadmap.steps)) {
      items = roadmap.steps;
    } else if (Array.isArray(roadmap.roadmap)) {
      items = roadmap.roadmap;
    }

    if (!items.length) {
      return "";
    }

    return `
      <section class="result-section roadmap-section">

        <h2>Career Roadmap</h2>

        <div class="roadmap-list">

          ${items.map(function (item, index) {

            const title =
              item.title ||
              item.name ||
              item.step ||
              `Step ${index + 1}`;

            const description =
              item.description ||
              item.summary ||
              item.details ||
              "";

            return `
              <div class="roadmap-item">

                <div class="roadmap-number">
                  ${index + 1}
                </div>

                <div class="roadmap-content">

                  <h3>
                    ${escapeHtml(title)}
                  </h3>

                  ${
                    description
                      ? `<p>${escapeHtml(description)}</p>`
                      : ""
                  }

                </div>

              </div>
            `;

          }).join("")}

        </div>

      </section>
    `;

  }

  // =========================================================
  // RENDER COLLEGES
  // =========================================================

  function renderColleges(colleges) {

    if (!Array.isArray(colleges) || !colleges.length) {
      return "";
    }

    return `
      <section class="result-section colleges-section">

        <h2>Recommended Colleges</h2>

        <div class="college-grid">

          ${colleges.map(function (college) {

            const name =
              college.name ||
              college.college_name ||
              "College";

            const location =
              college.location ||
              college.city ||
              college.address ||
              "";

            const state =
              college.state ||
              "";

            const website =
              college.website ||
              college.url ||
              "";

            return `
              <article class="college-card">

                <h3>
                  ${escapeHtml(name)}
                </h3>

                ${
                  location
                    ? `<p>${escapeHtml(location)}</p>`
                    : ""
                }

                ${
                  state
                    ? `<p>${escapeHtml(state)}</p>`
                    : ""
                }

                ${
                  website
                    ? `
                      <a
                        href="${escapeHtml(website)}"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Visit Website
                      </a>
                    `
                    : ""
                }

              </article>
            `;

          }).join("")}

        </div>

      </section>
    `;

  }

  // =========================================================
  // RENDER SCHOLARSHIPS
  // =========================================================

  function renderScholarships(scholarships) {

    if (!Array.isArray(scholarships) || !scholarships.length) {
      return "";
    }

    return `
      <section class="result-section scholarships-section">

        <h2>Scholarships</h2>

        <div class="scholarship-grid">

          ${scholarships.map(function (scholarship) {

            const name =
              scholarship.name ||
              scholarship.title ||
              "Scholarship";

            const description =
              scholarship.description ||
              scholarship.summary ||
              "";

            const eligibility =
              scholarship.eligibility ||
              "";

            const amount =
              scholarship.amount ||
              scholarship.value ||
              "";

            const website =
              scholarship.website ||
              scholarship.url ||
              "";

            return `
              <article class="scholarship-card">

                <h3>
                  ${escapeHtml(name)}
                </h3>

                ${
                  description
                    ? `<p>${escapeHtml(description)}</p>`
                    : ""
                }

                ${
                  eligibility
                    ? `
                      <p>
                        <strong>Eligibility:</strong>
                        ${escapeHtml(eligibility)}
                      </p>
                    `
                    : ""
                }

                ${
                  amount
                    ? `
                      <p>
                        <strong>Amount:</strong>
                        ${escapeHtml(amount)}
                      </p>
                    `
                    : ""
                }

                ${
                  website
                    ? `
                      <a
                        href="${escapeHtml(website)}"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Learn More
                      </a>
                    `
                    : ""
                }

              </article>
            `;

          }).join("")}

        </div>

      </section>
    `;

  }

  // =========================================================
  // RENDER GENERAL RESULTS
  // =========================================================

  function renderResults(data) {

    if (!results) {
      return;
    }

    const roadmap =
      data.roadmap ||
      data.roadmap_steps ||
      data.steps ||
      [];

    const colleges =
      data.colleges ||
      data.recommended_colleges ||
      [];

    const scholarships =
      data.scholarships ||
      data.recommended_scholarships ||
      [];

    let html = "";

    html += renderRoadmap(roadmap);

    html += renderColleges(colleges);

    html += renderScholarships(scholarships);

    // -------------------------------------------------------
    // FALLBACK MESSAGE
    // -------------------------------------------------------

    if (!html) {

      html = `
        <section class="result-section">

          <h2>Your EDUPath Results</h2>

          <p>
            Your recommendations were generated successfully.
          </p>

        </section>
      `;

    }

    results.innerHTML = html;

    results.style.display = "block";

    try {
      results.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    } catch (error) {
      results.scrollIntoView();
    }

  }

  // =========================================================
  // SUBMIT RECOMMENDATION REQUEST
  // =========================================================

  async function generateRecommendations(event) {

    event.preventDefault();

    clearError();

    if (!goalSelect || !standardSelect) {
      return;
    }

    const goal = goalSelect.value;
    const standard = standardSelect.value;
    const state =
      stateInput && stateInput.value
        ? stateInput.value.trim()
        : "";

    // -------------------------------------------------------
    // VALIDATION
    // -------------------------------------------------------

    if (!goal) {

      showError("Please choose a career field.");

      goalSelect.focus();

      return;
    }

    if (!standard) {

      showError(
        "Please choose your current standard."
      );

      standardSelect.focus();

      return;
    }

    if (!state) {

      showError("Please enter your state.");

      if (stateInput) {
        stateInput.focus();
      }

      return;
    }

    // -------------------------------------------------------
    // LOADING
    // -------------------------------------------------------

    setLoading(true);

    if (results) {
      results.style.display = "none";
      results.innerHTML = "";
    }

    try {

      // -----------------------------------------------------
      // GET OPTIONAL USER LOCATION
      // -----------------------------------------------------

      const location =
        await getUserLocation();

      // -----------------------------------------------------
      // BUILD REQUEST BODY
      // -----------------------------------------------------

      const payload = {
        goal: goal,
        standard: standard,
        state: state
      };

      if (location) {

        payload.lat = location.lat;
        payload.lng = location.lng;

      }

      console.log(
        "Sending recommendation request:",
        payload
      );

      // -----------------------------------------------------
      // CALL DJANGO API
      // -----------------------------------------------------

      const data = await fetchJson(
        `${API}/api/recommend/`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json"
          },

          body: JSON.stringify(payload)
        },
        30000
      );

      console.log(
        "Recommendation response:",
        data
      );

      // -----------------------------------------------------
      // DISPLAY RESULTS
      // -----------------------------------------------------

      renderResults(data);

    } catch (error) {

      console.error(
        "Recommendation request failed:",
        error
      );

      showError(
        error.message ||
        "Unable to generate recommendations. Please try again."
      );

    } finally {

      setLoading(false);

    }

  }

  // =========================================================
  // FORM EVENT
  // =========================================================

  if (form) {

    form.addEventListener(
      "submit",
      generateRecommendations
    );

  }

  // =========================================================
  // INITIALIZE APPLICATION
  // =========================================================

  document.addEventListener(
    "DOMContentLoaded",
    function () {

      loadOptions();

    }
  );

})();