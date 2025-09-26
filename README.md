# OCMovies-API: API de test fournissant des informations sur des films

Le projet OCMovies-API est une application web à exécuter localement dans le cadre de projets éducatifs. Cette application est implémentée sous la forme d'une API REST. Elle fournit des informations cinématographiques à partir d'urls interrogeables à l'aide d'un client HTTP graphique comme un navigateur web ou postman, ou d'un client HTTP programmatique comme requests en python ou fetch/axios en javascript. Les points d'entrée fournis par cette API de test sont consultables en lecture seule avec des points d'entrée limités aux requêtes GET.

## Structure du Projet
Ce dépôt contient :

- backend/ : l’API Django REST OCMovies-API (lecture seule, endpoints GET).

- frontend/ : l’interface web statique (Bootstrap + SCSS + JavaScript natif).

**Node est utilisé uniquement pour l’environnement de développement (compilation SCSS, Autoprefixer, live-reload). Aucun framework JS n’est utilisé côté client.**

```bash
├─ backend/                 # API Django
│  ├─ config/               # Projet Django (settings.py & urls.py)
│  ├─ movies/               # admin.py, apps.py, models.py, etc...
│  │  ├─ management         # create_db.py
│  │  ├─ migrations/    
│  ├─ api/v1                # Apps et endpoints
│  │  ├─ genres/            # apps.py, filters.py, urls.py, views.py
│  │  ├─ titles/            # apps.py, filters.py, urls.py, views.py, pagination.py   
│  ├─ data/                 # Données locales (ex. movies.db.zip)
│  └─ manage.py, Pipfile, requirements.txt, setup.cfg 

├─ frontend/                # Frontend statique (Bootstrap + SCSS + JS)
│  ├─ assets/
│  │  ├─ img/               # Images (logo)
│  │  ├─ fonts/             # Police Oswald (woff2/woff)
│  │  └─ styles/            # SCSS source + CSS compilé
│  │  └─ js/                # app.js and api.js
│  ├─ index.html
│  └─ gulpfile.js, package.json
└─ README.md, .gitignore
```

## Installation

Cette API exécutable localement peut être installée en suivant les étapes décrites ci-dessous.

### Installation et exécution de l'application

#### Prérequis
- Python 3.11+ avec pip et venv 
- Node.js 18+ avec npm

1. **Récupérer le projet**
   - Clonez ce dépôt de code à l'aide de la commande `$ git clone https://github.com/SiRipo92/JustStreamIt` (vous pouvez également télécharger une [archive zip](https://github.com/OpenClassrooms-Student-Center/OCMovies-API-EN-FR/archive/refs/heads/master.zip))
   - Placez-vous à la **racine** du projet (celle qui contient backend/ et frontend/).
2. **Ouvrir deux terminaux** :
   - Terminal A → frontend/ (Bootstrap/SCSS/JS, serveur de dev)
   - Terminal B → backend/ (Django, API)
3. **Backend (Terminal B)**
   1. Aller dans `backend/`.
   2. Créer l’environnement virtuel Python.
   3. Activer l’environnement virtuel
   - Windows : env\Scripts\activate 
   - macOS/Linux : source env/bin/activate
   4. Installer les dépendances : `pip install -r requirements.txt`
   5. Placer le dataset **local** (non versionné) dans `backend/data/movies.db.zip.
   6. Initialiser la base : `python manage.py create_db`
   7. Lancer l’API : `python manage.py runserver → http://localhost:8000
4. **Frontend (Terminal A)**
   1. Aller dans `frontend/`.
   2. Installer les dépendances : `npm install`
   3. Démarrer le serveur de dev : `npm run dev → http://localhost:5500
5. **Accès**
    - Interface web : http://localhost:5500 (le frontend interroge l’API)
    - API navigable : `http://localhost:8000/api/v1/titles/` (endpoints sous `http://localhost:8000/api/v1/)
6. **Lancement ultérieurs**
   - Backend : activer le venv puis `python manage.py runserver`. 
   - Frontend : `npm run dev`.

<blockquote>
Node/Gulp sont utilisés uniquement pour la compilation SCSS et le live-reload pendant le développement. Plus tard, vous pourrez soit servir les fichiers compilés depuis Django (un seul serveur), soit livrer un dossier dist/ statique.
</blockquote>


## Utilisation et documentation des points d'entrée

Une fois que vous avez lancé les serveur, vous pouvez lire la documentation depuis un navigateur web par le biais de l'interface navigable disponible ici [http://localhost:8000/api/v1/titles/](http://localhost:8000/api/v1/titles/). Cette interface navigable vous sert à la fois de source de documentation et de laboratoire d'expérimentation. L'API actuelle ne fournit que les points d'entrée suivants. Tous ces points d'entrée sont en lecture seule et supportent exclusivement les requêtes HTTP utilisant la **méthode GET**: 

