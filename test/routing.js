'use strict'

const request = require('supertest');
const Switch = require('../lib');
const Koa = require('koa');

describe('Routing capabilities', () => {
  it('should forward the request to the corresponding app', async () => {
    const vhost = new Switch();
    const host = new Koa();

    vhost.use({
      host: 'localhost',
      app(context, next) {
        context.set('X-Powered-By', 'Koa');
        context.body = 'Hello';
      }
    });

    vhost.use({
      host: '127.0.0.1',
      app(context, next) {
        context.set('X-Powered-By', 'vhost');
        context.body = 'World';
      }
    });

    host.use(vhost.switch());

    // We have to listen before the request, supertest(host.listen()) doesn't work here
    const server = host.listen(2333, 'localhost');

    const responseA = await request('http://localhost:2333').get('/');
    expect(responseA.get('X-Powered-By')).toBe('Koa');
    expect(responseA.statusCode).toBe(200);
    expect(responseA.text).toBe('Hello');

    const responseB = await request('http://127.0.0.1:2333').get('/');
    expect(responseB.get('X-Powered-By')).toBe('vhost');
    expect(responseB.statusCode).toBe(200);
    expect(responseB.text).toBe('World');

    server.close();
  });

  it('should skip to next middleware if requested host could not be matched', async () => {
    const vhost = new Switch();
    const host = new Koa();

    vhost.use({
      host: 'localhost',
      app(context) {
        context.set('X-Powered-By', 'koa-vhost-switch');
        context.body = 'matched';
      }
    });

    host.use(vhost.switch());
    host.use(context => {
      context.status = 404;
      context.body = 'nothing matched';
    });

    // We have to listen before the request, supertest(host.listen()) doesn't work here
    const server = host.listen(2333, 'localhost');

    const responseA = await request('http://localhost:2333').get('/');
    expect(responseA.get('X-Powered-By')).toBe('koa-vhost-switch');
    expect(responseA.statusCode).toBe(200);
    expect(responseA.text).toBe('matched');

    const responseB = await request('http://127.0.0.1:2333').get('/');
    expect(responseB.get('X-Powered-By')).not.toBe('koa-vhost-switch');
    expect(responseB.text).toBe('nothing matched');
    expect(responseB.statusCode).toBe(404);

    server.close();
  });

  it('should be compatible with other middleware in host app', async () => {
    const vhost = new Switch();
    const host = new Koa();

    vhost.use({
      host: 'localhost',
      app(context) {
        context.set('X-Powered-By', 'Koa');
        context.body = 'Hello';
      }
    });

    vhost.use({
      host: '127.0.0.1',
      app(context) {
        context.set('X-Powered-By', 'vhost');
        context.body = 'World';
      }
    });

    host.use(async (context, next) => {
      context.set('Server', 'Apache');
      await next();
    });

    host.use(async (context, next) => {
      await next();
      context.body += '\n' + context.path;
    });

    host.use(vhost.switch());

    host.use(context => {
      context.status = 404;
      context.body = 'nothing matched';
    });

    // We have to listen before the request, supertest(host.listen()) doesn't work here
    const server = host.listen(2333, 'localhost');

    const responseA = await request('http://localhost:2333').get('/');
    expect(responseA.get('X-Powered-By')).toBe('Koa');
    expect(responseA.get('Server')).toBe('Apache');
    expect(responseA.text).toBe('Hello\n/');
    expect(responseA.statusCode).toBe(200);

    const responseB = await request('http://127.0.0.1:2333').get('/test');
    expect(responseB.get('X-Powered-By')).toBe('vhost');
    expect(responseB.get('Server')).toBe('Apache');
    expect(responseB.text).toBe('World\n/test');
    expect(responseB.statusCode).toBe(200);

    server.close();
  });
});
