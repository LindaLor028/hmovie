document.addEventListener("DOMContentLoaded", function () {
  var headerSearch = document.getElementById("header_searchbar");
  var homeSearch = document.getElementById("home_searchbar");

  if (headerSearch) {
    headerSearch.addEventListener("submit", function () {
      var query = headerSearch.querySelector("input[name='q']").value;
      gtag("event", "search_submit", {
        form_name: "header_search",
        search_term: query,
      });
    });
  }

  if (homeSearch) {
    homeSearch.addEventListener("submit", function () {
      var query = homeSearch.querySelector("input[name='q']").value;
      gtag("event", "search_submit", {
        form_name: "home_search",
        search_term: query,
      });
    });
  }

  document.querySelectorAll("[data-contribute]").forEach(function (link) {
    link.addEventListener("click", function () {
      gtag("event", "contribute_form_click", {
        form_type: this.dataset.contribute,
        link_url: this.href,
      });
    });
  });
});
