import path from 'path'

export * from './bin/GMailer'
export * from './bin/DataEncoder'
export * from './bin/LoadBalancer'
export * from './bin/DistributionWorker'

export * from './lib/accounts'
export * from './lib/auth'
export * from './lib/templates'

export * from './index.d'

export const MAILDIR = path.join(process.cwd(), 'mail')

// TEST ----------------------------------------

// import GMailer from './bin/GMailer'

// const mailer = new GMailer({ userId: 'ieeejmiteam@gmail.com', username: 'IEEE Jamia Millia Islamia' })

// mailer.DatabaseDelivery(
//   {
//     from: 'ieeejmiteam@gmail.com',
//     subject: 'Webinar E-Certificate | IEEE JMI',
//     body: 
//     `
//     Greetings <br><br>

//     Thank you for attending the Webinar on Climbing Technical Leadership with IEEE PELS with 
//     Prof. Frede Blaabjerg of Aalborg University, Denmark, hosted by Dr. Ahteshamul Haque with 
//     support from IEEE Delhi Section, on the occasion of IEEE PELS Day 2020. <br><br>

//     Please find attached herein your e-certificate for the same. <br><br>

//     Warm Regards,<br>
//     Alisamar Husain<br>
//     <i>Chairperson, IEEE JMI</i><br>
//     `
//   },
//   '../../Desktop/IEEE/Events/Meet Attendance 2020-6-20 12_15.csv', 
//   {}
// )

// // mailer.SingleDataDelivery({
// //   to: 'alisamar181099@gmail.com',
// //   subject: 'Test',
// //   body: 'This Email is a {{ test }} test of your {{ quan }} capabilities'
// // }, [
// //   { id: 'test', data: 'successful' },
// //   { id: 'quan', data: 'many' },
// //   { id: 'attachment', data: '../../Desktop/IEEE/ORG.png' },
// //   { id: 'attachment', data: '../../Desktop/IEEE/Certificate.png' },
// // ]).then(()=>{
// //   console.log('SENT')
// // })