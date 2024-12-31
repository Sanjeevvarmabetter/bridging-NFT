// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

contract MNFT is ERC721URIStorage {
    uint public tokenCount; 
    uint public itemCount; 

    struct Item {
        uint itemId; 
        uint tokenId; 
        uint price; 
        address payable seller; 
        bool sold; 
    }

    event Offered(uint itemId, uint tokenId, uint price, address indexed seller);
    event Purchased(uint itemId, uint tokenId, uint price, address indexed buyer);
    event NFTListed(uint256 tokenId, uint256 price); 

    // New event for the bridge
    event Minted(address indexed owner, uint256 tokenId, string tokenURI);

    mapping(uint => Item) public items; 
    mapping(uint => uint) public listedItems; 

    address public bridge; // Address of the designated bridge

    constructor() ERC721("MyNft", "MNFT") {}

    function mint(string memory _tokenURI, uint _price) external returns(uint) {
        tokenCount++; 
        itemCount++; 
        _safeMint(msg.sender, tokenCount); 
        _setTokenURI(tokenCount, _tokenURI); 
        
        items[itemCount] = Item(
            itemCount,
            tokenCount,
            _price,
            payable(msg.sender),
            false
        );

        emit Offered(itemCount, tokenCount, _price, msg.sender);
        listNFT(tokenCount, _price); 

        return tokenCount; 
    }

    function listNFT(uint256 tokenId, uint256 price) public {
        require(ownerOf(tokenId) == msg.sender, "You do not own this NFT");
        require(price > 0, "Price must be greater than 0");

        listedItems[tokenId] = price; 
        emit NFTListed(tokenId, price); 
    }

    function purchaseItem(uint _itemId) external payable {
        uint _totalPrice = getTotalPrice(_itemId); 
        Item storage item = items[_itemId]; 
        require(_itemId > 0 && _itemId <= itemCount, "Item doesn't exist");
        require(msg.value >= _totalPrice, "Not enough ether to cover item price");
        require(msg.sender != item.seller, "Seller cannot buy");

        // Transfer funds to the seller
        item.seller.transfer(item.price);
        item.sold = true; // Mark the item as sold

        emit Purchased(_itemId, item.tokenId, item.price, msg.sender);
    }

    function getTotalPrice(uint _itemId) view public returns(uint) {
        return (items[_itemId].price * (100 + 3)) / 100; // 3% marketplace fee
    }

    // Mint NFT as part of the bridge process
    function mintBridgedNFT(
        address owner,
        uint256 tokenId,
        string memory tokenURI
    ) external {
        require(msg.sender == bridge, "Only bridge can mint");
        
        // Mint the bridged NFT
        _mint(owner, tokenId);
        _setTokenURI(tokenId, tokenURI);

        emit Minted(owner, tokenId, tokenURI);
    }

    // Set the bridge address
    function setBridge(address _bridge) external {
        require(bridge == address(0), "Bridge already set");
        bridge = _bridge;
    }
}

// sepolia bridge
// 0x064E7B51564504a95C262eD136547EF43e9973b4



/// polygon 
// bridged

// 0xA90CeD32E40A95725C943D5392F862aEBf3C7928