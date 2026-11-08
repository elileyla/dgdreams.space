// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title ChainBadge
 * @notice Soulbound badge — one free mint per wallet per day, priced extra
 *         mints. Every DGDreams network gets its own deployment with its own
 *         name and symbol, so a wallet's badge shelf mirrors the chains it has
 *         actually touched, and how many times.
 *
 *         The pricing rule, per chain, per UTC day (`block.timestamp / 1 days`
 *         — the same boundary the daily missions use):
 *
 *           1st mint of the day        free        (gas only)
 *           2nd mint of the day        `baseFee`   (the owner-set "1 cent" rate)
 *           3rd mint of the day        `baseFee × 2`
 *           4th mint of the day        `baseFee × 4`   ... and so on, doubling
 *           n-th mint of the day       `baseFee × 2^(n-2)`
 *
 *         The tally resets at 00:00 UTC, so every wallet's first badge of the
 *         new day is free again. `baseFee` is set per chain by the owner with
 *         `setBaseFee` (0 = everything free until a rate lands). Fees collect
 *         in the contract and are withdrawable by the owner; overpayments are
 *         refunded, only the quoted price is kept.
 *
 *         There is still no minting gate and no cap: any wallet may mint as
 *         many as it is willing to pay for (see `mintBatch` to do several at
 *         once). Metadata is served off-chain by the app's /api/badge route,
 *         which points the image at the network's logo — mirrors the
 *         DGLiteNft pattern ("metadata is served off-chain") and keeps
 *         on-chain bytes (and deploy gas) minimal.
 */
