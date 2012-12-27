(function() {
	var settings, logger, stalk;
	
	settings = require("../lib/settings");
	logger = settings.logger;
	stalk = require("../lib/stalker").stalk;
	
	stalk({src: "./sandbox/src", dest: "./sandbox/dest"});
	logger.info("we are stalking you");
	
}());