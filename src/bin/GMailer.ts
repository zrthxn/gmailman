import fs from 'fs'
import readline from 'readline'
import { google } from 'googleapis'
import { OAuth2Client } from 'googleapis-common'

import { readTemplate, readCSV } from './DataEncoder'
import deployNewInstance from './LoadBalancer'
import { authorize } from '../lib/auth'

/**
 * Interfaces
 */
export interface IEmail {
	to: string //| string[]
	cc?: string | string[]
	bcc?: string | string[]
	from?: string
	replyTo?: string
	subject: string
	body?: string
}

export type Database = DataItem[]
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
	readonly ContentHeaders
	readonly MultipartSepartor

	private userId
	private username
	private authToken
	private service

	dataSeparator = /(\{\{\%|\%\}\})/g

	private MAIL64_QUEUE = [

	]

	constructor({ userId }) {
		this.MultipartSepartor = `multipart-000000${(+new Date).toString(16)}`
		this.ContentHeaders =
			'Mime-Version: 1.0\r\n' +
			'Content-Type: multipart/alternative; boundary=\"' + this.MultipartSepartor + '\"\r\n' +
			'Content-Transfer-Encoding: binary\r\n' +
			'X-Mailer: MIME::Lite 3.030 (F2.84; T1.38; A2.12; B3.13; Q3.13)\r\n\r\n' +
			'--' + this.MultipartSepartor + '\r\n' +
			'Content-Transfer-Encoding: binary\r\n' +
			'Content-Type: text/html; charset="utf-8"\r\n' +
			'Content-Disposition: inline\r\n'

		this.userId = userId
	}

	private async getAuthToken() {
		this.authToken = await authorize(this.userId, 'installed')
		this.service = google.gmail({ 
			version: 'v1', 
			auth: this.authToken
		})
	}

	private send(email64:string) {
		// Takes in already encoded base 64 email
		return new Promise(async (resolve, reject) => {
			if(!this.service)
				await this.getAuthToken()

			this.service.users.messages.send({
				userId: this.userId,
				resource: {
					raw: email64
				}
			}, (err, res) => {
				if(err) return reject(err.errors)

				if(res.status===200) 
					resolve(res.status)
				else
					reject(res.status)
			})
		})
	}

	private async sendQueue() {
		for (const mail64 of this.MAIL64_QUEUE) {
			if(!this.service)
				await this.getAuthToken()

			this.service.users.messages.send({
				userId: this.userId,
				resource: {
					raw: mail64
				}
			}, (err, res) => {
				// if(err) return reject(err.errors)

				// if(res.status===200) 
				// 	resolve(res.status)
				// else
				// 	reject(res.status)
			})
		}
	}

	private interpolateHeaders(mail:IEmail) {
		if(!mail.from)
			mail.from = this.userId

		if(mail.to==='me')
			mail.to = this.userId

		if(!mail.replyTo)
			mail.replyTo = mail.from
		
		try {
			mail.subject = mail.body.split('<title>')[1].split('</title>')[0]
		} catch(ErrorNoTitle) {
			mail.subject = mail.subject
		}
		
		const HEADERS = 
			`From: <${mail.from}>\r\n` + //`From: ${this.username} <${mail.from}>\r\n`
			`Date: ${(new Date()).toString()}\r\n` +
			`Subject: ${mail.subject}\r\n` +
			`To: ${mail.to}\r\n` +
			`Reply-To: ${mail.replyTo}\r\n` +
			this.ContentHeaders + `Content-Length: ${mail.body.length}\r\n\r\n`

		return HEADERS
	}

	private base64Encode(headers, body) {
		return Buffer.from(headers + body + '\r\n--' + this.MultipartSepartor + '--\r\n')
			.toString('base64')
			.replace(/\+/g, '-')
			.replace(/\//g, '_')
			.replace(/=+$/, '')
	}

	async SingleDelivery(mail:IEmail, template?:string) {
		const headers = this.interpolateHeaders(mail)		
		const mail64 = this.base64Encode(headers, mail.body)

		console.log('Sending email', mail.to)
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

	async SingleDataDelivery(mail:IEmail, data:DataItem[], template?:string) {
		if(template)
			mail.body = readTemplate(template)
		if(!mail.body) throw 'Neither body nor template provided'
		
		for (const entry of data) {
			const find = new RegExp(`\{\{ \(${entry.id}\) \}\}`, 'gi')
			mail.body = mail.body.replace(find, entry.data)
		}

		const headers = this.interpolateHeaders(mail)
		const mail64 = this.base64Encode(headers, mail.body)

		console.log('Sending email', mail.to)
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

	async DatasetDelivery(mail:IEmail, dataPath:string, template?:string) {
		let [data, addressList] = readCSV(dataPath)
		let mail_queue = []

		if(template)
			mail.body = readTemplate(template)
		if(!mail.body) throw 'Neither body nor template provided'

		for (const recipient of data) {
			var send = mail
			for (const entry of recipient) {
				const find = new RegExp(`\{\{ \(${entry.id}\) \}\}`, 'gi')
				send.body = send.body.replace(find, entry.data)
			}

			const headers = this.interpolateHeaders(send)
			mail_queue.push(
				this.base64Encode(headers, send)
			)
		}

		try {
			let index = 0
			for (const address of addressList) {
				console.log('Sending email to ' + address)
				if (address !== undefined) {
					try {
						const res = await this.send(mail_queue[index])
						index++
						if (res === 200) {
							if (index < mail_queue.length)
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

	DistributedCampaign = function (mail:IEmail, content:string, database:Database, options?) {
		const MAX_DATA = 50

		let payload = []
		let data_rows = database//.split('\r\n')
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