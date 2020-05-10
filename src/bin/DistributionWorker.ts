import cluster from 'cluster'
import GMailer from './GMailer'

interface order {
	delay: number
}

const mail = new GMailer({ userId: 'zrthxn@gmail.com' })
process.on('message', (order)=>{
	setTimeout(function startInstance(){
		mail.DatasetDelivery(order.payload.mail, order.payload.content, order.payload.data)
			.then(()=>{
				process.send({ pid: order.pid, complete: true, errors: [] })
			})
			.catch((err)=>{
				process.send({ pid : order.pid, complete : true, errors: [err]})
			});
	}, order.delay)
});