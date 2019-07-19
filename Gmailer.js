const fs = require('fs');
const readline = require('readline');
const GmailConfig = require('../config.json').Gmail;
const {google} = require('googleapis');
const LoadBalancer = require('./LoadBalancer');

const SCOPES = ['https://mail.google.com'];
const CREDENTIALS_PATH = './util/GoogleAPIs/Gmail/credentials.json';
const TOKEN_PATH = './util/GoogleAPIs/Gmail/token.json';

var sendFrequency = 1000;

const Head =
    'Mime-Version: 1.0\r\n' +
    'Content-Type: multipart/alternative; boundary="==X__MULTIPART__X=="\r\n' +
    'Content-Transfer-Encoding: binary\r\n'+
    'X-Mailer: MIME::Lite 3.030 (F2.84; T1.38; A2.12; B3.13; Q3.13)\r\n\r\n'+

    '--==X__MULTIPART__X==\r\n' +
    'Content-Transfer-Encoding: binary\r\n' +
    'Content-Type: text/html; charset="utf-8"\r\n' +
    'Content-Disposition: inline\r\n'

function authorize() {
    return new Promise((resolve,reject)=>{
        fs.readFile(CREDENTIALS_PATH, (err, content) => {
            if (err) return console.log('Error loading client secret file:', err)
            let credentials = JSON.parse(content)
            const {client_secret, client_id, redirect_uris} = credentials.installed
            const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0])
            
            fs.readFile(TOKEN_PATH, (err, token) => {
                if (err) {
                    getNewToken(oAuth2Client).then((auth)=>{
                        resolve(auth)
                    })
                } else {
                    oAuth2Client.setCredentials(JSON.parse(token))
                    resolve(oAuth2Client)
                }
            })
        })
    })
}

function getNewToken(oAuth2Client) {
    return new Promise((resolve,reject)=>{
        const rlx = readline.createInterface({ input: process.stdin, output: process.stdout })
        rlx.question('Invalid or no token found. Generate new? (Y/N)...', (code) => {
            if(code=='Y'||code=='y') {
                const authUrl = oAuth2Client.generateAuthUrl({
                    access_type: 'offline',
                    scope: SCOPES,
                })
                console.log('Authorization URL:', authUrl)
                const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
                rl.question('Validation code: ', (code) => {
                    rl.close()
                    oAuth2Client.getToken(code, (err, token) => {
                        if (err) return console.error('Error retrieving access token', err)
                        oAuth2Client.setCredentials(token)
                        fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
                            if (err) return reject(err)
                            console.log('Token stored to', TOKEN_PATH)
                            resolve(oAuth2Client)
                        })
                    })
                })
            }
        })
    })    
}

exports.TestGmailer = function() {
    return new Promise((resolve,reject)=>{ 
        authorize().then((auth)=>{
            try {
                let testObj = google.gmail({version: 'v1', auth})
                if (testObj!=null) resolve({ success: true })
            } catch(err) {
                resolve({ success: false, errors: err })
            }
        }).catch((err)=>{
            reject(err)
        })
    })
}

// ========================= DELIVERY MODES ========================= //

exports.SingleDelivery = function (mail) {
    if(typeof mail==='json') throw "Invalid Types"
    let headers = Head + 'Content-Length: '+ mail.body.length +'\r\n\r\n'
    
    let reply = ''
    if(mail.replyTo!==undefined)
        reply = 'Reply-To: ' + mail.replyTo + '\r\n'

    let from = 'From: '+ GmailConfig.username + ' <' + mail.from + '>\r\n'
    let to = 'To: '+ mail.to +'\r\n'
    let subject = 'Subject: ' + mail.subject + '\r\n'

    return new Promise((resolve,reject)=>{       
        var mail64 = Buffer.from(from + to + reply + subject + headers + mail.body + "\r\n--==X__MULTIPART__X==--\r\n")
            .toString('base64')
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '')

        authorize().then((auth)=>{
            console.log('Sending email to ' + mail.to)
            send(google.gmail({version: 'v1', auth}), mail64, GmailConfig.userId)
                .then((res)=>{
                    if(res===200) resolve(res)
                    else reject()
                })
                .catch((err)=>{
                    console.error(err)
                })
        })
    })
}

exports.SingleDataDelivery = function (mail, content, data) {
    var splits = content.split('$')
    var peices = [], identifiers = []

    var mail64 = null

    return new Promise((resolve,reject)=>{
        // ----- EMAIL CONTENT FORMATTING ----- 
        // Put Address identifiers and surrounding text in arrays
        for(let p=0; p<=splits.length; p+=2)
            peices.push(splits[p])
        for(let a=1; a<splits.length; a+=2)
            identifiers.push(splits[a])

        let current_email = ''
        // Insert data into email block copy
        for(var j=0; j<peices.length; j++) {
            let _data = '';
            for(var k=0; k<data.length; k++)
                if(identifiers[j]===data[k].id) {
                    _data = data[k].data
                    break
                }
            let next = peices[j] + _data
            current_email = current_email + next
        }
        
        let headers = Head + 'Content-Length: '+ current_email.length +'\r\n\r\n'

        let to = 'To: ' + mail.to + '\r\n'
        let from = 'From: '+ GmailConfig.username + ' <' + mail.from + '>\r\n'
        
        let dyn_sub = ""
        try {
            dyn_sub = current_email.split('<title>')[1].split('</title>')[0]
        } catch(e) {
            dyn_sub = mail.subject
        }
        let subject = 'Subject: ' + dyn_sub + '\r\n'
        mail64 = Buffer.from(from + to + subject + headers + current_email + "\r\n--==X__MULTIPART__X==--\r\n").toString('base64')
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '')

        authorize().then((auth)=>{
            console.log('Sending email to ' + mail.to)
            send(google.gmail({version: 'v1', auth}), mail64, GmailConfig.userId)
                .then((res)=>{
                    if(res===200) resolve(res)
                    else reject()
                })
                .catch((err)=>{
                    console.error(err)
                })
        })
    })
}

