<!--
  Title: kbucketh
  Description: KBucket implementation with Ethereum addresses as ids
  Author: Iulian Rotaru
  -->
# k-BuckΞth

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://www.npmjs.com/package/kbucketh)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Build Status](https://travis-ci.org/Horyus/kbucketh.svg?branch=develop)](https://travis-ci.org/Horyus/kbucketh)
[![Code Coverage](https://codecov.io/gh/Horyus/kbucketh/branch/develop/graph/badge.svg)](https://codecov.io/gh/Horyus/kbucketh)

[![](https://sourcerer.io/fame/mortimr/Horyus/kbucketh/images/0)](https://sourcerer.io/fame/mortimr/Horyus/kbucketh/links/0)
[![](https://sourcerer.io/fame/mortimr/Horyus/kbucketh/images/1)](https://sourcerer.io/fame/mortimr/Horyus/kbucketh/links/1)
[![](https://sourcerer.io/fame/mortimr/Horyus/kbucketh/images/2)](https://sourcerer.io/fame/mortimr/Horyus/kbucketh/links/2)
[![](https://sourcerer.io/fame/mortimr/Horyus/kbucketh/images/3)](https://sourcerer.io/fame/mortimr/Horyus/kbucketh/links/3)
[![](https://sourcerer.io/fame/mortimr/Horyus/kbucketh/images/4)](https://sourcerer.io/fame/mortimr/Horyus/kbucketh/links/4)
[![](https://sourcerer.io/fame/mortimr/Horyus/kbucketh/images/5)](https://sourcerer.io/fame/mortimr/Horyus/kbucketh/links/5)
[![](https://sourcerer.io/fame/mortimr/Horyus/kbucketh/images/6)](https://sourcerer.io/fame/mortimr/Horyus/kbucketh/links/6)
[![](https://sourcerer.io/fame/mortimr/Horyus/kbucketh/images/7)](https://sourcerer.io/fame/mortimr/Horyus/kbucketh/links/7)

---

The `k-BuckΞth` project is an implementation of a `k-bucket` with Ethereum Addresses interpreted as 20 bytes (160 bits) unsigned integers. Ethereum Addresses are derived from [ECC](https://en.wikipedia.org/wiki/Elliptic-curve_cryptography) Public Keys.`k-bucket` is the routing table for the [`Kademlia Distributed Hash Table`](https://en.wikipedia.org/wiki/Kademlia), a `Decentralized P2P Network` design.

This implementation works with self-shrinking and self-expanding double linked lists (why not ?), where each node is a Bucket. (Using an array would probably work faster).

The buckets will store informations about peers, identified by their Ethereum Public Addresses. A distance is computed by doing a `XOR` bitwise operation between two addresses. The buckets are conceived to hold peers with closer distances more efficiently than peers with higher distances. `Kademlia` uses this particularity to allow optimized peer searching; if you look for a peer you don't have, you're going to ask to the peer you have stored in your bucket with the smallest distance to the peer your are searching, as they have more chances to either know the peer, or know other peers that are even closer.

Part of the [`ThundΞr`](https://github.com/Horyus/thunder) project.
