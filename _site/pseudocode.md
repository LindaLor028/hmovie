POPULATE SEQUELS + PARTS OF A MOVIE 
-------
# movies.yml setup
sequel: string
basemovie: string
total_parts: int

# pseudocode (load all movies)

// load the base movie 
basemovie = null
sequel = null

if current.basemovie == page.title 
    sequel = current.sequel
    for i from 0..total_parts
        for movie in site.data.movies 
            if movie.name == sequel
                add movie.thumbnail
                add movie.link
                sequel = movie.name

for i from 0..int
    for movie in site.data.movies
        if 
