import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const USDC_POLYGON = "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359";
const STREAK_WALLET = "0x70793372685B1dA68a32c92f3FA16308E38B591B";

const StreakPaymentModule = buildModule("StreakPaymentModule", (m) => {
  const streakPayment = m.contract("StreakPayment", [
    USDC_POLYGON,
    STREAK_WALLET,
  ]);

  return { streakPayment };
});

export default StreakPaymentModule;