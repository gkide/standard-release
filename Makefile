# If it is true the result will be 1
isTrue = $(strip $(filter-out 1 ON On on TRUE True true,$1))1
# If it is false the result will be 1
isFalse = $(strip $(filter-out 0 OFF Off off FALSE False false,$1))1
# If it contains spaces the result will be 1
hasSpaces = $(if $(subst 1,,$(words [$1])),1,)
# If it contains colons the result will be 1
hasColons = $(call hasSpaces,$(subst :, ,$1))

# Project source tree, should not contain spaces or colons
# SOURCE_DIR := $(shell pwd)
SOURCE_DIR := $(CURDIR)

ifeq ($(call hasSpaces,$(SOURCE_DIR)),1)
    $(error Project path can NOT contain spaces: "$(SOURCE_DIR)")
endif
ifeq ($(call hasColons,$(SOURCE_DIR)),1)
    $(error Project path can NOT contain colons: "$(SOURCE_DIR)")
endif

# Do not print "Entering directory ..."
MAKEFLAGS += --no-print-directory

PHONY += all
all:
	@echo "Build Done."

PHONY += release
release:
	@scripts/release

PHONY += publish
publish: release
	@npm publish

.PHONY: $(PHONY)
