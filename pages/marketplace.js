import { Grid, Typography, Button, Card, CardContent, CardActions, TextField, Input } from '@mui/material';
import clsx from 'clsx';
import axios from 'axios';
import { useState, useEffect } from "react";
import { useEthers, useTokenBalance, useContractFunction, useCall } from "@usedapp/core";
import { constants, utils, ethers } from "ethers";
import { Contract } from "@ethersproject/contracts";
import { create as ipfsHttpClient } from 'ipfs-http-client';
import Web3Modal from 'web3modal';
import { Modal } from "react-bootstrap";

import styles from '../styles/marketplace.module.css';
import CHESNFT from "../contracts/ChainEstateNFT.json";
import CHESMarketplace from "../contracts/ChainEstateMarketplace.json";
import chainConfig from "../chain-config.json";

const client = ipfsHttpClient('https://ipfs.infura.io:5001/api/v0');

function useMarketplaceNFTs(
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

export default function marketplace(props) {
    const { account, chainId } = useEthers();
    const networkName = chainId ? chainConfig["chainIds"][chainId] : "Not Connected";
    const CHESAddress = chainId ? chainConfig["CHESTokenAddresses"][networkName] : constants.AddressZero;
    const CHESNFTAddress = chainId ? chainConfig["CHESNFTAddresses"][networkName] : constants.AddressZero;
    const CHESMarketplaceAddress = chainId ? chainConfig["CHESNFTMarketplaceAddresses"][networkName] : constants.AddressZero;

    const tokenBalance = useTokenBalance(CHESAddress, account);

    const nftAbi = CHESNFT.abi;
    const marketplaceAbi = CHESMarketplace.abi
    
    const nftInterface = new utils.Interface(nftAbi);
    const nftContract = new Contract(CHESNFTAddress, nftInterface);
    const marketplaceInterface = new utils.Interface(marketplaceAbi);
    const marketplaceContract = new Contract(CHESMarketplaceAddress, marketplaceInterface);

    const [fileUrl, setFileUrl] = useState("https://bafybeicsrjjqj6zoivajhmvjezuoa2oweldy2j5hvjd3vff5m4gf5bzdhu.ipfs.infura-ipfs.io/");
    const [inputError, setInputError] = useState("");
    const [NFTPrice, setNFTPrice] = useState(0.0);
    const [NFTName, setNFTName] = useState("");
    const [NFTDescription, setNFTDescription] = useState("");
    const [propertyId, setPropertyId] = useState(0);
    const [userNFTs, setUserNFTs] = useState([]);
    const [showListNFTModal, setShowListNFTModal] = useState(false);
    const [currNFT, setCurrNFT] = useState({});
    const marketplaceNFTs = useMarketplaceNFTs(marketplaceContract);

    const isConnected = account !== undefined;

    const { send: createNFT, state: createNFTState } =
        useContractFunction(nftContract, "createToken", {
            transactionName: "Mint a Chain Estate DAO NFT",
    })

    const { send: createMarketItem, state: createMarketItemState } =
        useContractFunction(marketplaceContract, "createMarketItem", {
            transactionName: "List a Chain Estate DAO NFT on the Marketplace",
    })

    const { send: createMarketSale, state: createMarketSaleState } =
        useContractFunction(marketplaceContract, "createMarketSale", {
            transactionName: "Purchase a Chain Estate DAO NFT on the Marketplace",
    })

    useEffect(() => {
        console.log(marketplaceNFTs);
    }, [marketplaceNFTs])

    async function onFileChange(e) {
        const file = e.target.files[0];
        try {
          const added = await client.add(
            file,
            {
              progress: (prog) => console.log(`received: ${prog}`)
            }
          )
          const url = `https://ipfs.infura.io/ipfs/${added.path}`;
          setFileUrl(url);
        } catch (error) {
          console.log('Error uploading file: ', error);
        }  
      }
  
      async function uploadToIPFS() {
        if (!NFTName || !NFTDescription || !NFTPrice || !fileUrl) return
        /* first, upload to IPFS */
        const data = JSON.stringify({
            NFTName, NFTDescription, image: fileUrl
        });
        try {
          const added = await client.add(data);
          const url = `https://ipfs.infura.io/ipfs/${added.path}`;
          /* after file is uploaded to IPFS, return the URL to use it in the transaction */
          return url;
        } catch (error) {
          console.log('Error uploading file: ', error);
        }  
      }

    async function createCHESNFT() {
        test();
        if (propertyId >= 0 && NFTPrice > 0 && NFTName != "" && NFTDescription != "") {
            const url = await uploadToIPFS();
            createNFT(url, propertyId);
        }
    }

    function startNFTListing(nft) {
        setCurrNFT(nft);
        setShowListNFTModal(true);
    }
    
    async function listNFTForSale(tokenId) {
        if (NFTPrice > 0.0) {
            const web3Modal = new Web3Modal({
                network: "rinkeby",
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
            network: "rinkeby",
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
        <Grid container justifyContent="center" className={styles.mainGrid}>
            <Grid item xs={4} className={styles.spacingGrid}></Grid>
            <Grid item xs={4} className={styles.headerGrid}>
                <Typography variant="h4" className={clsx(styles.header, props.useDarkTheme ? styles.darkHeader : styles.lightHeader)}>
                    CHES NFT Marketplace
                </Typography>
            </Grid>
            <Grid item xs={4} className={styles.spacingGrid}></Grid>
            <Grid item xs={3} className={styles.spacingGrid}></Grid>
            <Grid item xs={6} className={styles.connectGrid}>
                <Card className={clsx(styles.customCard, props.useDarkTheme ? styles.customCardDark : styles.customCardLight)}>
                    <div>
                    <CardContent className={styles.cardContentDiv}>
                        <Grid container justifyContent="center">
                            <Grid item xs={12}>
                                <Typography variant="h5" component="div">
                                    Create a CHES NFT
                                </Typography>
                            </Grid>
                            <Grid item xs={4}>
                                <TextField error={inputError != ""} label="NFT Name" helperText={inputError}
                                    value={NFTName} onChange={(e) => {setNFTName(e.target.value)}} className={styles.CHESPurchaseInput} />
                            </Grid>
                            <Grid item xs={4}>
                                <TextField error={inputError != ""} label="Price in CHES" helperText={inputError}
                                    value={NFTPrice} onChange={updateNFTPrice} className={styles.CHESPurchaseInput} />
                            </Grid>
                            <Grid item xs={4}>
                                <TextField error={inputError != ""} label="Property ID" helperText={inputError}
                                    value={propertyId} onChange={(e) => {setPropertyId(e.target.value)}} className={styles.CHESPurchaseInput} />
                            </Grid>
                            <Grid item xs={8}>
                                <TextField fullWidth error={inputError != ""} label="NFT Description" helperText={inputError}
                                    value={NFTDescription} onChange={(e) => {setNFTDescription(e.target.value)}} className={styles.CHESPurchaseInput} />
                            </Grid>
                            <Grid item xs={8}>
                                <label htmlFor="contained-button-file">
                                    <Input accept="image/*" id="contained-button-file" onChange={onFileChange} className={styles.fileInput} type="file" />
                                    <Button variant="contained" component="span">
                                        Upload
                                    </Button>
                                </label>
                            </Grid>
                            <Grid item xs={8}>
                                {
                                fileUrl && (
                                    <img className="rounded mt-4" width="250" src={fileUrl} />
                                )
                                }
                            </Grid>
                        </Grid>
                    </CardContent>
                    <CardActions>
                        <Button size="small" variant="contained" color="primary" onClick={createCHESNFT}
                            className={clsx(styles.cardBtn, props.useDarkTheme ? styles.btnDark : styles.btnLight)}>
                            Create NFT
                        </Button>
                    </CardActions>
                    </div>
                </Card>
            </Grid>
            <Grid item xs={3} className={styles.spacingGrid}></Grid>
        </Grid>

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
                <Button size="small" variant="contained" color="primary" onClick={() => listNFTForSale(currNFT.tokenId)}
                    className={clsx(styles.listNFTBtn, props.useDarkTheme ? styles.btnDark : styles.btnLight)}>
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

        <Grid container justifyContent="center" alignItems="center" className="mt-5" spacing={4}>
            <Grid item xs={12}>
                <Typography variant="h5" component="div" className="text-center">
                    Marketplace NFTs
                </Typography>
            </Grid>
            <Grid item xs={10}>
                <Grid container justifyContent="center" alignItems="center" spacing={4}>
                    {
                        marketplaceNFTs && (marketplaceNFTs.map((nft, i) => (
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
                                <Button size="small" variant="contained" color="primary" onClick={() => {}}
                                    className={clsx(styles.listNFTBtn, props.useDarkTheme ? styles.btnDark : styles.btnLight)}>
                                    Purchase NFT
                                </Button>
                            </Grid>
                        )))
                    }
                </Grid>
            </Grid>
        </Grid>
        </>
    )
}