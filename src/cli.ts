/**
 * @description
 * Handle CLI inputs, invoke relevant functions and 
 * act as accounts interface.
 */

import { name as command, version } from '../package.json'

import path from 'path'
import inquirer from 'inquirer'
import inquirerFile from 'inquirer-file-path'
import inquirerDir from 'inquirer-directory'
import conf from './lib/conf'

import Prompts from './prompts.json'

// import * as accounts from './lib/accounts'
// import * as auth from './lib/auth'
// import { initialize } from './init'

inquirer.registerPrompt('file', inquirerFile)
inquirer.registerPrompt('dir', inquirerDir)

process.env['VERBOSITY'] = 'true'

const execArgs = process.argv.slice(process.argv.indexOf(command) + 1)
const task = execArgs.shift()

switch (task) {
  case 'init':
    console.log(conf.Green('Initialize and setup GMailMan'))
    // initialize(execArgs)
    break

  case 'account':
    // accountHandler(task, args)
    break

  case 'authorize':
    // authHandler(task, args)
    break

  case 'template':
    // use gmailer from the CLI
    console.log('Unimplemented')
    break

  case 'send':
    // use gmailer from the CLI
    console.log('Unimplemented')
    break

  case 'help':
    HelpMenu()
    break

  default:
    console.error('Unrecognized command')
    break
}

// inquirer.prompt('', ()=>{

// })

// /**
//  * Handles all account related tasks
//  * @param task 
//  * @param args 
//  */
// export function accountHandler(task: string, args: string[]) {
//   if(!args) return console.error('Too few arguments')
  
//   var email, credentials
//   for (const arg of args) {
//     let [ label, value ] = arg.split('=')
//     switch (label) {
//       case '--email':
//         email = value
//         break

//       case '--credentials':
//         credentials = value
//         break
    
//       default:
//         console.error(`Unrecognized argument: '${label}'`)
//         break
//     }
//   }

//   switch (task) {
//     case 'add':
//       accounts.addAccount(email, credentials)
//       break

//     case 'delete':
//       accounts.deleteAccount(email)
//       break

//     default:
//       return console.error(`Unknown task: '${task}'`)
//   }
// }

// /**
//  * Handles all authentication related tasks
//  * @param task 
//  * @param args 
//  */
// export function authHandler(task: string, args: string[]) {
//   if(!args) return console.error('Too few arguments')

//   var type, email
//   for (const arg of args) {
//     let [ label, value ] = arg.split('=')
//     switch (label) {
//       case '--email':
//         email = value
//         break

//       case '--type':
//         type = value
//         break
    
//       default:
//         console.error(`Unrecognized argument: '${label}'`)
//         break
//     }
//   }

//   switch (task) {
//     case 'token':
//       auth.authorize(email, type)
//       break

//     case 'test':
//       auth.testToken(email)
//       break

//     // case 'delete':
//     //   auth.authorize(email)
//     //   break
  
//     default:
//       return console.error(`Unknown task: '${task}'`)
//   }
// }

function toOptionsObject(args:string[]) {
  let options = Object()
  for (const arg of args.map(
    str => str.includes('--') ? {
      [str.slice(str.indexOf('--') + 2, str.indexOf('='))]: str.slice(str.indexOf('=') + 1)
    } : null
  ).filter(
    _ => _ !== null
  )) {
    options = { ...options, ...arg }
  }
  return options
}

function initHandler() {
  const options = toOptionsObject(execArgs)

}

function HelpMenu() {
  console.log(conf.Blue(command))
  console.log(version, conf.format.Break)
  console.log(conf.Green('Help Menu'))
  
  console.log('Get your credentials file at https://developers.google.com/gmail/api')

  console.log('Available Commands')
  for (const item in Prompts) {
    if (Object.prototype.hasOwnProperty.call(Prompts, item)) {
      console.log(conf.format.Tab, conf.Yellow(Prompts[item].command))
      console.log(conf.format.Tab, Prompts[item].description, conf.format.Break)
    }
  }
}