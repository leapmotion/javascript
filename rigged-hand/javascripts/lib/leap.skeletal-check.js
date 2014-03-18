//CoffeeScript generated from main/skeletal-check/leap.skeletal-check.coffee
(function() {
  Leap.plugin('skeletalCheck', function(scope) {
    scope.alert || (scope.alert = true);
    this.on('ready', function() {
      if (this.connection.opts.requestProtocolVersion < 6) {
        console.log("Leap skeletal tracking is required to run this page. Currently protocol v" + this.connection.opts.requestProtocolVersion + " is being used.");
        if (scope.alert) {
          return alert('Leap skeletal tracking is required to run this page.');
        }
      }
    });
    return {};
  });

}).call(this);
