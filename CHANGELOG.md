## v2.0.0 (2024-11-25)

### Feat

- **yolo**: added yolo inference support
- moved configurations to environment variables
- finalized logics for editing mode
- finalized banner
- progress with banner
- finalized start-mapping layout
- model details editing
- housekeeping + model creation completed
- implemented layouts and progress bar
- added kpi stats to homepage
- **filters**: filters on model api endpoints , adds pagination as well as centroid of models

### Fix

- **yolohom**: set defaults for yolo home
- **config**: update tag format and version to 1.1.3 in .cz.toml
- **docker**: remove pip upgrade from Dockerfile installation commands
- **requirements**: upgrade hot-fair-utilities to version 2.0.6
- **requirements**: upgrade hot-fair-utilities to version 2.0.5
- **workflows**: update Docker workflow to use ubuntu-24.04
- **requirements**: upgrade hot-fair-utilities to version 2.0.4
- **api-requirements**: upgrade fairpredictor version to 0.0.37
- **docker**: update pip installation command and upgrade fairpredictor version
- **docker**: specify python3 for pip upgrade in Dockerfiles
- **view**: restore orthogonalizer import for prediction API
- fixed typescript bug
- ordered training history by id
- fixed propation bug in tooltip
- fixed bug in training aoi labels download
- transferred file download to the browser
- fixed typescript bug
- fixed typescript bug
- **userinfo**: added missing userinfo in models directly instead of userid , adds users endpoint as well

### Refactor

- **id**: id on usersview to search

### Perf

- **order**: ordering on modelset
- **id**: adds id filter in model
- **gtlt**: greather than and leess than filter on timestamps

## v1.1.3 (2024-10-04)

## v1.1.2 (2024-10-04)

## v1.1.1 (2024-10-01)

### Feat

- training details modal, filters, and some housekeeping
- models page wip
- responsive homepage
- setup vite + react + ts
- scaffold new react + vite project
- adr for package manager + updated bundler adr with links
- added adr for bundler

### Fix

- fixed typo
- improved models list layout
- fixed bug with mobile nav when navigating between  pages
- fixed bugs during build
- reset offset when searching
- fixed typo in readme
- fixed typos and added adr for programming language
- fixed typo in adr decison
- fixed typos
- fixed tpo

## v1.1.0 (2024-09-30)

### Feat

- **acceptedFeature**: allows user to accept feature and send back to API
- new cookie banner, error boundary, and more
- **approvedpredictions**: feature to upload approbed predictions as well as curd op
- responsive homepage
- setup vite + react + ts
- scaffold new react + vite project
- adr for package manager + updated bundler adr with links
- added adr for bundler
- **aoi-upload**: let user upload aoi from geojson file
- **pre-commit-&-pdm**: adds pre-commit hooks and pdm for dependency management

### Fix

- **userinfo**: adds user info in prediction that lets user know about the user
- fixed svg bugs
- fixed drawer styling
- fixed deployment bugs
- used a different strategy for hot-tracking
- fixed styling issues with user profile menu + alert + housekeeping
- fixed typo in styles CDN url
- **trainingviews**: fixes syntax bug while running prediction
- fixed typos and added adr for programming language
- fixed typo in adr decison
- fixed typos
- fixed tpo

### Refactor

- **backend_build**: removes the run from test branch
- **aoi**: clean unused code

## v1.0.1 (2024-05-30)

### Fix

- **tasks**: only import lib when function is executed

## "v1.0.0" (2024-05-30)

### BREAKING CHANGE

- first public release

### Feat

- **commitzen**: adds commitizen for release strategy

### Fix

- image fix

## v0.1.0 (2024-05-30)

## v0.0.1 (2022-12-22)
