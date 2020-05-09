/**
 * @description
 * Handle authentication with GMail scopes 
 * with OAuth2 and store token files.
 */

import fs from 'fs'
import readline from 'readline'
import { google } from 'googleapis'
import { OAuth2Client } from 'googleapis-common'

export function authorize(email) {
  return new Promise((resolve:((client:OAuth2Client)=>any), reject) => {
    fs.readFile(this.CREDENTIALS_PATH, (err, content) => {
      if (err) return console.error('Error loading client secret file:', err)
      
      const credentials = JSON.parse(content.toString())
      const { client_secret, client_id, redirect_uris } = credentials.installed
      const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0])
  
      fs.readFile(this.TOKEN_PATH, (e, token) => {
        if (e) {
          this.getNewToken(oAuth2Client).then((auth) => resolve(auth))
        } else {
          oAuth2Client.setCredentials(JSON.parse(<string><unknown>token))
          resolve(oAuth2Client)
        }
      })
    })
  })
}

export function getNewToken(oAuth2Client:OAuth2Client) {
  return new Promise((resolve:((client:OAuth2Client)=>any), reject) => {
    const rlx = readline.createInterface({ input: process.stdin, output: process.stdout })
    rlx.question('Invalid or no token found. Generate new? (Y/N)...', (code) => {
      if (code.toLowerCase() === 'y' || code.toLowerCase() === 'yes') {
        const authUrl = oAuth2Client.generateAuthUrl({
          access_type: 'offline',
          scope: this.SCOPES,
        })
        console.log('Authorization URL:', authUrl)
        const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
        rl.question('Validation code: ', (auth) => {
          rl.close()
          oAuth2Client.getToken(auth, (err, token) => {
            if (err) return console.error('Error retrieving access token', err)
            oAuth2Client.setCredentials(token)
            fs.writeFile(this.TOKEN_PATH, JSON.stringify(token, null, 2), (err) => {
              if (err) return reject(err)
              console.log('Token stored to', this.TOKEN_PATH)
              resolve(oAuth2Client)
            })
          })
        })
      }
    })
  })
}

export async function TestToken() {
  console.log('Testing GMail API')
  try {
    const auth = await this.authorize()
    const testObj = google.sheets({version: 'v4', auth})
    if (testObj!=null) return({ success: true })
  } catch(err) {
    console.error(err)
    return Promise.reject({ success: false, errors: [err] })
  }
}