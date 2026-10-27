## v3.0.0 (2026-10-26)

### Feat

- add prediction history functionality and UI components
- update model picker components for improved tab navigation and UI enhancements
- enhance map request result functionality and update navbar state management
- update DashboardLink component to accept className prop for styling
- update dialog styles and improve imagery location modal functionality
- enhance project sharing and autosave functionality
- implement user state management with save and fetch functionality
- add custom imagery toggle support and update OpenAerialMap URL regex pattern
- add category mapping and tooltips for advanced settings, and cache GeoJSON results using React Query
- support class-based coloring in prediction maps
- enhance map preview framing
- add map request result view
- add large area mapping size limits
- add new icons and background assets, and update try-fair and user profile components
- implement user profile overview page with map requests and recent activities
- **userstate**: brings userstate tabel and its rest apis

### Fix

- **docs**: source /home/krschap/code/hotosm/fAIr/backend/.venv/bin/activate.fish
- **fix-producer-stac-with-name**: add model pre post url imagery consistency
- **docs**: update the project details in milestones
- **docs**: update the downloads figure and the project fairswipe
- **stac**: patch stac item properties assests
- **bug**: polygon color rendering on map
- **search**: add description to the search endpoint on predictions
- **category**: add category to public prediction endpoint
- logs
- **bump**: bump fair py ops
- **fmt**: fix fmt errors and reflect the oxfmt change
- **typ**: fix extension version , roll back to the version taht broke the docker sec scan
- removed Google Satellite
- add container ResizeObserver and map resize calls to prevent fitBounds layout failures
- defer map fitting when bbox is missing and hide scrollbar in user profile layout
- **legend**: read legend items from STAC always
- **stac**: add stac extension support
- **slider**: fixes legend based on stac item
- **dev**: fix dev staff user
- **zenml**: write logs to stdout not stderr, so zenml console loads logs correctly
- **backend**: ensure sigv4 signing on s3 bucket calls to aws

### Refactor

- extract navbar state into custom hook
- update offline prediction types, api routes, and user models profile page

## v2.2.25 (2026-09-23)

### Feat

- **knative**: reconcile cronjob, readiness probe, optional s3 secret
- **backend**: bundle fAIr-models pipelines and guard base-model registration

### Fix

- **format**: fix formatting issues in frontend with prettier and the lint action
- **lint**: standarize tests , adds dbfree test cases in precommit so that it wont block local development
- **nodata**: fix nodata url in the alpha
- update map tile sources in-place and use TileJSON for OAM imagery
- bug fixes for all dropped issues on slack

## v2.2.24 (2026-09-22)

### Feat

- add new try-fair tour steps
- update label from "objects" to "features"
- implement auto-dismiss  for no results
- add MapStopIcon component
- add imagery selection and model picker enhancements in TryFairPage
- Refactor mapping mode component to use new hooks and improve dropdown functionality
- implement interactive mapping mode selection and update default configuration values
- integrate custom hotosm UI styling and system font assets to resolve design conflicts
- merge landing page changes
- merge landing page changes
- merge landing page changes
- merge landing page changes
- fixed map request responsiveness
- enhance UI responsiveness and update map request modal
- implemented landing page changes

### Fix

- **backend**: add FAIR_STAC_DSN env var for direct pgstac writes
- remove dead organizations query from mapswipe client
- update imagery tile URL function
- ensure prediction layer exists before setting hover tooltip
- **milestones**: fix milestones and field projects
- **docs**: fmt omx
- **lint**: fix fmt
- **docs**: finalize initial content , fix zensical formatting
- revert font family
- resolve test failed
- resolve test failed
- **chore**: formatting
- **bump**: fair py ops
- **preview**: fix preview stac item asserts
- **try**: fix try fair default res
- **knative**: fix knative scaling with root storage
- **backend**: ensure trailing slashes don't break the login flow
- **frontend**: callback url for onboarding after successful login, upgrade hanko-login wc

### Refactor

- comment out user profile in navbar and update mapping-mode trigger layout
- share the TMS constants instead of redefining them

## v2.2.22 (2026-09-04)

## v2.2.21 (2026-09-04)

### Feat

