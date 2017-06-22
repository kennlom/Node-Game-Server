/**
 *
 * This server acts as a bridge between the browser websocket
 * layer and the game's master server. The reason we need this
 * is because the browser's WebSocket requires additional data
 * frame encryption, connection handshakes, etc.. that we do
 * not want to deal with.
 *
 * We will just use a 3rd party socket library to deal with
 * the WebSockets and transfer data between the master server
 * and the WebSocket as we recieve them.
 * -https://github.com/einaros/ws
 *
 */
var WebSocketServer	= require('ws').Server;
var net 			= require('net');			// Net socket library
var handler			= require('./lib/handler');	// Incoming data handler
var master 			= require('./lib/master');	// Master server
var config 			= require('./lib/config');

/**
 * Admin server
 */
var admin = new function()
{
	var self = this;

	this.ids			= 0;
	this.server			= null;				// Socket server
	this.connections	= {};				// Unverified connections
	this.handler		= new handler();


	/**
	 * Initialize
	 */
	this.init = function()
	{
		// Initialize incoming data event handlers
		var listeners = {
			'admin_authorization': 	self.onAdminAuthorize
		};

		// Setup event listeners
		this.handler.setEventListeners(listeners);

		return this;
	};

	/**
	 * Setup server configs and start listening
	 */
	this.start = function()
	{
		console.log('% Starting admin server');
		console.log('- [Admin] listening on port:', config.admin.port);
		console.log('- [Ready]');

		// Start up a new websocket server
		self.server = new WebSocketServer({ port: config.admin.port });

		// We're going to setup event listeners before initializing
		// and making the connection to the master server.
		// Initialize incoming data event handlers
		var listeners = {
			'connected':			self.onConnect,
			'admin_authorization':	self.onAdminAuthorize,
			'onAuthorize':			self.onAuthorize,
			'GetGames':				self.onGetGames,
			'GetPlayers':			self.onGetPlayers,
			'GetHosts':				self.onGetHosts,
			'GetUptime':			self.onGetUptime,
		};

		/**
		 * Handle new connection
		 */
		self.server.on('connection', function(socket){
			
			socket.buffer				= '';
			socket.handshakeCompleted	= false;
			socket.isRelaying			= false;

			// Each websocket connection will have a bridged connection
			// to the master server.
			socket.master = new master(this);
			socket.master.handler.setEventListeners(listeners);
			socket.master.setCallbackSocket(socket);
			socket.master.connect();


		    // Until we can authenticate and verify this connection,
		    // add it to the list of unverified connections.
		    // self.connections[ socket.id ] = socket;

		    // Add a 'close' event handler to this instance of socket
		    socket.on('close', function() {
		    	self.close(socket);
		    });

		    // Remove the client from the list when it leaves
		    socket.on('end', function() {
		    	// self.close(socket);
		    });

		    // Handle incoming data for this instance of socket
		    socket.on('message', function(data) {

		    	if(socket.isRelaying)
		    		socket.master.relayData(data);
		    	else
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
	 * Socket connection closed
	 */
	this.close = function(socket)
	{
		// Distroy master connection
		socket.master.close();
	};

	/**
	 * Event: connected to master server
	 */
	this.onConnect = function(socket, data)
	{
		console.log('- Connected');
		//console.log('- Attempting to authorize as "admin"');

		// Submit authorization to connect as "admin"
		// socket.master.sendHandshake(config.admin.handshake);
		//socket.write(config.admin.handshake + '\n');
	};

	/**
	 * Event: authorization as "admin" completed from websocket client
	 */
	this.onAdminAuthorize = function(socket, data)
	{
		// TODO: add failed authorization
		console.log('- Recieved admin authorization from websocket, authorizing with master');

		// Submit authorization to connect as "admin"
		socket.master.sendHandshake(config.admin.handshake);
	};

	/**
	 * Event: authorization as "admin" completed
	 */
	this.onAuthorize = function(socket, data)
	{
		// TODO: add failed authorization
		console.log('- Successfully authorized');

		// Start passing data straight to master and vice-versa
		socket.isRelaying = true;
		socket.send('{"event":"ready"}\n');
	};

	this.onGetGames = function(socket, data)
	{
		// console.log('Returning game data');
		socket.send(data + '\n');			
	};

	this.onGetPlayers = function(socket, data)
	{
		// console.log('Returning player data');
		socket.send(data + '\n');			
	};

	this.onGetHosts = function(socket, data)
	{
		// console.log('Returning host data');
		socket.send(data + '\n');			
	};

	this.onGetUptime = function(socket, data)
	{
		// console.log('Returning host data');
		socket.send(data + '\n');			
	};
}

/**
 * Start the admin server
 */
admin.init().start();


 