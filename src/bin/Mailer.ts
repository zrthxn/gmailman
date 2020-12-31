import { google, gmail_v1 } from 'googleapis'
import { OAuth2Client } from 'googleapis-common'

import { readCSV, readAttachment } from './DataEncoder'
import deployNewInstance from './LoadBalancer'

import { authorize } from '../lib/auth'
import { readTemplate } from '../lib/templates'

import { Email, DataItem, DeliveryOptions, Attachment } from '..'
import { GaxiosResponse } from 'gaxios'
import conf from '../lib/conf'

const _ENDL_ = '\r\n'
const ATTACHMENT_MAXSIZE = 24 * 1024 * 1024

/**
 * Class object for mailer object authorized with single email.
 * Initialize the class with the userID (email) of the account to use.
 * Call functions on an object of this class to send mails.
 * 
 * @description
 * `class` Gmailer
 */
export class Mailer {
	readonly SCOPES = ['https://mail.google.com']	
	readonly ContentHeaders
	readonly MultipartSepartor

	private userId
	private username

	private authClient: OAuth2Client | null
	private service: gmail_v1.Gmail

	constructor({ userId, username }) {
		this.MultipartSepartor = `000000${(+new Date).toString(16)}`
		this.userId = userId
		this.username = username
	}

	/**
	 * Create a new OAuth2 client from the stored token and
	 * initialize the service.
	 * @param type Type of application (as in credentials)
	 */
	private async getAuthClient(type:string = 'installed') {
		try {
			console.log('Authorizing', type, 'application, GET OAuth2 Token')
			this.authClient = await authorize(this.userId, type, this.SCOPES)
			this.service = google.gmail({ 
				version: 'v1', 
				auth: this.authClient
			})
		} catch (error) {
			console.error(conf.Red(error));
		}
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
			// console.error(errors)
			return Promise.reject(errors)
		}
	}

	/**
	 * Encode Email headers according to RFC822 spec
	 * @param mail Mail object
	 */
	private EncodeMessage(mail: Email): string {		
		if(!mail.from) mail.from = this.userId
		if(mail.to==='me') mail.to = this.userId
		if(!mail.replyTo) mail.replyTo = mail.from
		
		try {
			mail.subject = mail.body.split('<title>')[1].split('</title>')[0]
		} catch(ErrorNoTitle) {
			mail.subject = mail.subject
		}

		let ADDRESS_BLOCK = [
			`From: "${this.username}" <${mail.from}>`,
			`Date: ${(new Date()).toString()}`,
			`Subject: ${mail.subject}`,
			`To: ${mail.to}`,
			`Reply-To: ${mail.replyTo}`,
			'Mime-Version: 1.0',
			`Content-Type: multipart/mixed; boundary=\"${this.MultipartSepartor}\"`,
			'Content-Transfer-Encoding: binary', _ENDL_
		].join(_ENDL_)

		// Body Content
		let BODY_BLOCK = [
			`Content-Transfer-Encoding: binary`,
			`Content-Type: text/html; charset="utf-8"`,
			`Content-Disposition: inline`,
			`Content-Length: ${mail.body.length}`, _ENDL_,
			mail.body, _ENDL_
		].join(_ENDL_)

		// Attachment Content
		var ATTACHMENT_BLOCKS = []
		if(mail.attachments !== undefined) {
			for (const attachment of mail.attachments) {
				ATTACHMENT_BLOCKS.push([
					`Content-Transfer-Encoding: base64`,
					`Content-Type: ${attachment.mimeType}; name=${attachment.filename}`,
					`Content-Disposition: attachment; filename=${attachment.filename}`,
					`Content-Length: ${attachment.size}`, _ENDL_, 
					attachment.data.toString('base64'), _ENDL_
				].join(_ENDL_))
			}
		}

		var RAW_EMAIL = [
			ADDRESS_BLOCK,
			BODY_BLOCK,
			...ATTACHMENT_BLOCKS
		].join(
			`--${this.MultipartSepartor}${_ENDL_}`
		)

		return Buffer.from(RAW_EMAIL + '--' + _ENDL_)
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
	async SingleDelivery(mail:Email, options?:DeliveryOptions) {
		if(options) {
			if(options.template)
				mail.body = await readTemplate(options.template)		
		}

		if(!mail.body) throw 'Neither body nor template provided'
		
		const mail64 = this.EncodeMessage(mail)
		
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
	async SingleDataDelivery(mail:Email, data:DataItem[], options?:DeliveryOptions) {
		if(options) {
			if(options.template)
				mail.body = await readTemplate(options.template)		
		}

		if(!mail.body) throw 'Neither body nor template provided'
		
		for (const entry of data) {
			if(entry.id.match(/attachmen[t|ts]/gi)) {
				let attachment: Attachment = await readAttachment(entry.data)

				if(mail.attachments)
					mail.attachments = [ ...mail.attachments, attachment]
				else
					mail.attachments = [ attachment ]

				let netsize = mail.attachments.reduce((size, file) => size += file.size, 0)
				if(netsize >= ATTACHMENT_MAXSIZE)
					throw 'Max. attachment size exceeded'
			} else {
				const find = new RegExp(`\{\{ \(${entry.id}\) \}\}`, 'gi')
				mail.body = mail.body.replace(find, entry.data)
			}
		}

		const mail64 = this.EncodeMessage(mail)

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
	async DatabaseDelivery(mail:Email, datapath:string, options:DeliveryOptions = {}) {
		if(options.template)
			mail.body = await readTemplate(options.template)

		// var retryCount = 0
		// if(options.retryFailed && options.retryCount)
		// 	retryCount = options.retryCount

		if(!mail.body) throw 'Neither body nor template provided'
		
		const { data, addressList } = await readCSV(datapath)
		var MailQueue = []

		for (let IDX = 0; IDX < addressList.length; IDX++) {
			const recipient = data[IDX]
			var send = {
				...mail, to: addressList[IDX]
			}

			for (const entry of recipient) {
				if(entry.id.match(/attachmen[t|ts]/gi)) {
					let attachment: Attachment = await readAttachment(entry.data)

					if(send.attachments)
						send.attachments = [ ...send.attachments, attachment]
					else
						send.attachments = [ attachment ]

					let netsize = send.attachments.reduce((size, file) => size += file.size, 0)
					if(netsize >= ATTACHMENT_MAXSIZE)
						throw 'Max. attachment size exceeded'
				} else {
					const find = new RegExp(`\{\{ \(${entry.id}\) \}\}`, 'gi')
					send.body = send.body.replace(find, entry.data)
				}
			}

			MailQueue.push(
				this.EncodeMessage(send)
			)
		}

		// let failAddressList = [], FailQueue = []
		// do {
			let index = 0
			for (const address of addressList) {
				console.log('Sending email to', address)
				try {
					if (address) {
						const { status } = { status: 200} //await this.send(MailQueue[index])
						index++
						if (status===200) {
							if (index < MailQueue.length)
								continue
							else 
								return 
						}
						else {
							// FailQueue.push(MailQueue[index])
							// failAddressList.push(address)
							throw `Unsuccessful sending to ${address}`
						}
					} 
					else
						throw `Invalid row ${index}: No email address provided`
				} catch (error) {
					console.error(conf.Red(error))
				}
			}
			
		// 	if(options.retryFailed) {
		// 		retryCount--
		// 		MailQueue = FailQueue
		// 		addressList = failAddressList
		// 		if(!options.quiet)
		// 			console.log(`[${retryCount}] Retrying ${addressList.length} mails`)
		// 	}	
		// } while (retryCount>0);
	}

	/**
	 * Distrubuted `TODO`
	 * @param mail `Email` object
	 * @param content 
	 * @param database 
	 */
	// async DistributedCampaign(mail:Email, content:string, database:Database) {
	// 	const MAX_DATA = 50

	// 	let payload = []
	// 	let data_rows = database//.split('\r\n')
	// 	let head = data_rows[0]

	// 	let count = Math.floor((data_rows.length - 1) / MAX_DATA) + 1
	// 	for (let i = 0; i < count; i++) {
	// 		let data = String()
	// 		for (let j = MAX_DATA * i + 1; j <= (i + 1) * MAX_DATA; j++) {
	// 			if (!data_rows[j]) break
	// 			data += ('\r\n' + data_rows[j])
	// 		}

	// 		payload.push({ mail, content, data: head + data })
	// 	}

	// 	deployNewInstance('./DistributionWorker', count, payload, 'free')
	// }
}

export default Mailer