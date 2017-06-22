/**
 * Admin Controller
 */

var controller = function()
{
	var self = this;

	this.websocket 		= false;
	this.handler 		= new handler();
	this.uptimeTimer 	= null;
	this.activeGameType	= 'cash';

	// List of all available game types
	this.gameTypes = {
		'1/2NLHE': {name: '1/2 NL', max:9},
		'2/5NLHE': {name: '2/5 NL', max:9}
	};

	/**
	 * Initialize
	 */
	this.init = function()
	{
		// Check to see if this browser is websocket enabled
		this.websocket = ("WebSocket" in window);

		// Initialize incoming data event handlers
		var listeners = {
	  		'ready': 		self.onReady,
	  		'GetPlayers': 	self.onGetPlayers,
	  		'GetGames': 	self.onGetGames,
	  		'GetHosts':		self.onGetHosts,
	  		'GetUptime': 	self.onGetUptime
		};

		// Setup event listeners
		this.handler.setEventListeners(listeners);

		return this;
	};

	/**
	 * Run
	 */
	this.run = function()
	{
	};

	/**
	 * Listen for events
	 */
	this.listen = function()
	{
		$('#connection').on('click', function(){
			if(typeof self.websocket === 'object')
				self.websocket.close();
			else
				self.connect();
		});

		$('#game-selector th').on('click', function(){
			// self.activeGame = $(this).data('game');
		});

		return this;
	};

	/**
	 * Send data
	 */
	this.send = function(data)
	{
		self.websocket.send(data + '\n');
	};

	/**
	 * Event: onConnect
	 */
	this.onConnect = function()
	{
		$('#connection').html('Connected');
		$('#connectionIndicator').css('background','green');

		// Send authorization header to connect as admin
		console.log("Sending authorization: " + config.admin.handshake);
		
		self.send(config.admin.handshake);

		// Show game tables
		// $('#game-selector, #game-table').show();
	};

	/**
	 * Event: onDisconnect
	 */
	this.onDisconnect = function()
	{
		$('#connection').html('Disconnected');	
		$('#connectionIndicator').css('background','red');

		console.log("Connection is closed...");

		delete self.websocket;
		self.websocket = true;

		// Clear previously set uptime timer
		clearInterval(self.uptimeTimer);

		self.updateUptime(0);

		// Hide game tables
		$('#game-selector, #game-table').hide();
	};

	/**
	 * Event: onError
	 */
	this.onError = function(evt)
	{
		console.log(evt.data);
	};

	/**
	 * Connect to admin server
	 */
	this.connect = function()
	{
		if(self.websocket == false)
		{
			alert('Unable to connect to server. This browser does not support WebSocket');
			return false;
		}

		// Let us open a web socket
		self.websocket 			= new WebSocket(config.admin.websocketAddress);
		self.websocket.buffer 	= '';

		// Setup websocket event handlers
		self.websocket.onopen 	= self.onConnect;
		self.websocket.onclose 	= self.onDisconnect;
		self.websocket.onerror 	= self.onError;
		
		// Handle incoming data
		self.websocket.onmessage = function(evt) 
		{ 
			console.log(" - Data:", evt.data);
			self.handler.onData(self.websocket, evt.data);
		};
	};

	/**
	 * Event: onReady
	 */
	this.onReady = function()
	{
		console.log('Admin Terminal Ready');

		// Get master server uptime
		console.log('Getting Server Uptime...');
		self.send('{"event":"GetUptime"}');

		// Get initial games data
		console.log('Getting Games...');
		self.send('{"event":"GetGames"}');

		// Get initial players data
		console.log('Getting Players...');
		self.send('{"event":"GetPlayers"}');

		// Get initial hosts data
		console.log('Getting Hosts...');
		self.send('{"event":"GetHosts"}');

		// Subscribe to server notifications
		console.log('Subscribing to server notifications...');
		self.send('{"event":"subscribe", "list":["hosts","players","games"]}');
	};

	/**
	 * Event: onGetUptime
	 */
	this.onGetUptime = function(socket, data)
	{
		var uptime 	= self.handler.getDataObject(data);
		self.updateUptime(uptime.duration);

		// Figure out the time offset
		var offset = (new Date().getTime() / 1000) - uptime.since - uptime.duration;

		$('#uptime').data('offset', offset);
		$('#uptime').data('since', uptime.since);


		// Clear previously set uptime timer
		clearInterval(self.uptimeTimer);

		// Update server uptime on an interval
		self.uptimeTimer = setInterval(function(){

			var since 		= $('#uptime').data('since');
			var offset 		= $('#uptime').data('offset');
			var duration 	= (new Date().getTime() / 1000) - since - offset;

			// Update tick with new duration
			self.updateUptime(duration);

		}, 1000);
	};

	this.updateUptime = function(duration)
	{
		var seconds	= Math.ceil(duration);
		var hour 	= Math.floor(seconds / 3600);
		var min 	= ("0" + Math.floor((seconds - (hour * 3600)) / 60)).slice(-2);
		var sec 	= ("0" + (seconds - ((hour * 3600) + (min * 60)))).slice(-2);

		// Format properly
		hour = ("0" + hour).length > 2 ? hour : ("0" + hour);

		$('#uptime').html(hour +':'+ min +':'+ sec);
	};

	/**
	 * Event: onGetPlayers
	 */
	this.onGetPlayers = function(socket, data)
	{
		$('#players').html( self.handler.getDataObject(data).players );
	};

	/**
	 * Event: onGetGames
	 */
	this.onGetGames = function(socket, data)
	{
		var object = self.handler.getDataObject(data);
		
		// Update total
		$('#games').html(object.games.total);

		// Get game listing
		var html = self.getGameTables(object);
	
		$('#game-table tbody').empty().append(html);

		// Show game tables
		$('#game-selector, #game-table').show();
	};

	/**
	 * Event: onGetHosts
	 */
	this.onGetHosts = function(socket, data)
	{
		$('#hosts').html( Object.keys( self.handler.getDataObject(data).hosts ).length );
	};

	/**
	 * Get game table listings
	 */
	this.getGameTables = function(data)
	{
		var html 	= '';
		var games 	= data.games.type[self.activeGameType];
		var type 	= {};

		if(games)
		{
			// Build the output for all the available games
			$.each(games, function(gameType, list){

				// Get game type / info
				type = self.gameTypes[gameType];

				if(list.length > 0)
				{
					$.each(list, function(i, game){
						html += "<tr><td>#" + game.id + "</td><td>"+ type.name +"</td><td>" + game.ip + "</td><td>" + game.port + "</td><td>" + game.players +"/"+ type.max + "</td><td>"+ game.avghr +" hands/hr</td><td>"+ game.avgpot +"</td><td align='right'><button>view</button> <button>close</button></td></tr>";
					});
				}
			});
		}

		return html;
	};


};
