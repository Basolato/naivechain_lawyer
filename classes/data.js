/**
 * Created by ugall on 18.02.2017.
 */
/*=======================
 Class data
 The Class data handles the legal document.
 node: Contains an object of class node.
 doc: contains the whole document.
 docarr: array of sequentially added documentparts
 creatorarr: array of the user that sequentially added documentparts
 =======================*/
class data
{
    constructor (node, str){
        this.node = node;
        this.doc = str;
        this.docarr = [str];
        this.creatorarr = ["God"];
    }

    //Generates the difference between a new string and the current document
    //Not used atm, because the model is not sophisticated enough
    getdiff(newStr) {
        let first_occurance = newStr.indexOf(this.doc);
        let new_string = "";
        if(first_occurance == -1) {
            return false;
        } else {
            let doc_length = this.doc.length;

            if(first_occurance == 0) {
                new_string = newStr.substring(doc_length);
            } else {
                new_string = newStr.substring(0, first_occurance);
                new_string += newStr.substring(first_occurance + doc_length);
            }
            return new_string;
        }
    }

    //Loads the content of the blockchain into the document
    loadBC(bc) {
        this.docarr = [];
        this.creatorarr = [];

        let content = "";
        let decoded = "";
        for(let i = 0;i < bc.length;i++) {
            decoded = this.decode(bc[i].data);
            content = content + decoded;
            this.docarr.push(decoded);
            this.creatorarr.push(bc[i].creatorID);
        }

        this.doc = content;
    }

    //Adds new content to the document
    newContent(text, authorID = false) {
        //let diff = this.getdiff(text);

        this.doc = this.doc + text;

        this.docarr.push(text);
        this.creatorarr.push(authorID);

        return this.encode(text);
    }

    //Encodes into base64
    encode(text) {
        return Buffer.from(text.toString()).toString('base64');
    }

    //decodes from base64
    decode(text) {
        return Buffer.from(text, 'base64').toString('ascii');
    }
}
module.exports = data;