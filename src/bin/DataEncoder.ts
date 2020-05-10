/**
 * @description
 * Formatting, templating, data interpolation and attachments
 */

import { DataItem } from './GMailer'

function template() {
  
}

function interpolation(content, mail, data:DataItem[]) {
  var splits = content.split('$')
  var peices = [], identifiers = []
  
  // ----- EMAIL CONTENT FORMATTING ----- 
  // Put Address identifiers and surrounding text in arrays
  for(let p=0; p<=splits.length; p+=2)
  peices.push(splits[p])
  for(let a=1; a<splits.length; a+=2)
  identifiers.push(splits[a])
  
  let current_email = String()
  // Insert data into email block copy
  for(var j=0; j<peices.length; j++) {
    let _data = '';
    for(var k=0; k<data.length; k++)
    if(identifiers[j]===data[k].id) {
      _data = data[k].data
      break
    }
    let next = peices[j] + _data
    current_email += next
  }
  
  const headers = this.Head + 'Content-Length: '+ current_email.length +'\r\n\r\n'
  
  if(mail.to==='me') mail.to = this.userId
  const to = 'To: ' + mail.to + '\r\n'
  const from = 'From: '+ this.username + ' <' + mail.from + '>\r\n'
  
  try {
    var dyn_sub = current_email.split('<title>')[1].split('</title>')[0]
  } catch(ErrorNoTitle) {
    dyn_sub = mail.subject
  }
  
  const subject = 'Subject: ' + dyn_sub + '\r\n'
  var raw = (from + to + subject + headers + current_email + '\r\n--' + this.MultipartSepartor + '--\r\n')
  return raw
}

function attachment() {

}