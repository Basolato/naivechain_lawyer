//Main JS
'use strict';

//Include Various Libraries
let CryptoJS = require("crypto-js");
let express = require("express");
let bodyParser = require('body-parser');
let WebSocket = require("ws");
let fs = require('fs');
let mongoose = require('mongoose');
let morgan = require('morgan');
//let methodOverride = require('method-override');
//let NodeRSA = require('node-rsa');

//Include own classes
let Block = require('./classes/block.js');
let BC = require('./classes/blockchain.js');
let Integrity = require('./classes/integrity.js');
let crypto = require('./classes/crypto.js');
let ruleset = require('./classes/ruleset.js');
let node = require('./classes/node.js');
let data = require('./classes/data.js');

//Initial Variables loaded from the environment
let http_port = process.env.HTTP_PORT || 3001;
let p2p_port = process.env.P2P_PORT || 6001;
let initialPeers = process.env.PEERS ? process.env.PEERS.split(',') : [];
let name = process.env.NAME || "node";
let otherName = process.env.OTHERNAME || "node2";
let puzzleDifficulty = process.env.DIFFICULTY || "000";

//=======================
//Object Declaration
//=======================

//Initialize Blockchain with Genesis and Integrity Blocks
let chain = new BC(Block.getGenesisBlock(),Integrity.getGenesisIntegrity());

//Define Crypto
//We need to define the name, to load own keys and other keys
//TODO: Simplify adding of peers -> names should be the same as otherwise
let otherClients = [otherName];
let cry = new crypto(name, otherClients);

//Ruleset
//Defines the used crypto class, describes the puzzleDifficulty, signature checking & name checking
let rule = new ruleset(cry,puzzleDifficulty,true,false);

//Node consists out of a chain and a rule
let client = new node(chain, rule);

//The DataHandler Uses a Client and defines the start string
let datahandler = new data(client,"");

//We load the Blockchain, so data is correct initialized
datahandler.loadBC(chain.blockchain);

//Define Sockets
let sockets = [];

//Define Message Types
let MessageType = {
    QUERY_LATEST: 0,
    QUERY_ALL: 1,
    RESPONSE_BLOCKCHAIN: 2
};

//=======================
//Web-Server - API Calls
//=======================

let initHttpServer = () => {
    let app = express();
    app.use(bodyParser.json());

    app.use(express.static('public'));

    app.get('/blocks', (req, res) => res.send(JSON.stringify(chain.blockchain)));

    app.get('/integrity', (req, res) => res.send(JSON.stringify(chain.integritychain)));

    app.post('/mineBlock', (req, res) => {
        let newBlock = client.addOwnBlock(req.body.data);
        broadcast(responseLatestMsg());
        console.log('block added: ' + JSON.stringify(newBlock));
        res.send();
    });

    app.get('/peers', (req, res) => {
        res.send(sockets.map(s => s._socket.remoteAddress + ':' + s._socket.remotePort));

    });

    app.post('/addPeer', (req, res) => {
        connectToPeers([req.body.peer]);
        res.send();
    });

    app.post('/updateDocument', (req, res) => {
        client.addOwnBlock(datahandler.newContent(req.body.data));
        broadcast(responseLatestMsg());
        console.log('block added!');
        console.log(req.body.data);
        res.send();
    });

    app.get('/document', (req,res) => {
        datahandler.loadBC(chain.blockchain);
        let sending = [];
        sending.push(datahandler.doc);
        res.json(sending);
    });

    app.get('/documentVersions', (req,res) => {
        datahandler.loadBC(chain.blockchain);
        let sending = [];
        sending.push((datahandler.docarr));
        sending.push((datahandler.creatorarr));
        res.json(sending);
    });


    app.get('/info', (req,res) => {
        let sending = [];
        sending.push(JSON.parse(http_port));
        sending.push(JSON.parse(p2p_port));
        sending.push((name));
        sending.push((otherName));
        res.json(sending);
    });

    app.post('/change', (req, res) => {
        //TODO: IMPLEMENT
        //console.log(req.body);
        //for(let i = 0, len = req.body.length; i < len;i++){
        //    console.log(req.body[i]);
        //}
        //manipulateBlock(1, "Changed", "Data was manipulated", "Status too");

        client.manipulateBlock(req.body[0],req.body[1],req.body[2],req.body[3]);

        res.send(JSON.stringify(chain.blockchain));

    });

    app.listen(http_port, () => console.log('Listening http on port: ' + http_port));
};

