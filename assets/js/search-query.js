
function filterActors(query) {
    var hasAtLeastOne = false;
    var input, filter, ul, li, a, i, txtValue;
    input = query;
    filter = query.toUpperCase();
    ul = document.getElementById("actors_list");
    li = ul.getElementsByTagName("li");
    for (i = 0; i < li.length; i++) {
        a = li[i].getAttribute("data-movie-title");
        // console.log("A is: " + a);
        if (a.toUpperCase().indexOf(filter) > -1) {
            li[i].style.display = "";
            hasAtLeastOne = true;
        } else {
            li[i].style.display = "none";
        }
    }

    if (hasAtLeastOne) {
        document.getElementById("search_actor_header").style.display = "";
    }
    else {
        document.getElementById("search_actor_header").style.display = "none";
    }
    return hasAtLeastOne;
}

function filterMovies(query) {
    var hasAtLeastOne = false;
    var input, filter, ul, li, a, i, txtValue;
    input = query;
    filter = query.toUpperCase();
    ul = document.getElementById("movies_search_list");
    li = ul.getElementsByTagName("li");
    for (i = 0; i < li.length; i++) {
        a = li[i].getAttribute("data-movie-title");
        // console.log("A is: " + a);
        if (a.toUpperCase().indexOf(filter) > -1) {
            li[i].style.display = "";
            hasAtLeastOne = true;
        } else {
            li[i].style.display = "none";
        }
    }

    for (i = 0; i < li.length; i++) {
        a = li[i].getAttribute("data-movie-cast");
        // console.log("A is: " + a);
        if (a.toUpperCase().indexOf(filter) > -1) {
            li[i].style.display = "";
            hasAtLeastOne = true;
        } 
    }

    if (hasAtLeastOne) {
        document.getElementById("search_movie_header").style.display = "";
        document.getElementById("movies_search_list").style.display = "";
    }
    else {
        document.getElementById("search_movie_header").style.display = "none";
        document.getElementById("movies_search_list").style.display = "none";
    }

    return hasAtLeastOne;
}

function postIfNone(query, hasActor, hasMovie) {
    if (hasActor || hasMovie) {
        document.getElementById("no_results").style.display = "none";
    }
    else {
        document.getElementById("no_results").style.display = "";
    }

}

function getQueryVariable(variable) {
        var query = window.location.search.substring(1),
            vars = query.split("&");

        for (var i = 0; i < vars.length; i++) {
            var pair = vars[i].split("=");

            if (pair[0] === variable) {
                return decodeURIComponent(pair[1].replace(/\+/g, '%20')).trim();
            }
        }
}

var query = decodeURIComponent((getQueryVariable("q") || "").replace(/\+/g, "%20"));
// console.log(query);
var hasActor = filterActors(query);
var hasMovie = filterMovies(query);
postIfNone(query, hasActor, hasMovie);