- switch to openfreemap and reduce confidence slider marks
- switch to openfreemap and reduce confidence slider marks
- switch to openfreemap and reduce confidence slider marks
- **down**: stac downlaod via pre signed url
- updated map large area modal
- updated map large modal
- added input box to map large area modal
- updated logo and removed all old auth components
- disabled inactive navigation routes
- Deploy Production Frontend to S3 & CloudFront
- **backend**: add option to serve frontend from django (disabled by default)
- **backend**: add option to serve frontend from django (disabled by default)
- add ParkingIcon and SwimmingPoolIcon components; update ModelPicker to include new icons and display additional model information
- add Docker build steps for development and production images
- **visibility**: adds visibility toggle to the all models
- **sentry**: adds sentry support to backend for error tracking
- **3.0**: refactor , adds all the new models , drops celery , adds zenml integration
- resolved pending issues
- resolved pending issues
- added share project modal
- added share project modal
- repositioned use this image button
- repositioned use this image button
- fix feature dropdown on mobile
- complete feature to map dropdown
- complete feature to map dropdown
- added mode tag in navbar
- added mode tag in navbar
- updated icons for map large area
- updated search compoent
- simplifed custom imagery flow
- simplifed custom imagery flow
- added imagery selector
- added imagery selector
- added signin prompt modal
- added signin prompt modal
- added try fair imagery selector
- added new icons
- added new icons
- added snap to grid
- added env for grid count
- added env for grid count
- implement updates and corrections
- implement updates and corrections
- update model names
- update model names
- added points with polygons to output
- added points with polygons to output
- added points with polygons to output
- added nudge to recenter grid
- focused the grid
- updated onboarding gifs
- added site tour and download
- added site tour and download
- update active colors
- update active colors
- implement new layer actions
- implement new layer actions
- implement corrections
- implement corrections
- implement corrections
- implement corrections
- implement corrections
- implemented video feedback corrections
- disabled buttons when prediction is running
- stacified base models

### Fix

- **readme**: point CI badges and license link at the current files
- **login**: use correct url for hanko login
- **lok**: refresh uv lock file
- **knative**: fix knative registration via template
- **visibility**: add basemodel visibility query
- remove invalid scale suffix from XYZ tile URL and add TileJSON endpoint for OpenAerialMap imagery
- remove invalid scale suffix from XYZ tile URL and add TileJSON endpoint for OpenAerialMap integration
- **STAC**: fix stac public links
- **zenml**: add env variable from fair for the s3 public url
- **fix**: stac mirroring using proxy
- **chore**: enable s3 for the dev env docker
- **bump**: fairpyops
- **stac**: pinned location
- **s3**: fix s3 path for the artifact storage
- **pin**: add single endpoint for the pinned models and the apis
- **add-expand-item**: adds full expand items for the stac and fixes the fair:category instead of putting category to slug
- **stac**: add stac patch for pin
- **api**: profile with overview
- **seed**: get rid of seed and implement the basemodel registration
- **category-in-dataset**: add the serializer for the bbox and geometry support in the prediction endpoint
- **inference**: add inference endpoipont as optional for an api
- **category**: migrate category from enum to table
- **star**: add star in basemodels
- **id**: fix the stac id on the model basemodel and localmodels
- **infra**: use correct command for django-q in helm
- **cors**: echo the creds in cors
- resolve map button disabled when error occurs
- resolve map button disabled when error occurs
- resolve map button disabled when error occurs
- resolve map button disabled when error occurs
- **publicview**: fix the permission of category and make it modelcategory generic so both local and basemodel shares
- **api**: public predictions
- **api**: fixes endpoint for the feature type basemodel categories basically
- **api**: examples
- **fix**: kpi stats
- **docker**: add env
- **chore**: docker cleanup
- **helm**: fix envar setting range name
- **helm**: set envvars in helm chart
- **frontend**: fix stac envvar key name
- **frontend**: add envvars to chart frontend build
- **helm**: change readiness probe api to remove trailing slash
- **fair-stage**: Set kubelet probe headers to localhost
- **django**: better url regex to handle trailing slashes when not frontend route
- **django**: better url regex to handle trailing slashes when not frontend route
- update output type handling in TryFairPage , disable polygon if model only supports points
- bug on MobileDrawer interaction and update TryFairSidebar slider styles
- add handleOnly prop to TryFairSidebar component
- format code for better readability in navbar and model picker components
- bug: confidence threshold calculation and update model picker to display base model title
- update label from 'buildings detected' to 'objects detected' in legend and tooltip
- changed the login button to start mapping on try fair page
- **token**: fix the token with jwt
- **throttle**: allow container to hit health endpoint
- **url**: frontend url not being picked up by pydantic
- **ci**: fixes ci secrets on the backend build
- **hooks**: precommit hooks addition
- resolve dragging
- resolve dragging
- resolve dragging
- resolve dragging
- resolve not zooming and panning on mobile
- fixed mobile model picker
- fixed mobile model picker
- fix tile math
- fix chloropleth label not showing inside grid
- fix layer control icon on mobile
- stop grid from moving around
- **auth**: fix auth issues in development environment

