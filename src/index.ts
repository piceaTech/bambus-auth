import Bambus, { actionsSymbol, routesSymbol, Controller, correctFunctionBasedOnName } from '@bambus/main'

export const authenticatedSymbol = Symbol('authenticated');

const debug = require('debug')('bambus:plugin:auth');


declare module '@bambus/main/dist/controller' {
  export interface Controller{
    [authenticatedSymbol]: BooleanHash
  }
}

interface ControllerConstructor{
  new(): Controller
}

interface BooleanHash{
  [s: string]: boolean
}

export default function(bambus: Bambus, authFn: Function){
  for(let controller in bambus.controllers){
    // debug(controller);
    let currentController = bambus.controllers[controller];
    let needAuth:BooleanHash = currentController[authenticatedSymbol] || {};
    // debug(needAuth);
    for(let auth in needAuth){
      if(needAuth[auth]){
        let split = auth.split(' ');
        let toExecute = correctFunctionBasedOnName(currentController.router, split[0]);
        toExecute('auth ' + auth, split[1], authFn);
      }
    }
  }
}



// for functions
export function requiresAuth(target: Controller, propertyKey: string) { // this is the decorator
  if(!target[authenticatedSymbol]){
    target[authenticatedSymbol] = {}
  }
  debug(propertyKey);
  let name = findRouteOrActionName(target, propertyKey)
  target[authenticatedSymbol][name] = true;
}

export function allRequireAuth(constructor: ControllerConstructor) { // this is the decorator
  if(!constructor.prototype[authenticatedSymbol]){
    constructor.prototype[authenticatedSymbol] = {}
  }
  for (let name in (constructor.prototype[actionsSymbol] || {})) {
    if(constructor.prototype[authenticatedSymbol][name] !== false){
      constructor.prototype[authenticatedSymbol][name] = true;
    }
  }

  for (let name in (constructor.prototype[routesSymbol] || {})) {
    if(constructor.prototype[authenticatedSymbol][name] !== false){
      constructor.prototype[authenticatedSymbol][name] = true;
    }
  }
}


export function requiresNoAuth (target: Controller, propertyKey: string): any { // this is the decorator
  if(!target[authenticatedSymbol]){
    target[authenticatedSymbol] = {}
  }

  let name = findRouteOrActionName(target, propertyKey)
  target[authenticatedSymbol][name] = false;
}

function findRouteOrActionName(target: Controller, propName: string): string {

  for (let name in (target.constructor.prototype[routesSymbol] || {})) {
    let obj = target.constructor.prototype[routesSymbol][name];
    if(obj.name === propName){
      return name;
    }
  }
  for (let name in (target.constructor.prototype[actionsSymbol] || {})) {
    let obj = target.constructor.prototype[actionsSymbol][name];
    if(obj.name === propName){
      return name;
    }
  }
}




