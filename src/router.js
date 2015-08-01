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

        if (arguments.length === 2) {
            next = function(err) {
                if (err) {
                    res.status = 500;
                    res.end(err.stack);
                } else {
                    res.status = 400;
                    res.end(req.url + ' not found.');
                }
            };
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

        loop.skip = function(err){
            queue.length = 0;
            loop(err);
        };

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

            return this;
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

        return this;
    };

    router.filter = function(fn) {
        before.push(function(req, res, next){
            var result = fn(req, next, next.skip);
            if (typeof result === 'boolean') {
                if (result) {
                    next();
                } else {
                    next.skip();
                }
            } else if (result && result instanceof Promise) {
                result.then(next.bind(null, null), next.skip);
            }
        });
        return this;
    };

    router.before = function(fn) {
        before = before.concat(
            Array.prototype.slice.call(arguments)
        );

        return this;
    };

    router.after = function(fn) {
        after = after.concat(
            Array.prototype.slice.call(arguments)
        );

        return this;
    };

    router.use = function(fn){
        if (routes.length) {
            this.after.apply(this, arguments);
        } else {
            this.before.apply(this, arguments);
        }

        return this;
    };

    if (typeof fn === 'function') {
        fn(router);
    }

    return router;
}