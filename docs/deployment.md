Checklist for the deployments:

**Pre-Deployment Checklist**

* Perform sanity check on the dev env with model creation , predictions , dataset creation ! 
* Ensure PYPI package is deployed automatically after release
* Backup the Database 

**Release Checklist**

* Release fAIr utilities (https://github.com/hotosm/fAIr-utilities/releases/tag/v2.0.11)
* Release fAIr (https://github.com/hotosm/fAIr/releases/tag/v2.1.0)
* Release fairpredictor (https://github.com/hotosm/fairpredictor/releases/tag/v0.1.10)

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