### Refactor

- **frontend**: remove webfonts in favour of system-sans
- **frontend**: use latest hotosm/ui pkg, align with other apps, latest tool-menu
- update TOfflinePrediction model schema and migrate offline prediction
- update TOfflinePrediction model schema and migrate offline prediction
- remove unnecessary whitespace in root layout component
- additional refs updated to new image name convention
- final rename of images zenml-postgres
- remove redirect to fair prod
- remove redirect to fair prod
- remove redirect to fair prod

## v2.2.20 (2026-05-06)

### Feat

- added model_name to prediction request config|
- updated public predictions page
- added published predictions table and map view feature
- completed ai predictions page
- complete all base model enhancement
- completed base models page
- completed base models
- added markdown renderer to mapswipe project status

### Fix

- mapswipe modal not showing up
- fixed mapswipe result downloading instead of showing modal
- push requested changes
- push requested pr changes
- replace success modal with toast
- replace success modal with toast
- import alias path changed
- **zenml**: use a forced symlink for aws cli binary in fair-cli
- bump zenml version and document gh workflow for builds

## v2.2.19 (2026-03-16)

### Feat

- add published status and action to publish or retract offline predictions
- added husky
- implement mapswipe legend
- persist learn update slug to url when modal opens + tests
- added chloropleth map for mapswipe prediction results

### Fix

- **oauth**: upgrades oauth lib
- removed unused import
- fix mobile hamburger issue

### Refactor

- perform formatting and set mapswipe outline to prediction

## v2.2.18 (2026-02-11)

## v2.2.17 (2026-02-11)

## v2.2.16 (2026-02-10)

### Feat

- add patch for zenml to use postgres instead of mysql
- added share url
- add responsive carousel component with loading state and navigation
- remove Learn page link from navigation
- activated learn and resource page
- added refresh button to mapswipe status:
- added zoom control to offline predictions and training area map
- refactor getYouTubeEmbedUrl function by removing commented-out code
- update video player modal and improve YouTube embed URL handling
- add loading state to video updates in LearnPage
- enhance LearnPage with video selection and modal functionality
- learn page update
- add hoist prop to DropDown component

### Fix

- zenml config.yaml permissions in custom build
- updated mapswipe result button text

## v2.2.15 (2026-01-18)

## v2.2.14 (2026-01-18)

## v2.2.13 (2026-01-18)

## v2.2.12 (2026-01-18)

## v2.2.11 (2026-01-18)

## v2.2.10 (2026-01-18)

## v2.2.9 (2026-01-18)

## v2.2.8 (2026-01-18)

## v2.2.7 (2026-01-17)

## v2.2.6 (2026-01-14)

## v2.2.5 (2025-12-03)

### Feat

- add partial_update method to allow authenticated users to update dataset offset
- finalized map viewer
- sync with backend update, fixed status colors and more
- finalized project status dialog
- mapswipe project creation flow completed
- add retry action for failed or finished predictions in PredictionViewSet
- add example environment configuration file for development setup
- add project results retrieval for finished projects in MapswipeProjectViewSet
- add authentication and permission classes to MapswipeProjectViewSet
- add project progress status in the api
- implement custom schema inspector for automatic tag generation in Swagger

### Fix

