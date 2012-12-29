exports.stalk = (function() {
	var __hasProp, __extends, fs, path, settings, logger, watch, EventEmitter;
	__hasProp = {}.hasOwnProperty,
	__extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };
	
	fs = require("fs");
	path = require("path");
	EventEmitter = require('events').EventEmitter;
	watch = require("chokidar").watch;
	
	settings = require("./settings");
	logger = settings.logger;
	
	Stalker = (function(_super) {

		__extends(Stalker, _super);
		
		function StalkerError(code, cause) {
			this.code = code || "UNKNOWN";
			this.cause = cause ;
			
			this.message = this.code + (this.cause ? (" " + this.cause ) : "");
		}
		StalkerError.prototype = new Error();
		StalkerError.prototype.name = "StalkerError";

		function Stalker(config) {
			var _this, watcher;
			_this = this;
			Stalker.__super__.constructor.apply(this);
			config.src = path.normalize(config.src);
			config.dest = path.normalize(config.dest);
			if(config.src === config.dest) {
				throw new StalkerError("CIRCULAR_REF", config.src);
			} else {
				if(!fs.existsSync(config.src)) {
					throw new StalkerError("NO_DIR", config.src);
				}
				config.options = config.options || {};
				if(config.options.persistent == null) {
					config.options.persistent = true;
				}
				
				watcher = watch(config.src, config.options);
				logger.info("watching " + config.src);
				
				watcher.on("add", function(file) {
					var destFile, stream;
					
					destFile = path.normalize(path.join(config.dest, file.replace(config.src, "")));
					
					var index = destFile.lastIndexOf(path.sep);
					if(index > 0) {
						mkdirs(destFile.substr(0, index));
					}
					
					stream = fs.createReadStream(file);
					stream.pipe(fs.createWriteStream(destFile));
					stream.on("end", function() {
						logger.debug("wrote file " + file + " to " + destFile);
					});
				}).on("change", function(file) {
					var destFile, stream;
					
					destFile = path.normalize(path.join(config.dest, file.replace(config.src, "")));
					var index = destFile.lastIndexOf(path.sep);
					if(index > 0) {
						mkdirs(destFile.substr(0, index));
					}
					
					stream = fs.createReadStream(file);
					stream.pipe(fs.createWriteStream(destFile));
					stream.on("end", function() {
						logger.debug("updated file " + file + " to " + destFile);
					});
				}).on('unlink', function(file) {
					var destFile;
					
					destFile = path.normalize(path.join(config.dest, file.replace(config.src, "")));
					
					if(fs.statSync(destFile).isDirectory()) {
						fs.rmdir(destFile);
						logger.debug("removed folder " + destFile);
					} else {
						fs.unlinkSync(destFile);
						logger.debug("removed file " + destFile);
					}
				}).on('error', function(error) {
					var destFile;
					if(error.code === "ENOENT") {
						if(!fs.existsSync(error.path)) {
							destFile = path.normalize(path.join(config.dest, error.path.replace(config.src, "")));
							rmdir(destFile, function(err) {
								if(!err)
									logger.debug("removed folder " + destFile);
							});
							return;
						}
					}
					logger.error('Oops: ', error);
				});
			}
		}

		return Stalker;

	})(EventEmitter);
	
	// from wrench-js
	function mkdirs(dir, mode) {
		dir = path.normalize(dir);

		try {
			fs.mkdirSync(dir, mode);
		} catch(err) {
			if(err.code == "ENOENT") {
				var index = dir.lastIndexOf(path.sep);

				if(index > 0) {
					var parentPath = dir.substring(0, index);
					mkdirs(parentPath, mode);
					mkdirs(dir, mode);
				} else {
					throw err;
				}
			} else if(err.code == "EEXIST") {
				return;
			} else {
				throw err;
			}
		}
	}
	
	// from wrench-js
	function rmdir(dir, callback) {
		fs.readdir(dir, function(err, files) {
			if (err && callback) {
				callback(err);
				return;
			}
			(function rmFile(err) {
				if (err && callback) {
					callback(err);
					return;
				}

				var filename = files.shift();
				if (!filename) {
					if (err && callback) {
						callback(err);
						return;
					}
				}

				var file = path.join(dir, filename);
				fs.lstat(file, function(err, stat) {
					if (err && callback) {
						callback(err);
						return;
					}
					if (stat.isDirectory()) {
						rmdir(file, rmFile);
					} else {
						fs.unlink(file, rmFile);
					}
				});
			})();
		});
	}
	
	return function(config) {
		return new Stalker(config);
	};
})();
