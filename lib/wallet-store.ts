/**
 * wallet-store.ts
 *
 * Real BIP-39 mnemonic generation and AES-GCM encrypted keystore.
 * Uses the browser's native Web Crypto API — no extra dependencies.
 * viem is used for mnemonic generation and address derivation.
 *
 * Storage layout (localStorage):
 *   nautica_keystore  → { salt, iv, ciphertext }  (base64 strings)
 *   nautica_address   → "0x..."                   (plaintext, safe to store)
 *
 * The mnemonic is NEVER persisted in plaintext. It lives only in memory
 * (React state / navigation state) during the onboarding flow.
 */

import { english, generateMnemonic, mnemonicToAccount, privateKeyToAccount } from "viem/accounts";

// ── Key generation ────────────────────────────────────────────────────────

/** Generate a fresh BIP-39 12-word mnemonic. */
export function createMnemonic(): string {
  return generateMnemonic(english);
}

/** Derive the first Ethereum address from a mnemonic or raw private key. */
export function deriveAddress(secret: string): string {
  // Detect private key: 64 hex chars (with or without 0x prefix)
  const clean = secret.trim();
  const isPrivateKey = /^(0x)?[0-9a-fA-F]{64}$/.test(clean);
  if (isPrivateKey) {
    const key = (clean.startsWith("0x") ? clean : `0x${clean}`) as `0x${string}`;
    return privateKeyToAccount(key).address;
  }
  return mnemonicToAccount(clean).address;
}

// ── Encryption helpers (AES-256-GCM) ─────────────────────────────────────

function buf2b64(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}

function b642buf(b64: string): Uint8Array {
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const baseKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    "PBKDF2",
    false,
    ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: 250_000, hash: "SHA-256" },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

// ── Public API ────────────────────────────────────────────────────────────

export interface Keystore {
  salt: string;      // base64
  iv: string;        // base64
  cipher: string;    // base64 — AES-GCM ciphertext of the mnemonic UTF-8 bytes
  address: string;   // derived address (not secret)
}

/** Encrypt mnemonic with password and persist to localStorage. */
export async function saveKeystore(mnemonic: string, password: string): Promise<void> {
  const enc  = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv   = crypto.getRandomValues(new Uint8Array(12));
  const key  = await deriveKey(password, salt);

  const cipherBuf = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    enc.encode(mnemonic)
  );

  const address = deriveAddress(mnemonic);

  const ks: Keystore = {
    salt:    buf2b64(salt),
    iv:      buf2b64(iv),
    cipher:  buf2b64(cipherBuf),
    address,
  };

  localStorage.setItem("nautica_keystore", JSON.stringify(ks));
  localStorage.setItem("nautica_address",  address);
}

/** Decrypt and return the mnemonic. Returns null on wrong password. */
export async function loadMnemonic(password: string): Promise<string | null> {
  const raw = localStorage.getItem("nautica_keystore");
  if (!raw) return null;

  try {
    const ks  = JSON.parse(raw) as Keystore;
    const salt = b642buf(ks.salt);
    const iv   = b642buf(ks.iv);
    const key  = await deriveKey(password, salt);

    const plainBuf = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      b642buf(ks.cipher)
    );

    return new TextDecoder().decode(plainBuf);
  } catch {
    return null; // wrong password or corrupted
  }
}

/** Check whether an encrypted wallet exists in localStorage. */
export function hasWallet(): boolean {
  return !!localStorage.getItem("nautica_keystore");
}

/** Return the stored address without decrypting (safe). */
export function getStoredAddress(): string | null {
  return localStorage.getItem("nautica_address");
}

/** Wipe all wallet data (logout / reset). */
export function clearWallet(): void {
  localStorage.removeItem("nautica_keystore");
  localStorage.removeItem("nautica_address");
  // Also clear ZK identity so logout is complete
  localStorage.removeItem("nautica_zk_identity");
  localStorage.removeItem("nautica_zk_commitment");
  localStorage.removeItem("nautica_zk_history");
}
