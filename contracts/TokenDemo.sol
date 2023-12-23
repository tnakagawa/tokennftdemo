// SPDX-License-Identifier: MIT
pragma solidity <0.9.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract TokenDemo is ERC20, Ownable {
    constructor(
        string memory name,
        string memory symbol
    ) ERC20(name, symbol) Ownable(msg.sender) {}

    function mint(address account, uint256 value) public onlyOwner {
        _mint(account, value);
    }

    function burn(address account, uint256 value) public onlyOwner {
        _burn(account, value);
    }
}
