import { Grid, Typography, Button, CircularProgress } from '@mui/material';
import Snackbar from '@mui/material/Snackbar';
import MuiAlert from '@mui/material/Alert';
import clsx from 'clsx';
import axios from 'axios';
import { useState, useEffect } from "react";
import { useEthers, useTokenBalance, useContractFunction, useCall, useContractCall } from "@usedapp/core";
import { constants, utils, ethers } from "ethers";
import { Contract } from "@ethersproject/contracts";
import { ImPriceTag } from 'react-icons/im';

import styles from '../styles/marketplace.module.css';
import CHESToken from "../contracts/ChainEstateToken.json";
import CHESNFT from "../contracts/ChainEstateNFT.json";
import CHESMarketplace from "../contracts/ChainEstateMarketplace.json";
import chainConfig from "../chain-config.json";

const network = "binance";
const rpcEndpoint = "https://bsc-dataseed.binance.org/";
const binanceChainId = 56;

async function useMarketItems(
    marketplaceContract, CHESMarketplaceAddress, marketplaceAbi
  ) {
    const { value, error } =
        useCall(
        marketplaceContract && {
            contract: marketplaceContract, // instance of called contract
            method: "fetchMarketItems", // Method to be called
            args: [], // Method arguments - address to be checked for balance
          }
      ) ?? {};
    if(error) {
      console.error(error.message)
      return undefined
    }

    if (!value) {
        const provider = new ethers.providers.JsonRpcProvider(rpcEndpoint, { name: network, chainId: binanceChainId });
        const marketplaceReadOnly = new ethers.Contract(CHESMarketplaceAddress, marketplaceAbi, provider);
    
        const returnVal = await marketplaceReadOnly.fetchMarketItems();
        return returnVal;
    }

    return value?.[0]
  }

