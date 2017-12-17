'use strict'

exports.DuplicateHostError = class DuplicateHostError extends Error {
  constructor() {
    super(`Mount for virtual host "${host}" already exists.`);
    Error.captureStackTrace(this, DuplicateHostError);
  }
}
