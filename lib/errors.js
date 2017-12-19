'use strict'

exports.DuplicateHostError = class DuplicateHostError extends Error {
  constructor(host) {
    super(`Mount for virtual host "${host}" already exists.`);
    Error.captureStackTrace(this, DuplicateHostError);
  }
}
