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
}

/**
 * Data Items
 */
export type DataItem  = {
	id: string
	data: string
}
export type Database = DataItem[]

/**
 * Delivery Options
 */
export interface DeliveryOptions {
	quiet?: boolean
	retryFailed?: boolean
	retryCount?: number
}