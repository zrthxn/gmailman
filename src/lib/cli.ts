/**
 * @description
 * Handle CLI inputs, invoke relevant functions and 
 * act as accounts interface.
 */

import colors from 'colors'

import * as accounts from './accounts'
import * as auth from './auth'

const [ func, task ] = process.argv.splice(process.execArgv.length + 2)
const args = process.argv.splice(process.execArgv.length + 4)

var VERBOSITY = true

switch (func) {
  case 'account':
    // go to accounts handler
    accountHandler(task, args)
    break

  case 'authorize':
    // go to auth handler
    authHandler(task, args)
    break

  case 'send':
    // use gmailer from the CLI
    break

  default:
    console.error(`Unknown function: '${func}'`)
    break
}

/**
 * Handles all account related tasks
 * @param task 
 * @param args 
 */
export function accountHandler(task: string, args: string[]) {
  if(!args.length)
    return console.error('Too few arguments')
  
  const [ email, credentials ] = args
  switch (task) {
    case 'add':
      accounts.addAccount(email, credentials)
      break

    case 'delete':
      accounts.deleteAccount(email)
      break

    default:
      return console.error(`Unknown task: '${task}'`)
  }
}

/**
 * Handles all authentication related tasks
 * @param task 
 * @param args 
 */
export function authHandler(task: string, args: string[]) {
  if(!args.length)
    return console.error('Too few arguments')

  const [ email ] = args
  switch (task) {
    case 'token':
      auth.authorize(email)
      break

    case 'test':
      auth.authorize(email)
      break

    case 'delete':
      auth.authorize(email)
      break
  
    default:
      return console.error(`Unknown task: '${task}'`)
  }
}