/**
 * @description
 * Handles adding and deleting accounts.
 */

import path from 'path'
import fs from 'fs'

import { MAILDIR } from '..'

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
 * @param userId 
 */
export async function readCredentialsFile(userId:string) {
  let config = await readConfigFile()
  
  if(config.accounts[userId].hasOwnProperty('credentials'))
    try {
      const cred = JSON.parse(fs.readFileSync(path.resolve(config.accounts[userId].credentials)).toString())
      return cred
    } catch (error) {
      return null
    }
  else
    throw `No CREDENTIALS field associated with account '${userId}' on registry.`
}

/**
 * Read token file for a given email
 * @param userId 
 */
export async function readTokenFile(userId:string) {
  let config = await readConfigFile()
  
  if(config.accounts[userId].hasOwnProperty('token'))
    try {
      const token = JSON.parse(fs.readFileSync(path.resolve(config.accounts[userId].token)).toString())
      
      if (token.expiresOn < Date.now())
        throw "Token expired"

      return token
    } catch (error) {
      return null
    }
  else
    return null
}

/**
 * Adds email and credentials file to account registry 
 * in the config file.
 * @param userId 
 * @param credentials path of credentials file 
 */
export async function addAccount(userId:string, credentials:string, username?:string) {
  if(process.env['VERBOSITY']=='true')
    console.log('Creating account', userId)
  
  try {
    let config = await readConfigFile()
    
    fs.mkdirSync(path.join(MAILDIR, 'auth', userId), { recursive: true })
    fs.copyFileSync(path.resolve(credentials), path.join(MAILDIR, 'auth', userId, 'credentials.json'))

    config.accounts[userId] = {
      userId: userId,
      credentials: path.join(MAILDIR, 'auth', userId, 'credentials.json'),
      createdOn: +new Date,
      username
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
export async function deleteAccount(userId:string) {
  if(process.env['VERBOSITY']=='true')
    console.log('Deleting account', userId)
  
  try {
    let config = await readConfigFile()
    
    if(config.accounts[userId].hasOwnProperty('credentials'))
      fs.unlinkSync(path.resolve(config.accounts[userId].credentials))

    if(config.accounts[userId].hasOwnProperty('token'))
      fs.unlinkSync(path.resolve(config.accounts[userId].token))

    fs.rmdirSync(path.join(MAILDIR, 'auth', userId), { recursive: true })

    delete config.accounts[userId]
    fs.writeFileSync(path.join(MAILDIR, 'gmailer.config.json'), JSON.stringify(config, null, 2))

    if(process.env['VERBOSITY']=='true') console.log('Done')
    return
  } catch (error) {
    console.error(error)
    throw `Invalid config dir path: '${MAILDIR}'`
  }
}
