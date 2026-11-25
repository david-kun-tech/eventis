import { phoneValid } from './verification';

/**
 * Demo accounts, kept on this device only (there is no server).
 *
 * Passwords are never stored. Each account keeps a random salt and a salted SHA-256 hash
 * iterated ITERATIONS times. That is fine for an on-device demo; a production app would
 * hash on its server with a slow password hash such as Argon2 or bcrypt.
 */

export interface Account {
  id: string;
  name: string;
  email: string;
  phone: string;
  salt: string;
  hash: string;
  createdAt: string;
}

/** SHA-256 of a string, as hex. Injected so tests can use Node's crypto. */
export type Hasher = (data: string) => Promise<string>;

export const ITERATIONS = 1000;

export const normalizeEmail = (s: string) => s.trim().toLowerCase();

export const emailValid = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(normalizeEmail(s));

export function passwordRules(p: string) {
  return [
    { label: 'At least 8 characters', ok: p.length >= 8 },
    { label: 'A letter and a number', ok: /[a-z]/i.test(p) && /\d/.test(p) },
  ];
}

export interface SignUpInput {
  name: string;
  email: string;
  phone: string;
  password: string;
}

export type SignUpProblems = Partial<Record<keyof SignUpInput, string>>;

export function signUpProblems(input: SignUpInput, accounts: Account[]): SignUpProblems {
  const p: SignUpProblems = {};
  if (input.name.trim().split(/\s+/).filter(Boolean).length < 2) p.name = 'Enter your first and last name';
  if (!emailValid(input.email)) p.email = 'Enter a valid email, like amaka@example.com';
  else if (accounts.some((a) => a.email === normalizeEmail(input.email)))
    p.email = 'An account with this email already exists on this device. Log in instead.';
  if (input.phone.trim() && !phoneValid(input.phone)) p.phone = 'Use a Nigerian mobile number, like 0803 123 4567';
  if (!passwordRules(input.password).every((r) => r.ok)) p.password = 'Use at least 8 characters with a letter and a number';
  return p;
}

export async function hashPassword(password: string, salt: string, hash: Hasher, rounds = ITERATIONS) {
  let h = await hash(`${salt}:${password}`);
  for (let i = 1; i < rounds; i++) h = await hash(`${salt}:${h}`);
  return h;
}

export async function createAccount(
  input: SignUpInput,
  ids: { id: string; salt: string; now: string },
  hash: Hasher
): Promise<Account> {
  return {
    id: ids.id,
    name: input.name.trim().replace(/\s+/g, ' '),
    email: normalizeEmail(input.email),
    phone: input.phone.trim(),
    salt: ids.salt,
    hash: await hashPassword(input.password, ids.salt, hash),
    createdAt: ids.now,
  };
}

/**
 * The matching account, or null. Callers show one message for both "no such email" and
 * "wrong password", so the form never reveals which emails have accounts.
 */
export async function verifyLogin(email: string, password: string, accounts: Account[], hash: Hasher) {
  const acct = accounts.find((a) => a.email === normalizeEmail(email));
  if (!acct) return null;
  return (await hashPassword(password, acct.salt, hash)) === acct.hash ? acct : null;
}

export const firstName = (name: string) => name.trim().split(/\s+/)[0] ?? '';

export function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
}
