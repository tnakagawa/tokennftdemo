// SPDX-License-Identifier: MIT
pragma solidity <0.9.0;

import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MtDemo is ERC1155URIStorage, Ownable {
    uint256 private counter;

    constructor() ERC1155("") Ownable(msg.sender) {}

    function mint(
        address to,
        uint256 value,
        string memory tokenURI
    ) public onlyOwner {
        counter++;
        _mint(to, counter, value, "");
        _setURI(counter, tokenURI);
    }

    error ERC1155NonexistentToken(uint256 tokenId);

    function mint2(address to, uint256 id, uint256 value) public onlyOwner {
        string memory tokenURI = uri(id);
        if (bytes(tokenURI).length == 0) {
            revert ERC1155NonexistentToken(id);
        }
        _mint(to, id, value, "");
    }

    function maxTokenId() public view returns (uint256) {
        return counter;
    }
}