exports.DatasetDelivery = function (mail, content, database) {
    // if(typeof content!=='string' || typeof database!=='string' || typeof mail==='json') 
    //     throw("Invalid Types :: " + typeof content + ' ' + typeof database + ' ' + typeof mail);
    let data = [], addressList = []
    let raw = database.split('\r\n')
    let heads = raw[0].split(',')

    return new Promise((resolve, reject)=>{
        // ----- EMAIL ADDRESS EXTRACTION -----
        for(let row=1; row<raw.length; row++) {
            let row_entry = []
            for(let col=0; col<heads.length; col++)
                if(heads[col]==="EMAIL")
                    addressList.push(raw[row].split(',')[col])
                else {
                    row_entry.push({
                        id: heads[col],
                        data: raw[row].split(',')[col]
                    })
                }
            data.push(row_entry)
        }

        // ----- EMAIL CONTENT FORMATTING ----- 
        var splits = content.split('$')
        var emails = [], peices = [], identifiers = []

        // Put Address identifiers and surrounding text in arrays
        for(let p=0; p<=splits.length; p+=2)
            peices.push(splits[p])
        for(let a=1; a<splits.length; a+=2)
            identifiers.push(splits[a])

        // Itrate over the entire data
        for(let i=0; i<data.length; i++) {
            let current_email = ''
            // Insert data into email block copy
            for(var j=0; j<peices.length; j++) {
                let _data = ''
                for(var k=0; k<data[i].length; k++)
                    if(identifiers[j]===data[i][k].id) {
                        _data = data[i][k].data
                        break
                    }
                let next = peices[j] + _data
                current_email = current_email + next
            }

            let headers = Head + 'Content-Length: '+ current_email.length +'\r\n\r\n'

            let to = 'To: ' + addressList[i]+ '\r\n'
            let from = 'From: '+ GmailConfig.username + ' <' + mail.from + '>\r\n'
            
            let dyn_sub = ""
            try {
                dyn_sub = current_email.split('<title>')[1].split('</title>')[0]
            } catch(e) {
                dyn_sub = mail.subject
            }
            let subject = 'Subject: ' + dyn_sub + '\r\n'
            emails.push(
                Buffer.from(from + to + subject + headers + current_email + "\r\n--==X__MULTIPART__X==--\r\n").toString('base64')
                    .replace(/\+/g, '-')
                    .replace(/\//g, '_')
                    .replace(/=+$/, '')
            )
        }

        // SENDING BASE 64 EMAILS
        authorize().then((auth)=>{
            var INDEX=0, time
            console.log('Processing' , addressList.length, 'emails')
            function deploy() {
                time = +new Date()
                setTimeout(function() {
                    if(addressList[INDEX]!==undefined) {
                        console.log('Sending email to ' + addressList[INDEX])
                        send(google.gmail({version: 'v1', auth}), emails[INDEX], GmailConfig.userId)
                            .then((res)=>{
                                if(res===200) {
                                    INDEX++
                                    if(INDEX<emails.length) deploy()
                                    else resolve()
                                }
                            })
                            .catch((err)=>{
                                console.error(err)
                            })
                    } else {
                        console.log('Invalid Data Row ::', INDEX)
                    }
                }, sendFrequency-((+new Date())-time))
            }
            deploy()
        })
    })
}

exports.DistributedCampaign = function(mail, content, database, options) {
    var MAX_DATA = 50
    var payload = []

    let data_rows = database.split('\r\n')
    let head = data_rows[0]

    let count = Math.floor((data_rows.length-1)/MAX_DATA) + 1
    for(let i=0; i<count; i++){
        let data = ""
        for(let j=MAX_DATA*i+1; j<=(i+1)*MAX_DATA; j++) {
            if(data_rows[j]===undefined) break
            data += ('\r\n' + data_rows[j])
        }
        payload.push({
            mail: mail,
            content: content,
            data: head + data
        })
    }

    LoadBalancer.deployNewInstance('./EmailDistributionWorker.js', count, payload, 'free')
}

// ========================= UTILITY FUNCTION ========================= //

function send(gmail, email, userId) {
    // Takes in already encoded base 64 email
    return new Promise((resolve,reject)=>{
        gmail.users.messages.send({
            'userId': userId,
            'resource': {
                'raw': email
            }
        }, (err, res)=>{
            if(err) reject(err.errors[0]) 
            if(res.status===200) resolve(res.status)
        })
    })
}

exports.setFrequency = function(freq) {
    sendFrequency = freq
    console.log('Reset sending frequency', freq)
}