contract ChainBadge is ERC721, Ownable {
    using Strings for uint256;

    string public constant VERSION = "3.0.0";

    /// Upper bound on a single `mintBatch` call, so one transaction can never
    /// run out of gas mid-loop on a cheap chain and burn the whole fee.
    uint256 public constant MAX_BATCH = 25;

    /// Guard for the doubling exponent: `baseFee` is capped below 2^96
    /// (≈ 79 M tokens at 18 decimals — no realistic rate needs more), so
    /// shifting anything up to 2^159 can never overflow uint256.
    uint256 public constant MAX_BASE_FEE = 1 << 96;
    uint256 public constant MAX_SHIFT   = 159;

    /// Prefix of the off-chain metadata URL, without a trailing slash.
    /// (Solidity immutables cannot be reference types like string, so this is
    /// plain storage — written once at deploy, never at mint time.)
    string public baseURI;

    /// wei charged for the day's second mint — the owner-set "1 cent" rate.
    /// 0 means every mint is free (the pre-rate state after deployment).
    uint256 public baseFee;

    /// Total wei of quoted fees kept by this contract (withdrawable by owner).
    uint256 public feesCollected;

    /// user => UTC day index their current tally belongs to.
    mapping(address => uint256) private _dayStamp;

    /// user => mints inside that day stamp (stale on a past stamp — readers
    /// must ignore it unless `_dayStamp` is today; see `mintsToday`).
    mapping(address => uint256) private _dayCount;

    /// user => number of badges minted on this chain (lifetime).
    mapping(address => uint256) public mintCount;

    /// user => most recent tokenId (0 = none yet), so a single cheap read
    /// answers "has this wallet been here?" without scanning events.
    mapping(address => uint256) public userTokenId;

    uint256 public totalMinted;

    event BadgeMinted(address indexed to, uint256 indexed tokenId, uint256 paid);

    error SoulboundToken();
    error NoBadge();
    error BadCount();
    error Underpaid(uint256 required, uint256 sent);
    error BadFee();
    error FeeOverflow();
    error NothingToWithdraw();

    constructor(
        string memory name_,
        string memory symbol_,
        string memory baseURI_,
        address initialOwner
    ) ERC721(name_, symbol_) Ownable(initialOwner) {
        baseURI = baseURI_;
    }

    // ── fees ───────────────────────────────────────────────────────────
    /// Set the "1 cent" rate for this chain in wei of the native token.
    function setBaseFee(uint256 weiPerFirstPaidMint) external onlyOwner {
        if (weiPerFirstPaidMint > MAX_BASE_FEE) revert BadFee();
        baseFee = weiPerFirstPaidMint;
    }

    /// Withdraw collected fees. Only what fees actually collected — extras
    /// (overpayment refunds are sent straight back) never sit here beyond
    /// `feesCollected`.
    function withdraw(address payable to) external onlyOwner returns (uint256) {
        uint256 amount = feesCollected;
        uint256 balance = address(this).balance;
        if (amount == 0) revert NothingToWithdraw();
        if (amount > balance) amount = balance; // defensive: never overdraft
        feesCollected -= amount;
        (bool ok, ) = to.call{value: amount}("");
        if (!ok) revert NothingToWithdraw();
        return amount;
    }

    /// Price of one more mint by `to` today: 0 while the day's free mint
    /// remains, then `baseFee × 2^(n-1)` for the (n+1)-th mint of a used day.
    function nextMintPrice(address to) external view returns (uint256) {
        (, uint256 done) = _todayTally(to);
        if (done == 0) return 0;
        uint256 shift = done - 1;
        if (shift > MAX_SHIFT) revert FeeOverflow();
        return baseFee << shift;
    }

    /// How many badges `to` has minted so far today (0 if the tally is stale).
    function mintsToday(address to) external view returns (uint256) {
        (, uint256 done) = _todayTally(to);
        return done;
    }

    // ── mint ───────────────────────────────────────────────────────────
    /// Mint one badge to the caller. Free once per day, `baseFee × 2^(n-1)`
    /// after that (n = mints already made today). Overpay refunds.
    function mint() external payable returns (uint256) {
        uint256 required = _requiredFor(msg.sender, 1);
        _collect(required);
        uint256 id = _mintTo(msg.sender);
        _refund(required);
        return id;
    }

    /// Mint `count` badges in one transaction (1..MAX_BATCH). The batch is
    /// priced as `count` sequential daily mints: the day's free mint first,
    /// then the doubling ladder — `baseFee × (2^count − 1)` for a fresh day.
    function mintBatch(uint256 count) external payable returns (uint256) {
        if (count == 0 || count > MAX_BATCH) revert BadCount();
        uint256 required = _requiredFor(msg.sender, count);
        _collect(required);
        uint256 last;
        for (uint256 i = 0; i < count; ++i) {
            last = _mintTo(msg.sender);
        }
        _refund(required);
        return last;
    }

    /// The tally for `to` as of now: UTC day index and mints inside it.
    function _todayTally(address to) internal view returns (uint256, uint256) {
        uint256 today = block.timestamp / 1 days;
        uint256 done = _dayStamp[to] == today ? _dayCount[to] : 0;
        return (today, done);
    }

    /**
     * Total price for `count` mints right now.
     * Fresh day  : the first is free, the rest ladder up — `baseFee × (2^count − 1)`.
     * Used day   : no free mint left, the ladder continues —
     *              `baseFee × 2^(done−1) × (2^count − 1)`.
     * `baseFee × 2^MAX_SHIFT` cannot overflow (see MAX_BASE_FEE / MAX_SHIFT).
     */
    function _requiredFor(address to, uint256 count) internal view returns (uint256) {
        (, uint256 done) = _todayTally(to);
        if (baseFee == 0) return 0; // no rate set — everything free
        if (done == 0) {
            if (count == 1) return 0;
            uint256 ladderTop = count - 1;
            if (ladderTop > MAX_SHIFT) revert FeeOverflow();
            return (baseFee << ladderTop) - baseFee;
        }
        uint256 top = done + count - 1;
        if (top > MAX_SHIFT) revert FeeOverflow();
        return (baseFee << (done - 1)) * ((uint256(1) << count) - 1);
    }

    function _collect(uint256 required) internal {
        if (msg.value < required) revert Underpaid(required, msg.value);
        feesCollected += required;
    }

    /// Send any overpayment back after the mint has fully landed.
    function _refund(uint256 required) internal {
        if (msg.value > required) {
            (bool ok, ) = msg.sender.call{value: msg.value - required}("");
            if (!ok) revert Underpaid(required, msg.value);
        }
    }

    function _mintTo(address to) internal returns (uint256) {
        uint256 today;
        uint256 k; // 0-based index of this mint inside today's tally
        (today, k) = _todayTally(to);
        _dayStamp[to] = today;
        _dayCount[to] = k + 1;

        uint256 id = ++totalMinted;
        mintCount[to] += 1;
        userTokenId[to] = id;
        _safeMint(to, id);

        uint256 paid = k == 0 ? 0 : baseFee << (k - 1);
        emit BadgeMinted(to, id, paid);
        return id;
    }

    // ── soulbound ──────────────────────────────────────────────────────
    // Every ERC721 transfer path funnels through _update, so blocking
    // owner-to-owner moves here is enough to make the badge non-transferable.
    function _update(address to, uint256 tokenId, address auth)
        internal
        override
        returns (address)
    {
        address from = _ownerOf(tokenId);
        if (from != address(0) && to != address(0)) revert SoulboundToken();
        return super._update(to, tokenId, auth);
    }

    // Approvals are meaningless for a soulbound token — always rejected.
    function approve(address, uint256) public pure override(ERC721) { revert SoulboundToken(); }
    function setApprovalForAll(address, bool) public pure override(ERC721) { revert SoulboundToken(); }
    function isApprovedForAll(address, address) public pure override(ERC721) returns (bool) { return false; }
    function transferFrom(address, address, uint256) public pure override(ERC721) { revert SoulboundToken(); }

    // ── views ──────────────────────────────────────────────────────────
    function version() external pure returns (string memory) { return VERSION; }

    /**
     * Off-chain metadata: `<baseURI>?chain=<id>&id=<tokenId>`. The chain id in
     * the query is the one thing an address map can never tell the app — the
     * same badge contract exists on 20+ chains, so the API routes on this.
     */
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        if (_ownerOf(tokenId) == address(0)) revert NoBadge();
        return string.concat(
            baseURI,
            "?chain=",
            Strings.toString(block.chainid),
            "&id=",
            tokenId.toString()
        );
    }
}
