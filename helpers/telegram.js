const axios = require('axios')

const devs = {
    // chan: '6197085985',
    // vennela: '5045020464',
    // teju: '6089466878'
   sathish: "1321350229",

}

const botToken = process.env.BOT_API_TOKEN

async function sendMessage(chatId, message) {
    try {
        let formattedMessage = `<b>${message}</b>`
    
        const baseURL = `https://api.telegram.org/bot${botToken}/sendMessage`
        const url = `${baseURL}?chat_id=${chatId}&text=${formattedMessage}&parse_mode=html`

        await axios.get(url)
    }catch(err) {
        console.log("Error in sending alert:", err.message)
    }
}

module.exports = {
    alertDev: (message) => {
        Object.values(devs).forEach(id => {
            sendMessage(id, message)
        })
    }
}