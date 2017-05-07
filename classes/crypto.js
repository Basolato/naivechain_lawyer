/**
 * Created by ugall on 18.02.2017.
 */
/*=======================
 Class crypto
 Crypto class handles every crypto like topics: signature creation, signature validation and hash-functions

 keys: array of all crypto-keys. keys[0] is own key.
 names: array of all names. names[0] is own name.
 =======================*/
let NodeRSA = require('node-rsa');
let fs = require('fs');
let CryptoJS = require("crypto-js");

class crypto
{
    constructor(name, peers) {
        //Define own name and own key
        this.keys = [crypto.getKey(name,true)];
        this.names = [name];

        let self = this;

        //Define other names and keys
        peers.forEach(function (element, index, array) {
            let key = crypto.getKey(element);

            //Check if key is there
            if(key !== true)
            {
                self.keys.push(key);
                self.names.push(element);
            }
        });
    }

    //Generate the Hash for any given string.
    static Hash(str){
        return CryptoJS.SHA256(str);
    }

    //Checks the signature of a string with a key
    checkSignature (name, sig, data) {
        return this.keys[this.names.indexOf(name)].verify(data,sig, 'utf8','base64');
    }

    //Create a signature of data with own key
     createSignature (data) {
        return this.keys[0].sign(data, 'base64', 'utf8');
    }

    //Get a key, either your own private or other public keys. If no private key is found, a key is generated
    static getKey (name, priv = false) {
        if(priv) { //Private key
            //Set file Names
            let filename = "keys/" + name + "_private.key";
            let filename_pub = "keys/" + name + "_public.key";
            let data;
            let key;
            let exporting;
            let exporting_pub;

            //Lets see if there is a key
            try{
                data = fs.readFileSync(filename,'utf8');
            }
            catch(err) //No, then we are generating one ourself
            {
                console.log("no key found. Generating...");
                key = new NodeRSA({b: 512});
                console.log("Key generated");
                exporting = key.exportKey('private');
                exporting_pub = key.exportKey('public');

                //Write private key
                fs.writeFileSync(filename, exporting);

                //Write public key
                fs.writeFileSync(filename_pub, exporting_pub);

                //giving back the key
                return key;
            }

            //Found a key, just building it back
            console.log("key found");
            key = new NodeRSA();
            key.importKey(data);
            return key;

        } else { //Public key
            let filename = "keys/" + name + "_public.key";
            let dataOther;
            let keyOther;
            try{
                dataOther = fs.readFileSync(filename,'utf8');
                console.log('Other key found.');
            }
            catch(err)
            {
                console.log('Other key not found.');
                keyOther = false;
            }
            if(keyOther !== false)
            {
                keyOther = new NodeRSA();
                keyOther.importKey(dataOther);
            }
            return keyOther;
        }
    }
}
module.exports = crypto;