- comment out .env file in Dockerignore and Dockerfile to prevent copying during build
- ensure .env file is copied during Docker build process
- fixed bug with project status modal after creation + backend api updates
- correct queue assignment in prediction task submission
- update prediction status from PENDING to SUBMITTED in PredictionViewSet
- correct parameter name for predictions in PredictorPredictView
- enable asynchronous prediction execution in PredictorPredictView
- update frontend URL in Docker installation documentation for consistency
- simplify environment variable assignments by removing DEBUG conditionals
- move default_db_url assignment outside of DEBUG condition
- update test_create_and_retrieve_mapswipe_project to include mock_get_obj and correct instance handling
- add missing patch for get_object_or_404 in Mapswipe project tests
- update MAPSWIPE_WEB_URL to point to the correct web application URL
-  API documentation for training, feedback, label, banner, user notification, and prediction endpoints

### Refactor

- streamline installation and setup instructions in README.md
- clean up imports and adds the folder lookup possibility in s3
- enhance error handling and validation across models, serializers, and views
- remove feedback-related models, serializers, and views

## v2.2.4 (2025-09-12)

## v2.2.3 (2025-08-26)

### Feat

- added tooltip to offline predictions name
- added clipboard icon
- support access token copy to clipboard

### Fix

- patch for offline predictions results

## v2.2.2 (2025-08-21)

## v2.2.1 (2025-08-21)

### Fix

- **stats**: fixes stats mixup

## v2.2.0 (2025-08-21)

### Feat

- add AWS_STORAGE_BUCKET_NAME to settings
- add support for .fgb streaming
- added support for cancelling offline predictions
- disabled actions when detected features is 0
- update predictions result map with labels points
- track results for prediction
- add optional folder parameter to predict_area function and serializer
- added point and polygon download to prediction result drawer
- add result_count field to Prediction model and update status handling in predict_area task
- add CRS check and conversion for geojson in run_tippecanoe
- improved feedback viz. for accepted/rejected predictions
- added support to download prediction results as either points or polygons
- create migration to remove obsolete fields from Feedback and UserNotification models, add new fields and Prediction model
- add db migrations for core and login apps, including models for AOI, Dataset, UserNotification, and OsmUser with relevant fields
- bumped to react 19
- update .gitignore and manage-dev.sh for improved directory management and logging path consistency
- update docker-compose files to consolidate volume definitions and improve directory management in scripts
- refactor docker-compose to consolidate volume definitions for backend services
- add logging and directory creation for output and input paths in training process
- finalized the mobile responsiveness of offline predictions
- finalized offline predictions
- finalized offline prediction options
- finalized drawing flow + updated results dashboard
- completed drawing flow
- add search functionality to PredictionViewSet by description field
- filter models by published status in DatasetSerializer
- add description field to Prediction model
- add source imagery type detection and update prepare_data function
- add management script for fAIr application development
- training dataset + url hash + query params
- overhaul Docker Compose setup and management scripts for improved configuration and health checks
- update prediction worker configuration in docker-compose and modify logging message in tasks.py
- completed offset
- implemented feedbacks
- update Dockerfile to streamline dependency installation and add .dockerignore for build optimization
- add offline predictor image build and publish workflows, update Dockerfile for conditional build target, and configure log volume for backend services
- add S3 upload configuration and update tasks for conditional uploads
- **prediction**: add prediction workspace and implement prediction task
- **prediction**: adds prediction model
- finalized replicable models
- improved map performance
- finalized replicable models
- improved map performance

### Fix

