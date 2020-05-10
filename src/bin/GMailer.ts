import fs from 'fs'
import readline from 'readline'
import { google } from 'googleapis'
import { OAuth2Client } from 'googleapis-common'

import deployNewInstance from './LoadBalancer'
import { authorize } from '../lib/auth'

/**
 * Interfaces
 */
export interface IEmail {
	to: string //| string[]
	cc: string | string[]
	bcc: string | string[]
	from?: string
	replyTo?: string
	subject?: string
	body?: string
}

export type EmailContent = string
export type EmailDatabase = string
export type DataItem  = {
	id: string
	data: string
}

/**
 * @description
 * `class` Gmailer
 */
export default class GMailer {
	readonly SCOPES = ['https://mail.google.com']	
	readonly Head
	readonly MultipartSepartor

	private userId
	private username
	private authToken
	private service

	constructor({ userId }) {
		this.MultipartSepartor = `====X__multipart-000000${Date.now().toString(16)}__X====`
		this.Head =
			'Mime-Version: 1.0\r\n' +
			'Content-Type: multipart/alternative; boundary=\"' + this.MultipartSepartor + '\"\r\n' +
			'Content-Transfer-Encoding: binary\r\n' +
			'X-Mailer: MIME::Lite 3.030 (F2.84; T1.38; A2.12; B3.13; Q3.13)\r\n\r\n' +
			'--' + this.MultipartSepartor + '\r\n' +
			'Content-Transfer-Encoding: binary\r\n' +
			'Content-Type: text/html; charset="utf-8"\r\n' +
			'Content-Disposition: inline\r\n'

		this.userId = userId
		authorize(this.userId).then((token)=>{
			this.authToken = token
			this.service = google.gmail({ 
				version: 'v1', 
				auth: this.authToken
			})
		})
	}

	private send(email64:string) {
		// Takes in already encoded base 64 email
		return new Promise((resolve, reject) => {
			this.service.users.messages.send({
				userId: this.userId,
				resource: {
					raw: email64
				}
			}, (err, res) => {
				if(err) reject(err.errors[0])

				if(res.status===200) 
					resolve(res.status)
				else
					reject(res.status)
			})
		})
	}

	private base64Encode(raw) {
		return Buffer.from(raw + '\r\n--' + this.MultipartSepartor + '--\r\n')
			.toString('base64')
			.replace(/\+/g, '-')
			.replace(/\//g, '_')
			.replace(/=+$/, '')
	}

	async SingleDelivery(mail:IEmail) {
		const headers = this.Head + 'Content-Length: ' + mail.body.length + '\r\n\r\n'

		if (mail.replyTo)
			var reply = 'Reply-To: ' + mail.replyTo + '\r\n'

		const from = 'From: ' + this.username + ' <' + mail.from + '>\r\n'

		if(mail.to==='me') 
			mail.to = this.userId
		const to = 'To: ' + mail.to + '\r\n'
		const subject = 'Subject: ' + mail.subject + '\r\n'
		
		const mail64 = this.base64Encode(from + to + reply + subject + headers + mail.body)

		console.log('Sending email to', mail.to)
		try {
			const res = await this.send(mail64)
			if(res === 200)
				return res
			else throw "Unsuccessful sending"
		} catch (error) {
			console.error(error)
			return Promise.reject(error)
		}		
	}

	async SingleDataDelivery(mail:IEmail, content:EmailContent, data:DataItem[]) {
		var splits = content.split('$')
		var peices = [], identifiers = []

		var mail64 = null

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
		mail64 = this.base64Encode(from + to + subject + headers + current_email)
			
		console.log('Sending email to ' + mail.to)
		try {
			const res = await this.send(mail64)
			if(res===200) 
				return res
			else throw "Unsuccessful sending"
		} catch (error) {
			console.error(error)
			return Promise.reject(error)
		}
	}

	async DatasetDelivery(mail:IEmail, content:EmailContent, database:EmailDatabase) {
		let data = [], addressList = []
		let raw = database.split('\r\n')
		let heads = raw[0].split(',')

		// ----- EMAIL ADDRESS EXTRACTION -----
		for (let row = 1; row < raw.length; row++) {
			let row_entry = []
			for (let col = 0; col < heads.length; col++)
				if (heads[col].toLowerCase()==='email')
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
		for (let p = 0; p <= splits.length; p += 2)
			peices.push(splits[p])
		for (let a = 1; a < splits.length; a += 2)
			identifiers.push(splits[a])

		// Itrate over the entire data
		for (let i = 0; i < data.length; i++) {
			let current_email = String()
			// Insert data into email block copy
			for (var j = 0; j < peices.length; j++) {
				let _data = String()
				for (var k = 0; k < data[i].length; k++)
					if (identifiers[j] === data[i][k].id) {
						_data = data[i][k].data
						break
					}
				const next = peices[j] + _data
				current_email = current_email + next
			}

			const headers = this.Head + 'Content-Length: ' + current_email.length + '\r\n\r\n'

			if(addressList[i]==='me') addressList[i] = this.userId
			const to = 'To: ' + addressList[i] + '\r\n'
			const from = 'From: ' + this.username + ' <' + mail.from + '>\r\n'

			try {
				var dyn_sub = current_email.split('<title>')[1].split('</title>')[0]
			} catch (e) {
				dyn_sub = mail.subject
			}

			const subject = 'Subject: ' + dyn_sub + '\r\n'
			emails.push(
				this.base64Encode(from + to + subject + headers + current_email)
			)
		}

		// SENDING BASE 64 EMAILS
		console.log('Processing', addressList.length, 'emails')
		try {
			let index = 0
			for (const address of addressList) {
				console.log('Sending email to ' + address)
				if (address !== undefined) {
					try {
						const res = await this.send(emails[index])
						index++
						if (res === 200) {
							if (index < emails.length)
								continue
							else 
								return
						}	
						else throw `Unsuccessful sending to ${address}`
					} catch (error) {
						console.error(error)
					}					
				} 
				else
					console.log('Invalid Data Row ::', index)
			}
		} catch (error) {
			console.error(error)
		}
	}

	DistributedCampaign = function (mail:IEmail, content:EmailContent, database:EmailDatabase, options?) {
		const MAX_DATA = 50

		let payload = []
		let data_rows = database.split('\r\n')
		let head = data_rows[0]

		let count = Math.floor((data_rows.length - 1) / MAX_DATA) + 1
		for (let i = 0; i < count; i++) {
			let data = String()
			for (let j = MAX_DATA * i + 1; j <= (i + 1) * MAX_DATA; j++) {
				if (data_rows[j] === undefined) break
				data += ('\r\n' + data_rows[j])
			}

			payload.push({
				mail: mail,
				content: content,
				data: head + data
			})
		}

		deployNewInstance('./DistributionWorker', count, payload, 'free')
	}
}