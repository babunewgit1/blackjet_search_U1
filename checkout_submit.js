const checkoutFnForm = document.querySelector(".cht_cnt_form form");
const paymentOptions = document.querySelectorAll(".chtfp_name");
const cardNumber = document.getElementById("card_number");
const expireDate = document.getElementById("expire_date");
const cvc = document.getElementById("cvc");

// make the input require when user will select the Credit Card method
paymentOptions.forEach((option) => {
  option.addEventListener("click", () => {
    const selectedText = option.querySelector("p").innerText.toLowerCase();
    const isCreditCard = selectedText.includes("credit card");
    cardNumber.required = isCreditCard;
    expireDate.required = isCreditCard;
    cvc.required = isCreditCard;
  });
});

checkoutFnForm.addEventListener("submit", function (e) {
  e.preventDefault();
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

  // block form submission if user does not select any passenger
  const selectedPass = document.querySelector(".selectedpass");
  if (
    !selectedPass ||
    selectedPass.querySelectorAll(".selectedpassname").length === 0
  ) {
    alert("please add at least one passenger");
    return;
  }

  const frequestid = sessionStorage.getItem("frequestid");
  if (!frequestid) {
    const notFound = document.querySelector(".notfound");
    notFound.style.display = "flex";
    return;
  }

  //block form submission if user does not select any payment
  const selected = document.querySelector(".chtfp_name.active");
  if (!selected) {
    alert("Please select a payment method.");
    return;
  }
  const paymentText = selected.querySelector("p").innerText.trim();

  // Collect selected passenger IDs
  const selectedIds = Array.from(
    selectedPass.querySelectorAll(".selectedpassname")
  ).map((div) => div.getAttribute("data-passenger-id"));

  // Utility function to convert date strings to 'MM/DD/YYYY'
  function formatDateToMMDDYYYY(dateStr) {
    if (!dateStr) return "";
    const parts = dateStr.split("-");
    if (parts.length !== 3) return dateStr;
    if (parts[0].length === 4) {
      return `${parts[1]}/${parts[2]}/${parts[0]}`;
    } else {
      return `${parts[1]}/${parts[0]}/${parts[2]}`;
    }
  }
  // Prepare API parameters

  const flightrequestid = frequestid;
  const payment_method = paymentText;
  const cc_number = cardNumber.value;
  const cc_expiry = expireDate.value;
  const cc_cvc = cvc.value;
  const leg_1_date =
    window.tripData && window.tripData[0]
      ? formatDateToMMDDYYYY(window.tripData[0].date_as_text1_text)
      : "";
  const leg_1_date_as_text = leg_1_date;
  const leg_2_date =
    window.tripData && window.tripData[1]
      ? formatDateToMMDDYYYY(window.tripData[1].date_as_text1_text)
      : "";
  const leg_2_date_as_text = leg_2_date;
  const passengers = selectedIds;

  // Build request body and conditionally add leg_2_date and leg_2_date_as_text
  const requestBody = {
    flightrequestid,
    payment_method,
    leg_1_date,
    leg_1_date_as_text,
    passengers,
  };
  if (cc_number) requestBody.cc_number = cc_number;
  if (cc_expiry) requestBody.cc_expiry = cc_expiry;
  if (cc_cvc) requestBody.cc_cvc = cc_cvc;
  if (leg_2_date) requestBody.leg_2_date = leg_2_date;
  if (leg_2_date_as_text) requestBody.leg_2_date_as_text = leg_2_date_as_text;

  // API call
  fetch(
    "https://operators-dashboard.bubbleapps.io/api/1.1/wf/webflow_complete_booking_blackjet",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify(requestBody),
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
      console.log("API response:", data);
      window.location.href = "/checkout-confimation";
    })
    .catch((error) => {
      alert("There was an error submitting the booking. Please try again.");
      console.error("API error:", error);
    });
});