- remove trailing slash from stream FGB URL path
- update S3 object path to include parent bucket folder in StreamFGBView
- update S3 bucket name reference in StreamFGBView
- update email message template to clarify profile link usage
- folder url for the results when no predictions are found
- update email notification message to use class name variable
- add logging for email notification content generation
- update email notification message format , disable model id msg for now !
- update geomltoolkits to version 0.4.1 and fairpredictor to version 0.3.8
- update fairpredictor dependency to version 0.3.7
- correct layer order in run_tippecanoe function
- Remove react-map-gl
- pmtiles issue !
- add missing volume mapping for BASEMODELS_PATH in docker-compose
- fixed typing bug:
- docker compose up  , update worker image as well during the update in server
- remove results directory after predictions are generated
- replace write_json with shutil.copy for geojson files  to support both point and polygon predictions
- update fairpredictor dependency version to 0.3.6
- revert feedback icon image creation
- resized feedback icon sizec
- added model checkpoint to config when  accepting/rejecting predictions
- fixed merge conflict
- ref type issues
- fixed merge conflict
- ref type issues
- fixed layout toggle bug
- remove resource limits from backend-api-django-q service in docker-compose
- replace backend API command with gunicorn and add health checks for dependencies for prod
- add gunicorn dependency to pyproject.toml and uv.lock
- update backend API port mapping to allow external access
- add .github and fAIr-app-data to .dockerignore
- update endpoint path for training status in test_endpoints.py
- update URL path for task status endpoint in urls.py
- reorder ARG declaration and improve readability in Dockerfile.API
- update data directory paths in docker-compose and management script
- remove env_file from worker-cpu service and set DEBUG variable in manage-dev.sh
- update Docker images for postgres and flower services in docker-compose files
- update access token assignment in login and callback responses
- correct access token assignment in login response
- update backend API command and port binding in docker-compose
- update PostgreSQL user in configuration and database URL
- update Redis command and healthcheck configuration; enhance password generation in manage script
- update healthcheck command format and reduce retry count in docker-compose
- update .gitignore and manage script for environment variable handling and security improvements
- remove web server restart from migration process in management script
- update healthcheck API endpoint in backend service
- update docker-compose and manage script for environment variable consistency and service configuration
- remove unused env_file directive from GPU worker service in docker-compose
- correct image names in docker-compose files for consistency
- correct application paths in management script for consistency
- update documentation link in systemd service file for fAIr application
- correct syntax in update function to properly close if statement
- correct syntax error in createsuperuser function in management script
- update Docker images to use specific tags for API, worker, and predictor services
- comment out unused test for fetching feedback Aoi OSM label
- restructure training feedback payload and update feedback submission endpoint
- comment out unused feedback-related URL patterns in urls.py
- update Redis service configuration and remove unused environment variables
- add CELERY_BROKER_URL and CELERY_RESULT_BACKEND environment variables for Redis
- add missing permissions for actions in Docker build workflow
- add gdal installation step in backend build workflow
- add default bbox to prediction config to ensure validation passes
- update backend build workflow to use wget for downloading baseline model and install uv package
- update logging message for prediction failure in tasks.py
- update geomltoolkits dependency version and improve chips folder handling in prepare_data function
- reorganize imports and add setup_ramp function for environment configuration
- update Dockerfile references in Docker Compose and remove obsolete setup script
- rename job identifiers for consistency in Docker build workflow
- update Dockerfile references in docker-compose files for backend services
- update Docker workflow to support multi-build types and remove unused backup file
- add compatial smaller version of dockerfile for workers
- add missing group flag in requirements generation step in Dockerfile.workers
- update Dockerfile to include manage.py in the app copy step
- enhanced feature popup
- enhanced feature popup

### Refactor

- simplify layer definitions in run_tippecanoe function
- remove migrations directory from .gitignore to allow tracking of database migrations
- update UserNotification model to allow null values for content_type and object_id; modify UserNotificationSerializer to use related_obj field
- update Celery worker commands to improve task management and simplify Flower service port mapping
- enhance UserAssignmentMixin to filter queryset by current user
- override get_queryset in PredictionViewSet to filter predictions by user
- update label for orthogonalize setting to improve clarity
- rename useJOSMQ to orthogonalize and update related configurations : Frontend
- update prediction parameters and notification handling to use orthogonalization terminology, Backend
- update management script for consistency and improved production setup
- add docker-compose configuration with profiles for consistency and platform specification
- update frontend Dockerfile structure and remove obsolete files

## v2.1.9 (2025-04-16)

### Fix

- **map**: changed map font to maplibre demo tiles

## v2.1.8 (2025-04-15)

## v2.1.7 (2025-04-15)

### Fix

- enhance safe_rmtree function with retry logic and optional sudo support

## v2.1.6 (2025-04-15)

### Fix

- update hot-fair-utilities version to 2.0.12 in requirements

## v2.1.5 (2025-04-15)

### Fix

- update safe_rmtree to use sudo for final removal attempt

## v2.1.4 (2025-04-15)

### Fix

- refactor utility functions for safer file operations and improve rmtree with proper sleep method

## v2.1.3 (2025-04-10)

### Feat

- email verification flow completed
- email verification flow completed

### Fix

