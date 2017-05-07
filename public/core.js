

var naivechain = angular.module('naivechain', ['ngAnimate','ngQuill', 'ngCytoscape', 'ngSanitize']);

naivechain.controller('naivechainController', function naivechainController($scope,$http) {

    //**********************
    //Variable Declaration
    //**********************

    //Possible Inputs
	$scope.formData = {}; //Data from the "Add new Block"-form
	$scope.docData = {}; //Data from the "Add new Lines"-form

    //Document version
    $scope.version = [];

    //ViewHandling
	$scope.view = "Overview";

	//Keep a list of all peers
	$scope.peers = [];


    //**********************
    //Methods
    //**********************

    //****
    //View Methods
    //****

    //Change PageView
    $scope.ChangeView = function(page, title="") {
        $scope.view = page;
        //$scope.pageTitle = title;
    };

    //Change Document to Version x
    $scope.setDocumentToVersion = function(version) {
        let newDoc = "";
        for(let i = 0;i<=version;i++) {
            newDoc = newDoc + $scope.docArr[i];
        }
        $scope.doc = newDoc;
        $scope.setSelectedVersion(version);
    };

    //Set the marker for the version
    $scope.setSelectedVersion = function(version) {
        for(i = 0;i < $scope.docArr.length;i++) {
            $scope.version[i] = false;
            if(version == i) $scope.version[i] = true;
        }
    };

    //****
    //Get Methods
    //****
    //Get Blocks and their Integrity
	$scope.getBlocks = function() {
        $http.get('/blocks').then(
            function (response) {
                $scope.blocks = response.data;
                $scope.updateBlockView();
            }, function (response) {
                console.log('Error: ' + response.statusText);
            }
        );
        $http.get('/integrity').then(
            function (response) {
                $scope.integrity = response.data;
            }, function (response) {
                console.log('Error: ' + response.statusText);
            }
        );

	};

    //Get info about oneself
    $scope.getInfo = function () {
        $http.get('/info').then(
            function (response) {
                $scope.info = response.data;
            }, function (response) {
                console.log('Error: ' + response.statusText);
            }
        );
    };

    //Get Document Versions
    $scope.getDocVersions = function () {
        $http.get('/documentVersions').then(
            function (response) {
                $scope.docArr = response.data[0];
                $scope.creatorArr = response.data[1];
            }, function (response) {
                console.log('Error: ' + response.statusText);
            }
        );
    };

    //Get the current Document
    $scope.getDocument = function () {
        $http.get('/document').then(
            function (response) {
                $scope.doc = response.data;
            }, function (response) {
                console.log('Error: ' + response.statusText);
            }
        );

    };

    //Get all information new
    $scope.refreshEverything = function () {
        $scope.getBlocks();
        $scope.updatePeers();
        $scope.getInfo();
        $scope.getDocument();
        $scope.getDocVersions();
    };

    //Get a new list of the peers
    $scope.updatePeers = function () {
        $http.get('/peers').then(
            function (response) {
                $scope.peers = response.data;
            }, function (response) {
                console.log('Error: ' + response.statusText);
            }
        );
    };

    //****
    //Post Methods
    //****
    //Create a new Block
	$scope.mineBlock = function () {
        $http.post('/mineBlock',$scope.formData).then(
            function (response) {
                $scope.formData = {};
                $scope.getBlocks();
            }, function (response) {
                console.log('Error: ' + response.statusText);
            }
        );
	};

	//Update the document
    $scope.updateDocument = function () {
        $http.post('/updateDocument',$scope.document).then(
            function (response) {
                $scope.refreshEverything();
                $scope.document = {};
            }, function (response) {
                console.log('Error: ' + response.statusText);
            }
        );
    };

    $scope.change = function () {
        let postarray = [];
        postarray.push($scope.data.selectManipulationBlock,$scope.mTimestamp, $scope.mData, $scope.mStatus);
        $http.post('/change',postarray).then(
            function (response) {
                //$scope.getBlocks();
                //console.log(postarray);
                $scope.refreshEverything();
            }, function (response) {
                console.log('Error: ' + response.statusText);
            }
        );
    };

    //node change
    $scope.changeSelect = function () {
        //($scope.data.selectManipulationBlock) => ID from selected field
        console.log($scope.data.selectManipulationBlock);
        $scope.mTimestamp = $scope.blocks[$scope.data.selectManipulationBlock].timestamp;
        $scope.mData = $scope.blocks[$scope.data.selectManipulationBlock].data;
        $scope.mStatus = $scope.blocks[$scope.data.selectManipulationBlock].status;
    };

    //****
    //BC Methods
    //****
    //Updates The Blockview
    $scope.updateBlockView = function () {
        //Remove all Elements
        $scope.resetBC();
        //Create Genesis
        for (let i = 0; i < $scope.blocks.length; i++) {
            if (i == 0) {
                $scope.addGenesis();
            }
            else {
                $scope.addHead(0);
            }
        }
    };


    //**********************
    //Variable Declaration
    //**********************
    $scope.elements = [];
    $scope.randid = 0;
    $scope.randPref = "rand_";

    //BC sepcific parameters
    //ID for the Genesis Block
    $scope.bc_genesis = "";
    //Prefix for all blockIDs
    $scope.bc_prefix = "";
    $scope.bc_sepp = "_";
    $scope.bc_conn = "_";

    //All IDs of the blockchain that are final, meaning are _NOT_ the head
    $scope.bc_LBC = [];
    //All IDS of blocks which have the largest height
    $scope.bc_head = [];
    //All IDs of orphans
    $scope.bc_orphans = [];

    //Naming of the single blocks in the bc
    //
    //
    //To identify every single block, an unique identity has to be set
    //Theoretically, every node is able to create at every height one block. Creating two would not make sense.
    //Therefore:
    //name of a block from node 1 at height 3: __prefix__ + height + __sepp__ + nodeID
    //name of an edge: __prefix__ + height + __sepp__ + nodeID + __CON__ + second Block...
    //names can be set as one likes


    $scope.bc_peerColor = ["#2a3f54","#ededed","#1abb9c"];

    //**********************
    //Layout & Style
    //**********************
    //Sets the default style for nodes and edges
    $scope.setDefaultStyle =function()
    {
        $scope.styles =
            [
                {
                    selector: 'node',
                    style:
                        {
                            'shape': 'data(faveShape)',
                            'width': 'mapData(weight, 40, 80, 20, 60)',
                            'content': 'data(name)',
                            'text-valign': 'center',
                            'text-halign': 'center',
                            'text-outline-width': 2,
                            'text-outline-color': '#000',
                            'background-color': 'data(faveColor)',
                            'color': '#fff'
                        }
                },
                {
                    selector: 'edge',
                    style:
                        {
                            'width': 4,
                            'target-arrow-shape': 'triangle',
                            'line-color': '#9dbaea',
                            'target-arrow-color': '#9dbaea',
                            'curve-style': 'bezier'
                        }
                }
            ];
    };
    //Set the default layout, possible options
    // circle, cose, breadthfirst, grid, null, concentric, dagre, preset
    $scope.setDefaultLayout = function(name)
    {
        $scope.layout = {"name":name, "animate": true, "animationDuration": 500};
    };

    $scope.setBCLayout = function()
    {
        $scope.layout = {"name":'dagre', "rankDir": 'LR', "animate": true, "animationDuration": 500};
    };

    //**********************
    //Element Handling
    //Element shapes: ellipse, rectangle, triangle, diamond, hexagon, octagon, vee, roundrectangle, heptagon, star, rhomboid, polygon
    //**********************
    $scope.createNewNode = function (id,name,color)
    {
        if(color.length !== 7)
        {
            color = '#000000';
        }
        let newElem = {"group":'nodes',"data": {"id": id, "name": name, "weight": 65, "faveColor": color, "faveShape": 'roundrectangle'}};
        $scope.elements.push(newElem);
    };
    $scope.createNewEdge = function (id,source,target)
    {
        let newElem = { group:'edges',"data": { "id": id, "source":source, "target":target}};
        $scope.elements.push(newElem);
    };
    $scope.createRandomNode = function ()
    {
        let randColor = $scope.getRandomSpanTo(99999);
        randColor = '#'+randColor+'0';
        console.log(randColor);
        $scope.randid++;
        let name = $scope.randPref + $scope.randid;
        $scope.createNewNode(name,name,randColor);
        //return id;
    };
    $scope.removeAllElements = function(){
        $scope.elements = [];
    };

    //**********************
    //Helper Functions
    //**********************

    $scope.getRandomSpanTo = function(to){
        return Math.floor((Math.random()*to)+1);
    };

    $scope.createBC = function (number)
    {
        //Add GenesisBlock
        $scope.addGenesis();

        //How often is a orphan block created
        let percent1 = 5;
        let percent2 = 10;

        for(let i = 1;i < number; i++)
        {
            let node = $scope.getRandomSpanTo(3)-1;
            let node2 = $scope.getRandomSpanTo(3)-1;
            let node3 = $scope.getRandomSpanTo(3)-1;
            $scope.addHead(node, node2);


            if(percent1 >= $scope.getRandomSpanTo(percent2))
            {
                $scope.addLBC(node3);
            }
        }
    };



    //****************
    //Blockchain Functions
    //****************
    $scope.resetBC = function() {
        $scope.removeAllElements();
        $scope.elements = [];

        //BC sepcific parameters
        //ID for the Genesis Block
        $scope.bc_genesis = "";
        $scope.bc_LBC = [];
        $scope.bc_head = [];
        $scope.bc_orphans = [];
    };
    $scope.addGenesis = function(){
        $scope.setBCLayout();
        $scope.removeAllElements();

        let genesisID = $scope.bc_prefix + 0;

        $scope.createNewNode(genesisID, genesisID, "#000000");
        $scope.bc_genesis = genesisID;
        $scope.bc_LBC.push(genesisID);
    };

    $scope.addBlock = function(byPeer, onTopOf){
        //Define new Block
        let newBlock = $scope.bc_prefix + $scope.bc_LBC.length;

        //Create new Block and add Connection
        $scope.createNewNode(newBlock,newBlock, $scope.bc_peerColor[byPeer]);

        //Create the linkage
        let edgeName = onTopOf + $scope.bc_conn +newBlock;
        $scope.createNewEdge(edgeName, onTopOf, newBlock);

        return newBlock;
    };

    //Describes a function on which head a block is created. If there is only one head, then it is easy
    //Basically, does not create a fork or resolves one
    $scope.addHead = function(byPeer, head = false) {
        let headlength = $scope.bc_head.length;
        let newHead = [];
        if(headlength == 0) {
            //Cannot be executed, just build a block on LBC
            return $scope.addLBC(byPeer);
        } else if(headlength == 1) {
            //There is only one head to build onto.
            //That means, the current head gets removed and added to the Longest BlockChain
            let otherBlock = $scope.bc_head.pop();
            $scope.bc_LBC.push(otherBlock);
            let newBlock = $scope.addBlock(byPeer, otherBlock);
            $scope.bc_head.push(newBlock);
            return newBlock;
        } else {
            if(head == false) { return false; } //We do not know on which head to build, therefore exit
            //Now there are two or more heads.
            //We need to check if the block to build onto does even exist
            //Also, we add all remaining heads into the orphans section
            let isThere = false;
            let possibleBlock = $scope.bc_prefix + $scope.bc_LBC.length + $scope.bc_sepp + head;
            //First, check
            for(let i = 0;i < $scope.bc_head.length;i++) {
                if($scope.bc_head[i] == possibleBlock) {
                    isThere = true;
                }
            }
            //console.log(isThere);
            if(isThere){
                newHead = [possibleBlock];
                // IF we are positive, we can now process everything
                for(let j = 0;j < $scope.bc_head.length;j++) {
                    if($scope.bc_head[j] !== possibleBlock) {
                        $scope.bc_orphans.push($scope.bc_head[j]);
                    }
                }
                //We can override the current head and set a new one
                $scope.bc_head = newHead;
                //Then we can execute this function again and it will automatically add on the right block. Cool ;)
                return $scope.addHead(byPeer);
            } else { return false; }
        }
    };

    //function that adds a new block to the current longest block chain. The header does not count to the blockchain, therefore a fork is created
    $scope.addLBC = function(byPeer)
    {
        let height = $scope.bc_LBC.length;
        let otherBlock = $scope.bc_LBC[height - 1];
        let newBlock = $scope.addBlock(byPeer,otherBlock);
        $scope.bc_head.push(newBlock);
        return newBlock;
    };

    /*$scope.addOrphan = function(byPeer) {
     let lastBlock = $scope.bc_length-1;
     lastBlock = $scope.bc_prefix + lastBlock;

     let newBlock = $scope.bc_prefix + $scope.bc_length + "_orphan";

     $scope.createNewNode(newBlock, newBlock, $scope.bc_peerColor[byPeer]);
     let edgeName = lastBlock+' '+newBlock+'orphan';
     $scope.createNewEdge(edgeName, lastBlock, newBlock);
     };*/



    $scope.setDefaultLayout("circle");
    $scope.setDefaultStyle();
    $scope.refreshEverything();
});


