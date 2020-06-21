/**
 * @description
 * Handle CLI inputs, invoke relevant functions and 
 * act as accounts interface.
 */
import path from 'path'

import * as accounts from './accounts'
import * as auth from './auth'

export const MAILDIR = path.join(process.cwd(), 'mail')

const [ func, task ] = process.argv.slice(process.execArgv.length + 2)
const args = process.argv.slice(process.execArgv.length + 4)

console.log('Get your credentials file at https://developers.google.com/gmail/api/quickstart/nodejs')

process.env['VERBOSITY'] = 'true'

switch (func) {
  case 'account':
    accountHandler(task, args)
    break

  case 'authorize':
    authHandler(task, args)
    break

  case 'template':
    // use gmailer from the CLI
    console.log('Unimplemented')
    break

  case 'send':
    // use gmailer from the CLI
    console.log('Unimplemented')
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
  if(!args) return console.error('Too few arguments')
  
  var email, credentials
  for (const arg of args) {
    let [ label, value ] = arg.split('=')
    switch (label) {
      case '--email':
        email = value
        break

      case '--credentials':
        credentials = value
        break
    
      default:
        console.error(`Unrecognized argument: '${label}'`)
        break
    }
  }

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
  if(!args) return console.error('Too few arguments')

  var type, email
  for (const arg of args) {
    let [ label, value ] = arg.split('=')
    switch (label) {
      case '--email':
        email = value
        break

      case '--type':
        type = value
        break
    
      default:
        console.error(`Unrecognized argument: '${label}'`)
        break
    }
  }

  switch (task) {
    case 'token':
      auth.authorize(email, type)
      break

    case 'test':
      auth.testToken(email)
      break

    // case 'delete':
    //   auth.authorize(email)
    //   break
  
    default:
      return console.error(`Unknown task: '${task}'`)
  }
}


export function templateHandler() {
  return
}