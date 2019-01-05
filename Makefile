# Do not print "Entering directory ..."
MAKEFLAGS += --no-print-directory

all:
	@echo "Build done."

PHONY += release
release:
	@scripts/release
