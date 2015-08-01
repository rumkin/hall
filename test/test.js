var Router = require('../src/router.js');
var should = require('should');
var assert = require('assert');


describe('Router', function(){

    it('Should match simple route', function(){
        var router = Router();
        var got = false;
        var params;

        router.get('/site/:id', function(req, res, next){
            params = req.params;
            got = true;
            next();
        });

        router({
            url: '/site/123',
            method: 'GET'
        }, {}, function(err){
            should(err).have.type('undefined');
        });

        assert.deepEqual(params, {id: "123"});

        should(got).be.equal(true);
    });

    it('Should not match different methods', function(){
        var router = Router();
        var got = false;

        router.get('/site/:id', function(req, res, next){
            got = true;
            next();
        });

        router({
            url: '/site/123',
            method: 'POST'
        }, {}, function(err){
            should(err).have.type('undefined');
        });

        should(got).be.equal(false);
    });

    it('Should match any methods for all', function(){
        var router = Router();
        var got = false;

        router.all('/site/:id', function(req, res, next){
            got = true;
            next();
        });

        router({
            url: '/site/123',
            method: 'POST'
        }, {}, function(err){
            should(err).have.type('undefined');
        });

        should(got).be.equal(true);
    });

    it('Should match run before method', function(){
        var router = Router();
        var i = 0;
        var got = 0;
        var before = 0;

        router.before(function(req, res, next){
            before = ++i;
            next();
        });

        router.all('/site/:id', function(req, res, next){
            got = ++i;
            next();
        });

        router({
            url: '/site/123',
            method: 'POST'
        }, {}, function(err){
            should(err).have.type('undefined');
        });

        should(before, "Before hook").be.equal(1);
        should(got, "Method got hook").be.equal(2);
    });

    it('Should match run after method', function(){
        var router = Router();
        var i = 0;
        var got = 0;
        var after = 0;

        router.after(function(req, res, next){
            after = ++i;
            next();
        });

        router.all('/site/:id', function(req, res, next){
            got = ++i;
            next();
        });

        router({
            url: '/site/123',
            method: 'POST'
        }, {}, function(err){
            should(err).have.type('undefined');
        });

        should(got, "Method hook").be.equal(1);
        should(after, "After hook").be.equal(2);
    });

    it('Should process errors at the after loop', function(){
        var router = Router();
        var got = false;
        var afterError = false;
        var afterUsual = false;

        router.after(function(req, res, next){
            afterUsual = true;
            next();
        });

        router.after(function(err, req, res, next){
            afterError = true;
            next(err);
        });


        router.all('/site/:id', function(req, res, next){
            got = true;
            next(true);
        });

        router({
            url: '/site/123',
            method: 'POST'
        }, {}, function(err){
            should(err).have.type('boolean').and.equal(true);
        });

        should(got, "Method hook").be.equal(true);
        should(afterUsual, "After usual hook").be.equal(false);
        should(afterError, "After error hook").be.equal(true);
    });

    it('Should catch internal errors', function(){
        var router = Router();

        router.get('/site/:id', function(req, res, next){
            throw new Error('test');
        });

        router({
            url: '/site/123',
            method: 'GET'
        }, {}, function(err){
            should(err).be.instanceOf(Error)
                .and.ownProperty('message')
                .is.equal('test');
        });
    });

    it('Should filtrate requests with filter', function(){
        var filtered = false;
        var route = false;

        var router = Router();
        router.filter(function(req, resolve, reject){
            if (req.query.api === '1.0') {
                resolve();
            } else {
                filtered = true;
                reject();
            }
        });

        router.get('/test', function(req, res, next){
            route = true;
            next();
        });

        router({method: 'GET', query:{api: '2.0'}, url: '/test'}, {}, function(err){
            should(err).be.not.ok().and.have.type('undefined');
        });

        should(filtered).be.ok();
        should(route).be.not.ok();
    });

    it('Should filtrate requests with boolean', function(){
        var filtered = true;


        var router = Router();
        router.filter(function(req){
            return req.query.api === '1.0';
        });

        router.get('/test', function(req, res, next){
            filtered = false;
            next();
        });

        router({method: 'GET', query:{api: '2.0'}, url: '/test'}, {}, function(err){
            should(err).be.not.ok().and.have.type('undefined');
        });

        should(filtered).be.ok();
    });

    it('Should filtrate requests with promise', function(){
        var filtered = true;


        var router = Router();
        router.filter(function(req){
            return new Promise(function(resolve, reject){
                setImmediate(function(){
                    req.query.api === '1.0' ? resolve() : reject();
                });
            });
        });

        router.get('/test', function(req, res, next){
            filtered = false;
            next();
        });

        router({method: 'GET', query:{api: '2.0'}, url: '/test'}, {}, function(err){
            should(err).be.not.ok().and.have.type('undefined');
        });

        should(filtered).be.ok();
    });

    it('Should pass requests with filter', function(){
        var filtered = false;
        var route = false;

        var router = Router();
        router.filter(function(req){
            if (req.query.api === '1.0') {
                return true;
            } else {
                filtered = true;
                return false;
            }
        });


        router.get('/test', function(req, res, next){
            route = true;
            next();
        });

        router({method: 'GET', query:{api: '1.0'}, url: '/test'}, {}, function(err){
            should(err).be.not.ok().and.have.type('undefined');
        });

        should(filtered).be.not.ok();
        should(route).be.ok();
    });

    it('Should call filter and before in proper order', function(){
        var i = 0;
        var router = Router();
        var before1 = 0;
        var filter = 0;
        var before2 = 0;

        router.use(function (req, res, next) {
            before1 = ++i;
            next();
        });

        router.filter(function () {
            filter = ++i;
            return true;
        });

        router.use(function (req, res, next) {
            before2 = ++i;
            next();
        });

        router.get('/test', function(req, res, next){
            next();
        });

        router({
            url: '/test',
            method: 'GET'
        }, {}, function(err){
            should(err).be.not.ok();
        });

        should(before1).be.equal(1);
        should(filter).be.equal(2);
        should(before2).be.equal(3);
    });

    it('Should run router factory method', function(){
        var called = false;

        Router(function(router){
            called = true;
            should(router).have.type('function');
        });

        should(called).be.ok();
    });

    it('Should use own next method', function(){
        var router = Router();
        var ended = false;

        router.get('/test', function(req, res, next) {
            next();
        });

        router({
            method: 'GET',
            url: '/test'
        }, {
            end: function(message){
                ended = true;
                should(message).be.equal('/test not found.');
            }
        });

        should(ended).be.ok();
    });

    it('Should pass error string to own next method', function(){
        var router = Router();
        var ended = false;
        var error;

        router.get('/test', function(req, res, next) {
            error = new Error('test');
            next(error);
        });

        router({
            method: 'GET',
            url: '/test'
        }, {
            end: function(message){
                ended = true;
                should(message).be.equal(error.stack);
            }
        });

        should(ended).be.ok();
    });
});


