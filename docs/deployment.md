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

Make sure you always follow this order because : new version of fAIr utilities and fAIrpredictor should be included in the fAIr backend envs, hence it can only be done after first two release . A PR would be required to bump it to new versions and docker images should be built for the prediciton and new release of fAIr should include those versions from utilties and predictor ! 

**Post-Deployment Checklist**

* Verify Docker images for fAIr production are built and deployed (https://github.com/hotosm/fAIr/actions/runs/14220844877)
* Verify Docker image for fairpredictor is built and deployed (https://github.com/hotosm/fairpredictor/actions/runs/14220876505)
* Verify PYPI packages are available:
	+ hot-fair-utilities (https://pypi.org/project/hot-fair-utilities/)
	+ fairpredictor (https://pypi.org/project/fairpredictor/ v0.1.10)

**Database Migration Checklist**

* Login to SSH
* Login as admin
* Checkout to release
* Activate virtualenv (source env/bin/activate)
* Run `python manage.py makemigrations`
* Verify changes
* Run `python manage.py migrate`

**Flower Deployment Checklist**

* Update task definition to point to latest API endpoint

**Verification Checklist**

* Verify worker instances on EC2 (reduced to 2 instances)
* Test SMTP server connection from EC2 server
* Verify Matomo after deployment

**Documentation Checklist**

* Create a document of checklist for deployment
