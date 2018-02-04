const uuid = require('uuid/v1')
const timestamp = require('unix-timestamp')
timestamp.round = true
const zmq = require('zmq')
const dirClient = zmq.socket('rep')
const broadcast = zmq.socket('pub')

var clients = [
        {uuid :'s893h3ghe', name : 'Adrian'},
        {uuid :'sds893h3ghe', name : 'Peter'},
        {uuid :'sdsdsfd234', name : 'Klaus'}
    ];


const dirClientPort = '5555',
        broadcastPort = '8688'

function find(array, type, searchFor){
    return array.some(element => {
        //console.log(element)       
            if(element[type] == searchFor[type]) {
                console.log('found ' + type + ':', element)
                return true;
            }
        });
}

dirClient.on('message', function(msg) {
    const payload = JSON.parse(msg.toString())
  
    console.log('recived payload', payload)
    //#1
    if(payload.name) {
        var isNameValid = !find(clients, 'name', payload)
        console.log('search result:', isNameValid)
        if(isNameValid === false){
            dirClient.send(JSON.stringify({error: '-1'}))
        }else if(isNameValid === true){
            var user = {
                uuid : uuid(),
                name: payload.name
            }
            user.uuid = uuid()
            user.name = payload.name
            clients.push(user)
            console.log('clients: ', clients)
            dirClient.send(JSON.stringify({uuid: user.uuid}))
        }
    }else if(payload.uuid && payload.content) {
        console.log('recived content:', payload.content)

        if(payload.content.length < 65935 && find(clients, 'uuid', payload)) {
            var userName = clients.find(function(obj) {
                    return obj.uuid === payload.uuid
                })

            var broadcastPayload = {
                    timestamp: timestamp.now(),
                    user_name: userName.name,
                    content: payload.content
                }

            broadcast.send(JSON.stringify(broadcastPayload))
            console.log('Broadcasted:', broadcastPayload)
            dirClient.send(JSON.stringify({success: true}))
        }else{
            dirClient.send(JSON.stringify({success: false}))
        }
    }
    
})
dirClient.bind("tcp://*:"+dirClientPort, function(err) {
    if(err) {
        console.log(err)
    } else {
        console.log("listening on", dirClientPort)
    }
})

broadcast.bind('tcp://*:'+broadcastPort, function(err) {
    if(err)
      console.log(err)
    else
      console.log("Listening on", broadcastPort)
  })
  

process.on('SIGINT', function() {
    dirClient.close()
})