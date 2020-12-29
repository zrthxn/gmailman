import cluster from 'cluster'
import Mailer from './Mailer'

interface order {
	delay: number
}

/**
 * @todo Multiprocessing
 */

const mail = new Mailer({ userId: 'zrthxn@gmail.com', username: 'Alisamar Husain' })
process.on('message', (order)=>{
	setTimeout(function startInstance(){
		mail.DatabaseDelivery(order.payload.mail, order.payload.content, order.payload.data)
			.then(()=>{
				process.send({ pid: order.pid, complete: true, errors: [] })
			})
			.catch((err)=>{
				process.send({ pid : order.pid, complete : true, errors: [err]})
			});
	}, order.delay)
});