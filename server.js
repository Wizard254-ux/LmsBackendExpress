express=require('express')
app=express()
http=require('http')
server=http.createServer(app)

module.exports={server,express,app}
