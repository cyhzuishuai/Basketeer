// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract BasketShares {
    address public owner;
    string public name; 
    string public symbol;
    uint8  public immutable decimals = 18;
    uint256 public totalSupply;
    
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;
    
    event Transfer(address indexed from, address indexed to, uint256 v);
    event Approval(address indexed o, address indexed s, uint256 v);
    
    modifier onlyOwner() { 
        require(msg.sender == owner, "not owner"); 
        _; 
    }

    constructor(string memory _n, string memory _s) { 
        name = _n; 
        symbol = _s;
        owner = msg.sender;
    }
    
    function _mint(address to, uint256 a) external onlyOwner { 
        totalSupply += a; 
        balanceOf[to] += a; 
        emit Transfer(address(0), to, a); 
    }
    
    function _burn(address from, uint256 a) external onlyOwner { 
        balanceOf[from] -= a; 
        totalSupply -= a; 
        emit Transfer(from, address(0), a); 
    }
    
    function approve(address s, uint256 a) external returns(bool) { 
        allowance[msg.sender][s] = a; 
        emit Approval(msg.sender, s, a); 
        return true; 
    }
    
    function transfer(address to, uint256 a) external returns(bool) { 
        balanceOf[msg.sender] -= a; 
        balanceOf[to] += a; 
        emit Transfer(msg.sender, to, a); 
        return true; 
    }
    
    function transferFrom(address f, address t, uint256 a) external returns(bool) {
        uint256 al = allowance[f][msg.sender]; 
        require(al >= a, "allow");
        if (al != type(uint256).max) allowance[f][msg.sender] = al - a;
        balanceOf[f] -= a; 
        balanceOf[t] += a; 
        emit Transfer(f, t, a); 
        return true;
    }
}
