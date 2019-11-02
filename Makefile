# Makefile for the Python app
#

PYTHON = .venv/bin/python3
PIP = "$(PYTHON)" -mpip

-include config.local.mk

run: .venv/.installed
	"$(PYTHON)" main.py

install: .venv/.installed

.PHONY: run install

.venv/.created:
	virtualenv -p python3 --system-site-packages .venv
	@touch .venv/.created

.venv/.installed: requirements.txt .venv/.created
	$(PIP) install --ignore-installed -r requirements.txt
	touch .venv/.installed

venv_upgrade: .venv/.created
	$(PIP) install --ignore-installed --upgrade -r requirements.txt
	touch .venv/.installed

clean_venv:
	rm -rf .venv

policies:
	"$(PYTHON)" convert_policy.py aws-config/acl.only-region.yaml
	"$(PYTHON)" convert_policy.py aws-config/acl.yaml

DEPLOY_EXCLUDE = "/webapp/" "/aws-config/" ".*" "/secrets.yaml" "/config.yaml" "/data"
DEPLOY_EXCLUDE_ARG = $(patsubst %,--exclude %,$(DEPLOY_EXCLUDE))
deploy:
	@cd webapp/ && polymer build
	rsync -ah $(DEPLOY_EXCLUDE_ARG) -e "ssh $(SERVER_SSH_ARGS)" ./ $(SERVER_ADDRESS)
	rsync -ah -e "ssh $(SERVER_SSH_ARGS)" ./webapp/build/es6-bundled/ $(SERVER_ADDRESS)/webapp-dist/

.PHONY: policies deploy


