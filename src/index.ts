export * from './bin/Mailer'
export * from './bin/DataEncoder'
export * from './bin/LoadBalancer'
export * from './bin/DistributionWorker'

export * from './lib/accounts'
export * from './lib/auth'
export * from './lib/templates'

import { join } from 'path'
export const MAILDIR = join(process.cwd(), 'mail')

/**
 * @interface Email object interface
 */
export interface Email {
	to?: string //| string[]
	cc?: string | string[]
	bcc?: string | string[]
	from?: string
	replyTo?: string
	subject: string
	body?: string
	attachments?: Attachment[]
}

export interface Attachment {
	mimeType: string
	filename: string
	size: number
	data: Buffer
}

/**
 * @interface Data Items
 */
export interface DataItem {
	id: string
	data: string
}

export type DataRow = DataItem[]

export interface Database { 
	data: DataRow[]
	addressList: string[]
}

/**
 * @interface Delivery Options
 */
export interface DeliveryOptions {
	template?:string
	quiet?: boolean
	retryFailed?: boolean
	retryCount?: number
}