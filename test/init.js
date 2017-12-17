'use strict'

const Switch = require('../lib');

it('should initialize without parameters', () => {
  expect(() => new Switch()).not.toThrow();
});

it('should initialize with only trim_www parameter', () => {
  expect(() => new Switch({ trim_www: true })).not.toThrow();
  expect(() => new Switch({ trim_www: false })).not.toThrow();
});

it('should initialize with only vhosts parameter', () => {
  const app = context => false;

  // Possible app kind checking is implemented in separate test suite and there is no reason
  // to duplicate it in every single test
  expect(() => {
    const vhost = new Switch({
      vhosts: [
        { host: 'localhost', app }
      ]
    });

    expect(typeof vhost.vhosts).toBe('object');
    const keys = Object.keys(vhost.vhosts);

    expect(keys.length).toBe(1);
    expect(keys[0]).toBe('localhost');
    expect(vhost.vhosts['localhost']).toBe(app);
  }).not.toThrow();
});
