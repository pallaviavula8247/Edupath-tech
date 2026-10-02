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

  const useLocationBtn = document.getElementById("use-location");
  const locationStatus = document.getElementById("location-status");

  const loadingSection = document.getElementById("loading");
  const resultsSection = document.getElementById("results");

  let coords = null;


  // =========================================================
  // STANDARD LABELS
  // =========================================================

  const STANDARD_LABELS = {
    CLASS_8: "Class 8",
    CLASS_10: "Class 10",
    CLASS_12: "Class 12",
    UNDERGRAD: "Undergraduate",
    POSTGRAD: "Postgraduate / Working professional"
  };


  // =========================================================
  // LOAD GOALS AND STANDARDS
  // =========================================================

  async function loadOptions() {

    try {

      if (formError) {
        formError.textContent = "";
        formError.style.display = "none";
      }

      console.log("=================================");
      console.log("EDUPath API:", API);
      console.log("Loading goals...");
      console.log("Loading standards...");
      console.log("=================================");

      // -------------------------------------------------------
      // 60 SECOND TIMEOUT
      // -------------------------------------------------------

      const controller = new AbortController();

      const timeout = setTimeout(function () {
        controller.abort();
      }, 60000);


      // -------------------------------------------------------
      // CALL BOTH APIs
      // -------------------------------------------------------

      const [goalsRes, standardsRes] = await Promise.all([

        fetch(`${API}/api/goals/`, {
          method: "GET",
          signal: controller.signal
        }),

        fetch(`${API}/api/standards/`, {
          method: "GET",
          signal: controller.signal
        })

      ]);


      clearTimeout(timeout);


      console.log("Goals status:", goalsRes.status);
      console.log("Standards status:", standardsRes.status);


      // -------------------------------------------------------
      // CHECK GOALS API
      // -------------------------------------------------------

      if (!goalsRes.ok) {
        throw new Error(
          `Goals API returned ${goalsRes.status}`
        );
      }


      // -------------------------------------------------------
      // CHECK STANDARDS API
      // -------------------------------------------------------

      if (!standardsRes.ok) {
        throw new Error(
          `Standards API returned ${standardsRes.status}`
        );
      }


      // -------------------------------------------------------
      // CONVERT RESPONSE TO JSON
      // -------------------------------------------------------

      const goals = await goalsRes.json();
      const standards = await standardsRes.json();

      console.log("Goals received:", goals);
      console.log("Standards received:", standards);


      // =======================================================
      // CLEAR OLD OPTIONS
      // =======================================================

      goalSelect.innerHTML =
        '<option value="" disabled selected>Choose a field</option>';

      standardSelect.innerHTML =
        '<option value="" disabled selected>Choose your current standard</option>';


      // =======================================================
      // LOAD GOALS
      // =======================================================

      if (Array.isArray(goals) && goals.length > 0) {

        goals.forEach(function (g) {

          const option = document.createElement("option");

          option.value = g.category;

          option.textContent =
            `${g.icon || ""} ${g.title}`;

          goalSelect.appendChild(option);

        });

      } else {

        console.warn("No goals returned from API.");

      }


      // =======================================================
      // LOAD STANDARDS
      // =======================================================

      if (Array.isArray(standards) && standards.length > 0) {

        standards.forEach(function (s) {

          const option = document.createElement("option");

          option.value = s.code;

          option.textContent =
            s.label ||
            STANDARD_LABELS[s.code] ||
            s.code;

          standardSelect.appendChild(option);

        });

      } else {

        console.warn("No standards returned from API.");

      }


      console.log("Dropdowns loaded successfully.");

    }

    catch (err) {

      console.error(
        "Dropdown loading error:",
        err
      );


      if (err.name === "AbortError") {

        if (formError) {
          formError.textContent =
            "The EDUPath server took too long to respond. Please try again.";
          formError.style.display = "block";
        }

      } else {

        if (formError) {
          formError.textContent =
            `Couldn't load education options. ${err.message}`;
          formError.style.display = "block";
        }

      }

    }

  }


  // =========================================================
  // USE MY LOCATION
  // =========================================================

  if (useLocationBtn) {

    useLocationBtn.addEventListener(
      "click",
      function () {

        if (!("geolocation" in navigator)) {

          if (locationStatus) {
            locationStatus.textContent =
              "Location isn't available in this browser.";
          }

          return;

        }


        if (locationStatus) {
          locationStatus.textContent =
            "Locating...";
        }


        navigator.geolocation.getCurrentPosition(

          function (position) {

            coords = {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            };


            if (locationStatus) {
              locationStatus.textContent =
                "Location added — nearby colleges will be included.";
            }


            console.log(
              "Location:",
              coords
            );

          },


          function (error) {

            coords = null;


            console.error(
              "Location error:",
              error
            );


            if (locationStatus) {
              locationStatus.textContent =
                "Couldn't get your location. You can still search without it.";
            }

          },


          {
            enableHighAccuracy: true,
            timeout: 8000,
            maximumAge: 0
          }

        );

      }
    );

  }


  // =========================================================
  // FORM SUBMISSION
  // =========================================================

  if (form) {

    form.addEventListener(
      "submit",
      async function (e) {

        e.preventDefault();


        // -----------------------------------------------------
        // CLEAR PREVIOUS ERROR
        // -----------------------------------------------------

        if (formError) {
          formError.textContent = "";
          formError.style.display = "none";
        }


        // -----------------------------------------------------
        // GET VALUES
        // -----------------------------------------------------

        const goal =
          goalSelect ? goalSelect.value : "";

        const standard =
          standardSelect ? standardSelect.value : "";

        const state =
          stateInput
            ? stateInput.value.trim()
            : "";


        // =====================================================
        // VALIDATION
        // =====================================================

        if (!goal) {

          if (formError) {
            formError.textContent =
              "Please choose a field.";
            formError.style.display = "block";
          }

          if (goalSelect) {
            goalSelect.focus();
          }

          return;

        }


        if (!standard) {

          if (formError) {
            formError.textContent =
              "Please choose your current standard.";
            formError.style.display = "block";
          }

          if (standardSelect) {
            standardSelect.focus();
          }

          return;

        }


        // =====================================================
        // CREATE REQUEST DATA
        // =====================================================

        const payload = {

          goal: goal,

          standard: standard,

          state: state

        };


        // -----------------------------------------------------
        // ADD LOCATION IF AVAILABLE
        // -----------------------------------------------------

        if (coords) {

          payload.lat = coords.lat;

          payload.lng = coords.lng;

        }


        console.log(
          "Sending recommendation request:"
        );

        console.log(payload);


        // =====================================================
        // SHOW LOADING
        // =====================================================

        if (resultsSection) {
          resultsSection.hidden = true;
        }

        if (loadingSection) {
          loadingSection.hidden = false;
        }


        try {

          // ===================================================
          // 60 SECOND TIMEOUT
          // ===================================================

          const controller =
            new AbortController();

          const timeout =
            setTimeout(function () {

              controller.abort();

            }, 60000);


          // ===================================================
          // CALL RECOMMEND API
          // ===================================================

          const response =
            await fetch(
              `${API}/api/recommend/`,
              {

                method: "POST",

                headers: {
                  "Content-Type": "application/json"
                },

                body: JSON.stringify(payload),

                signal: controller.signal

              }
            );


          clearTimeout(timeout);


          console.log(
            "Recommendation API status:",
            response.status
          );


          // ===================================================
          // HANDLE ERROR
          // ===================================================

          if (!response.ok) {

            let errorMessage =
              `Server returned ${response.status}.`;

            try {

              const errorData =
                await response.json();

              if (errorData.error) {

                errorMessage =
                  errorData.error;

              }

              else if (errorData.detail) {

                errorMessage =
                  errorData.detail;

              }

            }

            catch (jsonError) {

              console.warn(
                "Could not read error response.",
                jsonError
              );

            }


            throw new Error(
              errorMessage
            );

          }


          // ===================================================
          // READ RESPONSE
          // ===================================================

          const data =
            await response.json();


          console.log(
            "Recommendation data:",
            data
          );


          // ===================================================
          // DISPLAY RESULTS
          // ===================================================

          renderResults(data);

        }


        catch (err) {

          console.error(
            "Recommendation error:",
            err
          );


          if (err.name === "AbortError") {

            if (formError) {
              formError.textContent =
                "The recommendation server took too long to respond. Please try again.";
              formError.style.display = "block";
            }

          }

          else {

            if (formError) {
              formError.textContent =
                err.message ||
                "Something went wrong. Please try again.";
              formError.style.display = "block";
            }

          }

        }


        finally {

          // ---------------------------------------------------
          // HIDE LOADING SCREEN
          // ---------------------------------------------------

          if (loadingSection) {
            loadingSection.hidden = true;
          }

        }

      }
    );

  }


  // =========================================================
  // RENDER ALL RESULTS
  // =========================================================

  function renderResults(data) {

    console.log(
      "Rendering results:",
      data
    );


    // =======================================================
    // GOAL INFORMATION
    // =======================================================

    const resultsIcon =
      document.getElementById("results-icon");

    const resultsTitle =
      document.getElementById("results-title");

    const resultsSub =
      document.getElementById("results-sub");


    if (resultsIcon) {

      resultsIcon.textContent =
        data.goal?.icon || "🎯";

    }


    if (resultsTitle) {

      resultsTitle.textContent =
        `Your path to ${data.goal?.title || "your goal"}`;

    }


    if (resultsSub) {

      resultsSub.textContent =
        `Starting point: ${
          STANDARD_LABELS[data.standard] ||
          data.standard ||
          ""
        }`;

    }


    // =======================================================
    // ROADMAP
    // =======================================================

    renderRoadmap(
      Array.isArray(data.roadmap)
        ? data.roadmap
        : []
    );


    // =======================================================
    // SCHOLARSHIPS
    // =======================================================

    renderScholarships(
      Array.isArray(data.scholarships)
        ? data.scholarships
        : []
    );


    // =======================================================
    // COLLEGES
    // =======================================================

    renderColleges(
      "college-list",
      Array.isArray(data.colleges)
        ? data.colleges
        : [],
      false
    );


    // =======================================================
    // NEARBY COLLEGES
    // =======================================================

    const nearbyPanel =
      document.getElementById("nearby-panel");


    const nearbyColleges =
      Array.isArray(data.nearby_colleges)
        ? data.nearby_colleges
        : [];


    if (
      nearbyPanel &&
      nearbyColleges.length > 0
    ) {

      nearbyPanel.hidden = false;


      renderColleges(
        "nearby-list",
        nearbyColleges,
        true
      );

    }

    else {

      if (nearbyPanel) {
        nearbyPanel.hidden = true;
      }

      const nearbyList =
        document.getElementById("nearby-list");

      if (nearbyList) {
        nearbyList.innerHTML = "";
      }

    }


    // =======================================================
    // SHOW RESULTS
    // =======================================================

    if (resultsSection) {

      resultsSection.hidden = false;


      // -----------------------------------------------------
      // SCROLL TO RESULTS
      // -----------------------------------------------------

      try {

        resultsSection.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });

      }

      catch (error) {

        resultsSection.scrollIntoView();

      }

    }

  }


  // =========================================================
  // RENDER ROADMAP
  // =========================================================

  function renderRoadmap(steps) {

    const list =
      document.getElementById("roadmap-list");


    if (!list) {
      return;
    }


    list.innerHTML = "";


    // -------------------------------------------------------
    // NO STEPS
    // -------------------------------------------------------

    if (!Array.isArray(steps) || !steps.length) {

      list.innerHTML =
        '<p class="empty-note">No roadmap steps found for this combination yet.</p>';

      return;

    }


    // -------------------------------------------------------
    // CREATE ROADMAP STEPS
    // -------------------------------------------------------

    steps.forEach(function (step) {

      const li =
        document.createElement("li");


      li.innerHTML = `

        <span class="step-standard">
          ${
            STANDARD_LABELS[step.standard] ||
            step.standard ||
            ""
          }
        </span>

        <p class="step-title">
          ${escapeHTML(step.title)}
        </p>

        <p class="step-desc">
          ${escapeHTML(step.description)}
        </p>

        ${
          step.duration
            ? `
              <p class="step-duration">
                Typical duration:
                ${escapeHTML(step.duration)}
              </p>
            `
            : ""
        }

      `;


      list.appendChild(li);

    });

  }


  // =========================================================
  // RENDER SCHOLARSHIPS
  // =========================================================

  function renderScholarships(items) {

    const wrap =
      document.getElementById(
        "scholarship-list"
      );


    if (!wrap) {
      return;
    }


    wrap.innerHTML = "";


    // -------------------------------------------------------
    // NO SCHOLARSHIPS
    // -------------------------------------------------------

    if (!Array.isArray(items) || !items.length) {

      wrap.innerHTML =
        '<p class="empty-note">No matching scholarships found — try a different standard.</p>';

      return;

    }


    // -------------------------------------------------------
    // CREATE SCHOLARSHIP CARDS
    // -------------------------------------------------------

    items.forEach(function (scholarship) {

      const div =
        document.createElement("div");


      div.className =
        "card-item";


      div.innerHTML = `

        <h4>
          ${escapeHTML(
            scholarship.name || ""
          )}
        </h4>

        ${
          scholarship.description
            ? `
              <p>
                ${escapeHTML(
                  scholarship.description
                )}
              </p>
            `
            : ""
        }

        <div class="meta">

          ${
            scholarship.provider
              ? `
                <span>
                  ${escapeHTML(
                    scholarship.provider
                  )}
                </span>
              `
              : ""
          }

          ${
            scholarship.amount
              ? `
                <span class="badge moss">
                  ${escapeHTML(
                    scholarship.amount
                  )}
                </span>
              `
              : ""
          }

        </div>

        ${
          scholarship.official_link
            ? `
              <p>
                <a
                  href="${escapeAttr(
                    scholarship.official_link
                  )}"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Official page ↗
                </a>
              </p>
            `
            : ""
        }

      `;


      wrap.appendChild(div);

    });

  }


  // =========================================================
  // RENDER COLLEGES
  // =========================================================

  function renderColleges(
    containerId,
    items,
    showDistance
  ) {

    const wrap =
      document.getElementById(
        containerId
      );


    if (!wrap) {
      return;
    }


    wrap.innerHTML = "";


    // -------------------------------------------------------
    // NO COLLEGES
    // -------------------------------------------------------

    if (!Array.isArray(items) || !items.length) {

      wrap.innerHTML =
        '<p class="empty-note">No colleges found for this field yet.</p>';

      return;

    }


    // -------------------------------------------------------
    // CREATE COLLEGE CARDS
    // -------------------------------------------------------

    items.forEach(function (college) {

      const div =
        document.createElement("div");


      div.className =
        "card-item";


      div.innerHTML = `

        <h4>
          ${escapeHTML(
            college.name || "College"
          )}
        </h4>

        <p>
          ${escapeHTML(
            college.city || ""
          )}${
            college.city && college.state
              ? ", "
              : ""
          }${escapeHTML(
            college.state || ""
          )}
        </p>

        <div class="meta">

          ${
            college.college_type
              ? `
                <span class="badge clay">
                  ${escapeHTML(
                    college.college_type
                  )}
                </span>
              `
              : ""
          }

          ${
            college.rating != null
              ? `
                <span>
                  ★ ${escapeHTML(
                    college.rating
                  )}
                </span>
              `
              : ""
          }

          ${
            showDistance &&
            college.distance_km != null
              ? `
                <span>
                  ${escapeHTML(
                    college.distance_km
                  )} km away
                </span>
              `
              : ""
          }

        </div>

        ${
          college.website
            ? `
              <p>
                <a
                  href="${escapeAttr(
                    college.website
                  )}"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Visit website ↗
                </a>
              </p>
            `
            : ""
        }

      `;


      wrap.appendChild(div);

    });

  }


  // =========================================================
  // HTML SECURITY
  // =========================================================

  function escapeHTML(value) {

    const div =
      document.createElement("div");


    div.textContent =
      value == null
        ? ""
        : String(value);


    return div.innerHTML;

  }


  // =========================================================
  // ATTRIBUTE SECURITY
  // =========================================================

  function escapeAttr(value) {

    return escapeHTML(value)
      .replace(/"/g, "&quot;");

  }


  // =========================================================
  // START APPLICATION
  // =========================================================

  console.log(
    "EDUPath frontend starting..."
  );

  console.log(
    "Backend API:",
    API
  );


  // Load goals and standards
  loadOptions();


})();