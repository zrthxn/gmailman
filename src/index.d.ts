/**
 * @description Interfaces
 */

/**
 * @description Email object interface
 */
export interface Email {
	to: string //| string[]
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
 * Data Items
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
 * Delivery Options
 */
export interface DeliveryOptions {
	template?:string
	quiet?: boolean
	retryFailed?: boolean
	retryCount?: number
}