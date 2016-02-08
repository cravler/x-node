'use strict';

const $ = require('../index');
var rewire = require('rewire');
var assert = require('chai').assert;
var EventEmitter = rewire('../events');

var equalArrays = function(arr1, arr2) {
    assert.equal(JSON.stringify(arr1) === JSON.stringify(arr2), true);
};

describe("#events", function() {

    describe("#function listener", function() {

        it("test error", function(done) {

            const emmiter = new EventEmitter();

            let before = false;
            let on = false;
            let after = false;

            emmiter.before('test-error', function(callback) {
                assert.equal(before, false);
                assert.equal(on, false);
                assert.equal(after, false);
                before = true;

                callback(null);
            });

            emmiter.on('test-error', function(callback) {
                assert.equal(before, true);
                assert.equal(on, false);
                assert.equal(after, false);
                on = true;

                callback(new Error('err msg'));
            });

            emmiter.after('test-error', function(callback) {
                after = true;

                callback(null);
            });

            emmiter.emit('test-error', function(err, data) {
                assert.equal(err.message, 'err msg');
                assert.equal(data, null);

                assert.equal(before, true);
                assert.equal(on, true);
                assert.equal(after, false);

                done();
            });
        });

        it("test before error", function(done) {

            const emmiter = new EventEmitter();

            let before = false;
            let on = false;
            let after = false;

            emmiter.before('test-before-error', function(callback) {
                assert.equal(before, false);
                assert.equal(on, false);
                assert.equal(after, false);
                before = true;

                callback(new Error('before err msg'));
            });

            emmiter.on('test-before-error', function(callback) {
                assert.equal(before, true);
                assert.equal(on, false);
                assert.equal(after, false);
                on = true;

                callback(null, ['some', 'data']);
            });

            emmiter.after('test-before-error', function(callback) {
                after = true;

                callback(null);
            });

            emmiter.emit('test-before-error', function(err, data) {
                assert.equal(err.message, 'before err msg');
                assert.equal(data, null);

                assert.equal(before, true);
                assert.equal(on, false);
                assert.equal(after, false);

                done();
            });
        });

        it("test after error", function(done) {

            const emmiter = new EventEmitter();

            let before = false;
            let on = false;
            let after = false;

            emmiter.before('test-after-error', function(callback) {
                assert.equal(before, false);
                assert.equal(on, false);
                assert.equal(after, false);
                before = true;

                callback(null);
            });

            emmiter.on('test-after-error', function(callback) {
                assert.equal(before, true);
                assert.equal(on, false);
                assert.equal(after, false);
                on = true;

                callback(null, ['some', 'data']);
            });

            emmiter.after('test-after-error', function(callback) {
                assert.equal(before, true);
                assert.equal(on, true);
                assert.equal(after, false);
                after = true;

                callback(new Error('after err msg'));
            });

            emmiter.emit('test-after-error', function(err, data) {
                assert.equal(err.message, 'after err msg');
                assert.equal(data, null);

                assert.equal(before, true);
                assert.equal(on, true);
                assert.equal(after, true);

                done();
            });
        });

        it("test success", function(done) {

            const emmiter = new EventEmitter();

            let before = false;
            let on = false;
            let after = false;

            emmiter.before('test-success', function(data, callback) {
                equalArrays(data, ['some', 'data']);

                assert.equal(before, false);
                assert.equal(on, false);
                assert.equal(after, false);
                before = true;

                callback(null);
            });

            emmiter.on('test-success', function(data, callback) {
                equalArrays(data, ['some', 'data']);

                assert.equal(before, true);
                assert.equal(on, false);
                assert.equal(after, false);
                on = true;

                callback(null, ['callback:', data]);
            });

            emmiter.after('test-success', function(data, callback) {
                equalArrays(data, ['some', 'data']);

                assert.equal(before, true);
                assert.equal(on, true);
                assert.equal(after, false);
                after = true;

                callback(null);
            });

            emmiter.emit('test-success', ['some', 'data'], function(err, data) {
                assert.equal(err, null);
                equalArrays(data, ['callback:', ['some', 'data']]);

                assert.equal(before, true);
                assert.equal(on, true);
                assert.equal(after, true);

                done();
            });
        });

        it("test emit without callback", function(done) {
            const emmiter = new EventEmitter();

            emmiter.on('test-emit-without-callback', function(data, callback) {
                equalArrays(data, ['some', 'data']);
                callback(null, ['callback:', data]);
            });

            let prepareListener = EventEmitter.__get__('prepareListener');
            let revert = EventEmitter.__set__('prepareListener', function() {
                let fn = prepareListener.apply(prepareListener, arguments);
                return function() {
                    return fn.apply(null, arguments).then(function(data) {
                        equalArrays(data, ['callback:', ['some', 'data']]);
                        done();
                    });
                }
            });
            emmiter.emit('test-emit-without-callback', ['some', 'data']);
            revert();
        });

        it("test async emit", function(done) {
            const emmiter = new EventEmitter();

            emmiter.on('test-async-emit', function(data, callback) {
                equalArrays(data, ['some', 'data']);
                callback(null, ['callback:', data]);
            });

            $.async(function* () {
                return yield emmiter.$emit('test-async-emit', ['some', 'data']);
            }, function(err, data) {
                assert.equal(err, null);
                equalArrays(data, ['callback:', ['some', 'data']]);

                done();
            })();
        });
    });

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    describe("#generator listener", function() {

        it("test error", function(done) {

            const emmiter = new EventEmitter();

            let before = false;
            let on = false;
            let after = false;

            emmiter.before('test-error', function* () {
                assert.equal(before, false);
                assert.equal(on, false);
                assert.equal(after, false);
                before = true;
            });

            emmiter.on('test-error', function* () {
                assert.equal(before, true);
                assert.equal(on, false);
                assert.equal(after, false);
                on = true;

                throw new Error('err msg');
            });

            emmiter.after('test-error', function* () {
                after = true;
            });

            emmiter.emit('test-error', function(err, data) {
                assert.equal(err.message, 'err msg');
                assert.equal(data, null);

                assert.equal(before, true);
                assert.equal(on, true);
                assert.equal(after, false);

                done();
            });
        });

        it("test before error", function(done) {

            const emmiter = new EventEmitter();

            let before = false;
            let on = false;
            let after = false;

            emmiter.before('test-before-error', function* () {
                assert.equal(before, false);
                assert.equal(on, false);
                assert.equal(after, false);
                before = true;

                throw new Error('before err msg');
            });

            emmiter.on('test-before-error', function* () {
                assert.equal(before, true);
                assert.equal(on, false);
                assert.equal(after, false);
                on = true;

                return ['some', 'data'];
            });

            emmiter.after('test-before-error', function* () {
                after = true;
            });

            emmiter.emit('test-before-error', function(err, data) {
                assert.equal(err.message, 'before err msg');
                assert.equal(data, null);

                assert.equal(before, true);
                assert.equal(on, false);
                assert.equal(after, false);

                done();
            });
        });

        it("test after error", function(done) {

            const emmiter = new EventEmitter();

            let before = false;
            let on = false;
            let after = false;

            emmiter.before('test-after-error', function* () {
                assert.equal(before, false);
                assert.equal(on, false);
                assert.equal(after, false);
                before = true;
            });

            emmiter.on('test-after-error', function* () {
                assert.equal(before, true);
                assert.equal(on, false);
                assert.equal(after, false);
                on = true;

                return ['some', 'data'];
            });

            emmiter.after('test-after-error', function* () {
                assert.equal(before, true);
                assert.equal(on, true);
                assert.equal(after, false);
                after = true;

                throw new Error('after err msg');
            });

            emmiter.emit('test-after-error', function(err, data) {
                assert.equal(err.message, 'after err msg');
                assert.equal(data, null);

                assert.equal(before, true);
                assert.equal(on, true);
                assert.equal(after, true);

                done();
            });
        });

        it("test success", function(done) {

            const emmiter = new EventEmitter();

            let before = false;
            let on = false;
            let after = false;

            emmiter.before('test-success', function* (data) {
                equalArrays(data, ['some', 'data']);

                assert.equal(before, false);
                assert.equal(on, false);
                assert.equal(after, false);
                before = true;
            });

            emmiter.on('test-success', function* (data) {
                equalArrays(data, ['some', 'data']);

                assert.equal(before, true);
                assert.equal(on, false);
                assert.equal(after, false);
                on = true;

                return ['callback:', data];
            });

            emmiter.after('test-success', function* (data) {
                equalArrays(data, ['some', 'data']);

                assert.equal(before, true);
                assert.equal(on, true);
                assert.equal(after, false);
                after = true;
            });

            emmiter.emit('test-success', ['some', 'data'], function(err, data) {
                assert.equal(err, null);
                equalArrays(data, ['callback:', ['some', 'data']]);

                assert.equal(before, true);
                assert.equal(on, true);
                assert.equal(after, true);

                done();
            });
        });

        it("test emit without callback", function(done) {
            const emmiter = new EventEmitter();

            emmiter.on('test-emit-without-callback', function* (data) {
                equalArrays(data, ['some', 'data']);
                return ['callback:', data];
            });

            let prepareListener = EventEmitter.__get__('prepareListener');
            let revert = EventEmitter.__set__('prepareListener', function() {
                let fn = prepareListener.apply(prepareListener, arguments);
                return function() {
                    return fn.apply(null, arguments).then(function(data) {
                        equalArrays(data, ['callback:', ['some', 'data']]);
                        done();
                    });
                }
            });
            emmiter.emit('test-emit-without-callback', ['some', 'data']);
            revert();
        });

        it("test async emit", function(done) {
            const emmiter = new EventEmitter();

            emmiter.on('test-async-emit', function* (data) {
                equalArrays(data, ['some', 'data']);
                return ['callback:', data];
            });

            $.async(function* () {
                return yield emmiter.$emit('test-async-emit', ['some', 'data']);
            }, function(err, data) {
                assert.equal(err, null);
                equalArrays(data, ['callback:', ['some', 'data']]);

                done();
            })();
        });
    });
});
