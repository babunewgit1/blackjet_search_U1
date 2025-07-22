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

  //block form submission if user does not select any payment
  const selected = document.querySelector(".chtfp_name.active");
  if (!selected) {
    alert("Please select a payment method.");
    return;
  }

  const paymentText = selected.querySelector("p").innerText.trim();
  console.log("Selected Payment Method:", paymentText);

  // Collect selected passenger IDs
  const selectedIds = Array.from(
    selectedPass.querySelectorAll(".selectedpassname")
  ).map((div) => div.getAttribute("data-passenger-id"));
  console.log("Selected passenger IDs:", selectedIds);

  // Collect and log all flight dates from window.tripData
  console.log(
    window.tripData && window.tripData[0]
      ? window.tripData[0].date_as_text1_text
      : "No leg 1 date"
  );
  console.log(
    window.tripData && window.tripData[1]
      ? window.tripData[1].date_as_text1_text
      : "No leg 2 date"
  );

  const frequestid = sessionStorage.getItem("frequestid");
  // Prepare API parameters
  const flightrequestid = frequestid;
  const payment_method = paymentText;
  const cc_number = cardNumber.value;
  const cc_expiry = expireDate.value;
  const cc_cvc = cvc.value;
  console.log(cc_number, cc_expiry, cc_cvc);
  const leg_1_date =
    window.tripData &&
    window.tripData[0] &&
    window.tripData[0].date_as_text1_text
      ? window.tripData[0].date_as_text1_text
      : "";
  const leg_1_date_as_text = leg_1_date;
  const leg_2_date =
    window.tripData &&
    window.tripData[1] &&
    window.tripData[1].date_as_text1_text
      ? window.tripData[1].date_as_text1_text
      : "";
  const leg_2_date_as_text = leg_2_date;
  const passengers = selectedIds;

  // API call
  fetch(
    "https://operators-dashboard.bubbleapps.io/api/1.1/wf/webflow_complete_booking_blackjet",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        flightrequestid,
        payment_method,
        cc_number,
        cc_expiry,
        cc_cvc,
        leg_1_date,
        leg_1_date_as_text,
        leg_2_date,
        leg_2_date_as_text,
        passengers,
      }),
    }
  )
    .then((response) => {
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.json();
    })
    .then((data) => {
      alert("Booking completed successfully!");
      console.log("API response:", data);
    })
    .catch((error) => {
      alert("There was an error submitting the booking. Please try again.");
      console.error("API error:", error);
    });
});
