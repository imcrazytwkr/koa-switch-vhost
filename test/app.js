'use strict'

const Switch = require('../lib');
const Koa = require('koa');

describe('App validation', () => {
  it('should accept regular (sync) functions as handlers', () => {
    const vhost = new Switch();

    expect(vhost.use({
      host: 'localhost',
      app(context) {
        return false;
      }
    })).toBe(vhost);
  });

  it('should accept async functions as handlers', () => {
    const vhost = new Switch();

    expect(vhost.use({
      host: 'localhost',
      async app(context) {
        await next();
      }
    })).toBe(vhost);
  });

  it('should accept arrays of middleware as handlers', () => {
    const app = async (context, next) => {
      if (!context.state.count) context.state.count = 0;
      context.state.count++;
      await next();
    }

    const last = async (context, next) => {
      context.body = `count: ${context.state.count}`;
      await next();
    }

    const vhost = new Switch();

    expect(vhost.use({
      host: 'localhost',
      app: [ app, app, app, last ]
    })).toBe(vhost);
  });

  it('should accept instances of Koa as handlers', () => {
    const vhost = new Switch();
    const app = new Koa();

    app.use(async (context, next) => {
      context.set('X-Powered-By', 'Koa');
      await next();
    });

    app.use(async (context, next) => {
      context.body = 'Hello';
      await next();
    });

    expect(vhost.use({ host: 'localhost', app })).toBe(vhost);
  });

  it('should throw error for empty or corrupt Koa instances', () => {
    const vhost = new Switch();
    const app = new Koa();

    expect(() => vhost.use({ host: 'localhost', app })).toThrow();
  });

  it('should accept multiple vhosts, either as array or as arguments', () => {
    const app = context => false;
    const vhosts = [
      { host: 'localhost', app },
      { host: 'testhost', app }
    ];

    expect(() => {
      const vhost = new Switch();
      expect(vhost.use(vhosts)).toBe(vhost);
    }).not.toThrow();

    expect(() => {
      const vhost = new Switch();
      expect(vhost.use.apply(vhost, vhosts)).toBe(vhost);
    }).not.toThrow();
  });
});
