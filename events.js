'use strict';

var $ = require('./index');
var Promise = require('bluebird');

module.exports = EventEmitter;

/**
 * @constructor
 */
function EventEmitter() {}

/**
 * @param event
 * @param listener
 */
EventEmitter.prototype.before = function(event, listener) {
    return addTypeListener(this, 'before', event, listener);
};

/**
 * @param event
 * @param listener
 */
EventEmitter.prototype.on = function(event, listener) {
    return addTypeListener(this, 'on', event, listener);
};

/**
 * @param event
 * @param listener
 */
EventEmitter.prototype.after = function(event, listener) {
    return addTypeListener(this, 'after', event, listener);
};

/**
 * @param event
 */
EventEmitter.prototype.$emit = function(event) {
    return Promise.promisify(this.emit, { context: this }).apply(null, arguments);
};

/**
 * @param event
 */
EventEmitter.prototype.emit = function(event) {
    const me = this;
    const args = [].slice.call(arguments).slice(1);
    const callback = 'function' === typeof args[args.length - 1] ? args.pop() : null;

    const promise = Promise.coroutine(function* () {
        if (me._listeners && me._listeners['on'][event]) {

            if (me._listeners['before'][event]) {
                for (let listener of me._listeners['before'][event]) {
                    yield prepareListener(listener, callback).apply(null, args);
                }
            }

            let response = [];
            for (let listener of me._listeners['on'][event]) {
                response = yield prepareListener(listener, callback).apply(null, args);
            }

            if (me._listeners['after'][event]) {
                for (let listener of me._listeners['after'][event]) {
                    yield prepareListener(listener, callback).apply(null, args);
                }
            }

            return response;

        } else {
            throw Error('Event "' + event + '" not defined.');
        }
    })();

    if (callback) {
        return promise.done(function(response) {
            response.unshift(null);
            callback.apply(null, response);
        }, function(err) {
            callback(err);
        });
    }

    return promise.done();
};

// PRIVATE

/**
 * @param emitter
 * @param type
 * @param event
 * @param listener
 */
function addTypeListener(emitter, type, event, listener) {
    if (!emitter._listeners) {
        emitter._listeners = {
            on: {},
            after: {},
            before: {}
        };
    }

    if (!emitter._listeners[type][event]) {
        emitter._listeners[type][event] = [];
    }
    if ('on' == type && emitter._listeners[type][event].length) {
        throw Error('Listener for event "' + event + '" already defined.');
    }

    emitter._listeners[type][event].push(listener);

    return function remove() {
        const index = emitter._listeners[type][event].indexOf(listener);
        if (-1 !== index) {
            emitter._listeners[type][event].splice(index, 1);
        }
    };
}

/**
 * @param listener
 * @param callback
 * @returns {*}
 */
function prepareListener(listener, callback) {
    if (callback) {
        if ($.isGenerator(listener)) {
            return Promise.promisify(function() {
                const args = [].slice.call(arguments);
                const callback = 'function' === typeof args[args.length - 1] ? args.pop() : null;
                $.async(listener, callback).apply(null, args);
            }, {
                multiArgs: true
            });
        }

        return Promise.promisify(listener, {
            multiArgs: true
        });
    }

    if ($.isGenerator(listener)) {
        return Promise.coroutine(listener);
    }

    return Promise.promisify(listener);
}
