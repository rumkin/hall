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
        var before = false;

        router.before(function(req, res, next){
            before = true;
            throw new Error('test');
        });

        router.get('/site/:id', function(){});

        router({
            url: '/site/123',
            method: 'GET'
        }, {}, function(err){
            should(err).be.instanceOf(Error)
                .and.ownProperty('message')
                .is.equal('test');
        });

        should(before).be.equal(true);
    });

    it('Should run router factory method', function(){
        var called = false;

        Router(function(router){
            called = true;
            should(router).have.type('function');
        });

        should(called).be.ok();
    });
});


