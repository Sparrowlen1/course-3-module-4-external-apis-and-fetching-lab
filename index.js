// index.js
const weatherApi = "https://api.weather.gov/alerts/active?area="

// Your code here!

const input = document.getElementById("state-input");
const button = document.getElementById("fetch-alerts");
const alertsDiv = document.getElementById("alerts-display");
const errorDiv = document.getElementById("error-message");


// Fetch data
async function fetchWeatherData(state) {
  try {
    const response = await fetch(weatherApi + state);

    if (!response.ok) {
      throw new Error("Failed to fetch weather alerts");
    }

    const data = await response.json();
    console.log(data);

    displayWeather(data);

  } catch (error) {
    displayError(error.message);
  }
}


// Display weather data
function displayWeather(data) {

  // clear old data
  alertsDiv.innerHTML = "";

  // hide error
  errorDiv.textContent = "";
  errorDiv.classList.add("hidden");

  const alerts = data.features;

  const title = document.createElement("h2");
  title.textContent =
    `Current watches, warnings, and advisories: ${alerts.length}`;

  alertsDiv.appendChild(title);

  alerts.forEach(alert => {
    const p = document.createElement("p");
    p.textContent = alert.properties.headline;
    alertsDiv.appendChild(p);
  });
}


// Display error
function displayError(message) {

  alertsDiv.innerHTML = "";

  errorDiv.classList.remove("hidden");
  errorDiv.textContent = message;
}


// Button click event
button.addEventListener("click", () => {
  const state = input.value.trim().toUpperCase();

  if (!state) {
    displayError("Please enter a valid state abbreviation");
    return;
  }

  fetchWeatherData(state);

  // clear input after request
  input.value = "";
});