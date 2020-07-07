/**
 * @description
 * Formatting, templating, data interpolation and attachments
 */

import fs from 'fs'
import path from 'path'
import * as mime from 'mime-types'

import { MAILDIR } from '..'

import { DataItem, Database, DataRow, Attachment } from '../index.d'

/**
 * Read CSV and 
 * @param filepath Path of CSV file
 */
export async function readCSV(filepath:string): Promise<Database> {
  console.log('Reading CSV from path...')
  try {
    let database = fs.readFileSync(path.resolve(filepath))
    
    let data: DataRow[] = []
    let addressList: string[] = []

    // ----- EMAIL ADDRESS EXTRACTION -----
    let raw = database.toString().split('\r\n')
		let heads = raw[0].split(',')
		for (let row = 1; row < raw.length; row++) {
			let row_entry = []
			for (let col = 0; col < heads.length; col++)
				if (heads[col].toLowerCase()==='email'){
          addressList.push(raw[row].split(',')[col])
          row_entry.push({
						id: 'Email',
						data: raw[row].split(',')[col]
					})
        } else {
					row_entry.push({
						id: heads[col],
						data: raw[row].split(',')[col]
					})
				}
			data.push(row_entry)
		}

    return { data, addressList }
  } catch (error) {
    console.error(error)
    return null
  }
}

/**
 * Read attachment as object
 * @param filepath Path/to/Attachment file
 */
export async function readAttachment(filepath: string): Promise<Attachment> {
  try {
    let file = Buffer.from(fs.readFileSync(path.resolve(filepath)))
    return {
      size: file.byteLength,
      mimeType: mime.lookup(path.resolve(filepath)),
      filename: path.basename(path.resolve(filepath)),
      data: file
    }
  } catch (error) {
    console.error(error)
    return null
  }
}

// function interpolation(content, mail, data:DataItem[]) {
//   var splits = content.split('$')
//   var peices = [], identifiers = []
  
//   // ----- EMAIL CONTENT FORMATTING ----- 
//   // Put Address identifiers and surrounding text in arrays
//   for(let p=0; p<=splits.length; p+=2)
//   peices.push(splits[p])
//   for(let a=1; a<splits.length; a+=2)
//   identifiers.push(splits[a])
  
//   let current_email = String()
//   // Insert data into email block copy
//   for(var j=0; j<peices.length; j++) {
//     let _data = '';
//     for(var k=0; k<data.length; k++)
//     if(identifiers[j]===data[k].id) {
//       _data = data[k].data
//       break
//     }
//     let next = peices[j] + _data
//     current_email += next
//   }
  
//   const headers = this.Head + 'Content-Length: '+ current_email.length +'\r\n\r\n'
  
//   if(mail.to==='me') mail.to = this.userId
//   const to = 'To: ' + mail.to + '\r\n'
//   const from = 'From: '+ this.username + ' <' + mail.from + '>\r\n'
  
//   try {
//     var dyn_sub = current_email.split('<title>')[1].split('</title>')[0]
//   } catch(ErrorNoTitle) {
//     dyn_sub = mail.subject
//   }
  
//   const subject = 'Subject: ' + dyn_sub + '\r\n'
//   var raw = (from + to + subject + headers + current_email + '\r\n--' + this.MultipartSepartor + '--\r\n')
//   return raw
// }