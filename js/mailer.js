/* [mailer.js] is used by multiple services */
const fs = require('fs')

const mailgunConfig = JSON.parse(fs.readFileSync('./configs/mailgun-config.json', 'utf8'))
const mailgun = require('mailgun-js')(mailgunConfig)

const title = 'Automation'
const from = '"Automation" <admin@automation.furimako.com>'

module.exports = {
    send: (subject, text) => {
        const data = {
            from,
            to: 'furimako@gmail.com',
            subject: `[${title}] ${subject}`,
            text
        }
        
        mailgun.messages().send(data, (err, body) => {
            if (err) {
                Error(`some error occurred in mailer\n${err}`)
            }
            console.log('--- sending mail ---')
            console.log(`body: ${body}`)
            console.log(`<<text>>\n${text}`)
            console.log('--------------------')
        })
    }
}
