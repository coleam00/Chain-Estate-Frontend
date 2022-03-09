import { Grid, Typography, Button, TextField } from '@mui/material';
import clsx from 'clsx';
import axios from 'axios';
import { useState, useEffect } from "react";
import { useEthers, useContractFunction, useCall } from "@usedapp/core";
import { constants, utils, ethers } from "ethers";
import { Contract } from "@ethersproject/contracts";
import Web3Modal from 'web3modal';
import { Modal } from "react-bootstrap";

import styles from '../styles/marketplace.module.css';
import CHESNFT from "../contracts/ChainEstateNFT.json";
import CHESMarketplace from "../contracts/ChainEstateMarketplace.json";
import chainConfig from "../chain-config.json";

const network = "rinkeby";

export default function ListNFTs(props) {
    const { account, chainId } = useEthers();
    const networkName = chainId ? chainConfig["chainIds"][chainId] : "Not Connected";
    const CHESNFTAddress = chainId ? chainConfig["CHESNFTAddresses"][networkName] : constants.AddressZero;
    const CHESMarketplaceAddress = chainId ? chainConfig["CHESNFTMarketplaceAddresses"][networkName] : constants.AddressZero;

    const nftAbi = CHESNFT.abi;
    const marketplaceAbi = CHESMarketplace.abi
    
    const nftInterface = new utils.Interface(nftAbi);
    const nftContract = new Contract(CHESNFTAddress, nftInterface);
    const marketplaceInterface = new utils.Interface(marketplaceAbi);
    const marketplaceContract = new Contract(CHESMarketplaceAddress, marketplaceInterface);

    const [inputError, setInputError] = useState("");
    const [NFTPrice, setNFTPrice] = useState(0.0);
    const [userNFTs, setUserNFTs] = useState([]);
    const [showListNFTModal, setShowListNFTModal] = useState(false);
    const [currNFT, setCurrNFT] = useState({});
    const [NFTTransferApproved, setNFTTransferApproved] = useState(false);

    const isConnected = account !== undefined;

    const { send: approveNFTTransfer, state: approveNFTTransferState } =
        useContractFunction(nftContract, "approve", {
            transactionName: "Approve the CHES NFT marketplace to tranfer your CHES NFT",
    })

    const { send: createMarketItem, state: createMarketItemState } =
        useContractFunction(marketplaceContract, "createMarketItem", {
            transactionName: "List a Chain Estate DAO NFT on the Marketplace",
    })

    function startNFTListing(nft) {
        setCurrNFT(nft);
        setShowListNFTModal(true);
        setNFTTransferApproved(false);
    }
    
    async function approveNFTTransferToMarketplace(tokenId) {
        if (NFTPrice > 0.0) {
            approveNFTTransfer(CHESMarketplaceAddress, tokenId);
        }
    }

    useEffect(() => {
        console.log(approveNFTTransferState);
        if (approveNFTTransferState.status === "Success") {
            setNFTTransferApproved(true);
        }
        else {
            setCurrApprovedNFTId(-1);
        }
    }, [approveNFTTransferState])

    async function finalizeNFTListing(tokenId) {
        if (NFTPrice > 0.0 && NFTTransferApproved) {
            const web3Modal = new Web3Modal({
                network: network,
                cacheProvider: true,
              })
            const connection = await web3Modal.connect();
            const provider = new ethers.providers.Web3Provider(connection);
            const marketplaceContractReadOnly = new ethers.Contract(CHESMarketplaceAddress, marketplaceAbi, provider);
    
            const listingPrice = await marketplaceContractReadOnly.getListingPrice();
            const price = ethers.utils.parseUnits(NFTPrice, 'ether');
            createMarketItem(CHESNFTAddress, tokenId, price, {value: listingPrice});
        }
    }

    useEffect(() => {
        console.log(createMarketItemState);
        if (createMarketItemState.status === "Success") {
            setNFTTransferApproved(false);
            setShowListNFTModal(false);
            getTokenURI();
        }
    }, [createMarketItemState])

    const isNumeric = stringToTest => {
        return !isNaN(stringToTest) && !isNaN(parseFloat(stringToTest));
    }

    const updateNFTPrice = event => {
        const newAmount = event.target.value;

        if (isNumeric(+newAmount) || newAmount == ".") {
            setNFTPrice(event.target.value);
        }
        if (newAmount > 0.0) {
            setInputError("");
        }
    }

    async function getTokenURI() {
        const web3Modal = new Web3Modal({
            network: network,
            cacheProvider: true,
          })
        const connection = await web3Modal.connect();
        const provider = new ethers.providers.Web3Provider(connection);
        const nftContractReadOnly = new ethers.Contract(CHESNFTAddress, nftAbi, provider);

        const tokenIdCounter = await nftContractReadOnly._tokenIds();
        let NFTArray = [];
        for (let id = 1; id <= tokenIdCounter; id++) {
            const NFTOwner = await nftContractReadOnly.ownerOf(id);

            if (NFTOwner == account) {
                const tokenURI = await nftContractReadOnly.tokenURI(id);
                const metaData = await axios.get(tokenURI);
                NFTArray.push(Object.assign({}, metaData.data, {tokenId: id}));
                NFTArray.push(Object.assign({}, metaData.data, {tokenId: id}));
                NFTArray.push(Object.assign({}, metaData.data, {tokenId: id}));
            }
        }

        setUserNFTs(JSON.parse(JSON.stringify(NFTArray)));
    }

    useEffect(() => {
        if (account !== undefined) {
            getTokenURI();
        }
    }, [account]);

    return (
        <>
            <Modal aria-labelledby="ListNFTModal" centered show={showListNFTModal} onHide={() => setShowListNFTModal(false)}>
                <Modal.Header closeButton closeVariant={props.useDarkTheme ? "white" : "black"} className={props.useDarkTheme ? styles.modalDark : styles.modalLight}>
                    <Modal.Title>
                        <Typography variant="p" component="div" className={props.useDarkTheme ? styles.darkText : styles.lightText}>
                            List NFT: {currNFT.NFTName}
                        </Typography>
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body className={clsx(styles.modalBody, props.useDarkTheme ? styles.modalDark : styles.modalLight)}>
                    <Typography variant="h4" component="div" className={props.useDarkTheme ? styles.darkText : styles.lightText}>
                        Set NFT Price
                    </Typography>
                    <TextField error={inputError != ""} label="Price in CHES" helperText={inputError}
                        value={NFTPrice} onChange={updateNFTPrice} className={styles.CHESPurchaseInput} />
                        <br/>
                    {
                        !NFTTransferApproved && (
                            <Button size="small" variant="contained" color="primary" onClick={() => approveNFTTransferToMarketplace(currNFT.tokenId)}
                                className={clsx(styles.listNFTBtn, props.useDarkTheme ? styles.btnDark : styles.btnLight)}>
                                Approve NFT Transfer
                            </Button>
                        )
                    }
                    {
                        NFTTransferApproved && (
                            <Button size="small" variant="contained" color="primary" disabled
                                className={clsx(styles.listNFTBtn, props.useDarkTheme ? styles.btnDark : styles.btnLight)}>
                                NFT Transfer Approved
                            </Button>
                        )
                    }
                    <br/>
                    <Button size="small" variant="contained" color="primary" onClick={() => finalizeNFTListing(currNFT.tokenId)}
                        className={clsx(styles.listNFTBtn, props.useDarkTheme ? styles.btnDark : styles.btnLight)}
                        disabled={!NFTTransferApproved}>
                        List NFT for Sale
                    </Button>
                </Modal.Body>
            </Modal>

            <Grid container justifyContent="center" alignItems="center" className="mt-5" spacing={4}>
                <Grid item xs={12}>
                    <Typography variant="h5" component="div" className="text-center">
                        Your NFTs
                    </Typography>
                </Grid>
                <Grid item xs={10}>
                    <Grid container justifyContent="center" alignItems="center" spacing={4}>
                        {
                            userNFTs.map((nft, i) => (
                                <Grid key={i} item xs={3} className={styles.NFTGrid}>
                                    <div key={i} className="shadow rounded-xl overflow-hidden">
                                        <img src={nft.image} className={clsx(styles.NFTImage, "rounded")} />
                                        <div className={clsx(props.useDarkTheme ? styles.NFTTextDark : styles.NFTTextLight, "p-4")}>
                                        <Typography variant="p" component="div" className="text-2xl font-bold text-center">
                                            {nft.NFTName}
                                        </Typography>
                                        <Typography variant="p" component="div" className="text-2xl font-bold text-center mt-3">
                                            {nft.NFTDescription}
                                        </Typography>
                                        </div>
                                    </div>
                                    <Button size="small" variant="contained" color="primary" onClick={() => startNFTListing(nft)}
                                        className={clsx(styles.listNFTBtn, props.useDarkTheme ? styles.btnDark : styles.btnLight)}>
                                        List NFT for Sale
                                    </Button>
                                </Grid>
                            ))
                        }
                    </Grid>
                </Grid>
            </Grid>
        </>
    )
}