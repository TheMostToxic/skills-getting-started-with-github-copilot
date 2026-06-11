// Note: Updated for Step 3 — improve participant UI and ensure CI detects changes
// Touch: pushed to trigger CI check at 2026-06-11 00:00:00Z
document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  const hideMessage = () => {
    messageDiv.classList.add("hidden");
  };

  const showMessage = (type, text) => {
    messageDiv.textContent = text;
    messageDiv.className = `message ${type}`;
    messageDiv.classList.remove("hidden");
    setTimeout(hideMessage, 5000);
  };

  const renderParticipantList = (activityName, participants) => {
    const count = participants?.length || 0;
    if (!count) {
      return `
        <div class="participants-section info">
          <p class="participants-heading">Participants</p>
          <p class="no-participants">No participants have signed up yet.</p>
        </div>`;
    }

    return `
      <div class="participants-section">
        <p class="participants-heading">Participants (${count})</p>
        <ul class="participants-list">
          ${participants.map((participant) => `
            <li class="participant-item">
              <span>${participant}</span>
              <button
                type="button"
                class="remove-participant"
                data-activity="${activityName}"
                data-email="${participant}"
                aria-label="Unregister ${participant}"
                title="Unregister ${participant}"
              >✕</button>
            </li>`).join("")}
        </ul>
      </div>`;
  };

  // Function to fetch activities from API
  async function fetchActivities(selectedActivity = "") {
    try {
      activitiesList.innerHTML = `<p class="loading">Loading activities...</p>`;
      activitySelect.innerHTML = `<option value="">-- Select an activity --</option>`;

      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message and select options
      activitiesList.innerHTML = "";
      activitySelect.innerHTML = `<option value="">-- Select an activity --</option>`;

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - (details.participants?.length || 0);
        const participantsHtml = renderParticipantList(name, details.participants);

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          ${participantsHtml}
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        if (name === selectedActivity) {
          option.selected = true;
        }
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle participant removal
  activitiesList.addEventListener("click", async (event) => {
    if (!event.target.classList.contains("remove-participant")) {
      return;
    }

    const button = event.target;
    const activity = button.dataset.activity;
    const email = button.dataset.email;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/participants?email=${encodeURIComponent(email)}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();
      if (response.ok) {
        showMessage("success", result.message);
        await fetchActivities(activity);
      } else {
        showMessage("error", result.detail || "Failed to remove participant");
      }
    } catch (error) {
      showMessage("error", "Failed to remove participant. Please try again.");
      console.error("Error removing participant:", error);
    }
  });

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        showMessage("success", result.message);
        signupForm.reset();
        await fetchActivities(activity);
      } else {
        showMessage("error", result.detail || "An error occurred");
      }
    } catch (error) {
      showMessage("error", "Failed to sign up. Please try again.");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
