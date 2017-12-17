# koa-switch-vhost

## Installation

``` shell
$ yarn add koa-switch-vhost
```

## Example

``` javascript
const Koa = require('koa');
const Switch = require('koa-switch-vhost');

// Import sub-apps
const api = require('./apps/api');
const moe = require('./apps/moe');
const blog = require('./apps/blog');
const forum = require('./apps/forum');
const unicode = require('./apps/unicode');

// Set up a host
const host = new Koa();

// Set up vhost switch
const vhost = new Switch();

/**
 * Configure vhosts
 * Currently only supports pattern-app mappings only as an array of objects.
 * Unlike in most of other vhost middleware, hostnames should be strings.
 */

// Supports pattern-app mappings as an object
vhost.use({
  host: 'blog.example.com',
  app: blog
});

// Supports pattern-app mappings as array of objects and many-to-one mappings
vhost.use([
  {
    host: 'bbs.example.com',
    app: forum
  },
  {
    host: 'forum.example.com',
    app: forum
  }
]);

// Supports pattern-app mappings as a argument list of objects
vhost.use({
  host: 'board.example.com',
  app: forum
}, {
  host: 'api.example.com',
  app: api
});


// Only supports RFC1123 hostnames. @NOTE: Any of these will throw a TypeError
vhost.use({
  host: '中文域名.com',
  app: unicode
});

// @NOTE: This will throw because one of the supplied hosts is not RFC-compliant
vhost.use({
  host: '萌.io',
  app: moe
}, {
  host: 'moe.io',
  app: moe
});

// Supports basic global controls serving as regular Koa middleware
host.use(async (context, next) => {
  context.set('Server', 'Koa');
  await next();
});

// Switch will skip to next middleware if there was no app for the supplied host
host.use(vhost.switch());
host.use((context) => {
  context.status = 404;
  context.body = 'nothing matched';
});

// Listen and enjoy
host.listen(80);
```

## API

### new Switch(config)

* `config` (`Object`) - configuration
  * `config.trim_www?` (`Bool`) - specifies whether the switch should trim `www.` before
    matching the host. Default: `true`.
  * `config.vhosts?` (`Array`) - array of vhost data objects. Default: `[]`.

Example:

``` javascript
const Switch = require('koa-switch-vhost');

// You can disable `www.` trimming for hostnames
const vhost = new Switch({ trim_www: false });

// You can also supple vhosts to be added on Switch initialization
const vhost2 = new Switch({
  vhosts: [
    {
      host: 'bbs.example.com',
      app: forum
    },
    {
      host: 'forum.example.com',
      app: forum
    }
  ]
});

// Or you can do both at the same time if you wish so
const supervhost = new Switch({
  trim_www: false,
  vhosts: [
    {
      host: 'bbs.example.com',
      app: forum
    },
    {
      host: 'forum.example.com',
      app: forum
    }
  ]
});
```

### Switch#use({ vhost data object })

Vhost data object must have exactly two parameters:

* host (`String`) - host used to match the hostname
* app (`Object` | `Array`) - Koa app, Koa middleware or an array of Koa middleware

Example:

``` javascript
const Koa = require('koa');
const Switch = require('koa-switch-vhost');

// Importing sub-apps
const api = require('./apps/api');
const moe = require('./apps/moe');
const blog = require('./apps/blog');

const vhost = new Switch();

vhost.use({
  host: 'blog.example.com',
  app: blog
});

vhost.use({
  host: 'api.example.com',
  app: api
});

vhost.use({
  host: 'example.moe',
  app: moe
});

const host = new Koa();

// The requests that match the hosts will be forwarded to the corresponding apps.
host.use(vhost.switch());
host.listen(8000);
```

### Switch#use(...{ vhost data object })

* data objects (`...Object` | `Array(Object)`) - a list of data objects, either an array
  or as arguments. See previous section for data object reference.

Example:

``` javascript
const Koa = require('koa');
const Switch = require('koa-switch-vhost');

const vhost = new Switch();

vhost.use({
  host: 'localhost',
  async app(context, next) {
    ctx.body += 'Hello, World';
    await next();
  }
}, {
  host: '127.0.0.1',
  async app(context, next) {
    await next();
    ctx.set('X-Powered-By', 'vhost');
  }
});

// Passing an array instead of listing data objects as arguments is valid too.
// @NOTE: This one will throw an error because apps for both `localhost` and `127.0.0.1`
// had already been assigned.
vhost.use([
  {
    host: 'localhost',
    async app(context, next) {
      await next();
      ctx.set('X-Powered-By', 'Koa');
    }
  },
  {
    host: '127.0.0.1',
    async app(context, next) {
      ctx.body = 'foobar';
      await next();
    }
  }
]);

const host = new Koa();

// The requests that match the hosts will be forwarded to the corresponding apps.
host.use(vhost.switch());
host.listen(8000);
```


## Test

``` shell
$ yarn test
```

## License

[3-Clause BSD](https://github.com/imcrazytwkr/koa-switch-vhost/blob/master/LICENSE)
