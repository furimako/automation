const fs = require('fs')

const mailgunConfig = JSON.parse(fs.readFileSync('./configs/mailgun-config.json', 'utf8'))
const mailgun = require('mailgun-js')(mailgunConfig)


module.exports = {
    send: async (subject, text) => {
        const data = {
            from: '"automation" <admin@automation.furimako.com>',
            to: 'furimako@gmail.com',
            subject,
            text
        }
        
        await mailgun.messages().send(data, (error, body) => {
            if (error) {
                Error('some error occurred in mailer')
            }

            console.log('--- sending mail ---')
            console.log(`[body]\n${body}\n`)
            console.log(`[text]\n${text}`)
        })
    }
}
