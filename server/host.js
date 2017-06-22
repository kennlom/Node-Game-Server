/**
 *
 * The host server handle connections and communications to
 * connected players.
 *
 */

var net 		= require('net');			// Net socket library
var handler		= require('./lib/handler');	// Incoming data handler
var master 		= require('./lib/master');	// Master server
var config 		= require('./lib/config');

/**
 * Host server
 */
var host = new function()
{
	var self = this;

	this.ids			= 0;
	this.master			= null;						// Socket connection to master server
	this.server			= null;						// Socket server
	this.connections	= {};						// Unverified connections
	this.games			= {};						// Connected / verified game servers
	this.players		= 0;						// Players online [this host instance]
	this.totalPlayers	= 0;						// All players online [all host instances]
	this.handler		= new handler(this);


	/**
	 * Initialize
	 */
	this.init = function()
	{
		console.log("\nStarting Host...");
		return this;
	};

	/**
	 * Setup server configs and start listening
	 */
	this.start = function()
	{
		// Initialize incoming data event handlers
		var listeners = {
			'connected': 		self.onConnect,
			'onAuthorize': 		self.onAuthorize,
			'GetGames': 		self.onGetGames,
			'GetPlayers': 		self.onGetPlayers,
		};

		// We're going to setup event listeners before initializing
		// and making the connection to the master server.
		self.master = new master(this);
		self.master.handler.setEventListeners(listeners);
		self.master.connect();
	};

	/**
	 * Event: get games
	 */
	this.onGetGames = function(socket, data)
	{
		var obj = self.handler.getDataObject(data);

		console.log(' - Total games:', Object.keys(obj.games).length);
		self.games = obj.games;
	};

	/**
	 * Event: get total players online
	 */
	this.onGetPlayers = function(socket, data)
	{
		var obj = self.handler.getDataObject(data);

		console.log(' - Total players online:', obj.players);
		self.players = obj.players;
	}

	/**
	 * Event: connected to master server
	 */
	this.onConnect = function(data)
	{
		console.log('- Connected');
		console.log('- Attempting to authorize as "host"');

		// Submit authorization to connect as "host"
		self.master.sendHandshake(config.host.handshake);
		//self.master.authorize();
	};

	/**
	 * Event: authorization as "host" completed
	 */
	this.onAuthorize = function(data)
	{
		// TODO: add failed authorization
		console.log('- Successfully authorized');

		// Start the host server if not already started
		self.StartHost();

		// Get initial server data
		self.initServerData();
	};



	/**
	 * Start host server
	 */
	this.StartHost = function()
	{
		if(self.server != null)
			return;

		console.log('% Starting host server');


		self.server = net.createServer();
		self.server.maxConnections = config.host.maxConnections;

		self.server.listen(config.host.port, function(){
			console.log('- [Host] listening on port:', config.host.port);
			console.log('- [Ready]');
		});

		/**
		 * Handle new connection
		 */
		self.server.on('connection', function(socket){
			self.handler.do(socket, data);
		});
	};

	/**
	 * Initialize server data
	 */
	this.initServerData = function()
	{
		// Reset all server data (just in case we lost connection)
		self.games		= {};
		self.players	= 0;

		/*
			After we successfully connected to the master server,
			get the initial data by downloading all server state such
			as the games list & players data locally to the host.

			The host can then begin subscribing to new events.
			Ie: games, players, messages...
		*/
		self.master.getGames();
		self.master.getPlayers();
	};
}

/**
 * Start the host server
 */
host.init().start();


