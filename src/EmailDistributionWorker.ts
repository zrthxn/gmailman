const cluster = require('cluster');
const Gmailer = require('./Gmailer');

process.on('message', (order)=>{
    function startInstance() {
        setTimeout(function(){
            Gmailer.DatasetDelivery(order.payload.mail, order.payload.content, order.payload.data)
                .then(()=>{
                    process.send({ pid: order.pid, complete: true, errors: [] })
                })
                .catch((err)=>{
                    process.send({ pid : order.pid, complete : true, errors: [err]})
                });
        }, order.delay)
    }
    startInstance()
});