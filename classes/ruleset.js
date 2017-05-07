/**
 * Created by ugall on 18.02.2017.
 */

let crypto = require('./crypto.js');
let Block = require('./block.js');
/*=======================
 Class ruleset
 Takes care of the ruleset for the blockchain
 pow: Proof of work. false => no PoW, "aaa" => hash has to start with "aaa"
 sig: Signatures enabled. false => no signatures needed, true => signatures required
 name: The name of the user in the block has to match the signature name
 crypto: Object of class crypto
 =======================*/

class Ruleset {
    constructor(crypto, pow, sig, name) {
        this.cry = crypto;
        this.pow = pow;
        this.sig = sig;
        this.name = name;
    }

    //Create a new block according to the rules
    createNewBlock (previousBlock, data) {
        //We create a new block
        let nextIndex = previousBlock.index + 1;
        let nextTimestamp = new Date().getTime() / 1000;
        let nextStatus = "";
        let nextCreatorID = this.cry.names[0];
        let nextHash;
        let x;

        //Generate PoW if needed
        if(this.pow !== false) {
            for(x = 0; x <= 500000;x++) {
                nextHash = Ruleset.calculateHash(nextIndex, x, previousBlock.hash, nextTimestamp, data, nextStatus, nextCreatorID);
                //If POW is found, break;
                if(nextHash.substr(0,this.pow.length) === this.pow) {break;}
            }
        } else {
            nextHash = Ruleset.calculateHash(nextIndex, 0, previousBlock.hash, nextTimestamp, data, nextStatus, nextCreatorID);
        }

        //Generate Sig if needed
        let nextSig = "";
        if(this.sig) {
            nextSig = this.cry.createSignature(nextHash);
        }

        return new Block(nextIndex, x, previousBlock.hash, nextTimestamp, data, nextStatus, nextCreatorID, nextHash, nextSig);
    }

    //Calculate the hash for parameters
    static calculateHash (index, nonce, previousHash, timestamp, data, status, creatorID) {
        return crypto.Hash(index + nonce + previousHash + timestamp + data + status + creatorID).toString();
    }
    //Calculate the hash for a block
    static calculateHashForBlock (block) {
        return Ruleset.calculateHash(block.index, block.nonce, block.previousHash, block.timestamp, block.data, block.status, block.creatorID);
    }

    //Check if all requirements are fulfilled
    //TODO: Checks for turned of pow, sig, name, etc. are not done
    isValidNewBlock (newBlock, previousBlock) {
        //ID+1?
        if (previousBlock.index + 1 !== newBlock.index) {
            console.log('invalid index');
            return false;
        } // Hash-linkage correct?
        else if (previousBlock.hash !== newBlock.previousHash) {
            console.log('invalid previoushash');
            return false;
        } //Calculation of Hash correct?
        else if (Ruleset.calculateHashForBlock(newBlock) !== newBlock.hash) {
            console.log(typeof (newBlock.hash) + ' ' + typeof Ruleset.calculateHashForBlock(newBlock));
            console.log('invalid hash: ' + Ruleset.calculateHashForBlock(newBlock) + ' ' + newBlock.hash);
            return false;
        }  //Signature correct?
        else if(!this.cry.checkSignature(newBlock.creatorID,newBlock.signature,newBlock.hash)) {
            console.log("Signature-check failed");
            console.log(this.cry.checkSignature(newBlock.creatorID,newBlock.signature,newBlock.hash));
            return false;
        } //Mining puzzle correct?
        else if(newBlock.hash.toString().substr(0,this.pow.length) !== this.pow) {
            console.log("Mining Puzzle not fulfilled");
            return false;
        }
        console.log("Check passed.");
        return true;
    }

    //Check if an entire Blockchain is valid
    isValidnewBlockchain (newBlocks, genesisBlock, chainlength) {
        //Genesis block has to be the same
        if (JSON.stringify(newBlocks[0]) !== JSON.stringify(genesisBlock)) {
            return false;
        }

        //Length has to be greater
        if(newBlocks.length <= chainlength)
        {
            return false;
        }

        //Check if every block is valid
        let tempBlocks = [newBlocks[0]];
        for (let i = 1; i < newBlocks.length; i++) {
            if (this.isValidNewBlock(newBlocks[i], tempBlocks[i - 1])) {
                tempBlocks.push(newBlocks[i]);
            } else {
                return false;
            }
        }
        return true;
    }
}
module.exports = Ruleset;


