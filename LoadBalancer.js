const os = require('os');
const cluster = require('cluster');
const {spawn, fork} = require('child_process');

exports.deployNewInstance = function (filename, count, payload, mode) {
    if(mode==='strict') {
        if(payload.length !== count) throw "Payload count mismatch :: Load Balancer"
        // No of deployed nodes = cpu count
        // await completion
    } else {  
        var forks = []
        for(let i=0; i<count; i++){
            let __pid = generateProcessId(6)
            console.time(__pid)
            forks[i] = fork(filename)
            forks[i].send({ pid: __pid, payload: payload[i], delay: (1000/count)*(i+1) })
            forks[i].on('message', (res)=>{
                if(res.complete) {
                    console.log('DONE')
                    console.timeEnd(__pid)
                } else
                    console.log(res.pid, 'FAILED')
                forks[i].unref()
            })
        }
    }
}

function generateProcessId(len) {
    var id = ""
    for(let k=0; k<len; k++)
        id += Math.floor( (Math.random())*16 ).toString(16)
    return id
}