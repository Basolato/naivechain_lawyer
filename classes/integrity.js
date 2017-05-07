/**
 * Created by ugall on 18.02.2017.
 */
/*=======================
 Class integrity
 This class provides an integrityblock
 prevHash: is the previous Hash ok or not?
 Hash: is the hash at all correct?
 Signature: is the signature correct?
 =======================*/
class Integrity {
    constructor(prevHash, Hash, Signature) {
        this.prevHash = prevHash.toString();
        this.Hash = Hash.toString();
        this.Signature = Signature.toString();
    }

    //Generate an Integrity Block where every property is true
    static getGenesisIntegrity() {
        return new Integrity(true,true,true);
    }
    static getWrongIntegrity() {
        return new Integrity(false,false,false);
    }
}
module.exports = Integrity;