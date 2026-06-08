// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract StreakPayment is Ownable {
    IERC20 public usdc;
    address public streakWallet;
    uint256 public feeRate = 250; // 2.5% (250 / 10000)

    event PaymentProcessed(
        address indexed merchant,
        address indexed buyer,
        uint256 totalAmount,
        uint256 merchantAmount,
        uint256 streakFee
    );

    constructor(address _usdc, address _streakWallet) Ownable(msg.sender) {
        usdc = IERC20(_usdc);
        streakWallet = _streakWallet;
    }

    function pay(address merchant, uint256 totalPrice) external {
        require(totalPrice > 0, "Amount must be positive");
        require(merchant != address(0), "Invalid merchant");

        uint256 fee = totalPrice * feeRate / 10000;
        uint256 merchantAmount = totalPrice - fee;

        require(
            usdc.transferFrom(msg.sender, merchant, merchantAmount),
            "Transfer to merchant failed"
        );
        require(
            usdc.transferFrom(msg.sender, streakWallet, fee),
            "Transfer fee failed"
        );

        emit PaymentProcessed(
            merchant,
            msg.sender,
            totalPrice,
            merchantAmount,
            fee
        );
    }

    function setFeeRate(uint256 _feeRate) external onlyOwner {
        require(_feeRate <= 500, "Max 5%");
        feeRate = _feeRate;
    }

    function setStreakWallet(address _wallet) external onlyOwner {
        require(_wallet != address(0), "Invalid address");
        streakWallet = _wallet;
    }
}