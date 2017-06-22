var net		= require('net');
var config	= require('./config');
var handler	= require('./handler');


module.exports = function()
{
	return new controller();
};

/**
 * Controller module
 */
var controller = function()
{
	var self = this;

	this.buffer				= '';	// Incoming data buffer
	this.socket				= null;
	this.connection			= null;
	this.reconnectTimeout	= 0;	// Reconnection timeout for lost connection
	this.handler			= new handler();

	/**
	 * Connect to master server
	 */
	this.connect = function(reconnectTimeout)
	{
		console.log('% [Master] attempting to establish connection, port:', config.master.port);

		// Auto-reconnect if timeout is set
		self.reconnectTimeout = reconnectTimeout;

		// Create new socket connection
		self.connection			= new net.Socket();
		self.connection.buffer	= '';

		// Add a 'close' event handler for the socket
		self.connection.on('close', function() {
			console.log('- Connection closed');
		    
		    // Attempt to reconnect after "timeout" period
			if(self.reconnectTimeout)
			{
				console.log('- trying to reconnect...');
		    
				setTimeout(function(){
				    self.connection.destroy();
				    self.connect();
				}, self.reconnectTimeout);
			}
		});

		// Add an 'error' event handler
		self.connection.on('error', function(err){});

		// Handle incoming data for this instance of socket
		self.connection.on('data', function(data) {

			if(self.socket)
				self.handler.onData(self.socket, data);	
			else	
		    	self.handler.onData(self.connection, data);

		});

		// Connect to the master server
		self.connection.connect(config.master.port, 'localhost', function(){
			self.handler.dispatchEvent(self.connection, 'connected');
		});

	};

	this.close = function()
	{
		self.connection.destroy();
	};

	this.setCallbackSocket = function(socket)
	{
		this.socket = socket;
	};

	this.sendHandshake = function(handshake)
	{
		//self.connection.write('com.beba.game.v1.0\n');
		self.connection.write(handshake + '\n');
	};

	this.relayData = function(data)
	{
		//console.log('Relaying data:', data);
		//console.log('--------------------');
		self.connection.write(data);
	}


	this.authorize = function()
	{
		//self.connection.write('{"action":"host_authorization"}');
		self.connection.write('{"event":"host_authorization"}\n');
	};

	/**
	 * Get initial games data from master
	 */
	this.getGames = function()
	{
		console.log('- Requesting initial game data...');
		self.connection.write('{"event":"GetGames"}\n');
	};

	this.getPlayers = function()
	{
		console.log('- Requesting initial player data...');
		self.connection.write('{"event":"GetPlayers"}\n');
	};
};


