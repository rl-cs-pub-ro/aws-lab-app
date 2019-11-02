# Makefile for the Python app
#

PYTHON = .venv/bin/python3
PIP = "$(PYTHON)" -mpip

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

.PHONY: policies
