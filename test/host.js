'use strict'

const Switch = require('../lib');

describe('Host validation', () => {
  it('should throw error on duplicate host', () => {
    const app = context => false;
    const vhost = new Switch();

    expect(vhost.use({ host: 'localhost', app })).toBe(vhost);
    expect(() => vhost.use({ host: 'localhost', app })).toThrow();
  });

  it('should throw error on incorrect host type', () => {
    const app = context => false;
    const vhost = new Switch();

    expect(() => vhost.use({ host: 1, app })).toThrow();
    expect(() => vhost.use({ host: 1.0, app })).toThrow();
    expect(() => vhost.use({ host: true, app })).toThrow();
    expect(() => vhost.use({ host: null ,app })).toThrow();
    expect(() => vhost.use({ host: [], app })).toThrow();
    expect(() => vhost.use({ host: {}, app })).toThrow();
    expect(() => vhost.use({ app })).toThrow();
  });

  it('should throw error on incorrect host', () => {
    const app = context => false;
    const vhost = new Switch();

    // @TODO: add more invalid hostname examples
    expect(() => vhost.use({ host: 'test@test', app })).toThrow();
    expect(() => vhost.use({ host: 'test#test', app })).toThrow();
  });
});