- Rechercher et filtrer des films: [http://localhost:8000/api/v1/titles/](http://localhost:8000/api/v1/titles/). Vous pouvez tester directement chaque filtre en accédant à l'URL ci-dessus depuis un navigateur web. Les filtres disponibles sont:

   - `year=<year>`, `min_year=<year>` ou `max_year=<year>` pour obtenir des films filtrés par année. Le premier de ces filtres réalise une correspondance exacte lors de la recherche.
   - `imdb_score_min=<score>` et `imdb_score_max<score>` pour obtenir des films avec un score imdb inférieur ou supérieur à une note donnée.
   - `title=<title>` ou `title_contains=<string>` pour obtenir des films dont le titre correspond à la chaîne de caractères recherchée. Le premier effectue une recherche avec une correspondance exacte tandis que le second recherche les titres contenant le terme recherché. La recherche est indédendante de la casse.
   - `director=<director-name>` ou `director_contains=<string>` pour obtenir des films dont un réalisateur correspond à la chaîne de caractères recherchée. Le premier effectue une recherche avec une correspondance exacte tandis que le second filtre en fonction des réalisateurs contenant le terme recherché. La recherche est indédendante de la casse.
   - `writer=<name>` ou `writer_contains=<string>` pour obtenir des films dont un auteur correspond à la chaîne de caractères recherchée. Le premier effectue une recherche avec une correspondance exacte tandis que le second filtre en fonction des auteurs contenant le terme recherché. La recherche est indédendante de la casse.
   - `actor=<name>` ou `actor_contains=<string>` pour obtenir des films dont un des acteurs correspond à la chaîne de caractères recherchée. Le premier effectue une recherche avec une correspondance exacte tandis que le second filtre en fonction des acteurs contenant le terme recherché. La recherche est indédendante de la casse.
   - `genre=<name>` ou `genre_contains=<string>` pour obtenir des films dont un genre correspond à la chaîne de caractères recherchée. Le premier effectue une recherche avec une correspondance exacte tandis que le second filtre en fonction des genres contenant le terme recherché. La recherche est indédendante de la casse.
   - `country=<name>` ou `country_contains=<string>` pour obtenir des films dont un pays correspond à la chaîne de caractères recherchée. Le premier effectue une recherche avec une correspondance exacte tandis que le second filtre en fonction des pays contenant le terme recherché. La recherche est indédendante de la casse.
   - `lang=<name>` ou `lang_contains=<string>` pour obtenir des films dont la langue correspond la chaîne de caractères recherchée. Le premier effectue une recherche avec une correspondance exacte tandis que le second filtre en fonction des langues contenant le terme recherché. La recherche est indédendante de la casse.
   - `company=<name>` ou `company_contains=<string>` pour obtenir des films dont la compagnie de production correspond à la chaîne de caractères recherchée. Le premier effectue une recherche avec une correspondance exacte tandis que le second filtre en fonction des compagnies contenant le terme recherché. La recherche est indédendante de la casse.
   - `rating=<name>` ou `rating_contains=<string>` pour obtenir des films dont la classification correspond à la chaîne de caractères recherchée. Le premier effectue une recherche avec une correspondance exacte tandis que le second filtre en fonction des classifications contenant le terme recherché. La recherche est indédendante de la casse.
   - `sort_by=<field>` pour obtenir des films triés selon un ordre particulier. Par exemple, utiliser `sort_by=title` pour trier les films selon l'ordre alphabétique de teur titre et `sort_by=-title` pour trier les films dans le sens inverse. Il est également possible de trier par des critères multiples en séparant les critères par des virgules comme dans `sort_by=-year,title` qui affiche d'abord les films les plus récents, puis trie les films de la même année par ordre alphabétique.

- Demander des informations détaillées sur un film dont on connait l'identifiant: [http://localhost:8000/api/v1/titles/499549](http://localhost:8000/api/v1/titles/499549) où 499549 est l'identifiant (`id`) du film "Avatar".
- Rechercher les genres disponibles: [http://localhost:8000/api/v1/genres/](http://localhost:8000/api/v1/genres/). Les filtres disponibles sont:
   - `name_contains=<search string>` pour n'afficher que les genres dont la nom contient la chaîne de caractères recherchée.
   - `movie_title_contains=<search string>` pour rechercher les genres associés à un film dont le titre contient la chaîne de caractères recherchée.

# OCMovies-API: Test API providing movie information

The OCMovies-API project is a REST API application to be executed locally in the context
of educational projects. It provides movie information from GET http endpoints.
The API provides these endpoints to get detailed infomation about movies filtered by
various criteria such as genre, IMDB score or year. Endpoints allow users to retrieve
information for individual movies or lists of movies.

## Installation

This locally-executable API can be installed and executed from [http://localhost:8000/api/v1/titles/](http://localhost:8000/api/v1/titles/) using the following steps.

1. Clone this repository using `$ git clone https://github.com/OpenClassrooms-Student-Center/OCMovies-API-EN-FR.git` (you can also download the code [as a zip file](https://github.com/OpenClassrooms-Student-Center/OCMovies-API-EN-FR/archive/refs/heads/master.zip))
2. Move to the ocmovies-api root folder with `$ cd ocmovies-api-en`
3. Create a virtual environment for the project with `$ python -m venv env` on windows or `$ python3 -m venv env` on macos or linux.
4. Activate the virtual environment with `$ env\Scripts\activate` on windows or `$ source env/bin/activate` on macos or linux.
5. Install project dependencies with `$ pip install -r requirements.txt`
6. Create and populate the project database with `$ python manage.py create_db`
7. Run the server with `$ python manage.py runserver`

When the server is running after step 7 of the procedure, the OCMovies API can be requested from endpoints starting with the following base URL: http://localhost:8000/api/v1/titles/.

Steps 1 to 6 are only required for initial installation. For subsequent launches of the API, you only have to execute steps 4 and 7 from the root folder of the project.

## Usage and detailed endpoint documentation

One you have launched the server, you can read the documentation through the
browseable documentation interface of the API by visiting [http://localhost:8000/api/v1/titles/](http://localhost:8000/api/v1/titles/).

The API provides the following endpoints. All these endpoints are read-only and exclusively support HTTP requests using the **GET method**:

- Search and filter movies: [http://localhost:8000/api/v1/titles/](http://localhost:8000/api/v1/titles/). The filters available are:

   - `year=<year>`, `min_year=<year>` or `max_year=<year>` to get movies 
   filterd by year. The first does an exact match of the year.
   - `imdb_score_min=<score>` and `imdb_score_max<score>` to get movies with only a 
   given imdb score.
   - `title=<title>` or `title_contains=<string>` to get movies matching 
   the searched string. The first performs an exact match while the second
   searches titles containing the search term. The search 
   is independent of character case.
   - `director=<director-name>` or `director_contains=<string>` to get movies
   whose directors correspond to the searched string. The first performs an exact match 
   with the director name while the second searches director names containing the 
   search term. The search is independent of character case.
   - `writer=<name>` or `writer_contains=<string>` to get movies
   whose writers contain to the searched string. The first performs an exact match 
   with the writer name while the second searches writer names containing the 
   search term. The search is independent of character case.
   - `actor=<name>` or `actor_contains=<string>` to get movies
   whose actors correspond to the searched string. The first performs an exact match 
   with the actor name while the second searches actor names containing the 
   search term. The search is independent of character case.
   - `genre=<name>` or `genre_contains=<string>` to get movies
   whose genres correspond to the searched string. The first performs an exact match 
   with the genre name while the second searches genre names containing the 
   search term. The search is independent of character case.
   - `country=<name>` or `country_contains=<string>` to get movies
   whose countries correspond to the searched string. The first performs an exact match 
   with the country name while the second searches country names containing the 
   search term. The search is independant of character case.
   - `lang=<name>` or `lang_contains=<string>` to get movies
   whose languages corresponds to the searched string. The first performs an exact match 
   with the language name while the second searches language names containing the 
   search term. The search is independent of character case.
   - `company=<name>` or `company_contains=<string>` to get movies
   whose company corresponds to the searched string. The first performs an exact match 
   with the company name while the second searches company names containing the 
   search term. The search is independent of character case.
   - `rating=<name>` or `rating_contains=<string>` to get movies
   whose rating corresponds to the searched string. The first performs an exact match 
   with the rating name while the second searches rating names containing the 
   search term. The search is independent of character case.
   - `sort_by=<field>` to sort movies in a particular order. For example,
   use `sort_by=title` to order the movies alphabetically by title and 
   `sort_by=-title` to order the movies in the reverse direction. You can also
   sort with multiple criteria by separating the criteria using commas as in `sort_by=-year,title` that filters the movie with the most recent ones first.
   Then, within a same year, movies are filtered alphabetically according to
   their title.

- Request detailed info about a movie: [http://localhost:8000/api/v1/titles/499549](http://localhost:8000/api/v1/titles/499549) where 499549 is the `id` of the 
movie "Avatar".
- Search the available genres: [http://localhost:8000/api/v1/genres/](http://localhost:8000/api/v1/genres/). The filters available are:
   - `name_contains=<search string>` to filter only the genres containing the
   searched string.
   - `movie_title_contains=<search string>` to find the genres associated with
   a particular movie searched by title.


