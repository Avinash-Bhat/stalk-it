exports.logger =(function() {
	var winston;
	
	winston = require("winston");
	
	return new winston.Logger({
		transports: [ new winston.transports.Console({colorize: true}) ]
	});
})();