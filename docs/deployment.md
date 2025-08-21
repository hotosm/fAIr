Checklist for the deployments:

**Pre-Deployment Checklist**

* Perform sanity check on the dev env with model creation , predictions , dataset creation ! 
* Backup the Database , `python manage.py backup_db myoutputpath/backup.sql`
* Check and verify any database migration exists for the release if they do kindly verify the migrations files are stored in the git itself , production uses migrations from the repo 

**Release Checklist**

* Release fAIr utilities 
* Release fairpredictor 
* Verify the pypi releases for utilities and predictor
* Make PR to include new versions from utilities and predictor & finally Release fAIr
- Document the env variable changes that are required for this release as compared to the previous version

Make sure you always follow this order because : new version of fAIr utilities and fAIrpredictor should be included in the fAIr backend envs, hence it can only be done after first two release . A PR would be required to bump it to new versions and docker images should be built for the prediciton and new release of fAIr should include those versions from utilties and predictor ! 

**Database Migration Checklist**

Make sure you have backups available in case things go wrong ! 
* Login to SSH
* Login as admin
* Checkout to release
* Activate virtualenv (source fAIr/backend/.venv/bin/activate)
* Verify changes
* Run `python manage.py migrate`

**Deployment Checklist**

* Verify PYPI packages are available:
	+ hot-fair-utilities (https://pypi.org/project/hot-fair-utilities/)
	+ fairpredictor (https://pypi.org/project/fairpredictor/)

* Verify Docker images for fAIr production are built and deployed
*  [worker](https://github.com/hotosm/fAIr/pkgs/container/fair-worker)  , [api](https://github.com/hotosm/fAIr/pkgs/container/fair-api)  & [offline-predictor](https://github.com/hotosm/fAIr/pkgs/container/fair-offline-predictor ) images should be built and pointed to latest release 
* Verify Docker image for [fairpredictor](https://github.com/hotosm/fairpredictor/pkgs/container/fairpredictor) is built and deployed
- Now create new task definition for api , worker , predictor and prediction worker , Verify the env variable changes if there are any 
- 

**Flower Deployment Checklist**

* Update task definition to point to latest API endpoint

**Verification Checklist**

* Verify worker instances on EC2 (reduced to 2 instances)
* Test SMTP server connection from EC2 server
* Verify Matomo after deployment

