console.log("object");

// Function to format date for HTML date input (YYYY-MM-DD format)
function formatDateForInput(dateString) {
  if (!dateString) return "";

  try {
    // Try to parse the date string
    const date = new Date(dateString);

    // Check if the date is valid
    if (isNaN(date.getTime())) {
      console.warn("Invalid date string:", dateString);
      return "";
    }

    // Format as YYYY-MM-DD
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  } catch (error) {
    console.error("Error formatting date:", error);
    return "";
  }
}

// Function to format date as 'Wed Jan 15'
function formatDateToShortText(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

document.addEventListener("DOMContentLoaded", async function () {
  // Use .loading_check div for loading state
  const loadingDiv = document.querySelector(".loading_check");

  // Check if user is logged in
  const userEmail = Cookies.get("userEmail");
  const authToken = Cookies.get("authToken");
  const aircraftId = sessionStorage.getItem("aircraftid");
  const flightRequestIdContinue = sessionStorage.getItem("frequestid");

  if (userEmail && authToken && aircraftId && flightRequestIdContinue) {
    if (loadingDiv) loadingDiv.style.display = "block";
    try {
      const response = await fetch(
        "https://operators-dashboard.bubbleapps.io/api/1.1/wf/webflow_continue_button_blackjet",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            flightrequest: flightRequestIdContinue,
            aircraft: aircraftId,
          }),
        }
      );
      const data = await response.json();
      const dataResponse = data.response;
      console.log("Continue Button API Response:", data.response);

      //! creating map start
      const fromAirport = {
        name: dataResponse.departure_name,
        code: dataResponse.departure_code,
        coordinates: [dataResponse.departure_long, dataResponse.departure_lat],
      };

      const toAirport = {
        name: dataResponse.arrival_name,
        code: dataResponse.arrival_code,
        coordinates: [dataResponse.arrival_long, dataResponse.arrival_lat],
      };

      const isMobile = window.innerWidth < 992;

      mapboxgl.accessToken =
        "pk.eyJ1IjoiYmFidTg3NjQ3IiwiYSI6ImNtOXF5dTEyYjF0MWIyam9pYjM4cmhtY28ifQ.z0mjjPx_wTlAA_wrzhzitA";

      const map = new mapboxgl.Map({
        container: "map",
        style: "mapbox://styles/mapbox/light-v11",
        center: turf.midpoint(fromAirport.coordinates, toAirport.coordinates)
          .geometry.coordinates,
        zoom: isMobile ? 1 : 3,
        minZoom: 1,
      });

      let flightPathBounds;
      let resizeTimeout;

      map.on("load", () => {
        // 1. Generate "Other Airports" dots
        const numOtherAirports = 2000;
        const otherAirportsFeatures = [];
        const mapVisibleBounds = map.getBounds();
        const west = mapVisibleBounds.getWest();
        const south = mapVisibleBounds.getSouth();
        const east = mapVisibleBounds.getEast();
        const north = mapVisibleBounds.getNorth();

        for (let i = 0; i < numOtherAirports; i++) {
          otherAirportsFeatures.push(
            turf.randomPoint(1, { bbox: [west, south, east, north] })
              .features[0]
          );
        }
        const otherAirportsGeoJSON = turf.featureCollection(
          otherAirportsFeatures
        );

        map.addSource("other-airports", {
          type: "geojson",
          data: otherAirportsGeoJSON,
        });

        map.addLayer({
          id: "other-airports-layer",
          type: "circle",
          source: "other-airports",
          paint: {
            "circle-radius": 1.5,
            "circle-color": "#777777",
            "circle-opacity": 0.6,
          },
        });

        // 2. Create the Flight Path
        const route = turf.greatCircle(
          turf.point(fromAirport.coordinates),
          turf.point(toAirport.coordinates),
          { npoints: 100 }
        );

        map.addSource("flight-path", {
          type: "geojson",
          data: route,
        });

        map.addLayer({
          id: "flight-path-layer",
          type: "line",
          source: "flight-path",
          layout: {
            "line-join": "round",
            "line-cap": "round",
          },
          paint: {
            "line-color": "#000000",
            "line-width": 2,
            "line-dasharray": [2, 2],
          },
        });

        // 3. Add Airplane Icon
        map.loadImage("airplane.svg", (error, image) => {
          if (error) throw error;
          if (!map.hasImage("airplane-icon")) {
            map.addImage("airplane-icon", image, { sdf: false });
          }

          const routeDistance = turf.length(route);
          const airplanePositionPoint = turf.along(route, routeDistance * 0.8);
          const pointSlightlyBefore = turf.along(route, routeDistance * 0.79);
          const bearing = turf.bearing(
            pointSlightlyBefore,
            airplanePositionPoint
          );

          map.addSource("airplane-source", {
            type: "geojson",
            data: airplanePositionPoint,
          });

          map.addLayer({
            id: "airplane-layer",
            type: "symbol",
            source: "airplane-source",
            layout: {
              "icon-image": "airplane-icon",
              "icon-size": 1,
              "icon-allow-overlap": true,
              "icon-ignore-placement": true,
              "icon-rotate": bearing - 90,
            },
          });
        });

        // 4. Custom Airport Markers
        const elFrom = document.createElement("div");
        elFrom.className = "airport-marker";
        elFrom.innerHTML = `
<div class="airport-info">
  <svg class="plane-icon" viewBox="0 0 24 24"><path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/></svg>
  ${fromAirport.name}
</div>
<div class="airport-code">${fromAirport.code}</div>
`;
        new mapboxgl.Marker(elFrom, { offset: [55, 0] })
          .setLngLat(fromAirport.coordinates)
          .addTo(map);

        const elTo = document.createElement("div");
        elTo.className = "airport-marker";
        elTo.innerHTML = `
<div class="airport-info">
  <svg class="plane-icon" viewBox="0 0 24 24"><path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/></svg>
  ${toAirport.name}
</div>
<div class="airport-code">${toAirport.code}</div>
`;
        new mapboxgl.Marker(elTo, { offset: [45, 0] })
          .setLngLat(toAirport.coordinates)
          .addTo(map);

        // 5. Add filled circles for origin and destination airports
        map.addSource("origin-dest-points", {
          type: "geojson",
          data: {
            type: "FeatureCollection",
            features: [
              turf.point(fromAirport.coordinates),
              turf.point(toAirport.coordinates),
            ],
          },
        });
        map.addLayer({
          id: "origin-dest-circles",
          type: "circle",
          source: "origin-dest-points",
          paint: {
            "circle-radius": 5,
            "circle-color": "#000000",
            "circle-stroke-color": "#FFFFFF",
            "circle-stroke-width": 1.5,
          },
        });

        // 6. Fit map to bounds
        flightPathBounds = new mapboxgl.LngLatBounds();
        route.geometry.coordinates.forEach((coord) => {
          flightPathBounds.extend(coord);
        });

        const isMobile = window.innerWidth < 768;
        map.fitBounds(flightPathBounds, {
          padding: isMobile
            ? { top: 50, bottom: 50, left: 50, right: 50 }
            : { top: 100, bottom: 100, left: 150, right: 150 },
        });

        // 7. SOLUTION 2: ResizeObserver - Watches for container size changes
        const mapContainer = document.getElementById("map");

        // Create a ResizeObserver to watch the map container
        const resizeObserver = new ResizeObserver((entries) => {
          clearTimeout(resizeTimeout);
          resizeTimeout = setTimeout(() => {
            map.resize();
            if (flightPathBounds) {
              const isMobile = window.innerWidth < 768;
              map.fitBounds(flightPathBounds, {
                padding: isMobile
                  ? { top: 50, bottom: 50, left: 50, right: 50 }
                  : { top: 100, bottom: 100, left: 150, right: 150 },
              });
            }
          }, 150);
        });

        // Start observing the map container
        resizeObserver.observe(mapContainer);

        // Alternative: MutationObserver for class changes (if sidebar toggle changes classes)
        const mutationObserver = new MutationObserver((mutations) => {
          mutations.forEach((mutation) => {
            if (
              mutation.type === "attributes" &&
              mutation.attributeName === "class"
            ) {
              clearTimeout(resizeTimeout);
              resizeTimeout = setTimeout(() => {
                map.resize();
                if (flightPathBounds) {
                  const isMobile = window.innerWidth < 768;
                  map.fitBounds(flightPathBounds, {
                    padding: isMobile
                      ? { top: 50, bottom: 50, left: 50, right: 50 }
                      : { top: 100, bottom: 100, left: 150, right: 150 },
                  });
                }
              }, 300);
            }
          });
        });

        // Watch for class changes on the body or main container that might affect sidebar
        mutationObserver.observe(document.body, {
          attributes: true,
          attributeFilter: ["class"],
        });

        // Also watch the parent container of the map (in case it has class changes)
        const mapParent = mapContainer.parentElement;
        if (mapParent) {
          mutationObserver.observe(mapParent, {
            attributes: true,
            attributeFilter: ["class"],
          });
        }
      });

      // 8. Enhanced window resize handler (backup solution)
      window.addEventListener("resize", () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
          map.resize();
          if (flightPathBounds) {
            const isMobile = window.innerWidth < 768;
            map.fitBounds(flightPathBounds, {
              padding: isMobile
                ? { top: 50, bottom: 50, left: 50, right: 50 }
                : { top: 100, bottom: 100, left: 150, right: 150 },
            });
          }
        }, 100);
      });

      // 9. Optional: If you know the specific sidebar toggle button, add this
      // Replace '.sidebar-toggle-button' with your actual button selector
      const sidebarToggleButton = document.querySelector(
        ".sidebar-toggle-button"
      );
      if (sidebarToggleButton) {
        sidebarToggleButton.addEventListener("click", () => {
          clearTimeout(resizeTimeout);
          resizeTimeout = setTimeout(() => {
            map.resize();
            if (flightPathBounds) {
              const isMobile = window.innerWidth < 768;
              map.fitBounds(flightPathBounds, {
                padding: isMobile
                  ? { top: 50, bottom: 50, left: 50, right: 50 }
                  : { top: 100, bottom: 100, left: 150, right: 150 },
              });
            }
          }, 350); // Slightly longer delay to account for sidebar animation
        });
      }
      //! creating map end

      //? code for let side trip details
      const tripLeftDetails = document.querySelector(".ch_trip_det_cnt");
      let tripDetailsHTML = `
        <div class="trip_details_top">
          <div class="tripimg">
            <img src="${dataResponse.aircraft_image}" alt="plan image" />
          </div>
          <div class="trip_cnt">
            <h3 class="ch_trip_left_det_heading">${dataResponse.category}</h3>
            <p class="trip_pecenger"><img src="https://cdn.prod.website-files.com/66fa75fb0d726d65d059a42d/68123a3a00245af158cbc3f7_user.png" alt="usericon" /> <span>UP TO ${dataResponse.aircraft_max_pax}</span></p>
            <p class="trip_message">${dataResponse.checkout_aircraft_message}</p>
          </div>
        </div>
        <div class="trip_details_bottom">
          <h4>Trip Type</h4>
      `;
      if (dataResponse.flightlegs.length === 1) {
        tripDetailsHTML += `
          <div class="trip_date_oneway ch_one_way">
            <p>One Way</p>
            <div class="trip_one_date">
              <div class="ch_date">
                <label>Flight Date</label>
                <input type="date" value="${formatDateForInput(
                  dataResponse.flightlegs[0].date_as_text1_text
                )}" />
              </div>
              <div class="ch_date ch_time">
                <label>Departure Time</label>
                <input type="text" class="departure-time-input" readonly placeholder="Select time" />
                <div class="time-dropdown" style="display:none;"></div>
              </div>
            </div>
          </div>
        `;
      } else if (dataResponse.flightlegs.length === 2) {
        tripDetailsHTML += `
          <div class="trip_date_oneway ch_round_way">
            <p>Round Trip</p>
            <div class="trip_one_date">
              <div class="ch_date">
                <label>Outbound Flight</label>
                <input type="date" value="${formatDateForInput(
                  dataResponse.flightlegs[0].date_as_text1_text
                )}" />
              </div>
              <div class="ch_date ch_time">
                <label>Departure Time</label>
                <input type="text" class="departure-time-input" readonly placeholder="Select time" />
                <div class="time-dropdown" style="display:none;"></div>
              </div>
              <div class="ch_date">
                <label>Return Flight</label>
                <input type="date" value="${formatDateForInput(
                  dataResponse.flightlegs[1].date_as_text1_text
                )}" />
              </div>
              <div class="ch_date ch_time">
                <label>Departure Time</label>
                <input type="text" class="departure-time-input" readonly placeholder="Select time" />
                <div class="time-dropdown" style="display:none;"></div>
              </div>
            </div>
          </div>
        `;
      }
      tripDetailsHTML += `</div>`;
      tripLeftDetails.innerHTML = tripDetailsHTML;

      //? code for let side trip details
      const tripRightDetails = document.querySelector(".ch_trip_right");
      const checkoutTrip = dataResponse.flightlegs;
      checkoutTrip.forEach((trip) => {
        tripRightDetails.innerHTML += `
          <div class="tripbox">
              <div class="tripheading">
                <p><img src="https://cdn.prod.website-files.com/66fa75fb0d726d65d059a42d/681b3998bb0e44c63127549a_cal.png" alt="calender image" /> ${formatDateToShortText(
                  trip.date_as_text1_text
                )}</p>

                <img src="https://cdn.prod.website-files.com/66fa75fb0d726d65d059a42d/67081c119f1bcd78f2973ebf_665f4884debdcab58916a6ec_logo.webp" alt="bjlogo" class="logobj" />
              </div>
              <div class="trip_place">
                <div class="trip_place_left">
                  <h3>${
                    trip.mobile_app_from_airport_icao_code_text ||
                    trip.mobile_app_from_airport_iata_code_text ||
                    trip.mobile_app_from_airport_faa_code_text
                  }</h3>
                  <p></p>
                </div>
                <div class="trip_place_icon"></div>
                <div class="trip_place_left trip_place_right">
                  <h3>${
                    trip.mobile_app_to_airport_icao_code_text ||
                    trip.mobile_app_to_airport_iata_code_text ||
                    trip.mobile_app_to_airport_faa_code_text
                  }</h3>
                  <p></p>
              </div>
            </div>
            <div class="trip_cal">
              <div class="trip_cal_text">
                <p class="trip_cal_name">Duration:</p>
                <p class="trip_cal_number">4h 35m</p>
              </div>
              <div class="trip_cal_text">
                <p class="trip_cal_name">Nautical Miles:</p>
                <p class="trip_cal_number">${Math.round(
                  trip.total_distance__nautical_m__number
                )}</p>
              </div>
              <div class="trip_cal_text">
                <p class="trip_cal_name">Statute Miles:</p>
                <p class="trip_cal_number">${Math.round(
                  trip.total_distance__statute_m__number
                )}</p>
              </div>
            </div>
            <div class="trip_total_cal">
              <div class="trip_total_tax">
                <p>${dataResponse.category} <span>$${(
          dataResponse.total - dataResponse.tax
        ).toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}</span></p>
                <p>Tax <span>$${dataResponse.tax.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}</span></p>
              </div>
              <div class="trip_total_number">
                <p>Total <span>$${dataResponse.total.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}</span></p>
              </div>
            </div>
          </div>
        `;
      });

      // --- Custom Time Slot Dropdown for Departure Time ---
      function generateTimeSlots() {
        const slots = [];
        for (let h = 0; h < 24; h++) {
          for (let m = 0; m < 60; m += 30) {
            const hour12 = h % 12 === 0 ? 12 : h % 12;
            const hourStr = String(hour12).padStart(2, "0");
            const ampm = h < 12 ? "AM" : "PM";
            const min = m === 0 ? "00" : "30";
            slots.push(`${hourStr}:${min} ${ampm}`);
          }
        }
        return slots;
      }

      function setupTimeDropdown() {
        const inputs = document.querySelectorAll(".departure-time-input");
        const dropdowns = document.querySelectorAll(".time-dropdown");
        const slots = generateTimeSlots();

        inputs.forEach((input, idx) => {
          const dropdown = dropdowns[idx];
          if (!dropdown) return;

          // Build the dropdown
          dropdown.innerHTML =
            `<div class="time-reset">RESET</div>` +
            slots
              .map((time) => `<div class="time-slot">${time}</div>`)
              .join("");

          // Show dropdown on input focus/click
          input.addEventListener(
            "focus",
            () => (dropdown.style.display = "block")
          );
          input.addEventListener(
            "click",
            () => (dropdown.style.display = "block")
          );

          // Hide dropdown on outside click
          document.addEventListener("click", (e) => {
            if (!dropdown.contains(e.target) && e.target !== input) {
              dropdown.style.display = "none";
            }
          });

          // Handle time selection
          dropdown.addEventListener("click", (e) => {
            if (e.target.classList.contains("time-slot")) {
              input.value = e.target.textContent;
              dropdown.style.display = "none";
            }
            if (e.target.classList.contains("time-reset")) {
              input.value = "";
              dropdown.style.display = "none";
            }
          });
        });
      }
      setupTimeDropdown();
      // --- End Custom Time Slot Dropdown ---
    } catch (error) {
      console.error("Error calling continue button API:", error);
    } finally {
      if (loadingDiv) loadingDiv.style.display = "none";
    }
  } else {
    alert("No search found");
  }
});
