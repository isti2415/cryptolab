# Security policy

## What this project is

CryptoLab is a **teaching tool**. The implementations are written to be read and
to be correct, not to be used. They are not constant-time, not side-channel
hardened, and several are deliberately insecure constructions shown precisely
because they are insecure — textbook RSA, RC4, single-DES, ECB-mode block
operations, reduced-parameter lattice schemes.

**Do not use any code from this repository to protect anything.**

Vulnerability reports about the *cryptographic weakness of an algorithm the site
teaches* are therefore not security issues — they are the curriculum. If a page
fails to disclose such a weakness, that is a content bug, and a valuable one:
please open a normal issue.

## What is in scope

The site is static, has no backend, no accounts, no cookies and no user data. In
scope:

- a way to get script execution into a page (the CSP in `public/_headers` is
  meant to make this hard);
- an implementation that produces **incorrect output** while presenting itself
  as correct, since someone may learn the wrong thing from it;
- a supply-chain problem in the build.

## Reporting

Open a GitHub security advisory on the repository, or a normal issue if you are
confident it is low risk. There is no bounty.