- clean up input path after model training completion
- update Trainer class to accept output path and improve directory structure for training data
- clean up temporary files after training and update output path in Trainer class
- fix output capture error handling in logging context manager
- improve logging output handling and notification delivery method check for web too
- **tasks**: patches safe_rmtree with fallback deletion and logging; clean up Trainer base paths
- **user**: patch profile completion percentage calculation based on email verification
- **user**: update email verification status on email change & Update the profile completion percentage
- **email**: adds verification to avoid spams
- timezone aware date formatting

### Refactor

- **ref**: let user verify its email without osm authentication

### Perf

- **secret**: support server secret if there is any

## v2.1.2 (2025-04-03)

## v2.1.1 (2025-04-02)

### Fix

- **tasks**: improve file handling and logging encoding in training process with encoding

## v2.1.0 (2025-04-01)

### Fix

- **tasks**: improve label handling and serialization for geojson output, Refactor function code -> class

## v2.0.18 (2025-03-31)

### Feat

- **offset-management**: feature to let user select offset for the labels which are being used in the training
- added mini tour for training area
- model creation flow enhancement + kpi stats delay
- replaced hot/ui matomo
- fixed favicon bug
- add systemd service files for Django, Gunicorn, and Celery setup
- update last_login field for user on data retrieval
- enhance UserSerializer to include detailed user data in GET requests
- revamped notification panel + finalized infinite scrolling
- notifications v1
- notification settings and email update
- integrated user training history
- training datasets page
- user profile dashboard wip
- **training**: add model name to search fields in TrainingViewSet
- **notifications**: enhance email message for training status updates with model name and new involvement link
- **training**: enhance notification system with detailed email messages for training status updates
- **user**: add unread notifications count to UserStatsSerializer
- **training**: add endpoint to terminate ongoing training tasks #374
- **notifications**: add endpoint to mark all notifications as read
- **notifications**: add UserNotificationViewSet for retrieving user notifications
- **notifications**: add endpoint to mark notifications as read with validation and response handling
- **notifications**: add endpoint to mark notifications as read and update serializer read-only fields
- **serializers**: rename date fields in UserNotificationSerializer for consistency
- **notifications**: implement email & web notifications for training status updates
- **models**: rename date fields in UserNotification model for consistency
- **models**: set default value for notifications_delivery_methods to "web"
- **serializers**: enhance UserStatsSerializer with additional fields to add write methods from the API patch and update representation logic for training
- **models**: add newsletter_subscription and account_deletion_requested fields to OsmUser model
- **notifications**: update UserNotification model and add UserNotificationSerializer with API endpoint
- **models**: add UserNotification model and notifications_delivery_methods field to OsmUser
- improved history stack handling

### Fix

- **utils**: enhance shift_labels_by_offset to support meter-based geometry shifting
- **tasks**: jsondump
- **tasks**: update label offset handling to write geojson directly and improve serialization
- **tasks**: update label serialization to directly write geojson data
- **tasks**: update label handling to directly modify serialized data and write to geojson
- **labels**: avoids rewritting the labels geojson and let prepare data write the labels which is what being passed to training
- **tasks**: replace standard gdf to shifted gdf clarity context
- **models**: change default offset to a static list
- **query**: only publish the active dataset ignoring draft and archived
- **centroid**: adds dataset centroid and fixes issue with id
- update default values for search parameters in StartMappingPage
- fixed mismatch in default training settings
- clean up UserSerializer and enhance DatasetSerializer for better user data representation
- **tasks**: ensure task_id is set correctly for training instance
- **urls**: uncomment notifications mark-as-read endpoint in URL configuration
- **urls**: update notifications endpoint path to include user context
- **urls**: correct typo in notifications endpoint path
- **views**: add Swagger documentation for email update in GetMyData view
- **views**: add patch method to update user email in GetMyData view
- **serializers**: correct logic for profile completion percentage calculation in UserStatsSerializer
- **serializers**: enhance profile completion percentage calculation in UserStatsSerializer
- **serializers**: add email field to UserStatsSerializer
- **serializers**: add profile_completion_percentage field to UserStatsSerializer
- **views**: update ordering fields in TrainingViewSet to include created_at
- **serializers**: rename completion_percentage to profile_completion_percentage in UserStatsSerializer
- **serializers**: standardize field formatting and add completion percentage to UserStatsSerializer
- **serializers**: add 'dataset' field to ModelMetaSerializer
- **tasks**: replace rmtree with shutil.rmtree for directory removal fix(views): add ModelMetaSerializer for model representation in TrainingSerializer
- **stats**: add userstats in /me endpoint itself
- **serializers**: include 'id' field in DatasetSerializer
- **serialize**: adds models count in dataset api
- **models**: remove unique constraint on email field in OsmUser model
- **userstats**: includes stats of user in endpoint
- **filters**: added user field in trainings endpoint
- fixed typo
- fixed overflow bug

