module.exports = async (err, req, res, next) => {
    if(err.statusCode) {
        return res.status(err.statusCode).send(err.message)
    }else {
        return res.status(500).json({ title: "Something went wrong!", message: err.message, stackTrace: err.stack })
    }
}