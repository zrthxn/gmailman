import cluster from 'cluster'
import mailer from './Gmailer'

interface order {
	delay: number
}

const Gmailer = new mailer()
process.on('message', (order)=>{
	setTimeout(function startInstance(){
		Gmailer.DatasetDelivery(order.payload.mail, order.payload.content, order.payload.data)
			.then(()=>{
				process.send({ pid: order.pid, complete: true, errors: [] })
			})
			.catch((err)=>{
				process.send({ pid : order.pid, complete : true, errors: [err]})
			});
	}, order.delay)
});