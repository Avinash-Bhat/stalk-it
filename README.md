What is it???
-------------

Essentially **stalk-it** is a directory watcher, but with very simple interface.

Where to use it
---------------

It is invaluable, where you just need some folders/files to be watched over for their changes.

This little app just do that but with a simple command, or a mere JSON configuration file.

Usage
-----

For a brief details you could just run it `--help` option.

### Configuration

1. basic form - It is also the basic building block of the configuration
```json
	{ "src": "<source>", "dest": "<destination>" }
```

2. multi-source form - an array of basic config
```json
	[ { "src": "<source>", "dest": "<destination>" }, ... ]
```

3. extended form - form with configurable root
```json
	{ 
		"root": { "src": "<root-source>", "dest": "<root-destination>" },
		"stalkers": [ { "src": "<source>", "dest": "<destination>" }, ... ]
	}
```

4. extended-basic form - same as extended form but basic form replaces `stalkers` with basic configuration
```json
	{
		"root": { "src": "<root-source>", "dest": "<root-destination>" },
		"stalkers": { "src": "<source>", "dest": "<destination>" }
	}
```

5. multi-extended form - an array of extended form or extended-basic form
```json
	{
		"root": { "src": "<root-source>", "dest": "<root-destination>" }, 
		"stalkers": { 
			"root": { "src": "<sub-root-source>", "dest": "<sub-root-destination>" }, 
			"stalkers": ... 
		}
	}
```
or
```json
	{
		"root": { "src": "<root-source>", "dest": "<root-destination>" }, 
		"stalkers": [{ 
			"root": { "src": "<sub-root-source>", "dest": "<sub-root-destination>" }, 
			"stalkers": ... 
		},{
			...
		}] 
	}
```

6.  n-Xtended form - nested form of any of the above (figure it yourself)