naivechain.controller('appCtrl', function appCtrl($scope,$http) {
    //**********************
    //Variable Declaration
    //**********************
    $scope.elements = [];
    $scope.randid = 0;
    $scope.randPref = "rand_";

    //BC sepcific parameters
    //ID for the Genesis Block
    $scope.bc_genesis = "";
    //Prefix for all blockIDs
    $scope.bc_prefix = "";
    $scope.bc_sepp = "_";
    $scope.bc_conn = "_";

    //All IDs of the blockchain that are final, meaning are _NOT_ the head
    $scope.bc_LBC = [];
    //All IDS of blocks which have the largest height
    $scope.bc_head = [];
    //All IDs of orphans
    $scope.bc_orphans = [];

    //Naming of the single blocks in the bc
    //
    //
    //To identify every single block, an unique identity has to be set
    //Theoretically, every node is able to create at every height one block. Creating two would not make sense.
    //Therefore:
    //name of a block from node 1 at height 3: __prefix__ + height + __sepp__ + nodeID
    //name of an edge: __prefix__ + height + __sepp__ + nodeID + __CON__ + second Block...
    //names can be set as one likes


    $scope.bc_peerColor = ["#2a3f54","#c5c7cb","#1abb9c"];

    //**********************
    //Layout & Style
    //**********************
    //Sets the default style for nodes and edges
    $scope.setDefaultStyle =function()
    {
        $scope.styles =
            [
                {
                    selector: 'node',
                    style:
                        {
                            'shape': 'data(faveShape)',
                            'width': 'mapData(weight, 40, 80, 20, 60)',
                            'content': 'data(name)',
                            'text-valign': 'center',
                            'text-halign': 'center',
                            'text-outline-width': 2,
                            'text-outline-color': '#000',
                            'background-color': 'data(faveColor)',
                            'color': '#fff'
                        }
                },
                {
                    selector: 'edge',
                    style:
                        {
                            'width': 4,
                            'target-arrow-shape': 'triangle',
                            'line-color': '#9dbaea',
                            'target-arrow-color': '#9dbaea',
                            'curve-style': 'bezier'
                        }
                }
            ];
    };
    //Set the default layout, possible options
    // circle, cose, breadthfirst, grid, null, concentric, dagre, preset
    $scope.setDefaultLayout = function(name)
    {
        $scope.layout = {"name":name, "animate": true, "animationDuration": 500};
    };

    $scope.setBCLayout = function()
    {
        $scope.layout = {"name":'dagre', "rankDir": 'LR', "animate": true, "animationDuration": 500};
    };

    //**********************
    //Element Handling
    //**********************
    $scope.createNewNode = function (id,name,color)
    {
        if(color.length !== 7)
        {
            color = '#000000';
        }
        let newElem = {"group":'nodes',"data": {"id": id, "name": name, "weight": 65, "faveColor": color, "faveShape": 'roundrectangle'}};
        $scope.elements.push(newElem);
    };
    $scope.createNewEdge = function (id,source,target)
    {
        let newElem = { group:'edges',"data": { "id": id, "source":source, "target":target}};
        $scope.elements.push(newElem);
    };
    $scope.createRandomNode = function ()
    {
        let randColor = $scope.getRandomSpanTo(99999);
        randColor = '#'+randColor+'0';
        console.log(randColor);
        $scope.randid++;
        let name = $scope.randPref + $scope.randid;
        $scope.createNewNode(name,name,randColor);
        //return id;
    };
    $scope.removeAllElements = function(){
        $scope.elements = [];
    };

    //**********************
    //Helper Functions
    //**********************

    $scope.getRandomSpanTo = function(to){
        return Math.floor((Math.random()*to)+1);
    };

    $scope.createBC = function (number)
    {
        //Add GenesisBlock
        $scope.addGenesis();

        //How often is a orphan block created
        let percent1 = 5;
        let percent2 = 10;

        for(let i = 1;i < number; i++)
        {
            let node = $scope.getRandomSpanTo(3)-1;
            let node2 = $scope.getRandomSpanTo(3)-1;
            let node3 = $scope.getRandomSpanTo(3)-1;
            $scope.addHead(node, node2);


            if(percent1 >= $scope.getRandomSpanTo(percent2))
            {
                $scope.addLBC(node3);
            }
        }
    };



    //****************
    //Blockchain Functions
    //****************
    $scope.addGenesis = function(){
        $scope.setBCLayout();
        $scope.removeAllElements();

        let genesisID = $scope.bc_prefix + 0;

        $scope.createNewNode(genesisID, genesisID, "#000000");
        $scope.bc_genesis = genesisID;
        $scope.bc_LBC.push(genesisID);
    };

    $scope.addBlock = function(byPeer, onTopOf){
        //Define new Block
        let newBlock = $scope.bc_prefix + $scope.bc_LBC.length + $scope.bc_sepp + byPeer;

        //Create new Block and add Connection
        $scope.createNewNode(newBlock,newBlock, $scope.bc_peerColor[byPeer]);

        //Create the linkage
        let edgeName = onTopOf + $scope.bc_conn +newBlock;
        $scope.createNewEdge(edgeName, onTopOf, newBlock);

        return newBlock;
    };

    //Describes a function on which head a block is created. If there is only one head, then it is easy
    //Basically, does not create a fork or resolves one
    $scope.addHead = function(byPeer, head = false) {
        let headlength = $scope.bc_head.length;
        let newHead = [];
        if(headlength == 0) {
            //Cannot be executed, just build a block on LBC
            return $scope.addLBC(byPeer);
        } else if(headlength == 1) {
            //There is only one head to build onto.
            //That means, the current head gets removed and added to the Longest BlockChain
            let otherBlock = $scope.bc_head.pop();
            $scope.bc_LBC.push(otherBlock);
            let newBlock = $scope.addBlock(byPeer, otherBlock);
            $scope.bc_head.push(newBlock);
            return newBlock;
        } else {
            if(head == false) { return false; } //We do not know on which head to build, therefore exit
            //Now there are two or more heads.
            //We need to check if the block to build onto does even exist
            //Also, we add all remaining heads into the orphans section
            let isThere = false;
            let possibleBlock = $scope.bc_prefix + $scope.bc_LBC.length + $scope.bc_sepp + head;
            //First, check
            for(let i = 0;i < $scope.bc_head.length;i++) {
                if($scope.bc_head[i] == possibleBlock) {
                    isThere = true;
                }
            }
            //console.log(isThere);
            if(isThere){
                newHead = [possibleBlock];
                // IF we are positive, we can now process everything
                for(let j = 0;j < $scope.bc_head.length;j++) {
                    if($scope.bc_head[j] !== possibleBlock) {
                        $scope.bc_orphans.push($scope.bc_head[j]);
                    }
                }
                //We can override the current head and set a new one
                $scope.bc_head = newHead;
                //Then we can execute this function again and it will automatically add on the right block. Cool ;)
                return $scope.addHead(byPeer);
            } else { return false; }
        }
    };

    //function that adds a new block to the current longest block chain. The header does not count to the blockchain, therefore a fork is created
    $scope.addLBC = function(byPeer)
    {
        let height = $scope.bc_LBC.length;
        let otherBlock = $scope.bc_LBC[height - 1];
        let newBlock = $scope.addBlock(byPeer,otherBlock);
        $scope.bc_head.push(newBlock);
        return newBlock;
    };

    /*$scope.addOrphan = function(byPeer) {
     let lastBlock = $scope.bc_length-1;
     lastBlock = $scope.bc_prefix + lastBlock;

     let newBlock = $scope.bc_prefix + $scope.bc_length + "_orphan";

     $scope.createNewNode(newBlock, newBlock, $scope.bc_peerColor[byPeer]);
     let edgeName = lastBlock+' '+newBlock+'orphan';
     $scope.createNewEdge(edgeName, lastBlock, newBlock);
     };*/



    $scope.setDefaultLayout("circle");
    $scope.setDefaultStyle();
    $scope.addGenesis();







});

