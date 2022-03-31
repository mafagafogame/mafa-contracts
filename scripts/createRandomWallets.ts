import { Wallet } from "ethers";
import * as rl from "readline-sync";
import { entropyToMnemonic, randomBytes } from "ethers/lib/utils";
const fs = require("fs");

async function main(): Promise<void> {
  const qnt = Number(rl.question("how many wallets do you want? "));

  let txt = "addr,priv,pub,phrase\n";
  for (let i = 0; i < qnt; i++) {
    const mnemonic = entropyToMnemonic(randomBytes(32));
    const wallet = Wallet.fromMnemonic(mnemonic);
    txt += `${wallet.address},${wallet.privateKey},${wallet.publicKey},${wallet.mnemonic.phrase}\n`;
    console.log((i * 100.0) / qnt + "%");
  }

  fs.writeFileSync("wallets.csv", txt);
  console.log("wallets saved in the file wallets.csv");
}

main();
