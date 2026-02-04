/**
 * resetListItemsVisibility(numOfFilters)
 * This function is called in the clearFilters() method.
 * This function sets the visibility of all movies on the explore page to visible.
 */
function resetListItemsVisibility(numOfFilters) {
    var movie_list = document.getElementById("movies_list");
    var movie_items = movie_list.getElementsByTagName("li");

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
    var filters = document.getElementById("year_filters").getElementsByTagName("li");
    var decade_1990s = new RegExp("199[0-9]");
    var decade_2000s = new RegExp("200[0-9]");
    var decade_2010s = new RegExp("201[0-9]");
    var decade_2020s = new RegExp("202[0-9]");
    var decade_regex = [decade_1990s, decade_2000s, decade_2010s, decade_2020s];

    const checked_regex = [];
    var array_index = 0;

    for (let i = 0; i < filters.length; i++ ) {
        if (filters[i].getElementsByTagName("input")[0].checked == true) {
            // console.log("at least one checkbox is checked!")
            checked_regex[array_index] =  decade_regex[i];
            // console.log("ADDING " + decade_regex[i] + " TO CHECKED_REGEX");
            array_index++;
        }
    }
    return checked_regex;
}

/**
 * returnCheckedFilters(id)
 * This function is called in the filterMultiple() method.
 * This function returns an array of checked filters of type id.
*/
function returnCheckedFilters(id) {
    var filters = document.getElementById(id).getElementsByTagName("li");

    var hasChecked = false;
    const checked_filters = [];
    const all_filters = [];
    var array_index = 0;
    for (let i = 0; i < filters.length; i++ ) {
        all_filters[i] = filters[i].innerText.toUpperCase();
        if (filters[i].getElementsByTagName("input")[0].checked == true) {
            // console.log("at least one checkbox is checked!")
            checked_filters[array_index] =  filters[i].innerText.toUpperCase();
            array_index++;
            hasChecked = true;
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
    var hasAMatch = false;

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
    var hasAMatch = false;

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
    var hasAMatch = false;

    if (regex_list.length < 1) {
        return true;
    }

    for (let i = 0; i < regex_list.length; i ++) {
        hasAMatch = ((hasAMatch) || (regex_list[i].test(input)));
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
    var filters = document.getElementsByClassName("explore_checkbox");
    for (let i = 0; i < filters.length; i++ ) {
        filters[i].checked = false;
    }
}

/**
 * filterMultiple()
 * This function is called when any filter button is clicked.
 * This function sets the visibility of the movies on the Explore page based on if what fields are checked.
 * */
function filterMultiple() {
    var total_displayed = 0;
    var filter_input, current_movie;
    // Collect relevant movie items
    var movies = document.getElementById("movies_list");// This is the list that contains all the movies
    var movie_blocks = movies.getElementsByTagName("li"); // We then store the movies in an array


    var year_filters = returnCheckedYearFilters(); // returns an array of regex expressions based on what year-filters are checked (e.g. 1990s = 199\d)
    var release_filters = returnCheckedFilters("release_filters"); // returns an array of categories.toUpperCase() based on what release filters are checked
    var genre_filters = returnCheckedFilters("genre_filters"); // returns an array of categories.toUpperCase() based on what release filters are checked
    var availability_filters = returnCheckedFilters("availability_filters");

    for (let movie_index = 0; movie_index < movie_blocks.length; movie_index++ ) {
        p = movie_blocks[movie_index].getAttribute("data-filter-data");
        txtValue = p;
        if ((checkYearRegex(txtValue, year_filters)) && (verifyCheck(txtValue, release_filters)) && (verifyCheck(txtValue, genre_filters)) && (verifyHasVideo(txtValue, availability_filters))) {
            movie_blocks[movie_index].style.display = "";
            total_displayed += 1;
        }
        else {
            movie_blocks[movie_index].style.display = "none";
        }
    }

    document.getElementById("total_displayed").innerHTML = "(" + total_displayed + " Movies)";
}