naivechain.controller('attack', function attack($scope,$http, $timeout) {
    //**********************
    //Variable Declaration
    //**********************
    $scope.elements = [];
    $scope.randid = 0;
    $scope.randPref = "rand_";

    //BC sepcific parameters
    //ID for the Genesis Block
    $scope.bc_genesis = "";
    //Prefix for all blockIDs
    $scope.bc_prefix = "";
    $scope.bc_sepp = "_";
    $scope.bc_conn = "_";

    //All IDs of the blockchain that are final, meaning are _NOT_ the head
    $scope.bc_LBC = [];
    //All IDS of blocks which have the largest height
    $scope.bc_head = [];
    //All IDs of orphans
    $scope.bc_orphans = [];

    //Naming of the single blocks in the bc
    //
    //
    //To identify every single block, an unique identity has to be set
    //Theoretically, every node is able to create at every height one block. Creating two would not make sense.
    //Therefore:
    //name of a block from node 1 at height 3: __prefix__ + height + __sepp__ + nodeID
    //name of an edge: __prefix__ + height + __sepp__ + nodeID + __CON__ + second Block...
    //names can be set as one likes


    $scope.bc_peerColor = ["#2a3f54","#ff0000","#1abb9c"];

    //**********************
    //Layout & Style
    //**********************
    //Sets the default style for nodes and edges
    $scope.setDefaultStyle =function()
    {
        $scope.styles =
            [
                {
                    selector: 'node',
                    style:
                        {
                            'shape': 'data(faveShape)',
                            'width': 'mapData(weight, 40, 80, 20, 60)',
                            'content': 'data(name)',
                            'text-valign': 'center',
                            'text-halign': 'center',
                            'text-outline-width': 2,
                            'text-outline-color': '#000',
                            'background-color': 'data(faveColor)',
                            'color': '#fff'
                        }
                },
                {
                    selector: 'edge',
                    style:
                        {
                            'width': 4,
                            'target-arrow-shape': 'triangle',
                            'line-color': '#9dbaea',
                            'target-arrow-color': '#9dbaea',
                            'curve-style': 'bezier'
                        }
                }
            ];
    };
    //Set the default layout, possible options
    // circle, cose, breadthfirst, grid, null, concentric, dagre, preset
    $scope.setDefaultLayout = function(name)
    {
        $scope.layout = {"name":name, "animate": true, "animationDuration": 500};
    };

    $scope.setBCLayout = function()
    {
        $scope.layout = {"name":'dagre', "rankDir": 'LR', "animate": true, "animationDuration": 500};
    };

    //**********************
    //Element Handling
    //**********************
    $scope.createNewNode = function (id,name,color)
    {
        if(color.length !== 7)
        {
            color = '#000000';
        }
        let newElem = {"group":'nodes',"data": {"id": id, "name": name, "weight": 65, "faveColor": color, "faveShape": 'roundrectangle'}};
        $scope.elements.push(newElem);
    };
    $scope.createNewEdge = function (id,source,target)
    {
        let newElem = { group:'edges',"data": { "id": id, "source":source, "target":target}};
        $scope.elements.push(newElem);
    };
    $scope.createRandomNode = function ()
    {
        let randColor = $scope.getRandomSpanTo(99999);
        randColor = '#'+randColor+'0';
        console.log(randColor);
        $scope.randid++;
        let name = $scope.randPref + $scope.randid;
        $scope.createNewNode(name,name,randColor);
        //return id;
    };
    $scope.removeAllElements = function(){
        $scope.elements = [];
    };

    //**********************
    //Helper Functions
    //**********************

    $scope.getRandomSpanTo = function(to){
        return Math.floor((Math.random()*to)+1);
    };

    $scope.createBC = function (number)
    {
        //Add GenesisBlock
        $scope.addGenesis();

        //How often is a orphan block created
        let percent1 = 5;
        let percent2 = 10;

        for(let i = 1;i < number; i++)
        {
            let node = $scope.getRandomSpanTo(3)-1;
            let node2 = $scope.getRandomSpanTo(3)-1;
            let node3 = $scope.getRandomSpanTo(3)-1;
            $scope.addHead(node, node2);


            if(percent1 >= $scope.getRandomSpanTo(percent2))
            {
                $scope.addLBC(node3);
            }
        }
    };



    //****************
    //Blockchain Functions
    //****************
    $scope.addGenesis = function(){
        $scope.setBCLayout();
        $scope.removeAllElements();

        let genesisID = $scope.bc_prefix + 0;

        $scope.createNewNode(genesisID, genesisID, "#000000");
        $scope.bc_genesis = genesisID;
        $scope.bc_LBC.push(genesisID);
    };

    $scope.addBlock = function(byPeer, onTopOf){
        //Define new Block
        let newBlock = $scope.bc_prefix + $scope.bc_LBC.length + $scope.bc_sepp + byPeer;

        //Create new Block and add Connection
        $scope.createNewNode(newBlock,newBlock, $scope.bc_peerColor[byPeer]);

        //Create the linkage
        let edgeName = onTopOf + $scope.bc_conn +newBlock;
        $scope.createNewEdge(edgeName, onTopOf, newBlock);

        return newBlock;
    };

    //Describes a function on which head a block is created. If there is only one head, then it is easy
    //Basically, does not create a fork or resolves one
    $scope.addHead = function(byPeer, head = false) {
        let headlength = $scope.bc_head.length;
        let newHead = [];
        if(headlength == 0) {
            //Cannot be executed, just build a block on LBC
            return $scope.addLBC(byPeer);
        } else if(headlength == 1) {
            //There is only one head to build onto.
            //That means, the current head gets removed and added to the Longest BlockChain
            let otherBlock = $scope.bc_head.pop();
            $scope.bc_LBC.push(otherBlock);
            let newBlock = $scope.addBlock(byPeer, otherBlock);
            $scope.bc_head.push(newBlock);
            return newBlock;
        } else {
            if(head == false) { return false; } //We do not know on which head to build, therefore exit
            //Now there are two or more heads.
            //We need to check if the block to build onto does even exist
            //Also, we add all remaining heads into the orphans section
            let isThere = false;
            let possibleBlock = $scope.bc_prefix + $scope.bc_LBC.length + $scope.bc_sepp + head;
            //First, check
            for(let i = 0;i < $scope.bc_head.length;i++) {
                if($scope.bc_head[i] == possibleBlock) {
                    isThere = true;
                }
            }
            //console.log(isThere);
            if(isThere){
                newHead = [possibleBlock];
                // IF we are positive, we can now process everything
                for(let j = 0;j < $scope.bc_head.length;j++) {
                    if($scope.bc_head[j] !== possibleBlock) {
                        $scope.bc_orphans.push($scope.bc_head[j]);
                    }
                }
                //We can override the current head and set a new one
                $scope.bc_head = newHead;
                //Then we can execute this function again and it will automatically add on the right block. Cool ;)
                return $scope.addHead(byPeer);
            } else { return false; }
        }
    };

    $scope.attackExample = function () {
        $scope.addHead(0);

        $scope.addLBC(1);
        //$scope.addLBC(1);
         $scope.addHead(1,1);
         //    $timeout( function(){ $scope.callAtTimeout(); }, 3000);
        // would be possible
    };

    //function that adds a new block to the current longest block chain. The header does not count to the blockchain, therefore a fork is created
    $scope.addLBC = function(byPeer)
    {
        let height = $scope.bc_LBC.length;
        let otherBlock = $scope.bc_LBC[height - 1];
        let newBlock = $scope.addBlock(byPeer,otherBlock);
        $scope.bc_head.push(newBlock);
        return newBlock;
    };

    /*$scope.addOrphan = function(byPeer) {
     let lastBlock = $scope.bc_length-1;
     lastBlock = $scope.bc_prefix + lastBlock;

     let newBlock = $scope.bc_prefix + $scope.bc_length + "_orphan";

     $scope.createNewNode(newBlock, newBlock, $scope.bc_peerColor[byPeer]);
     let edgeName = lastBlock+' '+newBlock+'orphan';
     $scope.createNewEdge(edgeName, lastBlock, newBlock);
     };*/



    $scope.setDefaultLayout("circle");
    $scope.setDefaultStyle();
    $scope.addGenesis();







});