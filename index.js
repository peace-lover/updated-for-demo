const express = require('express')
const bodyParser = require('body-parser')
const decodeJWT = require('did-jwt').decodeJWT
const { Credentials } = require('uport-credentials')
const transports = require('uport-transports').transport
const message = require('uport-transports').message.util
const ngrok = require('ngrok')
var mnid = require('mnid');
const ethers = require('ethers');
const provider = ethers.providers.getDefaultProvider('rinkeby');


// let endpoint = 'http://addacardemo.attinadsoftware.com:5600';
let endpoint;
const app = express();
app.use(bodyParser.json({ type: '*/*' }))

const credentials = new Credentials({
    appName: 'Login Example',
    did: 'did:ethr:0x9aadd100341ce940610b216b2b688617f05e0ba9',
    privateKey: '951ed41d161eea72e46c10717d30b88766848bf981bf4fd2f9568f15e011d332' });

    app.get('/', async (req, res) => {

        await ngrok.disconnect();
        endpoint = await ngrok.connect(5600);
        credentials.createDisclosureRequest({
          notifications: true,
          accountType: 'keypair',
          network_id: '0x4',
          callbackUrl: endpoint + '/callback'
          }).then(requestToken => {
            console.log(requestToken)
            console.log(decodeJWT(requestToken))  //log request token to console
            const uri = message.paramsToQueryString(message.messageToURI(requestToken), {callback_type: 'post'})
            const qr =  transports.ui.getImageDataURI(uri)
            res.send(`<div><img src="${qr}"/></div>`)
        })
      
    })


app.post('/callback', (req, res) => {

    const jwt = req.body.access_token
    credentials.authenticateDisclosureResponse(jwt).then(creds => {
        const push = transports.push.send(creds.pushToken, creds.boxPub)

        console.log("this is creds mnid",creds.mnid);
          
              credentials.createVerification({
                sub: creds.did,
                exp: Math.floor(new Date().getTime() / 1000) + 30 * 24 * 60 * 60,
                claim: {'Smart Pass' : {'Last Seen' : `${new Date()}`,
                "First Name" : "Abdullah",
                "Second Name" : "Al Marzouqi",
                "Gender":"Male",
                "Nationality" : "United Arab Emirates"
              }}
              }).then(attestation => {
                console.log(`Encoded JWT sent to user: ${attestation}`)
                console.log(`Decodeded JWT sent to user: ${JSON.stringify(decodeJWT(attestation))}`)
                return push(attestation)  // *push* the notification to the user's uPort mobile app.
              }).then(res => {
                console.log(res)
                console.log('Push notification sent and should be recieved any moment...')
                console.log('Accept the push notification in the uPort mobile application')

                //send bank statement

                credentials.createVerification({
                    sub: creds.did,
                    exp: Math.floor(new Date().getTime() / 1000) + 30 * 24 * 60 * 60,
                    claim: {'Bank Statement' : {'BankName' : 'First Abu Dhabi Bank', 
                    'AccountNumber':'5242431234567890', 'CreditScore': '720', 'AccountHolderName':'Abdullah Al Marzouqi'}}
                  }).then(attestation => {
                    console.log(`Encoded JWT sent to user: ${attestation}`)
                    console.log(`Decodeded JWT sent to user: ${JSON.stringify(decodeJWT(attestation))}`)
                    return push(attestation)  // *push* the notification to the user's uPort mobile app.
                  }).then(res => {
                    console.log(res)
                    console.log('Push notification sent and should be recieved any moment...')
                    console.log('Accept the push notification in the uPort mobile application')

                    //send driving license

                    credentials.createVerification({
                        sub: creds.did,
                        exp: Math.floor(new Date().getTime() / 1000) + 30 * 24 * 60 * 60,
                        claim: {'Driving License' : {'Id' : '1234'}}
                      }).then(attestation => {
                        console.log(`Encoded JWT sent to user: ${attestation}`)
                        console.log(`Decodeded JWT sent to user: ${JSON.stringify(decodeJWT(attestation))}`)
                        return push(attestation)  // *push* the notification to the user's uPort mobile app.
                      }).then(res => {
                        console.log(res)
                        console.log('Push notification sent and should be recieved any moment...')
                        console.log('Accept the push notification in the uPort mobile application')

                        //fill ethers
                        console.log("this is creds mnid",creds.mnid);
                        let decodedmnid = mnid.decode(creds.mnid);
                        console.log(decodedmnid);
                        let addressToSendEther = decodedmnid.address;

                        console.log("this is the address to send ethers to",addressToSendEther);

                        var privateKey = '0xF6F73ED9A00412658BFD82BCBEE2435764D97AD3B3C2C9FA5CB3B6CDF9B50C30'
                        var wallet = new ethers.Wallet(privateKey);
                        wallet.provider = ethers.providers.getDefaultProvider('rinkeby');
                        var amount = ethers.utils.parseEther('1.5');

                        wallet.send(addressToSendEther, amount).then (function(sendPromise){
                        provider.waitForTransaction(sendPromise.hash);
                        console.log(addressToSendEther+" loaded with 1.5 Ethers");
                        try {
                            ngrok.disconnect(endpoint);  
                        } catch (error) {
                            console.log(error);
                            console.log("leave it");
                            
                        }
                        

                    })
                })
            })
        })
    })
 })
      
        
          // run the app server and tunneling service
const server = app.listen(5600, () => {
    console.log("Smart Pass listening at 5600");
    // ngrok.connect(5600).then(ngrokUrl => {
    //     endpoint = ngrokUrl
    //     console.log(`Driving License running, open at ${endpoint}`)
    // })
})