import { google, gmail_v1 } from 'googleapis'
import { OAuth2Client } from 'googleapis-common'

import { readTemplate, readCSV } from './DataEncoder'
import deployNewInstance from './LoadBalancer'
import { authorize } from '../lib/auth'

import { Email, DataItem, Database, DeliveryOptions } from '../index.d'
import { GaxiosResponse } from 'gaxios'

/**
 * Class object for mailer object authorized with single email.
 * Initialize the class with the userID (email) of the account to use.
 * Call functions on an object of this class to send mails.
 * 
 * @description
 * `class` Gmailer
 */
export default class GMailer {
	readonly SCOPES = ['https://mail.google.com']	
	readonly ContentHeaders
	readonly MultipartSepartor

	private userId
	private username

	private authClient: OAuth2Client | null
	private service: gmail_v1.Gmail

	constructor({ userId, username }) {
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
		this.username = username
	}

	/**
	 * Create a new OAuth2 client from the stored token and
	 * initialize the service.
	 * @param type Type of application (as in credentials)
	 */
	private async getAuthClient(type:string = 'installed') {
		console.log('Authorizing', type, 'application, GET OAuth2 Token')
		this.authClient = await authorize(this.userId, type)
		this.service = google.gmail({ 
			version: 'v1', 
			auth: this.authClient
		})
	}

	/**
	 * Send email using service
	 * @param email64 Base64 encoded email in RFC822 format
	 */
	private async send(email64:string): Promise<GaxiosResponse<gmail_v1.Schema$Message>> {
		// Takes in already encoded base 64 email
		if(!this.service) await this.getAuthClient()

		try {
			let res = await this.service.users.messages.send({
				userId: this.userId,
				requestBody: {
					raw: email64
				}
			})

			return res
		} catch (errors) {
			console.error(errors)
			return Promise.reject(errors)
		}
	}

	/**
	 * Genetate email headers according to RFC822 spec
	 * @param mail Mail object
	 */
	private interpolateHeaders(mail:Email): string {
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
			`From: "${this.username}" <${mail.from}>\r\n` +
			`Date: ${(new Date()).toString()}\r\n` +
			`Subject: ${mail.subject}\r\n` +
			`To: ${mail.to}\r\n` +
			`Reply-To: ${mail.replyTo}\r\n` +
			this.ContentHeaders + `Content-Length: ${mail.body.length}\r\n\r\n`

		return HEADERS
	}

	private base64Encode(headers, body): string {
		return Buffer.from(headers + body + '\r\n--' + this.MultipartSepartor + '--\r\n')
			.toString('base64')
			.replace(/\+/g, '-')
			.replace(/\//g, '_')
			.replace(/=+$/, '')
	}

	/**
	 * Deliver a single static email
	 * @param mail 
	 * @param template 
	 */
	async SingleDelivery(mail:Email, template?:string, options?:DeliveryOptions) {
		if(template)
			mail.body = await readTemplate(template)
		if(!mail.body) 
			throw 'Neither body nor template provided'

		const headers = this.interpolateHeaders(mail)		
		const mail64 = this.base64Encode(headers, mail.body)
		
		if(options && !options.quiet)
			console.log('Sending email', mail.to)
		try {
			const { status } = await this.send(mail64)
			if(status===200)
				return
			else 
				throw `Unsuccessful sending to ${mail.to}`
		} catch (error) {
			console.error(error)
			return Promise.reject(error)
		}		
	}

	/**
	 * Deliver a single email with data interpolation
	 * @param mail `Email` object
	 * @param data `DataItem` object
	 * @param template Name of template
	 */
	async SingleDataDelivery(mail:Email, data:DataItem[], template?:string, options?:DeliveryOptions) {
		if(template)
			mail.body = await readTemplate(template)
		if(!mail.body) 
			throw 'Neither body nor template provided'
		
		for (const entry of data) {
			const find = new RegExp(`\{\{ \(${entry.id}\) \}\}`, 'gi')
			mail.body = mail.body.replace(find, entry.data)
		}

		const headers = this.interpolateHeaders(mail)
		const mail64 = this.base64Encode(headers, mail.body)

		if(options && !options.quiet)
			console.log('Sending email', mail.to)
		try {
			const { status } = await this.send(mail64)
			if(status===200)
				return
			else 
				throw `Unsuccessful sending to ${mail.to}`
		} catch (error) {
			console.error(error)
			return Promise.reject(error)
		}
	}

	/**
	 * Deliver multiple emails with data interpolation
	 * @param mail `Email` object
	 * @param dataPath Path of CSV file to read data from
	 * @param template Name of template
	 */
	async DatasetDelivery(mail:Email, dataPath:string, template?:string, options?:DeliveryOptions) {
		let [data, addressList] = await readCSV(dataPath)
		let MailQueue = []

		if(template)
			mail.body = await readTemplate(template)
		if(!mail.body) 
			throw 'Neither body nor template provided'

		for (const recipient of data) {
			var send = mail
			for (const entry of recipient) {
				const find = new RegExp(`\{\{ \(${entry.id}\) \}\}`, 'gi')
				send.body = send.body.replace(find, entry.data)
			}

			const headers = this.interpolateHeaders(send)
			MailQueue.push(
				this.base64Encode(headers, send)
			)
		}

		let failAddressList = [], FailQueue = []
		let retryCount = options.retryCount || 0
		if(!options.retryFailed)
			retryCount = 0

		do {
			try {
				let index = 0
				for (const address of addressList) {
					if(options && !options.quiet)
						console.log('Sending email to', address)
					if (address) {
						try {
							const { status } = await this.send(MailQueue[index])
							index++
							if (status===200) {
								if (index < MailQueue.length)
									continue
								else 
									return 
							}
							else {
								FailQueue.push(MailQueue[index])
								failAddressList.push(address)
								throw `Unsuccessful sending to ${address}`
							}
						} catch (error) {
							console.error(error)
						}
					} 
					else
						if(options && !options.quiet)
							console.error(`Invalid row ${index}: No email address provided` )
				}
			} catch (error) {
				console.error(error)
			}

			if(options.retryFailed) {
				retryCount--
				MailQueue = FailQueue
				addressList = failAddressList
				if(options && !options.quiet)
					console.log(`[${retryCount}] Retrying ${addressList.length} mails`)
			}	
		} while (retryCount>=0);
	}

	/**
	 * Distrubuted `TODO`
	 * @param mail `Email` object
	 * @param content 
	 * @param database 
	 */
	async DistributedCampaign(mail:Email, content:string, database:Database) {
		const MAX_DATA = 50

		let payload = []
		let data_rows = database//.split('\r\n')
		let head = data_rows[0]

		let count = Math.floor((data_rows.length - 1) / MAX_DATA) + 1
		for (let i = 0; i < count; i++) {
			let data = String()
			for (let j = MAX_DATA * i + 1; j <= (i + 1) * MAX_DATA; j++) {
				if (!data_rows[j]) break
				data += ('\r\n' + data_rows[j])
			}

			payload.push({ mail, content, data: head + data })
		}

		deployNewInstance('./DistributionWorker', count, payload, 'free')
	}
}