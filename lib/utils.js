'use strict'

exports.isString = object => (typeof object === 'string');
exports.isFunction = object => (typeof object === 'function');
exports.flatten = flatten;

// Flatten is being called recursively so it has to be defined separately.
function flatten(list) {
  return list.reduce(flattener, []);
}

function flattener(list, item) {
  if (Array.isArray(item)) return list.concat(flatten(item));
  list.push(item);
  return list;
}
