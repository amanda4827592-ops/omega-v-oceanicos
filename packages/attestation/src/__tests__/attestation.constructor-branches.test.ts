/**
 * Closes four partial branches in packages/attestation/src/index.ts that the
 * main attestation.test.ts suite exercises only on one side of:
 *
 *  - resolvePublicKey's `error instanceof Error ? error.message : String(error)`
 *    — under Jest this file had to mock `createPrivateKey` and throw a locally
 *    built Error, because Jest's vm context made Node's own crypto errors a
 *    different realm and `instanceof Error` was false. On `node:test` there is
 *    one realm, so a genuine parse failure drives the real branch with no mock
 *    at all. The suite now asserts the wrapped message carries Node's own
 *    message and not the `Error: ` prefix `String(error)` would have produced.
 *  - the constructor's old-API `keyVersion || '1'` fallback — every existing
 *    old-API test passes an explicit version.
 *  - the constructor's Ed25519 `signingKey ?? process.env[ED25519_KEY_ENV]`
 *    fallback — existing env-var-fallback coverage only exercises the HMAC
 *    branch (SIGNING_KEY_ENV).
 *  - the constructor's `algorithm === 'Ed25519' ? ED25519_KEY_ENV : ...`
 *    selection inside the missing-key error message — existing missing-key
 *    coverage only exercises the HMAC branch.
 */
import { createPrivateKey, generateKeyPairSync } from 'node:crypto';
import { afterEach, describe, expect, it } from '../../../../tests/support/jest-compat.mjs';
import {
  AttestationService,
  InvalidSigningKeyError,
  MissingSigningKeyError,
} from '../../dist/index.js';

describe('AttestationService — remaining constructor branches', () => {
  const originalHmac = process.env.OMEGA_SIGNING_KEY;
  const originalEd25519 = process.env.OMEGA_ED25519_KEY;

  afterEach(() => {
    if (originalHmac === undefined) {
      delete process.env.OMEGA_SIGNING_KEY;
    } else {
      process.env.OMEGA_SIGNING_KEY = originalHmac;
    }
    if (originalEd25519 === undefined) {
      delete process.env.OMEGA_ED25519_KEY;
    } else {
      process.env.OMEGA_ED25519_KEY = originalEd25519;
    }
  });

  it('defaults the old string-API keyVersion to "1" when none is passed', () => {
    const service = new AttestationService('key-only-no-version');

    expect(service.getKeyInfo().version).toBe('1');
  });

  it('falls back to OMEGA_ED25519_KEY when no signingKey is supplied for Ed25519', () => {
    const { privateKey, publicKey } = generateKeyPairSync('ed25519', {
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    });
    process.env.OMEGA_ED25519_KEY = privateKey;
    delete process.env.OMEGA_SIGNING_KEY;

    const service = new AttestationService({ algorithm: 'Ed25519' });

    expect(service.getKeyInfo().publicKey?.trim()).toBe(publicKey.trim());
  });

  it('names OMEGA_ED25519_KEY, not OMEGA_SIGNING_KEY, in the missing-key error for Ed25519', () => {
    delete process.env.OMEGA_SIGNING_KEY;
    delete process.env.OMEGA_ED25519_KEY;

    expect(() => new AttestationService({ algorithm: 'Ed25519' })).toThrow(MissingSigningKeyError);
    try {
      new AttestationService({ algorithm: 'Ed25519' });
      throw new Error('expected construction to throw');
    } catch (error) {
      expect(error).toBeInstanceOf(MissingSigningKeyError);
      expect((error as Error).message).toContain('OMEGA_ED25519_KEY');
      expect((error as Error).message).not.toContain('OMEGA_SIGNING_KEY');
    }
  });

  it('surfaces the real parse-failure message when the key cannot be parsed', () => {
    const malformed = 'irrelevant-because-it-cannot-be-parsed';

    // Node's own message for the same input, from the same realm.
    let nativeMessage = '';
    try {
      createPrivateKey(malformed);
    } catch (error) {
      nativeMessage = (error as Error).message;
    }
    expect(nativeMessage).not.toBe('');

    expect(
      () =>
        new AttestationService({
          algorithm: 'Ed25519',
          signingKey: malformed,
          keyVersion: '1',
        })
    ).toThrow(InvalidSigningKeyError);

    try {
      new AttestationService({
        algorithm: 'Ed25519',
        signingKey: malformed,
        keyVersion: '1',
      });
      throw new Error('expected construction to throw');
    } catch (error) {
      expect(error).toBeInstanceOf(InvalidSigningKeyError);
      expect((error as Error).message).toContain(nativeMessage);
      // `String(error)` would prefix the message with "Error: "; the branch
      // that takes `error.message` must not.
      expect((error as Error).message).not.toContain('could not be parsed: Error: ');
    }
  });
});