### Refactor

- **api**: adds offset in dataset CURD
- **notifications**: remove redundant response examples from mark notification endpoint
- **notifications**: update mark notifications endpoint to handle individual notification IDs
- **notifications**: remove redundant response documentation from MarkNotificationsAsRead view

## v2.0.17 (2025-02-28)

### Feat

- switched basemap to openfreemap
- improved model creation flow + local storage persistence

### Fix

- clear local storage on creation
- fixed bug with continue button
- **model**: added model endpoint to display database details for single one
- **dataset**: adds dataset filtering

## v2.0.16 (2025-02-18)

### Fix

- update total feedback labels count to use Feedback model
- comment out VITE_MIN_TRAINING_AREA_SIZE in frontend build workflow
- enable conditional execution for npm install in frontend build workflow
- update frontend build workflow to use npm install instead of npm ci

## v2.0.15 (2025-02-12)

### Fix

- add VITE_MIN_TRAINING_AREA_SIZE to frontend build workflow

## v2.0.14 (2025-02-12)

### Fix

- update tooltips for settings in StartMappingPage content

## v2.0.13 (2025-02-12)

### Feat

- fisabled banner on start mapping page
- componentized prediction layers + persist in local storage
- enhanced auth flow + tests
- fixed 404 redirect on oauth
- persist model form to session storage

### Fix

- update default values for query parameters in StartMappingPage
- wip-layer ordering when page reloads
- fixed back button bug
- fixed predictions not showing at some zoom levels and invalid bbox
- wip
- fixed typescript bug
- fixed improper handling of environment variables + tests
- better handling of number rounding
- improved oauth
- removed unused imports
- fixed 404 flicker during oauth
- fixed JOSM bug and updated some text contents
- made progress buttons clickable during model creation
- fixed redirection in model creation flow
- improved training area contents
- updated training-dataset contents and ui fixes
- improved content of model details form
- made text-length tracker red when character is less than  text limit

## v2.0.12 (2025-02-09)

### Feat

- temporary fix for OAM disruption

## v2.0.11 (2025-01-20)

## v2.0.10 (2025-01-16)

### Fix

- removed ts-expect
- fix for typescript bug
- fixed josm ways/relation bug + predictions acceptance/rejection

## v2.0.9 (2025-01-12)

## v2.0.8 (2025-01-12)

## v2.0.7 (2025-01-09)

### Feat

- implement runserver_with_q command to start Django Q alongside the server

### Refactor

- update import statement for clarity and future migration

## v2.0.6 (2025-01-09)

### Fix

- correct Dockerfile API requirements copy command

## v2.0.5 (2025-01-09)

## v2.0.4 (2025-01-08)

### Fix

- **tests**: update status code assertion for label fetch endpoint
- **tests**: comment out unused test for workspace retrieval
- **tests**: update status code assertions and remove redundant test cases

### Refactor

- **env**: add fallback for bucketname

## v2.0.3 (2025-01-07)

### Fix

- **background-workers**: use django orm as backend instead of redis

## v2.0.2 (2025-01-03)

### Feat

- included osm hashtags and imagery source  to JOSM changeset

## v2.0.1 (2024-12-30)

### Feat

- switched to new api structure for uploading labels
- start mapping mobile v2 almost done
- completed resources page
- finalized training area map
- completed about page
- enabled navigation with progress bar during enhancement
- added status filter
- added users models page
- completed learn page
- finalized feedback popup logic: |
- mobile responsiveness and revamping of start mapping page

### Fix

- fixed bug: |
- **settings**: add global variables for epochs and batch size limits
- **tasks**: enhanced model training  zipping by adding input image path and improving file copying
- **log-production**: fixes bug on epoch limit and log production
- **workflow**: update test step to enable coverage report
- **tests**: associate AOI with user in TaskApiTest setup
- **indent**: fix bug on the major indentation
- fixed bug:
- fixed bug in updating predicted features in state

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
