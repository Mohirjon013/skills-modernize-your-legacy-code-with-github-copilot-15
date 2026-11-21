'use strict';

const readline = require('node:readline');

const INITIAL_BALANCE_CENTS = 100000;
const MAX_BALANCE_CENTS = 99999999;

class StudentAccount {
  constructor(initialBalanceCents = INITIAL_BALANCE_CENTS) {
    if (!Number.isSafeInteger(initialBalanceCents) ||
        initialBalanceCents < 0 ||
        initialBalanceCents > MAX_BALANCE_CENTS) {
      throw new RangeError('Initial balance is outside the supported account range.');
    }

    this.balanceCents = initialBalanceCents;
  }

  getBalanceCents() {
    return this.balanceCents;
  }

  credit(amountCents) {
    if (!this.isValidAmount(amountCents)) {
      throw new RangeError('Credit amount must be a valid non-negative account amount.');
    }

    if (amountCents > MAX_BALANCE_CENTS - this.balanceCents) {
      throw new RangeError('Credit amount exceeds the maximum account balance.');
    }

    this.balanceCents += amountCents;
    return this.balanceCents;
  }

  debit(amountCents) {
    if (!this.isValidAmount(amountCents)) {
      throw new RangeError('Debit amount must be a valid non-negative account amount.');
    }

    if (amountCents > this.balanceCents) {
      return null;
    }

    this.balanceCents -= amountCents;
    return this.balanceCents;
  }

  isValidAmount(amountCents) {
    return Number.isSafeInteger(amountCents) &&
      amountCents >= 0 &&
      amountCents <= MAX_BALANCE_CENTS;
  }
}

function parseAmount(input) {
  const value = String(input).trim();

  if (!/^\d+(?:\.\d{1,2})?$/.test(value)) {
    return null;
  }

  const [wholePart, decimalPart = ''] = value.split('.');
  const cents = (Number(wholePart) * 100) +
    Number(decimalPart.padEnd(2, '0'));

  if (!Number.isSafeInteger(cents) || cents > MAX_BALANCE_CENTS) {
    return null;
  }

  return cents;
}

function formatBalance(balanceCents) {
  const wholePart = Math.floor(balanceCents / 100);
  const decimalPart = String(balanceCents % 100).padStart(2, '0');
  return `${wholePart}.${decimalPart}`;
}

async function runMenu(account = new StudentAccount()) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const ask = (question) => new Promise((resolve) => rl.question(question, resolve));

  try {
    let continueFlag = true;

    while (continueFlag) {
      console.log('--------------------------------');
      console.log('Account Management System');
      console.log('1. View Balance');
      console.log('2. Credit Account');
      console.log('3. Debit Account');
      console.log('4. Exit');
      console.log('--------------------------------');

      const choice = (await ask('Enter your choice (1-4): ')).trim();

      switch (choice) {
        case '1':
          console.log(`Current balance: ${formatBalance(account.getBalanceCents())}`);
          break;

        case '2': {
          const input = await ask('Enter credit amount: ');
          const amountCents = parseAmount(input);

          if (amountCents === null) {
            console.log('Invalid amount. Enter a non-negative amount with no more than two decimal places.');
            break;
          }

          try {
            const newBalanceCents = account.credit(amountCents);
            console.log(`Amount credited. New balance: ${formatBalance(newBalanceCents)}`);
          } catch (error) {
            console.log(error.message);
          }
          break;
        }

        case '3': {
          const input = await ask('Enter debit amount: ');
          const amountCents = parseAmount(input);

          if (amountCents === null) {
            console.log('Invalid amount. Enter a non-negative amount with no more than two decimal places.');
            break;
          }

          const newBalanceCents = account.debit(amountCents);
          if (newBalanceCents === null) {
            console.log('Insufficient funds for this debit.');
          } else {
            console.log(`Amount debited. New balance: ${formatBalance(newBalanceCents)}`);
          }
          break;
        }

        case '4':
          continueFlag = false;
          break;

        default:
          console.log('Invalid choice, please select 1-4.');
          break;
      }
    }

    console.log('Exiting the program. Goodbye!');
  } finally {
    rl.close();
  }
}

if (require.main === module) {
  runMenu().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}

module.exports = {
  StudentAccount,
  INITIAL_BALANCE_CENTS,
  MAX_BALANCE_CENTS,
  parseAmount,
  formatBalance,
  runMenu,
};
