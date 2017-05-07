/**
 * Created by ugall on 18.02.2017.
 */

/*=======================
Class Block
    Describes a single block

    index: defines the order of blocks. Starts with 0 for genesisBlock, always +1
    nonce: is a random number that is ++ until mining puzzle is solved
    previousHash: Hash of the previous block. Genesis does not have one
    timestamp: A timestamp of the creation of the block
    data: The data payload of the block
    status: The status describes what stage the document is. May be deprecated TODO
    creatorID: Name or ID of Creator
    hash: Hash of the block according to rule set
    signature: signature of the hash according to rule set

    +getGenesisBlock(): Generates the first Block. Has to be identical for all nodes that want to work on the same chain
=======================*/

class Block {
    constructor(index, nonce, previousHash, timestamp, data, status, creatorID, hash, signature) {
        this.index = index;
        this.nonce = nonce;
        this.previousHash = previousHash.toString();
        this.timestamp = timestamp;
        this.data = data;
        this.status = status.toString();
        this.creatorID = creatorID.toString();
        this.hash = hash.toString();
        this.signature = signature.toString();
    }

    static getGenesisBlock()
    {
        return new Block(0,"Nonce", "0", 1465154705, "PGgxPlZlcnRyYWc8L2gxPg==","","", "816534932c2b7154836da6afc367695e6337db8a921823784c14378abed4f7d7","");
    }

}
module.exports = Block;
