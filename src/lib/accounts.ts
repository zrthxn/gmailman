/**
 * @description
 * Handles adding and deleting accounts.
 */

import path from 'path'
import fs from 'fs'

import { MAILDIR } from './cli'

/**
 * Read the GMailer config file
 */
export async function readConfigFile() {
  try {
    let data = fs.readFileSync(path.join(MAILDIR, 'gmailer.config.json'), { encoding: 'utf-8' })
    return JSON.parse(data.toString())
  } catch (error) {
    console.error(error)
    return Promise.reject(error)
  }
}

/**
 * Read credentials file for a given email
 * @param email 
 */
export async function readCredentialsFile(email:string) {
  let config = await readConfigFile()
  
  if(config.accounts[email].hasOwnProperty('credentials'))
    try {
      const cred = fs.readFileSync(config.accounts[email].credentials)
      return JSON.parse(cred.toString())
    } catch (error) {
      return null
    }
  else
    throw `No CREDENTIALS field associated with account '${email}' on registry.`
}

/**
 * Read token file for a given email
 * @param email 
 */
export async function readTokenFile(email:string) {
  let config = await readConfigFile()
  
  if(config.accounts[email].hasOwnProperty('token'))
    try {
      const token = fs.readFileSync(config.accounts[email].token)
      return JSON.parse(token.toString())
    } catch (error) {
      return null
    }
  else
    return null
}

/**
 * Adds email and credentials file to account registry 
 * in the config file.
 * @param email 
 * @param credentials path of credentials file 
 */
export async function addAccount(email:string, credentials:string) {
  if(process.env['VERBOSITY']=='true')
    console.log('Creating account', email)
  
  try {
    let config = await readConfigFile()
    
    fs.mkdirSync(path.join(MAILDIR, 'auth', email), { recursive: true })
    fs.copyFileSync(path.resolve(credentials), path.join(MAILDIR, 'auth', email, 'credentials.json'))

    config.accounts[email] = {
      userId: email,
      createdOn: +new Date,
      credentials: path.join(MAILDIR, 'auth', email, 'credentials.json')
    }

    fs.writeFileSync(path.join(MAILDIR, 'gmailer.config.json'), JSON.stringify(config, null, 2))
    if(process.env['VERBOSITY']=='true') console.log('Done')
    return
  } catch (error) {
    console.error(error)
    throw `Invalid config dir path: '${MAILDIR}'`
  }
}

/**
 * Deletes email, credentials file and token file 
 * from account registry.
 * @param email Email to delete from registry
 */
export async function deleteAccount(email) {
  if(process.env['VERBOSITY']=='true')
    console.log('Deleting account', email)
  
  try {
    let config = await readConfigFile()
    
    if(config.accounts[email].hasOwnProperty('credentials'))
      fs.unlinkSync(config.accounts[email].credentials)

    if(config.accounts[email].hasOwnProperty('token'))
      fs.unlinkSync(config.accounts[email].token)

    fs.rmdirSync(path.join(MAILDIR, 'auth', email), { recursive: true })

    delete config.accounts[email]
    fs.writeFileSync(path.join(MAILDIR, 'gmailer.config.json'), JSON.stringify(config, null, 2))

    if(process.env['VERBOSITY']=='true') console.log('Done')
    return
  } catch (error) {
    console.error(error)
    throw `Invalid config dir path: '${MAILDIR}'`
  }
}
