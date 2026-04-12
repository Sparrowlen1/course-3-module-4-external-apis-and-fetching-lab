// index.js
const weatherApi = "https://api.weather.gov/alerts/active?area="

// Your code here!
const input = document.getElementById("state-input");
const button = document.getElementById("get-alerts");
const alertsContainer = document.getElementById("alerts-container");
const errorDiv = document.getElementById("error-message");

async function fetchWeatherAlerts(state) {
    try {
        // Input validation
        if (!state || state.length !== 2) {
            throw new Error("Please enter a valid 2-letter state code (e.g., CA, TX).");
        }

        clearError();

        const response = await fetch(`https://api.weather.gov/alerts/active?area=${state}`);

        if (!response.ok) {
            throw new Error("Failed to fetch weather alerts. Please try again.");
        }

        const data = await response.json();

        console.log(data); 

        displayAlerts(data, state);

        input.value = "";

    } catch (error) {
        displayError(error.message);
    }
}

function displayAlerts(data, state) {
    alertsContainer.innerHTML = "";

    const alerts = data.features;

    const summary = document.createElement("h2");
    summary.textContent = `Current watches, warnings, and advisories for ${state}: ${alerts.length}`;
    alertsContainer.appendChild(summary);

    const ul = document.createElement("ul");

    alerts.forEach(alert => {
        const li = document.createElement("li");
        li.textContent = alert.properties.headline;
        ul.appendChild(li);
    });

    alertsContainer.appendChild(ul);
}

// Display error
function displayError(message) {
    errorDiv.textContent = message;
    errorDiv.style.display = "block";

    // Clear alerts when error occurs
    alertsContainer.innerHTML = "";
}

// Clear error
function clearError() {
    errorDiv.textContent = "";
    errorDiv.style.display = "none";
}

// Event listener
button.addEventListener("click", () => {
    const state = input.value.trim().toUpperCase();
    fetchWeatherAlerts(state);
});