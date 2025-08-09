const listingLink = document.querySelector(".listing_link");

if (listingLink) {
  listingLink.addEventListener("click", function (e) {
    e.preventDefault();

    // Check if user is logged in using cookies
    const userEmail =
      typeof Cookies !== "undefined" ? Cookies.get("userEmail") : null;
    const authToken =
      typeof Cookies !== "undefined" ? Cookies.get("authToken") : null;

    if (userEmail && authToken) {
      // User is logged in, redirect to listing page
      window.location.href = "/listing";
    } else {
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

      // Set flag to redirect after login
      sessionStorage.setItem("redirectAfterLogin", "true");
      sessionStorage.setItem("redirectTo", "/listing");
    }
  });
}
