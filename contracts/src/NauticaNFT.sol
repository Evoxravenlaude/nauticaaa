// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title NauticaNFT
 * @notice ERC-721 factory used by the Nautica marketplace Create NFT flow.
 *
 * Features:
 *  - Anyone can mint (open mint) — just call mint(to, tokenURI)
 *  - tokenURI is an IPFS URI set at mint time (ipfs://Qm…)
 *  - Owner can set a mint fee (0 by default)
 *  - Owner can pause minting
 *  - Royalty info via ERC-2981
 *
 * Deploy once, set FACTORY_ADDRESS in src/pages/nft/CreateNFT.tsx.
 */
contract NauticaNFT is ERC721URIStorage, Ownable {
    using Counters for Counters.Counter;

    Counters.Counter private _tokenIds;

    uint256 public mintFee;        // in wei, 0 by default
    bool    public mintingPaused;
    uint96  public royaltyBps;     // basis points, e.g. 500 = 5%

    event Minted(address indexed to, uint256 indexed tokenId, string tokenURI);
    event MintFeeUpdated(uint256 newFee);
    event MintingPaused(bool paused);

    error MintingIsPaused();
    error InsufficientFee(uint256 sent, uint256 required);
    error ZeroAddress();

    constructor(
        string memory name_,
        string memory symbol_,
        uint256 mintFee_,
        uint96  royaltyBps_
    ) ERC721(name_, symbol_) Ownable(msg.sender) {
        mintFee    = mintFee_;
        royaltyBps = royaltyBps_;
    }

    /**
     * @notice Mint a new NFT with an IPFS metadata URI.
     * @param to        Recipient address
     * @param tokenURI_ IPFS URI for the metadata JSON (ipfs://CID)
     * @return tokenId  The newly minted token ID
     */
    function mint(
        address to,
        string calldata tokenURI_
    ) external payable returns (uint256 tokenId) {
        if (mintingPaused)       revert MintingIsPaused();
        if (to == address(0))    revert ZeroAddress();
        if (msg.value < mintFee) revert InsufficientFee(msg.value, mintFee);

        _tokenIds.increment();
        tokenId = _tokenIds.current();

        _safeMint(to, tokenId);
        _setTokenURI(tokenId, tokenURI_);

        emit Minted(to, tokenId, tokenURI_);
    }

    /**
     * @notice Batch mint multiple NFTs in one transaction.
     */
    function batchMint(
        address to,
        string[] calldata uris
    ) external payable returns (uint256[] memory tokenIds) {
        if (mintingPaused)              revert MintingIsPaused();
        if (to == address(0))           revert ZeroAddress();
        if (msg.value < mintFee * uris.length)
            revert InsufficientFee(msg.value, mintFee * uris.length);

        tokenIds = new uint256[](uris.length);
        for (uint256 i = 0; i < uris.length; i++) {
            _tokenIds.increment();
            uint256 id = _tokenIds.current();
            _safeMint(to, id);
            _setTokenURI(id, uris[i]);
            tokenIds[i] = id;
            emit Minted(to, id, uris[i]);
        }
    }

    // ── ERC-2981 royalty info ─────────────────────────────────────────
    function royaltyInfo(
        uint256, /* tokenId */
        uint256 salePrice
    ) external view returns (address receiver, uint256 royaltyAmount) {
        receiver      = owner();
        royaltyAmount = (salePrice * royaltyBps) / 10_000;
    }

    function supportsInterface(bytes4 interfaceId)
        public view override returns (bool)
    {
        return interfaceId == 0x2a55205a // ERC-2981
            || super.supportsInterface(interfaceId);
    }

    // ── Admin ─────────────────────────────────────────────────────────
    function setMintFee(uint256 fee) external onlyOwner {
        mintFee = fee;
        emit MintFeeUpdated(fee);
    }

    function setMintingPaused(bool paused) external onlyOwner {
        mintingPaused = paused;
        emit MintingPaused(paused);
    }

    function setRoyaltyBps(uint96 bps) external onlyOwner {
        require(bps <= 1000, "Max 10%");
        royaltyBps = bps;
    }

    function withdraw() external onlyOwner {
        (bool ok,) = owner().call{value: address(this).balance}("");
        require(ok, "Transfer failed");
    }

    function totalSupply() external view returns (uint256) {
        return _tokenIds.current();
    }
}
