/**
 *
 * The master server handle load balancing for all the
 * host servers.
 *
 */

var net 		= require('net');				// Net socket library
var handler		= require('./lib/handler');		// Incoming data handler
var broadcast	= require('./lib/broadcast');
var config 		= require('./lib/config');

var master = new function()
{
	var self = this;

	this.ids 			= 0;
	this.broadcast 		= new broadcast();
	this.server 		= net.createServer();		// Create new socket server
	this.uptime 		= 0; 						// Server uptime timestamp
	this.connections	= {};						// Unverified connections
	this.hosts 			= {};						// Connected / verified host servers
	this.admins 		= {}; 						// Connected / verified administrators
	this.games 			= {};						// Active tables
	this.players 		= 0;						// Players online
	this.handler 		= null;

	/**
	 * Initialize
	 */
	this.init = function()
	{
		console.log("\nStarting Server...");
		this.server.maxConnections = config.master.maxConnections;

		// Setup event listeners
		var listeners = {
			'host_authorization': 	self.onHostAuthorization,
			'admin_authorization': 	self.onAdminAuthorization,
			'GetHosts': 			self.onGetHosts,
			'GetGames': 			self.onGetGames,
			'GetPlayers': 			self.onGetPlayers,
			'GetUptime': 			self.onGetUptime,
			'subscribe': 			self.onSubscribe
		};

		// Initialize and set up event handlers
		self.handler = new handler();
		self.handler.setEventListeners(listeners);

		return this;
	};

	/**
	 * Event: host authorization request
	 */
	this.onHostAuthorization = function(socket, data)
	{
		// Authenticate and register a new host server
		// Host servers are needed to distribute player connections
		// across multiple servers to help balance load.
		console.log('- Authenticating new host on', socket.remoteAddress + ":" + socket.remotePort);

		socket.isHost = true;
		self.hosts[ socket.id ] = socket;

		// Remove from unverified connection list
		self.connections[socket.id] = null;
        delete self.connections[socket.id];

        // Acknowledge host
        socket.write('{"event":"onAuthorize", "host_authorized":"1"}\n');

        // Broadcast this event
        self.broadcast.broadcast('hosts', self.getHostsData);
	};

	/**
	 * Event: admin authorization request
	 */
	this.onAdminAuthorization = function(socket, data)
	{
		// Authenticate and register a new admin server
		console.log('- Authenticating new admin on', socket.remoteAddress + ":" + socket.remotePort);

		socket.isAdmin = true;
		self.admins[ socket.id ] = socket;

		// Remove from unverified connection list
		self.connections[socket.id] = null;
        delete self.connections[socket.id];

        // Acknowledge admin
        socket.write('{"event":"onAuthorize", "admin_authorized":"1"}\n');
	};

	/**
	 * Event: get list of hosts
	 */
	this.onGetHosts = function(socket, data)
	{
		if(socket.isHost || socket.isAdmin)
		{
			var obj = {"event":"GetHosts", "hosts":[]};

			Object.keys(self.hosts).forEach(function(id){
				obj.hosts.push({"address": self.hosts[id].remoteAddress, "connectedTime": self.hosts[id].connectedTime});
			});

			console.log('Returning host data', obj);
			socket.write(JSON.stringify(obj) + '\n');
		}
	};

	this.getHostsData = function()
	{
		var obj = {"event":"GetHosts", "hosts":[]};

		Object.keys(self.hosts).forEach(function(id){
			obj.hosts.push({"address": self.hosts[id].remoteAddress, "connectedTime": self.hosts[id].connectedTime});
		});

		return JSON.stringify(obj);
	};

	/**
	 * Event: get games
	 * Return list of games
	 * Only host server should be getting list of games
	 * If a player wants the list of games, it should request that
	 * from the host server. This helps distribute load.
	 */
	this.onGetGames = function(socket, data)
	{
		if(socket.isHost || socket.isAdmin)
		{
			// Games data structure
			self.games = {
				"total": "1066",
				"type": {
					"cash": {
						"1/2NLHE": [],
						"2/5NLHE": [
							{id:123, ip:'60.12.55.98', port:9556, avghr:45, avgpot:99, players:6},
							{id:124, ip:'60.12.55.98', port:9577, avghr:52, avgpot:99, players:9},
							{id:125, ip:'60.12.55.98', port:9582, avghr:17, avgpot:99, players:9},
							{id:126, ip:'60.12.55.98', port:9582, avghr:60, avgpot:99, players:8},
							{id:127, ip:'60.12.55.98', port:9582, avghr:44, avgpot:99, players:8},
							{id:128, ip:'60.12.55.98', port:9582, avghr:80, avgpot:99, players:3},
							{id:129, ip:'60.12.55.98', port:9582, avghr:77, avgpot:99, players:2},
							{id:123, ip:'60.12.55.98', port:9556, avghr:45, avgpot:99, players:6},
							{id:124, ip:'60.12.55.98', port:9577, avghr:52, avgpot:99, players:9},
							{id:125, ip:'60.12.55.98', port:9582, avghr:17, avgpot:99, players:9},
							{id:126, ip:'60.12.55.98', port:9582, avghr:60, avgpot:99, players:8},
							{id:127, ip:'60.12.55.98', port:9582, avghr:44, avgpot:99, players:8},
							{id:128, ip:'60.12.55.98', port:9582, avghr:80, avgpot:99, players:3},
							{id:129, ip:'60.12.55.98', port:9582, avghr:77, avgpot:99, players:2},
							{id:123, ip:'60.12.55.98', port:9556, avghr:45, avgpot:99, players:6},
							{id:124, ip:'60.12.55.98', port:9577, avghr:52, avgpot:99, players:9},
							{id:125, ip:'60.12.55.98', port:9582, avghr:17, avgpot:99, players:9},
							{id:126, ip:'60.12.55.98', port:9582, avghr:60, avgpot:99, players:8},
							{id:127, ip:'60.12.55.98', port:9582, avghr:44, avgpot:99, players:8},
							{id:128, ip:'60.12.55.98', port:9582, avghr:80, avgpot:99, players:3},
							{id:129, ip:'60.12.55.98', port:9582, avghr:77, avgpot:99, players:2},
						],
						"5/10NLHE": [],
						"10/20NLHE": [],
					},
					"tourney": {
						"upcoming": [],
						"running": [],
						"open": [],
						"recent": []
					}
				}
			};

			console.log('Returning game data');
			socket.write(JSON.stringify({"event":"GetGames", "games":self.games}) + '\n');			
		}
	};

	/**
	 * Event: get total players
	 */
	this.onGetPlayers = function(socket, data)
	{
		if(socket.isHost || socket.isAdmin)
		{
			self.players = 999;
			console.log('Returning player data');
			socket.write(JSON.stringify({"event":"GetPlayers", "players":self.players}) + '\n');
		}
	};

	/**
	 * Event: get server uptime
	 */
	this.onGetUptime = function(socket, data)
	{
		if(socket.isHost || socket.isAdmin)
		{
			var duration = (new Date().getTime() / 1000) - self.uptime;
			socket.write(JSON.stringify({'event':'GetUptime', 'since':self.uptime, 'duration':duration}) + '\n');
		}
	};

	/**
	 * Event: onSubscribe
	 */
	this.onSubscribe = function(socket, data)
	{
		// Get object
		var obj = self.handler.getDataObject(data);

		// Add notification subscriptions
		obj.list.forEach(function(name){
			self.broadcast.join(name, socket);
		});
	};

	/**
	 * Setup server configs and start listening
	 */
	this.start = function()
	{
		// Starting listening
		this.server.listen(config.master.port, function(){
			console.log('- [Master] listening on port:', config.master.port);
			console.log('- [Ready]');

			// Set server uptime
			self.uptime = (new Date().getTime() / 1000);

			setTimeout(self.cleanup, config.master.cleanupTimeout);
		});

		/**
		 * Handle new connection
		 */
		this.server.on('connection', function(socket){

			socket.isHost 				= false;
			socket.handshakeCompleted 	= false;
		    socket.buffer 				= '';	// Incoming data buffer
		    socket.bufferSize 			= 32;
		    socket.connectedTime 		= new Date() / 1000;
		    socket.id 					= ++ self.ids;
		    socket.setNoDelay(true);


		    // Until we can authenticate and verify this connection,
		    // add it to the list of unverified connections.
		    self.connections[ socket.id ] = socket;

		    // Add a 'close' event handler to this instance of socket
		    socket.on('close', function() {
		    	self.close(socket);
		    });

		    // Remove the client from the list when it leaves
		    socket.on('end', function() {
		    	// self.close(socket);
		    });

		    // Handle incoming data for this instance of socket
		    socket.on('data', function(data) {
		    	self.handler.onData(socket, data);
		    });

		    // Handle socket error
			socket.on("error", function(err) {
				console.log('--- socket error ---', err.stack);
				self.close(socket);
			});

		});
	};

	/**
	 * Remove unverified connections
	 */
	this.cleanup = function()
	{
		var now = new Date() / 1000;
		//console.log( Object.keys(self.connections).length, 'pending connections');
		
		Object.keys(self.connections).forEach(function(id){
			// If the socket does not get verified within
			// 30 seconds then disconnect it
			if(self.connections[id].isHost != true && now - self.connections[id].connectedTime >= 5)
			{
				self.connections[id].destroy();
				self.connections[id] = null;

	        	delete self.connections[id];
			}
		});

		// Run this again after configured interval
		setTimeout(self.cleanup, config.master.cleanupTimeout);
	};

	/**
	 * Close socket
	 */
	this.close = function(socket)
	{
		console.log('[Socket connection closed]');

		// If this connection is from a host server then remove it from the list of hosts
		if(socket.isHost == true)
		{
	        console.log('Host ['+ socket.id +'] closed');

	        self.hosts[ socket.id ] = null;
	        delete self.hosts[ socket.id ];

	        // Broadcast this event
        	self.broadcast.broadcast('hosts', self.getHostsData);
	    }
	    else if(socket.isAdmin == true)
		{
	        console.log('Admin ['+ socket.id +'] closed');

	        // Unsubscribe to all broadcast subscriptions
	        self.broadcast.leaveAll(socket.id);

	        // Free socket
	        self.admins[ socket.id ] = null;
	        delete self.admins[ socket.id ];
	    }
	};
};


/**
 * Start the master server
 */
master.init().start();
