test:
	bin/tman
	bin/tman --no-timeout test/cli/no-timeout
	bin/tman -r test/cli/require-a test/cli/require-b
	!(bin/tman -t 650 test/cli/timeout)
	bin/tman test/cli/test-in-src
	node test/cli/test-in-src --test=root
	TEST=root node test/cli/test-in-src
	bin/tman -r coffee-script/register test/coffee
	bin/tman -r ts-node/register test/ts
	open test/browser/index.html

.PHONY: test