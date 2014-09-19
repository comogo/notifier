(function() {
  window.Notificator = function(apiKey, options) {
    options = options || {};

    var that      = this;
    var authUrl   = options.authUrl || 'http://localhost:3000/auth';
    var wsUrl     = options.wsUrl || 'http://localhost:3000';
    var onmessage = options.onmessage || function(data) {};
    var events    = options.events || {};

    this.apiKey   = apiKey;
    this.userId   = null;

    function socketConnection(token) {
      var socket = io.connect(wsUrl, {
        query: 'token=' + token
      });

      socket.on('connect', function() {
        console.log('Authenticated!');
      });

      socket.on('error', function() {
        console.log('erro');
      });

      socket.on('disconnect', function() {
        console.log('Disconnected!');
      });

      socket.on('message', onmessage);

      for(var k in events) {
        socket.on(k, function(data){
          events[k].apply(that, [data, socket]);
        });
      }
    }

    this.connect = function() {
      $.ajax({
        url: authUrl,
        data: { apiKey: that.apiKey },
        dataType: 'json',
        type: 'post'
      })
      .done(function(data){
        that.userId = data.userId;

        socketConnection(data.token);
      });
    };
  };
})();
