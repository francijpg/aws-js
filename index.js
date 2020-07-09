require('dotenv/config')

const express = require('express')
const multer = require('multer')
const AWS = require('aws-sdk')
const uuid = require('uuid')

const app = express()
const port = process.env.PORT

const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ID,
    secretAccessKey: process.env.AWS_SECRET
})

const storage = multer.memoryStorage({
    destination: function(req, file, callback) {
        callback(null, '')
    }
})

const upload = multer({storage}).single('image')

app.post('/aws/api/upload', upload, (req, res) => {

    let myFile = req.file.originalname.split(".")
    const fileType = myFile[myFile.length - 1]

    const params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: `${uuid.v4()}.${fileType}`,
        Body: req.file.buffer
    }

    s3.upload(params, (error, data) => {
        if(error){
            res.status(500).send(error)
        }

        res.status(200).send(data)
    })
})

app.get('/aws/api',  (req, res) => {

    const params = {
      Bucket: process.env.AWS_BUCKET_NAME
    }
    let keys = []

    try {
      s3.listObjectsV2(params, (err, data) => {
        if (err) {
          res.status(404).send('Sorry, cant find that: ' + err)
        }
        let contents = data.Contents
        contents.forEach((content) => keys.push(content.Key))
        res.send(keys)
      })
    } catch (e) {
      console.log('out error: ', e)
    }
})

app.listen(port, () => {
    console.log(`Listening on port: ${port}`)
})