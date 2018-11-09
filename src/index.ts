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
        toExecute(auth, split[1], authFn);
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
  let obj = findRouteOrAction(target, propertyKey)
  target[authenticatedSymbol][obj.method + ' ' + obj.path] = true;  
  

}

export function allRequireAuth(constructor: ControllerConstructor) { // this is the decorator
  if(!constructor.prototype[authenticatedSymbol]){
    constructor.prototype[authenticatedSymbol] = {}
  }

  for (let obj of (constructor.prototype[actionsSymbol] || [])) {
    if(constructor.prototype[authenticatedSymbol][obj.method + ' ' + obj.path] !== false){
      constructor.prototype[authenticatedSymbol][obj.method + ' ' + obj.path] = true;
    }
  }

  for (let obj of (constructor.prototype[routesSymbol] || [])) {
    if(constructor.prototype[authenticatedSymbol][obj.method + ' ' + obj.path] !== false){
      constructor.prototype[authenticatedSymbol][obj.method + ' ' + obj.path] = true;
    }
  }
}


export function requiresNoAuth (target: Controller, propertyKey: string): any { // this is the decorator
  if(!target[authenticatedSymbol]){
    target[authenticatedSymbol] = {}
  }

    let obj = target[actionsSymbol].filter(function(item){
      return item.name === propertyKey;
    })[0];
  target[authenticatedSymbol][obj.method + ' ' + obj.path] = false;
}


function findRouteOrAction(target: Controller, name: string) {
  let obj = target[actionsSymbol].filter(function(item){
    return item.name === name;
  })[0];
  if(!!obj){
    return obj
  }
  obj = target[routesSymbol].filter(function(item){
      return item.name === name;
    })[0];
  return obj;
}