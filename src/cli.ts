/**
 * @description
 * Handle CLI inputs, invoke relevant functions and 
 * act as accounts interface.
 */

import inquirer from 'inquirer'
import inquirerFile from 'inquirer-file-path'
import inquirerDir from 'inquirer-directory'
import conf from './lib/conf'

import { name as command, version } from '../package.json'
import Prompts from './prompts.json'

import * as accounts from './lib/accounts'
import * as auth from './lib/auth'

// import { initialize } from './init'

inquirer.registerPrompt('file', inquirerFile)
inquirer.registerPrompt('dir', inquirerDir)

process.env['VERBOSITY'] = 'true'

const { exec, args } = encodeExecArgs(process.argv)

export const functions = {
  cli: (task) => {
    switch (task) {
      case undefined:
        return functions.cli

      case 'init':
        console.log(conf.Green('Initialize and setup GMailMan'))
        return null
    
      case 'account':
        return functions.account.switch
    
      case 'authorize':
        // authHandler(task, args)
        return null
    
      case 'template':
        console.log('Unimplemented')
        return null
    
      case 'send':
        // use gmailer from the CLI
        console.log('Unimplemented')
        return null
    
      case 'help':
        const helptopic = exec.join('.')
        HelpMenu(helptopic)
        return null
    
      default:
        console.error('Unrecognized command')
        return null
    }
  },
  account: {
    switch: (task) => {
      switch (task) {
        case undefined:
          return functions.account.switch

        case 'add':
          console.log(conf.Green('Add account'))
          return functions.account.add
      
        case 'delete':
          console.log(conf.Red('Delete account'))
          return functions.account.del

        default:
          console.error('Unrecognized command')
          return null
      }
    },
    add: useArgsPrompt([ args.userid, args.credentials ], () => {
      // accounts.addAccount(args.userid, args.credentials)

      return null
    }),
    del: useArgsPrompt([ args.userid ], () => {
      return null
    }) 
  }
}

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


// ========================================================
// Resilient execution logic

// Start
var $prompts = Prompts
var $exec = functions.cli
var $task = exec.shift()

/**
 * @implements Control Loop
 */
export async function main() {
  do {  
    // Execute the current task
    $exec = await $exec($task)
  
    if ($exec)
      if ($task)
        $prompts = $prompts.subcommands[$task]
      else {
        $task = (await triggerPrompt($prompts.prompts)).task
        continue
      }

    $task = exec.shift()
  } while ($exec)

  console.log('Exiting')
}

try {
  main()
} catch (error) {
  console.error(conf.Red(error))
}

// --------------------------------------------------------

/**
 * Open the Inquirer.
 * @param prompts List of questions
 */
async function triggerPrompt(prompts) {
  if (args.hasOwnProperty('noprompt') && args.noprompt)
    throw 'Invalid arguments. Need to trigger prompt but --noprompt is set.'
  
  // Can add validation here
  return await inquirer.prompt(prompts)
}

/**
 * Wrapper for functions to check args.
 * @param dependencies 
 * @param reducer 
 */
function useArgsPrompt(dependencies: any[], reducer:Function) {
  return async function handle(task) {
    // check if all dependencies are satisfied
    for (const dep of dependencies) {
      // if any are missing, trigger gui 
      if (!dep) {
        try {
          const response = await triggerPrompt($prompts.prompts)
          // Set properties in args
          for (const key in response) {
            if (response.hasOwnProperty(key)) {
              args[key] = response[key]
            }
          }
          return reducer(task)
        } catch (error) {
          console.error(conf.Red(error))
          break
        }
      }
    }

    // Execute the function
    return reducer(task)
  }
}

/**
 * Separates the executions from the args/options
 * @param argv Process exec args
 */
export function encodeExecArgs(argv:string[]) {
  if (argv.includes(command))
    argv = argv.slice(argv.indexOf(command) + 1)
  else
    argv = []

  let exec = Array()
  let args = Object()

  for (const arg of argv.map(
    str => !str.includes('--') ? str : null
  ).filter(
    _ => _ !== null
  )) {
    exec = [ ...exec, arg ]
  }

  for (const arg of argv.map(
    str => str.includes('--') ? (
      str.includes('=') ? {
        [str.slice(str.indexOf('--') + 2, str.indexOf('='))]: str.slice(str.indexOf('=') + 1)
      } : { [str.slice(str.indexOf('--') + 2, str.length)]: true }
    ) : null
  ).filter(
    _ => _ !== null
  )) {
    args = { ...args, ...arg }
  }

  return { exec, args }
}

/**
 * Help
 */
function HelpMenu(helptopic) {
  const subcommands = helptopic ? (
    Prompts.subcommands[helptopic] ? Prompts.subcommands[helptopic].subcommands : Object()
  ) : Prompts.subcommands
  
  console.log(conf.Blue(`GMailMan ${version}`))
  console.log(conf.Green('Help Menu'), conf.format.Break)
  
  console.log('Available Commands')
  for (const command in subcommands) {
    if (subcommands.hasOwnProperty(command)) {
      console.log(conf.format.Tab, conf.Yellow(command))
      console.log(conf.format.Tab, subcommands[command].description, conf.format.Break)
    }
  }

  console.log('Get your credentials file at https://developers.google.com/gmail/api')
}