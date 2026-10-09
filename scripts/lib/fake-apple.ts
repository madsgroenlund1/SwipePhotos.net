// Builds a fake Apple-style certificate chain with openssl and signs JWS payloads with it.
// Shared by scripts/test-apple-iap.ts and scripts/test-iap-flow.mts. TEST ONLY.
import { execFileSync } from 'node:child_process'
import { createPrivateKey, sign as cryptoSign } from 'node:crypto'
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const dir = mkdtempSync(join(tmpdir(), 'iap-test-'))
const sh = (args: string[]) => execFileSync('openssl', args, { cwd: dir, stdio: 'pipe' })

export function makeChain(opts: { leafOid: boolean; intermediateOid: boolean } = { leafOid: true, intermediateOid: true }) {
  const t = Math.random().toString(36).slice(2, 7)
  writeFileSync(join(dir, `ext-${t}.cnf`), [
    '[ req ]', 'distinguished_name=dn', 'prompt=no', '[ dn ]', 'CN=placeholder',
    '[ v3_root ]', 'basicConstraints=critical,CA:true', 'keyUsage=critical,keyCertSign,cRLSign',
    '[ v3_int ]', 'basicConstraints=critical,CA:true', 'keyUsage=critical,keyCertSign,cRLSign',
    ...(opts.intermediateOid ? ['1.2.840.113635.100.6.2.1=ASN1:NULL'] : []),
    '[ v3_leaf ]', 'basicConstraints=critical,CA:false', 'keyUsage=critical,digitalSignature',
    ...(opts.leafOid ? ['1.2.840.113635.100.6.11.1=ASN1:NULL'] : []),
  ].join('\n'))
  const cnf = `ext-${t}.cnf`

  sh(['ecparam', '-name', 'secp384r1', '-genkey', '-noout', '-out', `${t}-root.key`])
  sh(['req', '-new', '-x509', '-key', `${t}-root.key`, '-sha384', '-days', '3000', '-subj', '/CN=Test Root', '-extensions', 'v3_root', '-config', cnf, '-out', `${t}-root.pem`])
  sh(['ecparam', '-name', 'secp384r1', '-genkey', '-noout', '-out', `${t}-int.key`])
  sh(['req', '-new', '-key', `${t}-int.key`, '-subj', '/CN=Test Intermediate', '-out', `${t}-int.csr`])
  sh(['x509', '-req', '-in', `${t}-int.csr`, '-CA', `${t}-root.pem`, '-CAkey', `${t}-root.key`, '-CAcreateserial', '-sha384', '-days', '2000', '-extfile', cnf, '-extensions', 'v3_int', '-out', `${t}-int.pem`])
  sh(['ecparam', '-name', 'prime256v1', '-genkey', '-noout', '-out', `${t}-leaf.key`])
  sh(['req', '-new', '-key', `${t}-leaf.key`, '-subj', '/CN=Test Leaf', '-out', `${t}-leaf.csr`])
  sh(['x509', '-req', '-in', `${t}-leaf.csr`, '-CA', `${t}-int.pem`, '-CAkey', `${t}-int.key`, '-CAcreateserial', '-sha256', '-days', '1000', '-extfile', cnf, '-extensions', 'v3_leaf', '-out', `${t}-leaf.pem`])

  const der = (f: string) => {
    const pem = readFileSync(join(dir, f), 'utf8')
    return pem.replace(/-----[A-Z ]+-----/g, '').replace(/\s/g, '')
  }
  return {
    rootPem: readFileSync(join(dir, `${t}-root.pem`), 'utf8'),
    x5c: [der(`${t}-leaf.pem`), der(`${t}-int.pem`), der(`${t}-root.pem`)],
    leafKey: createPrivateKey(readFileSync(join(dir, `${t}-leaf.key`))),
  }
}

export const b64u = (b: Buffer | string) =>
  Buffer.from(b).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

export function signJWS(chain: ReturnType<typeof makeChain>, payload: object, headerOverride: object = {}) {
  const h = b64u(JSON.stringify({ alg: 'ES256', x5c: chain.x5c, ...headerOverride }))
  const p = b64u(JSON.stringify({ signedDate: Date.now(), ...payload }))
  const sig = cryptoSign('sha256', Buffer.from(`${h}.${p}`), { key: chain.leafKey, dsaEncoding: 'ieee-p1363' })
  return `${h}.${p}.${b64u(sig)}`
}

