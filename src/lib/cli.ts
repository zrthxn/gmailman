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
    // go to accounts handler
    accountHandler(task, args)
    break

  case 'authorize':
    // go to auth handler
    authHandler(task, args)
    break

  case 'template':
    // use gmailer from the CLI
    console.log('To be implemented')
    break

  case 'send':
    // use gmailer from the CLI
    console.log('To be implemented')
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
  if(!args) return console.error('Too few arguments')

  const [ email ] = args
  switch (task) {
    case 'token':
      auth.authorize(email)
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