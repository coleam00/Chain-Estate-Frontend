import { Grid, Typography, Button, TextField, CircularProgress } from '@mui/material';
import Snackbar from '@mui/material/Snackbar';
import MuiAlert from '@mui/material/Alert';
import clsx from 'clsx';
import axios from 'axios';
import { useState, useEffect } from "react";
import { ImPriceTag } from 'react-icons/im';
import { useEthers, useContractFunction, useCall } from "@usedapp/core";
import { constants, utils, ethers } from "ethers";
import { Contract } from "@ethersproject/contracts";
import Web3Modal from 'web3modal';
import { Modal } from "react-bootstrap";

import styles from '../styles/marketplace.module.css';
import CHESNFT from "../contracts/ChainEstateNFT.json";
import CHESMarketplace from "../contracts/ChainEstateMarketplace.json";
import chainConfig from "../chain-config.json";

const network = "binance";

async function useUserMarketItems(
    marketplaceContract,
    accountAddress
  ) {
    const { value, error } =
        useCall(
        marketplaceContract && {
            contract: marketplaceContract, // instance of called contract
            method: "fetchUnsoldItemsCreated", // Method to be called
            args: [accountAddress], // Method arguments - address to be checked for balance
          }
      ) ?? {};
    if(error) {
      console.error(error.message)
      return [];
    }
    console.log(value);
    return value?.[0]
  }

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

    const userMarketItems = useUserMarketItems(marketplaceContract, account);
    const [inputError, setInputError] = useState("");
    const [NFTPrice, setNFTPrice] = useState(0.0);
    const [userNFTs, setUserNFTs] = useState([]);
    const [showListNFTModal, setShowListNFTModal] = useState(false);
    const [currNFT, setCurrNFT] = useState({});
    const [NFTTransferApproved, setNFTTransferApproved] = useState(false);
    const [NFTsLoaded, setNFTsLoaded] = useState(false);
    const [currNFTViewed, setCurrNFTViewed] = useState(-1);
    const [approvingNFTTransfer, setApprovingNFTTransfer] = useState(false);
    const [listingNFT, setListingNFT] = useState(false);
    const [showApprovalSuccess, setShowApprovalSuccess] = useState(false);
    const [showListingSuccess, setShowListingSuccess] = useState(false);
    const [showTransactionCancel, setShowTransactionCancel] = useState(false);
    const [showPendingTransaction, setShowPendingTransaction] = useState(false);
    const [userMarketNFTs, setUserMarketNFTs] = useState([]);
    const [marketNFTsLoaded, setMarketNFTsLoaded] = useState(false);
    const [currNFTCanceling, setCurrNFTCanceling] = useState(-1);
    const [currListedNFTViewed, setCurrListedNFTViewed] = useState(-1);
    const [cancelingNFTListing, setCancelingNFTListing] = useState(false);
    const [showCancelSuccess, setShowCancelSuccess] = useState(false);
    const [showCancelFail, setShowCancelFail] = useState(false);
    const [errorText, setErrorText] = useState("");
    const [processingMessage, setProcessingMessage] = useState("");
    const [transactionHash, setTransactionHash] = useState("");

    const isConnected = account !== undefined;

    const { send: approveNFTTransfer, state: approveNFTTransferState } =
        useContractFunction(nftContract, "approve", {
            transactionName: "Approve the CHES NFT marketplace to tranfer your CHES NFT",
    })

    const { send: createMarketItem, state: createMarketItemState } =
        useContractFunction(marketplaceContract, "createMarketItem", {
            transactionName: "List a Chain Estate DAO NFT on the Marketplace",
    })

    const { send: cancelMarketSale, state: cancelMarketSaleState } =
        useContractFunction(marketplaceContract, "cancelMarketSale", {
            transactionName: "Cancel a Chain Estate DAO NFT listing on the marketplace",
    })

    function startNFTListing(nft) {
        setCurrNFT(nft);
        setShowListNFTModal(true);
        setNFTTransferApproved(false);
        setInputError("");
    }
    
    async function approveNFTTransferToMarketplace(tokenId) {
        if (NFTPrice > 0.0) {
            approveNFTTransfer(CHESMarketplaceAddress, tokenId);
            setApprovingNFTTransfer(true);
        }
        else {
            setInputError("Price Must be Above 0 CHES");
        }
    }

    useEffect(() => {
        console.log(approveNFTTransferState);
        if (approveNFTTransferState.status === "Success") {
            setNFTTransferApproved(true);
            setApprovingNFTTransfer(false);
            setShowApprovalSuccess(true);
            setShowTransactionCancel(false);
            setShowPendingTransaction(false);
        }
        else if (approveNFTTransferState.status === "Exception") {
            setApprovingNFTTransfer(false);
            setShowTransactionCancel(true);
            setShowApprovalSuccess(false);
            setShowListingSuccess(false);
            setShowPendingTransaction(false);
            setErrorText(approveNFTTransferState.errorMessage);
        }
        else if (approveNFTTransferState.status === "Mining") {
            setShowPendingTransaction(true);
            setProcessingMessage("Approving NFT Transfer.")
            setTransactionHash(approveNFTTransferState.transaction.hash);
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
            const nftContractReadOnly = new ethers.Contract(CHESNFTAddress, nftAbi, provider);

            const price = ethers.utils.parseUnits(NFTPrice, 'ether');
            let listingPrice = await nftContractReadOnly.tokenIdToListingFee(tokenId);

            if (listingPrice <= 0) {
                listingPrice = await marketplaceContractReadOnly.getDefaultListingPrice();
            }
            console.log(listingPrice);
            
            createMarketItem(CHESNFTAddress, tokenId, price, {value: listingPrice});
            setListingNFT(true);
        }
    }

    useEffect(() => {
        console.log(createMarketItemState);
        if (createMarketItemState.status === "Success") {
            setNFTTransferApproved(false);
            setShowListNFTModal(false);
            setListingNFT(false);
            setShowListingSuccess(true);
            setShowTransactionCancel(false);
            setShowPendingTransaction(false);
            getTokenURI();
        }
        else if (createMarketItemState.status === "Exception") {
            setListingNFT(false);
            setShowTransactionCancel(true);
            setShowApprovalSuccess(false);
            setShowListingSuccess(false);
            setShowPendingTransaction(false);
            setErrorText(createMarketItemState.errorMessage);
        }
        else if (createMarketItemState.status === "Mining") {
            setShowPendingTransaction(true);
            setProcessingMessage("Listing your NFT.")
            setTransactionHash(createMarketItemState.transaction.hash);
        }
    }, [createMarketItemState])

    async function updateUserMarketNFTs(userMarketItemsResult) {
        console.log("Updating user marketplace NFTs.");
        let userMarketplaceNFTArray = [];

        const web3Modal = new Web3Modal({
            network: network,
            cacheProvider: true,
          })
        const connection = await web3Modal.connect();
        const provider = new ethers.providers.Web3Provider(connection);
        const nftContractReadOnly = new ethers.Contract(CHESNFTAddress, nftAbi, provider);

        for(let i = 0; i < userMarketItemsResult.length; i++) {
            const currTokenId = userMarketItemsResult[i].tokenId;
            const currTokenURI = await nftContractReadOnly.tokenURI(currTokenId);
            const metaData = await axios.get(currTokenURI);
            const price = (+ethers.utils.formatEther(BigInt(userMarketItemsResult[i].price._hex).toString(10))).toFixed(1).toString();
            const itemId = BigInt(userMarketItemsResult[i].itemId._hex).toString(10);
            userMarketplaceNFTArray.push(Object.assign({}, metaData.data, {price: price, itemId: itemId}));
        }

        setUserMarketNFTs(JSON.parse(JSON.stringify(userMarketplaceNFTArray)));
        setMarketNFTsLoaded(true);
    }

    useEffect(() => {
        userMarketItems.then(userMarketItemsResult => {
            if (userMarketItemsResult && userMarketNFTs.length !== userMarketItemsResult.length) {
                updateUserMarketNFTs(userMarketItemsResult);
            }
            else if (isConnected && userMarketNFTs.length == 0) {
                setMarketNFTsLoaded(true);
            }
        });
    }, [userMarketItems])

    const cancelNFTListing = (itemId) => {
        setCancelingNFTListing(true);
        setCurrNFTCanceling(itemId);
        cancelMarketSale(CHESNFTAddress, itemId);
    }

    useEffect(() => {
        console.log(cancelMarketSaleState);
        if (cancelMarketSaleState.status === "Success") {
            setCurrNFTCanceling(-1);
            setCancelingNFTListing(false);
            setShowCancelSuccess(true);
            setShowCancelFail(false);
            setShowPendingTransaction(false);
            getTokenURI();
        }
        else if (cancelMarketSaleState.status === "Exception") {
            setCurrNFTCanceling(-1);
            setCancelingNFTListing(false);
            setShowCancelFail(true);
            setShowCancelSuccess(false);
            setShowPendingTransaction(false);
            setErrorText(cancelMarketSaleState.errorMessage);
        }
        else if (cancelMarketSaleState.status === "Mining") {
            setShowPendingTransaction(true);
            setProcessingMessage("Canceling your NFT listing.")
            setTransactionHash(cancelMarketSaleState.transaction.hash);
        }
    }, [cancelMarketSaleState])

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
            }
        }

        setUserNFTs(JSON.parse(JSON.stringify(NFTArray)));
        setNFTsLoaded(true);
    }

    useEffect(() => {
        if (account !== undefined) {
            getTokenURI();
        }
    }, [account]);

    return (
        <>
            <Snackbar open={showApprovalSuccess} autoHideDuration={6000} onClose={() => {setShowApprovalSuccess(false)}}>
                <MuiAlert elevation={6} variant="filled" onClose={() => {setShowApprovalSuccess(false)}} severity="success" sx={{ width: '100%' }} >
                    Approval Succeeded! Click &quot;List NFT for Sale&quot; to Finalize Your NFT Listing.
                </MuiAlert>
            </Snackbar>
            <Snackbar open={showListingSuccess} autoHideDuration={6000} onClose={() => {setShowListingSuccess(false)}}>
                <MuiAlert elevation={6} variant="filled" onClose={() => {setShowListingSuccess(false)}} severity="success" sx={{ width: '100%' }} >
                    Listing Succeeded! Transaction hash: <a className={styles.transactionHashLink} href={`https://bscscan.com/tx/${transactionHash}`} target="_blank" rel="noreferrer" >{transactionHash}</a>
                </MuiAlert>
            </Snackbar>
            <Snackbar open={showTransactionCancel} autoHideDuration={6000} onClose={() => {setShowTransactionCancel(false)}}>
                <MuiAlert elevation={6} variant="filled" onClose={() => {setShowTransactionCancel(false)}} severity="error" sx={{ width: '100%' }} >
                    Transaction Canceled: {errorText}
                </MuiAlert>
            </Snackbar>
            <Snackbar open={showCancelSuccess} autoHideDuration={6000} onClose={() => {setShowCancelSuccess(false)}}>
                <MuiAlert elevation={6} variant="filled" onClose={() => {setShowCancelSuccess(false)}} severity="success" sx={{ width: '100%' }} >
                    Listing Canceled Successfully! Transaction hash: <a className={styles.transactionHashLink} href={`https://bscscan.com/tx/${transactionHash}`} target="_blank" rel="noreferrer" >{transactionHash}</a>
                </MuiAlert>
            </Snackbar>
            <Snackbar open={showCancelFail} autoHideDuration={6000} onClose={() => {setShowCancelFail(false)}}>
                <MuiAlert elevation={6} variant="filled" onClose={() => {setShowCancelFail(false)}} severity="error" sx={{ width: '100%' }} >
                    Listing Cancelation Stopped: {errorText}
                </MuiAlert>
            </Snackbar>
            <Snackbar open={showPendingTransaction} autoHideDuration={20000} onClose={() => {setShowPendingTransaction(false)}}>
                <MuiAlert elevation={6} variant="filled" onClose={() => {setShowPendingTransaction(false)}} severity="info" sx={{ width: '100%' }} >
                    {processingMessage} Transaction hash: <a className={styles.transactionHashLink} href={`https://bscscan.com/tx/${transactionHash}`} target="_blank" rel="noreferrer" >{transactionHash}</a>
                </MuiAlert>
            </Snackbar>
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
                                className={clsx(styles.listNFTBtn, props.useDarkTheme ? styles.btnDark : styles.btnLight)} 
                                disabled={approvingNFTTransfer}>
                                {approvingNFTTransfer && <CircularProgress size={18} color="secondary"/>} 
                                {approvingNFTTransfer ? <>&nbsp; Approving</> : "Approve NFT Transfer"}
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
                        disabled={!NFTTransferApproved || listingNFT}>
                        {listingNFT && <CircularProgress size={18} color="secondary"/>} 
                        {listingNFT ? <>&nbsp; Listing</> : "List NFT for Sale"}
                    </Button>
                </Modal.Body>
            </Modal>

            <Grid container justifyContent="center" className={styles.mainGrid}>
                <Grid item xs={4} className={styles.spacingGrid}></Grid>
                <Grid item xs={4} className={styles.headerGrid}>
                    <Typography variant="h4" className={clsx(styles.header, props.useDarkTheme ? styles.darkHeader : styles.lightHeader)}>
                        My Chain Estate DAO NFTs
                    </Typography>
                </Grid>
                <Grid item xs={4} className={styles.spacingGrid}></Grid>
                
                <Grid container justifyContent="center" spacing={4} className={styles.marketplaceFunctionGrid}>
                    {
                        !isConnected && (
                            <Grid item xs={10} className="text-center">
                                <Typography variant="h5" component="div">
                                    Connect Your Wallet in the Navigation Menu to View Your Chain Estate DAO NFTs
                                </Typography>
                            </Grid>
                        )
                    }
                    {
                        isConnected && userNFTs.length == 0 && NFTsLoaded && (
                            <Grid item xs={10} className="text-center">
                                <Typography variant="h5" component="div">
                                    You Currently do not have any Chain Estate DAO NFTs
                                </Typography>
                            </Grid>
                        )
                    }
                    {
                        isConnected && userNFTs.length == 0 && !NFTsLoaded && (
                            <Grid item xs={10} className="text-center mt-5">
                                <CircularProgress size={80} color="secondary" className={styles.loadingAirdropContent} />
                            </Grid>
                        )
                    }
                    {
                        isConnected && userNFTs.length > 0 && (
                            <Grid item xs={10}>
                                <Grid container justifyContent="center" alignItems="center" spacing={4}>
                                    {
                                        userNFTs && (userNFTs.map((nft, i) => (
                                            <Grid key={i} item xs={12} sm={6} md={4} lg={3} className={styles.NFTGrid}>
                                                <div key={i} className={clsx(styles.cardDiv, "rounded-xl overflow-hidden")} onMouseEnter={() => setCurrNFTViewed(nft.tokenId)} onMouseLeave={() => setCurrNFTViewed(-1)}>
                                                    <img src={nft.image} className={clsx(styles.NFTImage)} />
                                                    <div className={clsx(props.useDarkTheme ? styles.NFTTextDark : styles.NFTTextLight, "p-4")}>
                                                        <Typography variant="p" component="div" className="text-2xl font-bold">
                                                            {nft.NFTName}
                                                        </Typography>
                                                        {
                                                            currNFTViewed != nft.tokenId && (
                                                                <Typography variant="p" component="div" className={clsx(styles.nftDescriptionText,"font-bold mt-3")}>
                                                                    {nft.NFTDescription}
                                                                </Typography>
                                                            )
                                                        }
                                                        {
                                                            currNFTViewed == nft.tokenId && (
                                                                <Button size="small" variant="contained" color="primary" onClick={() => startNFTListing(nft)}
                                                                    className={clsx(styles.listNFTBtn, props.useDarkTheme ? styles.btnDark : styles.btnLight)}>
                                                                    List NFT for Sale
                                                                </Button>
                                                            )
                                                        }
                                                    </div>
                                                </div>
                                            </Grid>
                                        )))
                                    }
                                </Grid>
                            </Grid>
                        )
                    }
                    {
                        isConnected && userMarketNFTs.length > 0 && (
                            <>
                                <Grid item xs={4} className={clsx(styles.headerGrid, styles.myListedNFTsTitle)}>
                                    <Typography variant="h4" className={clsx(styles.header, props.useDarkTheme ? styles.darkHeader : styles.lightHeader)}>
                                        My listed Chain Estate DAO NFTs
                                    </Typography>
                                </Grid>
                            </>
                        )
                    }
                    {
                        isConnected && userMarketNFTs.length > 0 && (
                            <Grid item xs={10}>
                                <Grid container justifyContent="center" alignItems="center" spacing={4}>
                                    {
                                        userMarketNFTs && (userMarketNFTs.map((nft, i) => (
                                            <Grid key={i} item xs={12} sm={6} md={4} lg={3} className={styles.NFTGrid}>
                                                <div key={i} className={clsx(styles.cardDiv, "rounded-xl overflow-hidden")} onMouseEnter={() => setCurrListedNFTViewed(nft.itemId)} onMouseLeave={() => setCurrListedNFTViewed(-1)}>
                                                    <img src={nft.image} className={clsx(styles.NFTImage)} />
                                                    <Grid container justifyContent="center" alignItems="center" className={clsx(props.useDarkTheme ? styles.NFTTextDark : styles.NFTTextLight, "p-4")}>
                                                        <Grid item xs={8} className={styles.nftNameAndDesc}>
                                                            <Typography variant="p" component="div" className={clsx(styles.NFTName, "text-2xl font-bold")}>
                                                                {nft.NFTName}
                                                            </Typography>
                                                            {
                                                                currListedNFTViewed != nft.itemId && currNFTCanceling != nft.itemId && (
                                                                    <Typography variant="p" component="div" className={clsx(styles.NFTDescription, "font-bold mt-3")}>
                                                                        {nft.NFTDescription}
                                                                    </Typography>
                                                                )
                                                            }
                                                            {
                                                                (currListedNFTViewed == nft.itemId || currNFTCanceling == nft.itemId) && (
                                                                    <Button size="small" variant="contained" color="primary" onClick={() => cancelNFTListing(nft.itemId)}
                                                                        className={clsx(styles.listNFTBtn, props.useDarkTheme ? styles.btnDark : styles.btnLight)} disabled={cancelingNFTListing}>
                                                                        {currNFTCanceling == nft.itemId && <CircularProgress size={18} color="secondary"/>} 
                                                                        {currNFTCanceling == nft.itemId ? <>&nbsp; Canceling</> : "Cancel Listing"}
                                                                    </Button>
                                                                )
                                                            }
                                                        </Grid>
                                                        <Grid item xs={4} className={styles.nftPrice}>
                                                            <Typography variant="p" component="div" className={clsx(styles.NFTPrice, "font-bold")}>
                                                                <ImPriceTag /> Price
                                                            </Typography>
                                                            <Typography variant="p" component="div" className={clsx(styles.NFTPrice, "font-bold mt-3")}>
                                                                {Number(nft.price).toLocaleString()} CHES
                                                            </Typography>
                                                        </Grid>
                                                    </Grid>
                                                </div>
                                            </Grid>
                                        )))
                                    }
                                </Grid>
                            </Grid>
                        )
                    }
                </Grid>
            </Grid>
        </>
    )
}