#!/usr/bin/env node

(function() {
	var DEFAULT_OPTIONS, path, fs, cli, stalker, dirs, configFile, config, stalkers;
	
	DEFAULT_OPTIONS = {
		ignoreDotFiles: true,
		ignored: /CVS/
	};

	path = require("path");
	fs = require("fs");
	cli = require("commander");
	stalker = require("./lib/stalker");

	cli.version("0.1.1")
		.option("-s, --src <source>", "source file/dir to stalk", String)
		.option("-d, --dest <destination>", "destination", String)
		.on("--help", function() {
			console.log("  stalker.json configuration:");
			console.log("  ");
			console.log("    1. basic form");
			console.log("      {");
			console.log("        \"src\": \"the source\",");
			console.log("        \"dest\": \"the destination\"");
			console.log("      }");
			console.log("    2. multi-source form:");
			console.log("      [{");
			console.log("         \"src\": \"the source\",");
			console.log("         \"dest\": \"the destination\"");
			console.log("       },{");
			console.log("         \"src\": \"the source\",");
			console.log("         \"dest\": \"the destination\"");
			console.log("       },{");
			console.log("        ...");
			console.log("      }]");
			console.log("   3. extended form: ");
			console.log("      {");
			console.log("        \"root\": { // your root folder of all sources");
			console.log("          \"src\": \"root source\",");
			console.log("          \"dest\": \"root destination\"");
			console.log("        },");
			console.log("        \"stalkers\": [{ //rest of it is same as multi-source form");
			console.log("          \"src\": \"the source\",");
			console.log("          \"dest\": \"the destination\"");
			console.log("        },{");
			console.log("         ...");
			console.log("        }]");
			console.log("      }");
			console.log("   4. extended-basic form: ");
			console.log("        child of extended form and basic form");
			console.log("   5  . multi-extended form: ");
			console.log("        sweet child of multi-source form and extended form (may cause errors, please don't call me if they do)");
			console.log("   6. n-Xtended form: ");
			console.log("        insane brother of n-extended forms (almost sure to melt your system!!!)");
		})
		.parse(process.argv);
	
	dirs = [];
	
	if(cli.src || cli.dest) {
		if(!cli.src || !cli.dest) {
			console.log("incorrect usage\n");
			cli.help();
			process.exit(1);
		}
		
		if(!fs.existsSync(cli.dest)) {
			console.log("Invalid file: " + cli.dest);
			process.exit(2);
		}
		if(!fs.existsSync(cli.src)) {
			console.log("Invalid file: " + cli.src);
			process.exit(2);
		}
		dirs.push({ src: cli.src, dest: cli.dest });
	} else {
		if(cli.args && cli.args.length > 0) {
			configFile = cli.args[0];
		} else {
			configFile = "stalker.json";
		}
		if(!fs.existsSync(configFile)) {
			console.log((process.title === "node" ? "stalker" : process.title) + " cannot run without required config file. Please see the stalker.json configuration in usage");
			cli.help();
			process.exit(3);
		} else {
			try {
				config = JSON.parse(fs.readFileSync(configFile, "utf-8"));
			} catch (e) {
				if(e instanceof SyntaxError) {
					console.log("Unable to parse " + configFile + ": \n\t" + e);
					process.exit(3);
				}
			}
			
			try {
				// NOTE: this sweet little function automatically bring the form#5 and form#6 of configurations
				stalkers = (function runStalkers(config, src, dest, stalkers) {
					var i, l, option;
					stalkers = stalkers || [];
					if(config.src && config.dest) {
						// basic form (#1)
						if(src) { config.src = path.join(src, config.src); }
						if(dest) { config.dest = path.join(dest, config.dest); }
						if(config.options) {
							for(option in DEFAULT_OPTIONS) {
								config.options[option] = config.options[option] = DEFAULT_OPTIONS[option];
							}
						}
						config.options = DEFAULT_OPTIONS;
						stalkers.push(stalker.stalk(config));
					} else if(!isNaN(config.length) && config.push) {
						// multi-source form (#2) or multi-extended form (#5)
						for(i = 0,l = config.length; i < l; i++) {
							runStalkers(config[i], src, dest, stalkers);
						}
					} else if(config.root && config.root.src && config.root.dest && config.stalkers) {
						// extended form (#3), extended-basic form (#4), multi-extended form (#5), n-Xtended form (#6)
						if(isNaN(config.stalkers.length)) { config.stalkers = [config.stalkers]; } // for form#4
						if(src) { config.root.src = path.join(src, config.root.src); }
						if(dest) { config.root.dest = path.join(dest, config.root.dest); }
						runStalkers(config.stalkers, config.root.src, config.root.dest, stalkers);
					} else {
						console.log("Invalid form of configuration, refer stalker.json configuration in help");
						cli.help();
						process.exit(4);
					}
				}(config));
			} catch (e) {
				switch(e.code) {
					case "NO_DIR":
						console.error("Invalid configuration: " + e.cause);
						break;
					case "CIRCULAR_REF": 
						console.error("source and destination cannot be the same: " + e.cause);
						break;
				}
				process.exit(5);
			}
		}
	}
}());
