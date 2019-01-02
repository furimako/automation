module.exports = {
    now() {
        const dateObj = new Date()

        const year = dateObj.getFullYear()
        const month = dateObj.getMonth() + 1
        const date = dateObj.getDate()

        const hours = (`00${dateObj.getHours()}`).slice(-2)
        const minutes = (`00${dateObj.getMinutes()}`).slice(-2)
        const seconds = (`00${dateObj.getSeconds()}`).slice(-2)

        return `${year}/${month}/${date} ${hours}:${minutes}:${seconds}  JST(UTC+09:00)`
    }
}