export default function ViewMarketplaceNFTs(props) {
    const { account, chainId } = useEthers();
    // const networkName = chainId ? chainConfig["chainIds"][chainId] : "Not Connected";
    const networkName = "binance";
    const CHESAddress = chainConfig["CHESV2TokenAddresses"][networkName] ? chainConfig["CHESV2TokenAddresses"][networkName] : constants.AddressZero;
    const CHESNFTAddress = chainConfig["CHESNFTAddresses"][networkName] ? chainConfig["CHESNFTAddresses"][networkName] : constants.AddressZero;
    const CHESMarketplaceAddress = chainConfig["CHESNFTMarketplaceAddresses"][networkName] ? chainConfig["CHESNFTMarketplaceAddresses"][networkName] : constants.AddressZero;

    const tokenBalance = useTokenBalance(CHESAddress, account);

    const chesABI = CHESToken.abi;
    const nftAbi = CHESNFT.abi;
    const marketplaceAbi = CHESMarketplace.abi;
    
    const chesInterface = new utils.Interface(chesABI);
    const chesContract = new Contract(CHESAddress, chesInterface);
    const nftInterface = new utils.Interface(nftAbi);
    const nftContract = new Contract(CHESNFTAddress, nftInterface);
    const marketplaceInterface = new utils.Interface(marketplaceAbi);
    const marketplaceContract = new Contract(CHESMarketplaceAddress, marketplaceInterface);

    const marketItems = useMarketItems(marketplaceContract, CHESMarketplaceAddress, marketplaceAbi);
    const [marketplaceNFTs, setMarketplaceNFTs] = useState([]);
    const [currBuyNFTId, setCurrBuyNFTId] = useState(-1);
    const [currApprovedNFTId, setCurrApprovedNFTId] = useState(-1);
    const [currNFT, setCurrNFT] = useState(-1);
    const [NFTsLoaded, setNFTsLoaded] = useState(false);
    const [approvingCHESTransfer, setApprovingCHESTransfer] = useState(-1);
    const [purchasingNFT, setPurchasingNFT] = useState(-1);
    const [showApprovalSuccess, setShowApprovalSuccess] = useState(false);
    const [showPurchaseSuccess, setShowPurchaseSuccess] = useState(false);
    const [showTransactionCancel, setShowTransactionCancel] = useState(false);
    const [showPendingTransaction, setShowPendingTransaction] = useState(false);
    const [errorText, setErrorText] = useState("");
    const [processingMessage, setProcessingMessage] = useState("");
    const [transactionHash, setTransactionHash] = useState("");

    const isConnected = account !== undefined;

    const { send: approveCHESTransfer, state: approveCHESTransferState } =
        useContractFunction(chesContract, "approve", {
            transactionName: "Approve the CHES NFT marketplace to spend CHES tokens",
    })

    const { send: createMarketSale, state: createMarketSaleState } =
        useContractFunction(marketplaceContract, "createMarketSale", {
            transactionName: "Purchase a Chain Estate DAO NFT on the Marketplace",
    })

    async function updateMarketplaceNFTs(marketItemsResult) {
        console.log("Updating marketplace NFTs.");
        let marketplaceNFTArray = [];

        const provider = new ethers.providers.JsonRpcProvider(rpcEndpoint, { name: network, chainId: binanceChainId });
        const nftContractReadOnly = new ethers.Contract(CHESNFTAddress, nftAbi, provider);

        for(let i = 0; i < marketItemsResult.length; i++) {
            const currTokenId = marketItemsResult[i].tokenId;
            const currTokenURI = await nftContractReadOnly.tokenURI(currTokenId);
            const metaData = await axios.get(currTokenURI);
            const price = (+ethers.utils.formatEther(BigInt(marketItemsResult[i].price._hex).toString(10))).toFixed(1).toString();
            const priceUnrounded = (+ethers.utils.formatEther(BigInt(marketItemsResult[i].price._hex).toString(10))).toString();
            const itemId = BigInt(marketItemsResult[i].itemId._hex).toString(10);
            marketplaceNFTArray.push(Object.assign({}, metaData.data, {price: price, priceUnrounded: priceUnrounded, itemId: itemId}));
        }

        setMarketplaceNFTs(JSON.parse(JSON.stringify(marketplaceNFTArray)));
        setNFTsLoaded(true);
    }

    useEffect(() => {
        marketItems.then(marketItemsResult => {
            if (marketItemsResult && marketplaceNFTs.length !== marketItemsResult.length) {
                updateMarketplaceNFTs(marketItemsResult);
            }
            else if (isConnected && marketplaceNFTs.length == 0) {
                setNFTsLoaded(true);
            }
        });
    }, [marketItems])

    async function startNFTPurchase(marketItemId, NFTPrice) {
        const price = ethers.utils.parseUnits(NFTPrice, 'ether');
        approveCHESTransfer(CHESMarketplaceAddress, price);
        setCurrBuyNFTId(marketItemId);
        setApprovingCHESTransfer(marketItemId);
    }

    useEffect(() => {
        console.log(approveCHESTransferState);
        if (approveCHESTransferState.status === "Success") {
            setCurrApprovedNFTId(currBuyNFTId);
            setApprovingCHESTransfer(-1);
            setShowApprovalSuccess(true);
            setShowTransactionCancel(false);
            setShowPendingTransaction(false);
        }
        else if (approveCHESTransferState.status === "Exception") {
            setCurrApprovedNFTId(-1);
            setCurrBuyNFTId(-1);
            setApprovingCHESTransfer(-1);
            setShowTransactionCancel(true);
            setShowApprovalSuccess(false);
            setShowPurchaseSuccess(false);
            setShowPendingTransaction(false);
            setErrorText(approveCHESTransferState.errorMessage);
        }
        else if (approveCHESTransferState.status === "Mining") {
            setShowPendingTransaction(true);
            setCurrApprovedNFTId(-1);
            setProcessingMessage("Approving CHES Token Transfer.")
            setTransactionHash(approveCHESTransferState.transaction.hash);
        }
        else {
            setCurrApprovedNFTId(-1);
        }
    }, [approveCHESTransferState])

    async function finishNFTPurchase(marketItemId, itemPrice) {
        const price = BigInt(ethers.utils.parseUnits(itemPrice, 'ether')._hex).toString(10);
        createMarketSale(CHESNFTAddress, marketItemId, price);
        setCurrBuyNFTId(marketItemId);
        setPurchasingNFT(marketItemId);
    }

    useEffect(() => {
        console.log(createMarketSaleState);
        if (createMarketSaleState.status === "Success") {
            setPurchasingNFT(-1);
            setCurrBuyNFTId(-1);
            setShowPurchaseSuccess(true);
            setShowTransactionCancel(false);
            setShowPendingTransaction(false);
        }
        else if (createMarketSaleState.status === "Exception") {
            setCurrBuyNFTId(-1);
            setPurchasingNFT(-1);
            setShowTransactionCancel(true);
            setShowPurchaseSuccess(false);
            setShowApprovalSuccess(false);
            setShowPendingTransaction(false);
            setErrorText(createMarketSaleState.errorMessage);
        }
        else if (createMarketSaleState.status === "Mining") {
            setShowPendingTransaction(true);
            setProcessingMessage("Purchasing NFT.")
            setTransactionHash(createMarketSaleState.transaction.hash);
        }
    }, [createMarketSaleState])

    return (
        <Grid container justifyContent="center" className={styles.mainGrid}>
            <Grid item xs={3} className={styles.spacingGrid}></Grid>
            <Grid item xs={5} className={styles.headerGrid}>
                <Typography variant="h4" className={clsx(styles.header, props.useDarkTheme ? styles.darkHeader : styles.lightHeader)}>
                    Chain Estate DAO NFT Marketplace
                </Typography>
            </Grid>
            <Grid item xs={3} className={styles.spacingGrid}></Grid>
            
            <Grid container justifyContent="center" spacing={4} className={styles.marketplaceFunctionGrid}>
                <Snackbar open={showApprovalSuccess} autoHideDuration={6000} onClose={() => {setShowApprovalSuccess(false)}}>
                    <MuiAlert elevation={6} variant="filled" onClose={() => {setShowApprovalSuccess(false)}} severity="success" sx={{ width: '100%' }} >
                        Approval Succeeded! Click &quot;Purchase&quot; to Finalize Your NFT Purchase.
                    </MuiAlert>
                </Snackbar>
                <Snackbar open={showPurchaseSuccess} autoHideDuration={6000} onClose={() => {setShowPurchaseSuccess(false)}}>
                    <MuiAlert elevation={6} variant="filled" onClose={() => {setShowPurchaseSuccess(false)}} severity="success" sx={{ width: '100%' }} >
                        Purchase Succeeded! Transaction hash: <a className={styles.transactionHashLink} href={`https://bscscan.com/tx/${transactionHash}`} target="_blank" rel="noreferrer" >{transactionHash}</a>
                    </MuiAlert>
                </Snackbar>
                <Snackbar open={showTransactionCancel} autoHideDuration={6000} onClose={() => {setShowTransactionCancel(false)}}>
                    <MuiAlert elevation={6} variant="filled" onClose={() => {setShowTransactionCancel(false)}} severity="error" sx={{ width: '100%' }} >
                        Transaction Canceled: {errorText}
                    </MuiAlert>
                </Snackbar>
                <Snackbar open={showPendingTransaction} autoHideDuration={20000} onClose={() => {setShowPendingTransaction(false)}}>
                    <MuiAlert elevation={6} variant="filled" onClose={() => {setShowPendingTransaction(false)}} severity="info" sx={{ width: '100%' }} >
                        {processingMessage} Transaction hash: <a className={styles.transactionHashLink} href={`https://bscscan.com/tx/${transactionHash}`} target="_blank" rel="noreferrer" >{transactionHash}</a>
                    </MuiAlert>
                </Snackbar>
                {
                    marketplaceNFTs.length == 0 && NFTsLoaded && (
                        <Grid item xs={10} className="text-center">
                            <Typography variant="h5" component="div">
                                NFTs will appear here as they are loaded or added to the marketplace...
                            </Typography>
                        </Grid>
                    )
                }
                {
                    marketplaceNFTs.length == 0 && !NFTsLoaded && (
                        <Grid item xs={10} className="text-center mt-5">
                            <CircularProgress size={80} color="secondary" className={styles.loadingAirdropContent} />
                        </Grid>
                    )
                }
                {
                    marketplaceNFTs.length > 0 && (
                        <Grid item xs={10}>
                            <Grid container justifyContent="center" alignItems="center" spacing={4}>
                                {
                                    marketplaceNFTs && (marketplaceNFTs.map((nft, i) => (
                                        <Grid key={i} item xs={12} sm={6} md={4} lg={3} className={styles.NFTGrid}>
                                            <div key={i} className={clsx(styles.cardDiv, "rounded-xl overflow-hidden")} onMouseEnter={() => setCurrNFT(nft.itemId)} onMouseLeave={() => setCurrNFT(-1)}>
                                                <img src={nft.image} className={clsx(styles.NFTImage)} />
                                                <Grid container justifyContent="center" alignItems="center" className={clsx(props.useDarkTheme ? styles.NFTTextDark : styles.NFTTextLight, "p-4")}>
                                                    <Grid item xs={8} className={styles.nftNameAndDesc}>
                                                        <Typography variant="p" component="div" className={clsx(styles.NFTName, "text-2xl font-bold")}>
                                                            {nft.NFTName}
                                                        </Typography>
                                                        {
                                                            currNFT != nft.itemId && currBuyNFTId != nft.itemId && (
                                                                <Typography variant="p" component="div" className={clsx(styles.NFTDescription, "font-bold mt-3")}>
                                                                    {nft.NFTDescription}
                                                                </Typography>
                                                            )
                                                        }
                                                        {
                                                            (currNFT == nft.itemId || currBuyNFTId == nft.itemId) && currApprovedNFTId != nft.itemId && !isConnected && (
                                                                <Typography variant="h5" component="div" className={clsx(styles.NFTDescription, "font-bold mt-3")}>
                                                                    Connect Wallet to Purchase
                                                                </Typography>
                                                            )
                                                        }
                                                        {
                                                            (currNFT == nft.itemId || currBuyNFTId == nft.itemId) && currApprovedNFTId != nft.itemId && isConnected && (
                                                                <Button size="small" variant="contained" color="primary" onClick={() => startNFTPurchase(nft.itemId, nft.priceUnrounded)}
                                                                    className={clsx(styles.buyNFTButton, props.useDarkTheme ? styles.btnDark : styles.btnLight)} disabled={approvingCHESTransfer !== -1}>
                                                                    {approvingCHESTransfer == nft.itemId && <CircularProgress size={18} color="secondary"/>} 
                                                                    {approvingCHESTransfer == nft.itemId ? <>&nbsp; Approving</> : "Buy Now"}
                                                                </Button>
                                                            )
                                                        }
                                                        {
                                                            (currNFT == nft.itemId || currBuyNFTId == nft.itemId) && currApprovedNFTId == nft.itemId && (
                                                                <Button size="small" variant="contained" color="primary" onClick={() => finishNFTPurchase(nft.itemId, nft.priceUnrounded)}
                                                                    className={clsx(styles.buyNFTButton, props.useDarkTheme ? styles.btnDark : styles.btnLight)} disabled={purchasingNFT !== -1}>
                                                                    {purchasingNFT == nft.itemId && <CircularProgress size={18} color="secondary"/>} 
                                                                    {purchasingNFT == nft.itemId ? <>&nbsp; Buying</> : "Purchase"}
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
    )
}