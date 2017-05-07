/**
 * Created by ugall on 18.02.2017.
 */
/*=======================
 Class Node
 This class provides the Handling of the underlying node
 chain: object of class bc
 rule: object of class ruleset
 =======================*/

let BC = require('./blockchain.js');
let Ruleset = require('./ruleset.js');
let Integrity = require('./integrity.js');
class Node
{
    constructor (blockchain,ruleset){
        this.chain = blockchain;
        this.rule = ruleset;
    }

    //Adds a new block to the blockchain according to the ruleset
    addOwnBlock(data) {
        //Generate raw data
        let block = this.rule.createNewBlock(this.chain.getLastBlock(),data);
        let integer = this.chain.getCorrectIntegrity();
        this.chain.addBlock(block, integer);
        //Check if block matches description
        return block;
    }

    //Adds a new block from another party to the blockchain, validating it by the ruleset
    addOtherBlock(block) {
        if(this.rule.isValidNewBlock(block, this.chain.getLastBlock())) {
            let integer = this.chain.getCorrectIntegrity();
            this.chain.addBlock(block, integer);
            return true;
        } else {
            return false;
        }
    }

    ///Replaces the chain while validating it
    replaceChain(newBlocks) {
        if(this.rule.isValidnewBlockchain(newBlocks,this.chain.blockchain[0], this.chain.blockchain.length)) {
            this.chain.replaceChain(newBlocks);
            return true;
        }
        return false;
    }

    manipulateBlock(id, ts, data, status) {

        this.chain.manipulate();

        //BLOCK
        //Get Block
        let block = this.chain.getBlock(id);

        //Manipulate
        block.timestamp = ts;
        block.data = data;
        block.status = status;

        //Save Back
        this.chain.setBlock(id,block);


        //INTEGRITY
        //Get Integrity
        let integer = this.chain.getIntegrity(id);

        integer.Hash = false;
        integer.Signature = false;

        this.chain.setIntegrity(id, integer);

        //Manipulate integrity up all the tree

        let length = this.chain.integritychain.length;
        let start = parseInt(id)+1;
        console.log(length + ": " + start);
        if(length > start)
        {
            let max = length - 1;
            console.log(max);
            for(start; start <= max; start++) {

                integer = this.chain.getIntegrity(start);

                integer.prevHash = false;
                integer.Hash = false;
                integer.Signature = false;

                this.chain.setIntegrity(start, integer);
            }
        }
    }

}
module.exports = Node;

/* TODO
 let manipulateBlock = (id, timestamp, data, status) => {
 //Manipulate Blockchain
 let block = blockchain[id];
 block.timestamp = timestamp;
 block.data = data;
 block.status = status;
 blockchain[id] = block;

 //Manipulate Integrity from the block
 let integer = integrity[id];
 integer.Hash = false;
 integer.Signature = false;
 integrity[id] = integer;

 //Manipulate integrity up all the tree
 let length = integrity.length;
 let start = id+1;
 console.log(length + ": " + start);
 if(length > id+1)
 {
 console.log("here");
 let max = length - 1;
 console.log(max);
 for(start; start <= max; start++) {
 integer = integrity[start];
 integer.prevHash = false;
 integer.Hash = false;
 integer.Signature = false;
 integrity[start] = integer;
 }
 }
 console.log(integrity);
 };
 */