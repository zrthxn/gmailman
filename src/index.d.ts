interface IEmail {
	to: string
	from?: string
	replyTo?: string
	subject?: string
	body?: string
}

interface DataItem {
	id: string
	data: string
}

type EmailContent = string
type EmailDatabase = string