/**
 * Data handler
 */
var handler = function()
{
	var self = this;

	// List of event listeners
	// The controller will call the event listener when the event triggered.
	// If no listeners are available, the event will be lost.
	this.listeners = {};

	/**
	 * Set event listeners
	 */
	this.setEventListeners = function(listeners)
	{
		this.listeners = listeners;
	};

	/**
	 * On incoming data handler
	 */
	this.onData = function(socket, data)
	{
		// Convert data bytes to string and append to buffer
		// TODO: reset buffer when over size limits
		socket.buffer += data.toString();

		// Keep buffering the data until we get an end of data identifier "\n"
		if(socket.buffer.substr(-1) == '\n')
		{
			socket
				.buffer
				.split('\n')
				.forEach(function(data){
					self.dispatchEvent(socket, self.getEvent(data), data);
				});

			// Reset buffer
			socket.buffer = '';
		}
	};

	/**
	 * Dispatch events
	 */
	this.dispatchEvent = function(socket, event, data)
	{
		if(event == '') return;

		//console.log('Dispatching event:', event);

		// If an event listener is registered for this event
		// then call the event listener
		if(typeof self.listeners[event] === 'function')
			self.listeners[event](socket, data);
	};

	/**
	 * Get name of event
	 */
	this.getEvent = function(data)
	{
		if(data == '') return '';

		try {
			var obj = JSON.parse(data);
			return obj.event;
		} catch (err) {
			// console.log('Unknown Error Occurred', err);
		}

		return '';
	};

	/**
	 * Get data object
	 */
	 this.getDataObject = function(data)
	 {
		try {
			return JSON.parse(data);
		} catch (err) {
			return {};
		}
	 };
};