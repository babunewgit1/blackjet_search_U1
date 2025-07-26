// On page load, fetch confirmation data and log the response
window.addEventListener("DOMContentLoaded", function () {
  const searchLink = document.querySelector(".notf_searchbtn a");
  searchLink.addEventListener("click", function () {
    const redirectLink = localStorage.getItem("link") || "/";
    window.location.href = redirectLink;
  });

  const flightrequestid = sessionStorage.getItem("frequestid");
  const bkconfWrapper = document.querySelector(".bk_conf_wrapper");
  const userEmail = Cookies.get("userEmail");
  const authToken = Cookies.get("authToken");
  if (!userEmail || !authToken) {
    const authPopUpWrapper = document.querySelector(".auth-popup");
    const authBlockPopup = document.querySelector(".auth_block_popup");
    const authForget = document.querySelector(".auth_forget");
    authPopUpWrapper.classList.add("active_popup");
    authBlockPopup.style.display = "block";
    authForget.style.display = "none";
    document.querySelector("#signin").classList.add("active_form");
    document.querySelector("#signup").classList.remove("active_form");
    document.querySelector("[data='signin']").style.display = "block";
    document.querySelector("[data='signup']").style.display = "none";

    // Listen for a custom event 'userLoggedIn' to reload the page after login
    window.addEventListener(
      "userLoggedIn",
      function () {
        window.location.reload();
      },
      { once: true }
    );
    return;
  }

  if (!flightrequestid) {
    const notFound = document.querySelector(".notfound");
    notFound.style.display = "flex";
    return;
  }

  fetch(
    "https://operators-dashboard.bubbleapps.io/api/1.1/wf/webflow_confirmation_page_blackjet",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ flightrequestid }),
    }
  )
    .then(async (response) => {
      if (!response.ok) {
        const errorText = await response.text();
        console.error("API error response:", errorText);
        throw new Error("Network response was not ok");
      }
      return response.json();
    })
    .then((data) => {
      const bookingData = data.response;
      console.log(bookingData);
      // Helper to format date from MM/DD/YYYY to 'Wed Jan 15'
      function formatDateToShortString(dateStr) {
        if (!dateStr) return "";
        const [month, day, year] = dateStr.split("/");
        const date = new Date(`${year}-${month}-${day}`);
        return date.toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
        });
      }
      const flightLegsHtml = (bookingData.flightlegs || [])
        .map(
          (leg) => `
            <div class="bkm_trip_det_list">
              <div class="bkm_trip_det_place">
                <p>${leg.mobile_app_from_city_text_text} <span>${
            leg.mobile_app_from_airport_icao_code_text ||
            leg.mobile_app_from_airport_iata_code_text ||
            leg.mobile_app_from_airport_faa_code_text
          }</span></p>
                <div class="arrowbkn"></div>
                <p>${leg.mobile_app_to_city_text_text} <span>${
            leg.mobile_app_to_airport_icao_code_text ||
            leg.mobile_app_to_airport_iata_code_text ||
            leg.mobile_app_to_airport_faa_code_text
          }</span></p>
              </div>
              <div class="bkm_trip_det_time">
                <div class="bkm_trip_det_time_date">
                  <p class="flight-date"> <img src="https://cdn.prod.website-files.com/66fa75fb0d726d65d059a42d/681b3998bb0e44c63127549a_cal.png" alt="cal icon" /> ${formatDateToShortString(
                    leg.date_as_text1_text
                  )}</p>
                  <span>|</span>
                  <p class="duration">${
                    leg.aviapages_light_jet_estimated_flight_time_text
                  }</p>
                </div>
              </div>
            </div>
          `
        )
        .join("");

      const getPassengerList = (bookingData.passengers || [])
        .map(
          (passernger) => `         
            <div class="bkpasslist_wrapper">
               <div class="bkpassname">
                  <span></span>
                  <p>${passernger.first_name_text} ${
            passernger.middle_name_text || ""
          } ${passernger.last_name_text}</p>
               </div>
               <div class="bkpassname_mail">
                  <p>${passernger.email_text}</p>
               </div>
            </div>
         `
        )
        .join("");
      bkconfWrapper.innerHTML = `
         <div class="bkinfo">
            <div class="bkinfo_heading">
               <img class="icondesktop" src="https://cdn.prod.website-files.com/66fa75fb0d726d65d059a42d/6880b6b5fa783378bd04b8eb_bkimg.png" alt="plan icon" />
               <img class="iconmobile" src="https://cdn.prod.website-files.com/66fa75fb0d726d65d059a42d/68823866dceb0d35491dcedf_icon.png" alt="plan icon" />
               <h3>Flight confirmed. Your Booking is done.</h3>
               <p>A payment has been made for the amount of <strong>$${Math.round(
                 bookingData.total_charge
               ).toLocaleString()}</strong> and Your trip ID is <strong>#${
        bookingData.reference_number
      }.</strong> Please use this trip ID for any communication with us. We will email your ticket shortly. Thank you for booking with <strong>BlackJet 2.0</strong></p>
            </div>
            <div class="booking_main">
               <div class="bkmail_left_det">
                  <div class="bkm_heading">
                     <div class="bkmh_left">
                        <h4>Flight Details</h4>
                     </div>
                     <div class="bkmh_right">
                        <h4>${bookingData.category}</h4>
                        <img src="https://cdn.prod.website-files.com/66fa75fb0d726d65d059a42d/688218b30f363166f867745b_blg.png" alt="blackjet logo" />
                     </div>
                  </div>
                  <div class="bkm_trip_details">
                    ${flightLegsHtml}
                  </div>
                  <div class="bkpasslist">
                     <h4>Passengers</h4>
                     ${getPassengerList}
                  </div>
               </div>            
               <div class="bkmain_right">
                  <div class="bkmain_right_heading">
                     <h4>Credit Card</h4>
                     <img src="https://cdn.prod.website-files.com/66fa75fb0d726d65d059a42d/6880bba29c7cb7c552254cf1_cardx_icon.png" alt="card icon" />
                     <p>${bookingData.card_numbers}</p>
                  </div>
                  <div class="bktotal_charge">
                     <h4>Total Charge</h4>
                     <h3>$${Math.round(
                       bookingData.total_charge
                     ).toLocaleString()}</h3>
                  </div>
                  <div class="bkcost_list">
                     <ul>
                        <li>${bookingData.category} <span>
  ${Math.round(bookingData.total_charge - bookingData.tax).toLocaleString()}
</span></li>
                        <li>Tax <span>$${Math.round(
                          bookingData.tax
                        ).toLocaleString()}</span></li>
                     </ul>
                  </div>
                  <div class="bkcost_button">
                     <a href="#">View order Summary</a>
                  </div>
               </div>
            </div>
            <div class="homebutton">
               <a href="/">Go to Home Page</a>
            </div>
         </div>
      `;
    })
    .catch((error) => {
      console.error("Error fetching confirmation:", error);
    });
});
