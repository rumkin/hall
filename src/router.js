var RouteParser = require('route-parser');

module.exports = createRouter;

function createRouter(fn) {

    var before = [];
    var after = [];
    var routes = {};

    var router = function(req, res, next){
        var url = req.url;
        if (req.method in routes === false || ! routes[req.method].length) {
            return next();
        }

        var methodRoutes = routes[req.method];
        var i = -1;
        var len = methodRoutes.length;
        var route, match;

        while (++i < len) {
            route = methodRoutes[i];
            match = route.parser.match(url);

            if (match) {
                req.params = match;
                break;
            }
        }

        if (i == len) return next();

        var queue = [].concat(before, [route.fn], after);

        function loop(err) {
            var route;
            if (queue.length) {
                do {
                    route = queue.shift();
                    try {
                        if (err) {
                            if (route.length > 3) {
                                return route(err, req, res, loop);
                            }
                        } else {
                            if (route.length < 4) {
                                return route(req, res, loop);
                            }
                        }
                    } catch (caught) {
                        return next(caught);
                    }

                } while(queue.length);
            }

            next(err);
        }

        loop();
    };

    var methods = [
        'GET',
        'POST',
        'DELETE',
        'PUT',
        'PATCH'
    ];

    methods.forEach(function(method){
        routes[method] = [];
        router[method.toLowerCase()] = function (route, fn) {
            var parser = new RouteParser(route);
            routes[method].push({
                parser: parser,
                fn: fn
            });
        };
    });

    router.all = function(route, fn) {
        var parser = new RouteParser(route);

        methods.forEach(function(method){
            routes[method].push({
                parser: parser,
                fn: fn
            });
        });
    };

    router.before = function(fn) {
        before = before.concat(
            Array.prototype.slice.call(arguments)
        );
    };

    router.after = function(fn) {
        after = after.concat(
            Array.prototype.slice.call(arguments)
        );
    };

    if (typeof fn === 'function') {
        fn(router);
    }

    return router;
}