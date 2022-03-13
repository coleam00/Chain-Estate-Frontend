import { Grid, Typography, Button, CircularProgress } from '@mui/material';
import Snackbar from '@mui/material/Snackbar';
import MuiAlert from '@mui/material/Alert';
import clsx from 'clsx';
import axios from 'axios';
import { useState, useEffect } from "react";
import { useEthers, useTokenBalance, useContractFunction, useCall } from "@usedapp/core";
import { constants, utils, ethers } from "ethers";
import { Contract } from "@ethersproject/contracts";
import Web3Modal from 'web3modal';
import { ImPriceTag } from 'react-icons/im';

import styles from '../styles/marketplace.module.css';
import CHESToken from "../contracts/ChainEstateToken.json";
import CHESNFT from "../contracts/ChainEstateNFT.json";
import CHESMarketplace from "../contracts/ChainEstateMarketplace.json";
import chainConfig from "../chain-config.json";

const network = "rinkeby";

async function useMarketItems(
    marketplaceContract
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
    return value?.[0]
  }

export default function ViewMarketplaceNFTs(props) {
    const { account, chainId } = useEthers();
    const networkName = chainId ? chainConfig["chainIds"][chainId] : "Not Connected";
    const CHESAddress = chainId ? chainConfig["CHESTokenAddresses"][networkName] : constants.AddressZero;
    const CHESNFTAddress = chainId ? chainConfig["CHESNFTAddresses"][networkName] : constants.AddressZero;
    const CHESMarketplaceAddress = chainId ? chainConfig["CHESNFTMarketplaceAddresses"][networkName] : constants.AddressZero;

    const tokenBalance = useTokenBalance(CHESAddress, account);

    const chesABI = CHESToken.abi;
    const nftAbi = CHESNFT.abi;
    const marketplaceAbi = CHESMarketplace.abi
    
    const chesInterface = new utils.Interface(chesABI);
    const chesContract = new Contract(CHESAddress, chesInterface);
    const nftInterface = new utils.Interface(nftAbi);
    const nftContract = new Contract(CHESNFTAddress, nftInterface);
    const marketplaceInterface = new utils.Interface(marketplaceAbi);
    const marketplaceContract = new Contract(CHESMarketplaceAddress, marketplaceInterface);

    const marketItems = useMarketItems(marketplaceContract);
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

        const web3Modal = new Web3Modal({
            network: network,
            cacheProvider: true,
          })
        const connection = await web3Modal.connect();
        const provider = new ethers.providers.Web3Provider(connection);
        const nftContractReadOnly = new ethers.Contract(CHESNFTAddress, nftAbi, provider);

        for(let i = 0; i < marketItemsResult.length; i++) {
            const currTokenId = marketItemsResult[i].tokenId;
            const currTokenURI = await nftContractReadOnly.tokenURI(currTokenId);
            const metaData = await axios.get(currTokenURI);
            const price = ethers.utils.formatEther(BigInt(marketItemsResult[i].price._hex).toString(10));
            const itemId = BigInt(marketItemsResult[i].itemId._hex).toString(10);
            marketplaceNFTArray.push(Object.assign({}, metaData.data, {price: price, itemId: itemId}));
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
        }
        else if (approveCHESTransferState.status === "Exception") {
            setCurrApprovedNFTId(-1);
            setCurrBuyNFTId(-1);
            setApprovingCHESTransfer(-1);
            setShowTransactionCancel(true);
            setShowApprovalSuccess(false);
            setShowPurchaseSuccess(false);
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
        }
        else if (createMarketSaleState.status === "Exception") {
            setCurrBuyNFTId(-1);
            setPurchasingNFT(-1);
            setShowTransactionCancel(true);
            setShowPurchaseSuccess(false);
            setShowApprovalSuccess(false);
        }
    }, [createMarketSaleState])

    return (
        <Grid container justifyContent="center" spacing={4} className={styles.marketplaceFunctionGrid}>
            <Snackbar open={showApprovalSuccess} autoHideDuration={6000} onClose={() => {setShowApprovalSuccess(false)}}>
                <MuiAlert elevation={6} variant="filled" onClose={() => {setShowApprovalSuccess(false)}} severity="success" sx={{ width: '100%' }} >
                    Approval Succeeded! Click "Purchase" to Finalize Your NFT Purchase.
                </MuiAlert>
            </Snackbar>
            <Snackbar open={showPurchaseSuccess} autoHideDuration={6000} onClose={() => {setShowPurchaseSuccess(false)}}>
                <MuiAlert elevation={6} variant="filled" onClose={() => {setShowPurchaseSuccess(false)}} severity="success" sx={{ width: '100%' }} >
                    Purchase Succeeded!
                </MuiAlert>
            </Snackbar>
            <Snackbar open={showTransactionCancel} autoHideDuration={6000} onClose={() => {setShowTransactionCancel(false)}}>
                <MuiAlert elevation={6} variant="filled" onClose={() => {setShowTransactionCancel(false)}} severity="error" sx={{ width: '100%' }} >
                    Transaction Canceled
                </MuiAlert>
            </Snackbar>
            {
                !isConnected && (
                    <Grid item xs={10} className="text-center">
                        <Typography variant="h5" component="div">
                            Connect Your Wallet in the Navigation Menu to View the Marketplace
                        </Typography>
                    </Grid>
                )
            }
            {
                isConnected && marketplaceNFTs.length == 0 && NFTsLoaded && (
                    <Grid item xs={10} className="text-center">
                        <Typography variant="h5" component="div">
                            NFTs will appear here as they are loaded or added to the marketplace...
                        </Typography>
                    </Grid>
                )
            }
            {
                isConnected && marketplaceNFTs.length > 0 && (
                    <Grid item xs={10}>
                        <Grid container justifyContent="center" alignItems="center" spacing={4}>
                            {
                                marketplaceNFTs && (marketplaceNFTs.map((nft, i) => (
                                    <Grid key={i} item xs={3} className={styles.NFTGrid}>
                                        <div key={i} className={clsx(styles.cardDiv, "rounded-xl overflow-hidden")} onMouseEnter={() => setCurrNFT(nft.itemId)} onMouseLeave={() => setCurrNFT(-1)}>
                                            <img src={nft.image} className={clsx(styles.NFTImage)} />
                                            <Grid container justifyContent="center" alignItems="center" className={clsx(props.useDarkTheme ? styles.NFTTextDark : styles.NFTTextLight, "p-4")}>
                                                <Grid item xs={7} className={styles.nftNameAndDesc}>
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
                                                        (currNFT == nft.itemId || currBuyNFTId == nft.itemId) && currApprovedNFTId != nft.itemId && (
                                                            <Button size="small" variant="contained" color="primary" onClick={() => startNFTPurchase(nft.itemId, nft.price)}
                                                                className={clsx(styles.listNFTBtn, props.useDarkTheme ? styles.btnDark : styles.btnLight)} disabled={approvingCHESTransfer !== -1}>
                                                                {approvingCHESTransfer == nft.itemId && <CircularProgress size={18} color="secondary"/>} 
                                                                {approvingCHESTransfer == nft.itemId ? <>&nbsp; Approving</> : "Buy Now"}
                                                            </Button>
                                                        )
                                                    }
                                                    {
                                                        (currNFT == nft.itemId || currBuyNFTId == nft.itemId) && currApprovedNFTId == nft.itemId && (
                                                            <Button size="small" variant="contained" color="primary" onClick={() => finishNFTPurchase(nft.itemId, nft.price)}
                                                                className={clsx(styles.listNFTBtn, props.useDarkTheme ? styles.btnDark : styles.btnLight)} disabled={purchasingNFT !== -1}>
                                                                {purchasingNFT == nft.itemId && <CircularProgress size={18} color="secondary"/>} 
                                                                {purchasingNFT == nft.itemId ? <>&nbsp; Purchasing</> : "Purchase"}
                                                            </Button>
                                                        )
                                                    }
                                                </Grid>
                                                <Grid item xs={5} className={styles.nftPrice}>
                                                    <Typography variant="p" component="div" className={clsx(styles.NFTPrice, "font-bold")}>
                                                        <ImPriceTag /> Price
                                                    </Typography>
                                                    <Typography variant="p" component="div" className={clsx(styles.NFTPrice, "font-bold mt-3")}>
                                                        {nft.price} CHES
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
    )
}