//=======================
//P2P-Server
//=======================

let initP2PServer = () => {
    let server = new WebSocket.Server({port: p2p_port});
    server.on('connection', ws => initConnection(ws));
    console.log('listening websocket p2p port on: ' + p2p_port);

};

let initConnection = (ws) => {
    sockets.push(ws);
    initMessageHandler(ws);
    initErrorHandler(ws);
    write(ws, queryChainLengthMsg());
};

let initMessageHandler = (ws) => {
    ws.on('message', (data) => {
        let message = JSON.parse(data);
        console.log('Received message' + JSON.stringify(message));
        switch (message.type) {
            case MessageType.QUERY_LATEST:
                write(ws, responseLatestMsg());
                break;
            case MessageType.QUERY_ALL:
                write(ws, responseChainMsg());
                break;
            case MessageType.RESPONSE_BLOCKCHAIN:
                handleBlockchainResponse(message);
                break;
        }
    });
};

let initErrorHandler = (ws) => {
    let closeConnection = (ws) => {
        console.log('connection failed to peer: ' + ws.url);
        sockets.splice(sockets.indexOf(ws), 1);
    };
    ws.on('close', () => closeConnection(ws));
    ws.on('error', () => closeConnection(ws));
};

let connectToPeers = (newPeers) => {
    newPeers.forEach((peer) => {
        let ws = new WebSocket(peer);
        ws.on('open', () => initConnection(ws));
        ws.on('error', () => {
            console.log('connection failed')
        });
    });
};

let handleBlockchainResponse = (message) => {
    let receivedBlocks = JSON.parse(message.data).sort((b1, b2) => (b1.index > b2.index));
    let latestBlockReceived = receivedBlocks[receivedBlocks.length - 1];
    let latestBlockHeld = chain.getLastBlock();
    console.log(latestBlockReceived);
    if (latestBlockReceived.index > latestBlockHeld.index) {
        console.log('blockchain possibly behind. We got: ' + latestBlockHeld.index + ' Peer got: ' + latestBlockReceived.index);
        if (latestBlockHeld.hash === latestBlockReceived.previousHash) {
            console.log("We can append the received block to our chain");
            if(client.addOtherBlock(latestBlockReceived)){
                console.log("Block appended.");
                broadcast(responseLatestMsg());
            } else {console.log("Check failed.");}

        } else if (receivedBlocks.length === 1) {
            console.log("We have to query the chain from our peer");
            broadcast(queryAllMsg());
        } else {
            console.log("Received blockchain is longer than current blockchain");
            client.replaceChain(receivedBlocks);
            broadcast(responseLatestMsg());
        }
    } else {
        console.log('received blockchain is not longer than received blockchain. Do nothing');
    }
};

let queryChainLengthMsg = () => ({'type': MessageType.QUERY_LATEST});
let queryAllMsg = () => ({'type': MessageType.QUERY_ALL});
let responseChainMsg = () =>({
    'type': MessageType.RESPONSE_BLOCKCHAIN, 'data': JSON.stringify(chain.blockchain)
});
let responseLatestMsg = () => ({
    'type': MessageType.RESPONSE_BLOCKCHAIN,
    'data': JSON.stringify([chain.getLastBlock()])
});

let write = (ws, message) => ws.send(JSON.stringify(message));
let broadcast = (message) => sockets.forEach(socket => write(socket, message));

//=======================
//Start
//=======================

connectToPeers(initialPeers);
initHttpServer();
initP2PServer();