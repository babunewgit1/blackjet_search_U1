const checkoutFnForm = document.querySelector(".cht_cnt_form form");

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

  // Check if at least one passenger is added
  const selectedPass = document.querySelector(".selectedpass");
  if (
    !selectedPass ||
    selectedPass.querySelectorAll(".selectedpassname").length === 0
  ) {
    alert("please add at least one passenger");
    return;
  }

  // If all checks pass
  // Collect selected passenger IDs
  const selectedIds = Array.from(
    selectedPass.querySelectorAll(".selectedpassname")
  ).map((div) => div.getAttribute("data-passenger-id"));
  console.log("Selected passenger IDs:", selectedIds);

  // Collect and log all flight dates from window.tripData
  console.log(window.tripData[0].date_as_text1_text);
  console.log(window.tripData[1].date_as_text1_text);

  const frequestid = sessionStorage.getItem("frequestid");
  console.log(frequestid); // This will print the value to the console

  alert("form is ready to submit");
  // (You can replace this with actual form submission logic)
});
