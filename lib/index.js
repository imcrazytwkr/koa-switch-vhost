'use strict'

const RFC_HOST = /^(([a-z\d]|[a-z\d][a-z\d\-]*[a-z\d])\.)*([a-z\d]|[a-z\d][a-z\d\-]*[a-z\d])$/;
const { flatten, isString, isFunction } = require('./utils');
const { DuplicateHostError } = require('./errors');
const compose = require('koa-compose');
const Koa = require('koa');

class Switch {
  constructor({ trim_www = true, vhosts = [] } = {}) {
    this.trim_www = Boolean(trim_www);
    this.vhosts = {};

    if (Array.isArray(vhosts) && vhosts.length) this.use(vhosts);
  }

  use(...vhosts) {
    if (!vhosts.length) throw new RangeError('Zero vhosts were passed to be used.');
    vhosts = flatten(vhosts);

    while (vhosts.length) this._useVhost(vhosts.pop());
    // For easy chaining
    return this;
  }

  _useVhost({ host, app }) {
    // Input validation is magic
    if (!isString(host)) throw new TypeError(`Host is not a String: ${typeof host}.`);
    if (!RFC_HOST.test(host)) throw new TypeError('Host is not RFC1123-compliant.');
    const hostname = this._trimHost(host);

    if (isFunction(this.vhosts[hostname])) throw new DuplicateHostError(hostname);
    this.vhosts[hostname] = this._mapMiddleware(app);
  }

  _mapMiddleware(app) {
    if (app instanceof Koa) {
      const { middleware } = app;
      if (Array.isArray(middleware) && middleware.length) return compose(middleware);
      throw new TypeError('Koa middleware you have passed as a handler is corrupted.');
    }

    if (Array.isArray(app)) return compose(flatten(app).map(this._mapMiddleware));
    if (!isFunction(app)) throw new TypeError(`App type is invalid: ${typeof app}.`);
    if (app.length < 1) throw new TypeError('App should accept at least 1 argument.');
    if (app.length > 2) throw new TypeError('App should accept 2 arguments at most.');
    return app;
  }

  switch() {
    return async (context, next) => {
      const app = this.vhosts[this._trimHost(context.request.hostname)];
      if (app) return await app(context, next);
      await next();
    }
  }

  _trimHost(host) {
    host = host.toLowerCase();
    if (this.trim_www && host.indexOf('www.') === 0) return host.substring(4);
    return host;
  }
}

module.exports = Switch;
