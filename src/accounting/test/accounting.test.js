'use strict';

const readline = require('node:readline');
const {
  StudentAccount,
  INITIAL_BALANCE_CENTS,
  MAX_BALANCE_CENTS,
  parseAmount,
  formatBalance,
  runMenu,
} = require('../index');

describe('COBOL student account test plan', () => {
  test('TC-001: application starts with the account menu available', () => {
    const account = new StudentAccount();
    expect(account).toBeInstanceOf(StudentAccount);
  });

  test('TC-002: initial balance is 1000.00', () => {
    expect(formatBalance(INITIAL_BALANCE_CENTS)).toBe('1000.00');
  });

  test('TC-003: viewing balance does not change the stored value', () => {
    const account = new StudentAccount();
    expect(formatBalance(account.getBalanceCents())).toBe('1000.00');
    expect(account.getBalanceCents()).toBe(100000);
  });

  test('TC-004: credit 250.00 increases the balance to 1250.00', () => {
    const account = new StudentAccount();
    expect(formatBalance(account.credit(parseAmount('250.00')))).toBe('1250.00');
  });

  test('TC-005: multiple credits accumulate correctly', () => {
    const account = new StudentAccount();
    account.credit(parseAmount('100.00'));
    expect(formatBalance(account.getBalanceCents())).toBe('1100.00');
    account.credit(parseAmount('50.25'));
    expect(formatBalance(account.getBalanceCents())).toBe('1150.25');
  });

  test('TC-006: credit with zero leaves the balance unchanged', () => {
    const account = new StudentAccount();
    account.credit(parseAmount('0.00'));
    expect(account.getBalanceCents()).toBe(100000);
  });

  test('TC-007: debit below the available balance succeeds', () => {
    const account = new StudentAccount();
    expect(formatBalance(account.debit(parseAmount('400.00')))).toBe('600.00');
  });

  test('TC-008: debit equal to the balance succeeds and reaches zero', () => {
    const account = new StudentAccount();
    expect(formatBalance(account.debit(parseAmount('1000.00')))).toBe('0.00');
  });

  test('TC-009: debit greater than the balance is rejected without changing it', () => {
    const account = new StudentAccount();
    expect(account.debit(parseAmount('1000.01'))).toBeNull();
    expect(account.getBalanceCents()).toBe(100000);
  });

  test('TC-010: failed insufficient-funds debit has no side effects', () => {
    const account = new StudentAccount();
    account.debit(parseAmount('1000.01'));
    expect(formatBalance(account.getBalanceCents())).toBe('1000.00');
    account.credit(parseAmount('50.00'));
    expect(formatBalance(account.getBalanceCents())).toBe('1050.00');
  });

  test('TC-011: multiple debits enforce the running stored balance', () => {
    const account = new StudentAccount();
    account.debit(parseAmount('600.00'));
    expect(formatBalance(account.getBalanceCents())).toBe('400.00');
    account.debit(parseAmount('400.00'));
    expect(formatBalance(account.getBalanceCents())).toBe('0.00');
  });

  test('TC-012: debit from zero balance is rejected', () => {
    const account = new StudentAccount();
    account.debit(parseAmount('1000.00'));
    expect(account.debit(parseAmount('0.01'))).toBeNull();
    expect(account.getBalanceCents()).toBe(0);
  });

  test('TC-013: credit followed by debit uses the updated balance', () => {
    const account = new StudentAccount();
    account.credit(parseAmount('200.00'));
    account.debit(parseAmount('150.00'));
    expect(formatBalance(account.getBalanceCents())).toBe('1050.00');
  });

  test('TC-014: invalid numeric menu choice is rejected and loop remains usable', async () => {
    const answers = ['5', '4'];
    readline.createInterface = jest.fn(() => ({
      question: jest.fn((prompt, callback) => callback(answers.shift())),
      close: jest.fn(),
    }));
    const log = jest.spyOn(console, 'log').mockImplementation(() => {});

    await runMenu();

    expect(log).toHaveBeenCalledWith('Invalid choice, please select 1-4.');
    expect(log).toHaveBeenCalledWith('Exiting the program. Goodbye!');
    log.mockRestore();
  });

  test('TC-015: unsupported menu input is handled as an invalid choice', async () => {
    const answers = ['ABC', '4'];
    readline.createInterface = jest.fn(() => ({
      question: jest.fn((prompt, callback) => callback(answers.shift())),
      close: jest.fn(),
    }));
    const log = jest.spyOn(console, 'log').mockImplementation(() => {});

    await runMenu();

    expect(log).toHaveBeenCalledWith('Invalid choice, please select 1-4.');
    log.mockRestore();
  });

  test('TC-016: exit option terminates the menu loop', async () => {
    const answers = ['4'];
    readline.createInterface = jest.fn(() => ({
      question: jest.fn((prompt, callback) => callback(answers.shift())),
      close: jest.fn(),
    }));
    const log = jest.spyOn(console, 'log').mockImplementation(() => {});

    await runMenu();

    expect(log).toHaveBeenCalledWith('Exiting the program. Goodbye!');
    log.mockRestore();
  });

  test('TC-017: a restarted process uses a fresh initial balance', () => {
    const firstRun = new StudentAccount();
    firstRun.credit(parseAmount('200.00'));
    expect(formatBalance(firstRun.getBalanceCents())).toBe('1200.00');

    const restartedRun = new StudentAccount();
    expect(formatBalance(restartedRun.getBalanceCents())).toBe('1000.00');
  });

  test('TC-018: credit decimal precision is preserved', () => {
    const account = new StudentAccount();
    account.credit(parseAmount('123.45'));
    expect(formatBalance(account.getBalanceCents())).toBe('1123.45');
  });

  test('TC-019: debit decimal precision is preserved', () => {
    const account = new StudentAccount(112345);
    account.debit(parseAmount('23.45'));
    expect(formatBalance(account.getBalanceCents())).toBe('1100.00');
  });

  test('TC-020: overflow and invalid amounts are rejected safely', () => {
    const account = new StudentAccount();
    expect(() => account.credit(MAX_BALANCE_CENTS)).toThrow(
      'Credit amount exceeds the maximum account balance.',
    );
    expect(parseAmount('-1')).toBeNull();
    expect(parseAmount('1.001')).toBeNull();
  });

  test('TC-021: data READ behavior returns the current balance', () => {
    const account = new StudentAccount();
    account.credit(parseAmount('25.75'));
    expect(account.getBalanceCents()).toBe(102575);
  });

  test('TC-022: data WRITE behavior updates the stored balance', () => {
    const account = new StudentAccount();
    account.credit(parseAmount('50.25'));
    expect(account.getBalanceCents()).toBe(105025);
  });
});
