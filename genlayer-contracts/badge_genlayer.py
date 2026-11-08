# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
from genlayer import *
import json

BASE = "https://dgdreams.space/api/badge"
CHAIN_ID = 4221
VERSION = "3.0.0"


class ChainBadge(gl.Contract):
    store: str

    def __init__(self):
        # owners: tokenId -> address, counts: address -> minted count,
        # last: address -> most recent tokenId, minted: running total.
        # Daily ledger: days: address -> "YYYY-MM-DD" the tally is for,
        # daycount: address -> mints inside that date — the day's first mint
        # is free, the next basefee, then basefee*2, basefee*4, … resetting
        # at 00:00 UTC (the same UTC-day boundary the EVM badges use).
        # basefee: the "1 cent" rate in wei of GEN (0 = everything free until
        # the owner sets it). fees: total quoted fees kept by the contract.
        self.store = json.dumps(
            {
                "owners": {},
                "counts": {},
                "last": {},
                "minted": 0,
                "days": {},
                "daycount": {},
                "basefee": 0,
                "fees": 0,
                "owner": str(gl.message.sender_address),
            },
            sort_keys=True,
        )

    # ── internal ledger ─────────────────────────────────────────────
    def _today(self) -> str:
        # The GenVM clock is pinned to the transaction's datetime — parse the
        # UTC date out of the ISO string instead of trusting a wall clock.
        return gl.message_raw["datetime"][:10]

    def _tally(self, data: dict, addr: str, today: str) -> int:
        return int(data["daycount"].get(addr)) if data["days"].get(addr) == today else 0

    def _required(self, data: dict, addr: str, count: int, today: str) -> int:
        # total price for `count` mints right now:
        #   fresh day: first free, ladder up — basefee × (2^count − 1)
        #   used day:  no free mint left, ladder continues —
        #              basefee × 2^(done−1) × (2^count − 1)
        basefee = int(data["basefee"])
        if basefee == 0:
            return 0
        done = self._tally(data, addr, today)
        if done == 0:
            if count == 1:
                return 0
            return basefee * ((1 << (count - 1)) - 1)
        return basefee * (1 << (done - 1)) * ((1 << count) - 1)

    # ── owner ───────────────────────────────────────────────────────
    @gl.public.write
    def setBaseFee(self, wei_per_first_paid_mint: int) -> str:
        addr = str(gl.message.sender_address).lower()
        data = json.loads(self.store)
        if addr != str(data["owner"]).lower():
            raise Exception("only owner")
        data["basefee"] = int(wei_per_first_paid_mint)
        self.store = json.dumps(data, sort_keys=True)
        return json.dumps({"ok": True, "basefee": int(wei_per_first_paid_mint)})

    # ── writes ──────────────────────────────────────────────────────
    @gl.public.write.payable
    def mint(self) -> str:
        # One free mint per wallet per day; `basefee × 2^(n−1)` for the next
        # after n — the caller sends exactly the quoted price (overpay would
        # be kept, so the dapp always quotes exact).
        addr = str(gl.message.sender_address).lower()
        today = self._today()
        data = json.loads(self.store)
        required = self._required(data, addr, 1, today)
        if int(gl.message.value) < required:
            raise Exception("underpaid: send %d" % required)
        data["fees"] = int(data["fees"]) + required

        data["minted"] = int(data["minted"]) + 1
        token_id = data["minted"]
        data["owners"][str(token_id)] = addr
        data["counts"][addr] = int(data["counts"].get(addr, 0)) + 1
        data["last"][addr] = token_id
        data["days"][addr] = today
        data["daycount"][addr] = self._tally(data, addr, today) + 1
        self.store = json.dumps(data, sort_keys=True)
        return json.dumps({"ok": True, "tokenId": token_id, "paid": required})

    # ── views ───────────────────────────────────────────────────────
    @gl.public.view
    def nextMintPrice(self, addr: str) -> int:
        data = json.loads(self.store)
        today = gl.message_raw["datetime"][:10]
        return self._required(data, str(addr).lower(), 1, today)

    @gl.public.view
    def mintsToday(self, addr: str) -> int:
        data = json.loads(self.store)
        today = gl.message_raw["datetime"][:10]
        return self._tally(data, str(addr).lower(), today)

    @gl.public.view
    def baseFee(self) -> int:
        return int(json.loads(self.store)["basefee"])

    @gl.public.view
    def feesCollected(self) -> int:
        return int(json.loads(self.store)["fees"])

    @gl.public.view
    def mintCount(self, addr: str) -> int:
        counts = json.loads(self.store)["counts"]
        return int(counts.get(str(addr).lower(), 0))

    @gl.public.view
    def userTokenId(self, addr: str) -> int:
        last = json.loads(self.store)["last"]
        return int(last.get(str(addr).lower(), 0))

    @gl.public.view
    def totalMinted(self) -> int:
        return int(json.loads(self.store)["minted"])

    @gl.public.view
    def tokenURI(self, _token_id: int) -> str:
        return "{0}?chain={1}&id={2}".format(BASE, CHAIN_ID, int(_token_id))

    @gl.public.view
    def ownerOf(self, _token_id: int) -> str:
        owners = json.loads(self.store)["owners"]
        return str(owners.get(str(int(_token_id)), ""))

    @gl.public.view
    def version(self) -> str:
        return VERSION
