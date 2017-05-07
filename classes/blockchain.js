/**
 * Created by ugall on 18.02.2017.
 */
/*=======================
 Class BC
 Describes the overall blockchain

 blockchain: Array of Blocks
 integritychain: Array of Integrity Blocks
 =======================*/
let Integrity = require('./integrity.js');
class BC
{
    constructor (genesisBlock,integrityBlock){
        this.blockchain = [genesisBlock];
        this.integritychain = [integrityBlock];
        this.manipulated = false;
    }

    manipulate()
    {
        this.manipulated = true;
    }

    //Gives Block with certain ID
    getBlock(id) {
        return this.blockchain[id];
    }

    //Gives Integrity of Block with certain ID
    getIntegrity(id) {
        return this.integritychain[id];
    }

    //Get the last Block at the chain
    getLastBlock(){
        return this.blockchain[this.blockchain.length-1];
    }

    //get the integrity of the last Block
    getlastIntegrity(){
        return this.integritychain[this.integritychain.length-1];
    }

    getCorrectIntegrity(){
        let integer = this.getlastIntegrity();
        if(this.manipulated == false) {
            return Integrity.getWrongIntegrity();
        } else {
            return Integrity.getGenesisIntegrity();
        }
    }

    //Add a block with its integrity to the chain
    addBlock(block, integrity) {
        this.blockchain.push(block);
        this.integritychain.push(integrity);
    }

    //Manipulate a block
    setBlock(id, block) {
        this.blockchain[id] = block;
    }

    //Maniuplate an integrity block
    setIntegrity(id, integrity) {
        this.integritychain[id] = integrity;
    }

    //Replace the blockchain
    replaceChain(newBlocks) {
        this.blockchain = newBlocks;
        this.integritychain = [Integrity.getGenesisIntegrity()];
        //Generate Integrity Blocks
        for(let i = 1;i < newBlocks.length;i++)
        {this.integritychain.push(Integrity.getGenesisIntegrity());}

    }
}
module.exports = BC;