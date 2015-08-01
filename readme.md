# Hall

Unified HTTP middleware router. It works with express, connect and native http server. It's goal is provide routring
for distributable and modular web applications.

![Travis](https://img.shields.io/travis/rumkin/json-exp/master.svg)


## Installation

```shell
npm install hall
```

## Usage

Example for connect server.

```javascript
var hall = require('hall');
var connect = require('connect');

connect()
    .use(hall(function(router){
        router.get('/product/:id', function(req, res, next) {
            res.end('Got product #' + req.params.id);
        });
    });
```

## Methods

Router has methods `before`, `after`, `filter` and `use`. This methods allow to control process of request preprocessing
and filtering.

```javascript

var router = hall();

// Preprocess request
router.before(function(req, res, next) {
    req.version = req.headers['X-API-VERSION'];
    next();
});

// Pass only 2.0 API requests.
router.filter(function(req) {
    return req.version === '2.0'
});

router.after(function(error, req, res, next) {
    // Got an error or nothing is found...
});

router.get('/product/:id', function(req, res, next){
    // Get and render product
    res.end();
});
```

### Filter

Filter method allow to filter requests in smarter way. It's using for dynamic request filtering. Filter method should
return boolean, promise or use methods;

```javascript
// Boolean
router.filter(function(req) {
    return req.hostname === 'localhost';
});

// Promise
router.filter(function(req) {
    return new Promise(function(resolve, reject) {
        // Do some async job
    });
});

// Methods
router.filter(function(req, next, skip){
    if (req.hostname === 'localhost') {
        next();
    } else {
        skip();
    }
});
```

### Use

Method `use` is context dependent and it will call before if there is no routes defined and after in other way.

```javascript
router.use(function(req, res, next) {
    // Call before
    next();
});

router.get('/product/:id', function(req, res, next){
    // Get and render product
    res.end();
});

router.use(function(req, res, next) {
    // Call after
    next();
```

## Workflow

Router will not call any method if request has no matching url. This is made for request isolation and high productivity.
If you have some job which should be done for each request move it to previous loop.