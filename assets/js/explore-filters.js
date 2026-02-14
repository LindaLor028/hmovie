/**
 * resetListItemsVisibility(numOfFilters)
 * This function is called in the clearFilters() method.
 * This function sets the visibility of all movies on the explore page to visible.
 */
function resetListItemsVisibility(numOfFilters) {
    const movie_list = document.getElementById("movies_list");
    const movie_items = movie_list.getElementsByTagName("li");

    for (let movie_index = 0; movie_index < movie_items.length; movie_index++) {
        movie_items[movie_index].style.display = "block";
    }
    document.getElementById("total_displayed").innerHTML = "(" + movie_items.length + " Movies)";
}

/**
 * returnCheckedYearFilters()
 * This function is called in the filterMultiple() method.
 * This function returns an array of regex expressions based on what filter years are checked.
 */
function returnCheckedYearFilters() {
    const filters = document.getElementById("year_filters").getElementsByTagName("li");
    const decades = [
        { regex: /199[0-9]/, label: "1990s" },
        { regex: /200[0-9]/, label: "2000s" },
        { regex: /201[0-9]/, label: "2010s" },
        { regex: /202[0-9]/, label: "2020s" }
    ];

    const checked = [];
    for (let i = 0; i < filters.length; i++) {
        if (filters[i].getElementsByTagName("input")[0].checked) {
            checked.push(decades[i]);
        }
    }
    return checked;
}

/**
 * returnCheckedFilters(id)
 * This function is called in the filterMultiple() method.
 * This function returns an array of checked filters of type id.
*/
function returnCheckedFilters(id) {
    const filters = document.getElementById(id).getElementsByTagName("li");
    const checked_filters = [];
    for (let i = 0; i < filters.length; i++ ) {
        if (filters[i].getElementsByTagName("input")[0].checked) {
            checked_filters.push(filters[i].innerText.toUpperCase());
        }
    }
    return checked_filters;
}

/**
 * verifyCheck(txtValue, list)
 * This function is called in the filterMultiple() method.
 * This function returns true/false if input matches one of the items in the list of checked filter items
 */
function verifyCheck(input, list) {
    let hasAMatch = false;

    if (list.length < 1) {
        return true;
    }

    for (let i = 0; i < list.length; i ++) {
        hasAMatch = ((hasAMatch) || (input.toUpperCase().includes(list[i].replaceAll(" ", ""))));
        // console.log("comparing if " + txtValue + " includes " + list[i] + " which is " + hasAMatch);
        if (hasAMatch) {
            break;
        }
    }
    return hasAMatch;
}

/**
 * verifyHasVideo(input, list)
 * This function is called in the filterMultiple() method.
 * This function returns true/false if input matches one of the items in the list of checked filter items
 */
function verifyHasVideo(input, list) {
    let hasAMatch = false;

    if (list.length < 1) {
        return true;
    }

    for (let i = 0; i < list.length; i ++) {
        hasAMatch = ((hasAMatch) || (input.toUpperCase().includes("HTTP")));
        // console.log("comparing if " + txtValue + " includes https" + " which is " + hasAMatch);
        if (hasAMatch) {
            break;
        }
    }
    return hasAMatch;
}

/**
 * checkYearRegex(txtValue, regex_list)
 * This function is called in the filterMultiple() method.
 * This function returns true/false if the input matches one of the regexes in the regex_list.
 */
function checkYearRegex(input, regex_list) {
    let hasAMatch = false;

    if (regex_list.length < 1) {
        return true;
    }

    for (let i = 0; i < regex_list.length; i ++) {
        hasAMatch = ((hasAMatch) || (regex_list[i].regex.test(input)));
        // console.log("comparing if " + txtValue + " includes " + list[i] + " which is " + hasAMatch);
        if (hasAMatch) {
            break;
        }
    }
    return hasAMatch;
}

/**
 * clearFilters()
 * This function is called when the 'Clear Filters' button is clicked.
 * This function sets the visibility of all movies to visible. It then unchecks all filters.
 */
function clearFilters() {
    resetListItemsVisibility();
    // document.getElementById("#2005-label").removeAttr('checked');
    const filters = document.getElementsByClassName("explore_checkbox");
    for (let i = 0; i < filters.length; i++ ) {
        filters[i].checked = false;
    }
    if (typeof gtag !== "undefined") {
        gtag("event", "explore_filter_clear");
    }
}

/**
 * filterMultiple()
 * This function is called when any filter button is clicked.
 * This function sets the visibility of the movies on the Explore page based on if what fields are checked.
 * */
function filterMultiple() {
    let total_displayed = 0;
    const movies = document.getElementById("movies_list");
    const movie_blocks = movies.getElementsByTagName("li");

    const year_filters = returnCheckedYearFilters();
    const release_filters = returnCheckedFilters("release_filters");
    const genre_filters = returnCheckedFilters("genre_filters");
    const availability_filters = returnCheckedFilters("availability_filters");

    for (let movie_index = 0; movie_index < movie_blocks.length; movie_index++ ) {
        const txtValue = movie_blocks[movie_index].getAttribute("data-filter-data");
        if ((checkYearRegex(txtValue, year_filters)) && (verifyCheck(txtValue, release_filters)) && (verifyCheck(txtValue, genre_filters)) && (verifyHasVideo(txtValue, availability_filters))) {
            movie_blocks[movie_index].style.display = "";
            total_displayed += 1;
        }
        else {
            movie_blocks[movie_index].style.display = "none";
        }
    }

    document.getElementById("total_displayed").innerHTML = "(" + total_displayed + " Movies)";

    if (typeof gtag !== "undefined") {
        gtag("event", "explore_filter_apply", {
            filter_year: year_filters.length > 0 ? year_filters.map(function (decades) { return decades.label; }).join(", ") : "(none)",
            filter_release: release_filters.length > 0 ? release_filters.join(", ") : "(none)",
            filter_genre: genre_filters.length > 0 ? genre_filters.join(", ") : "(none)",
            results_count: total_displayed
        });
    }
}
