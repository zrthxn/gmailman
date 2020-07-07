/**
 * @description
 * Handles adding and deleting templates.
 */

import fs from 'fs'
import path from 'path'

import { MAILDIR } from '..'
import { readConfigFile } from './accounts'

/**
 * Read template by name
 * @param template Template name
 */
export async function readTemplate(template:string) {
  try {
    let data = fs.readFileSync(path.join(MAILDIR, 'templates', template))
    return data.toString()
  } catch (error) {
    console.error(error)
    return null
  }
}

/**
 * Adds template and template file to registry.
 * @param templateName 
 * @param filepath
 */
export async function addTemplate(templateName:string, filepath:string) {
  if(process.env['VERBOSITY']=='true')
    console.log('Creating template', templateName)
  
  try {
    let config = await readConfigFile()
    
    fs.copyFileSync(path.resolve(filepath), path.join(MAILDIR, 'templates', templateName))

    config.templates[templateName] = {
      templateName,
      filepath: path.join(MAILDIR, 'templates', templateName)
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
 * Deletes template and template file from registry.
 * @param templateName 
 */
export async function deleteTemplate(templateName:string) {
  if(process.env['VERBOSITY']=='true')
    console.log('Deleting account', templateName)
  
  try {
    let config = await readConfigFile()
    
    if(config.templates[templateName].hasOwnProperty('filepath'))
      fs.unlinkSync(path.resolve(config.templates[templateName].filepath))

    delete config.templates[templateName]
    fs.writeFileSync(path.join(MAILDIR, 'gmailer.config.json'), JSON.stringify(config, null, 2))

    if(process.env['VERBOSITY']=='true') console.log('Done')
    return
  } catch (error) {
    console.error(error)
    throw `Invalid config dir path: '${MAILDIR}'`
  }
}
