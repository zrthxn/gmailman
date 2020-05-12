/**
 * @description
 * Handle authentication with GMail scopes 
 * with OAuth2 and store token files.
 */

import fs from 'fs'
import readline from 'readline'
import { google } from 'googleapis'
import { OAuth2Client } from 'googleapis-common'

import { MAILDIR } from './cli'
import { readCredentialsFile, readTokenFile, readConfigFile } from './accounts'
import path from 'path'

/**
 * Authorize with stored credentials file
 * @param userId The userId (email) to use to authorize 
 */
export async function authorize(userId:string, type:string = 'installed') {
  const credentials = await readCredentialsFile(userId)
  
  try {
    if(!credentials.hasOwnProperty(type))
      throw 'Invalid credentials file.'

    const { client_secret, client_id, redirect_uris } = credentials[type]
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0])

    const token = await readTokenFile(userId)
    if(!token)
      return await getNewToken(oAuth2Client, userId)
    else {
      oAuth2Client.setCredentials(token)
      return oAuth2Client
    }
  } catch (error) {
    console.error(error)
    return Promise.reject(error)
  }
}

/**
 * Generate a new token file
 * @param oAuth2Client Client with set credentials
 * @param userId UserID
 * @param scopes Google scopes
 */
export async function getNewToken(oAuth2Client:OAuth2Client, userId:string, scopes?:string[]) {
  var SCOPES = ['https://mail.google.com']
  if(scopes)
    SCOPES = scopes

  const rlx = readline.createInterface({ input: process.stdin, output: process.stdout })

  return new Promise((resolve:((client:OAuth2Client) => any), reject) => {
    rlx.question('Invalid or no token found. Generate new? (Y/N)...', (code) => {
      if(code.toLowerCase()==='y' || code.toLowerCase()==='yes') {
        const authUrl = oAuth2Client.generateAuthUrl({
          access_type: 'offline',
          scope: SCOPES
        })

        console.log('Authorization URL:', authUrl)
        const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
        
        rl.question('Validation code: ', (auth) => {
          rl.close()
          oAuth2Client.getToken(auth, async (err, token) => {
            if(err) throw `Error retrieving access token: ${err}`
            
            oAuth2Client.setCredentials(token)

            let config = await readConfigFile()
            config.accounts[userId] = {
              token: path.join(MAILDIR, 'auth', userId, `token-${+new Date}.json`),
              expiresOn: token.expiry_date
            }
            
            fs.writeFileSync(path.join(MAILDIR, 'gmailer.config.json'), JSON.stringify(config, null, 2))
            if(process.env['VERBOSITY']=='true') console.log('Done')

            fs.writeFile(config.accounts[userId].token, JSON.stringify(token, null, 2), (err) => {
              if (err) return reject(err)
              console.log('\tToken stored to', config.accounts[userId].token)
              resolve(oAuth2Client)
            })
          })
        })
      }
    })
  })
}

/**
 * Test stored token by authorizing with credentials
 */
export async function testToken(userId:string) {
  console.log('Testing GMail API')
  try {
    const auth = await authorize(userId)
    const testObj = google.gmail({ version: 'v1', auth })
    
    if (!testObj) 
      return({ success: true })
  } catch(err) {
    console.error(err)
    return Promise.reject({ success: false, errors: [err] })
  }
}